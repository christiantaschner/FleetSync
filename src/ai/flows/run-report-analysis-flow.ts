
'use server';
/**
 * @fileOverview An AI agent that analyzes fleet performance KPIs and suggests actionable insights.
 */
import { ai } from '@/ai/genkit';
import {
  RunReportAnalysisInputSchema,
  type RunReportAnalysisInput,
  RunReportAnalysisOutputSchema,
  type RunReportAnalysisOutput,
} from '@/types';

export async function runReportAnalysis(input: RunReportAnalysisInput): Promise<RunReportAnalysisOutput> {
  return runReportAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runReportAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: RunReportAnalysisInputSchema },
  output: { schema: RunReportAnalysisOutputSchema },
  prompt: `You are an expert business analyst and operations consultant for field service companies.

Your task is to analyze a set of Key Performance Indicators (KPIs) for a company and provide a concise, actionable report. The report should help a dispatcher or owner understand their performance and know exactly what to do to improve.

Here are the KPIs for the selected period:
- Total Jobs: {{kpiData.totalJobs}}
- Completed Jobs: {{kpiData.completedJobs}}
- First-Time-Fix Rate: {{kpiData.ftfr}}%
- On-Time Arrival Rate: {{kpiData.onTimeArrivalRate}}%
- Average Customer Satisfaction: {{kpiData.avgSatisfaction}} / 5
- Average On-Site Duration per Job: {{kpiData.avgDuration}}
- Average Travel Time per Job: {{kpiData.avgTravelTime}}
- Average Time to Assign a Job: {{kpiData.avgTimeToAssign}}
- Average Jobs per Technician: {{kpiData.avgJobsPerTech}}

Based on these numbers, generate a report with three sections:

1.  **Key Insights**: Provide a brief, high-level summary (2-3 sentences) of what the data indicates. Is the team efficient? Is customer satisfaction high? Where are the potential problem areas?

2.  **Actionable Suggestions**: Provide a bulleted list of 3-5 concrete suggestions for improvement. Each suggestion MUST directly relate to a feature in the FleetSync AI application. For example, if travel time is high, suggest using the 'Optimize Fleet' feature. If time-to-assign is high, suggest using 'Fleety Batch Assign'. Be specific.

3.  **Quick Wins**: Provide a bulleted list of 2-3 "quick wins"—simple actions the user can take right now in the app that could have an immediate positive impact.

Your tone should be professional, encouraging, and helpful. Focus on turning data into clear, easy-to-follow actions.
`,
});

const runReportAnalysisFlow = ai.defineFlow(
  {
    name: 'runReportAnalysisFlow',
    inputSchema: RunReportAnalysisInputSchema,
    outputSchema: RunReportAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
