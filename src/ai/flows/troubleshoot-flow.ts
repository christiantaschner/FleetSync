
'use server';
/**
 * @fileOverview An AI agent that provides troubleshooting steps for equipment issues.
 */

import { ai } from '@/ai/genkit';
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
    input: { schema: TroubleshootEquipmentInputSchema },
    output: { schema: TroubleshootEquipmentOutputSchema },
    prompt: `You are an AI assistant providing expert technical guidance to a field service technician.

Your task is to analyze a problem description and provide a clear, step-by-step troubleshooting guide.
Prioritize safety and logical diagnostic flow.

Start with the simplest and most common solutions first.

Problem Description: "{{{query}}}"

{{#if knowledgeBase}}
Use the following internal knowledge base as your primary reference:
---
{{{knowledgeBase}}}
---
{{/if}}

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
