
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types';
import * as admin from 'firebase-admin';

const EnsureUserDocumentInputSchema = z.object({
  uid: z.string().min(1, 'User ID is required.'),
  email: z.string().email('A valid email is required.'),
});
type EnsureUserDocumentInput = z.infer<typeof EnsureUserDocumentInputSchema>;

export async function ensureUserDocumentAction(
  input: EnsureUserDocumentInput
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK not initialized. Check server logs for details.");
    const validatedInput = EnsureUserDocumentInputSchema.parse(input);
    const { uid, email } = validatedInput;
    
    const userDocRef = dbAdmin.collection('users').doc(uid);
    const docSnap = await userDocRef.get();

    if (!docSnap.exists) {
      const isSuperAdmin = email === 'christian.taschner.ek@gmail.com';
      const role = isSuperAdmin ? 'superAdmin' : null;
      const companyId = isSuperAdmin ? 'fleetsync_ai_dev' : null;

      await userDocRef.set({
        uid: uid,
        email: email,
        onboardingStatus: isSuperAdmin ? 'completed' : 'pending_creation',
        role,
        companyId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      if(isSuperAdmin) {
          const companyRef = dbAdmin.collection('companies').doc('fleetsync_ai_dev');
          const companySnap = await companyRef.get();
          if(!companySnap.exists) {
              await companyRef.set({
                  name: "FleetSync AI (Dev)",
                  ownerId: uid,
                  subscriptionStatus: 'active',
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
          }
      }
    }

    const userProfileFromDb = (await userDocRef.get()).data() as UserProfile;
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
      console.log(JSON.stringify({
          message: `Custom claims for user ${uid} synchronized`,
          claims: claimsToSet,
          severity: "INFO"
      }));
    }

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in ensureUserDocumentAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
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

        const usersQuery = dbAdmin.collection("users").where("companyId", "==", companyId);
        const querySnapshot = await usersQuery.get();
        const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);

        users.sort((a,b) => (a.email || '').localeCompare(b.email || ''));

        return { data: users, error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(JSON.stringify({
            message: 'Error in getCompanyUsersAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
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

    const usersQuery = await dbAdmin.collection("users").where("email", "==", email).limit(1).get();

    if (usersQuery.empty) {
      return { error: "User with this email has not signed up yet. Please ask them to create an account first." };
    }
    
    const userDoc = usersQuery.docs[0];
    const userProfile = userDoc.data() as UserProfile;

    if (userProfile.companyId) {
      return { error: `User is already a member of another company.`};
    }
    
    const batch = dbAdmin.batch();

    const userDocRef = dbAdmin.collection("users").doc(userProfile.uid);
    batch.update(userDocRef, {
        companyId,
        role,
        onboardingStatus: 'completed'
    });

    if (role === 'technician') {
        const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(userProfile.uid);
        const techDocSnap = await techDocRef.get();
        if (!techDocSnap.exists) {
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
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    console.log(JSON.stringify({
        message: `Custom claims set for invited user ${userProfile.uid}`,
        severity: "INFO"
    }));
    
    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in inviteUserAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
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
        
        const userDocRef = dbAdmin.collection("users").doc(userId);
        const userSnap = await userDocRef.get();

        if (!userSnap.exists || userSnap.data()?.companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        await userDocRef.update({ role: newRole });

        const user = await authAdmin.getUser(userId);
        await authAdmin.setCustomUserClaims(userId, {
            ...user.customClaims,
            role: newRole,
        });
        console.log(JSON.stringify({
            message: `Custom claims updated for user ${userId}`,
            severity: "INFO"
        }));

        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(JSON.stringify({
            message: 'Error in updateUserRoleAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
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

        const userDocRef = dbAdmin.collection("users").doc(userId);
        const userSnap = await userDocRef.get();

        if (!userSnap.exists || userSnap.data()?.companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        const batch = dbAdmin.batch();

        batch.update(userDocRef, {
            companyId: null,
            role: null,
            onboardingStatus: 'pending_creation',
        });
        
        const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(userId);
        const techDocSnap = await techDocRef.get();
        if (techDocSnap.exists && techDocSnap.data()?.companyId === companyId) {
            batch.delete(techDocRef);
        }

        await batch.commit();

        const user = await authAdmin.getUser(userId);
        await authAdmin.setCustomUserClaims(userId, {
            ...user.customClaims,
            companyId: null,
            role: null,
        });
        console.log(JSON.stringify({
            message: `Custom claims nullified for removed user ${userId}`,
            severity: "INFO"
        }));

        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(JSON.stringify({
            message: 'Error in removeUserFromCompanyAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { error: `Failed to remove user. ${errorMessage}` };
    }
}
