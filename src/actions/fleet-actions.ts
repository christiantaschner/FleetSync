
"use server";

import { allocateJob as allocateJobFlow, AllocateJobInput, AllocateJobOutput } from "@/ai/flows/allocate-job";
import { optimizeRoutes as optimizeRoutesFlow, OptimizeRoutesInput, OptimizeRoutesOutput } from "@/ai/flows/optimize-routes";
import { suggestJobSkills as suggestJobSkillsFlow, SuggestJobSkillsInput, SuggestJobSkillsOutput } from "@/ai/flows/suggest-job-skills";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import type { Job, JobStatus } from "@/types";


// Define Zod schemas for server action inputs to ensure type safety from client
const AllocateJobActionInputSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required."),
  jobPriority: z.enum(['High', 'Medium', 'Low']),
  requiredSkills: z.array(z.string()).optional(),
  scheduledTime: z.string().optional(),
  technicianAvailability: z.array(
    z.object({
      technicianId: z.string(),
      technicianName: z.string(), // Added technicianName
      isAvailable: z.boolean(),
      skills: z.array(z.string()),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    })
  ).min(1, "At least one technician must be provided."),
});

export type AllocateJobActionInput = z.infer<typeof AllocateJobActionInputSchema>;

export async function allocateJobAction(
  input: AllocateJobActionInput
): Promise<{ data: AllocateJobOutput | null; error: string | null }> {
  try {
    const validatedInput = AllocateJobActionInputSchema.parse(input);
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


const OptimizeRoutesActionInputSchema = z.object({
  technicianId: z.string().min(1, "Technician ID is required."),
  currentLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  tasks: z.array(
    z.object({
      taskId: z.string(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ).min(1, "At least one task must be provided."),
  trafficData: z.string().optional(),
  unexpectedEvents: z.string().optional(),
});

export type OptimizeRoutesActionInput = z.infer<typeof OptimizeRoutesActionInputSchema>;

export async function optimizeRoutesAction(
  input: OptimizeRoutesActionInput
): Promise<{ data: OptimizeRoutesOutput | null; error: string | null }> {
  try {
    const validatedInput = OptimizeRoutesActionInputSchema.parse(input);
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

const SuggestJobSkillsActionInputSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required."),
  availableSkills: z.array(z.string()).min(1, "Available skills must be provided."),
});

export type SuggestJobSkillsActionInput = z.infer<typeof SuggestJobSkillsActionInputSchema>;

export async function suggestJobSkillsAction(
  input: SuggestJobSkillsActionInput
): Promise<{ data: SuggestJobSkillsOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestJobSkillsActionInputSchema.parse(input);
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
