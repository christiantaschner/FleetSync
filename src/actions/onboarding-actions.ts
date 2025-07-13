
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/types';
import { addDays, addHours } from 'date-fns';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';
import * as admin from 'firebase-admin';
import { collection, writeBatch, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';

export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
  appId: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  console.log(JSON.stringify({ 
    message: "Starting completeOnboardingAction", 
    severity: "INFO",
    uid: input.uid,
    appId: appId,
  }));

  try {
    if (!dbAdmin || !authAdmin) {
      console.error(JSON.stringify({ 
        message: "CRITICAL: Firebase Admin SDK has not been initialized. Check server startup logs.", 
        severity: "CRITICAL"
      }));
      throw new Error("Firebase Admin SDK has not been initialized. Check server logs for details.");
    }

    const validatedInput = CompleteOnboardingInputSchema.parse(input);
    const { uid, companyName, numberOfTechnicians, companySpecialties, otherSpecialty } = validatedInput;
    console.log(JSON.stringify({ message: "Input validated successfully", severity: "INFO" }));

    const userDocRef = dbAdmin.collection('users').doc(uid);
    const companyCollectionRef = dbAdmin.collection('companies');

    // Create a Stripe Customer
    console.log(JSON.stringify({ message: "Attempting to create Stripe customer...", severity: "INFO" }));
    const userEmail = (await authAdmin.getUser(uid)).email;
    if (!userEmail) throw new Error("User email not found.");
    
    const customer = await stripe.customers.create({
      email: userEmail,
      name: companyName,
      metadata: {
        firebaseUID: uid,
      },
    });
    console.log(JSON.stringify({ message: "Stripe customer created successfully", stripeCustomerId: customer.id, severity: "INFO" }));


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
    console.log(JSON.stringify({ message: "Company document prepared for batch write", companyId: newCompanyRef.id, severity: "INFO" }));
    
    // Update Stripe Customer metadata with the new company ID
    await stripe.customers.update(customer.id, {
        metadata: {
            firebaseUID: uid,
            companyId: newCompanyRef.id,
        },
    });
    console.log(JSON.stringify({ message: "Stripe customer metadata updated", severity: "INFO" }));

    // 2. Update the User's Document
    batch.update(userDocRef, {
        companyId: newCompanyRef.id,
        role: 'admin',
        onboardingStatus: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(JSON.stringify({ message: "User document prepared for batch update", severity: "INFO" }));

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
        console.log(JSON.stringify({ message: `${uniqueSkills.length} skills prepared for batch seeding`, severity: "INFO" }));
    }

    // 4. Set Custom Claims for the user
    await authAdmin.setCustomUserClaims(uid, {
        companyId: newCompanyRef.id,
        role: 'admin',
    });
    console.log(JSON.stringify({ message: "Custom claims set successfully", severity: "INFO" }));

    // Commit all database changes
    await batch.commit();
    console.log(JSON.stringify({ message: "Firestore batch committed successfully", severity: "INFO" }));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) throw new Error('NEXT_PUBLIC_STRIPE_PRICE_ID is not set.');

    // 5. Create Stripe Checkout session for the trial
    console.log(JSON.stringify({ message: "Attempting to create Stripe Checkout session...", severity: "INFO" }));
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
    console.log(JSON.stringify({ message: "Stripe Checkout session created successfully", sessionId: checkoutSession.id, severity: "INFO" }));

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

const SeedDataInputSchema = z.object({
  companyId: z.string().min(1),
  appId: z.string().min(1),
});

export async function seedSampleDataAction(
  input: z.infer<typeof SeedDataInputSchema>
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
    const { companyId, appId } = SeedDataInputSchema.parse(input);

    const batch = writeBatch(dbAdmin);

    // 1. Seed Technicians
    const techsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`);
    mockTechnicians.forEach(tech => {
        const docRef = techsCollectionRef.doc(); // Let Firestore generate ID
        batch.set(docRef, { ...tech, id: docRef.id, companyId: companyId, isSampleData: true });
    });

    // 2. Seed Jobs
    const jobsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/jobs`);
    mockJobs.forEach(job => {
        const docRef = jobsCollectionRef.doc();
        batch.set(docRef, { ...job, id: docRef.id, companyId: companyId, isSampleData: true });
    });
    
    // 3. Seed Skills
    const skillsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/skills`);
    const allSkills = [...new Set(mockTechnicians.flatMap(t => t.skills || []))];
    allSkills.forEach(skillName => {
      const docRef = skillsCollectionRef.doc();
      batch.set(docRef, { name: skillName, companyId: companyId, isSampleData: true });
    });

    await batch.commit();
    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error seeding sample data',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: `Failed to seed data. ${errorMessage}` };
  }
}

export async function clearSampleDataAction(
  input: z.infer<typeof SeedDataInputSchema>
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
    const { companyId, appId } = SeedDataInputSchema.parse(input);
    const batch = writeBatch(dbAdmin);
    
    const collectionsToClear = ['technicians', 'jobs', 'skills'];

    for (const collectionName of collectionsToClear) {
      const collectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/${collectionName}`);
      const q = query(collectionRef, where("companyId", "==", companyId), where("isSampleData", "==", true));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
    return { error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error clearing sample data',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: `Failed to clear data. ${errorMessage}` };
  }
}
