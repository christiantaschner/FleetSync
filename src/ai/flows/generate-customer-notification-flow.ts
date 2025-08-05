
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
        // Format to "Tuesday, March 15th at 2:00 PM"
        formattedTime = format(new Date(input.appointmentTime), 'PPPPp'); 
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
    
    **Customer & Job Details:**
    - Customer's Name: {{{customerName}}}
    - Technician's Name: {{{technicianName}}}
    {{#if technicianPhotoUrl}}- Technician's Photo: {{media url=technicianPhotoUrl}}{{/if}}
    - Company Name: {{{companyName}}}
    {{#if jobTitle}}- Job: {{{jobTitle}}}{{/if}}
    {{#if appointmentTime}}- Appointment Time: {{{appointmentTime}}}{{/if}}
    {{#if estimatedDurationMinutes}}- Estimated Duration: {{{estimatedDurationMinutes}}} minutes{{/if}}
    {{#if trackingUrl}}- Live Tracking Link: {{{trackingUrl}}}{{/if}}

    **TASK: Generate a notification based on the context.**

    **CONTEXT 1: Standard Appointment Confirmation with Tracking**
    If the goal is to confirm an upcoming appointment (no delay, reschedule, or "En Route" status mentioned), create a comprehensive confirmation message.
    - **Must include:** Greeting, technician's name, full appointment day and time, and the estimated duration.
    - **Must suggest:** Ask the customer to ensure the work area is clear and accessible.
    - **If 'trackingUrl' is provided, you MUST include it.** Phrase it as "You can see your technician's live location on the day of service here: [link]".
    - **Example Structure:** "Hi [Customer Name], this is a friendly reminder from [Company Name] about your upcoming service for '[Job Title]'. Your technician, [Technician Name], is scheduled to arrive on [Appointment Time]. The appointment should take approximately [Duration]. You can see your technician's live location on the day of service here: [trackingUrl]. Please ensure the work area is accessible. Thank you!"

    **CONTEXT 2: Delay Notification**
    If 'delayMinutes' is provided, this is a proactive alert about a potential delay.
    - **Must include:** Greeting, technician's name, reference to their appointment, the approximate delay, and an apology.
    - **If 'trackingUrl' is provided, you MUST include it.**
    - **Example Structure:** "Hi [Customer Name], a quick update from [Company Name]. Your technician, [Technician Name], is running a bit behind and may be delayed by approximately [Delay Minutes] minutes for your '[Job Title]' service. You can track their progress here: [trackingUrl]. We apologize for any inconvenience."

    **CONTEXT 3: Reschedule Notification**
    If 'newTime' is provided, this is a notification about a confirmed schedule change.
    - **Must include:** Greeting, clear statement of the new appointment day/time, and an apology.
    - **DO NOT include a tracking link here**, as a new one will be sent with the confirmation for the new date.
    - **Example Structure:** "Hi [Customer Name], this is an important update from [Company Name] regarding your appointment for '[Job Title]'. We've had to reschedule your service to [New Time]. We sincerely apologize for this change. Please call our office if this new time is inconvenient."

    **CONTEXT 4: "On My Way" Notification**
    If the 'reasonForChange' includes "is on their way", this is an "On My Way" alert.
    - **Must include:** Greeting, technician's name, and a statement that they are on their way.
    - **You MUST include the 'trackingUrl'.** Phrase it as "You can follow their live location and ETA here: [link]".
    - **Example Structure:** "Hi [Customer Name], good news from [Company Name]! Your technician, [Technician Name], is on their way for your '[Job Title]' service. You can follow their live location and ETA here: {{{trackingUrl}}}."

    ---
    **Always end the message with " - from {{{companyName}}}".**
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
