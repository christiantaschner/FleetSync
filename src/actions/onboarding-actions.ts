
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/types';
import { addDays } from 'date-fns';
import { stripe } from '@/lib/stripe';
import type { Company } from '@/types';
import * as admin from 'firebase-admin';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';
import { PREDEFINED_PARTS } from '@/lib/parts';

export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
  appId: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    if (!authAdmin) throw new Error("Firebase Auth Admin SDK has not been initialized. Check server logs for details.");
    if (!stripe) throw new Error('Stripe not initialized.');
    if (!appId) throw new Error("App ID is required.");

    const validatedInput = CompleteOnboardingInputSchema.parse(input);
    
    const { companyName, uid, numberOfTechnicians, companySpecialties, otherSpecialty } = validatedInput;
    const companyId = uid; // The first user's UID becomes the company ID

    const batch = dbAdmin.batch();

    // 1. Create a Stripe Customer first
    const userDocRef = dbAdmin.collection('users').doc(uid);
    const userSnap = await userDocRef.get();
    if (!userSnap.exists) {
        throw new Error('User document does not exist.');
    }
    const userEmail = userSnap.data()?.email;
    if (!userEmail) {
        throw new Error('User email is missing.');
    }
    
    const customer = await stripe.customers.create({
        email: userEmail,
        name: companyName,
        metadata: {
          companyId: companyId,
          firebaseUID: uid,
        },
    });
    const stripeCustomerId = customer.id;
    
    // 2. Prepare Firestore documents
    // Process specialties: replace 'Other' with the custom value if provided.
    const finalSpecialties = [...companySpecialties];
    if (otherSpecialty && otherSpecialty.trim()) {
        const otherIndex = finalSpecialties.indexOf('Other');
        if (otherIndex > -1) {
            finalSpecialties.splice(otherIndex, 1, otherSpecialty.trim());
        }
    }


    const companyRef = dbAdmin.collection('companies').doc(companyId);
    const trialEndsAt = addDays(new Date(), 30);

    const companyData: Partial<Company> & { createdAt: any; settings?: any } = {
        name: companyName,
        ownerId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        subscriptionStatus: 'trialing',
        trialEndsAt: trialEndsAt.toISOString(),
        stripeCustomerId: stripeCustomerId,
        settings: {
            companySpecialties: finalSpecialties,
        }
    };

    batch.set(companyRef, companyData);
    
    batch.update(userDocRef, {
      companyId: companyId,
      role: 'admin',
      onboardingStatus: 'completed',
    });
    
    const skillsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/skills`);
    const skillsToSeed = new Set<string>();
    finalSpecialties.forEach(specialty => {
        const skillsForSpecialty = SKILLS_BY_SPECIALTY[specialty];
        if (skillsForSpecialty) {
            skillsForSpecialty.forEach(skill => skillsToSeed.add(skill));
        } else {
            // If it's a custom specialty, add the specialty itself as a skill
            skillsToSeed.add(specialty);
        }
    });

    skillsToSeed.forEach(skillName => {
        const newSkillRef = skillsCollectionRef.doc();
        batch.set(newSkillRef, { name: skillName, companyId: companyId });
    });
    
    const partsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/parts`);
    PREDEFINED_PARTS.forEach(partName => {
        const newPartRef = partsCollectionRef.doc();
        batch.set(newPartRef, { name: partName, companyId: companyId });
    });
    
    // 3. Commit all Firestore operations atomically
    await batch.commit();

    // 4. Set Custom Auth Claims for the new admin
    try {
      if (!authAdmin) throw new Error('Auth Admin SDK not initialized.');
      await authAdmin.setCustomUserClaims(uid, {
        companyId: companyId,
        role: 'admin',
      });
      console.log(JSON.stringify({
          message: `Custom claims set for new company admin: ${uid}`,
          severity: "INFO"
      }));
    } catch(claimError: any) {
        console.error(JSON.stringify({
            message: "Critical Error: Failed to set custom claims for new admin.",
            error: {
                message: claimError.message,
                stack: claimError.stack,
            },
            severity: "ERROR"
        }));
        return { sessionId: null, error: `Your company was created, but there was an error setting your permissions. Please contact support.` };
    }
    
    // 5. Create the Stripe Checkout Session with a trial
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) throw new Error('Stripe Price ID is not configured.');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');

    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{
            price: priceId,
            quantity: numberOfTechnicians,
        }],
        subscription_data: {
            trial_end: Math.floor(trialEndsAt.getTime() / 1000), // Stripe needs Unix timestamp in seconds
        },
        success_url: `${appUrl}/dashboard?onboarding_success=true`,
        cancel_url: `${appUrl}/onboarding`,
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
    return { sessionId: null, error: `Failed to complete onboarding. ${errorMessage}` };
  }
}
