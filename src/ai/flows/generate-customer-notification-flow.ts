
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
import { format } from 'date-fns';

export async function generateCustomerNotification(input: GenerateCustomerNotificationInput): Promise<GenerateCustomerNotificationOutput> {
  let formattedTime: string | undefined;
  if (input.appointmentTime) {
      try {
        formattedTime = format(new Date(input.appointmentTime), 'p'); // e.g., 2:00 PM
      } catch (e) {
        // Ignore invalid dates
      }
  }

  return generateCustomerNotificationFlow({ ...input, appointmentTime: formattedTime });
}

const prompt = ai.definePrompt({
    name: 'generateCustomerNotificationPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: {schema: GenerateCustomerNotificationInputSchema},
    output: {schema: GenerateCustomerNotificationOutputSchema},
    prompt: `You are a helpful customer service assistant for a field service company.
    
    Your task is to write a polite, concise, and professional SMS message to a customer. The tone should adapt based on the situation.
    
    - Customer's Name: {{{customerName}}}
    - Technician's Name: {{{technicianName}}}
    {{#if jobTitle}}- Job: {{{jobTitle}}}{{/if}}
    
    {{#if delayMinutes}}
    This is a proactive alert about a potential delay.
    - Estimated Delay: {{{delayMinutes}}} minutes
    
    The message should:
    1. Greet the customer by name.
    2. Reference their service appointment{{#if jobTitle}} for "{{{jobTitle}}}"{{/if}}.
    3. Inform them that their technician, {{{technicianName}}}, might be running late by approximately {{{delayMinutes}}} minutes.
    4. Apologize for any inconvenience.
    {{/if}}
    
    {{#if newTime}}
    This is a notification about a confirmed schedule change.
    - New Appointment Time: {{{newTime}}}
    
    The message should:
    1. Greet the customer by name.
    2. Inform them that their appointment{{#if jobTitle}} for "{{{jobTitle}}}"{{/if}} has been rescheduled.
    3. Clearly state the new appointment is for {{{newTime}}}.
    4. Apologize for the change and advise them to call our office if this new time is inconvenient.
    {{/if}}
    
    {{#if reasonForChange}}
    Please include this reason in the message in a customer-friendly way: "{{{reasonForChange}}}"
    {{/if}}

    The message must always end with " - from {{{companyName}}}".

    {{#if appointmentTime}}
    If there is no specific delay or new time, but an appointment time is provided, create a general notification confirming the upcoming appointment. For example: "Hi {{{customerName}}}, this is a reminder from {{{companyName}}} about your appointment for '{{{jobTitle}}}' with {{{technicianName}}} scheduled for today at {{appointmentTime}}."
    {{/if}}

    Do not include salutations like "Sincerely". Keep it brief for an SMS.
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
    const { output } = await prompt(input);
    return output!;
  }
);
