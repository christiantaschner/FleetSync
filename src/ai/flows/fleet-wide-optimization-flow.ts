
'use server';
/**
 * @fileOverview An AI agent that suggests fleet-wide schedule optimizations.
 */
import { ai } from '@/ai/genkit';
import {
  RunFleetOptimizationInputSchema,
  type RunFleetOptimizationInput,
  RunFleetOptimizationOutputSchema,
  type RunFleetOptimizationOutput,
} from '@/types';

export async function runFleetOptimization(input: RunFleetOptimizationInput): Promise<RunFleetOptimizationOutput> {
  return runFleetOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runFleetOptimizationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: RunFleetOptimizationInputSchema },
  output: { schema: RunFleetOptimizationOutputSchema },
  prompt: `You are an expert fleet dispatcher with the goal of maximizing efficiency while minimizing customer disruption.

Your task is to analyze the entire fleet's schedule for today and suggest a set of changes that provides a significant net benefit.

**The Current Time is: {{currentTime}}**

**Core Principle:** Do NOT make changes for the sake of small improvements. Only suggest a change if it solves a clear problem (like fitting in a high-priority job) or offers a substantial efficiency gain (e.g., saving more than 30-45 minutes of total travel time across the fleet). Customer satisfaction is paramount; avoid rescheduling existing appointments unless absolutely necessary.

**Available Technicians and their Current Schedules:**
{{#each technicians}}
- **Technician: {{name}} (ID: {{id}})**
  - Skills: {{#if skills.length}}{{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}
  - On-Call: {{#if isOnCall}}Yes{{else}}No{{/if}}
  - Current Schedule:
    {{#if jobs}}
      {{#each jobs}}
      - Job '{{title}}' (ID: {{id}}), Priority: {{priority}}, Location: {{location.address}}, Scheduled: {{scheduledTime}}
      {{/each}}
    {{else}}
    - No jobs scheduled today.
    {{/if}}
{{/each}}

**Unassigned Jobs in the Queue:**
{{#if pendingJobs.length}}
    {{#each pendingJobs}}
    - **Job '{{title}}' (ID: {{id}})**, Priority: {{priority}}, Required Skills: {{#if requiredSkills.length}}{{#each requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}, Location: {{location.address}}
    {{/each}}
{{else}}
- No pending jobs to assign.
{{/if}}

**Analysis and Suggestion Rules:**
1.  **Prioritize High-Priority Jobs:** Your first goal is to get all High-Priority pending jobs assigned. If a skilled technician is available, assign it. If not, you may suggest reassigning a *low-priority* job from another technician to make space.
2.  **Look for Geographic Clusters:** Identify if unassigned jobs are very close to a skilled technician's existing route. Suggest inserting these jobs if it doesn't create significant delays for their confirmed appointments.
3.  **Minimize Rescheduling:** Only suggest changing the time of an already-scheduled job as a last resort, primarily to accommodate a high-priority emergency.
4.  **Justify Every Change:** For each proposed change in your output, provide a clear, concise \`justification\` explaining the benefit (e.g., "Assigns a high-priority job," "Reduces travel time by 25 minutes by grouping jobs in the same neighborhood," "Frees up a specialized technician for a more complex job later").
5.  **Summarize Overall Benefit:** Provide a high-level \`overallReasoning\` that explains the net benefit of accepting all your proposed changes.

If the current schedule is already optimal or no significant improvements can be made without causing undue disruption, return an empty \`suggestedChanges\` array and state in the \`overallReasoning\` that no changes are recommended at this time.
`,
});

const runFleetOptimizationFlow = ai.defineFlow(
  {
    name: 'runFleetOptimizationFlow',
    inputSchema: RunFleetOptimizationInputSchema,
    outputSchema: RunFleetOptimizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
