
"use server";

import { allocateJob as allocateJobFlow } from "@/ai/flows/allocate-job";
import { optimizeRoutes as optimizeRoutesFlow } from "@/ai/flows/optimize-routes";
import { suggestJobSkills as suggestJobSkillsFlow } from "@/ai/flows/suggest-job-skills";
import { suggestJobPriority as suggestJobPriorityFlow } from "@/ai/flows/suggest-job-priority";
import { predictNextAvailableTechnicians as predictNextAvailableTechniciansFlow } from "@/ai/flows/predict-next-technician";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, deleteField, addDoc } from "firebase/firestore";
import type { Job, JobStatus, ProfileChangeRequest } from "@/types";

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
  type SuggestJobPriorityOutput
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

export type OptimizeRoutesActionInput = OptimizeRoutesInput;

export async function optimizeRoutesAction(
  input: OptimizeRoutesActionInput
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

const ImportJobsActionInputSchema = z.array(JobImportSchema);

export type ImportJobsActionInput = z.infer<typeof ImportJobsActionInputSchema>;

export async function importJobsAction(
  input: ImportJobsActionInput
): Promise<{ data: { successCount: number }; error: string | null }> {
    try {
        const validatedInput = ImportJobsActionInputSchema.parse(input);
        if (!db) {
            throw new Error("Firestore not initialized");
        }
        const batch = writeBatch(db);
        let successCount = 0;

        const jobsCollectionRef = collection(db, "jobs");

        for (const jobData of validatedInput) {
            const newJobRef = doc(jobsCollectionRef);
            
            const finalPayload = {
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
  technicianId: z.string().min(1, "Technician ID is required."),
});

export async function handleTechnicianUnavailabilityAction(
  input: z.infer<typeof HandleTechnicianUnavailabilityInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { technicianId } = HandleTechnicianUnavailabilityInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    const batch = writeBatch(db);
    
    // 1. Mark technician as unavailable
    const techDocRef = doc(db, "technicians", technicianId);
    batch.update(techDocRef, { isAvailable: false, currentJobId: null });

    // 2. Find and unassign active jobs
    const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
    const jobsQuery = query(
      collection(db, "jobs"),
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
  technicianId: z.string().min(1),
  technicianName: z.string().min(1),
  requestedChanges: z.record(z.any()), // Simple object for changes
  notes: z.string().optional(),
});

export async function requestProfileChangeAction(
  input: z.infer<typeof RequestProfileChangeInputSchema>
): Promise<{ error: string | null }> {
  try {
    const { technicianId, technicianName, requestedChanges, notes } = RequestProfileChangeInputSchema.parse(input);
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    
    const requestsCollectionRef = collection(db, "profileChangeRequests");
    
    const newRequest: Omit<ProfileChangeRequest, 'id'> = {
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
