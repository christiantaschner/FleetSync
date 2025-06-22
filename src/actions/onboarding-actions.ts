
'use server';

import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { PREDEFINED_PARTS } from '@/lib/parts';

export const CompleteOnboardingInputSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
});

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingInputSchema>;

export async function completeOnboardingAction(
  input: CompleteOnboardingInput
): Promise<{ error: string | null }> {
  try {
    const validatedInput = CompleteOnboardingInputSchema.parse(input);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('You must be logged in to complete onboarding.');
    }
    if (!db) {
        throw new Error('Firestore not initialized.');
    }

    const { companyName } = validatedInput;
    const companyId = currentUser.uid; // The first user's UID becomes the company ID

    const batch = writeBatch(db);

    // 1. Create the new company document
    const companyRef = doc(db, 'companies', companyId);
    batch.set(companyRef, {
      name: companyName,
      ownerId: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    // 2. Update the user's profile document
    const userRef = doc(db, 'users', currentUser.uid);
    batch.update(userRef, {
      companyId: companyId,
      role: 'admin', // Assign the 'admin' role to the creator
      onboardingStatus: 'completed',
    });

    // 3. Seed initial skills for the new company
    const skillsCollectionRef = collection(db, 'skills');
    PREDEFINED_SKILLS.forEach(skillName => {
        const newSkillRef = doc(skillsCollectionRef);
        batch.set(newSkillRef, { name: skillName, companyId: companyId });
    });

    // 4. Seed initial parts for the new company
    const partsCollectionRef = collection(db, 'parts');
    PREDEFINED_PARTS.forEach(partName => {
        const newPartRef = doc(partsCollectionRef);
        batch.set(newPartRef, { name: partName, companyId: companyId });
    });
    
    // Commit all operations atomically
    await batch.commit();

    return { error: null };

  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in completeOnboardingAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { error: `Failed to complete onboarding. ${errorMessage}` };
  }
}
