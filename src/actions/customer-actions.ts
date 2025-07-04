
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const validatedInput = AddEquipmentInputSchema.parse(input);
    const { appId, ...equipmentData } = validatedInput; 
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const equipmentCollectionRef = collection(db, `artifacts/${appId}/public/data/equipment`);
    const docRef = await addDoc(equipmentCollectionRef, {
      ...equipmentData,
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

import {
  query,
  where,
  limit,
  getDocs,
  getDoc,
  doc,
  QuerySnapshot,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { Job, Technician, PublicTrackingInfo } from '@/types';

const GetTrackingInfoInputSchema = z.object({
  token: z.string().min(1, 'A tracking token is required.'),
  appId: z.string().min(1, 'App ID is required for tracking info.'),
});

export type GetTrackingInfoInput = z.infer<typeof GetTrackingInfoInputSchema>;

export async function getTrackingInfoAction(
  input: GetTrackingInfoInput
): Promise<{ data: PublicTrackingInfo | null; error: string | null }> {
  try {
    const { token, appId } = GetTrackingInfoInputSchema.parse(input);
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const jobsQuery = query(
      collection(db, `artifacts/${appId}/public/data/jobs`),
      where('trackingToken', '==', token),
      limit(1)
    );

    const jobSnapshot: QuerySnapshot = await getDocs(jobsQuery);

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

    const technicianDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
    const technicianDocSnap: DocumentSnapshot = await getDoc(technicianDocRef);

    if (!technicianDocSnap.exists()) {
        console.warn(`Job ${job.id} references non-existent technician ID ${job.assignedTechnicianId}`);
        return { data: null, error: "Could not retrieve technician details." };
    }

    const technician = technicianDocSnap.data() as Technician;

    const publicTrackingInfo: PublicTrackingInfo = {
        jobTitle: job.title,
        jobStatus: job.status,
        jobLocation: job.location,
        scheduledStartTime: job.scheduledTime instanceof Timestamp ? job.scheduledTime.toDate().toISOString() : null,
        scheduledEndTime: null, // This can be calculated if needed: scheduledTime + estimatedDuration
        actualStartTime: job.actualStartTime instanceof Timestamp ? job.actualStartTime.toDate().toISOString() : null,
        actualEndTime: job.actualEndTime instanceof Timestamp ? job.actualEndTime.toDate().toISOString() : null,
        technicianName: technician.name,
        technicianPhotoUrl: technician.avatarUrl || null,
        technicianPhoneNumber: technician.phone || null,
        currentTechnicianLocation: technician.location || null,
        etaToJob: null, // This would need a dynamic calculation (e.g. Google Maps API call)
        customerName: job.customerName,
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
