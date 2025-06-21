
'use server';
/**
 * @fileOverview An AI agent that suggests required skills for a job based on its description.
 *
 * - suggestJobSkills - A function that suggests skills based on a job description and a list of available skills.
 * - SuggestJobSkillsInput - The input type for the suggestJobSkills function.
 * - SuggestJobSkillsOutput - The return type for the suggestJobSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestJobSkillsInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  availableSkills: z.array(z.string()).describe('The list of all possible skills in the system.'),
});
export type SuggestJobSkillsInput = z.infer<typeof SuggestJobSkillsInputSchema>;

const SuggestJobSkillsOutputSchema = z.object({
  suggestedSkills: z.array(z.string()).describe('An array of skill names suggested for the job, drawn exclusively from the availableSkills list.'),
});
export type SuggestJobSkillsOutput = z.infer<typeof SuggestJobSkillsOutputSchema>;

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
    const {output} = await prompt(input);
    return output!;
  }
);
