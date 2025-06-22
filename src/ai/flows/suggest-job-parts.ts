
'use server';
/**
 * @fileOverview An AI agent that suggests required parts for a job based on its description.
 *
 * - suggestJobParts - A function that suggests parts based on a job description and a list of available parts.
 */

import {ai} from '@/ai/genkit';
import {
  type SuggestJobPartsInput,
  SuggestJobPartsInputSchema,
  type SuggestJobPartsOutput,
  SuggestJobPartsOutputSchema
} from '@/types';


export async function suggestJobParts(input: SuggestJobPartsInput): Promise<SuggestJobPartsOutput> {
  return suggestJobPartsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestJobPartsPrompt',
    input: {schema: SuggestJobPartsInputSchema},
    output: {schema: SuggestJobPartsOutputSchema},
    prompt: `You are an expert at analyzing job descriptions to determine the necessary parts and materials.
    
    Based on the job description below, identify which parts are likely required to complete the job.
    
    You MUST only choose from the following list of available parts. Do not invent new parts.
    
    Job Description: {{{jobDescription}}}
    
    Available Parts:
    {{#each availableParts}}
    - {{{this}}}
    {{/each}}
    
    Return a JSON object with a "suggestedParts" array containing the names of the parts you identified. If no specific parts seem necessary from the list, return an empty array.`,
});

const suggestJobPartsFlow = ai.defineFlow(
  {
    name: 'suggestJobPartsFlow',
    inputSchema: SuggestJobPartsInputSchema,
    outputSchema: SuggestJobPartsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
