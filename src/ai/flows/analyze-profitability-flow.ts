
      
'use server';
/**
 * @fileOverview An AI agent that analyzes the difference between estimated and actual job profit.
 */
import { ai } from '@/ai/genkit';
import {
  AnalyzeProfitabilityInputSchema,
  type AnalyzeProfitabilityInput,
  AnalyzeProfitabilityOutputSchema,
  type AnalyzeProfitabilityOutput,
} from '@/types';

export async function analyzeProfitability(input: AnalyzeProfitabilityInput): Promise<AnalyzeProfitabilityOutput> {
  return analyzeProfitabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProfitabilityPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AnalyzeProfitabilityInputSchema },
  output: { schema: AnalyzeProfitabilityOutputSchema },
  prompt: `You are an expert financial analyst for a field service company. Your task is to provide a concise reason for the difference between an estimated job profit and the actual final profit.

**Estimated Profit:** \${{{estimatedProfit}}}
**Actual Profit:** \${{{actualProfit}}}

Analyze the two numbers and provide a brief, likely reason for the discrepancy.
- If the actual profit is higher, it could be due to a successful upsell or the job being completed faster than estimated.
- If the actual profit is lower, it could be due to the job taking longer than estimated, requiring unexpected parts, or increased travel time.
- If they are very close, state that the estimate was accurate.

Your response should be a single, concise sentence.

Example responses:
- "The estimate was accurate."
- "Actual profit was higher due to a successful upsell."
- "Actual profit was lower because the job took significantly longer than estimated."
- "Actual profit was lower due to unexpected travel delays."

Return the reasoning in the 'reasoning' field of the JSON output.
`,
});

const analyzeProfitabilityFlow = ai.defineFlow(
  {
    name: 'analyzeProfitabilityFlow',
    inputSchema: AnalyzeProfitabilityInputSchema,
    outputSchema: AnalyzeProfitabilityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

    