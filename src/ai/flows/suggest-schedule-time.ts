
'use server';
/**
 * @fileOverview An AI agent that suggests an optimal schedule time and technician for a new job.
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
  prompt: `You are an intelligent scheduling assistant for a field service company. Your primary goal is to find the best possible time slot for a new job and assign the most suitable technician, while minimizing disruption to other scheduled work.

The current time is {{currentTime}}. All times are in ISO 8601 format.

New Job Details:
- Priority: {{jobPriority}}
- Required Skills: {{#if requiredSkills.length}}{{#each requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Preferred Schedule Date: {{#if preferredDate}}{{preferredDate}} (Try to schedule on or very close to this date).{{else}}None specified.{{/if}}

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
1.  **Respect Preferred Date**: If a 'preferredDate' is provided, your highest priority is to find an open slot on or as close as possible to that date. If it's a 'High' priority job, you can still suggest today if possible, but you must acknowledge the preferred date in your reasoning.
2.  **Respect Exclusions**: Absolutely do not suggest any time from the 'excludedTimes' list.
3.  **Respect Business Hours**: ALL suggestions MUST fall within the company's open business hours. Do not suggest times on days the business is closed.
4.  **Filter Technicians**: Only consider technicians who possess ALL of the "Required Skills". If no technicians have the skills, you cannot make a suggestion.
5.  **Prioritize Minimal Disruption**: Your main goal is to find an open slot. If you must reschedule something to fit this job, only suggest moving a lower-priority job to make room for a higher-priority one.
6.  **High Priority Jobs**: If the job priority is 'High', you MUST suggest the soonest possible time slots, ideally for today or the preferred date, respecting business hours. Find the first available and skilled technician(s).
7.  **Medium or Low Priority Jobs**: For these, prioritize finding an open slot on or after the 'preferredDate'. Standard morning start times (e.g., 9:00 AM, 10:00 AM) are good suggestions if available.
8.  **Output Format**: Your response must be a JSON object containing a "suggestions" array. Each item in the array must have a "time" (in ISO 8601 format), a "technicianId", and a "reasoning". Return up to 5 suggestions.
9.  **Reasoning**: For each suggestion, provide a brief reasoning, mentioning which technician (by name) is available and why this slot is a good fit, especially in relation to the preferred date. For example: "On preferred date. John Doe (HVAC, Electrical) has a clear schedule."
10. If no suitable time slots can be found across all skilled technicians that respect business hours and exclusions, return an empty "suggestions" array.
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
