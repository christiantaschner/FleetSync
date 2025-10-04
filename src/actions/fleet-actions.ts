

"use server";

import { z } from "zod";
import { dbAdmin } from '@/lib/firebase-admin';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, deleteField, addDoc, updateDoc, arrayUnion, getDoc, limit, orderBy, deleteDoc, arrayRemove } from "firebase/firestore";
import type { Job, JobStatus, ProfileChangeRequest, Technician, Contract, Location, Company, DispatcherFeedback, OptimizationSuggestion, JobFlexibility } from "@/types";
import { add, addDays, addMonths, addWeeks, addHours, isSameDay } from 'date-fns';
import crypto from 'crypto';

// Import all required schemas and types from the central types file
import {
  ConfirmManualRescheduleInputSchema,
  ApproveProfileChangeRequestInputSchema,
  RejectProfileChangeRequestInputSchema,
  ReassignJobInputSchema,
} from "@/types";


const JobImportSchema = z.object({
    title: z.string().min(1, "Title is required."),
    description: z.string().optional(),
    priority: z.enum(['High', 'Medium', 'Low']),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    address: z.string().min(1, "Address is required."),
    scheduledTime: z.string().optional(), // ISO string
    estimatedDurationMinutes: z.number().min(1, "Estimated duration is required and must be at least 1."),
    requiredSkills: z.array(z.string()).optional(),
    requiredParts: z.array(z.string()).optional(),
    quotedValue: z.number().optional(),
    expectedPartsCost: z.number().optional(),
    slaDeadline: z.string().optional(), // ISO string
    flexibility: z.enum(['fixed', 'flexible', 'soft_window']).optional(),
    dispatchLocked: z.boolean().optional(),
});

const ImportJobsActionInputSchema = z.object({
  companyId: z.string(),
  appId: z.string().min(1),
  jobs: z.array(JobImportSchema),
});


export type ImportJobsActionInput = z.infer<typeof ImportJobsActionInputSchema>;

export async function importJobsAction(
  input: ImportJobsActionInput
): Promise<{ data: { successCount: number }; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { data: { successCount: input.jobs.length }, error: "Mock mode: Data is not saved." };
    }
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        const { companyId, jobs, appId } = ImportJobsActionInputSchema.parse(input);

        const batch = writeBatch(dbAdmin);
        let successCount = 0;

        const jobsCollectionRef = collection(dbAdmin, `artifacts/${appId}/public/data/jobs`);

        for (const jobData of jobs) {
            const newJobRef = doc(jobsCollectionRef);
            
            const finalPayload: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
              companyId,
              title: jobData.title,
              description: jobData.description || "",
              priority: jobData.priority,
              status: 'Unassigned' as JobStatus,
              customerName: jobData.customerName || "N/A",
              customerPhone: jobData.customerPhone || "N/A",
              location: {
                  address: jobData.address,
                  latitude: 0,
                  longitude: 0,
              },
              scheduledTime: jobData.scheduledTime || null,
              estimatedDurationMinutes: jobData.estimatedDurationMinutes,
              requiredSkills: jobData.requiredSkills || [],
              requiredParts: jobData.requiredParts || [],
              assignedTechnicianId: null,
              notes: 'Imported via CSV.',
              photos: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              quotedValue: jobData.quotedValue,
              expectedPartsCost: jobData.expectedPartsCost,
              slaDeadline: jobData.slaDeadline,
              flexibility: jobData.flexibility || 'flexible',
              dispatchLocked: jobData.dispatchLocked || false,
            };
            
            batch.set(newJobRef, finalPayload);
            successCount++;
        }

        await batch.commit();

        return { data: { successCount }, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: { successCount: 0 }, error: e.errors.map(err => err.message).join(", ") };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error in importJobsAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { data: { successCount: 0 }, error: `Failed to import jobs. ${errorMessage}` };
    }
}


