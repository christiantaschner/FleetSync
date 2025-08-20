
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import type { Job, Technician, PublicTrackingInfo, CustomerData } from '@/types';
import * as admin from 'firebase-admin';
import { AddCustomerInputSchema } from '@/types';
import type { AddCustomerInput } from '@/types';


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
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { data: { id: `mock_equip_${Date.now()}` }, error: "Mock mode: Data is not saved." };
  }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
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
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in addEquipmentAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
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
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
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
        actualStartTime: job.inProgressAt instanceof Timestamp ? job.inProgressAt.toDate().toISOString() : null,
        actualEndTime: job.completedAt instanceof Timestamp ? job.completedAt.toDate().toISOString() : null,
        technicianName: technician.name,
        technicianPhotoUrl: technician.avatarUrl || null,
        technicianPhoneNumber: technician.phone || null,
        currentTechnicianLocation: technician.location || null,
        etaToJob: null,
        customerName: job.customerName,
    };

    return { data: publicTrackingInfo, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in getTrackingInfoAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}

export const UpsertCustomerInputSchema = AddCustomerInputSchema.extend({
  id: z.string().optional(),
});
export type UpsertCustomerInput = z.infer<typeof UpsertCustomerInputSchema>;

export async function upsertCustomerAction(
  input: UpsertCustomerInput
): Promise<{ data: { id: string } | null; error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { data: { id: input.id || `mock_cust_${Date.now()}` }, error: "Mock mode: Data is not saved." };
  }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
    const validatedInput = UpsertCustomerInputSchema.parse(input);
    const { id, appId, companyId, ...customerData } = validatedInput;

    const customersCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/customers`);

    // Check for existing customer with the same name if we are creating a new one
    if (!id) {
        const nameQuery = customersCollectionRef
            .where("companyId", "==", companyId)
            .where("name", "==", customerData.name);
        const querySnapshot = await nameQuery.get();
        if (!querySnapshot.empty) {
            return { data: null, error: 'A customer with this name already exists.' };
        }
    }
    
    if (id) {
      // Update existing customer
      const docRef = dbAdmin.collection(`artifacts/${appId}/public/data/customers`).doc(id);
      await docRef.update({
        ...customerData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { data: { id }, error: null };
    } else {
      // Add new customer
      const docRef = await customersCollectionRef.add({
        ...customerData,
        companyId: companyId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { data: { id: docRef.id }, error: null };
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in upsertCustomerAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}
