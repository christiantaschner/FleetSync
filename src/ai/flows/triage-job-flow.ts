
'use server';
/**
 * @fileOverview An AI agent that analyzes job details and customer photos to suggest parts and repair steps.
 */
import {ai} from '@/ai/genkit';
import {
  TriageJobInputSchema,
  type TriageJobInput,
  TriageJobOutputSchema,
  type TriageJobOutput,
} from '@/types';

export async function triageJob(input: TriageJobInput): Promise<TriageJobOutput> {
  return triageJobFlow(input);
}

const prompt = ai.definePrompt({
    name: 'triageJobPrompt',
    model: 'googleai/gemini-1.5-pro-latest',
    input: { schema: TriageJobInputSchema },
    output: { schema: TriageJobOutputSchema },
    prompt: `You are an expert field service support AI. Your task is to analyze a job description and up to 5 photos of a broken device to help a technician prepare for the job.

Job Description:
---
{{{jobDescription}}}
---

Customer Photos (up to 5 images):
{{#each photoDataUris}}
{{media url=this}}
{{/each}}

Based on the description and ALL photos provided, perform the following analysis:

1.  **Identify Model**: Examine the photos for any labels, model numbers, or distinct features. Identify the model of the equipment if possible.
2.  **Suggest Parts**: Based on the identified model and the described problem, suggest a list of potential parts that might be required for the repair. Be specific (e.g., "Compressor Start Capacitor P/N 12345" instead of just "capacitor").
3.  **Provide Repair Guide**: Synthesize all information to create a concise, step-by-step repair guide for the technician. Prioritize safety and standard procedures.

Return a JSON object with your findings. If a field cannot be determined, omit it or return an empty array.`,
});

const triageJobFlow = ai.defineFlow(
  {
    name: 'triageJobFlow',
    inputSchema: TriageJobInputSchema,
    outputSchema: TriageJobOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
