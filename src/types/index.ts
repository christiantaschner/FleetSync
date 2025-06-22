
import { z } from "zod";

export type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type TechnicianSkill = string; // Changed from union type to string

export type Technician = {
  id: string;
  name: string;
  isAvailable: boolean;
  skills: string[]; // Changed from TechnicianSkill[] to string[]
  partsInventory?: string[];
  location: Location;
  avatarUrl?: string;
  currentJobId?: string | null;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type JobPriority = 'High' | 'Medium' | 'Low';
export type JobStatus = 'Pending' | 'Assigned' | 'En Route' | 'In Progress' | 'Completed' | 'Cancelled';

export type Job = {
  id: string;
  title: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  assignedTechnicianId?: string | null;
  location: Location;
  customerName: string;
  customerPhone: string;
  scheduledTime?: string;
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
  scheduledTime?: string;
};

export type AITechnician = {
  technicianId: string;
  technicianName: string;
  isAvailable: boolean;
  skills: string[]; // GenAI flow uses string array
  partsInventory: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  currentJobs?: { jobId: string; scheduledTime?: string; priority: JobPriority; }[];
};

export type ProfileChangeRequest = {
    id: string;
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
};

export type ChatMessage = {
    id: string;
    jobId: string;
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


// --- AI Flow Schemas ---

export const AllocateJobInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job to be assigned.'),
  jobPriority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the job.'),
  requiredSkills: z.array(z.string()).optional().describe('A list of skills explicitly required for this job. This is a hard requirement.'),
  requiredParts: z.array(z.string()).optional().describe('A list of parts explicitly required for this job.'),
  scheduledTime: z.string().optional().describe('Optional specific requested appointment time by the customer (ISO 8601 format). This should be strongly considered.'),
  technicianAvailability: z.array(
    z.object({
      technicianId: z.string().describe('The unique identifier of the technician.'),
      technicianName: z.string().describe('The name of the technician.'),
      isAvailable: z.boolean().describe('Whether the technician is currently available. This is a critical factor.'),
      skills: z.array(z.string()).describe('The skills possessed by the technician.'),
      partsInventory: z.array(z.string()).describe('The parts available in the technician\'s van inventory.'),
      location: z
        .object({
          latitude: z.number().describe('The latitude of the technician.'),
          longitude: z.number().describe('The longitude of the technician.'),
        })
        .describe('The current location of the technician.'),
      currentJobs: z.array(z.object({
        jobId: z.string(),
        scheduledTime: z.string().optional(),
        priority: z.enum(['High', 'Medium', 'Low']),
      })).optional().describe("A list of jobs already assigned to the technician, with their scheduled times and priorities."),
    })
  ).describe('A list of technicians and their availability, skills, and location.'),
});
export type AllocateJobInput = z.infer<typeof AllocateJobInputSchema>;

export const AllocateJobOutputSchema = z.object({
  suggestedTechnicianId: z.string().describe('The ID of the most suitable technician for the job.'),
  reasoning: z.string().describe('The reasoning behind the technician suggestion.'),
});
export type AllocateJobOutput = z.infer<typeof AllocateJobOutputSchema>;


