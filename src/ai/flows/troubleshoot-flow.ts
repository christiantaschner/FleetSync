
'use server';
/**
 * @fileOverview An AI agent that provides troubleshooting steps for equipment issues.
 */

import {ai} from '@/ai/genkit';
import {
    TroubleshootEquipmentInputSchema,
    type TroubleshootEquipmentInput,
    TroubleshootEquipmentOutputSchema,
    type TroubleshootEquipmentOutput,
} from '@/types';

export async function troubleshootEquipment(input: TroubleshootEquipmentInput): Promise<TroubleshootEquipmentOutput> {
  return troubleshootEquipmentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'troubleshootEquipmentPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: TroubleshootEquipmentInputSchema },
    output: { schema: TroubleshootEquipmentOutputSchema },
    prompt: `You are an AI assistant providing expert technical guidance to a field service technician.

Your task is to analyze a problem description, job history, and an optional photo to provide a clear, step-by-step troubleshooting guide.
Prioritize safety and logical diagnostic flow. Start with the simplest and most common solutions first.

**Current Problem Description:** "{{{query}}}"

{{#if jobDescription}}
**Original Job Description:**
---
{{{jobDescription}}}
---
{{/if}}

{{#if serviceHistory.length}}
**Customer's Service History (most recent first):**
---
{{#each serviceHistory}}
- {{{this}}}
{{/each}}
---
{{/if}}

{{#if photoDataUri}}
Use the attached photo as visual context. It may show a model number, error code, or the physical state of the equipment.
Photo: {{media url=photoDataUri}}
{{/if}}

{{#if knowledgeBase}}
Use the following internal knowledge base as your primary reference:
---
{{{knowledgeBase}}}
---
{{/if}}

Based on all the information provided, generate a list of diagnostic steps. If the service history indicates recurring issues, incorporate that into your diagnosis (e.g., "Since this is the third time we've addressed a leak, check the main valve assembly first...").

Return a JSON object containing an array of "steps" for the technician to follow and a standard safety "disclaimer".
The disclaimer should always remind the technician to follow all standard safety procedures and de-energize equipment before servicing.
`,
});

const troubleshootEquipmentFlow = ai.defineFlow(
  {
    name: 'troubleshootEquipmentFlow',
    inputSchema: TroubleshootEquipmentInputSchema,
    outputSchema: TroubleshootEquipmentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
