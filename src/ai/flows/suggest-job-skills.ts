
'use server';
/**
 * @fileOverview An AI agent that suggests required skills for a job based on its description.
 *
 * - suggestJobSkills - A function that suggests skills based on a job description and a list of available skills.
 */

import {ai} from '@/ai/genkit';
import {
  type SuggestJobSkillsInput,
  SuggestJobSkillsInputSchema,
  type SuggestJobSkillsOutput,
  SuggestJobSkillsOutputSchema
} from '@/types';


export async function suggestJobSkills(input: SuggestJobSkillsInput): Promise<SuggestJobSkillsOutput> {
  return suggestJobSkillsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestJobSkillsPrompt',
    input: {schema: SuggestJobSkillsInputSchema},
    output: {schema: SuggestJobSkillsOutputSchema},
    prompt: `You are an expert at analyzing job descriptions to determine the necessary skills.
    
    Based on the job description below, identify the skills required to complete the job.
    
    You MUST only choose from the following list of available skills. Do not invent new skills.
    
    Job Description: {{{jobDescription}}}
    
    Available Skills:
    {{#each availableSkills}}
    - {{{this}}}
    {{/each}}
    
    Return a JSON object with a "suggestedSkills" array containing the names of the skills you identified. If no specific skills seem necessary, return an empty array.`,
});

const suggestJobSkillsFlow = ai.defineFlow(
  {
    name: 'suggestJobSkillsFlow',
    inputSchema: SuggestJobSkillsInputSchema,
    outputSchema: SuggestJobSkillsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
