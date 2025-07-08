
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { getDoc, doc } from 'firebase/firestore';

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
  appId: z.string().min(1, 'App ID is required'),
});
export type UpdateTechnicianInput = z.infer<typeof UpdateTechnicianInputSchema>;

export async function updateTechnicianAction(
  input: UpdateTechnicianInput,
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    
    const { id, appId, ...updateData } = UpdateTechnicianInputSchema.parse(input);

    const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(id);

    // Security Check: Verify the technician belongs to the calling user's company
    const techSnap = await techDocRef.get();
    if (!techSnap.exists() || techSnap.data()?.companyId !== updateData.companyId) {
        throw new Error("Permission denied. You can only edit technicians in your own company.");
    }

    await techDocRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in updateTechnicianAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to update technician. ${errorMessage}` };
  }
}

    