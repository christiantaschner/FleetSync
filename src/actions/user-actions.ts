
'use server';

import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import type { UserProfile, Invite } from '@/types';
import * as admin from 'firebase-admin';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';

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

export async function getCompanyInvitesAction(
    companyId: string
): Promise<{ data: Invite[] | null; error: string | null }> {
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
  try {
    if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin SDK has not been initialized.");
    const { email, role, companyId, appId } = InviteUserInputSchema.parse(input);

    const usersQuery = dbAdmin.collection("users").where("email", "==", email);
    const userSnapshot = await usersQuery.get();
    
    if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userProfile = userDoc.data() as UserProfile;
        if (userProfile.companyId) {
            return { error: `This user is already a member of a company.` };
        }

        // User exists but is not in a company, so add them directly.
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
        
        return { error: null };
    }
    
    // User does not exist, so create an invitation document
    const invitesRef = collection(dbAdmin, 'invitations');
    const existingInviteQuery = query(invitesRef, where("email", "==", email), where("status", "==", "pending"));
    const existingInviteSnapshot = await getDocs(existingInviteQuery);

    if (!existingInviteSnapshot.empty) {
        return { error: "An active invitation for this email address already exists." };
    }
    
    await addDoc(invitesRef, {
        email,
        role,
        companyId,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    
    // In a real app, you would now trigger an email send to the user with a signup link.
    
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

        // Rebuild the claims object to preserve companyId but update the role
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

        // Wipe the relevant claims by setting them to null.
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
