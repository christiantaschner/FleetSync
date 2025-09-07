
'use server';
/**
 * @fileOverview An AI agent that drafts a customer follow-up message based on technician notes.
 */
import { ai } from '@/ai/genkit';
import {
  GenerateCustomerFollowupInputSchema,
  type GenerateCustomerFollowupInput,
  GenerateCustomerFollowupOutputSchema,
  type GenerateCustomerFollowupOutput,
} from '@/types';

export async function generateCustomerFollowup(
  input: GenerateCustomerFollowupInput
): Promise<GenerateCustomerFollowupOutput> {
  return generateCustomerFollowupFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomerFollowupPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateCustomerFollowupInputSchema },
  output: { schema: GenerateCustomerFollowupOutputSchema },
  prompt: `You are a friendly and professional customer service representative for a field service company.

Your task is to analyze a technician's work notes and draft a concise, polite, and helpful follow-up message to the customer.

**Customer Name:** {{{customerName}}}
**Technician Name:** {{{technicianName}}}
**Technician's Notes:**
---
{{{technicianNotes}}}
---

**Instructions:**
1.  **Analyze the Notes:** Read the technician's notes carefully to understand what work was performed.
2.  **Extract Key Information:** Identify any important details, such as parts replaced, issues fixed, or recommendations for the future.
3.  **Draft the Message:** Write a short, friendly message for the customer.
    - Start by thanking them for their business.
    - Briefly mention the work that was completed (e.g., "we're glad we could get your AC running again").
    - If the technician made any specific recommendations (e.g., "replace filter in 3 months," "consider upgrading your old unit soon"), incorporate them as a helpful tip.
    - Keep the tone professional and helpful.
    - Do NOT include any internal jargon, pricing details, or overly technical descriptions from the notes unless they are essential for a customer-facing tip.

**Example:**
-   **Notes:** "Replaced the capacitor on the main AC unit. Unit is now cooling properly. Advised customer that the air filter is dirty and should be replaced within the next month."
-   **Generated Message:** "Hi {{{customerName}}}, this is a follow-up from our team. We're glad {{{technicianName}}} was able to get your AC running smoothly again! As a friendly reminder, he noted that your air filter is due for a replacement soon, which will help keep the system efficient. Thanks for choosing us!"

Return the final drafted message in the 'followupMessage' field of the JSON output.
`,
});

const generateCustomerFollowupFlow = ai.defineFlow(
  {
    name: 'generateCustomerFollowupFlow',
    inputSchema: GenerateCustomerFollowupInputSchema,
    outputSchema: GenerateCustomerFollowupOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
