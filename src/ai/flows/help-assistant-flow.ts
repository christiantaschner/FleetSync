
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

**Dashboard & Job List Tab:**
- This is your command center. It shows KPIs like High-Priority Queue, Jobs Scheduled Today, and Available Technicians.
- The main view is the Job List, where you can see all jobs.
- **Filtering & Sorting:** You can filter jobs by status and priority, or search by customer, title, description, or skill. You can sort by status, priority, technician, customer, scheduled time, or profit.
- **Adding a Job:** Click 'Add New Job' to open a detailed dialog.
- **Importing Jobs:** Click 'Import Jobs' to upload a CSV file with multiple jobs at once. A template is provided for download.
- **AI Batch Assign:** For all 'Unassigned' jobs, click 'AI Batch Assign' to get intelligent suggestions for all of them. You can review and confirm these assignments in a single step.

**Adding/Editing a Job:**
- You can set customer details, job title, description, priority, location, and scheduling constraints.
- **Financials:** You can input a 'Quoted Value' and 'Expected Parts Cost' to see an estimated profit and margin for the job.
- **AI Job Analysis:** Click the 'Analyze Job' button. The AI will read the job title and description to suggest required skills and identify potential upsell opportunities with talking points for the technician.
- **AI Scheduler:** Click 'AI Suggest Time & Tech'. The AI will find the best time slots and technicians to maximize profitability and efficiency. You can accept a suggestion or get more options.
- **Manual Assignment:** You can always manually select a date, time, and technician.
- **Triage Link:** Generate a unique, secure link to send to customers, allowing them to upload photos of the issue before the visit. The AI analyzes these photos to identify the equipment model and suggest parts.

**Schedule Tab:**
- A visual timeline of all technicians and their jobs for the selected day.
- You can navigate day-by-day or jump to 'Today'.
- **Drag-and-Drop:** Drag unassigned jobs from the left panel onto a technician's timeline to assign them. Drag existing jobs between technicians or to different times to reschedule. Changes are highlighted and must be saved.
- **Optimize Fleet:** Click this button for an AI-powered, fleet-wide analysis. The AI will suggest a set of reassignments to improve overall efficiency and profitability for the entire day.

**Technicians Tab:**
- A roster of all technicians in your company. Viewable as a grid or a compact list.
- Shows availability, skills, contact info, and on-call status.
- **Marking Unavailable:** Admins can mark a technician as unavailable (e.g., for sick leave). This automatically unassigns their active jobs, making them available for reassignment.
- **Editing Technicians:** Admins can edit details like skills, base location, working hours, on-call status, and financial details (hourly cost, commission).
- **Profile Change Requests:** Technicians can request changes to their own profiles (e.g., new skills). These requests appear here for admin approval.

**Customers Tab:**
- A unified list of all customers. You can search, add new customers, or edit existing ones.
- Selecting a customer shows a 360-degree view, including their contact details, a complete history of their past jobs, any active service contracts, and a list of all equipment installed at their location.

**Contracts Tab:**
- Manage recurring service agreements.
- Create new contracts, defining the customer, frequency (e.g., quarterly), and a template for the job to be performed.
- The system uses these contracts to automatically generate jobs when they are due. You can use the 'Generate Recurring Jobs' button to create all due jobs up to a specific date.

**Reports Tab:**
- A comprehensive analytics dashboard to track fleet performance.
- Filter data by date range and by specific technicians.
- **KPIs:** View key metrics like First-Time-Fix Rate, On-Time Arrival Rate, average job duration, travel time, and customer satisfaction.
- **Financials:** Track Fleet-wide Profit, AI-Influenced Profit, and AI-Suggested Upsell Revenue.
- **AI Analysis:** Click 'Get AI Analysis' for a summary of your performance with actionable insights and suggestions for improvement.
- **Export:** Download a CSV of the report data.

**Settings Page:**
- **General:** Set company name, address, timezone, business hours, and company specialties.
- **AI & Automation:** Toggle specific AI features on or off, such as profit-aware dispatching or proactive schedule risk alerts.
- **Billing:** Manage your Stripe subscription, view invoices, and change your number of technician seats.
- **Users:** Invite new admins or technicians to your company and manage their roles.

**Technician Mobile View:**
- A simplified, mobile-first interface for technicians.
- **My Day:** Shows a timeline of the technician's jobs for the current day.
- **Job Details:** Technicians can view all details for an assigned job, including customer info, description, and AI-suggested parts.
- **Status Updates:** Technicians update job status from 'En Route', to 'In Progress', to 'Completed'.
- **Documentation:** Technicians can add work notes, upload photos, log breaks, record whether it was a first-time fix, and capture the customer's signature and satisfaction rating.
- **AI Troubleshooting:** A tool where technicians can describe an issue and get diagnostic steps from the AI.
- **Upsell Logging:** If an AI-suggested upsell is made, the technician can log whether it was 'Sold' or 'Declined' and enter the value.
`;

const prompt = ai.definePrompt({
    name: 'helpAssistantPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: AnswerUserQuestionInputSchema },
    output: { schema: AnswerUserQuestionOutputSchema },
    prompt: `You are a friendly and helpful AI assistant for the MarginMax application named Max.
    
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
