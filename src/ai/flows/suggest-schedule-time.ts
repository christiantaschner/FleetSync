
'use server';
/**
 * @fileOverview An AI agent that suggests an optimal schedule time for a new job.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
  SuggestScheduleTimeInputSchema,
  type SuggestScheduleTimeInput,
  SuggestScheduleTimeOutputSchema,
  type SuggestScheduleTimeOutput
} from '@/types';

export async function suggestScheduleTime(input: SuggestScheduleTimeInput): Promise<SuggestScheduleTimeOutput> {
  return suggestScheduleTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestScheduleTimePrompt',
  input: {schema: SuggestScheduleTimeInputSchema},
  output: {schema: SuggestScheduleTimeOutputSchema},
  prompt: `You are an intelligent scheduling assistant for a field service company. Your task is to suggest an optimal start time for a new job based on its priority and technician availability.

The current time is {{currentTime}}. All times are in ISO 8601 format.

New Job Priority: {{jobPriority}}

Here is the list of all technicians and their currently scheduled jobs for the next few days:
{{#each technicians}}
- Technician: {{name}} (ID: {{id}})
  {{#if jobs.length}}
  Scheduled Jobs:
    {{#each jobs}}
    - Job starting at: {{scheduledTime}}
    {{/each}}
  {{else}}
  - This technician has no scheduled jobs.
  {{/if}}
{{/each}}

Follow these rules for your suggestion:
1.  **High Priority Jobs**: If the job priority is 'High', you MUST suggest the soonest possible time for TODAY. Look for the first available technician and suggest a time slot (e.g., in the next hour), avoiding conflicts with their existing scheduled jobs.
2.  **Medium or Low Priority Jobs**: If the job priority is 'Medium' or 'Low', you MUST suggest a time for TOMORROW. Find a technician who has a free day tomorrow and suggest a standard morning start time, like 9:00 AM.
3.  **Output Format**: Your response must be a JSON object containing the suggested time in ISO 8601 format (e.g., "YYYY-MM-DDTHH:MM:SS.SSSZ") and a brief reasoning.
4.  **Reasoning**: In your reasoning, mention why you chose that time and which technician(s) are likely available. For example: "Suggesting tomorrow at 9 AM as Technician John Doe has a clear schedule." or "Suggesting an immediate appointment as this is a high-priority job and Jane Smith is currently available."
5.  If no one is available, you should indicate that in the reasoning, but still provide a best-effort suggested time (e.g. next available slot).
`,
});

const suggestScheduleTimeFlow = ai.defineFlow(
  {
    name: 'suggestScheduleTimeFlow',
    inputSchema: SuggestScheduleTimeInputSchema,
    outputSchema: SuggestScheduleTimeOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
