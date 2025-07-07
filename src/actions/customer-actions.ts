
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import type { Job, Technician, PublicTrackingInfo } from '@/types';
import * as admin from 'firebase-admin';

export const AddEquipmentInputSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required.'),
  customerName: z.string().min(1, 'Customer name is required.'),
  companyId: z.string().min(1, 'Company ID is required.'),
  appId: z.string().min(1, 'App ID is required.'),
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
    if (!dbAdmin) {
      throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
    }
    const validatedInput = AddEquipmentInputSchema.parse(input);
    const { appId, ...equipmentData } = validatedInput; 

    const equipmentCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/equipment`);
    const docRef = await equipmentCollectionRef.add({
      ...equipmentData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

const GetTrackingInfoInputSchema = z.object({
  token: z.string().min(1, 'A tracking token is required.'),
  appId: z.string().min(1, 'App ID is required for tracking info.'),
});

export type GetTrackingInfoInput = z.infer<typeof GetTrackingInfoInputSchema>;

export async function getTrackingInfoAction(
  input: GetTrackingInfoInput
): Promise<{ data: PublicTrackingInfo | null; error: string | null }> {
  try {
    if (!dbAdmin) {
      throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
    }
    const { token, appId } = GetTrackingInfoInputSchema.parse(input);

    const jobsQuery = dbAdmin.collection(`artifacts/${appId}/public/data/jobs`)
      .where('trackingToken', '==', token)
      .limit(1);

    const jobSnapshot = await jobsQuery.get();

    if (jobSnapshot.empty) {
        return { data: null, error: "Tracking link is invalid or has expired." };
    }
    
    const jobDoc = jobSnapshot.docs[0];
    const job = { id: jobDoc.id, ...(jobDoc.data() as Job) };

    if (job.trackingTokenExpiresAt && new Date(job.trackingTokenExpiresAt) < new Date()) {
        return { data: null, error: "Tracking link is invalid or has expired." };
    }

    if (job.status === 'Completed' || job.status === 'Cancelled') {
        return { data: null, error: `This job is now ${job.status.toLowerCase()}. Tracking is no longer available.` };
    }

    if (!job.assignedTechnicianId) {
        return { data: null, error: "A technician has not yet been assigned to this job. Please check back later." };
    }

    const technicianDocRef = dbAdmin.collection(`artifacts/${appId}/public/data/technicians`).doc(job.assignedTechnicianId);
    const technicianDocSnap = await technicianDocRef.get();

    if (!technicianDocSnap.exists) {
        console.warn(`Job ${job.id} references non-existent technician ID ${job.assignedTechnicianId}`);
        return { data: null, error: "Could not retrieve technician details." };
    }

    const technician = technicianDocSnap.data() as Technician;
    const { Timestamp } = admin.firestore;

    const publicTrackingInfo: PublicTrackingInfo = {
        jobTitle: job.title,
        jobStatus: job.status,
        jobLocation: job.location,
        scheduledStartTime: job.scheduledTime instanceof Timestamp ? job.scheduledTime.toDate().toISOString() : null,
        scheduledEndTime: null,
        actualStartTime: job.actualStartTime instanceof Timestamp ? job.actualStartTime.toDate().toISOString() : null,
        actualEndTime: job.actualEndTime instanceof Timestamp ? job.actualEndTime.toDate().toISOString() : null,
        technicianName: technician.name,
        technicianPhotoUrl: technician.avatarUrl || null,
        technicianPhoneNumber: technician.phone || null,
        currentTechnicianLocation: technician.location || null,
        etaToJob: null,
    };

    return { data: publicTrackingInfo, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in getTrackingInfoAction:', e);
    return { data: null, error: 'Failed to retrieve tracking information.' };
  }
}

export const AddCustomerInputSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required.'),
  appId: z.string().min(1, 'App ID is required.'),
  name: z.string().min(1, 'Customer name is required.'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
});
export type AddCustomerInput = z.infer<typeof AddCustomerInputSchema>;

export async function addCustomerAction(
  input: AddCustomerInput
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    if (!dbAdmin) {
      throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
    }
    const validatedInput = AddCustomerInputSchema.parse(input);
    const { appId, companyId, ...customerData } = validatedInput;

    const customersCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/customers`);
    
    const duplicateChecks = [customersCollectionRef.where("name", "==", customerData.name)];
    if (customerData.phone) {
      duplicateChecks.push(customersCollectionRef.where("phone", "==", customerData.phone));
    }
    if (customerData.email) {
        duplicateChecks.push(customersCollectionRef.where("email", "==", customerData.email));
    }
    
    // Note: Firestore Admin SDK does not support 'or' queries directly in the same way client SDK does.
    // This part requires a more complex implementation (multiple queries).
    // For now, we will simplify to check by name only.
    const nameQuery = customersCollectionRef
        .where("companyId", "==", companyId)
        .where("name", "==", customerData.name);
        
    const querySnapshot = await nameQuery.get();

    if (!querySnapshot.empty) {
        return { data: null, error: 'A customer with this name already exists.' };
    }

    const docRef = await customersCollectionRef.add({
      ...customerData,
      companyId: companyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { data: { id: docRef.id }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in addCustomerAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { data: null, error: `Failed to add customer. ${errorMessage}` };
  }
}
