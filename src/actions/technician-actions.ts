
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { getDoc, doc } from 'firebase/firestore';
import { BusinessDaySchema } from '@/types';

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
  avatarUrl: z.string().url().optional().nullable(),
  workingHours: z.array(BusinessDaySchema).length(7).optional(),
  isOnCall: z.boolean().optional(),
  hourlyCost: z.number().optional(),
  commissionRate: z.number().optional(),
  bonus: z.number().optional(),
  maxDailyHours: z.number().optional(),
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    
    const { id, appId, ...updateData } = UpdateTechnicianInputSchema.parse(input);

    const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(id);

    const techSnap = await techDocRef.get();
    if (!techSnap.exists() || techSnap.data()?.companyId !== updateData.companyId) {
        throw new Error("Permission denied. You can only edit technicians in your own company.");
    }
    
    // Construct the payload to ensure no undefined fields are sent, which can cause errors.
    const payloadToUpdate = {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        skills: updateData.skills || [],
        isAvailable: updateData.isAvailable,
        location: updateData.location,
        avatarUrl: updateData.avatarUrl,
        workingHours: updateData.workingHours,
        isOnCall: updateData.isOnCall,
        hourlyCost: updateData.hourlyCost,
        commissionRate: updateData.commissionRate,
        bonus: updateData.bonus,
        maxDailyHours: updateData.maxDailyHours,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };


    await techDocRef.update(payloadToUpdate);

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

const ToggleOnCallStatusInputSchema = z.object({
  companyId: z.string().min(1),
  appId: z.string().min(1),
  technicianId: z.string().min(1),
  isOnCall: z.boolean(),
});
export type ToggleOnCallStatusInput = z.infer<typeof ToggleOnCallStatusInputSchema>;

export async function toggleOnCallStatusAction(
  input: ToggleOnCallStatusInput,
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        // In mock mode, we don't save, but we also don't want to show an error.
        // Returning null indicates success to the frontend.
        return { error: null };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
    const { companyId, appId, technicianId, isOnCall } = ToggleOnCallStatusInputSchema.parse(input);

    const techDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(technicianId);
    
    const techSnap = await techDocRef.get();
    if (!techSnap.exists() || techSnap.data()?.companyId !== companyId) {
        return { error: "Permission denied or technician not found." };
    }

    await techDocRef.update({
      isOnCall,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in toggleOnCallStatusAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: `Failed to update on-call status. ${errorMessage}` };
  }
}

    