
import { z } from "zod";

// --- Core Data Models ---

export type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type TechnicianSkill = string; 

export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string(),
    companyId: z.string().nullable(),
    role: z.enum(['admin', 'technician', 'superAdmin', 'accountant']).nullable(),
    onboardingStatus: z.enum(['pending_creation', 'pending_onboarding', 'completed']),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const InviteSchema = z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'technician', 'accountant']),
    companyId: z.string(),
    status: z.enum(['pending', 'accepted']),
    createdAt: z.string(),
    acceptedAt: z.string().optional(),
    acceptedByUid: z.string().optional(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const BusinessDaySchema = z.object({
  dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  isOpen: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format, use HH:MM" }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format, use HH:MM" }),
});
export type BusinessDay = z.infer<typeof BusinessDaySchema>;

export const CompanySettingsSchema = z.object({
  address: z.string().optional(),
  timezone: z.string().optional(),
  businessHours: z.array(BusinessDaySchema).length(7).optional(),
  co2EmissionFactorKgPerKm: z.number().optional().describe("Custom CO2 emission factor in kg per km. Set to 0 for electric fleets."),
  companySpecialties: z.array(z.string()).min(1, 'Please select at least one company specialty.'),
  otherSpecialty: z.string().optional(),
  hideHelpButton: z.boolean().optional(),
}).refine(data => {
    if (data.companySpecialties.includes('Other')) {
        return data.otherSpecialty && data.otherSpecialty.trim().length > 0;
    }
    return true;
}, {
    message: "Please specify your other specialty.",
    path: ["otherSpecialty"],
});
export type CompanySettings = z.infer<typeof CompanySettingsSchema>;


export const CompanySchema = z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    createdAt: z.string().optional(),
    settings: CompanySettingsSchema.optional(),

    // Stripe fields
    stripeCustomerId: z.string().optional(),
    subscriptionId: z.string().optional(),
    subscriptionStatus: z.enum(['trialing', 'active', 'past_due', 'canceled', 'unpaid']).optional(),
    trialEndsAt: z.string().optional(), // ISO string
    technicianSeatCount: z.number().optional().default(1),
});
export type Company = z.infer<typeof CompanySchema>;


export type Technician = {
  id: string; // This will be the same as the user's UID
  companyId: string;
  name: string;
  isAvailable: boolean;
  skills: string[]; 
  partsInventory?: string[];
  avatarUrl?: string;
  currentJobId?: string | null;
  phone?: string;
  email: string; // Email is required for a technician
  createdAt?: string;
  updatedAt?: string;
  unavailabilityReason?: string;
  unavailableFrom?: string;
  unavailableUntil?: string;
  location: Location;
  workingHours?: BusinessDay[];
  isOnCall?: boolean;
};

export type JobPriority = 'High' | 'Medium' | 'Low';
export type JobStatus = 'Pending' | 'Assigned' | 'En Route' | 'In Progress' | 'Completed' | 'Pending Invoice' | 'Finished' | 'Cancelled' | 'Draft';

export type ChecklistResult = {
    item: string;
    checked: boolean;
}

