
"use server";

import { allocateJob as allocateJobFlow } from "@/ai/flows/allocate-job";
import { suggestJobSkills as suggestJobSkillsFlow } from "@/ai/flows/suggest-job-skills";
import { suggestJobParts as suggestJobPartsFlow } from "@/ai/flows/suggest-job-parts";
import { suggestJobPriority as suggestJobPriorityFlow } from "@/ai/flows/suggest-job-priority";
import { predictNextAvailableTechnicians as predictNextAvailableTechniciansFlow } from "@/ai/flows/predict-next-technician";
import { predictScheduleRisk as predictScheduleRiskFlow } from "@/ai/flows/predict-schedule-risk";
import { generateCustomerNotification as generateCustomerNotificationFlow } from "@/ai/flows/generate-customer-notification-flow";
import { troubleshootEquipment as troubleshootEquipmentFlow } from "@/ai/flows/troubleshoot-flow";
import { estimateTravelDistance as estimateTravelDistanceFlow } from "@/ai/flows/estimate-travel-distance-flow";
import { suggestScheduleTime as suggestScheduleTimeFlow } from "@/ai/flows/suggest-schedule-time";
import { triageJob as triageJobFlow } from "@/ai/flows/triage-job-flow";
import { summarizeFtfr as summarizeFtfrFlow } from "@/ai/flows/summarize-ftfr-flow";
import { answerUserQuestion as answerUserQuestionFlow } from "@/ai/flows/help-assistant-flow";
import { generateServicePrepMessage as generateServicePrepMessageFlow } from "@/ai/flows/generate-service-prep-message-flow";
import { runFleetOptimization as runFleetOptimizationFlow } from "@/ai/flows/fleet-wide-optimization-flow";
import { suggestUpsellOpportunity as suggestUpsellOpportunityFlow } from "@/ai/flows/suggest-upsell-opportunity";
import { generateCustomerFollowup as generateCustomerFollowupFlow } from "@/ai/flows/generate-customer-followup-flow";


import { z } from "zod";
import { dbAdmin } from '@/lib/firebase-admin';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, deleteField, addDoc, updateDoc, arrayUnion, getDoc, limit, orderBy, deleteDoc, arrayRemove } from "firebase/firestore";
import type { Job, Technician, Company } from "@/types";
import crypto from 'crypto';
import { addHours, addMinutes } from 'date-fns';


// Import all required AI-related schemas and types from the central types file
import type {
  AllocateJobInput,
  AllocateJobOutput,
  SuggestJobSkillsInput,
  SuggestJobSkillsOutput,
  SuggestJobPartsInput,
  SuggestJobPartsOutput,
  PredictNextAvailableTechniciansInput,
  PredictNextAvailableTechniciansOutput,
  SuggestJobPriorityInput,
  SuggestJobPriorityOutput,
  PredictScheduleRiskInput,
  PredictScheduleRiskOutput,
  NotifyCustomerInput,
  TroubleshootEquipmentInput,
  TroubleshootEquipmentOutput,
  CalculateTravelMetricsInput,
  SuggestScheduleTimeInput,
  SuggestScheduleTimeOutput,
  TriageJobOutput,
  SummarizeFtfrOutput,
  AnswerUserQuestionInput,
  AnswerUserQuestionOutput,
  RunFleetOptimizationInput,
  RunFleetOptimizationOutput,
  SuggestUpsellOpportunityInput,
  SuggestUpsellOpportunityOutput,
  GenerateCustomerFollowupInput,
  GenerateCustomerFollowupOutput,
} from "@/types";
import { AllocateJobInputSchema } from "@/types";