const HandleTechnicianUnavailabilityInputSchema = z.object({
  companyId: z.string(),
  technicianId: z.string().min(1, "Technician ID is required."),
  reason: z.string().optional(),
  unavailableFrom: z.string().optional(),
  unavailableUntil: z.string().optional(),
  appId: z.string().min(1),
});

export async function handleTechnicianUnavailabilityAction(
  input: z.infer<typeof HandleTechnicianUnavailabilityInputSchema>
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, technicianId, reason, unavailableFrom, unavailableUntil, appId } = HandleTechnicianUnavailabilityInputSchema.parse(input);
    
    const batch = writeBatch(dbAdmin);
    
    const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, technicianId);
    const techSnap = await getDoc(techDocRef);
    if (!techSnap.exists() || techSnap.data().companyId !== companyId) {
        return { error: "Technician not found or does not belong to your company." };
    }

    batch.update(techDocRef, {
        isAvailable: false,
        currentJobId: null,
        unavailabilityReason: reason || null,
        unavailableFrom: unavailableFrom || null,
        unavailableUntil: unavailableUntil || null,
    });

    const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
    const jobsQuery = query(
      collection(dbAdmin, `artifacts/${appId}/public/data/jobs`),
      where("companyId", "==", companyId),
      where("assignedTechnicianId", "==", technicianId),
      where("status", "in", activeJobStatuses)
    );
    const querySnapshot = await getDocs(jobsQuery);

    querySnapshot.forEach((jobDoc) => {
      batch.update(jobDoc.ref, {
        status: "Unassigned" as JobStatus,
        assignedTechnicianId: null,
        notes: arrayUnion(`(Reassigned: Technician marked as unavailable${reason ? `: ${reason}` : ''})`)
      });
    });

    await batch.commit();

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in handleTechnicianUnavailabilityAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to handle technician unavailability. ${errorMessage}` };
  }
}

export async function confirmManualRescheduleAction(
  input: z.infer<typeof ConfirmManualRescheduleInputSchema>
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, movedJobId, newScheduledTime, aiSuggestedTechnicianId, aiReasoning, appId } = ConfirmManualRescheduleInputSchema.parse(input);

    const batch = writeBatch(dbAdmin);

    const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, movedJobId);
    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
        return { error: `Job ${movedJobId} not found or does not belong to your company.` };
    }
    

    batch.update(jobDocRef, { 
      scheduledTime: newScheduledTime,
      updatedAt: serverTimestamp(),
     });


    if (aiSuggestedTechnicianId && aiReasoning) {
        const feedback: DispatcherFeedback = {
            companyId,
            jobId: movedJobId,
            aiSuggestedTechnicianId,
            dispatcherSelectedTechnicianId: 'manual_reschedule',
            aiReasoning,
            dispatcherReasoning: "Dispatcher manually adjusted the schedule, overriding the initial AI placement.",
            createdAt: new Date().toISOString(),
        };
        const feedbackRef = doc(collection(dbAdmin, `artifacts/${appId}/public/data/dispatcherFeedback`));
        batch.set(feedbackRef, feedback);
    }

    await batch.commit();

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in confirmManualRescheduleAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to confirm reschedule. ${errorMessage}` };
  }
}

const RequestProfileChangeInputSchema = z.object({
  companyId: z.string(),
  appId: z.string().min(1),
  technicianId: z.string().min(1),
  technicianName: z.string().min(1),
  requestedChanges: z.record(z.any()), // Simple object for changes
  notes: z.string().optional(),
});

