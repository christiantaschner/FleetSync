
"use server";

import { allocateJob as allocateJobFlow, AllocateJobInput, AllocateJobOutput } from "@/ai/flows/allocate-job";
import { optimizeRoutes as optimizeRoutesFlow, OptimizeRoutesInput, OptimizeRoutesOutput } from "@/ai/flows/optimize-routes";
import { z } from "zod";

// Define Zod schemas for server action inputs to ensure type safety from client
const AllocateJobActionInputSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required."),
  jobPriority: z.enum(['High', 'Medium', 'Low']),
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
