
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import type { Job, Technician, PublicTrackingInfo, CustomerData, AddEquipmentInput } from '@/types';
import * as admin from 'firebase-admin';
import { AddCustomerInputSchema, AddEquipmentInputSchema, UpsertCustomerInputSchema } from '@/types';
import type { UpsertCustomerInput } from '@/types';
import { addMonths } from 'date-fns';

const calculateNextMaintenanceDate = (installDate: string, frequency: AddEquipmentInput['maintenanceFrequency']): string | undefined => {
  if (!frequency || frequency === 'None' || !installDate) return undefined;
  
  const date = new Date(installDate);
  switch (frequency) {
    case 'Monthly': return addMonths(date, 1).toISOString();
    case 'Quarterly': return addMonths(date, 3).toISOString();
    case 'Semi-Annually': return addMonths(date, 6).toISOString();
    case 'Annually': return addMonths(date, 12).toISOString();
    default: return undefined;
  }
};


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

    const nextMaintenanceDate = equipmentData.installDate 
      ? calculateNextMaintenanceDate(equipmentData.installDate, equipmentData.maintenanceFrequency)
      : undefined;

    const equipmentPayload = {
      ...equipmentData,
      nextMaintenanceDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const equipmentCollectionRef = dbAdmin.collection(`artifacts/${appId}/public/data/equipment`);
    const docRef = await equipmentCollectionRef.add(equipmentPayload);

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
        return { data: null, error: "Tracking link has expired." };
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

    // Normalize name for querying
    const normalizedName = customerData.name.trim().toLowerCase();
    
    // If an ID is provided, it's an update.
    if (id) {
      const docRef = customersCollectionRef.doc(id);
      await docRef.update({
        ...customerData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { data: { id }, error: null };
    }

    // If no ID, it's an insert or potential upsert based on name.
    // Check for an existing customer with the same normalized name.
    const nameQuery = customersCollectionRef
        .where("companyId", "==", companyId)
        .where("name_normalized", "==", normalizedName);
        
    const querySnapshot = await nameQuery.get();
    
    if (!querySnapshot.empty) {
        // Customer exists, update their info if needed. This makes the action an "upsert".
        const existingDocRef = querySnapshot.docs[0].ref;
        await existingDocRef.update({
            ...customerData, // Update with potentially new phone/email/address
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { data: { id: existingDocRef.id }, error: null };
    } else {
      // No existing customer, create a new one.
      const docRef = await customersCollectionRef.add({
        ...customerData,
        name_normalized: normalizedName, // Store the normalized name for future lookups
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
