
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { PREDEFINED_SKILLS, SKILLS_BY_SPECIALTY } from '@/lib/skills';
import * as admin from 'firebase-admin';
import type { Company } from '@/types';

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
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        const { companyId, appId } = GetSkillsInputSchema.parse(input);
        
        const skillsCollection = dbAdmin.collection(`artifacts/${appId}/public/data/skills`);
        const skillsQuery = skillsCollection.where("companyId", "==", companyId);
        
        const querySnapshot = await skillsQuery.get();
        const skillsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
        
        skillsData.sort((a,b) => a.name.localeCompare(b.name));

        return { data: skillsData, error: null };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error fetching skills',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
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
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        const { name, companyId, appId } = AddSkillInputSchema.parse(input);
        const skillsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/skills`);

        const existingSkillQuery = await skillsCollectionRef.where("companyId", "==", companyId).where("name", "==", name.trim()).get();
        if (!existingSkillQuery.empty) {
            return { data: null, error: "This skill already exists in the library." };
        }

        const docRef = await skillsCollectionRef.add({ name: name.trim(), companyId });
        return { data: { id: docRef.id, name: name.trim() }, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error adding skill',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
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
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        
        const { skillId, skillName, companyId, appId } = DeleteSkillInputSchema.parse(input);
        
        const batch = dbAdmin.batch();

        const techniciansRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`);
        const q = techniciansRef.where("companyId", "==", companyId).where("skills", "array-contains", skillName);
        const querySnapshot = await q.get();

        querySnapshot.forEach((technicianDoc) => {
            batch.update(technicianDoc.ref, {
                skills: admin.firestore.FieldValue.arrayRemove(skillName)
            });
        });

        const skillDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/skills`).doc(skillId);
        const skillSnap = await skillDocRef.get();

        if (skillSnap.exists && skillSnap.data()?.companyId === companyId) {
             batch.delete(skillDocRef);
        } else {
            throw new Error("Skill not found or you do not have permission to delete it.");
        }
        
        await batch.commit();
        
        return { error: null };

    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        if (e instanceof Error && e.message.includes('permission-denied')) {
            return { error: 'Failed to delete skill. Missing or insufficient permissions.' };
        }
        console.error(JSON.stringify({
            message: 'Error deleting skill',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { error: `Failed to delete skill. ${errorMessage}` };
    }
}

// --- Seed Skills ---
const SeedSkillsInputSchema = z.object({
  companyId: z.string().min(1),
  appId: z.string().min(1),
});

export async function seedSkillsAction(
  input: z.infer<typeof SeedSkillsInputSchema>
): Promise<{ error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { error: null };
  }
  try {
    if (!dbAdmin) {
      throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
    }
    const { companyId, appId } = SeedSkillsInputSchema.parse(input);

    const skillsToSeed = [...PREDEFINED_SKILLS];
    
    if (skillsToSeed.length === 0) {
        return { error: "No predefined skills found to seed." };
    }

    const batch = dbAdmin.batch();
    const skillsCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/skills`);
    const skillsQuery = await skillsCollectionRef.where("companyId", "==", companyId).get();
    const existingSkills = new Set(skillsQuery.docs.map(doc => doc.data().name));

    skillsToSeed.forEach(skillName => {
        if (!existingSkills.has(skillName)) {
            const newSkillRef = skillsCollectionRef.doc();
            batch.set(newSkillRef, { name: skillName, companyId });
        }
    });

    await batch.commit();
    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error seeding skills',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to seed skills. ${errorMessage}` };
  }
}

    
