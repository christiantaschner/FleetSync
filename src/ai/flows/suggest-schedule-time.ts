
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
  prompt: `You are an intelligent scheduling assistant for a field service company. Your primary goal is to find the best possible time slot for a job while minimizing disruption to other scheduled work.

The current time is {{currentTime}}. All times are in ISO 8601 format.

New Job Details:
- Priority: {{jobPriority}}
- Required Skills: {{#if requiredSkills.length}}{{#each requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Company Business Hours:
{{#each businessHours}}
- {{dayOfWeek}}: {{#if isOpen}}{{startTime}} - {{endTime}}{{else}}Closed{{/if}}
{{/each}}

{{#if excludedTimes.length}}
The following time slots have been rejected by the customer. Do NOT suggest them again:
{{#each excludedTimes}}
- {{this}}
{{/each}}
{{/if}}

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
1.  **Respect Exclusions**: Absolutely do not suggest any time from the 'excludedTimes' list.
2.  **Respect Business Hours**: ALL suggestions MUST fall within the company's open business hours. Do not suggest times on days the business is closed.
3.  **Filter Technicians**: Only consider technicians who possess ALL of the "Required Skills". If no technicians have the skills, you cannot make a suggestion.
4.  **Prioritize Minimal Disruption**: If rescheduling a job, your main goal is to find a new slot that affects the fewest other customers. If possible, find an open slot on the original day. If not, suggest moving a lower-priority job to the next available day to make room for the higher-priority one.
5.  **High Priority Jobs**: If the job priority is 'High', you MUST suggest the soonest possible time slots for TODAY, respecting business hours. Find the first available and skilled technician(s) and suggest up to 5 time slots.
6.  **Medium or Low Priority Jobs**: If the job priority is 'Medium' or 'Low', suggest times for TOMORROW or later if today is busy. Find skilled technicians with availability and suggest standard morning start times (e.g., 9:00 AM, 10:00 AM) or the next available slots.
7.  **Output Format**: Your response must be a JSON object containing a "suggestions" array. Each item in the array should have a "time" (in ISO 8601 format) and a "reasoning".
8.  **Reasoning**: For each suggestion, provide a brief reasoning, mentioning which technician is available and why this slot is a good fit. For example: "Tomorrow at 9:00 AM. John Doe (HVAC, Electrical) has a clear schedule." or "Today at 2:00 PM. This requires moving a low-priority job for Jane Smith to tomorrow morning to free up John Doe."
9.  If no suitable time slots can be found across all skilled technicians that respect business hours and exclusions, return an empty "suggestions" array.
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
