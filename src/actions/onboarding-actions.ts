
'use server';

import { z } from 'zod';
import { dbAdmin as db, authAdmin } from '@/lib/firebase-admin';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';
import { PREDEFINED_PARTS } from '@/lib/parts';
import { CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/types';
import { addDays } from 'date-fns';
import { stripe } from '@/lib/stripe';
import type { Company } from '@/types';

export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
  appId: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  try {
    if (!db) {
        throw new Error('Firestore Admin SDK not initialized. Check server logs.');
    }
    if (!stripe) {
        throw new Error('Stripe not initialized.');
    }
    if (!appId) throw new Error("App ID is required.");

    const validatedInput = CompleteOnboardingInputSchema.parse(input);
    
    const { companyName, uid, numberOfTechnicians, companySpecialties } = validatedInput;
    const companyId = uid; // The first user's UID becomes the company ID

    const batch = writeBatch(db);

    // 1. Create a Stripe Customer first
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await doc(db, 'users', uid).get();
    if (!userSnap.exists()) {
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
    const companyRef = doc(db, 'companies', companyId);
    const trialEndsAt = addDays(new Date(), 30);

    batch.set(companyRef, {
      name: companyName,
      ownerId: uid,
      createdAt: serverTimestamp(),
      subscriptionStatus: 'trialing',
      trialEndsAt: trialEndsAt.toISOString(),
      stripeCustomerId: stripeCustomerId,
    });
    
    batch.update(userDocRef, {
      companyId: companyId,
      role: 'admin',
      onboardingStatus: 'completed',
    });
    
    const skillsCollectionRef = collection(db, `artifacts/${appId}/public/data/skills`);
    const skillsToSeed = new Set<string>();
    companySpecialties.forEach(specialty => {
        const skillsForSpecialty = SKILLS_BY_SPECIALTY[specialty];
        if (skillsForSpecialty) {
            skillsForSpecialty.forEach(skill => skillsToSeed.add(skill));
        }
    });

    skillsToSeed.forEach(skillName => {
        const newSkillRef = doc(skillsCollectionRef);
        batch.set(newSkillRef, { name: skillName, companyId: companyId });
    });
    
    const partsCollectionRef = collection(db, `artifacts/${appId}/public/data/parts`);
    PREDEFINED_PARTS.forEach(partName => {
        const newPartRef = doc(partsCollectionRef);
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
      console.log(`Custom claims set for new company admin: ${uid}`);
    } catch(claimError) {
        console.error("Critical Error: Failed to set custom claims for new admin.", claimError);
        // This is a critical failure. The user won't be able to access their company.
        // In a production app, you might want to roll back the Firestore changes or queue a retry.
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
    console.error('Error in completeOnboardingAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { sessionId: null, error: `Failed to complete onboarding. ${errorMessage}` };
  }
}
