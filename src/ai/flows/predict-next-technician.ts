
'use server';
/**
 * @fileOverview An AI agent that predicts which technicians will become available soonest.
 *
 * - predictNextAvailableTechnicians - Predicts the next available technicians.
 */

import {ai} from '@/ai/genkit';
import {
  type PredictNextAvailableTechniciansInput,
  PredictNextAvailableTechniciansInputSchema,
  type PredictNextAvailableTechniciansOutput,
  PredictNextAvailableTechniciansOutputSchema
} from '@/types';


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
    const { output } = await prompt(input);
    if (!output) {
      return { predictions: [] };
    }
    // Sort predictions by estimated availability time to ensure correct order
    output.predictions.sort((a, b) => new Date(a.estimatedAvailabilityTime).getTime() - new Date(b.estimatedAvailabilityTime).getTime());
    return output;
  }
);
