
'use server';
/**
 * @fileOverview An AI agent that suggests the next appointment date for a recurring contract and drafts a notification.
 */

import { ai } from '@/ai/genkit';
import {
  SuggestNextAppointmentInputSchema,
  type SuggestNextAppointmentInput,
  SuggestNextAppointmentOutputSchema,
  type SuggestNextAppointmentOutput
} from '@/types';
import { addWeeks, addMonths, format } from 'date-fns';
import { z } from 'zod';

export async function suggestNextAppointment(input: SuggestNextAppointmentInput): Promise<SuggestNextAppointmentOutput> {
  return suggestNextAppointmentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestNextAppointmentPrompt',
    input: { schema: z.object({
        customerName: z.string(),
        jobTitle: z.string(),
        suggestedDate: z.string(),
    })},
    output: { schema: SuggestNextAppointmentOutputSchema },
    prompt: `You are a friendly and professional customer service assistant for a field service company.

    Your task is to write a polite and helpful message to a customer to schedule their next recurring maintenance service.
    
    - Customer's Name: {{{customerName}}}
    - Service: {{{jobTitle}}}
    - Suggested Date: {{{suggestedDate}}}

    Draft a message that:
    1. Greets the customer by name.
    2. Reminds them it's time for their recurring '{{{jobTitle}}}' service.
    3. Proposes the suggested date for the appointment.
    4. Asks them to reply to confirm the date or to let you know if another time would be better.
    5. Keep the message concise and friendly. Do not add a sign-off like "Sincerely".

    Return a JSON object with the suggested date and the drafted message.
    `,
});

const suggestNextAppointmentFlow = ai.defineFlow(
  {
    name: 'suggestNextAppointmentFlow',
    inputSchema: SuggestNextAppointmentInputSchema,
    outputSchema: SuggestNextAppointmentOutputSchema,
  },
  async (input) => {
    // 1. Calculate the next due date
    let nextDate = new Date(input.lastAppointmentDate);
    switch (input.frequency) {
        case 'Weekly': nextDate = addWeeks(nextDate, 1); break;
        case 'Bi-Weekly': nextDate = addWeeks(nextDate, 2); break;
        case 'Monthly': nextDate = addMonths(nextDate, 1); break;
        case 'Quarterly': nextDate = addMonths(nextDate, 3); break;
        case 'Semi-Annually': nextDate = addMonths(nextDate, 6); break;
        case 'Annually': nextDate = addMonths(nextDate, 12); break;
    }

    // Basic business logic: if the date is a weekend, move to the next Monday
    const dayOfWeek = nextDate.getDay();
    if (dayOfWeek === 6) { // Saturday
        nextDate.setDate(nextDate.getDate() + 2);
    } else if (dayOfWeek === 0) { // Sunday
        nextDate.setDate(nextDate.getDate() + 1);
    }
    
    const suggestedDate = format(nextDate, 'PPPP'); // e.g., "Tuesday, March 15th, 2025"

    // 2. Call the AI to draft the message
    const { output } = await prompt({
        customerName: input.customerName,
        jobTitle: input.jobTitle,
        suggestedDate: suggestedDate,
    });
    
    // The prompt now returns the full output object, but we need to ensure the suggestedDate is part of it.
    // Since the prompt doesn't know the date, we add it back to the final output.
    if (output) {
      output.suggestedDate = suggestedDate;
    }
    
    return output!;
  }
);

    