// Re-export types for use in components
export type { AllocateJobActionInput } from "@/types";
export type SuggestJobSkillsActionInput = SuggestJobSkillsInput;
export type SuggestJobPartsActionInput = SuggestJobPartsInput;
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
  input: z.infer<typeof AllocateJobInputSchema>
): Promise<{ data: AllocateJobOutput | null; error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    // Simulate AI logic for mock mode
    const { technicianAvailability, requiredSkills } = input;
    const skillsToMatch = requiredSkills || []; // Ensure requiredSkills is an array
    const suitableTechnician = technicianAvailability.find(tech => 
        tech.isAvailable && 
        (skillsToMatch.length === 0 || skillsToMatch.every(skill => tech.skills.includes(skill)))
    );

    if (suitableTechnician) {
      return { 
        data: { 
          suggestedTechnicianId: suitableTechnician.technicianId,
          reasoning: "Mock Mode: Selected the first available technician with the required skills."
        }, 
        error: null 
      };
    } else {
      return { 
        data: {
          suggestedTechnicianId: null,
          reasoning: "Mock Mode: No available technicians found with the required skills."
        },
        error: null
      };
    }
  }

  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    
    const { appId, customerPhone, ...flowInput } = AllocateJobInputSchema.parse(input);

    if (customerPhone) {
        // Find technicians with history for this customer
        const jobsQuery = query(
            collection(dbAdmin, `artifacts/${appId}/public/data/jobs`),
            where("customerPhone", "==", customerPhone),
            where("status", "==", "Completed")
        );
        const historySnapshot = await getDocs(jobsQuery);
        const techIdsWithHistory = new Set(historySnapshot.docs.map(doc => doc.data().assignedTechnicianId));

        // Augment the technician availability data
        flowInput.technicianAvailability.forEach(tech => {
            if (techIdsWithHistory.has(tech.technicianId)) {
                tech.hasCustomerHistory = true;
            }
        });
    }

    const result = await allocateJobFlow(flowInput, appId);
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
    return { data: null, error: errorMessage };
  }
}

export async function suggestJobSkillsAction(
  input: SuggestJobSkillsActionInput
): Promise<{ data: SuggestJobSkillsOutput | null; error: string | null }> {
  try {
    const result = await suggestJobSkillsFlow(input);
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
    return { data: null, error: errorMessage };
  }
}

