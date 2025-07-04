
"use server";

import { allocateJob as allocateJobFlow } from "@/ai/flows/allocate-job";
import { optimizeRoutes as optimizeRoutesFlow } from "@/ai/flows/optimize-routes";
import { suggestJobSkills as suggestJobSkillsFlow } from "@/ai/flows/suggest-job-skills";
import { suggestJobPriority as suggestJobPriorityFlow } from "@/ai/flows/suggest-job-priority";
import { predictNextAvailableTechnicians as predictNextAvailableTechniciansFlow } from "@/ai/flows/predict-next-technician";
import { predictScheduleRisk as predictScheduleRiskFlow } from "@/ai/flows/predict-schedule-risk";
import { generateCustomerNotification as generateCustomerNotificationFlow } from "@/ai/flows/generate-customer-notification-flow";
import { suggestNextAppointment as suggestNextAppointmentFlow } from "@/ai/flows/suggest-next-appointment-flow";
import { troubleshootEquipment as troubleshootEquipmentFlow } from "@/ai/flows/troubleshoot-flow";
import { estimateTravelDistance as estimateTravelDistanceFlow } from "@/ai/flows/estimate-travel-distance-flow";
import { suggestScheduleTime as suggestScheduleTimeFlow } from "@/ai/flows/suggest-schedule-time";
import { z } from "zod";
import { db, storage } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, deleteField, addDoc, updateDoc, arrayUnion, getDoc, limit, orderBy, deleteDoc } from "firebase/firestore";
import type { Job, JobStatus, ProfileChangeRequest, Technician, Contract, Location, Company } from "@/types";
import { add, addDays, addMonths, addWeeks, addHours } from 'date-fns';
import crypto from 'crypto';

// Import all required schemas and types from the central types file
import {
  AllocateJobInputSchema,
  type AllocateJobInput,
  type AllocateJobOutput,
  OptimizeRoutesInputSchema,
  type OptimizeRoutesInput,
  type OptimizeRoutesOutput,
  SuggestJobSkillsInputSchema,
  type SuggestJobSkillsInput,
  type SuggestJobSkillsOutput,
  PredictNextAvailableTechniciansInputSchema,
  type PredictNextAvailableTechniciansInput,
  type PredictNextAvailableTechniciansOutput,
  OptimizeRoutesOutputSchema,
  ConfirmManualRescheduleInputSchema,
  SuggestJobPriorityInputSchema,
  type SuggestJobPriorityInput,
  type SuggestJobPriorityOutput,
  ApproveProfileChangeRequestInputSchema,
  RejectProfileChangeRequestInputSchema,
  PredictScheduleRiskInputSchema,
  type PredictScheduleRiskInput,
  type PredictScheduleRiskOutput,
  NotifyCustomerInputSchema,
  type NotifyCustomerInput,
  ReassignJobInputSchema,
  SuggestNextAppointmentInputSchema,
  type SuggestNextAppointmentInput,
  type SuggestNextAppointmentOutput,
  TroubleshootEquipmentInputSchema,
  type TroubleshootEquipmentInput,
  type TroubleshootEquipmentOutput,
  CalculateTravelMetricsInputSchema,
  SuggestScheduleTimeInputSchema,
  type SuggestScheduleTimeInput,
  type SuggestScheduleTimeOutput,
} from "@/types";


// Define action input types, aliasing from the central types file
export type AllocateJobActionInput = AllocateJobInput;

export async function allocateJobAction(
  input: AllocateJobActionInput
): Promise<{ data: AllocateJobOutput | null; error: string | null }> {
  try {
    const validatedInput = AllocateJobInputSchema.parse(input);
    const result = await allocateJobFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in allocateJobAction:", e);
    return { data: null, error: "Failed to allocate job. Please try again." };
  }
}

export async function optimizeRoutesAction(
  input: OptimizeRoutesInput
): Promise<{ data: OptimizeRoutesOutput | null; error: string | null }> {
  try {
    const validatedInput = OptimizeRoutesInputSchema.parse(input);
    const result = await optimizeRoutesFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in optimizeRoutesAction:", e);
    return { data: null, error: "Failed to optimize routes. Please try again." };
  }
}

export type SuggestJobSkillsActionInput = SuggestJobSkillsInput;

