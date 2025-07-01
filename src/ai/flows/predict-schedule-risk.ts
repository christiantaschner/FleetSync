
'use server';
/**
 * @fileOverview An AI agent that predicts the risk of a technician being late for their next job.
 *
 * - predictScheduleRisk - A function that assesses schedule risk.
 */

import { defineFlow, definePrompt, generate } from 'genkit';
import {
  type PredictScheduleRiskInput,
  PredictScheduleRiskInputSchema,
  type PredictScheduleRiskOutput,
  PredictScheduleRiskOutputSchema
} from '@/types';


export async function predictScheduleRisk(input: PredictScheduleRiskInput): Promise<PredictScheduleRiskOutput> {
  return predictScheduleRiskFlow(input);
}

const prompt = definePrompt({
    name: 'predictScheduleRiskPrompt',
    input: {schema: PredictScheduleRiskInputSchema},
    output: {schema: PredictScheduleRiskOutputSchema},
    prompt: `You are an expert dispatcher analyzing a technician's schedule to predict potential delays.

    The current time is {{{currentTime}}}.
    
    A technician, {{{technician.technicianName}}}, is currently at work on a job.
    - Current Job ID: {{{currentJob.jobId}}}
    - Started At: {{{currentJob.startedAt}}}
    - Estimated Duration: {{{currentJob.estimatedDurationMinutes}}} minutes
    - Current Job Location: (Lat: {{{currentJob.location.latitude}}}, Lon: {{{currentJob.location.longitude}}})
    
    Their next job is:
    - Next Job ID: {{{nextJob.jobId}}}
    {{#if nextJob.scheduledTime}}- Scheduled Time: {{{nextJob.scheduledTime}}} (This is a firm appointment){{else}}- No specific scheduled time.{{/if}}
    - Next Job Location: (Lat: {{{nextJob.location.latitude}}}, Lon: {{{nextJob.location.longitude}}})

    Analyze the situation:
    1.  Calculate the estimated completion time of the current job. The technician started at {{{currentJob.startedAt}}} and the job is estimated to take {{{currentJob.estimatedDurationMinutes}}} minutes.
    2.  Estimate the travel time from the current job's location to the next job's location. Assume standard urban/suburban driving conditions.
    3.  Calculate the estimated arrival time at the next job.
    4.  Compare the estimated arrival time with the scheduled time for the next job (if one exists).

    Based on this analysis, calculate the predicted delay in minutes. A negative number or zero means on time. Provide a brief reasoning for your prediction, mentioning the key factors (remaining work time, travel time).
    `,
});

const predictScheduleRiskFlow = defineFlow(
  {
    name: 'predictScheduleRiskFlow',
    inputSchema: PredictScheduleRiskInputSchema,
    outputSchema: PredictScheduleRiskOutputSchema,
  },
  async (input) => {
    const llmResponse = await generate({
      prompt,
      input,
    });
    return llmResponse.output();
  }
);
