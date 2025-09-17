
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
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: RunFleetOptimizationInputSchema },
  output: { schema: RunFleetOptimizationOutputSchema },
  prompt: `You are an expert fleet dispatcher with the primary goal of MAXIMIZING PROFITABILITY for the entire day while maintaining customer satisfaction.

Your task is to analyze the entire fleet's schedule for today and suggest a set of reassignments or schedule adjustments that provides a significant net profit benefit.

**The Current Time is: {{currentTime}}**

**Core Principle:** Do NOT make changes for minor improvements. Only suggest a change if it solves a clear problem (like fitting in a high-priority job) or offers a substantial net profit gain across the fleet. Customer satisfaction is paramount; avoid moving fixed appointments.

**Available Technicians and their Current Schedules:**
{{#each technicians}}
- **Technician: {{name}} (ID: {{id}})**
  - Skills: {{#if skills.length}}{{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}
  - On-Call: {{#if isOnCall}}Yes{{else}}No{{/if}}
  - **Hourly Cost: \${{hourlyCost}}**
  - Current Schedule:
    {{#if jobs}}
      {{#each jobs}}
      - Job '{{title}}' (ID: {{id}}), Priority: {{priority}}, Location: {{location.address}}, Scheduled: {{scheduledTime}}, Flexibility: {{flexibility}}, Locked: {{dispatchLocked}}, **Quoted Value: \${{quotedValue}}**, Est. Duration: {{estimatedDurationMinutes}} mins
      {{/each}}
    {{else}}
    - No jobs scheduled today.
    {{/if}}
{{/each}}

**Unassigned Jobs in the Queue:**
{{#if pendingJobs.length}}
    {{#each pendingJobs}}
    - **Job '{{title}}' (ID: {{id}})**, Priority: {{priority}}, Required Skills: {{#if requiredSkills.length}}{{#each requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}, Location: {{location.address}}, **Quoted Value: \${{quotedValue}}**, Est. Duration: {{estimatedDurationMinutes}} mins
    {{/each}}
{{else}}
- No pending jobs to assign.
{{/if}}

**Analysis and Suggestion Rules:**
1.  **Respect Constraints**: You MUST NOT suggest changes for jobs where \`dispatchLocked\` is true. Jobs with \`flexibility: "fixed"\` should not be moved.
2.  **Calculate Profit Impact**: For each potential change (e.g., moving Job A from Tech 1 to Tech 2), you MUST calculate the net \`profitChange\`. The formula is:
    *Profit = quotedValue - (driveTimeMinutes/60 * tech.hourlyCost) - (durationEstimate/60 * tech.hourlyCost)*.
    You must calculate the profit for the *original* assignment and the *new* assignment and find the difference. A positive \`profitChange\` is good.
3.  **Prioritize High-Priority & High-Profit Jobs**: Your first goal is to get all High-Priority pending jobs assigned. If multiple technicians are available, assign the job to the one that results in the highest profit. If no one is available, you may suggest reassigning a *low-priority*, non-fixed job from another technician to make space, but only if the net profit for the day increases.
4.  **Strategic Rescheduling**: Actively look for opportunities to move a low-profit, 'flexible' job to a later time slot or to a lower-cost technician if it frees up a high-cost, skilled technician for a much more profitable job that needs to be done sooner.
5.  **Look for Geographic & Financial Clusters**: Identify if unassigned jobs are very close to a skilled, lower-cost technician's existing route. Suggest inserting these jobs if it doesn't create significant delays for their confirmed appointments and is profitable.
6.  **Calculate Other Impacts**: For each suggested change, also calculate:
    - \`driveTimeChangeMinutes\`: Estimate the change in total travel time for the technician(s) involved. Negative is good.
    - \`slaRiskChange\`: Estimate the percentage change in the risk of missing an SLA for any affected job. Negative is good.
7.  **Justify Every Change**: Provide a clear, concise \`justification\` explaining the benefit, starting with the financial impact. Examples: "Increases net profit by $55 by assigning to a closer, lower-cost technician.", "Assigns a high-priority job while only slightly reducing margin.", "Frees up a specialized technician for a more complex job later.".
8.  **Summarize Overall Benefit**: Provide a high-level \`overallReasoning\`. If changes are made, summarize the net benefit (e.g., "Assigns 2 high-priority jobs and reduces total travel time by 45 minutes, increasing total margin by $150.").

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
