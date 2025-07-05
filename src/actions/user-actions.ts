
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { authAdmin } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, limit, serverTimestamp } from 'firebase/firestore';
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
    const validatedInput = EnsureUserDocumentInputSchema.parse(input);
    const { uid, email } = validatedInput;
    
    if (!db) {
      throw new Error('Firestore not initialized.');
    }

    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    let currentRole: string | null = null;
    let currentCompanyId: string | null = null;
    
    if (!docSnap.exists()) {
      // Document does not exist, create it.
      const isSuperAdmin = email === 'christian.taschner.ek@gmail.com';
      currentRole = isSuperAdmin ? 'superAdmin' : null;
      currentCompanyId = isSuperAdmin ? 'fleetsync_ai_dev' : null;

      await setDoc(userDocRef, {
        uid: uid,
        email: email,
        onboardingStatus: isSuperAdmin ? 'completed' : 'pending_creation',
        role: currentRole,
        companyId: currentCompanyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // If super admin, ensure dev company exists
      if(isSuperAdmin) {
          const companyRef = doc(db, 'companies', 'fleetsync_ai_dev');
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
    // This ensures Security Rules have access to role and companyId.
    const currentUser = await authAdmin.getUser(uid);
    const existingClaims = currentUser.customClaims || {};

    const userProfileFromDb = (await getDoc(userDocRef)).data() as UserProfile;
    const roleFromDb = userProfileFromDb.role || null;
    const companyIdFromDb = userProfileFromDb.companyId || null;
    
    const claimsToSet: { [key: string]: any } = {};
    let claimsChanged = false;

    if (existingClaims.role !== roleFromDb) {
      claimsToSet.role = roleFromDb;
      claimsChanged = true;
    }

    if (existingClaims.companyId !== companyIdFromDb) {
      claimsToSet.companyId = companyIdFromDb;
      claimsChanged = true;
    }

    if (claimsChanged) {
      await authAdmin.setCustomUserClaims(uid, {
        ...existingClaims, 
        ...claimsToSet,
      });
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
  role: z.enum(['admin', 'technician']),
  companyId: z.string(),
  appId: z.string().min(1),
});
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export async function inviteUserAction(
  input: InviteUserInput
): Promise<{ error: string | null }> {
  try {
    const { email, role, companyId, appId } = InviteUserInputSchema.parse(input);
    if (!db) throw new Error("Firestore not initialized");

    const usersQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      return { error: "User with this email has not signed up yet. Please ask them to create an account first." };
    }
    
    const userDoc = userSnapshot.docs[0];
    const userProfile = userDoc.data() as UserProfile;

    if (userProfile.companyId) {
      return { error: `User is already a member of another company.`};
    }
    
    const batch = writeBatch(db);

    const userDocRef = doc(db, "users", userProfile.uid);
    batch.update(userDocRef, {
        companyId,
        role,
        onboardingStatus: 'completed'
    });

    // If the invited user is a technician, create a technician profile for them
    if (role === 'technician') {
        const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, userProfile.uid);
        const techDocSnap = await getDoc(techDocRef);
        // Only create if one doesn't already exist for this UID
        if (!techDocSnap.exists()) {
            batch.set(techDocRef, {
                companyId: companyId,
                name: userProfile.email.split('@')[0], // Default name to email prefix
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

    // Set custom claims after updating Firestore
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
        const { userId, companyId, newRole } = ManageUserRoleInputSchema.parse(input);
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || userSnap.data().companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        await updateDoc(userDocRef, { role: newRole });

        // Update custom claims after updating Firestore
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
        const { userId, companyId, appId } = RemoveUserFromCompanyInputSchema.parse(input);
        if (!db) throw new Error("Firestore not initialized");

        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || userSnap.data().companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        const batch = writeBatch(db);

        // Reset user's company-related fields in Firestore
        batch.update(userDocRef, {
            companyId: null,
            role: null,
            onboardingStatus: 'pending_creation',
        });
        
        // Also unassign this user from any technician profile they might have
        const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, userId);
        const techDocSnap = await getDoc(techDocRef);
        if (techDocSnap.exists() && techDocSnap.data().companyId === companyId) {
            batch.delete(techDocRef);
        }

        await batch.commit();

        // Nullify custom claims after updating Firestore
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
