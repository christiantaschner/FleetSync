'use server';
/**
 * @fileOverview An AI agent that predicts the risk of a technician being late for their next job.
 *
 * - predictScheduleRisk - A function that assesses schedule risk.
 */

import {ai} from '@/ai/genkit';
import {
  type PredictScheduleRiskInput,
  PredictScheduleRiskInputSchema,
  type PredictScheduleRiskOutput,
  PredictScheduleRiskOutputSchema,
  EstimateTravelDistanceInputSchema,
  EstimateTravelDistanceOutputSchema,
} from '@/types';
import { estimateTravelDistance } from './estimate-travel-distance-flow';

const getDrivingDistance = ai.defineTool(
  {
    name: 'getDrivingDistance',
    description: 'Returns the estimated driving distance in kilometers between two geographical points.',
    inputSchema: EstimateTravelDistanceInputSchema,
    outputSchema: EstimateTravelDistanceOutputSchema,
  },
  async (input) => {
    // The tool's implementation calls the existing flow
    return estimateTravelDistance(input);
  }
);

export async function predictScheduleRisk(input: PredictScheduleRiskInput): Promise<PredictScheduleRiskOutput> {
  return predictScheduleRiskFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictScheduleRiskPrompt',
    input: {schema: PredictScheduleRiskInputSchema},
    output: {schema: PredictScheduleRiskOutputSchema},
    tools: [getDrivingDistance],
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
    2.  USE THE 'getDrivingDistance' tool to get a precise driving distance in kilometers between the current job's location and the next job's location.
    3.  Estimate the travel time based on the distance from the tool. Assume an average speed of 45 km/h for combined urban/suburban driving unless traffic data suggests otherwise.
    4.  Calculate the estimated arrival time at the next job.
    5.  Compare the estimated arrival time with the scheduled time for the next job (if one exists).

    Based on this analysis, calculate the predicted delay in minutes. A negative number or zero means on time. Provide a brief reasoning for your prediction, mentioning the key factors (remaining work time, travel time from the tool).
    `,
});

const predictScheduleRiskFlow = ai.defineFlow(
  {
    name: 'predictScheduleRiskFlow',
    inputSchema: PredictScheduleRiskInputSchema,
    outputSchema: PredictScheduleRiskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
