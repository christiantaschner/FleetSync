
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, limit, serverTimestamp, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/types';

const EnsureUserDocumentInputSchema = z.object({
  uid: z.string().min(1, 'User ID is required.'),
  email: z.string().email('A valid email is required.'),
});
type EnsureUserDocumentInput = z.infer<typeof EnsureUserDocumentInputSchema>;

/**
 * Ensures a user document exists in Firestore. Assigns superAdmin role and sets Custom Claims if applicable.
 */
export async function ensureUserDocumentAction(
  input: EnsureUserDocumentInput
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK not initialized. Check server logs for details.");
    const validatedInput = EnsureUserDocumentInputSchema.parse(input);
    const { uid, email } = validatedInput;
    
    const userDocRef = doc(dbAdmin, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      const isSuperAdmin = email === 'christian.taschner.ek@gmail.com';
      const role = isSuperAdmin ? 'superAdmin' : null;
      const companyId = isSuperAdmin ? 'fleetsync_ai_dev' : null;

      await setDoc(userDocRef, {
        uid: uid,
        email: email,
        onboardingStatus: isSuperAdmin ? 'completed' : 'pending_creation',
        role,
        companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      if(isSuperAdmin) {
          const companyRef = doc(dbAdmin, 'companies', 'fleetsync_ai_dev');
          const companySnap = await getDoc(companyRef);
          if(!companySnap.exists()) {
              await setDoc(companyRef, {
                  name: "FleetSync AI (Dev)",
                  ownerId: uid,
                  subscriptionStatus: 'active',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
              });
          }
      }
    }

    // --- CRITICAL: Sync Firestore state with Auth Custom Claims ---
    const userProfileFromDb = (await getDoc(userDocRef)).data() as UserProfile;
    const currentUser = await authAdmin.getUser(uid);
    const existingClaims = currentUser.customClaims || {};
    
    const claimsToSet: { [key: string]: any } = {};
    if (existingClaims.role !== userProfileFromDb.role) {
      claimsToSet.role = userProfileFromDb.role || null;
    }
    if (existingClaims.companyId !== userProfileFromDb.companyId) {
      claimsToSet.companyId = userProfileFromDb.companyId || null;
    }

    if (Object.keys(claimsToSet).length > 0) {
      await authAdmin.setCustomUserClaims(uid, { ...existingClaims, ...claimsToSet });
      console.log(`Custom claims for user ${uid} synchronized:`, claimsToSet);
    }
    // --- END CRITICAL PART ---

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
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        if (!companyId) {
            return { data: [], error: null };
        }

        const usersQuery = query(collection(dbAdmin, "users"), where("companyId", "==", companyId), orderBy("email"));
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
  role: z.enum(['admin', 'technician']),
  companyId: z.string(),
  appId: z.string().min(1),
});
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export async function inviteUserAction(
  input: InviteUserInput
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized. Check server logs for details.");
    const { email, role, companyId, appId } = InviteUserInputSchema.parse(input);

    const usersQuery = query(collection(dbAdmin, "users"), where("email", "==", email), limit(1));
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      return { error: "User with this email has not signed up yet. Please ask them to create an account first." };
    }
    
    const userDoc = userSnapshot.docs[0];
    const userProfile = userDoc.data() as UserProfile;

    if (userProfile.companyId) {
      return { error: `User is already a member of another company.`};
    }
    
    const batch = writeBatch(dbAdmin);

    const userDocRef = doc(dbAdmin, "users", userProfile.uid);
    batch.update(userDocRef, {
        companyId,
        role,
        onboardingStatus: 'completed'
    });

    if (role === 'technician') {
        const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, userProfile.uid);
        const techDocSnap = await getDoc(techDocRef);
        if (!techDocSnap.exists()) {
            batch.set(techDocRef, {
                companyId: companyId,
                name: userProfile.email.split('@')[0], 
                email: userProfile.email,
                isAvailable: true,
                skills: [],
                location: {
                    latitude: 0,
                    longitude: 0,
                    address: "Not set",
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
    }

    await batch.commit();

    const user = await authAdmin.getUser(userProfile.uid);
    await authAdmin.setCustomUserClaims(userProfile.uid, {
        ...user.customClaims,
        companyId,
        role,
    });
    console.log(`Custom claims set for invited user ${userProfile.uid}`);
    
    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { error: `Failed to invite user. ${errorMessage}` };
  }
}

const ManageUserRoleInputSchema = z.object({
    userId: z.string(),
    companyId: z.string(),
    newRole: z.enum(['admin', 'technician']),
});
export type ManageUserRoleInput = z.infer<typeof ManageUserRoleInputSchema>;

export async function updateUserRoleAction(
  input: ManageUserRoleInput
): Promise<{ error: string | null }> {
    try {
        if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized. Check server logs for details.");
        const { userId, companyId, newRole } = ManageUserRoleInputSchema.parse(input);
        const userDocRef = doc(dbAdmin, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || userSnap.data().companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        await updateDoc(userDocRef, { role: newRole });

        const user = await authAdmin.getUser(userId);
        await authAdmin.setCustomUserClaims(userId, {
            ...user.customClaims,
            role: newRole,
        });
        console.log(`Custom claims updated for user ${userId}`);

        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        return { error: `Failed to update user role. ${errorMessage}` };
    }
}


const RemoveUserFromCompanyInputSchema = z.object({
    userId: z.string(),
    companyId: z.string(),
    appId: z.string().min(1),
});
export type RemoveUserFromCompanyInput = z.infer<typeof RemoveUserFromCompanyInputSchema>;

export async function removeUserFromCompanyAction(
  input: RemoveUserFromCompanyInput
): Promise<{ error: string | null }> {
    try {
        if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized. Check server logs for details.");
        const { userId, companyId, appId } = RemoveUserFromCompanyInputSchema.parse(input);

        const userDocRef = doc(dbAdmin, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || userSnap.data().companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        const batch = writeBatch(dbAdmin);

        batch.update(userDocRef, {
            companyId: null,
            role: null,
            onboardingStatus: 'pending_creation',
        });
        
        const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, userId);
        const techDocSnap = await getDoc(techDocRef);
        if (techDocSnap.exists() && techDocSnap.data().companyId === companyId) {
            batch.delete(techDocRef);
        }

        await batch.commit();

        const user = await authAdmin.getUser(userId);
        await authAdmin.setCustomUserClaims(userId, {
            ...user.customClaims,
            companyId: null,
            role: null,
        });
        console.log(`Custom claims nullified for removed user ${userId}`);

        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        return { error: `Failed to remove user. ${errorMessage}` };
    }
}
