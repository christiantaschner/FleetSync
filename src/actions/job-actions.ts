'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import type { Job, JobStatus } from '@/types';

// --- Update Job Status ---
const UpdateJobStatusInputSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Pending Invoice', 'Finished', 'Cancelled', 'Draft']),
  appId: z.string().min(1),
});
export type UpdateJobStatusInput = z.infer<typeof UpdateJobStatusInputSchema>;

export async function updateJobStatusAction(
  input: UpdateJobStatusInput
): Promise<{ error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { error: null }; // In mock mode, we assume success
  }
  try {
    if (!dbAdmin) {
      throw new Error('Firestore Admin SDK not initialized.');
    }
    const { jobId, status, appId } = UpdateJobStatusInputSchema.parse(input);
    const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);

    const updatePayload: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'En Route') updatePayload.enRouteAt = serverTimestamp();
    if (status === 'In Progress') updatePayload.inProgressAt = serverTimestamp();
    if (status === 'Completed') updatePayload.completedAt = serverTimestamp();
    if (status === 'Finished') updatePayload.finishedAt = serverTimestamp();

    await updateDoc(jobDocRef, updatePayload);

    // If job is completed or cancelled, free up the technician
    if (status === 'Completed' || status === 'Cancelled' || status === 'Finished') {
      const jobSnap = await jobDocRef.get();
      const job = jobSnap.data() as Job;
      if (job.assignedTechnicianId) {
        const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
        await updateDoc(techDocRef, {
            isAvailable: true,
            currentJobId: null,
        });
      }
    }
    
    return { error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(`Error updating job status: ${errorMessage}`);
    return { error: `Failed to update job status. ${errorMessage}` };
  }
}

// --- Add Job Documentation ---
const AddDocumentationInputSchema = z.object({
    jobId: z.string().min(1),
    appId: z.string().min(1),
    notes: z.string().optional(),
    photoUrls: z.array(z.string().url()).optional(),
    isFirstTimeFix: z.boolean(),
    reasonForFollowUp: z.string().optional(),
    signatureUrl: z.string().url().optional().nullable(),
    satisfactionScore: z.number().min(0).max(5).optional(),
});
export type AddDocumentationInput = z.infer<typeof AddDocumentationInputSchema>;

export async function addDocumentationAction(input: AddDocumentationInput): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: null };
    }
    try {
        if (!dbAdmin) throw new Error('Firestore Admin SDK not initialized.');
        const { jobId, appId, notes, photoUrls, isFirstTimeFix, reasonForFollowUp, signatureUrl, satisfactionScore } = AddDocumentationInputSchema.parse(input);
        const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);
        
        const updatePayload: any = {
            updatedAt: serverTimestamp(),
            isFirstTimeFix: isFirstTimeFix,
            reasonForFollowUp: isFirstTimeFix ? '' : reasonForFollowUp || '',
        };

        if (notes?.trim()) {
            const newNote = `\n--- ${new Date().toLocaleString()} ---\n${notes.trim()}`;
            updatePayload.notes = arrayUnion(newNote);
        }

        if (photoUrls && photoUrls.length > 0) {
            updatePayload.photos = arrayUnion(...photoUrls);
        }
        
        if (signatureUrl) {
            updatePayload.customerSignatureUrl = signatureUrl;
            updatePayload.customerSignatureTimestamp = new Date().toISOString();
        }
        
        if (satisfactionScore && satisfactionScore > 0) {
            updatePayload.customerSatisfactionScore = satisfactionScore;
        }

        await updateDoc(jobDocRef, updatePayload);
        return { error: null };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Error adding documentation: ${errorMessage}`);
        return { error: `Failed to add documentation. ${errorMessage}` };
    }
}