export async function suggestJobSkillsAction(
  input: SuggestJobSkillsActionInput
): Promise<{ data: SuggestJobSkillsOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestJobSkillsInputSchema.parse(input);
    const result = await suggestJobSkillsFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in suggestJobSkillsAction:", e);
    return { data: null, error: "Failed to suggest skills. Please try again." };
  }
}

export type SuggestJobPriorityActionInput = SuggestJobPriorityInput;

export async function suggestJobPriorityAction(
  input: SuggestJobPriorityActionInput
): Promise<{ data: SuggestJobPriorityOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestJobPriorityInputSchema.parse(input);
    const result = await suggestJobPriorityFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in suggestJobPriorityAction:", e);
    return { data: null, error: "Failed to suggest job priority. Please try again." };
  }
}


const JobImportSchema = z.object({
    title: z.string().min(1, "Title is required."),
    description: z.string().min(1, "Description is required."),
    priority: z.enum(['High', 'Medium', 'Low']),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    address: z.string().min(1, "Address is required."),
    scheduledTime: z.string().optional(), // ISO string
    estimatedDurationMinutes: z.number().optional(),
    requiredSkills: z.array(z.string()).optional(),
});

const ImportJobsActionInputSchema = z.object({
  companyId: z.string(),
  jobs: z.array(JobImportSchema),
});


export type ImportJobsActionInput = z.infer<typeof ImportJobsActionInputSchema>;

export async function importJobsAction(
  input: ImportJobsActionInput
): Promise<{ data: { successCount: number }; error: string | null }> {
    try {
        const { companyId, jobs } = ImportJobsActionInputSchema.parse(input);
        if (!db) {
            throw new Error("Firestore not initialized");
        }
        const batch = writeBatch(db);
        let successCount = 0;

        const jobsCollectionRef = collection(db, "jobs");

        for (const jobData of jobs) {
            const newJobRef = doc(jobsCollectionRef);
            
            const finalPayload = {
              companyId,
              title: jobData.title,
              description: jobData.description,
              priority: jobData.priority,
              status: 'Pending' as JobStatus,
              customerName: jobData.customerName || "N/A",
              customerPhone: jobData.customerPhone || "N/A",
              location: {
                  address: jobData.address,
                  latitude: 0,
                  longitude: 0,
              },
              scheduledTime: jobData.scheduledTime,
              estimatedDurationMinutes: jobData.estimatedDurationMinutes || 0,
              requiredSkills: jobData.requiredSkills || [],
              assignedTechnicianId: null,
              notes: 'Imported via CSV.',
              photos: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            batch.set(newJobRef, finalPayload);
            successCount++;
        }

        await batch.commit();

        return { data: { successCount }, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map(err => err.message).join(", ") };
        }
        console.error("Error in importJobsAction:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `Failed to import jobs. ${errorMessage}` };
    }
}


export type PredictNextAvailableTechniciansActionInput = PredictNextAvailableTechniciansInput;

export async function predictNextAvailableTechniciansAction(
  input: PredictNextAvailableTechniciansActionInput
): Promise<{ data: PredictNextAvailableTechniciansOutput | null; error: string | null }> {
  try {
    const validatedInput = PredictNextAvailableTechniciansInputSchema.parse(input);
    const result = await predictNextAvailableTechniciansFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in predictNextAvailableTechniciansAction:", e);
    return { data: null, error: "Failed to predict next available technicians." };
  }
}

const HandleTechnicianUnavailabilityInputSchema = z.object({
  companyId: z.string(),
  technicianId: z.string().min(1, "Technician ID is required."),
  reason: z.string().optional(),
  unavailableUntil: z.string().optional(),
});

export async function handleTechnicianUnavailabilityAction(
  input: z.infer<typeof HandleTechnicianUnavailabilityInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { companyId, technicianId, reason, unavailableUntil } = HandleTechnicianUnavailabilityInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    const batch = writeBatch(db);
    
    // 1. Mark technician as unavailable
    const techDocRef = doc(db, "technicians", technicianId);
    batch.update(techDocRef, {
        isAvailable: false,
        currentJobId: null,
        unavailabilityReason: reason || null,
        unavailableUntil: unavailableUntil || null,
    });

    // 2. Find and unassign active jobs for that company
    const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
    const jobsQuery = query(
      collection(db, "jobs"),
      where("companyId", "==", companyId),
      where("assignedTechnicianId", "==", technicianId),
      where("status", "in", activeJobStatuses)
    );
    const querySnapshot = await getDocs(jobsQuery);

    querySnapshot.forEach((jobDoc) => {
      batch.update(jobDoc.ref, {
        status: "Pending" as JobStatus,
        assignedTechnicianId: null,
      });
    });

    // 3. Commit all changes
    await batch.commit();

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in handleTechnicianUnavailabilityAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to handle technician unavailability. ${errorMessage}` };
  }
}


const ConfirmOptimizedRouteInputSchema = z.object({
  technicianId: z.string().min(1, "Technician ID is required."),
  optimizedRoute: OptimizeRoutesOutputSchema.shape.optimizedRoute,
  jobsNotInRoute: z.array(z.string()).describe("A list of job IDs that were assigned to the tech but not included in this optimization, to have their routeOrder cleared."),
});

export async function confirmOptimizedRouteAction(
  input: z.infer<typeof ConfirmOptimizedRouteInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { optimizedRoute, jobsNotInRoute } = ConfirmOptimizedRouteInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    const batch = writeBatch(db);

    // Set new route order for optimized jobs
    optimizedRoute.forEach((step, index) => {
      const jobDocRef = doc(db, "jobs", step.taskId);
      batch.update(jobDocRef, { routeOrder: index });
    });
    
    // Clear route order for jobs that were unselected from optimization
    jobsNotInRoute.forEach((jobId) => {
      const jobDocRef = doc(db, "jobs", jobId);
      batch.update(jobDocRef, { routeOrder: deleteField() });
    });

    await batch.commit();

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in confirmOptimizedRouteAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to confirm optimized route. ${errorMessage}` };
  }
}