export async function suggestJobPartsAction(
  input: SuggestJobPartsActionInput
): Promise<{ data: SuggestJobPartsOutput | null; error: string | null }> {
  try {
    const result = await suggestJobPartsFlow(input);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in suggestJobPartsAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}

export async function suggestJobPriorityAction(
  input: SuggestJobPriorityActionInput
): Promise<{ data: SuggestJobPriorityOutput | null; error: string | null }> {
  try {
    const result = await suggestJobPriorityFlow(input);
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
    return { data: null, error: errorMessage };
  }
}

export async function predictNextAvailableTechniciansAction(
  input: PredictNextAvailableTechniciansActionInput
): Promise<{ data: PredictNextAvailableTechniciansOutput | null; error: string | null }> {
  try {
    const result = await predictNextAvailableTechniciansFlow(input);
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
    return { data: null, error: errorMessage };
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
    return { data: null, error: errorMessage };
  }
}

export async function notifyCustomerAction(
  input: NotifyCustomerInput
): Promise<{ data: { message: string } | null; error: string | null }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");

    const token = crypto.randomUUID();
    const expiresAt = addHours(new Date(), 4);
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    
    const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, input.jobId);
    
    await updateDoc(jobDocRef, {
        trackingToken: token,
        trackingTokenExpiresAt: expiresAt.toISOString(),
    });

    const trackingUrl = `${appUrl}/track/${token}?appId=${appId}`;

    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists()) {
        return { data: null, error: "Job not found." };
    }
    const job = jobSnap.data() as Job;
    let technicianPhotoUrl: string | undefined;

    if (job.assignedTechnicianId) {
        const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
        const techSnap = await getDoc(techDocRef);
        if (techSnap.exists()) {
            technicianPhotoUrl = (techSnap.data() as Technician).avatarUrl;
        }
    }

    // Have an AI generate the message for a more professional touch
    const notificationResult = await generateCustomerNotificationFlow({
        ...input,
        trackingUrl,
        technicianPhotoUrl,
    });

    const message = notificationResult.message;
    
    // In a real application, this would integrate with an SMS/Email service like Twilio.
    // For this demo, we'll log it and return the message to be displayed in a toast.
    console.log(JSON.stringify({
        message: `Simulating notification for job ${input.jobId}: "${message}"`,
        severity: "INFO",
        payload: {
            to: (await getDoc(jobDocRef)).data()?.customerPhone,
            body: message
        }
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
    return { data: null, error: errorMessage };
  }
}

export async function troubleshootEquipmentAction(
  input: TroubleshootEquipmentInput
): Promise<{ data: TroubleshootEquipmentOutput | null; error: string | null }> {
  try {
    // In a real app, you might fetch a dynamic knowledge base from Firestore here.
    // For now, we'll use a hardcoded example.
    const result = await troubleshootEquipmentFlow({
        ...input,
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
    return { data: null, error: errorMessage };
  }
}

const DEFAULT_EMISSIONS_KG_PER_KM = 0.192; // Avg for a light commercial vehicle

export async function calculateTravelMetricsAction(
  input: CalculateTravelMetricsInput
): Promise<{ error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { error: "Mock mode: Data is not saved." };
  }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const { companyId, jobId, technicianId, appId } = input;

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

    const techDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/technicians`, technicianId);
    const techSnap = await getDoc(techDocRef);
    if (!techSnap.exists()) throw new Error("Technician not found.");
    const technician = techSnap.data() as Technician;

    // --- Start of new logic ---
    const updatePayload: any = {};
    
    // Calculate actual travel time
    if(completedJob.enRouteAt && completedJob.inProgressAt) {
      const travelTimeMs = new Date(completedJob.inProgressAt).getTime() - new Date(completedJob.enRouteAt).getTime();
      updatePayload.actualTravelTimeMinutes = Math.round(travelTimeMs / 60000);
    }

    // Calculate actual duration on-site
    if (completedJob.inProgressAt && completedJob.completedAt) {
      const grossDurationMs = new Date(completedJob.completedAt).getTime() - new Date(completedJob.inProgressAt).getTime();
      const breakDurationMs = completedJob.breaks?.reduce((acc, b) => {
        if (b.start && b.end) return acc + (new Date(b.end).getTime() - new Date(b.start).getTime());
        return acc;
      }, 0) || 0;
      updatePayload.actualDurationMinutes = Math.round((grossDurationMs - breakDurationMs) / 60000);
    }
    
    // Calculate actual profit if possible
    if (technician.hourlyCost && completedJob.quotedValue && updatePayload.actualDurationMinutes !== undefined) {
      const laborCost = (technician.hourlyCost / 60) * updatePayload.actualDurationMinutes;
      const travelCost = technician.hourlyCost > 0 && updatePayload.actualTravelTimeMinutes !== undefined
        ? (technician.hourlyCost / 60) * updatePayload.actualTravelTimeMinutes
        : 0;
      const partsCost = completedJob.expectedPartsCost || 0;
      const commission = completedJob.quotedValue * ((technician.commissionRate || 0) / 100) + (technician.bonus || 0);

      updatePayload.actualProfit = completedJob.quotedValue - laborCost - travelCost - partsCost - commission;
    }
    // --- End of new logic ---
    
    // --- Existing Distance Calculation Logic ---
    const q = query(
      collection(dbAdmin, `artifacts/${appId}/public/data/jobs`),
      where("assignedTechnicianId", "==", technicianId)
    );
    const jobsSnap = await getDocs(q);

    const prevJob = jobsSnap.docs
      .map(doc => doc.data() as Job)
      .filter(job => 
        job.status === "Completed" && 
        job.completedAt &&
        new Date(job.completedAt).getTime() < new Date(completedJob.completedAt!).getTime() &&
        new Date(job.completedAt).getTime() >= new Date(new Date(completedJob.completedAt!).setHours(0, 0, 0, 0)).getTime()
      )
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
    
    let startLocation: {latitude: number, longitude: number} = prevJob ? prevJob.location : technician.location;
    const endLocation = completedJob.location;
    
    const distanceResult = await estimateTravelDistanceFlow({
        startLocation: { latitude: startLocation.latitude, longitude: startLocation.longitude },
        endLocation: { latitude: endLocation.latitude, longitude: endLocation.longitude },
    });

    if (distanceResult) {
        updatePayload.travelDistanceKm = distanceResult.distanceKm;
        updatePayload.co2EmissionsKg = distanceResult.distanceKm * emissionFactor;
    }
    
    // --- Commit all updates ---
    if(Object.keys(updatePayload).length > 0) {
      await updateDoc(jobDocRef, updatePayload);
    }

    return { error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error calculating travel metrics',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { error: errorMessage };
  }
}

export async function suggestScheduleTimeAction(
  input: Omit<SuggestScheduleTimeInput, 'businessHours'> & { companyId: string }
): Promise<{ data: SuggestScheduleTimeOutput | null; error: string | null }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    const baseTime = new Date();
    return { data: { suggestions: [ 
        { time: addMinutes(baseTime, 30).toISOString(), reasoning: 'Mock: Alice is free soon.', technicianId: 'tech_1' },
        { time: addMinutes(baseTime, 75).toISOString(), reasoning: 'Mock: Bob has an opening after his current job.', technicianId: 'tech_2' },
        { time: addHours(baseTime, 2).toISOString(), reasoning: 'Mock: Charlie is available this afternoon.', technicianId: 'tech_3' },
    ] }, error: null };
  }
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");

    const companyDocRef = doc(dbAdmin, "companies", input.companyId);
    const companySnap = await getDoc(companyDocRef);
    if (!companySnap.exists()) {
        return { data: null, error: `Company with ID ${input.companyId} not found.` };
    }
    const companyData = companySnap.data() as Company;
    
    const businessHours = companyData.settings?.businessHours;
    if (!businessHours || businessHours.length === 0) {
        return { data: { suggestions: [] }, error: "Company business hours are not configured." };
    }

    const result = await suggestScheduleTimeFlow({
      ...input,
      businessHours: businessHours,
    });
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
    return { data: null, error: errorMessage };
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
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { error: "Mock mode: Data is not saved." };
  }
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
    return { error: errorMessage };
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
    return { data: null, error: errorMessage };
  }
}

const GenerateTriageLinkInputSchema = z.object({
    jobId: z.string().optional(),
    companyId: z.string(),
    appId: z.string().min(1),
    customerName: z.string(),
    jobTitle: z.string(),
});
type GenerateTriageLinkInput = z.infer<typeof GenerateTriageLinkInputSchema>;

export async function generateTriageLinkAction(
    input: GenerateTriageLinkInput
): Promise<{ data: { message: string, token: string } | null; error: string | null }> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const token = crypto.randomUUID();
        const triageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/triage/${token}?appId=${input.appId}`;
        const message = `Hi ${input.customerName}, to help our technician prepare for your "${input.jobTitle}" service, please upload photos of the issue here: ${triageUrl}. It will help us bring the right parts and save you time. - from Mock Company`;
        return { data: { message, token }, error: null };
    }
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized.");
        const { jobId, companyId, appId, customerName, jobTitle } = GenerateTriageLinkInputSchema.parse(input);

        const token = crypto.randomUUID();
        const expiresAt = addHours(new Date(), 24); // Link is valid for 24 hours
        
        // If a jobId is provided, update that job with the token.
        // If not, the token is just used for the message and link generation.
        if (jobId) {
            const jobDocRef = doc(dbAdmin, `artifacts/${appId}/public/data/jobs`, jobId);
            await updateDoc(jobDocRef, {
                triageToken: token,
                triageTokenExpiresAt: expiresAt.toISOString(),
            });
        }
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const triageUrl = `${appUrl}/triage/${token}?appId=${appId}`;
        
        const companyDoc = await getDoc(doc(dbAdmin, 'companies', companyId));
        const companyName = companyDoc.exists() ? companyDoc.data()?.name : 'our team';

        const { message } = await generateServicePrepMessageFlow({
            customerName: customerName,
            companyName: companyName,
            jobTitle: jobTitle,
            triageLink: triageUrl,
        });

        return { data: { message, token }, error: null };

    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error generating triage link',
            error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
            severity: "ERROR"
        }));
        return { data: null, error: `Failed to generate link. ${errorMessage}` };
    }
}

