
'use server';
/**
 * @fileOverview An AI agent that analyzes a job to predict upsell opportunities.
 */

import {ai} from '@/ai/genkit';
import {
  type SuggestUpsellOpportunityInput,
  SuggestUpsellOpportunityInputSchema,
  type SuggestUpsellOpportunityOutput,
  SuggestUpsellOpportunityOutputSchema,
} from '@/types';

export async function suggestUpsellOpportunity(
  input: SuggestUpsellOpportunityInput
): Promise<SuggestUpsellOpportunityOutput> {
  return suggestUpsellOpportunityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestUpsellOpportunityPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: SuggestUpsellOpportunityInputSchema},
  output: {schema: SuggestUpsellOpportunityOutputSchema},
  prompt: `You are an expert Sales Manager for a field service company. Your task is to analyze a new job request and the customer's history to identify potential upsell opportunities.

**Current Job Request:**
- Title: {{{jobTitle}}}
- Description: {{{jobDescription}}}

**Customer's Past Service History:**
{{#if customerHistory.length}}
  {{#each customerHistory}}
  - Job: "{{{title}}}" - Description: "{{{description}}}" - Completed: {{{completedAt}}}
  {{/each}}
{{else}}
- No past service history available for this customer.
{{/if}}

**Analysis Guidelines:**

1.  **Identify Trigger Words**: Look for keywords in the current job description like "old," "making noise," "inefficient," "flickering," "thinking about replacing," or mentions of specific equipment approaching end-of-life (e.g., "15-year-old water heater").
2.  **Analyze Service History**:
    *   **Frequent Repairs**: Does the customer have a history of frequent, small repairs on the same piece of equipment? This is a strong indicator for a replacement upsell or a preventative maintenance contract.
    *   **Age of Equipment**: If past jobs mention the age of equipment, factor that into your assessment.
    *   **Lack of Maintenance**: If the history shows only emergency repairs and no maintenance, suggest a service contract.
3.  **Identify Related Services**: Does the current job open the door to related services? For example, a "clogged drain" job could lead to a "main sewer line camera inspection." An "AC not cooling" job could lead to a "duct cleaning" suggestion.
4.  **Assign Upsell Score**: Based on your analysis, provide an \`upsellScore\` on a scale of 0.0 to 1.0, where:
    *   **0.0 (None):** No clear opportunity. Simple, one-off fix.
    *   **0.2 (Low):** A slight possibility, but not a strong case. E.g., a single repair on relatively new equipment.
    *   **0.5 (Medium):** A clear opportunity exists. E.g., aging equipment is mentioned, or it's the second repair on the same unit in a year.
    *   **0.8 (High):** A very strong opportunity. E.g., customer explicitly mentions "thinking about replacing," or the equipment is very old and has had multiple repairs.
5.  **Provide Reasoning**: Briefly explain your reasoning for the score. Be specific.

**Example Reasoning:**
- "Score 0.8: High. The customer's water heater is over 15 years old and this is the third repair call in two years. High potential to upsell to a new, more efficient tankless water heater."
- "Score 0.5: Medium. The job is for a flickering light, but the customer has no history of electrical maintenance. Suggests an opportunity to sell a whole-home electrical safety inspection."
- "Score 0.2: Low. This is a standard faucet repair. Low likelihood of a major upsell, but the technician can still mention our annual plumbing check-up."

Provide your response in the specified JSON format.`,
});

const suggestUpsellOpportunityFlow = ai.defineFlow(
  {
    name: 'suggestUpsellOpportunityFlow',
    inputSchema: SuggestUpsellOpportunityInputSchema,
    outputSchema: SuggestUpsellOpportunityOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

    