export const OptimizeRoutesInputSchema = z.object({
  technicianId: z.string().describe('The ID of the technician.'),
  currentLocation: z
    .object({
      latitude: z.number().describe('The latitude of the current location.'),
      longitude: z.number().describe('The longitude of the current location.'),
    })
    .describe('The current location of the technician.'),
  tasks: z
    .array(
      z.object({
        taskId: z.string().describe('The ID of the task.'),
        location: z
          .object({
            latitude: z.number().describe('The latitude of the task location.'),
            longitude: z.number().describe('The longitude of the task location.'),
          })
          .describe('The location of the task.'),
        priority: z.enum(['high', 'medium', 'low']).describe('The priority of the task.'),
        scheduledTime: z.string().optional().describe('Optional specific requested appointment time for this task (ISO 8601 format). This is a strong constraint if provided.'),
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
      currentLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
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
  jobDescription: z.string().describe('The description of the job.'),
  availableSkills: z.array(z.string()).describe('The list of all possible skills in the system.'),
});
export type SuggestJobSkillsInput = z.infer<typeof SuggestJobSkillsInputSchema>;

export const SuggestJobSkillsOutputSchema = z.object({
  suggestedSkills: z.array(z.string()).describe('An array of skill names suggested for the job, drawn exclusively from the availableSkills list.'),
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
  technicianId: z.string().describe("The ID of the technician whose route is being updated."),
  movedJobId: z.string().describe("The ID of the job that was manually moved."),
  newScheduledTime: z.string().describe("The new scheduled time for the moved job (ISO 8601 format)."),
  optimizedRoute: OptimizeRoutesOutputSchema.shape.optimizedRoute,
});
export type ConfirmManualRescheduleInput = z.infer<typeof ConfirmManualRescheduleInputSchema>;

export const ApproveProfileChangeRequestInputSchema = z.object({
    requestId: z.string(),
    technicianId: z.string(),
    approvedChanges: z.record(z.any()),
    reviewNotes: z.string().optional(),
});

export const RejectProfileChangeRequestInputSchema = z.object({
    requestId: z.string(),
    reviewNotes: z.string().optional(),
});

export const PredictScheduleRiskInputSchema = z.object({
    currentTime: z.string().describe('The current time in ISO 8601 format.'),
    technician: z.object({
        technicianId: z.string(),
        technicianName: z.string(),
        currentLocation: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }),
    }),
    currentJob: z.object({
        jobId: z.string(),
        location: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }),
        startedAt: z.string().describe('ISO 8601 timestamp for when work began.'),
        estimatedDurationMinutes: z.number(),
    }),
    nextJob: z.object({
        jobId: z.string(),
        location: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }),
        scheduledTime: z.string().optional().describe('ISO 8601 timestamp for the appointment.'),
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
});
export type GenerateCustomerNotificationInput = z.infer<typeof GenerateCustomerNotificationInputSchema>;

export const GenerateCustomerNotificationOutputSchema = z.object({
  message: z.string().describe("The generated customer-facing notification message."),
});
export type GenerateCustomerNotificationOutput = z.infer<typeof GenerateCustomerNotificationOutputSchema>;


export const ReassignJobInputSchema = z.object({
    jobId: z.string(),
    newTechnicianId: z.string(),
    reason: z.string().optional(),
});
export type ReassignJobInput = z.infer<typeof ReassignJobInputSchema>;


export const SuggestNextAppointmentInputSchema = z.object({
  customerName: z.string(),
  jobTitle: z.string(),
  frequency: z.enum(['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually']),
  lastAppointmentDate: z.string().describe("The last known appointment or service date in ISO 8601 format."),
});
export type SuggestNextAppointmentInput = z.infer<typeof SuggestNextAppointmentInputSchema>;

export const SuggestNextAppointmentOutputSchema = z.object({
  suggestedDate: z.string().describe("The suggested date for the next appointment in a human-readable format (e.g., 'Tuesday, March 15, 2025')."),
  message: z.string().describe("The drafted customer-facing appointment scheduling message."),
});
export type SuggestNextAppointmentOutput = z.infer<typeof SuggestNextAppointmentOutputSchema>;

export const TroubleshootEquipmentInputSchema = z.object({
    query: z.string().describe('The technician\'s question about the equipment issue.'),
    knowledgeBase: z.string().optional().describe('Optional text containing internal company knowledge, manuals, or previous similar issues.'),
});
export type TroubleshootEquipmentInput = z.infer<typeof TroubleshootEquipmentInputSchema>;

export const TroubleshootEquipmentOutputSchema = z.object({
    steps: z.array(z.string()).describe('A list of step-by-step instructions to diagnose the problem.'),
    disclaimer: z.string().describe('A standard safety disclaimer to show to the technician.'),
});
export type TroubleshootEquipmentOutput = z.infer<typeof TroubleshootEquipmentOutputSchema>;