export async function answerUserQuestionAction(
  input: AnswerUserQuestionInput
): Promise<{ data: AnswerUserQuestionOutput | null; error: string | null }> {
  try {
    const result = await answerUserQuestionFlow(input);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error(JSON.stringify({
        message: 'Error in answerUserQuestionAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}

export async function runFleetOptimizationAction(
    input: RunFleetOptimizationInput
): Promise<{ data: RunFleetOptimizationOutput | null; error: string | null }> {
    try {
        const result = await runFleetOptimizationFlow(input);
        return { data: result, error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(", ") };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(JSON.stringify({
            message: 'Error running fleet optimization',
            error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
            severity: "ERROR"
        }));
        return { data: null, error: errorMessage };
    }
}

export async function suggestUpsellOpportunityAction(
    input: SuggestUpsellOpportunityInput
): Promise<{ data: SuggestUpsellOpportunityOutput | null; error: string | null }> {
  try {
    const result = await suggestUpsellOpportunityFlow(input);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in suggestUpsellOpportunityAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}

export async function generateCustomerFollowupAction(
  input: GenerateCustomerFollowupInput
): Promise<{ data: GenerateCustomerFollowupOutput | null; error: string | null }> {
  try {
    const result = await generateCustomerFollowupFlow(input);
    return { data: result, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map(err => err.message).join(", ") };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error in generateCustomerFollowupAction',
        error: { message: errorMessage, stack: e instanceof Error ? e.stack : undefined },
        severity: "ERROR"
    }));
    return { data: null, error: errorMessage };
  }
}

    