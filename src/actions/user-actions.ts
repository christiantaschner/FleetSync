'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const EnsureUserDocumentInputSchema = z.object({
  uid: z.string().min(1, 'User ID is required.'),
  email: z.string().email('A valid email is required.'),
});
type EnsureUserDocumentInput = z.infer<typeof EnsureUserDocumentInputSchema>;

/**
 * Ensures a user document exists in Firestore for a newly authenticated user.
 * This is intended to be called client-side as a replacement for an `onCreate` Cloud Function.
 * The function is idempotent: it will not overwrite an existing document.
 */
export async function ensureUserDocumentAction(
  input: EnsureUserDocumentInput
): Promise<{ error: string | null }> {
  try {
    const validatedInput = EnsureUserDocumentInputSchema.parse(input);
    const { uid, email } = validatedInput;
    
    if (!db) {
      throw new Error('Firestore not initialized.');
    }

    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      // Document already exists, do nothing.
      return { error: null };
    }

    // Document does not exist, create it with initial pending status.
    await setDoc(userDocRef, {
      uid: uid,
      email: email,
      onboardingStatus: 'pending_onboarding',
      role: null,
      companyId: null,
    });

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in ensureUserDocumentAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { error: `Failed to ensure user document. ${errorMessage}` };
  }
}
