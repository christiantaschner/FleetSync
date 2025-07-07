
"use server";

import { allocateJob as allocateJobFlow } from "@/ai/flows/allocate-job";
import { optimizeRoutes as optimizeRoutesFlow } from "@/ai/flows/optimize-routes";
import { suggestJobSkills as suggestJobSkillsFlow } from "@/ai/flows/suggest-job-skills";
import { suggestJobPriority as suggestJobPriorityFlow } from "@/ai/flows/suggest-job-priority";
import { predictNextAvailableTechnicians as predictNextAvailableTechniciansFlow } from "@/ai/flows/predict-next-technician";
import { predictScheduleRisk as predictScheduleRiskFlow } from "@/ai/flows/predict-schedule-risk";
import { generateCustomerNotification as generateCustomerNotificationFlow } from "@/ai/flows/generate-customer-notification-flow";
import { suggestNextAppointment as suggestNextAppointmentFlow } from "@/ai/flows/suggest-next-appointment-flow";
import { troubleshootEquipment as troubleshootEquipmentFlow } from "@/ai/flows/troubleshoot-flow";
import { estimateTravelDistance as estimateTravelDistanceFlow } from "@/ai/flows/estimate-travel-distance-flow";
import { suggestScheduleTime as suggestScheduleTimeFlow } from "@/ai/flows/suggest-schedule-time";
import { triageJob as triageJobFlow } from "@/ai/flows/triage-job-flow";
import { summarizeFtfr as summarizeFtfrFlow } from "@/ai/flows/summarize-ftfr-flow";

import { z } from "zod";
import { dbAdmin } from '@/lib/firebase-admin';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, deleteField, addDoc, updateDoc, arrayUnion, getDoc, limit, orderBy, deleteDoc, arrayRemove } from "firebase/firestore";
import type { Job, Technician, Company } from "@/types";

// Import all required AI-related schemas and types from the central types file
import {
  AllocateJobInputSchema,
  type AllocateJobInput,
  type AllocateJobOutput,
  OptimizeRoutesInputSchema,
  type OptimizeRoutesInput,
  type OptimizeRoutesOutput,
  SuggestJobSkillsInputSchema,
  type SuggestJobSkillsInput,
  type SuggestJobSkillsOutput,
  PredictNextAvailableTechniciansInputSchema,
  type PredictNextAvailableTechniciansInput,
  type PredictNextAvailableTechniciansOutput,
  SuggestJobPriorityInputSchema,
  type SuggestJobPriorityInput,
  type SuggestJobPriorityOutput,
  PredictScheduleRiskInputSchema,
  type PredictScheduleRiskInput,
  type PredictScheduleRiskOutput,
  NotifyCustomerInputSchema,
  type NotifyCustomerInput,
  SuggestNextAppointmentInputSchema,
  type SuggestNextAppointmentInput,
  type SuggestNextAppointmentOutput,
  TroubleshootEquipmentInputSchema,
  type TroubleshootEquipmentInput,
  type TroubleshootEquipmentOutput,
  CalculateTravelMetricsInputSchema,
  SuggestScheduleTimeInputSchema,
  type SuggestScheduleTimeInput,
  type SuggestScheduleTimeOutput,
  type TriageJobOutput,
  type SummarizeFtfrOutput,
} from "@/types";

// Re-export types for use in components
export type AllocateJobActionInput = AllocateJobInput;
export type SuggestJobSkillsActionInput = SuggestJobSkillsInput;
export type SuggestJobPriorityActionInput = SuggestJobPriorityInput;
export type PredictNextAvailableTechniciansActionInput = PredictNextAvailableTechniciansInput;
export type CheckScheduleHealthResult = {
  technician: Technician;
  currentJob: Job;
  nextJob: Job | null;
  risk?: PredictScheduleRiskOutput | null;
  error?: string;
};

export async function allocateJobAction(
  input: AllocateJobActionInput
): Promise<{ data: AllocateJobOutput | null; error: string | null }> {
  try {
    const validatedInput = AllocateJobInputSchema.parse(input);
    const result = await allocateJobFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in allocateJobAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: "Failed to allocate job. Please try again." };
  }
}

export async function optimizeRoutesAction(
  input: OptimizeRoutesInput
): Promise<{ data: OptimizeRoutesOutput | null; error: string | null }> {
  try {
    const validatedInput = OptimizeRoutesInputSchema.parse(input);
    const result = await optimizeRoutesFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in optimizeRoutesAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: "Failed to optimize routes. Please try again." };
  }
}

export async function suggestJobSkillsAction(
  input: SuggestJobSkillsActionInput
): Promise<{ data: SuggestJobSkillsOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestJobSkillsInputSchema.parse(input);
    const result = await suggestJobSkillsFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in suggestJobSkillsAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: "Failed to suggest skills. Please try again." };
  }
}

export async function suggestJobPriorityAction(
  input: SuggestJobPriorityActionInput
): Promise<{ data: SuggestJobPriorityOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestJobPriorityInputSchema.parse(input);
    const result = await suggestJobPriorityFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in suggestJobPriorityAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: "Failed to suggest job priority. Please try again." };
  }
}

