
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

    // Query for the job using the tracking token in the correct path
    const jobsQuery = query(
      collection(db, `artifacts/${appId}/public/data/jobs`),
      where('trackingToken', '==', token),
      limit(1)
    );

    const jobsSnapshot: QuerySnapshot = await getDocs(jobsQuery);

    if (jobsSnapshot.empty) {
      return { data: null, error: 'No job found with this tracking token.' };
    }

    const jobDoc = jobsSnapshot.docs[0];
    const job = { id: jobDoc.id, ...(jobDoc.data() as Job) };

    if (!job.assignedTechnicianId) {
      return { data: null, error: 'A technician has not yet been assigned to this job. Please check back later.' };
    }

    // Directly fetch the technician by ID using the correct path
    const technicianDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
    const technicianDocSnap: DocumentSnapshot = await getDoc(technicianDocRef);

    if (!technicianDocSnap.exists()) {
      console.warn(`Job ${job.id} references non-existent technician ID ${job.assignedTechnicianId}`);
      return { data: null, error: 'Could not retrieve technician details.' };
    }

    const technician = technicianDocSnap.data() as Technician;

    // Construct the public tracking info
    const publicTrackingInfo: PublicTrackingInfo = {
      jobTitle: job.title,
      jobStatus: job.status,
      scheduledStartTime: job.scheduledStartTime instanceof Timestamp ? job.scheduledStartTime.toDate().toISOString() : null,
      scheduledEndTime: job.scheduledEndTime instanceof Timestamp ? job.scheduledEndTime.toDate().toISOString() : null,
      actualStartTime: job.actualStartTime instanceof Timestamp ? job.actualStartTime.toDate().toISOString() : null,
      actualEndTime: job.actualEndTime instanceof Timestamp ? job.actualEndTime.toDate().toISOString() : null,
      technicianName: technician.name,
      technicianPhotoUrl: technician.photoUrl || null,
      technicianPhoneNumber: technician.phoneNumber || null,
      currentTechnicianLocation: technician.currentLocation || null, // Assuming currentLocation is stored on technician
      etaToJob: null, // You would need to calculate ETA dynamically or store it
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
