
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
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: OptimizeRoutesInputSchema},
  output: {schema: OptimizeRoutesOutputSchema},
  prompt: `You are an AI assistant specialized in optimizing routes for field technicians.

  Given the technician's current location, a list of tasks with their locations, priorities, and potentially specific scheduled times,
  you will generate an optimized route that minimizes travel time while respecting constraints.

  Technician ID: {{{technicianId}}}
  Current Location: Latitude: {{{currentLocation.latitude}}}, Longitude: {{{currentLocation.longitude}}}
  Tasks to Optimize:
  {{#each tasks}}
  - Task ID: {{{taskId}}}, Location: Latitude: {{{location.latitude}}}, Longitude: {{{location.longitude}}}, Priority: {{{priority}}}{{#if scheduledTime}}, **Scheduled Time Constraint: {{{scheduledTime}}}**{{/if}}
  {{/each}}
  {{#if trafficData}}Traffic Data: {{{trafficData}}}{{/if}}
  {{#if unexpectedEvents}}Unexpected Events: {{{unexpectedEvents}}}{{/if}}

  **DECISION-MAKING LOGIC:**
  1.  **Honor Time Constraints:** Identify any tasks with a specific 'scheduledTime'. These are firm appointments and must be prioritized. The optimized route should be built around meeting these appointments.
  2.  **Minimize Travel:** For all other tasks, sequence them in an order that minimizes the total travel distance between them.
  3.  **Factor in Priority:** If two flexible tasks are equidistant, schedule the one with the higher priority first.

  Provide the optimized route as a JSON object with a clear reasoning explaining how you prioritized the time constraints and then optimized the remaining jobs.
`,
});

const optimizeRoutesFlow = ai.defineFlow(
  {
    name: 'optimizeRoutesFlow',
    inputSchema: OptimizeRoutesInputSchema,
    outputSchema: OptimizeRoutesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
