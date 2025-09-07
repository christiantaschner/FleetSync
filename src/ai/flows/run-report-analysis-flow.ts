
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
  prompt: `You are an expert business analyst and operations consultant for field service companies using the MarginMax application.

Your task is to analyze a set of Key Performance Indicators (KPIs) for a company and provide a concise, actionable report. The report should help a dispatcher or owner understand their performance and know exactly what to do to improve BY USING THE FEATURES AVAILABLE IN THE APP.

**MarginMax Application Features Knowledge Base:**
- **AI Batch Assign:** (On the Job List tab) An AI tool that takes all unassigned jobs and suggests the best technician for each, based on skills, availability, and location. Users can review and confirm these assignments in bulk.
- **AI Suggest Time & Tech:** (In the "Add/Edit Job" dialog) An AI tool that suggests optimal time slots and technicians for a single new job.
- **Schedule Risk Alerts:** (On the Dashboard) Proactive alerts that appear when a technician is at risk of being late for their next job. The alert offers an AI-powered "Resolve" button to reassign or reschedule the at-risk job.
- **Optimize Fleet:** (On the Schedule tab) An AI tool that analyzes the entire day's schedule (for all technicians) and suggests a set of reassignments to improve overall efficiency, fit in high-priority jobs, and reduce travel time.
- **Summarize Feedback (FTFR):** (On the Reports page) An AI tool that analyzes all the "Reason for Follow-up" notes on jobs that were not a first-time fix and provides a summary of common themes (e.g., "Missing Parts", "Incorrect Diagnosis").
- **Triage Links / Request Photos:** (In the "Add/Edit Job" dialog) A feature to generate a secure link to send to a customer, allowing them to upload photos of the issue. The AI analyzes these photos to help technicians prepare.
- **Recurring Contracts:** (In the "Contracts" tab) Allows setting up recurring jobs that are automatically generated on a schedule.

**Here are the KPIs for the selected period:**
- Total Jobs: {{kpiData.totalJobs}}
- Completed Jobs: {{kpiData.completedJobs}}
- First-Time-Fix Rate (FTFR): {{kpiData.ftfr}}%
- On-Time Arrival Rate: {{kpiData.onTimeArrivalRate}}%
- Average Customer Satisfaction: {{kpiData.avgSatisfaction}} / 5
- Average On-Site Duration per Job: {{kpiData.avgDuration}}
- Average Travel Time per Job: {{kpiData.avgTravelTime}}
- Average Time to Assign a Job: {{kpiData.avgTimeToAssign}}
- Average Jobs per Technician: {{kpiData.avgJobsPerTech}}
- SLA Misses: {{kpiData.slaMisses}}
- **Fleet-wide Profit:** \${{kpiData.totalProfit}}
- **AI-Influenced Profit:** \${{kpiData.aiInfluencedProfit}} (from {{kpiData.aiAssistedAssignments}} jobs)
- **AI-Suggested Upsell Revenue:** \${{kpiData.totalUpsellRevenue}}
- Top Technician by Margin: {{#if kpiData.topTechnicianByProfit}}{{kpiData.topTechnicianByProfit.name}} (\${{kpiData.topTechnicianByProfit.margin}}){{else}}N/A{{/if}}

**Your Task (Follow these steps):**
1.  **Analyze KPIs**: Review all the provided numbers. Pay special attention to the AI-specific metrics like AI-Influenced Profit and AI-Assisted Assignments. Compare the fleet-wide profit to the AI-influenced profit.
2.  **Generate Key Insights**: Provide a brief, high-level summary (2-3 sentences) of what the data indicates. Is the team efficient? Is profitability strong? Explicitly state the impact the AI is having on profitability.
3.  **Generate Actionable Suggestions**: Provide a bulleted list of 3-5 concrete suggestions for improvement. **Each suggestion MUST directly relate to a specific feature from the MarginMax Application Features Knowledge Base provided above.** For example, if travel time is high, suggest using the 'Optimize Fleet' feature. If AI-Influenced profit is high, encourage more use of the AI assignment tools.
4.  **Generate Quick Wins**: Provide a bulleted list of 2-3 "quick wins"—simple actions the user can take right now in the app that could have an immediate positive impact, again referencing the specific features.

Your tone should be professional, encouraging, and helpful. Focus on turning data into clear, easy-to-follow actions within the application.
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

    
