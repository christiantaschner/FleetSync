'use server';

/**
 * @fileOverview AI-powered tool that dynamically re-optimizes routes and task assignments for field technicians in real time.
 *
 * - optimizeRoutes - A function that handles the route optimization process.
 * - OptimizeRoutesInput - The input type for the optimizeRoutes function.
 * - OptimizeRoutesOutput - The return type for the optimizeRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRoutesInputSchema = z.object({
  technicianId: z.string().describe('The ID of the technician.'),
  currentLocation: z
    .object({
      latitude: z.number().describe('The latitude of the current location.'),
      longitude: z.number().describe('The longitude of the current location.'),
    })
    .describe('The current location of the technician.'),
  tasks: z
    .array(
      z.object({
        taskId: z.string().describe('The ID of the task.'),
        location: z
          .object({
            latitude: z.number().describe('The latitude of the task location.'),
            longitude: z.number().describe('The longitude of the task location.'),
          })
          .describe('The location of the task.'),
        priority: z.enum(['high', 'medium', 'low']).describe('The priority of the task.'),
      })
    )
    .describe('The list of tasks to be performed.'),
  trafficData: z
    .string()
    .optional()
    .describe('Optional real-time traffic data. Provide as a JSON string if available.'),
  unexpectedEvents: z
    .string()
    .optional()
    .describe('Optional information about unexpected events. Provide as a JSON string if available.'),
});
export type OptimizeRoutesInput = z.infer<typeof OptimizeRoutesInputSchema>;

const OptimizeRoutesOutputSchema = z.object({
  optimizedRoute: z
    .array(
      z.object({
        taskId: z.string().describe('The ID of the task in the optimized route.'),
        estimatedArrivalTime: z.string().describe('The estimated arrival time for the task.'),
      })
    )
    .describe('The optimized route for the technician.'),
  totalTravelTime: z.string().describe('The total estimated travel time for the optimized route.'),
  reasoning: z.string().describe('The reasoning behind the optimized route.'),
});
export type OptimizeRoutesOutput = z.infer<typeof OptimizeRoutesOutputSchema>;

export async function optimizeRoutes(input: OptimizeRoutesInput): Promise<OptimizeRoutesOutput> {
  return optimizeRoutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRoutesPrompt',
  input: {schema: OptimizeRoutesInputSchema},
  output: {schema: OptimizeRoutesOutputSchema},
  prompt: `You are an AI assistant specialized in optimizing routes for field technicians.

  Given the technician's current location, a list of tasks with their locations and priorities,
  real-time traffic data (if available), and information about unexpected events (if available),
  you will generate an optimized route that minimizes travel time and maximizes efficiency.

  Technician ID: {{{technicianId}}}
  Current Location: Latitude: {{{currentLocation.latitude}}}, Longitude: {{{currentLocation.longitude}}}
  Tasks:{{#each tasks}} Task ID: {{{taskId}}}, Location: Latitude: {{{location.latitude}}}, Longitude: {{{location.longitude}}}, Priority: {{{priority}}}{{#unless @last}}\n{{/unless}}{{/each}}
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