export type Job = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  assignedTechnicianId?: string | null;
  location: Location;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  scheduledTime?: string | null;
  estimatedDurationMinutes?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  photos?: string[];
  requiredSkills?: string[];
  requiredParts?: string[];
  customerSignatureUrl?: string;
  customerSignatureTimestamp?: string;
  assignedAt?: string;
  enRouteAt?: string;
  inProgressAt?: string;
  completedAt?: string;
  routeOrder?: number;
  customerSatisfactionScore?: number;
  isFirstTimeFix?: boolean;
  reasonForFollowUp?: string;
  sourceContractId?: string;
  breaks?: { start: string; end?: string; }[];
  checklistResults?: ChecklistResult[];
  trackingToken?: string;
  trackingTokenExpiresAt?: string;
  triageToken?: string;
  triageTokenExpiresAt?: string;
  triageImages?: string[]; // Storing as data URIs or storage URLs
  aiIdentifiedModel?: string;
  aiSuggestedParts?: string[];
  aiRepairGuide?: string;
  travelDistanceKm?: number;
  co2EmissionsKg?: number;
  invoiceUrl?: string;
  invoiceUploadedAt?: string;
  invoiceUploadedBy?: string;
};

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string(),
  address: z.string(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export type PublicTrackingInfo = {
    jobTitle: string;
    jobStatus: JobStatus;
    jobLocation: Location;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    actualStartTime: string | null;
    actualEndTime: string | null;
    technicianName: string;
    technicianPhotoUrl: string | null;
    technicianPhoneNumber: string | null;
    currentTechnicianLocation: Location | null;
    etaToJob: number | null; // in minutes
    customerName: string;
};

export type Task = {
  taskId: string;
  location: Location;
  priority: 'high' | 'medium' | 'low';
  description?: string;
};

// For AI flow inputs specifically
export type AITask = {
  taskId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  priority: 'high' | 'medium' | 'low';
  scheduledTime?: string | null;
};

export type AITechnician = {
  technicianId: string;
  technicianName: string;
  isAvailable: boolean;
  skills: string[];
  currentJobs: {
    jobId: string;
    location: Location;
    scheduledTime?: string | null;
    priority: JobPriority;
  }[];
  liveLocation: Location;
  homeBaseLocation: Location;
  workingHours?: BusinessDay[];
  isOnCall?: boolean;
};

export type ProfileChangeRequest = {
    id: string;
    companyId: string;
    technicianId: string;
    technicianName: string;
    requestedChanges: Record<string, any>;
    notes: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewedAt?: string;
    reviewerId?: string;
    approvedChanges?: Record<string, any>;
    reviewNotes?: string;
}

export type ChatMessage = {
    id: string;
    jobId: string;
    companyId: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    text: string;
    imageUrl?: string | null;
    timestamp: string;
    isRead: boolean;
}

export const ContractSchema = z.object({
    id: z.string().optional(),
    companyId: z.string(),
    customerName: z.string().min(1, "Customer name is required."),
    customerPhone: z.string().optional(),
    customerAddress: z.string().min(1, "Customer address is required."),
    frequency: z.enum(['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually']),
    startDate: z.string().describe("The start date of the contract in ISO 8601 format."),
    jobTemplate: z.object({
        title: z.string().min(1, "Job title is required."),
        description: z.string().min(1, "Job description is required."),
        priority: z.enum(['High', 'Medium', 'Low']),
        estimatedDurationMinutes: z.number().positive("Duration must be positive.").optional(),
        requiredSkills: z.array(z.string()).optional(),
        requiredParts: z.array(z.string()).optional(),
    }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    lastGeneratedUntil: z.string().optional().describe("The last date up to which jobs were generated for this contract."),
    isActive: z.boolean().default(true),
});
export type Contract = z.infer<typeof ContractSchema>;

export const EquipmentSchema = z.object({
    id: z.string().optional(),
    companyId: z.string(),
    customerId: z.string(),
    customerName: z.string(),
    name: z.string(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    installDate: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type Equipment = z.infer<typeof EquipmentSchema>;

export const StripeProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    features: z.array(z.string()).optional(),
    price: z.object({
        id: z.string(),
        amount: z.number().nullable(),
        currency: z.string(),
        interval: z.string().nullable(),
    }),
});
export type StripeProduct = z.infer<typeof StripeProductSchema>;

export const CustomerDataSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  name: z.string().min(1, 'Customer name is required.'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.string(),
});
export type CustomerData = z.infer<typeof CustomerDataSchema>;

export const DispatcherFeedbackSchema = z.object({
    id: z.string().optional(),
    companyId: z.string(),
    jobId: z.string(),
    aiSuggestedTechnicianId: z.string(),
    dispatcherSelectedTechnicianId: z.string(),
    aiReasoning: z.string(),
    dispatcherReasoning: z.string().optional(),
    createdAt: z.string(),
});
export type DispatcherFeedback = z.infer<typeof DispatcherFeedbackSchema>;


// --- AI Flow Schemas ---

export const AllocateJobInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job to be assigned.'),
  jobPriority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the job.'),
  requiredSkills: z.array(z.string()).optional().describe('A list of skills explicitly required for this job. This is a hard requirement.'),
  scheduledTime: z.string().optional().nullable().describe('Optional specific requested appointment time by the customer (ISO 8601 format).'),
  currentTime: z.string().describe('The current time in ISO 8601 format. Use this to determine if the job is for today or a future day.'),
  technicianAvailability: z.array(
    z.object({
      technicianId: z.string().describe('The unique identifier of the technician.'),
      technicianName: z.string().describe('The name of the technician.'),
      isAvailable: z.boolean().describe('Whether the technician is currently available. This is a critical factor.'),
      isOnCall: z.boolean().optional().describe('Whether the technician is on call for emergencies.'),
      workingHours: z.array(BusinessDaySchema).optional().describe("The technician's individual working hours."),
      skills: z.array(z.string()).describe('The skills possessed by the technician.'),
      liveLocation: z.any().describe('The current, real-time location of the technician.'),
      homeBaseLocation: z.any().describe('The technician\'s home base or starting location for the day.'),
      currentJobs: z.array(z.object({
        jobId: z.string(),
        location: z.any().describe("The location of this scheduled job."),
        scheduledTime: z.string().optional().nullable(),
        priority: z.enum(['High', 'Medium', 'Low']),
      })).optional().describe("A list of jobs already assigned to the technician, with their scheduled times and priorities."),
    })
  ).describe('A list of technicians and their availability, skills, and location.'),
  pastFeedback: z.array(DispatcherFeedbackSchema).optional().describe("A list of past dispatcher decisions that overrode the AI's suggestion, to be used as learning examples."),
});
export type AllocateJobInput = z.infer<typeof AllocateJobInputSchema>;

