
'use server';
/**
 * @fileOverview An AI agent that summarizes technician feedback for failed first-time fixes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {SummarizeFtfrOutputSchema} from '@/types';

export const SummarizeFtfrInputSchema = z.object({
    notes: z.array(z.string()).describe("An array of all the textual feedback notes from technicians."),
});
export type SummarizeFtfrInput = z.infer<typeof SummarizeFtfrInputSchema>;

export async function summarizeFtfr(input: SummarizeFtfrInput): Promise<SummarizeFtfrOutput> {
  return summarizeFtfrFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeFtfrPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: SummarizeFtfrInputSchema},
  output: {schema: SummarizeFtfrOutputSchema},
  prompt: `You are an expert operations analyst for a field service company.
  
  Your task is to review all the "Reason for Follow-up" notes provided by technicians for jobs that were not completed on the first visit.
  
  Analyze these notes and provide two things in your response:
  1. A concise, professional summary (2-3 sentences) of the main issues causing repeat visits.
  2. A list of the most common recurring themes. Themes should be short, 1-3 word phrases.
  
  Examples of good themes: "Missing Parts", "Incorrect Diagnosis", "Customer Not Home", "Requires Specialist Tool", "Issue More Complex".

  Here are the notes to analyze:
  {{#each notes}}
  - {{{this}}}
  {{/each}}
  `,
});

const summarizeFtfrFlow = ai.defineFlow(
  {
    name: 'summarizeFtfrFlow',
    inputSchema: SummarizeFtfrInputSchema,
    outputSchema: SummarizeFtfrOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