export async function confirmManualRescheduleAction(
  input: z.infer<typeof ConfirmManualRescheduleInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { movedJobId, newScheduledTime, optimizedRoute } = ConfirmManualRescheduleInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    const batch = writeBatch(db);

    // Update the moved job with its new time
    const movedJobRef = doc(db, "jobs", movedJobId);
    batch.update(movedJobRef, { 
      scheduledTime: newScheduledTime,
      updatedAt: serverTimestamp(),
     });

    // Set new route order for all jobs in the optimized route
    optimizedRoute.forEach((step, index) => {
      const jobDocRef = doc(db, "jobs", step.taskId);
      batch.update(jobDocRef, { 
        routeOrder: index,
        // Also update timestamp for all jobs in the sequence
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in confirmManualRescheduleAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to confirm reschedule. ${errorMessage}` };
  }
}

const RequestProfileChangeInputSchema = z.object({
  companyId: z.string(),
  technicianId: z.string().min(1),
  technicianName: z.string().min(1),
  requestedChanges: z.record(z.any()), // Simple object for changes
  notes: z.string().optional(),
});

export async function requestProfileChangeAction(
  input: z.infer<typeof RequestProfileChangeInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { companyId, technicianId, technicianName, requestedChanges, notes } = RequestProfileChangeInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    
    const requestsCollectionRef = collection(db, "profileChangeRequests");
    
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
    console.error("Error in requestProfileChangeAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to submit profile change request. ${errorMessage}` };
  }
}

export async function approveProfileChangeRequestAction(
  input: z.infer<typeof ApproveProfileChangeRequestInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { requestId, technicianId, approvedChanges, reviewNotes } = ApproveProfileChangeRequestInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    
    const batch = writeBatch(db);

    // 1. Update the technician's document if there are changes
    if (Object.keys(approvedChanges).length > 0) {
        const techDocRef = doc(db, "technicians", technicianId);
        batch.update(techDocRef, {
            ...approvedChanges,
            updatedAt: serverTimestamp(),
        });
    }

    // 2. Update the request's status
    const requestDocRef = doc(db, "profileChangeRequests", requestId);
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
    console.error("Error in approveProfileChangeRequestAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to approve request. ${errorMessage}` };
  }
}

export async function rejectProfileChangeRequestAction(
  input: z.infer<typeof RejectProfileChangeRequestInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { requestId, reviewNotes } = RejectProfileChangeRequestInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    const requestDocRef = doc(db, "profileChangeRequests", requestId);
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
    console.error("Error in rejectProfileChangeRequestAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to reject request. ${errorMessage}` };
  }
}


export type CheckScheduleHealthResult = {
  technician: Technician;
  currentJob: Job;
  nextJob: Job | null;
  risk?: PredictScheduleRiskOutput | null;
  error?: string;
};

export async function checkScheduleHealthAction(
  { technicians, jobs }: { technicians: Technician[], jobs: Job[] }
): Promise<{ data: CheckScheduleHealthResult[] | null; error: string | null }> {
  try {
    const busyTechnicians = technicians.filter(t => !t.isAvailable && t.currentJobId);
    if (busyTechnicians.length === 0) {
      return { data: [], error: null };
    }

    const results: CheckScheduleHealthResult[] = await Promise.all(
      busyTechnicians.map(async (tech) => {
        const currentJob = jobs.find(j => j.id === tech.currentJobId);
        if (!currentJob || currentJob.status !== 'In Progress' || !currentJob.inProgressAt) {
          return { technician: tech, currentJob: currentJob!, nextJob: null, error: 'Technician not on an active, in-progress job.' };
        }

        const technicianJobs = jobs
          .filter(j => j.assignedTechnicianId === tech.id && j.status === 'Assigned')
          .sort((a, b) => (a.routeOrder ?? Infinity) - (b.routeOrder ?? Infinity));

        const nextJob = technicianJobs.length > 0 ? technicianJobs[0] : null;

        if (!nextJob) {
          return { technician: tech, currentJob, nextJob: null };
        }

        const input: PredictScheduleRiskInput = {
          currentTime: new Date().toISOString(),
          technician: {
            technicianId: tech.id,
            technicianName: tech.name,
            currentLocation: tech.location,
          },
          currentJob: {
            jobId: currentJob.id,
            location: currentJob.location,
            startedAt: currentJob.inProgressAt,
            estimatedDurationMinutes: currentJob.estimatedDurationMinutes || 60,
          },
          nextJob: {
            jobId: nextJob.id,
            location: nextJob.location,
            scheduledTime: nextJob.scheduledTime,
          }
        };

        const riskResult = await predictScheduleRiskFlow(input);
        return { technician: tech, currentJob, nextJob, risk: riskResult };
      })
    );

    return { data: results, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in checkScheduleHealthAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error: `Failed to check schedule health. ${errorMessage}` };
  }
}

export async function notifyCustomerAction(
  input: NotifyCustomerInput
): Promise<{ data: { message: string } | null; error: string | null }> {
  try {
    const validatedInput = NotifyCustomerInputSchema.parse(input);
    
    // Have an AI generate the message for a more professional touch
    const notificationResult = await generateCustomerNotificationFlow({
        customerName: validatedInput.customerName,
        technicianName: validatedInput.technicianName,
        jobTitle: validatedInput.jobTitle,
        delayMinutes: validatedInput.delayMinutes,
        newTime: validatedInput.newTime,
        reasonForChange: validatedInput.reasonForChange,
    });

    const message = notificationResult.message;
    
    // In a real application, this would integrate with an SMS/Email service like Twilio.
    // For this demo, we'll log it and return the message to be displayed in a toast.
    console.log(`Simulating notification for job ${validatedInput.jobId}: "${message}"`);
    
    return { data: { message }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in notifyCustomerAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error: `Failed to simulate notification. ${errorMessage}` };
  }
}

export async function reassignJobAction(
  input: z.infer<typeof ReassignJobInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { companyId, jobId, newTechnicianId, reason } = ReassignJobInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    const batch = writeBatch(db);

    const jobDocRef = doc(db, "jobs", jobId);
    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
        return { error: "Job not found or you do not have permission to modify it." };
    }
    
    const updatePayload: any = {
      assignedTechnicianId: newTechnicianId,
      status: "Assigned" as JobStatus,
      updatedAt: serverTimestamp(),
      assignedAt: serverTimestamp(),
      routeOrder: deleteField(), // Clear route order as it belongs to a new tech's route
    };
    
    if (reason) {
        updatePayload.notes = arrayUnion(`(Reassigned by dispatcher: ${reason})`);
    }

    batch.update(jobDocRef, updatePayload);

    const newTechDocRef = doc(db, "technicians", newTechnicianId);
    batch.update(newTechDocRef, {
        isAvailable: false
    });

    await batch.commit();
    return { error: null };

  } catch (e) {
     if (e instanceof z.ZodError) {
      return { error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in reassignJobAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to reassign job. ${errorMessage}` };
  }
}

const GenerateRecurringJobsInputSchema = z.object({
  companyId: z.string(),
  untilDate: z.string().describe("The date (ISO 8601 format) up to which jobs should be generated."),
});

export async function generateRecurringJobsAction(
  input: z.infer<typeof GenerateRecurringJobsInputSchema>
): Promise<{ data: { jobsCreated: number }; error: string | null }> {
  try {
    const { companyId, untilDate } = GenerateRecurringJobsInputSchema.parse(input);
    const targetDate = new Date(untilDate);

    if (!db) throw new Error("Firestore not initialized");

    const contractsQuery = query(collection(db, "contracts"), where("companyId", "==", companyId), where("isActive", "==", true));
    const querySnapshot = await getDocs(contractsQuery);
    
    const contracts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
    const batch = writeBatch(db);
    let jobsCreated = 0;

    for (const contract of contracts) {
      let currentDate = contract.lastGeneratedUntil ? addDays(new Date(contract.lastGeneratedUntil), 1) : new Date(contract.startDate);

      while (currentDate <= targetDate) {
        // Create job
        const newJobRef = doc(collection(db, "jobs"));
        const newJobPayload = {
          ...contract.jobTemplate,
          companyId,
          customerName: contract.customerName,
          customerPhone: contract.customerPhone,
          location: { address: contract.customerAddress, latitude: 0, longitude: 0 },
          status: 'Pending' as JobStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          scheduledTime: currentDate.toISOString(),
          assignedTechnicianId: null,
          notes: `Generated from Contract ID: ${contract.id}`,
          sourceContractId: contract.id,
        };
        batch.set(newJobRef, newJobPayload);
        jobsCreated++;

        // Increment current date
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

      // Update contract's last generated date
      const contractDocRef = doc(db, "contracts", contract.id!);
      batch.update(contractDocRef, { lastGeneratedUntil: targetDate.toISOString() });
    }

    await batch.commit();
    return { data: { jobsCreated }, error: null };
    
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error generating recurring jobs:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error: `Failed to generate jobs. ${errorMessage}` };
  }
}

export async function suggestNextAppointmentAction(
  input: SuggestNextAppointmentInput
): Promise<{ data: SuggestNextAppointmentOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestNextAppointmentInputSchema.parse(input);
    const result = await suggestNextAppointmentFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in suggestNextAppointmentAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error: `Failed to suggest appointment. ${errorMessage}` };
  }
}


export async function troubleshootEquipmentAction(
  input: TroubleshootEquipmentInput
): Promise<{ data: TroubleshootEquipmentOutput | null; error: string | null }> {
  try {
    const validatedInput = TroubleshootEquipmentInputSchema.parse(input);
    // In a real app, you might fetch a dynamic knowledge base from Firestore here.
    // For now, we'll use a hardcoded example.
    const result = await troubleshootEquipmentFlow({
        ...validatedInput,
        knowledgeBase: "Standard procedure for HVAC units is to first check the thermostat settings, then the circuit breaker, then the air filter for blockages before inspecting any internal components like capacitors or contactors. Always cut power before opening panels."
    });
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in troubleshootEquipmentAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error: `Failed to get troubleshooting steps. ${errorMessage}` };
  }
}

const GenerateTrackingLinkInputSchema = z.object({
    jobId: z.string(),
});
export type GenerateTrackingLinkInput = z.infer<typeof GenerateTrackingLinkInputSchema>;

export async function generateTrackingLinkAction(
    input: GenerateTrackingLinkInput
): Promise<{ data: { trackingUrl: string } | null; error: string | null }> {
    try {
        const { jobId } = GenerateTrackingLinkInputSchema.parse(input);
        if (!db) throw new Error("Firestore not initialized");

        const token = crypto.randomUUID();
        const expiresAt = addHours(new Date(), 4); // Link is valid for 4 hours

        const jobDocRef = doc(db, "jobs", jobId);
        await updateDoc(jobDocRef, {
            trackingToken: token,
            trackingTokenExpiresAt: expiresAt.toISOString(),
        });
        
        const trackingUrl = `/track/${token}`;

        return { data: { trackingUrl }, error: null };

    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        console.error("Error generating tracking link:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `Failed to generate tracking link. ${errorMessage}` };
    }
}

const DEFAULT_EMISSIONS_KG_PER_KM = 0.192; // Avg for a light commercial vehicle

export async function calculateTravelMetricsAction(
  input: z.infer<typeof CalculateTravelMetricsInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { companyId, jobId, technicianId } = CalculateTravelMetricsInputSchema.parse(input);
    if (!db) throw new Error("Firestore not initialized");

    const jobDocRef = doc(db, "jobs", jobId);
    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists()) throw new Error("Completed job not found.");
    const completedJob = jobSnap.data() as Job;
    if (!completedJob.completedAt) throw new Error("Job is not yet completed.");

    // Fetch company settings to get the custom emission factor
    const companyDocRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyDocRef);
    const companyData = companySnap.data() as Company;
    const emissionFactor = companyData?.settings?.co2EmissionFactorKgPerKm ?? DEFAULT_EMISSIONS_KG_PER_KM;

    // Find the previously completed job for this technician on the same day
    const completedDate = new Date(completedJob.completedAt);
    const startOfDay = new Date(completedDate.setHours(0, 0, 0, 0)).toISOString();
    
    const q = query(
      collection(db, "jobs"),
      where("companyId", "==", companyId),
      where("assignedTechnicianId", "==", technicianId),
      where("status", "==", "Completed"),
      where("completedAt", ">=", startOfDay),
      where("completedAt", "<", completedJob.completedAt) // Jobs completed *before* this one
    );
    const prevJobsSnap = await getDocs(q);
    
    let startLocation: Location;
    if (!prevJobsSnap.empty) {
      const prevJobs = prevJobsSnap.docs.map(doc => doc.data() as Job);
      prevJobs.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      const prevJob = prevJobs[0];
      startLocation = prevJob.location;
    } else {
      // First job of the day, use technician's home base
      const techDocRef = doc(db, "technicians", technicianId);
      const techSnap = await getDoc(techDocRef);
      if (!techSnap.exists()) throw new Error("Technician not found.");
      const technician = techSnap.data() as Technician;
      startLocation = technician.location;
    }
    
    const endLocation = completedJob.location;

    const distanceResult = await estimateTravelDistanceFlow({
        startLocation: { latitude: startLocation.latitude, longitude: startLocation.longitude },
        endLocation: { latitude: endLocation.latitude, longitude: endLocation.longitude },
    });

    if (distanceResult) {
        const distanceKm = distanceResult.distanceKm;
        const co2EmissionsKg = distanceKm * emissionFactor;

        await updateDoc(jobDocRef, {
            travelDistanceKm: distanceKm,
            co2EmissionsKg: co2EmissionsKg,
        });
    }

    return { error: null };
  } catch (e) {
    console.error("Error calculating travel metrics:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { error: `Failed to calculate metrics. ${errorMessage}` };
  }
}

export async function suggestScheduleTimeAction(
  input: SuggestScheduleTimeInput
): Promise<{ data: SuggestScheduleTimeOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestScheduleTimeInputSchema.parse(input);
    const result = await suggestScheduleTimeFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    console.error("Error in suggestScheduleTimeAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error: `Failed to suggest schedule time. ${errorMessage}` };
  }
}

const DeleteJobInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required."),
  companyId: z.string().min(1, "Company ID is required."),
});

export async function deleteJobAction(
  input: z.infer<typeof DeleteJobInputSchema>
): Promise<{ error: string | null }> {
    try {
        const { jobId, companyId } = DeleteJobInputSchema.parse(input);
        if (!db) {
            throw new Error("Firestore not initialized");
        }
        
        const batch = writeBatch(db);
        const jobDocRef = doc(db, "jobs", jobId);

        const jobSnap = await getDoc(jobDocRef);
        if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
            return { error: "Job not found or you do not have permission to delete it." };
        }
        
        const jobData = jobSnap.data() as Job;
        
        // If a technician was assigned, update their status to be available again.
        if (jobData.assignedTechnicianId) {
            const techDocRef = doc(db, "technicians", jobData.assignedTechnicianId);
            const techSnap = await getDoc(techDocRef);
            // Only update the technician if this deleted job was their *current* job.
            if (techSnap.exists() && techSnap.data().currentJobId === jobId) {
                batch.update(techDocRef, {
                    isAvailable: true,
                    currentJobId: null,
                });
            }
        }
        
        // Delete the job itself.
        batch.delete(jobDocRef);
        
        await batch.commit();
        
        return { error: null };

    } catch(e) {
        console.error("Error deleting job:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { error: `Failed to delete job. ${errorMessage}` };
    }
}