export const AllocateJobOutputSchema = z.object({
  suggestedTechnicianId: z.string().nullable().describe('The ID of the most suitable technician for the job, or null if no one is suitable.'),
  reasoning: z.string().describe('The reasoning behind the technician suggestion. If no technician is suitable, you must explain why.'),
});
export type AllocateJobOutput = z.infer<typeof AllocateJobOutputSchema>;


export const OptimizeRoutesInputSchema = z.object({
  technicianId: z.string().describe('The ID of the technician.'),
  currentLocation: z.any().describe('The current location of the technician.'),
  tasks: z
    .array(
      z.object({
        taskId: z.string().describe('The ID of the task.'),
        location: z.any().describe('The location of the task.'),
        priority: z.enum(['high', 'medium', 'low']).describe('The priority of the task.'),
        scheduledTime: z.string().optional().nullable().describe('Optional specific requested appointment time for this task (ISO 8601 format). This is a strong constraint if provided.'),
      })
    )
    .describe('The list of tasks to be performed.'),
  trafficData: z
    .string()
    .optional()
    .describe('Optional real-time traffic data. Provide as a JSON string if available.'),
  unexpectedEvents: z
    .string()
    .optional()
    .describe('Optional information about unexpected events. Provide as a JSON string if available.'),
});
export type OptimizeRoutesInput = z.infer<typeof OptimizeRoutesInputSchema>;

export const OptimizeRoutesOutputSchema = z.object({
  optimizedRoute: z
    .array(
      z.object({
        taskId: z.string().describe('The ID of the task in the optimized route.'),
        estimatedArrivalTime: z.string().describe('The estimated arrival time for the task.'),
      })
    )
    .describe('The optimized route for the technician.'),
  totalTravelTime: z.string().describe('The total estimated travel time for the optimized route.'),
  reasoning: z.string().describe('The reasoning behind the optimized route.'),
});
export type OptimizeRoutesOutput = z.infer<typeof OptimizeRoutesOutputSchema>;

export const PredictNextAvailableTechniciansInputSchema = z.object({
  activeJobs: z.array(
    z.object({
      jobId: z.string(),
      title: z.string(),
      assignedTechnicianId: z.string(),
      estimatedDurationMinutes: z.number().optional(),
      startedAt: z.string().optional().describe("ISO 8601 timestamp of when the job started."),
    })
  ).describe("A list of all jobs currently in progress."),
  busyTechnicians: z.array(
    z.object({
      technicianId: z.string(),
      technicianName: z.string(),
      currentLocation: z.any(),
      currentJobId: z.string(),
    })
  ).describe("A list of all technicians currently on a job."),
  currentTime: z.string().describe("The current time in ISO 8601 format, to be used as the baseline for predictions."),
});
export type PredictNextAvailableTechniciansInput = z.infer<typeof PredictNextAvailableTechniciansInputSchema>;

