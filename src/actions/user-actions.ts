
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, limit } from 'firebase/firestore';
import type { UserProfile } from '@/types';

const EnsureUserDocumentInputSchema = z.object({
  uid: z.string().min(1, 'User ID is required.'),
  email: z.string().email('A valid email is required.'),
});
type EnsureUserDocumentInput = z.infer<typeof EnsureUserDocumentInputSchema>;

/**
 * Ensures a user document exists in Firestore. Assigns super_admin role if applicable.
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

    const isSuperAdmin = email === 'christian.taschner.ek@gmail.com';

    // Document does not exist, create it.
    await setDoc(userDocRef, {
      uid: uid,
      email: email,
      onboardingStatus: isSuperAdmin ? 'completed' : 'pending_onboarding',
      role: isSuperAdmin ? 'superAdmin' : null,
      companyId: isSuperAdmin ? 'fleetsync_ai_dev' : null, // Assign a dev company for super admin
    });
    
    // If super admin, ensure dev company exists
    if(isSuperAdmin) {
        const companyRef = doc(db, 'companies', 'fleetsync_ai_dev');
        const companySnap = await getDoc(companyRef);
        if(!companySnap.exists()) {
            await setDoc(companyRef, {
                name: "FleetSync AI (Dev)",
                ownerId: uid,
                subscriptionStatus: 'active'
            });
        }
    }


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

export async function getCompanyUsersAction(
    companyId: string
): Promise<{ data: UserProfile[] | null; error: string | null }> {
    try {
        if (!db) throw new Error("Firestore not initialized");
        if (!companyId) {
            return { data: [], error: null };
        }

        const usersQuery = query(collection(db, "users"), where("companyId", "==", companyId));
        const querySnapshot = await getDocs(usersQuery);
        const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);

        return { data: users, error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        return { data: null, error: `Failed to fetch users. ${errorMessage}` };
    }
}


const InviteUserInputSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'technician', 'csr']),
  companyId: z.string(),
});
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export async function inviteUserAction(
  input: InviteUserInput
): Promise<{ error: string | null }> {
  try {
    const { email, role, companyId } = InviteUserInputSchema.parse(input);
    if (!db) throw new Error("Firestore not initialized");

    const usersQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      return { error: "User with this email has not signed up yet. Please ask them to create an account first." };
    }
    
    const userDoc = userSnapshot.docs[0];
    const userProfile = userDoc.data() as UserProfile;

    if (userProfile.companyId) {
      return { error: `User is already a member of another company (${userProfile.companyId}).`};
    }
    
    await updateDoc(doc(db, "users", userProfile.uid), {
        companyId,
        role,
        onboardingStatus: 'completed'
    });
    
    return { error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { error: `Failed to invite user. ${errorMessage}` };
  }
}

const ManageUserRoleInputSchema = z.object({
    userId: z.string(),
    companyId: z.string(),
    newRole: z.enum(['admin', 'technician', 'csr']),
});
export type ManageUserRoleInput = z.infer<typeof ManageUserRoleInputSchema>;

export async function updateUserRoleAction(
  input: ManageUserRoleInput
): Promise<{ error: string | null }> {
    try {
        const { userId, companyId, newRole } = ManageUserRoleInputSchema.parse(input);
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || userSnap.data().companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        await updateDoc(userDocRef, { role: newRole });
        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        return { error: `Failed to update user role. ${errorMessage}` };
    }
}


const RemoveUserFromCompanyInputSchema = z.object({
    userId: z.string(),
    companyId: z.string(),
});

export async function removeUserFromCompanyAction(
  input: z.infer<typeof RemoveUserFromCompanyInputSchema>
): Promise<{ error: string | null }> {
    try {
        const { userId, companyId } = RemoveUserFromCompanyInputSchema.parse(input);
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || userSnap.data().companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        const batch = writeBatch(db);

        // Reset user's company-related fields
        batch.update(userDocRef, {
            companyId: null,
            role: null,
            onboardingStatus: 'pending_onboarding',
        });
        
        // Also unassign this user from any technician profile they might have
        // Note: The technician document ID is the same as the user ID.
        const techDocRef = doc(db, "technicians", userId);
        const techDocSnap = await getDoc(techDocRef);
        if (techDocSnap.exists() && techDocSnap.data().companyId === companyId) {
            batch.delete(techDocRef);
        }

        await batch.commit();

        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        return { error: `Failed to remove user. ${errorMessage}` };
    }
}
