
'use server';

import { z } from 'zod';
import { getDbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

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
    const dbAdmin = getDbAdmin();
    if (!appId) {
      throw new Error('App ID is required');
    }
    const { id, ...updateData } = UpdateTechnicianInputSchema.parse(input);

    const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(id);

    await techDocRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
