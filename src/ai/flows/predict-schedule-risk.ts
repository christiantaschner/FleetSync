
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
    model: 'googleai/gemini-1.5-flash-latest',
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
    
    {{#if trafficData}}
    **Real-Time Traffic Data:**
    - Condition: {{{trafficData.condition}}}
    - Travel Time Modifier: {{{trafficData.travelTimeModifier}}}% (A positive value means travel will be slower than average).
    {{/if}}

    Follow these steps to analyze the situation:
    1.  **Calculate Completion Time**: Determine the estimated completion time of the current job. The technician started at {{{currentJob.startedAt}}} and the job is estimated to take {{{currentJob.estimatedDurationMinutes}}} minutes.
    2.  **Get Driving Distance**: You MUST use the 'getDrivingDistance' tool to get a precise driving distance in kilometers between the current job's location and the next job's location.
    3.  **Estimate Travel Time**: Based on the distance from the tool, estimate the travel time. Assume an average speed of 45 km/h for combined urban/suburban driving. **If traffic data is available, adjust this estimate by the 'Travel Time Modifier'.**
    4.  **Calculate Estimated Arrival Time**: Determine the estimated arrival time at the next job by adding the travel time to the completion time from step 1.
    5.  **Calculate Delay**: Compare the estimated arrival time with the scheduled time for the next job (if one exists). The difference is the predicted delay.

    **Final Sanity Check (Self-Correction):** Before giving your final answer, briefly review your calculation. Does the predicted delay seem reasonable? Is there any factor you might have missed? (e.g., extremely long travel time for a short distance). State that you've done this check in your reasoning.

    Based on your analysis, provide the predicted delay in minutes (a negative number or zero means on time) and a brief reasoning for your prediction, mentioning the key factors (remaining work time, travel time from the tool, and traffic conditions if available) and confirming you've performed a sanity check.
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