export async function predictNextAvailableTechniciansAction(
  input: PredictNextAvailableTechniciansActionInput
): Promise<{ data: PredictNextAvailableTechniciansOutput | null; error: string | null }> {
  try {
    const validatedInput = PredictNextAvailableTechniciansInputSchema.parse(input);
    const result = await predictNextAvailableTechniciansFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in predictNextAvailableTechniciansAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: "Failed to predict next available technicians." };
  }
}

export async function checkScheduleHealthAction(
  { technicians, jobs }: { technicians: Technician[], jobs: Job[] }
): Promise<{ data: CheckScheduleHealthResult[] | null; error: string | null }> {
  try {
    const busyTechnicians = technicians.filter(t => !t.isAvailable && t.currentJobId);
    if (busyTechnicians.length === 0) {
      return { data: [], error: null };
    }

    const results: CheckScheduleHealthResult[] = await Promise.all(
      busyTechnicians.map(async (tech) => {
        const currentJob = jobs.find(j => j.id === tech.currentJobId);
        if (!currentJob || currentJob.status !== 'In Progress' || !currentJob.inProgressAt) {
          return { technician: tech, currentJob: currentJob!, nextJob: null, error: 'Technician not on an active, in-progress job.' };
        }

        const technicianJobs = jobs
          .filter(j => j.assignedTechnicianId === tech.id && j.status === 'Assigned')
          .sort((a, b) => (a.routeOrder ?? Infinity) - (b.routeOrder ?? Infinity));

        const nextJob = technicianJobs.length > 0 ? technicianJobs[0] : null;

        if (!nextJob) {
          return { technician: tech, currentJob, nextJob: null };
        }

        const input: PredictScheduleRiskInput = {
          currentTime: new Date().toISOString(),
          technician: {
            technicianId: tech.id,
            technicianName: tech.name,
            currentLocation: tech.location,
          },
          currentJob: {
            jobId: currentJob.id,
            location: currentJob.location,
            startedAt: currentJob.inProgressAt,
            estimatedDurationMinutes: currentJob.estimatedDurationMinutes || 60,
          },
          nextJob: {
            jobId: nextJob.id,
            location: nextJob.location,
            scheduledTime: nextJob.scheduledTime,
          }
        };

        const riskResult = await predictScheduleRiskFlow(input);
        return { technician: tech, currentJob, nextJob, risk: riskResult };
      })
    );

    return { data: results, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in checkScheduleHealthAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to check schedule health. ${errorMessage}` };
  }
}

export async function notifyCustomerAction(
  input: NotifyCustomerInput
): Promise<{ data: { message: string } | null; error: string | null }> {
  try {
    const validatedInput = NotifyCustomerInputSchema.parse(input);
    
    // Have an AI generate the message for a more professional touch
    const notificationResult = await generateCustomerNotificationFlow({
        customerName: validatedInput.customerName,
        technicianName: validatedInput.technicianName,
        jobTitle: validatedInput.jobTitle,
        delayMinutes: validatedInput.delayMinutes,
        newTime: validatedInput.newTime,
        reasonForChange: validatedInput.reasonForChange,
    });

    const message = notificationResult.message;
    
    // In a real application, this would integrate with an SMS/Email service like Twilio.
    // For this demo, we'll log it and return the message to be displayed in a toast.
    console.log(JSON.stringify({
        message: `Simulating notification for job ${validatedInput.jobId}: "${message}"`,
        severity: "INFO"
    }));
    
    return { data: { message }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in notifyCustomerAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to simulate notification. ${errorMessage}` };
  }
}

export async function suggestNextAppointmentAction(
  input: SuggestNextAppointmentInput
): Promise<{ data: SuggestNextAppointmentOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestNextAppointmentInputSchema.parse(input);
    const result = await suggestNextAppointmentFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in suggestNextAppointmentAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to suggest appointment. ${errorMessage}` };
  }
}

export async function troubleshootEquipmentAction(
  input: TroubleshootEquipmentInput
): Promise<{ data: TroubleshootEquipmentOutput | null; error: string | null }> {
  try {
    const validatedInput = TroubleshootEquipmentInputSchema.parse(input);
    // In a real app, you might fetch a dynamic knowledge base from Firestore here.
    // For now, we'll use a hardcoded example.
    const result = await troubleshootEquipmentFlow({
        ...validatedInput,
        knowledgeBase: "Standard procedure for HVAC units is to first check the thermostat settings, then the circuit breaker, then the air filter for blockages before inspecting any internal components like capacitors or contactors. Always cut power before opening panels."
    });
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in troubleshootEquipmentAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to get troubleshooting steps. ${errorMessage}` };
  }
}

const DEFAULT_EMISSIONS_KG_PER_KM = 0.192; // Avg for a light commercial vehicle

