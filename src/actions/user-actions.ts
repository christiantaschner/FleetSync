
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import type { UserProfile, Invite } from '@/types';
import * as admin from 'firebase-admin';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, updateDoc, orderBy, setDoc, deleteDoc } from 'firebase/firestore';

const CreateUserProfileInputSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
});

export async function createUserProfileAction(
    input: z.infer<typeof CreateUserProfileInputSchema>
): Promise<{ error: string | null }> {
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
        const { uid, email } = CreateUserProfileInputSchema.parse(input);

        const userDocRef = dbAdmin.collection('users').doc(uid);
        
        const newUserProfile: Omit<UserProfile, 'uid'> = {
            email: email,
            onboardingStatus: 'pending_onboarding',
            role: null,
            companyId: null,
        };

        await setDoc(userDocRef, {
            ...newUserProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { error: null };
    } catch(e) {
        if (e instanceof z.ZodError) {
            return { error: e.errors.map((err) => err.message).join(', ') };
        }
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(JSON.stringify({
            message: 'Error in createUserProfileAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { error: `Failed to create user profile. ${errorMessage}` };
    }
}


export async function getCompanyUsersAction(
    companyId: string
): Promise<{ data: UserProfile[] | null; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const { mockTechnicians } = require('@/lib/mock-data');
        const users: UserProfile[] = mockTechnicians.map((t:any) => ({ uid: t.id, email: t.email, companyId: t.companyId, role: 'technician', onboardingStatus: 'completed' }));
        return { data: users, error: null };
    }
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

export async function getCompanyInvitesAction(
    companyId: string
): Promise<{ data: Invite[] | null; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { data: [], error: null };
    }
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        if (!companyId) {
            return { data: [], error: null };
        }

        const invitesQuery = query(
            dbAdmin.collection("invitations"),
            where("companyId", "==", companyId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(invitesQuery);
        const invites = querySnapshot.docs.map(doc => {
            const data = doc.data();
            for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as Invite;
        });

        return { data: invites, error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(JSON.stringify({
            message: 'Error in getCompanyInvitesAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { data: null, error: `Failed to fetch invitations. ${errorMessage}` };
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized.");
    const { email, role, companyId, appId } = InviteUserInputSchema.parse(input);

    const invitesRef = collection(dbAdmin, 'invitations');
    
    const usersQuery = query(dbAdmin.collection("users"), where("email", "==", email), limit(1));
    const userSnapshot = await getDocs(usersQuery);
    
    // Check for existing active invitations
    const existingInviteQuery = query(invitesRef, where("email", "==", email), where("status", "==", "pending"), limit(1));
    const existingInviteSnapshot = await getDocs(existingInviteQuery);
    if (!existingInviteSnapshot.empty) {
        return { error: "An active invitation for this email address already exists." };
    }
    
    // Check if user is already in ANY company
    if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userProfile = userDoc.data() as UserProfile;
        if (userProfile.companyId) {
            return { error: `This user is already a member of a company.` };
        }

        // If user exists but is not in a company, add them directly and mark invite as accepted
        await userDoc.ref.update({
            companyId,
            role,
            onboardingStatus: 'completed'
        });

        if (role === 'technician') {
            const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(userProfile.uid);
            await techDocRef.set({
                companyId: companyId,
                name: userProfile.email.split('@')[0],
                email: userProfile.email,
                isAvailable: true,
                skills: [],
                location: { latitude: 0, longitude: 0, address: "Not set" },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }

        await authAdmin.setCustomUserClaims(userProfile.uid, { companyId, role });
        
        // Create an "accepted" invitation for record-keeping
        await addDoc(invitesRef, {
            email,
            role,
            companyId,
            status: 'accepted',
            createdAt: serverTimestamp(),
            acceptedAt: serverTimestamp(),
            acceptedByUid: userProfile.uid
        });

        return { error: null };
    }
    
    // If user does not exist, create a pending invitation
    await addDoc(invitesRef, {
        email,
        role,
        companyId,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
    try {
        if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized. Check server logs for details.");
        const { userId, companyId, newRole } = ManageUserRoleInputSchema.parse(input);
        
        const userDocRef = dbAdmin.collection("users").doc(userId);
        const userSnap = await userDocRef.get();

        if (!userSnap.exists || userSnap.data()?.companyId !== companyId) {
            return { error: "User not found in this company." };
        }

        await userDocRef.update({ role: newRole });

        await authAdmin.setCustomUserClaims(userId, {
            companyId: companyId,
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
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

        // Also remove any pending invites for this user's email, if they exist
        const userEmail = userSnap.data()?.email;
        if(userEmail) {
            const invitesRef = collection(dbAdmin, 'invitations');
            const inviteQuery = query(invitesRef, where("email", "==", userEmail), where("status", "==", "pending"));
            const inviteSnapshot = await getDocs(inviteQuery);
            inviteSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }


        await batch.commit();

        await authAdmin.setCustomUserClaims(userId, {
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