export const PredictNextAvailableTechniciansOutputSchema = z.object({
  predictions: z.array(
    z.object({
      technicianId: z.string(),
      technicianName: z.string(),
      estimatedAvailabilityTime: z.string().describe("The estimated time the technician will be available, in ISO 8601 format."),
      reasoning: z.string().describe("A brief explanation of the prediction."),
    })
  ).describe("A ranked list of technicians predicted to be available next, sorted by estimated availability time."),
});
export type PredictNextAvailableTechniciansOutput = z.infer<typeof PredictNextAvailableTechniciansOutputSchema>;


export const SuggestJobSkillsInputSchema = z.object({
  jobTitle: z.string().optional().describe('The title of the job.'),
  jobDescription: z.string().describe('The description of the job.'),
  availableSkills: z.array(z.string()).describe('The list of all possible skills in the system.'),
});
export type SuggestJobSkillsInput = z.infer<typeof SuggestJobSkillsInputSchema>;

export const SuggestJobSkillsOutputSchema = z.object({
  suggestedSkills: z.array(z.string()).describe('An array of skill names suggested for the job, drawn exclusively from the availableSkills list.'),
  reasoning: z.string().optional().describe('A brief explanation for why these skills were chosen, or why no skills could be suggested if the list is empty.'),
});
export type SuggestJobSkillsOutput = z.infer<typeof SuggestJobSkillsOutputSchema>;

export const SuggestJobPartsInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  availableParts: z.array(z.string()).describe('The list of all possible parts in the system inventory.'),
});
export type SuggestJobPartsInput = z.infer<typeof SuggestJobPartsInputSchema>;

export const SuggestJobPartsOutputSchema = z.object({
  suggestedParts: z.array(z.string()).describe('An array of part names suggested for the job, drawn exclusively from the availableParts list.'),
});
export type SuggestJobPartsOutput = z.infer<typeof SuggestJobPartsOutputSchema>;

export const SuggestJobPriorityInputSchema = z.object({
  jobDescription: z.string().describe('The job description to analyze.'),
});
export type SuggestJobPriorityInput = z.infer<typeof SuggestJobPriorityInputSchema>;

export const SuggestJobPriorityOutputSchema = z.object({
  suggestedPriority: z.enum(['High', 'Medium', 'Low']).describe("The AI's suggested priority for the job."),
  reasoning: z.string().describe('A brief explanation for the suggested priority.'),
});
export type SuggestJobPriorityOutput = z.infer<typeof SuggestJobPriorityOutputSchema>;

export const ConfirmManualRescheduleInputSchema = z.object({
  companyId: z.string(),
  appId: z.string(),
  technicianId: z.string().describe("The ID of the technician whose route is being updated."),
  movedJobId: z.string().describe("The ID of the job that was manually moved."),
  newScheduledTime: z.string().describe("The new scheduled time for the moved job (ISO 8601 format)."),
  optimizedRoute: OptimizeRoutesOutputSchema.shape.optimizedRoute,
  // Add feedback fields
  aiSuggestedTechnicianId: z.string().optional(),
  aiReasoning: z.string().optional(),
});
export type ConfirmManualRescheduleInput = z.infer<typeof ConfirmManualRescheduleInputSchema>;

export const ApproveProfileChangeRequestInputSchema = z.object({
    companyId: z.string(),
    appId: z.string(),
    requestId: z.string(),
    technicianId: z.string(),
    approvedChanges: z.record(z.any()),
    reviewNotes: z.string().optional(),
});

export const RejectProfileChangeRequestInputSchema = z.object({
    companyId: z.string(),
    appId: z.string(),
    requestId: z.string(),
    reviewNotes: z.string().optional(),
});

