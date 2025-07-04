
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
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: SuggestScheduleTimeInputSchema},
  output: {schema: SuggestScheduleTimeOutputSchema},
  prompt: `You are an intelligent scheduling assistant for a field service company. Your task is to suggest up to 5 optimal start times for a new job based on its priority, required skills, and technician availability.

The current time is {{currentTime}}. All times are in ISO 8601 format.

New Job Details:
- Priority: {{jobPriority}}
- Required Skills: {{#if requiredSkills.length}}{{#each requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Here is the list of all technicians, their skills, and their currently scheduled jobs for the next few days:
{{#each technicians}}
- Technician: {{name}} (ID: {{id}})
  - Skills: {{#if skills.length}}{{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}
  - Scheduled Jobs:
    {{#if jobs.length}}
      {{#each jobs}}
      - Job starting at: {{scheduledTime}}
      {{/each}}
    {{else}}
    - This technician has no scheduled jobs.
    {{/if}}
{{/each}}

Follow these rules for your suggestions:
1.  **Filter Technicians**: First, only consider technicians who possess ALL of the "Required Skills". If no technicians have the skills, you cannot make a suggestion.
2.  **High Priority Jobs**: If the job priority is 'High', you MUST suggest the soonest possible time slots for TODAY. Find the first available and skilled technician(s) and suggest up to 5 time slots (e.g., in the next hour), avoiding conflicts with their existing scheduled jobs.
3.  **Medium or Low Priority Jobs**: If the job priority is 'Medium' or 'Low', you MUST suggest times for TOMORROW or later. Find skilled technicians with availability and suggest standard morning start times (e.g., 9:00 AM, 10:00 AM) or the next available slots.
4.  **Output Format**: Your response must be a JSON object containing a "suggestions" array. Each item in the array should have a "time" (in ISO 8601 format) and a "reasoning".
5.  **Reasoning**: For each suggestion, provide a brief reasoning, mentioning which technician is available. For example: "Tomorrow at 9:00 AM. John Doe (HVAC, Electrical) has a clear schedule."
6.  If no suitable time slots can be found across all skilled technicians, return an empty "suggestions" array.
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
    return output ?? { suggestions: [] };
  }
);
