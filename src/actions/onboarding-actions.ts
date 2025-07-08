
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/types';
import { addDays } from 'date-fns';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';
import * as admin from 'firebase-admin';

export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
  appId: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  try {
    if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized. Check server logs for details.");

    const validatedInput = CompleteOnboardingInputSchema.parse(input);
    const { uid, companyName, numberOfTechnicians, companySpecialties, otherSpecialty } = validatedInput;

    const userDocRef = dbAdmin.collection('users').doc(uid);
    const companyCollectionRef = dbAdmin.collection('companies');

    // Create a Stripe Customer
    const customer = await stripe.customers.create({
      email: (await authAdmin.getUser(uid)).email,
      name: companyName,
      metadata: {
        firebaseUID: uid,
      },
    });

    const batch = dbAdmin.batch();

    // 1. Create the Company Document
    const newCompanyRef = companyCollectionRef.doc();
    batch.set(newCompanyRef, {
        name: companyName,
        ownerId: uid,
        stripeCustomerId: customer.id,
        subscriptionStatus: 'trialing',
        trialEndsAt: addDays(new Date(), 30).toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        settings: {
            companySpecialties: companySpecialties.includes("Other") && otherSpecialty ? [...companySpecialties.filter(s => s !== "Other"), otherSpecialty] : companySpecialties,
        }
    });
    
    // Update Stripe Customer metadata with the new company ID
    await stripe.customers.update(customer.id, {
        metadata: {
            firebaseUID: uid,
            companyId: newCompanyRef.id,
        },
    });

    // 2. Update the User's Document
    batch.update(userDocRef, {
        companyId: newCompanyRef.id,
        role: 'admin',
        onboardingStatus: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Seed initial skills based on company specialties
    const skillsToSeed: string[] = [];
    const finalSpecialties = companySpecialties.includes("Other") && otherSpecialty ? [...companySpecialties.filter(s => s !== "Other"), otherSpecialty] : companySpecialties;
    finalSpecialties.forEach(specialty => {
        if (SKILLS_BY_SPECIALTY[specialty]) {
            skillsToSeed.push(...SKILLS_BY_SPECIALTY[specialty]);
        }
    });

    if (skillsToSeed.length > 0) {
        const skillsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/skills`);
        const uniqueSkills = [...new Set(skillsToSeed)];
        uniqueSkills.forEach(skillName => {
            const newSkillRef = skillsCollectionRef.doc();
            batch.set(newSkillRef, { name: skillName, companyId: newCompanyRef.id });
        });
    }

    // 4. Set Custom Claims for the user
    await authAdmin.setCustomUserClaims(uid, {
        companyId: newCompanyRef.id,
        role: 'admin',
    });

    // Commit all database changes
    await batch.commit();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) throw new Error('NEXT_PUBLIC_STRIPE_PRICE_ID is not set.');

    // 5. Create Stripe Checkout session for the trial
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id,
      line_items: [{
          price: priceId,
          quantity: numberOfTechnicians,
      }],
      subscription_data: {
        trial_period_days: 30,
      },
      success_url: `${appUrl}/dashboard?onboarding=success`,
      cancel_url: `${appUrl}/onboarding?step=2`,
    });

    if (!checkoutSession.id) {
        throw new Error('Could not create Stripe Checkout Session.');
    }

    return { sessionId: checkoutSession.id, error: null };

  } catch (e) {
    if (e instanceof z.ZodError) {
      return { sessionId: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in completeOnboardingAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    
    return { 
        sessionId: null, 
        error: `Onboarding failed. ${errorMessage}` 
    };
  }
}
