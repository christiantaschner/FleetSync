
'use server';
/**
 * @fileOverview An AI agent that analyzes customer-provided photos of broken equipment to assist in job triage.
 *
 * This is currently a placeholder for a future feature and is not yet fully integrated.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
    TriageJobWithPhotosInputSchema,
    type TriageJobWithPhotosInput,
    TriageJobWithPhotosOutputSchema,
    type TriageJobWithPhotosOutput
} from '@/types';

export async function triageJobWithPhotos(input: TriageJobWithPhotosInput): Promise<TriageJobWithPhotosOutput> {
  return triageJobFlow(input);
}

const prompt = ai.definePrompt({
    name: 'triageJobWithPhotosPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: TriageJobWithPhotosInputSchema },
    output: { schema: TriageJobWithPhotosOutputSchema },
    prompt: `You are an expert field service triage specialist.
    
    You have been given a job description and photos from a customer about a broken piece of equipment.
    
    Job Description: {{{jobDescription}}}
    
    {{#each customerPhotos}}
    Photo: {{media url=this.url}}
    {{/each}}
    
    Your tasks are:
    1.  **Identify the Equipment:** From the photos, identify the make and model of the equipment if possible. If you can't be certain, state what type of equipment it is (e.g., "HVAC outdoor condenser unit").
    2.  **Suggest Parts:** Based on the job description and visual analysis, suggest a list of parts that are likely needed for the repair. You MUST choose from the following list of available parts. Do not invent parts.
    3.  **Provide a Repair Guide:** Write a concise, step-by-step initial diagnostic and repair guide for a qualified technician. Prioritize safety and common failure points.

    Available Parts:
    {{#each availableParts}}
    - {{{this}}}
    {{/each}}
    `,
});

const triageJobFlow = ai.defineFlow(
  {
    name: 'triageJobFlow',
    inputSchema: TriageJobWithPhotosInputSchema,
    outputSchema: TriageJobWithPhotosOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
