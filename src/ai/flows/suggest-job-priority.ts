
'use server';
/**
 * @fileOverview An AI agent that suggests a priority for a job based on its description.
 *
 * - suggestJobPriority - A function that suggests a priority based on a job description.
 */

import {ai} from '@/ai/genkit';
import {
  type SuggestJobPriorityInput,
  SuggestJobPriorityInputSchema,
  type SuggestJobPriorityOutput,
  SuggestJobPriorityOutputSchema
} from '@/types';


export async function suggestJobPriority(input: SuggestJobPriorityInput): Promise<SuggestJobPriorityOutput> {
  return suggestJobPriorityFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestJobPriorityPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: {schema: SuggestJobPriorityInputSchema},
    output: {schema: SuggestJobPriorityOutputSchema},
    prompt: `You are an expert dispatcher analyzing job descriptions to determine the correct priority.
    
    Based on the job description below, identify the priority of the job. 
    - Use 'High' for emergencies like leaks, power outages, safety risks (sparking), or anything requiring immediate attention.
    - Use 'Medium' for standard repairs or service calls that are important but not emergencies.
    - Use 'Low' for routine maintenance, inspections, or non-critical tasks.
    
    Job Description: {{{jobDescription}}}
    
    Provide your reasoning based on keywords found in the description.
    Return a JSON object with a "suggestedPriority" ('High', 'Medium', or 'Low') and a "reasoning" string.`,
});

const suggestJobPriorityFlow = ai.defineFlow(
  {
    name: 'suggestJobPriorityFlow',
    inputSchema: SuggestJobPriorityInputSchema,
    outputSchema: SuggestJobPriorityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