export async function requestProfileChangeAction(
  input: z.infer<typeof RequestProfileChangeInputSchema>
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, technicianId, technicianName, requestedChanges, notes, appId } = RequestProfileChangeInputSchema.parse(input);
    
    const requestsCollectionRef = collection(dbAdmin, `artifacts/${appId}/public/data/profileChangeRequests`);
    
    const newRequest: Omit<ProfileChangeRequest, 'id'> = {
        companyId,
        technicianId,
        technicianName,
        requestedChanges,
        notes: notes || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    await addDoc(requestsCollectionRef, newRequest);

    return { error: null };

  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in requestProfileChangeAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to submit profile change request. ${errorMessage}` };
  }
}

export async function approveProfileChangeRequestAction(
  input: z.infer<typeof ApproveProfileChangeRequestInputSchema>
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, requestId, technicianId, approvedChanges, reviewNotes, appId } = ApproveProfileChangeRequestInputSchema.parse(input);

    const requestDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/profileChangeRequests`, requestId);
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data().companyId !== companyId) {
        return { error: "Request not found or you do not have permission to modify it." };
    }
    
    const batch = writeBatch(dbAdmin);

    if (Object.keys(approvedChanges).length > 0) {
        const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, technicianId);
        batch.update(techDocRef, {
            ...approvedChanges,
            updatedAt: serverTimestamp(),
        });
    }

    batch.update(requestDocRef, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      approvedChanges: approvedChanges,
      reviewNotes: reviewNotes || '',
    });

    await batch.commit();
    return { error: null };

  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in approveProfileChangeRequestAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to approve request. ${errorMessage}` };
  }
}

export async function rejectProfileChangeRequestAction(
  input: z.infer<typeof RejectProfileChangeRequestInputSchema>
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, requestId, reviewNotes, appId } = RejectProfileChangeRequestInputSchema.parse(input);

    const requestDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/profileChangeRequests`, requestId);
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data().companyId !== companyId) {
        return { error: "Request not found or you do not have permission to modify it." };
    }

    await updateDoc(requestDocRef, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || '',
    });

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in rejectProfileChangeRequestAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to reject request. ${errorMessage}` };
  }
}

export async function reassignJobAction(
  input: z.infer<typeof ReassignJobInputSchema> & { newScheduledTime?: string }
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: null };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, jobId, newTechnicianId, reason, appId, newScheduledTime } = ReassignJobInputSchema.extend({ newScheduledTime: z.string().optional() }).parse(input);

    const batch = writeBatch(dbAdmin);

    const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);
    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
        return { error: "Job not found or you do not have permission to modify it." };
    }
    const originalJob = jobSnap.data() as Job;

    const updatePayload: any = {
      assignedTechnicianId: newTechnicianId,
      status: "Assigned" as JobStatus,
      updatedAt: serverTimestamp(),
      assignedAt: serverTimestamp(),
      routeOrder: deleteField(),
    };
    
    if (reason) {
        updatePayload.notes = arrayUnion(`(Reassigned by dispatcher: ${reason})`);
    }
    
    if (newScheduledTime) {
        updatePayload.scheduledTime = newScheduledTime;
    }

    batch.update(jobDocRef, updatePayload);

    // Free up old technician if they were assigned and changed
    if (originalJob.assignedTechnicianId && originalJob.assignedTechnicianId !== newTechnicianId) {
        const oldTechDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, originalJob.assignedTechnicianId);
        batch.update(oldTechDocRef, {
            isAvailable: true,
            currentJobId: null,
        });
    }

    // Assign new technician if not already assigned
    if (newTechnicianId && originalJob.assignedTechnicianId !== newTechnicianId) {
      const newTechDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, newTechnicianId);
      batch.update(newTechDocRef, {
          isAvailable: false,
          currentJobId: jobId,
      });
    }

    await batch.commit();
    return { error: null };

  } catch (e) {
     if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in reassignJobAction',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to reassign job. ${errorMessage}` };
  }
}

const GenerateRecurringJobsInputSchema = z.object({
  companyId: z.string(),
  appId: z.string().min(1),
  untilDate: z.string().describe("The date (ISO 8601 format) up to which jobs should be generated."),
});

