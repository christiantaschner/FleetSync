
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { collection, addDoc, getDocs, query, orderBy, doc, where, writeBatch, arrayRemove, getDoc } from 'firebase/firestore';

// --- Get Skills ---
const GetSkillsInputSchema = z.object({
  companyId: z.string().min(1),
  appId: z.string().min(1),
});
export type GetSkillsInput = z.infer<typeof GetSkillsInputSchema>;

export type Skill = {
  id: string;
  name: string;
};
export async function getSkillsAction(input: GetSkillsInput): Promise<{ data: Skill[] | null; error: string | null; }> {
    try {
        if (!dbAdmin) {
            throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
        }
        const { companyId, appId } = GetSkillsInputSchema.parse(input);
        const skillsQuery = query(
            collection(dbAdmin, `artifacts/${appId}/public/data/skills`),
            where("companyId", "==", companyId),
            orderBy("name")
        );
        const querySnapshot = await getDocs(skillsQuery);
        const skillsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
        return { data: skillsData, error: null };
    } catch (e) {
        console.error("Error fetching skills:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `Failed to fetch skills. ${errorMessage}` };
    }
}

// --- Add Skill ---
const AddSkillInputSchema = z.object({
  name: z.string().min(1, "Skill name is required."),
  companyId: z.string().min(1),
  appId: z.string().min(1),
});
export type AddSkillInput = z.infer<typeof AddSkillInputSchema>;

export async function addSkillAction(input: AddSkillInput): Promise<{ data: { id: string; name: string; } | null; error: string | null; }> {
    try {
        if (!dbAdmin) {
            throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
        }
        const { name, companyId, appId } = AddSkillInputSchema.parse(input);
        const skillsCollectionRef = collection(dbAdmin, `artifacts/${appId}/public/data/skills`);

        const existingSkillQuery = query(skillsCollectionRef, where("companyId", "==", companyId), where("name", "==", name.trim()));
        const existingSkillSnapshot = await getDocs(existingSkillQuery);
        if (!existingSkillSnapshot.empty) {
            return { data: null, error: "This skill already exists in the library." };
        }

        const docRef = await addDoc(skillsCollectionRef, { name: name.trim(), companyId });
        return { data: { id: docRef.id, name: name.trim() }, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        console.error("Error adding skill:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `Failed to add skill. ${errorMessage}` };
    }
}

// --- Delete Skill ---
const DeleteSkillInputSchema = z.object({
  skillId: z.string().min(1, "Skill ID is required."),
  skillName: z.string().min(1, "Skill name is required."),
  companyId: z.string().min(1, "Company ID is required."),
  appId: z.string().min(1, "App ID is required."),
});
export type DeleteSkillInput = z.infer<typeof DeleteSkillInputSchema>;

export async function deleteSkillAction(
  input: DeleteSkillInput
): Promise<{ error: string | null }> {
    try {
        if (!dbAdmin) {
            throw new Error("Firestore Admin SDK not initialized. Check server logs for details.");
        }
        
        const { skillId, skillName, companyId, appId } = DeleteSkillInputSchema.parse(input);
        
        const batch = writeBatch(dbAdmin);

        // Find all technicians with this skill
        const techniciansRef = collection(dbAdmin, `artifacts/${appId}/public/data/technicians`);
        const q = query(techniciansRef, where("companyId", "==", companyId), where("skills", "array-contains", skillName));
        const querySnapshot = await getDocs(q);

        // For each technician, remove the skill from their skills array
        querySnapshot.forEach((technicianDoc) => {
            batch.update(technicianDoc.ref, {
                skills: arrayRemove(skillName)
            });
        });

        // Delete the skill from the skills library
        const skillDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/skills`, skillId);
        const skillSnap = await getDoc(skillDocRef);
        if (skillSnap.exists() && skillSnap.data().companyId === companyId) {
             batch.delete(skillDocRef);
        } else {
            throw new Error("Skill not found or you do not have permission to delete it.");
        }
        
        await batch.commit();
        
        return { error: null };

    } catch(e) {
        console.error("Error deleting skill:", e);
        if (e instanceof Error && e.message.includes('permission-denied')) {
            return { error: 'Failed to delete skill. Missing or insufficient permissions.' };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { error: `Failed to delete skill. ${errorMessage}` };
    }
}