export const PredictScheduleRiskInputSchema = z.object({
    currentTime: z.string().describe('The current time in ISO 8601 format.'),
    technician: z.object({
        technicianId: z.string(),
        technicianName: z.string(),
        currentLocation: z.any(),
    }),
    currentJob: z.object({
        jobId: z.string(),
        location: z.any(),
        startedAt: z.string().describe('ISO 8601 timestamp for when work began.'),
        estimatedDurationMinutes: z.number(),
    }),
    nextJob: z.object({
        jobId: z.string(),
        location: z.any(),
        scheduledTime: z.string().optional().nullable().describe('ISO 8601 timestamp for the appointment.'),
    }),
});
export type PredictScheduleRiskInput = z.infer<typeof PredictScheduleRiskInputSchema>;

export const PredictScheduleRiskOutputSchema = z.object({
    predictedDelayMinutes: z.number().describe('The predicted delay in minutes. 0 or negative means on time.'),
    reasoning: z.string().describe('A brief explanation of the prediction.'),
});
export type PredictScheduleRiskOutput = z.infer<typeof PredictScheduleRiskOutputSchema>;

export const NotifyCustomerInputSchema = z.object({
    jobId: z.string(),
    customerName: z.string(),
    technicianName: z.string(),
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    appointmentTime: z.string().optional().nullable(),
    delayMinutes: z.number().optional(),
    newTime: z.string().optional(),
    reasonForChange: z.string().optional(),
});
export type NotifyCustomerInput = z.infer<typeof NotifyCustomerInputSchema>;

export const GenerateCustomerNotificationInputSchema = z.object({
  customerName: z.string(),
  technicianName: z.string(),
  jobTitle: z.string().optional().describe("The title of the job, e.g., 'AC Repair'"),
  delayMinutes: z.number().optional(),
  newTime: z.string().optional(),
  reasonForChange: z.string().optional().describe("A brief reason for the schedule change or delay."),
  companyName: z.string().optional(),
  appointmentTime: z.string().optional().nullable(),
});
export type GenerateCustomerNotificationInput = z.infer<typeof GenerateCustomerNotificationInputSchema>;

export const GenerateCustomerNotificationOutputSchema = z.object({
  message: z.string().describe("The generated customer-facing notification message."),
});
export type GenerateCustomerNotificationOutput = z.infer<typeof GenerateCustomerNotificationOutputSchema>;


export const ReassignJobInputSchema = z.object({
    companyId: z.string(),
    appId: z.string(),
    jobId: z.string(),
    newTechnicianId: z.string(),
    reason: z.string().optional(),
});
export type ReassignJobInput = z.infer<typeof ReassignJobInputSchema>;


export const SuggestNextAppointmentInputSchema = z.object({
  companyId: z.string(),
  appId: z.string(),
  contract: ContractSchema,
});
export type SuggestNextAppointmentInput = z.infer<typeof SuggestNextAppointmentInputSchema>;

export const SuggestNextAppointmentOutputSchema = z.object({
  createdJobId: z.string().describe("The ID of the new draft job that was created."),
  suggestedDate: z.string().describe("The suggested date for the next appointment in a human-readable format (e.g., 'Tuesday, March 15, 2025')."),
  message: z.string().describe("The drafted customer-facing appointment scheduling message."),
});
export type SuggestNextAppointmentOutput = z.infer<typeof SuggestNextAppointmentOutputSchema>;