export async function generateRecurringJobsAction(
  input: z.infer<typeof GenerateRecurringJobsInputSchema>
): Promise<{ data: { jobsCreated: number }; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { data: { jobsCreated: 5 }, error: "Mock mode: Data is not saved." };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, untilDate, appId } = GenerateRecurringJobsInputSchema.parse(input);
    const targetDate = new Date(untilDate);

    const contractsQuery = query(collection(dbAdmin, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", companyId));
    const querySnapshot = await getDocs(contractsQuery);
    
    const allContracts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
    const contracts = allContracts.filter(c => c.isActive === true).sort((a,b) => a.customerName.localeCompare(b.customerName));

    const batch = writeBatch(dbAdmin);
    let jobsCreated = 0;
    const jobsCollectionRef = collection(dbAdmin, `artifacts/${appId}/public/data/jobs`);

    for (const contract of contracts) {
      let currentDate = contract.lastGeneratedUntil ? addDays(new Date(contract.lastGeneratedUntil), 1) : new Date(contract.startDate);

      while (currentDate <= targetDate) {
        const newJobRef = doc(jobsCollectionRef);
        const newJobPayload = {
          ...contract.jobTemplate,
          companyId,
          customerName: contract.customerName,
          customerPhone: contract.customerPhone,
          location: { address: contract.customerAddress, latitude: 0, longitude: 0 },
          status: 'Unassigned' as JobStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          scheduledTime: currentDate.toISOString(),
          assignedTechnicianId: null,
          notes: `Generated from Contract ID: ${contract.id}`,
          sourceContractId: contract.id,
        };
        batch.set(newJobRef, newJobPayload);
        jobsCreated++;

        switch (contract.frequency) {
          case 'Weekly': currentDate = addWeeks(currentDate, 1); break;
          case 'Bi-Weekly': currentDate = addWeeks(currentDate, 2); break;
          case 'Monthly': currentDate = addMonths(currentDate, 1); break;
          case 'Quarterly': currentDate = addMonths(currentDate, 3); break;
          case 'Semi-Annually': currentDate = addMonths(currentDate, 6); break;
          case 'Annually': currentDate = addMonths(currentDate, 12); break;
          default: throw new Error(`Unknown frequency: ${contract.frequency}`);
        }
      }

      const contractDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/contracts`, contract.id!);
      batch.update(contractDocRef, { lastGeneratedUntil: targetDate.toISOString() });
    }

    await batch.commit();
    return { data: { jobsCreated }, error: null };
    
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: { jobsCreated: 0 }, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error generating recurring jobs',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { data: { jobsCreated: 0 }, error: `Failed to generate jobs. ${errorMessage}` };
  }
}

const GenerateTrackingLinkInputSchema = z.object({
    jobId: z.string(),
    companyId: z.string(),
    appId: z.string().min(1),
});
export type GenerateTrackingLinkInput = z.infer<typeof GenerateTrackingLinkInputSchema>;

export async function generateTrackingLinkAction(
    input: GenerateTrackingLinkInput
): Promise<{ data: { trackingUrl: string } | null; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const token = crypto.randomUUID();
        const trackingUrl = `/track/${token}?appId=${input.appId}`;
        return { data: { trackingUrl }, error: null };
    }
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        const { jobId, companyId, appId } = GenerateTrackingLinkInputSchema.parse(input);

        const token = crypto.randomUUID();
        const expiresAt = addHours(new Date(), 4); 

        const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);
        
        const jobSnap = await getDoc(jobDocRef);
        if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
            return { data: null, error: "Job not found or you do not have permission to modify it." };
        }

        await updateDoc(jobDocRef, {
            trackingToken: token,
            trackingTokenExpiresAt: expiresAt.toISOString(),
        });
        
        const trackingUrl = `/track/${token}?appId=${appId}`;

        return { data: { trackingUrl }, error: null };

    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error generating tracking link',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { data: null, error: `Failed to generate tracking link. ${errorMessage}` };
    }
}

const DeleteJobInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required."),
  companyId: z.string().min(1, "Company ID is required."),
  appId: z.string().min(1),
});

export async function deleteJobAction(
  input: z.infer<typeof DeleteJobInputSchema>
): Promise<{ error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { error: "Mock mode: Data is not saved." };
    }
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        const { jobId, companyId, appId } = DeleteJobInputSchema.parse(input);
        
        const batch = writeBatch(dbAdmin);
        const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);

        const jobSnap = await getDoc(jobDocRef);
        if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
            return { error: "Job not found or you do not have permission to delete it." };
        }
        
        const jobData = jobSnap.data() as Job;
        
        if (jobData.assignedTechnicianId) {
            const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, jobData.assignedTechnicianId);
            const techSnap = await getDoc(techDocRef);
            if (techSnap.exists() && techSnap.data().currentJobId === jobId) {
                batch.update(techDocRef, {
                    isAvailable: true,
                    currentJobId: null,
                });
            }
        }
        
        batch.delete(jobDocRef);
        
        await batch.commit();
        
        return { error: null };

    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error deleting job',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { error: `Failed to delete job. ${errorMessage}` };
    }
}
    
const GetTriageJobInfoInputSchema = z.object({
  token: z.string().min(1),
  appId: z.string().min(1),
});

export async function getTriageJobInfoAction(
  input: z.infer<typeof GetTriageJobInfoInputSchema>
): Promise<{ data: { jobTitle: string; customerName: string } | null; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return { data: { jobTitle: 'Mock Triage Job', customerName: 'Mock Customer' }, error: null };
    }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
    const { token, appId } = GetTriageJobInfoInputSchema.parse(input);

    const jobsQuery = query(
      collection(dbAdmin, `artifacts/${appId}/public/data/jobs`),
      where('triageToken', '==', token),
      limit(1)
    );
    const jobSnapshot = await getDocs(jobsQuery);

    if (jobSnapshot.empty) {
      return { data: null, error: "This link is invalid or has expired." };
    }
    
    const job = jobSnapshot.docs[0].data() as Job;

    if (job.triageTokenExpiresAt && new Date(job.triageTokenExpiresAt) < new Date()) {
      return { data: null, error: "This link has expired." };
    }

    return { data: { jobTitle: job.title, customerName: job.customerName }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error getting triage info',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { data: null, error: 'Failed to retrieve job information.' };
  }
}

const ConfirmFleetOptimizationInputSchema = z.object({
  companyId: z.string(),
  appId: z.string().min(1),
  changesToConfirm: z.array(z.any()), // Simplified for the action
});

export async function confirmFleetOptimizationAction(
  input: z.infer<typeof ConfirmFleetOptimizationInputSchema>
): Promise<{ error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { error: "Mock mode: Data is not saved." };
  }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, appId, changesToConfirm } = ConfirmFleetOptimizationInputSchema.parse(input);
    
    const batch = writeBatch(dbAdmin);

    for (const change of changesToConfirm as OptimizationSuggestion[]) {
      const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, change.jobId);
      
      const updatePayload: any = {
        updatedAt: serverTimestamp(),
        notes: arrayUnion(`(Reassigned via Fleet Optimization: ${change.justification})`)
      };

      if (change.newScheduledTime) {
        updatePayload.scheduledTime = change.newScheduledTime;
      }
      
      if (change.newTechnicianId !== change.originalTechnicianId) {
        updatePayload.assignedTechnicianId = change.newTechnicianId;
        updatePayload.status = change.newTechnicianId ? 'Assigned' : 'Unassigned';
        updatePayload.assignedAt = change.newTechnicianId ? serverTimestamp() : deleteField();
      }

      batch.update(jobDocRef, updatePayload);
    }
    
    await batch.commit();

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error confirming fleet optimization',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: `Failed to apply changes. ${errorMessage}` };
  }
}
