
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
  prompt: `You are an expert Sales Manager for a field service company. Your task is to analyze a new job request, customer history, and your company's service offerings to identify high-value, relevant upsell opportunities.

**Current Job Request:**
- Title: {{{jobTitle}}}
- Description: {{{jobDescription}}}

**Company's Service Specialties (Your offerings):**
{{#if companySpecialties.length}}
    {{#each companySpecialties}}
    - {{{this}}}
    {{/each}}
{{else}}
- No specific specialties listed.
{{/if}}

**Customer's Past Service History:**
{{#if customerHistory.length}}
  {{#each customerHistory}}
  - Job: "{{{title}}}" - Description: "{{{description}}}" - Completed: {{{completedAt}}}
  {{/each}}
{{else}}
- No past service history available for this customer.
{{/if}}

**Analysis Guidelines (Think like a business owner):**

1.  **Prioritize Recurring Revenue**: Your #1 goal is to sell a service contract. If the customer has a history of repairs but no maintenance contract, this is a **high-priority** upsell opportunity. Frame it as "preventative maintenance" or a "service agreement".

2.  **Identify Upgrade Tiers**: Don't just think about the immediate fix. Think about "good, better, best."
    *   **Good**: The basic repair described.
    *   **Better**: A more durable part, a preventative measure (e.g., "Since we're fixing the leak, we can also do a full system flush to prevent future clogs.").
    *   **Best**: A full system upgrade or replacement, especially if keywords like "old," "inefficient," or "frequent repairs" are present.

3.  **Analyze Service Gaps**: Look at your company's specialties. Is the customer only using you for one type of service (e.g., Plumbing) but you also offer Electrical? If the current job is for an old house, this is a perfect chance to suggest a "whole-home electrical safety inspection."

4.  **Assign Upsell Score**: Provide an \`upsellScore\` from 0.0 to 1.0:
    *   **0.0 (None):** No clear opportunity. Simple, one-off fix on new equipment.
    *   **0.2 (Low):** Minor opportunity. E.g., suggest a drain cleaner product after a clog removal.
    *   **0.5 (Medium):** A clear opportunity exists. E.g., aging equipment is mentioned, or it's the second repair on the same unit in a year. Good chance to offer a service contract.
    *   **0.8 (High):** A very strong opportunity. E.g., customer explicitly mentions "thinking about replacing," the equipment is very old with multiple repairs, or they are a perfect candidate for a service contract they don't have.

5.  **Provide High-Value Reasoning**: Your reasoning should be a concise, actionable talking point for the technician.
    *   **Bad Reasoning**: "Suggest upsell."
    *   **Good Reasoning**: "High opportunity. The water heater is 15+ years old and this is the third repair. Pitch a full replacement to a new tankless system, emphasizing long-term energy savings."
    *   **Excellent Reasoning**: "High opportunity. Customer has had 3 plumbing repairs in 2 years but no maintenance. Pitch our Annual Service Contract to prevent future emergencies and save them money."

Provide your response in the specified JSON format. If no opportunity is found, return a score of 0.0 and "No clear upsell opportunity." as the reasoning.`,
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
