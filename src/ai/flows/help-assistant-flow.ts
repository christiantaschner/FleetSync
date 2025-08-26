
'use server';
/**
 * @fileOverview An AI agent that answers user questions about how to use the MarginMax application.
 *
 * - answerUserQuestion - A function that provides help for user queries.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  AnswerUserQuestionInputSchema,
  AnswerUserQuestionOutputSchema,
  type AnswerUserQuestionInput,
  type AnswerUserQuestionOutput
} from '@/types';

const knowledgeBase = `
Feature Documentation for MarginMax:

Dashboard:
- Main view with KPIs: High-Priority Queue, Pending Jobs, Available Technicians, Jobs Scheduled Today.
- Tabs for Job List, Schedule, Technicians, and Map.
- Admins can add jobs, import jobs via CSV, and batch assign pending jobs using AI.
- The Job List can be filtered by status and priority, and sorted.
- Clicking a job opens the Edit Job dialog.

Adding/Editing Jobs:
- Dialog allows setting title, description, priority, customer details, location, and schedule time.
- AI can suggest required skills based on the job description.
- AI can suggest the best technician based on skills, availability, and location.
- Technicians are assigned manually from a dropdown or by using the AI suggestion.

Schedule View:
- Visual timeline of technicians and their assigned jobs for a given day.
- Can navigate day-by-day or jump to 'Today'.
- Includes a 'Re-Optimize Schedule' button for a selected technician.

Technician Roster:
- A view of all technicians in the company.
- Shows their availability, skills, and on-call status.
- Admins can edit technician details (skills, working hours, on-call status).

Technician Mobile View:
- A simplified view for technicians showing only their assigned jobs.
- They can update job statuses (En Route, In Progress, Completed, Cancelled).
- They can document work with notes and photos.
- They can capture customer signatures and satisfaction ratings.

Settings:
- General: Company details, business hours, CO2 emission factor, hide help button.
- Billing: Manage Stripe subscription.
- Users: Invite new users (admins or technicians) and manage roles.
- Contracts: Manage recurring service contracts.
- Customers: View a unified list of all customers.
- Reports: View analytics and KPIs for the fleet.
`;

const prompt = ai.definePrompt({
    name: 'helpAssistantPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: AnswerUserQuestionInputSchema },
    output: { schema: AnswerUserQuestionOutputSchema },
    prompt: `You are Fleety, a friendly and helpful AI assistant for the MarginMax application.
    
    Your goal is to answer user questions about how to use the software. You must respond in the user's specified language, which is "{{language}}".
    
    Use the provided knowledge base below to answer the user's question. Keep your answers concise, clear, and easy to understand for a non-technical audience. Use bullet points if it helps with clarity.
    
    If the question is unrelated to MarginMax, politely state that you can only answer questions about the application.

    ---
    KNOWLEDGE BASE:
    ${knowledgeBase}
    ---
    
    User's Question: "{{{question}}}"

    If you are giving instructions, refer to button labels and page titles exactly as they are in the knowledge base.
    `,
});

export async function answerUserQuestion(input: AnswerUserQuestionInput): Promise<AnswerUserQuestionOutput> {
  return answerUserQuestionFlow(input);
}

const answerUserQuestionFlow = ai.defineFlow(
  {
    name: 'answerUserQuestionFlow',
    inputSchema: AnswerUserQuestionInputSchema,
    outputSchema: AnswerUserQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

    