export const TroubleshootEquipmentInputSchema = z.object({
    query: z.string().describe('The technician\'s question about the equipment issue.'),
    photoDataUri: z.string().optional().describe("An optional photo of the equipment (e.g., model number), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    knowledgeBase: z.string().optional().describe('Optional text containing internal company knowledge, manuals, or previous similar issues.'),
});
export type TroubleshootEquipmentInput = z.infer<typeof TroubleshootEquipmentInputSchema>;

export const TroubleshootEquipmentOutputSchema = z.object({
    steps: z.array(z.string()).describe('A list of step-by-step instructions to diagnose the problem.'),
    disclaimer: z.string().describe('A standard safety disclaimer to show to the technician.'),
});
export type TroubleshootEquipmentOutput = z.infer<typeof TroubleshootEquipmentOutputSchema>;

export const EstimateTravelDistanceInputSchema = z.object({
  startLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  endLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});
export type EstimateTravelDistanceInput = z.infer<typeof EstimateTravelDistanceInputSchema>;

export const EstimateTravelDistanceOutputSchema = z.object({
  distanceKm: z.number().describe('The estimated driving distance in kilometers.'),
});
export type EstimateTravelDistanceOutput = z.infer<typeof EstimateTravelDistanceOutputSchema>;

export const CalculateTravelMetricsInputSchema = z.object({
    companyId: z.string(),
    appId: z.string(),
    jobId: z.string(),
    technicianId: z.string(),
});
export type CalculateTravelMetricsInput = z.infer<typeof CalculateTravelMetricsInputSchema>;

export const CompleteOnboardingInputSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
  companySpecialties: z.array(z.string()).min(1, 'Please select at least one company specialty.'),
  otherSpecialty: z.string().optional(),
  numberOfTechnicians: z.number().min(1, 'You must have at least one technician.'),
}).refine(data => {
    if (data.companySpecialties.includes('Other')) {
        return data.otherSpecialty && data.otherSpecialty.trim().length > 0;
    }
    return true;
}, {
    message: "Please specify your specialty.",
    path: ["otherSpecialty"],
});
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingInputSchema>;

export const SuggestScheduleTimeInputSchema = z.object({
  jobPriority: z.enum(['High', 'Medium', 'Low']),
  requiredSkills: z.array(z.string()).describe("A list of skills required for the job."),
  currentTime: z.string().describe("The current time in ISO 8601 format."),
  businessHours: z.array(BusinessDaySchema).length(7).describe("The company's operating hours for each day of the week."),
  technicians: z.array(z.object({
    id: z.string(),
    name: z.string(),
    skills: z.array(z.string()).describe("The skills of the technician."),
    jobs: z.array(z.object({
      id: z.string(),
      scheduledTime: z.string(),
    })).describe("A list of jobs already scheduled for this technician."),
  })),
});
export type SuggestScheduleTimeInput = z.infer<typeof SuggestScheduleTimeInputSchema>;

export const SuggestScheduleTimeOutputSchema = z.object({
  suggestions: z.array(z.object({
    time: z.string().describe("A suggested appointment time in ISO 8601 format."),
    reasoning: z.string().describe("A brief explanation for why this time was suggested."),
  })).describe("A list of up to 5 appointment suggestions.")
});
export type SuggestScheduleTimeOutput = z.infer<typeof SuggestScheduleTimeOutputSchema>;

export const SummarizeFtfrOutputSchema = z.object({
  summary: z.string().describe("A concise summary of all the feedback notes provided."),
  themes: z.array(z.string()).describe("A list of recurring key themes identified from the feedback notes."),
});
export type SummarizeFtfrOutput = z.infer<typeof SummarizeFtfrOutputSchema>;


export const TriageJobInputSchema = z.object({
  jobId: z.string(),
  jobDescription: z.string(),
  photoDataUris: z.array(z.string().url()).describe("A list of photos of the equipment, as a data URI."),
});
export type TriageJobInput = z.infer<typeof TriageJobInputSchema>;

export const TriageJobOutputSchema = z.object({
  identifiedModel: z.string().optional().describe("The identified model number or name of the equipment."),
  suggestedParts: z.array(z.string()).optional().describe("A list of parts likely needed for the repair."),
  repairGuide: z.string().optional().describe("A summarized, step-by-step repair guide for the technician."),
});
export type TriageJobOutput = z.infer<typeof TriageJobOutputSchema>;

export const AnswerUserQuestionInputSchema = z.object({
  question: z.string().describe("The user's question about the FleetSync AI application."),
  language: z.enum(['en', 'de', 'fr']).describe("The language the user is interacting in."),
});
export type AnswerUserQuestionInput = z.infer<typeof AnswerUserQuestionInputSchema>;

export const AnswerUserQuestionOutputSchema = z.object({
  answer: z.string().describe("A helpful answer to the user's question."),
});
export type AnswerUserQuestionOutput = z.infer<typeof AnswerUserQuestionOutputSchema>;

export type SortOrder = 'priority' | 'status' | 'technician' | 'customer' | 'scheduledTime';
