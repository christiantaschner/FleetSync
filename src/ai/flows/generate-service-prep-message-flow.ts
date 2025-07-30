
'use server';
/**
 * @fileOverview An AI agent that drafts a message to a customer requesting they upload photos for a service request.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateServicePrepMessageInputSchema = z.object({
  customerName: z.string(),
  companyName: z.string(),
  jobTitle: z.string(),
  triageLink: z.string().url(),
});

const GenerateServicePrepMessageOutputSchema = z.object({
  message: z.string().describe("The full, customer-facing message including the triage link."),
});

export async function generateServicePrepMessage(
  input: z.infer<typeof GenerateServicePrepMessageInputSchema>
): Promise<z.infer<typeof GenerateServicePrepMessageOutputSchema>> {
  return generateServicePrepMessageFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateServicePrepMessagePrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: {schema: GenerateServicePrepMessageInputSchema},
    output: {schema: GenerateServicePrepMessageOutputSchema},
    prompt: `You are a helpful customer service assistant for a field service company called {{{companyName}}}.

Your task is to draft a polite and helpful SMS message to a customer, {{{customerName}}}, asking them to upload photos related to their upcoming service call for "{{{jobTitle}}}".

The goal is to be helpful and incentivize the customer to take action. Explain that providing photos will help the technician prepare for the job and potentially bring the right parts on the first visit, saving them time.

The message must include the following unique link for the customer to upload their photos:
{{{triageLink}}}

Keep the message friendly and professional. End with the company name.
Example Tone: "Hi {{{customerName}}}, to help our technician prepare for your upcoming '{{{jobTitle}}}' service, could you please upload a few photos of the issue at this secure link? It will help us bring the right parts and save you time. {{{triageLink}}} - from {{{companyName}}}"

Return the final message in the 'message' field of the JSON output.
`,
});

const generateServicePrepMessageFlow = ai.defineFlow(
  {
    name: 'generateServicePrepMessageFlow',
    inputSchema: GenerateServicePrepMessageInputSchema,
    outputSchema: GenerateServicePrepMessageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
