
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/types';

// NOTE: This is a drastically simplified version for troubleshooting authentication.
// The original logic involving Stripe and complex writes has been temporarily removed.

export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
  appId: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");

    const validatedInput = CompleteOnboardingInputSchema.parse(input);
    const { uid } = validatedInput;

    // Perform a single, simple write operation to test the SDK.
    const userDocRef = dbAdmin.collection('users').doc(uid);
    await userDocRef.update({
        onboardingStatus: 'completed_test', // Use a distinct status for this test
    });

    // The test has passed if the code reaches this point.
    // The UI will show this message as an "error" toast, which is expected for this test.
    return { 
        sessionId: null, 
        error: "TEST SUCCEEDED: The server action ran and wrote to Firestore. The original authentication error did not occur. Please let me know you saw this message so we can proceed with restoring the full functionality." 
    };

  } catch (e) {
    if (e instanceof z.ZodError) {
      return { sessionId: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in SIMPLIFIED completeOnboardingAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    
    // If we get here, the most basic operation failed.
    return { 
        sessionId: null, 
        error: `TEST FAILED: The simplified action still failed with the original error. This proves the issue is environmental. Error: ${errorMessage}` 
    };
  }
}
