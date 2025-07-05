
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Base schema for technician data, omitting fields managed by the server
const TechnicianDataSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1, 'Technician name is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
  isAvailable: z.boolean(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  avatarUrl: z.string().url().optional(),
});

// Schema for adding a new technician
const AddTechnicianInputSchema = TechnicianDataSchema;
export type AddTechnicianInput = z.infer<typeof AddTechnicianInputSchema>;

export async function addTechnicianAction(
  input: AddTechnicianInput,
  appId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const validatedInput = AddTechnicianInputSchema.parse(input);
    if (!db) {
      throw new Error('Firestore not initialized');
    }
     if (!appId) {
      throw new Error('App ID is required');
    }

    const techCollectionRef = collection(db, `artifacts/${appId}/public/data/technicians`);
    
    const newTechnicianPayload = {
      ...validatedInput,
      currentJobId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(techCollectionRef, newTechnicianPayload);

    return { data: { id: docRef.id }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in addTechnicianAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { data: null, error: `Failed to add technician. ${errorMessage}` };
  }
}

// Schema for updating an existing technician
const UpdateTechnicianInputSchema = TechnicianDataSchema.extend({
  id: z.string().min(1, 'Technician ID is required.'),
});
export type UpdateTechnicianInput = z.infer<typeof UpdateTechnicianInputSchema>;

export async function updateTechnicianAction(
  input: UpdateTechnicianInput,
  appId: string
): Promise<{ error: string | null }> {
  try {
    const { id, ...updateData } = UpdateTechnicianInputSchema.parse(input);
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    if (!appId) {
      throw new Error('App ID is required');
    }

    const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, id);

    await updateDoc(techDocRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in updateTechnicianAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { error: `Failed to update technician. ${errorMessage}` };
  }
}
