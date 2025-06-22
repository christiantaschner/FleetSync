
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const AddEquipmentInputSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required.'),
  customerName: z.string().min(1, 'Customer name is required.'),
  companyId: z.string().min(1, 'Company ID is required.'),
  name: z.string().min(1, 'Equipment name is required.'),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  installDate: z.string().optional(),
  notes: z.string().optional(),
});
export type AddEquipmentInput = z.infer<typeof AddEquipmentInputSchema>;

export async function addEquipmentAction(
  input: AddEquipmentInput
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const validatedInput = AddEquipmentInputSchema.parse(input);
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const equipmentCollectionRef = collection(db, 'equipment');
    const docRef = await addDoc(equipmentCollectionRef, {
      ...validatedInput,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { data: { id: docRef.id }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in addEquipmentAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { data: null, error: `Failed to add equipment. ${errorMessage}` };
  }
}
