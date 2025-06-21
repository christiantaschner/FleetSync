
'use server';

/**
 * @fileOverview AI-powered tool that dynamically re-optimizes routes and task assignments for field technicians in real time.
 *
 * - optimizeRoutes - A function that handles the route optimization process.
 */

import {ai} from '@/ai/genkit';
import {
  type OptimizeRoutesInput,
  OptimizeRoutesInputSchema,
  type OptimizeRoutesOutput,
  OptimizeRoutesOutputSchema
} from '@/types';


export async function optimizeRoutes(input: OptimizeRoutesInput): Promise<OptimizeRoutesOutput> {
  return optimizeRoutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRoutesPrompt',
  input: {schema: OptimizeRoutesInputSchema},
  output: {schema: OptimizeRoutesOutputSchema},
  prompt: `You are an AI assistant specialized in optimizing routes for field technicians.

  Given the technician's current location, a list of tasks with their locations, priorities, and potentially specific scheduled times,
  real-time traffic data (if available), and information about unexpected events (if available),
  you will generate an optimized route that minimizes travel time and maximizes efficiency.

  Technician ID: {{{technicianId}}}
  Current Location: Latitude: {{{currentLocation.latitude}}}, Longitude: {{{currentLocation.longitude}}}
  Tasks:
  {{#each tasks}}
  - Task ID: {{{taskId}}}, Location: Latitude: {{{location.latitude}}}, Longitude: {{{location.longitude}}}, Priority: {{{priority}}}{{#if scheduledTime}}, Scheduled Time: {{{scheduledTime}}} (MUST HONOR IF POSSIBLE){{/if}}
  {{/each}}
  {{#if trafficData}}Traffic Data: {{{trafficData}}}{{/if}}
  {{#if unexpectedEvents}}Unexpected Events: {{{unexpectedEvents}}}{{/if}}

  Provide the optimized route as a JSON object with the following structure:
  {
    "optimizedRoute": [
      {
        "taskId": "task_id",
        "estimatedArrivalTime": "estimated_arrival_time"
      }
    ],
    "totalTravelTime": "total_estimated_travel_time",
    "reasoning": "reasoning_behind_the_optimized_route"
  }

  Consider task priorities, travel times, and any available traffic or event information to create the most efficient route.
  If any tasks have a specific 'scheduledTime', these are high-priority constraints that the optimized route must attempt to meet. Your reasoning should reflect this consideration.
  Explain your reasoning for the chosen route in the "reasoning" field.
`,
});

const optimizeRoutesFlow = ai.defineFlow(
  {
    name: 'optimizeRoutesFlow',
    inputSchema: OptimizeRoutesInputSchema,
    outputSchema: OptimizeRoutesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
