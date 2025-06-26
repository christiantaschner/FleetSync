'use server';
/**
 * @fileOverview An AI agent that estimates the driving distance between two points.
 */

import { ai } from '@/ai/genkit';
import {
  type EstimateTravelDistanceInput,
  EstimateTravelDistanceInputSchema,
  type EstimateTravelDistanceOutput,
  EstimateTravelDistanceOutputSchema,
} from '@/types';

const prompt = ai.definePrompt({
    name: 'estimateTravelDistancePrompt',
    input: { schema: EstimateTravelDistanceInputSchema },
    output: { schema: EstimateTravelDistanceOutputSchema },
    prompt: `You are a mapping expert who provides driving distance estimations.
    
    Given a start and end location by their latitude and longitude coordinates, estimate the most likely driving distance between them.
    
    Start Location: (lat: {{{startLocation.latitude}}}, lon: {{{startLocation.longitude}}})
    End Location: (lat: {{{endLocation.latitude}}}, lon: {{{endLocation.longitude}}})

    Your response must be the estimated distance in kilometers. Return only the numerical value in the 'distanceKm' field of the JSON output.
    `,
});

const estimateTravelDistanceFlow = ai.defineFlow(
  {
    name: 'estimateTravelDistanceFlow',
    inputSchema: EstimateTravelDistanceInputSchema,
    outputSchema: EstimateTravelDistanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function estimateTravelDistance(input: EstimateTravelDistanceInput): Promise<EstimateTravelDistanceOutput> {
  return estimateTravelDistanceFlow(input);
}
