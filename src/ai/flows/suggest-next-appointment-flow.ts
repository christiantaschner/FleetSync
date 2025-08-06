
'use server';
/**
 * @fileOverview An AI agent that suggests the next appointment date for a recurring contract,
 * drafts a customer notification, and creates a draft job in the system.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestNextAppointmentInputSchema,
  type SuggestNextAppointmentInput,
  SuggestNextAppointmentOutputSchema,
  type SuggestNextAppointmentOutput
} from '@/types';
import { addWeeks, addMonths, format, addDays } from 'date-fns';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function suggestNextAppointment(input: SuggestNextAppointmentInput): Promise<SuggestNextAppointmentOutput> {
  return suggestNextAppointmentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestNextAppointmentPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
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

    Return only the drafted message in the "message" field. The other fields will be populated by the system.
    `,
});

const suggestNextAppointmentFlow = ai.defineFlow(
  {
    name: 'suggestNextAppointmentFlow',
    inputSchema: SuggestNextAppointmentInputSchema,
    outputSchema: SuggestNextAppointmentOutputSchema,
  },
  async (input) => {
    if (!dbAdmin) {
      throw new Error("Firestore Admin SDK has not been initialized.");
    }

    const { contract, companyId, appId } = input;
    const { frequency, lastGeneratedUntil, startDate } = contract;

    // 1. Calculate the next due date
    let nextDate = new Date(lastGeneratedUntil || startDate);
    switch (frequency) {
        case 'Weekly': nextDate = addWeeks(nextDate, 1); break;
        case 'Bi-Weekly': nextDate = addWeeks(nextDate, 2); break;
        case 'Monthly': nextDate = addMonths(nextDate, 1); break;
        case 'Quarterly': nextDate = addMonths(nextDate, 3); break;
        case 'Semi-Annually': nextDate = addMonths(nextDate, 6); break;
        case 'Annually': nextDate = addMonths(nextDate, 12); break;
        default: nextDate = addDays(nextDate, 1); // Default for non-recurring projects
    }

    // Basic business logic: if the date is a weekend, move to the next Monday
    const dayOfWeek = nextDate.getDay();
    if (dayOfWeek === 6) { // Saturday
        nextDate.setDate(nextDate.getDate() + 2);
    } else if (dayOfWeek === 0) { // Sunday
        nextDate.setDate(nextDate.getDate() + 1);
    }
    
    const suggestedDateISO = nextDate.toISOString();
    const suggestedDateFormatted = format(nextDate, 'PPPP'); // e.g., "Tuesday, March 15th, 2025"

    // 2. Call the AI to draft the customer-facing message
    const { output: aiOutput } = await prompt({
        customerName: contract.customerName,
        jobTitle: contract.jobTemplate.title,
        suggestedDate: suggestedDateFormatted,
    });
    
    if (!aiOutput || !aiOutput.message) {
      throw new Error("AI failed to generate a customer message.");
    }

    // 3. Create a new job in "Draft" status
    const jobsCollectionRef = collection(dbAdmin, `artifacts/${appId}/public/data/jobs`);
    const newJobPayload = {
        ...contract.jobTemplate,
        companyId,
        customerName: contract.customerName,
        customerPhone: contract.customerPhone || '',
        customerEmail: '', // Not stored on contract, can be added by dispatcher
        location: { address: contract.customerAddress, latitude: 0, longitude: 0 },
        status: 'Draft' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        scheduledTime: suggestedDateISO,
        sourceContractId: contract.id,
        notes: `Draft generated from Project/Contract ID: ${contract.id} via "Suggest Appointment" feature.`,
    };
    const newJobRef = await addDoc(jobsCollectionRef, newJobPayload);

    // 4. Return the final output
    return {
        createdJobId: newJobRef.id,
        suggestedDate: suggestedDateFormatted,
        message: aiOutput.message,
    };
  }
);
