
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { collection, addDoc, deleteDoc, getDocs, query, orderBy, doc, where, getDoc } from 'firebase/firestore';

// --- Get Parts ---
const GetPartsInputSchema = z.object({
  companyId: z.string().min(1),
  appId: z.string().min(1),
});
export type GetPartsInput = z.infer<typeof GetPartsInputSchema>;

export type Part = {
  id: string;
  name: string;
};
export async function getPartsAction(input: GetPartsInput): Promise<{ data: Part[] | null; error: string | null; }> {
    try {
        if (!dbAdmin) {
            throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
        }
        const { companyId, appId } = GetPartsInputSchema.parse(input);
        const partsQuery = query(
            collection(dbAdmin, `artifacts/${appId}/public/data/parts`),
            where("companyId", "==", companyId),
            orderBy("name")
        );
        const querySnapshot = await getDocs(partsQuery);
        const partsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
        return { data: partsData, error: null };
    } catch (e) {
        console.error("Error fetching parts:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `Failed to fetch parts. ${errorMessage}` };
    }
}

// --- Add Part ---
const AddPartInputSchema = z.object({
  name: z.string().min(1, "Part name is required."),
  companyId: z.string().min(1),
  appId: z.string().min(1),
});
export type AddPartInput = z.infer<typeof AddPartInputSchema>;

export async function addPartAction(input: AddPartInput): Promise<{ data: { id: string } | null; error: string | null; }> {
    try {
        if (!dbAdmin) {
            throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
        }
        const { name, companyId, appId } = AddPartInputSchema.parse(input);
        const partsCollectionRef = collection(dbAdmin, `artifacts/${appId}/public/data/parts`);

        const existingPartQuery = query(partsCollectionRef, where("companyId", "==", companyId), where("name", "==", name.trim()));
        const existingPartSnapshot = await getDocs(existingPartQuery);
        if (!existingPartSnapshot.empty) {
            return { data: null, error: "This part already exists in the library." };
        }

        const docRef = await addDoc(partsCollectionRef, { name: name.trim(), companyId });
        return { data: { id: docRef.id }, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        console.error("Error adding part:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `Failed to add part. ${errorMessage}` };
    }
}

// --- Delete Part ---
const DeletePartInputSchema = z.object({
  partId: z.string().min(1, "Part ID is required."),
  companyId: z.string().min(1),
  appId: z.string().min(1),
});
export type DeletePartInput = z.infer<typeof DeletePartInputSchema>;

export async function deletePartAction(input: DeletePartInput): Promise<{ error: string | null; }> {
    try {
        if (!dbAdmin) {
            throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
        }
        const { partId, companyId, appId } = DeletePartInputSchema.parse(input);
        const partDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/parts`, partId);
        
        const docSnap = await getDoc(partDocRef);
        if (!docSnap.exists() || docSnap.data().companyId !== companyId) {
            return { error: "Part not found or you do not have permission to delete it." };
        }

        await deleteDoc(partDocRef);
        return { error: null };
    } catch (e) {
        console.error("Error deleting part:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { error: `Failed to delete part. ${errorMessage}` };
    }
}