export async function calculateTravelMetricsAction(
  input: z.infer<typeof CalculateTravelMetricsInputSchema>
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, jobId, technicianId, appId } = CalculateTravelMetricsInputSchema.parse(input);

    const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);
    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists() || jobSnap.data().companyId !== companyId) {
        return { error: "Job not found or you do not have permission to modify it." };
    }
    const completedJob = jobSnap.data() as Job;
    if (!completedJob.completedAt) throw new Error("Job is not yet completed.");

    // Fetch company settings to get the custom emission factor
    const companyDocRef = doc(dbAdmin, "companies", companyId);
    const companySnap = await getDoc(companyDocRef);
    const companyData = companySnap.data() as Company;
    const emissionFactor = companyData?.settings?.co2EmissionFactorKgPerKm ?? DEFAULT_EMISSIONS_KG_PER_KM;

    // Broad query that should not require a custom index
    const q = query(
      collection(dbAdmin, `artifacts/${appId}/public/data/jobs`),
      where("assignedTechnicianId", "==", technicianId)
    );
    const jobsSnap = await getDocs(q);

    // Filter and sort in memory to find the immediately preceding job on the same day
    const prevJob = jobsSnap.docs
      .map(doc => doc.data() as Job)
      .filter(job => 
        job.status === "Completed" && 
        job.completedAt &&
        new Date(job.completedAt).getTime() < new Date(completedJob.completedAt!).getTime() &&
        new Date(job.completedAt).getTime() >= new Date(new Date(completedJob.completedAt).setHours(0, 0, 0, 0)).getTime()
      )
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    
    let startLocation: {latitude: number, longitude: number};
    if (prevJob) {
      startLocation = prevJob.location;
    } else {
      // First job of the day, use technician's home base
      const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, technicianId);
      const techSnap = await getDoc(techDocRef);
      if (!techSnap.exists()) throw new Error("Technician not found.");
      const technician = techSnap.data() as Technician;
      startLocation = technician.location;
    }
    
    const endLocation = completedJob.location;

    const distanceResult = await estimateTravelDistanceFlow({
        startLocation: { latitude: startLocation.latitude, longitude: startLocation.longitude },
        endLocation: { latitude: endLocation.latitude, longitude: endLocation.longitude },
    });

    if (distanceResult) {
        const distanceKm = distanceResult.distanceKm;
        const co2EmissionsKg = distanceKm * emissionFactor;

        await updateDoc(jobDocRef, {
            travelDistanceKm: distanceKm,
            co2EmissionsKg: co2EmissionsKg,
        });
    }

    return { error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error calculating travel metrics',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: `Failed to calculate metrics. ${errorMessage}` };
  }
}

export async function suggestScheduleTimeAction(
  input: SuggestScheduleTimeInput
): Promise<{ data: SuggestScheduleTimeOutput | null; error: string | null }> {
  try {
    const validatedInput = SuggestScheduleTimeInputSchema.parse(input);
    const result = await suggestScheduleTimeFlow(validatedInput);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in suggestScheduleTimeAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to suggest schedule time. ${errorMessage}` };
  }
}

const SubmitTriagePhotosInputSchema = z.object({
  token: z.string().min(1),
  appId: z.string().min(1),
  photoDataUris: z.array(z.string()),
});

export async function submitTriagePhotosAction(
  input: z.infer<typeof SubmitTriagePhotosInputSchema>
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
    const { token, appId, photoDataUris } = SubmitTriagePhotosInputSchema.parse(input);
    
    // 1. Validate Token & Get Job
    const jobsQuery = query(collection(dbAdmin, `artifacts/${appId}/public/data/jobs`), where('triageToken', '==', token), limit(1));
    const jobSnapshot = await getDocs(jobsQuery);
    if (jobSnapshot.empty) return { error: "This link is invalid or has expired." };
    
    const jobDoc = jobSnapshot.docs[0];
    const job = { id: jobDoc.id, ...jobDoc.data() } as Job;

    if (job.triageTokenExpiresAt && new Date(job.triageTokenExpiresAt) < new Date()) {
      return { error: "This link has expired." };
    }
    
    // For simplicity, we'll store the data URIs directly on the job for the AI.
    // In a production app, you would upload to storage and store URLs.

    // 2. Call AI Triage Flow
    const aiResult: TriageJobOutput = await triageJobFlow({
      jobId: job.id,
      jobDescription: job.description,
      photoDataUris,
    });
    
    // 3. Update Job Document with results
    await updateDoc(jobDoc.ref, {
      triageImages: photoDataUris, // Note: Storing base64 is not ideal for large images
      aiIdentifiedModel: aiResult.identifiedModel || null,
      aiSuggestedParts: aiResult.suggestedParts || [],
      aiRepairGuide: aiResult.repairGuide || null,
      triageToken: deleteField(), // Invalidate the token after use
      triageTokenExpiresAt: deleteField(),
      updatedAt: serverTimestamp(),
    });

    return { error: null };

  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error submitting triage photos',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: 'An unexpected error occurred.' };
  }
}


export async function summarizeFtfrAction(
  input: { jobs: Job[] }
): Promise<{ data: SummarizeFtfrOutput | null; error: string | null }> {
  try {
    const feedbackNotes = input.jobs
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
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to summarize feedback. ${errorMessage}` };
  }
}
