
'use server';
/**
 * @fileOverview An AI agent that generates a customer notification message.
 *
 * - generateCustomerNotification - Generates a customer-friendly notification about a schedule delay.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCustomerNotificationInputSchema,
  type GenerateCustomerNotificationInput,
  GenerateCustomerNotificationOutputSchema,
  type GenerateCustomerNotificationOutput
} from '@/types';

export async function generateCustomerNotification(input: GenerateCustomerNotificationInput): Promise<GenerateCustomerNotificationOutput> {
  return generateCustomerNotificationFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateCustomerNotificationPrompt',
    input: {schema: GenerateCustomerNotificationInputSchema},
    output: {schema: GenerateCustomerNotificationOutputSchema},
    prompt: `You are a helpful customer service assistant for a field service company.
    
    Your task is to write a polite, concise, and professional SMS message to a customer about a potential schedule delay.
    
    - Customer's Name: {{{customerName}}}
    - Technician's Name: {{{technicianName}}}
    - Estimated Delay: {{{delayMinutes}}} minutes
    
    The message should:
    1. Greet the customer by name.
    2. Briefly state that this is a courtesy alert about their upcoming service.
    3. Inform them that their technician, by name, might be running late by the estimated number of minutes.
    4. Apologize for any inconvenience.
    5. Do not include salutations like "Sincerely" or a company name. Keep it brief for an SMS.
    
    Return a JSON object with the generated message in the "message" field.
    `,
});

const generateCustomerNotificationFlow = ai.defineFlow(
  {
    name: 'generateCustomerNotificationFlow',
    inputSchema: GenerateCustomerNotificationInputSchema,
    outputSchema: GenerateCustomerNotificationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
