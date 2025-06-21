
'use server';
/**
 * @fileOverview An AI agent that predicts which technicians will become available soonest.
 *
 * - predictNextAvailableTechnicians - Predicts the next available technicians.
 * - PredictNextAvailableTechniciansInput - The input type for the function.
 * - PredictNextAvailableTechniciansOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PredictNextAvailableTechniciansInputSchema = z.object({
  activeJobs: z.array(
    z.object({
      jobId: z.string(),
      title: z.string(),
      assignedTechnicianId: z.string(),
      estimatedDurationMinutes: z.number().optional(),
      startedAt: z.string().optional().describe("ISO 8601 timestamp of when the job started."),
    })
  ).describe("A list of all jobs currently in progress."),
  busyTechnicians: z.array(
    z.object({
      technicianId: z.string(),
      technicianName: z.string(),
      currentLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      currentJobId: z.string(),
    })
  ).describe("A list of all technicians currently on a job."),
  currentTime: z.string().describe("The current time in ISO 8601 format, to be used as the baseline for predictions."),
});
export type PredictNextAvailableTechniciansInput = z.infer<typeof PredictNextAvailableTechniciansInputSchema>;

export const PredictNextAvailableTechniciansOutputSchema = z.object({
  predictions: z.array(
    z.object({
      technicianId: z.string(),
      technicianName: z.string(),
      estimatedAvailabilityTime: z.string().describe("The estimated time the technician will be available, in ISO 8601 format."),
      reasoning: z.string().describe("A brief explanation of the prediction."),
    })
  ).describe("A ranked list of technicians predicted to be available next, sorted by estimated availability time."),
});
export type PredictNextAvailableTechniciansOutput = z.infer<typeof PredictNextAvailableTechniciansOutputSchema>;


export async function predictNextAvailableTechnicians(input: PredictNextAvailableTechniciansInput): Promise<PredictNextAvailableTechniciansOutput> {
  return predictNextAvailableTechniciansFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictNextAvailableTechniciansPrompt',
    input: {schema: PredictNextAvailableTechniciansInputSchema},
    output: {schema: PredictNextAvailableTechniciansOutputSchema},
    prompt: `You are an AI assistant that predicts when field technicians will become available.
    
    Your task is to analyze the list of currently busy technicians and their active jobs to predict who will finish their current task first.
    
    The current time is {{{currentTime}}}.
    
    Here is the list of busy technicians:
    {{#each busyTechnicians}}
    - Technician ID: {{{technicianId}}}, Name: {{{technicianName}}}, Current Job ID: {{{currentJobId}}}
    {{/each}}
    
    Here is the list of their active jobs:
    {{#each activeJobs}}
    - Job ID: {{{jobId}}}, Title: "{{{title}}}", Assigned To: {{{assignedTechnicianId}}}, Est. Duration: {{{estimatedDurationMinutes}}} minutes. {{#if startedAt}}Started At: {{{startedAt}}}.{{/if}}
    {{/each}}
    
    Your prediction should consider the job's estimated duration and when it started (if available). If the start time is not provided, assume the job has just started (relative to the provided current time).
    Calculate the estimated completion time for each technician's current job. The estimated availability time will be this completion time.
    
    Return a ranked list of the top 3 technicians who will become available soonest. Provide the technician's ID, their name, their estimated availability time, and a brief reasoning for each prediction.
    If there are no busy technicians, return an empty array for predictions.
    `,
});

const predictNextAvailableTechniciansFlow = ai.defineFlow(
  {
    name: 'predictNextAvailableTechniciansFlow',
    inputSchema: PredictNextAvailableTechniciansInputSchema,
    outputSchema: PredictNextAvailableTechniciansOutputSchema,
  },
  async (input) => {
    if (input.busyTechnicians.length === 0) {
        return { predictions: [] };
    }
    const {output} = await prompt(input);
    if (!output) {
      return { predictions: [] };
    }
    // Sort predictions by estimated availability time to ensure correct order
    output.predictions.sort((a, b) => new Date(a.estimatedAvailabilityTime).getTime() - new Date(b.estimatedAvailabilityTime).getTime());
    return output;
  }
);
