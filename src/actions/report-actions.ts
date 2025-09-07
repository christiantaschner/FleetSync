
'use server';

import { summarizeFtfr as summarizeFtfrFlow } from "@/ai/flows/summarize-ftfr-flow";
import { runReportAnalysis as runReportAnalysisFlow } from "@/ai/flows/run-report-analysis-flow";
import { z } from "zod";
import type { Job, SummarizeFtfrOutput, RunReportAnalysisInput, RunReportAnalysisOutput } from "@/types";

const SummarizeFtfrActionInputSchema = z.object({
    jobs: z.array(z.any()), // Not parsing full job schema here, just expect an array of job-like objects
});

export async function summarizeFtfrAction(
    input: { jobs: Job[] }
): Promise<{ data: SummarizeFtfrOutput | null; error: string | null }> {
    try {
        const { jobs } = SummarizeFtfrActionInputSchema.parse(input);

        const feedbackNotes = jobs
            .filter(job => job.isFirstTimeFix === false && job.reasonForFollowUp && job.reasonForFollowUp.trim() !== '')
            .map(job => job.reasonForFollowUp!);

        if (feedbackNotes.length === 0) {
            return { data: { summary: "No feedback notes were found in the selected date range for failed first-time fixes.", themes: [] }, error: null };
        }
        
        const result = await summarizeFtfrFlow({ notes: feedbackNotes });

        return { data: result, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map(err => err.message).join(", ") };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error in summarizeFtfrAction',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { data: null, error: `Failed to summarize feedback. ${errorMessage}` };
    }
}

export async function runReportAnalysisAction(
  input: RunReportAnalysisInput
): Promise<{ data: RunReportAnalysisOutput | null; error: string | null }> {
  try {
    const result = await runReportAnalysisFlow(input);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in runReportAnalysisAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}

    