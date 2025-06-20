
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList, Timer, BookOpen, WifiOff
} from 'lucide-react';

interface RoadmapItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: 'Planned' | 'In Progress' | 'Consideration' | 'Vision';
  developerBrief?: DeveloperBrief;
}

interface DeveloperBrief {
  coreFunctionality?: string[];
  dataModels?: string[];
  aiComponents?: string[];
  uiUx?: string[];
  integrationPoints?: string[];
  technicalChallenges?: string[];
  successMetrics?: string[];
}

const RoadmapItem: React.FC<RoadmapItemProps> = ({ title, description, icon: Icon, status }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-headline">{title}</CardTitle>
        </div>
        {status && (
          <CardDescription className="text-xs pt-1">Status: {status}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const roadmapFeatures = {
  coreAiDispatcher: [
    {
      title: "Advanced Real-time Dynamic Re-optimization",
      description: "Core AI engine tackles 'Ineffiziente Disposition' by continuously re-optimizing routes and assignments. For technicians, this means smoother schedules, less downtime, and more logical job sequencing, reacting to live events like early/late job completions, new urgent jobs, traffic, and technician unavailability. This directly reduces costs ('Kosten') and improves responsiveness.",
      icon: Shuffle, 
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Continuously monitor job statuses, technician locations, and new job arrivals.",
          "Trigger re-optimization based on events: new urgent job, job completion (early/late), technician becomes unavailable (e.g., sickness), significant traffic changes (future).",
          "AI considers job priority, skills required, technician's current load, travel time, ETAs, and crucially, any pre-committed customer appointment windows (`Job.scheduledTime`).",
          "Handle technician unavailability: System allows dispatcher to mark a technician as unavailable (e.g., sick for the day). This action should trigger unassignment of their active jobs and initiate a re-allocation/re-optimization process for these jobs across the remaining available and qualified workforce. The AI should suggest optimal reassignments or highlight jobs needing urgent manual attention if no suitable automatic reassignment is found.",
          "Process new high-priority emergency jobs: Dispatcher flags a job as 'emergency'. AI finds the best-suited technician (considering availability, skills, location, potential interruption of current lower-priority task) and re-optimizes schedules for the assigned technician and any others impacted by cascaded changes. The AI should clearly highlight the proposed interruption and its consequences.",
          "Allow dispatchers to manually trigger a full re-evaluation for a region or specific group of technicians if a major unforeseen event occurs (e.g., widespread traffic incident not yet in system, multiple unexpected technician absences)."
        ],
        dataModels: [
          "Relies heavily on real-time Job and Technician data (location, status, skills, currentJobId, estimatedDuration, scheduledTime, isAvailable).",
          "May need a temporary 'optimization_queue' for pending re-optimization requests if system is under load.",
          "Technician model may need a temporary 'outOfServiceReason' field (e.g., 'sick', 'vehicle_breakdown') and 'outOfServiceUntil' timestamp when marked unavailable by dispatcher."
        ],
        aiComponents: [
          "Main Genkit flow: `dynamicReoptimizerFlow` (or similar name).",
          "Gemini model for complex multi-constraint scheduling and routing.",
          "Input: Current state of all relevant jobs & technicians, event trigger (e.g., 'technician_unavailable', 'new_emergency_job', 'manual_request'). Needs to handle `Job.scheduledTime` as a strong constraint.",
          "Output: Updated job sequences for affected technicians, revised ETAs, notifications of changes. For technician unavailability, it should output a list of unassigned jobs and suggested reassignments or alerts for dispatcher review."
        ],
        uiUx: [
          "Dispatcher dashboard: Map updates in real-time, notifications for significant changes or conflicts requiring manual review.",
          "Interface for dispatcher to mark a technician as unavailable (e.g., 'Mark as Sick Today'). This action should clearly indicate that it will unassign their jobs and trigger AI re-allocation.",
          "Clear visualization of AI-suggested changes before dispatcher confirms (for major re-optimizations, minor ones might be automatic or have a quick accept/reject).",
          "Technician mobile app: Receives updated route/job sequence with clear notifications and reasons for changes if significant."
        ],
        integrationPoints: [
          "Extends/integrates with `optimizeRoutesFlow` and `allocateJobFlow` concepts but operates at a more global and continuous level.",
          "Job status updates and availability changes from technician app are critical triggers.",
          "Traffic API (future) for real-time data.",
          "Links to `AddEditTechnicianDialog` for marking technicians unavailable.",
          "Links to `AddEditJobDialog` for flagging new jobs as emergencies."
        ],
        technicalChallenges: [
          "Handling high frequency of events and ensuring rapid re-optimization without overwhelming the system or the user.",
          "Minimizing disruption to technicians already en route unless absolutely necessary (e.g., for a higher priority emergency).",
          "Algorithm complexity for balancing multiple competing factors (priority, travel time, technician load, fixed appointments, skills).",
          "Ensuring dispatcher override capabilities and clear communication of AI-driven changes, especially for unassigning/reassigning jobs.",
          "User experience for the dispatcher when handling technician sickness: how are unassigned jobs presented? How are AI suggestions for re-allocation displayed and confirmed?"
        ],
        successMetrics: [
          "Reduced average travel time per job.",
          "Increased number of jobs completed per technician per day.",
          "Faster response times for emergency jobs.",
          "Reduced idle time for technicians.",
          "High adherence to customer-scheduled appointment times.",
          "Reduction in dispatcher stress due to automated handling of common disruptions like technician absence."
        ]
      }
    },
    {
      title: "Digital Time Tracking & Management",
      description: "Implement features for technicians to digitally record working hours (travel, on-site, breaks) via the mobile app. This simplifies their daily logging, helps control 'Kosten' by managing overtime, and provides data for accurate job costing and payroll. Accurate historical time data from this system also enhances the precision of AI-driven route optimization and future job scheduling.",
      icon: Timer,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Technician Mobile App: Start/stop timer for different phases (Travel, On-Site Work, Break). Manual entry/edit of time logs.",
          "Dispatcher Dashboard: View detailed time logs per job and per technician. Generate summary reports (e.g., weekly/monthly hours). Export functionality (CSV).",
          "Automatic linking of time entries to specific jobs."
        ],
        dataModels: [
          "New Firestore collection: `timeEntries` (fields: `jobId`, `technicianId`, `entryType` ('travel', 'work', 'break'), `startTime`, `endTime`, `duration`, `notes`).",
          "Possibly an aggregated `jobTimeSummary` on Job documents."
        ],
        aiComponents: [
          "AI can use historical `timeEntries` data to refine job duration estimates for `allocateJobFlow` and `optimizeRoutesFlow`."
        ],
        uiUx: [
          "Mobile: Clear start/stop buttons within the job detail view. Simple form for manual entries/notes.",
          "Dashboard: A new 'Time Management' or 'Timesheets' section. Table views for logs, filtering options, report generation interface."
        ],
        integrationPoints: [
          "Feeds accurate duration data into AI route optimization and job allocation.",
          "Provides data for job costing in the 'Reports' section.",
          "Foundation for payroll calculations (though full payroll system is out of scope initially)."
        ],
        technicalChallenges: [
          "Ensuring ease of use for technicians to maximize adoption and accuracy.",
          "Offline data capture and synchronization for time entries.",
          "Handling scenarios like forgetting to stop a timer."
        ],
        successMetrics: [
          "Accuracy of payroll and job costing.",
          "Reduction in manual effort for time reporting.",
          "Improved AI prediction accuracy for job durations.",
          "Technician satisfaction with ease of logging hours."
        ]
      }
    },
    {
      title: "Digital Customer Signatures (Mobile App)",
      description: "Enable technicians to capture customer signatures digitally on the mobile app for proof of service, reducing paperwork and streamlining job completion.",
      icon: FileSignature,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Signature capture area on the technician's mobile device (tablet or phone).",
          "Ability to save the signature as an image.",
          "Associate signature with the completed job."
        ],
        dataModels: [
          "Job document update: add `customerSignatureUrl: string` (pointing to Firebase Storage) and `signatureTimestamp: Date`."
        ],
        aiComponents: ["N/A for core signature capture, but AI could potentially verify signature presence for compliance in future."],
        uiUx: [
          "Mobile: A dedicated screen or modal in the job completion workflow for signature capture.",
          "Clear instructions for the customer.",
          "Option to re-sign if needed.",
          "Display signature on job detail views in dispatcher dashboard and on any generated job reports/PDFs."
        ],
        integrationPoints: [
          "Job completion workflow on mobile app.",
          "Firebase Storage for storing signature images.",
          "Reporting module for including signatures in job summaries."
        ],
        technicalChallenges: [
          "Ensuring smooth signature capture on various devices and screen sizes.",
          "Optimizing image size for storage and retrieval.",
          "Legal considerations for digital signatures in the target region (Germany/Europe)."
        ],
        successMetrics: [
          "Reduction in paper-based processes.",
          "Faster job completion and invoicing cycle.",
          "Improved proof of service documentation.",
          "Customer convenience."
        ]
      }
    },
    {
      title: "First-Time-Fix-Rate (FTFR) Analytics",
      description: "Track and analyze the First-Time-Fix-Rate (FTFR) to identify areas for improvement in technician skills, parts availability, or initial job diagnosis, contributing to higher efficiency and customer satisfaction. This is informed by data from AI-Assisted Digital Protocols.",
      icon: ThumbsUp,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Mechanism to mark a job as a 'first-time fix' or a 'follow-up visit'.",
          "Calculation of FTFR percentage overall, per technician, per job type, per equipment type.",
          "Identification of common reasons for non-FTFR (e.g., parts missing, misdiagnosis, skill gap)."
        ],
        dataModels: [
          "Job document: add `isFirstTimeFix: boolean` (set by technician or inferred), `followUpToJobId: string` (if it's a repeat visit).",
          "Possibly a new `jobIssueCodes` collection to categorize reasons for non-FTFR."
        ],
        aiComponents: [
          "AI can analyze notes from 'AI-Assisted Digital Protocols' and technician documentation to help infer if a job was a true FTFR or if a follow-up is likely/needed.",
          "AI can identify patterns in non-FTFR jobs to suggest areas for improvement (e.g., specific training, common missing parts)."
        ],
        integrationPoints: [
          "Relies on accurate job status updates and detailed documentation from 'AI-Assisted Digital Protocols'.",
          "Connects to 'Intelligent Parts Management' (identifying missing parts) and 'Smart Skill Matching' (identifying skill gaps)."
        ],
        technicalChallenges: [
          "Defining clear criteria for what constitutes a 'first-time fix' versus a separate issue or planned phased work.",
          "Ensuring consistent data capture by technicians.",
          "Linking follow-up jobs accurately to original jobs."
        ],
        successMetrics: [
          "Increase in overall FTFR percentage.",
          "Reduction in repeat visits for the same issue.",
          "Improved customer satisfaction due to faster problem resolution.",
          "Identification of actionable insights for training or process improvement."
        ]
      }
    },
    {
      title: "CO2 Emission Estimation & Reporting",
      description: "Estimate and report CO2 emissions based on travel data, contributing to 'Nachhaltigkeit' (sustainability) and helping reduce fuel 'Kosten' through awareness and optimized routing.",
      icon: Leaf,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Calculate estimated CO2 emissions per job based on distance traveled.",
          "Aggregate CO2 emissions data for reporting (per technician, per period, overall).",
          "Allow configuration of average vehicle fuel efficiency or CO2 emission factors."
        ],
        dataModels: [
          "Technician profile: add optional `vehicleType: string` (e.g., 'Van Diesel', 'Car Petrol', 'EV') and `fuelEfficiency` (e.g., L/100km or kWh/100km).",
          "Job document: store `estimatedTravelDistance: number` (from route optimization) and `estimatedCO2Emissions: number`."
        ],
        aiComponents: ["N/A directly for CO2 calculation, but AI route optimization is the primary driver for reduction."],
        uiUx: [
          "Dashboard: Display CO2 emission KPIs and trends in the 'Reports' section.",
          "Option to set default emission factors if specific vehicle data isn't available."
        ],
        integrationPoints: [
          "Uses travel distance data from the route optimization engine.",
          "Could potentially integrate with telematics data in a more advanced version."
        ],
        technicalChallenges: [
          "Accuracy of CO2 estimation, heavily dependent on input data (vehicle type, driving style, real fuel consumption vs. averages).",
          "Sourcing and maintaining accurate emission factors for different vehicle types."
        ],
        successMetrics: [
          "Demonstrable reduction in estimated CO2 emissions over time (primarily via route optimization).",
          "Increased awareness of environmental impact.",
          "Support for company sustainability reporting initiatives."
        ]
      }
    },
    {
      title: "Customer Satisfaction & Response Time Analytics",
      description: "Implement tracking for customer satisfaction scores and critical response times to monitor and enhance service quality, directly impacting customer retention.",
      icon: Smile,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Response Time: Calculate and track key response time metrics (e.g., time from job creation to assignment, assignment to arrival, job creation to completion).",
          "Customer Satisfaction: Implement a simple mechanism for capturing customer feedback (e.g., a 1-5 star rating or a short post-job survey link sent via email/SMS)."
        ],
        dataModels: [
          "Job document: add `customerSatisfactionScore: number` (1-5), `surveySentTimestamp: Date`, `surveyCompletedTimestamp: Date`.",
          "Response times can be calculated from existing job timestamps (`createdAt`, `assignedAt` (needs adding), `enRouteAt` (needs adding), `inProgressAt` (needs adding), `completedAt`)."
        ],
        aiComponents: ["AI could analyze free-text feedback from surveys for sentiment and common themes in a more advanced version."],
        uiUx: [
          "Dashboard: Display average satisfaction scores and response time KPIs in the 'Reports' section.",
          "Automated mechanism for sending survey links upon job completion.",
          "Technician mobile app: Potentially a very quick satisfaction capture if feasible (e.g., customer rates on technician's device)."
        ],
        integrationPoints: [
          "Relies on accurate job status timestamp updates from technicians.",
          "Could integrate with external survey tools if needed."
        ],
        technicalChallenges: [
          "Achieving good response rates for customer surveys.",
          "Defining and consistently capturing all necessary timestamps for accurate response time calculation."
        ],
        successMetrics: [
          "Improvement in average customer satisfaction scores.",
          "Reduction in critical response times (e.g., for high-priority jobs).",
          "Identification of factors impacting satisfaction and response times."
        ]
      }
    },
    {
        title: "Google Maps Address Autocomplete",
        description: "Integrate Google Maps Places API for automatic address suggestions in job creation/editing forms to improve accuracy and speed.",
        icon: Map,
        status: "Planned",
        developerBrief: {
          coreFunctionality: [
            "Use Google Places Autocomplete Service in address input fields.",
            "On selecting a suggestion, populate address fields (street, city, postal code, country) and ideally latitude/longitude."
          ],
          dataModels: [
            "No direct new Firestore models, but ensures higher quality `Job.location` and `Technician.location` data (address string, lat, lng)."
          ],
          aiComponents: ["N/A"],
          uiUx: [
            "`AddEditJobDialog.tsx`: Enhance address input.",
            "`AddEditTechnicianDialog.tsx`: Enhance address input.",
            "Smooth user experience for selecting addresses."
          ],
          integrationPoints: [
            "Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with Places API enabled.",
            "Consider using the `@vis.gl/react-google-maps` library's `useAutocomplete` hook or similar.",
            "Update form handling logic to process structured address data from Places API."
          ],
          technicalChallenges: [
            "API key management and security.",
            "Parsing the structured address components correctly for different locales.",
            "Handling API usage costs if volume is high."
          ],
          successMetrics: [
            "Reduced time for address entry.",
            "Improved accuracy of geocoded job and technician locations.",
            "Fewer errors due to mistyped addresses."
          ]
      }
    },
    {
      title: "Offline Mode for Core Mobile App Functions",
      description: "Allows technicians to access job details, update statuses, and document work even without internet. Data syncs when connectivity is restored, ensuring uninterrupted workflow in areas with poor signal (e.g., basements, remote sites). Addresses a major technician pain point and increases app reliability.",
      icon: WifiOff,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Cache assigned job details (including customer info, description, protocols) on the technician's device.",
          "Allow technicians to update job status (e.g., 'In Progress', 'Completed') while offline.",
          "Allow technicians to complete digital protocols and save work documentation (notes, photos taken offline) locally.",
          "Queue all offline changes for automatic synchronization when internet connectivity is restored."
        ],
        dataModels: [
          "Utilize Firestore's built-in offline persistence capabilities for structured data (job details, status updates, notes).",
          "For photos/files taken offline: Store locally on device (e.g., using Capacitor/Cordova filesystem APIs if it were a native app, or browser's IndexedDB/localStorage for PWA for temporary storage before upload). Upload to Firebase Storage upon reconnection."
        ],
        aiComponents: ["N/A for core offline functionality itself."],
        uiUx: [
          "Mobile app: Clear visual indicators of offline status.",
          "Visual cues for data that is pending synchronization.",
          "Robust error handling for sync conflicts (though Firestore handles many cases automatically)."
        ],
        integrationPoints: [
          "Deep integration with Firestore SDK.",
          "Firebase Storage for file uploads post-reconnection."
        ],
        technicalChallenges: [
          "Managing local storage limits, especially for photos.",
          "Ensuring data integrity and handling potential sync conflicts (e.g., if a job is modified by dispatch while technician is offline - Firestore's 'last write wins' is default, may need more complex logic).",
          "Reliable background synchronization."
        ],
        successMetrics: [
          "Increased app usability and reliability in areas with poor connectivity.",
          "Higher completion rate of job documentation as it can be done immediately.",
          "Reduced technician frustration with connectivity issues.",
          "Consistent data flow regardless of network conditions."
        ]
      }
    },
    {
      title: "AI-Powered \"Next Up Technicians\" Prediction",
      description: "Develop an AI model to predict which technicians will become available soonest, considering current job types, travel time, and historical data from time tracking and job statuses. Display this on the dashboard.",
      icon: Lightbulb,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "AI model analyzes active jobs, technicians' current locations, ETAs for their ongoing tasks, typical travel times, and historical job completion times.",
          "Predicts a ranked list of technicians who are likely to become available next, along with an estimated time of availability."
        ],
        dataModels: [
          "Relies on `Job` data (status, assignedTechnicianId, location, estimatedDuration, scheduledTime), `Technician` data (isAvailable, location, skills), and `timeEntries` (for historical actual durations)."
        ],
        aiComponents: [
          "Genkit flow: `predictNextAvailableTechniciansFlow`.",
          "Gemini model for predictive analysis, considering multiple dynamic factors.",
          "Input: Current snapshot of all active jobs and technician statuses.",
          "Output: Array of objects: `{ technicianId: string, technicianName: string, estimatedAvailabilityTime: Date, confidenceScore?: number }`."
        ],
        uiUx: [
          "Dispatcher Dashboard: A dedicated card or section displaying the top 3-5 'Next Up Technicians'.",
          "Clear presentation of estimated availability time."
        ],
        integrationPoints: [
          "Uses data from Digital Time Tracking for historical accuracy.",
          "Relies on real-time job status updates from technicians."
        ],
        technicalChallenges: [
          "Accuracy of prediction, especially with unforeseen delays or early completions.",
          "Handling edge cases (e.g., all technicians busy on long jobs).",
          "Presenting predictions in a way that manages dispatcher expectations (they are estimates)."
        ],
        successMetrics: [
          "Reduced cognitive load for dispatchers when planning for incoming jobs.",
          "Faster assignment of newly created or urgent jobs.",
          "Improved resource utilization by minimizing unallocated idle time."
        ]
      }
    },
    {
      title: "Real-time Chat with Technicians",
      description: "Implement a direct messaging feature between dispatchers and technicians for quick communication, on-site support, and updates, reducing misunderstandings and improving collaboration. Can be contextually linked to job details and potentially integrate with the AI Knowledge Base for quick answers.",
      icon: MessageSquare,
      status: "Consideration",
      developerBrief: {
        coreFunctionality: [
          "1-to-1 chat between dispatcher and technician.",
          "Possibly job-specific chat channels.",
          "Real-time message delivery and notifications.",
          "Basic text messaging, potentially image sharing."
        ],
        dataModels: [
          "New Firestore collection: `chatMessages` (fields: `channelId` (can be `jobId` or `userId1_userId2`), `senderId`, `receiverId` (if P2P), `messageText`, `imageUrl`, `timestamp`, `readStatus`).",
          "New Firestore collection: `chatChannels` (fields: `channelId`, `participants[]`, `lastMessageSnippet`, `lastMessageTimestamp`)."
        ],
        aiComponents: [
          "Future: AI could monitor chats for unresolved issues or suggest relevant Knowledge Base articles."
        ],
        uiUx: [
          "Dispatcher Dashboard: Integrated chat panel, list of active chats, notifications for new messages.",
          "Technician Mobile App: Chat interface, notifications.",
          "Ability to initiate chat from a job detail view or technician list."
        ],
        integrationPoints: [
          "Firebase Authentication for user identification.",
          "Firestore for message storage and real-time updates.",
          "Firebase Cloud Messaging (FCM) for push notifications.",
          "Contextual linking to Job details."
        ],
        technicalChallenges: [
          "Implementing robust real-time updates and notifications efficiently.",
          "Managing read statuses.",
          "Handling chat history and archiving."
        ],
        successMetrics: [
          "Reduced time for dispatcher-technician communication.",
          "Faster resolution of on-site issues through quick support.",
          "Improved collaboration and reduced misunderstandings.",
          "Audit trail of communications related to jobs."
        ]
      }
    },
    {
      title: "Visual Route Optimization Comparison",
      description: "Display a mini-map preview showing the current vs. AI-optimized route in the \"Optimize Route\" dialog to build trust and provide clarity.",
      icon: Settings2,
      status: "Consideration",
      developerBrief: {
        coreFunctionality: [
          "In the 'Optimize Route' dialog, after AI computes an optimized route, display two small maps side-by-side.",
          "Map 1: Shows the sequence of selected tasks as they are currently ordered (or a simple shortest path if no order exists).",
          "Map 2: Shows the AI-optimized sequence of tasks.",
          "Highlight differences visually (e.g., different colored polylines, numbered markers)."
        ],
        dataModels: ["N/A for data models, uses existing Job locations."],
        aiComponents: ["Relies on the output of `optimizeRoutesFlow` which should provide the sequence of task IDs for both original (if applicable) and optimized routes."],
        uiUx: [
          "`OptimizeRouteDialog.tsx`: Add two embeddable map components (using `@vis.gl/react-google-maps`).",
          "Clear labeling for 'Current Route' vs. 'Optimized Route'.",
          "Polylines drawn to connect task locations in sequence."
        ],
        integrationPoints: [
          "Google Maps API for rendering maps and polylines.",
          "Receives data from `OptimizeRoutesOutput`."
        ],
        technicalChallenges: [
          "Performance considerations for rendering two maps within a dialog.",
          "Ensuring clear and uncluttered visualization of routes, especially with many tasks.",
          "Calculating a sensible 'current route' for comparison if tasks are not already explicitly sequenced."
        ],
        successMetrics: [
          "Increased dispatcher confidence and trust in AI route optimization suggestions.",
          "Better understanding of the AI's decision-making process.",
          "Faster adoption of AI-suggested routes."
        ]
      }
    },
    {
      title: "Quantify Route Optimization Benefits",
      description: "Show estimated time and distance savings (e.g., \"Saves approx. 15 minutes & 3 miles\") when AI suggests an optimized route, making the value of AI tangible.",
      icon: CheckSquare,
      status: "Consideration",
      developerBrief: {
        coreFunctionality: [
          "When `optimizeRoutesFlow` is called, it should calculate/estimate total travel time and distance for the *current* order of tasks (if one exists, or a baseline) AND for the *optimized* route.",
          "The dialog then displays the difference/savings."
        ],
        dataModels: [
          "`OptimizeRoutesOutput` schema in `optimize-routes.ts` needs to be extended to include: `originalTotalTravelTime: string`, `originalTotalTravelDistance: string` (alongside existing `totalTravelTime` for optimized route)."
        ],
        aiComponents: [
          "`optimizeRoutesPrompt` and `optimizeRoutesFlow` need modification to calculate/estimate metrics for the current/baseline task order, not just the optimized one."
        ],
        uiUx: [
          "`OptimizeRouteDialog.tsx`: Display a summary like 'Estimated Savings: X minutes, Y km/miles'."
        ],
        integrationPoints: [
          "Relies on Google Maps Directions API (or similar) for accurate travel time/distance estimations for both routes."
        ],
        technicalChallenges: [
          "Accurately estimating travel time for the 'current' or 'unoptimized' route, especially if it's just a list of tasks without a defined sequence.",
          "Additional API calls to Google Directions if re-calculating for the baseline route."
        ],
        successMetrics: [
          "Clear demonstration of ROI for the AI optimization feature.",
          "Increased dispatcher satisfaction and perceived value of the AI.",
          "Data points for reporting on AI effectiveness."
        ]
      }
    },
  ],
  hvacSpecific: [
    {
      title: "Smart Skill Matching for Technicians (HVAC/SHK)",
      description: "Enhance technician profiles with specific certifications (e.g., gas, oil, heat pumps, refrigeration, drinking water hygiene). AI job allocation will prioritize technicians with the necessary qualifications for each specific job, alongside proximity and availability, reducing mismatches and improving first-time fix rates.",
      icon: Wrench,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Technician profiles to include a structured list of specific skills and certifications (e.g., 'F-Gas Cat 1', 'Oil Boiler Certified', 'Heat Pump Installer Lvl 3').",
          "Job creation to allow specifying required skills/certifications for the task.",
          "AI job allocation (`allocateJobFlow`) to heavily weigh matching required skills with technician's qualifications."
        ],
        dataModels: [
          "`Technician` type: add `certifications: string[]` or `hvacSkills: { skillName: string, level?: string, expiryDate?: Date }[]` for more structured data.",
          "`Job` type: add `requiredSkills: string[]` or `requiredCertifications: string[]`.",
          "Potentially a master list `SkillOrCertification` collection for standardized entries."
        ],
        aiComponents: [
          "`allocateJobPrompt` in `allocate-job.ts` needs to be updated to receive and prioritize these skills/certifications.",
          "Reasoning output from AI should mention skill matching."
        ],
        uiUx: [
          "Dispatcher Dashboard: Display skills/certs prominently on technician cards/views. Allow filtering technicians by skills/certs.",
          "Job Creation: Easy way to select/input required skills for a job.",
          "Technician Mobile App: Display their own skills/certs."
        ],
        integrationPoints: [
          "Core to `allocateJobAction` and the underlying AI flow.",
          "Could influence FTFR analytics (e.g., do jobs with correctly skilled techs have higher FTFR?)."
        ],
        technicalChallenges: [
          "Defining a comprehensive yet manageable list of relevant HVAC/SHK skills and certifications for the German/European market.",
          "Ensuring dispatchers accurately input required skills for jobs."
        ],
        successMetrics: [
          "Improved First-Time-Fix-Rate for specialized jobs.",
          "Reduction in jobs being reassigned due to skill mismatch.",
          "Increased customer satisfaction due to competent service.",
          "Better compliance with regulatory requirements for certified work."
        ]
      }
    },
    {
      title: "Intelligent Parts & Van Stock Management (HVAC/SHK)",
      description: "Directly addresses 'Fehlfahrten' (wasted trips) and 'Teilemangel' (parts shortage). Technicians get better visibility into needed parts for jobs and their van stock, minimizing repeat visits and reducing their frustration from missing components for HVAC/SHK tasks. Integrates with data from completed job protocols.",
      icon: Truck,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Master parts list/database.",
          "Technicians can view/manage their van inventory via the mobile app (simple add/remove/adjust quantity).",
          "Jobs can have a list of 'expected' or 'required' parts.",
          "AI Suggestion: Based on job type, equipment history, and common fixes, AI could suggest parts needed for a job.",
          "AI Allocation: `allocateJobFlow` could consider if a technician has essential parts in their van stock (basic check)."
        ],
        dataModels: [
          "New Firestore collection: `PartsMaster` (fields: `partId`, `name`, `description`, `sku`, `category`, `defaultStockLevel`).",
          "New Firestore collection: `TechnicianVanStock` (fields: `technicianId`, `partId`, `quantity`, `lastUpdated`).",
          "`Job` document: add `requiredParts: { partId: string, quantity: number, notes?: string }[]`, `suggestedParts: { partId: string, quantity: number }[]`."
        ],
        aiComponents: [
          "Genkit flow for `suggestPartsForJobFlow` (Input: job description, equipment type/history. Output: list of suggested parts).",
          "`allocateJobPrompt` could be enhanced to consider parts availability as a factor if van stock data is reliable."
        ],
        integrationPoints: [
          "Data from 'AI-Assisted Digital Protocols' (parts used) can help refine AI parts suggestions and track actual consumption.",
          "CRM/Equipment History: informs parts suggestions (e.g., common parts for specific models).",
          "Future: Integration with backend ERP/inventory systems."
        ],
        technicalChallenges: [
          "Keeping van stock data accurate requires disciplined updates from technicians.",
          "Initial population and maintenance of the `PartsMaster` database.",
          "Complexity of AI part suggestion logic (needs good historical data or well-defined rules)."
        ],
        successMetrics: [
          "Reduction in 'Fehlfahrten' (wasted trips due to missing parts).",
          "Improved First-Time-Fix-Rate.",
          "Reduced technician downtime spent sourcing parts.",
          "More accurate job costing by tracking parts used."
        ]
      }
    },
    {
      title: "Proactive Maintenance Scheduling & Equipment History (HVAC/SHK)",
      description: "Manage recurring maintenance contracts (heating, AC). The system will automatically suggest and help schedule these appointments. Provide technicians access to equipment history (model, past repairs, service intervals from CRM) at job locations via the mobile app, which is crucial for efficient HVAC/SHK servicing.",
      icon: History,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Track customer equipment and their maintenance schedules/contracts.",
          "Generate system reminders for dispatchers or automatically create 'Pending' maintenance jobs based on `nextDueDate` in `MaintenanceContracts`.",
          "Technicians can access detailed service history of specific equipment on-site via mobile app.",
          "Record details of maintenance performed, updating `lastServiceDate` and recalculating `nextDueDate` on the contract.",
          "Future: Option for automated customer reminders (e.g., email/SMS) for upcoming service appointments.",
          "Future: Simple portal/link for customers to confirm suggested maintenance appointments or request rescheduling."
        ],
        dataModels: [
          "`Customer` document: can link to multiple `Equipment` documents.",
          "`Equipment` document (linked to Customer): `equipmentId`, `type` (e.g., 'Gas Boiler', 'AC Unit'), `make`, `model`, `serialNumber`, `installationDate`, `locationInProperty`, `maintenanceContractId?`, `serviceHistory: { jobId: string, date: Date, notes: string, technicianId: string }[]` (populated from completed jobs).",
          "New Firestore collection: `MaintenanceContracts` (fields: `contractId`, `customerId`, `equipmentId[]`, `serviceFrequency` (e.g., 'annual', 'biannual', 'custom_days: N'), `nextDueDate`, `lastServiceDate`, `contractTerms`, `customerNotificationPreferences?`)."
        ],
        aiComponents: [
          "AI could analyze service history and equipment data to predict potential future issues or suggest preventative actions during maintenance.",
          "AI could help optimize scheduling of maintenance jobs alongside reactive service calls."
        ],
        uiUx: [
          "Dispatcher Dashboard: Dedicated view for managing maintenance contracts, viewing upcoming service schedules (e.g., calendar or list view), and tracking customer confirmations.",
          "Technician Mobile App: Clear access to full equipment details and its complete service history when assigned a maintenance (or repair) job for that equipment.",
          "Interface for logging maintenance tasks performed against specific equipment, possibly using a 'Digital Protocol'.",
          "Dispatcher tools to manually trigger or adjust customer reminders.",
          "Interface for setting up customer communication preferences for maintenance."
        ],
        integrationPoints: [
          "Core to the 'Basic Integrated CRM' feature for customer and equipment data.",
          "Links closely with 'AI-Assisted Digital Protocols' for recording detailed maintenance work performed.",
          "Job creation process for scheduling maintenance jobs (manual or automated from reminders).",
          "Future: Email/SMS service integration for customer notifications (e.g., SendGrid, Twilio)."
        ],
        technicalChallenges: [
          "Initial data entry/migration for existing customers, their equipment, and current maintenance contracts.",
          "Designing a flexible system for various maintenance contract types, service frequencies, and notification logic.",
          "Ensuring data consistency between equipment records, contract due dates, and completed job history.",
          "Building a simple, secure customer-facing interface for appointment confirmations if that path is pursued."
        ],
        successMetrics: [
          "Increased recurring revenue from proactively managed maintenance contracts.",
          "Improved customer retention due to consistent and timely service.",
          "Higher technician efficiency due to better on-site information and preparedness for maintenance tasks.",
          "Reduced equipment breakdowns and emergency calls due to timely preventative maintenance.",
          "High uptake of automated reminders/scheduling features by dispatchers."
        ]
      }
    },
    {
      title: "AI-Assisted Digital Protocols & Documentation (HVAC/SHK)",
      description: "Provide customizable digital forms and protocols. AI will assist with documentation through features like voice-to-text for notes, automatic extraction of key information from speech or text, and smart suggestions for common entries. This drastically reduces manual data entry for service reports, maintenance logs, and checklists (e.g., for gas inspections, complex repairs), ensuring consistent and accurate information capture while minimizing the technician's time spent on cumbersome paperwork. Data captured (e.g., parts used, issues resolved) directly informs FTFR analytics, helps refine the AI Knowledge Base, and supports intelligent parts management.",
      icon: FileText,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Admin/Dispatcher: Ability to create and manage digital protocol/checklist templates (e.g., for specific job types like 'Gasthermenwartung', 'Klimaanlagen-Check').",
          "Templates support various field types: text, numbers, multiple choice, photo uploads, signatures.",
          "Technician Mobile App: Select and fill out relevant protocols for a job.",
          "AI Assistance: Voice-to-text for note fields. AI extracts keywords, part numbers, readings from notes. AI suggests common entries or completes sections based on job type/equipment.",
          "Save completed protocols with the job record (as structured data or PDF)."
        ],
        dataModels: [
          "New Firestore collection: `ProtocolTemplates` (fields: `templateId`, `name`, `description`, `jobTypeAssociation[]`, `formSchema: JSON` defining fields and structure).",
          "New Firestore collection: `CompletedProtocols` (fields: `protocolId`, `jobId`, `technicianId`, `templateId`, `completionDate`, `formData: JSON` containing filled data, `pdfUrl?`)."
        ],
        aiComponents: [
          "Genkit flow for `processProtocolNotesFlow` (Input: dictated/typed text. Output: structured data, extracted entities like parts, readings).",
          "Speech-to-Text API (Google Cloud Speech-to-Text or device-native capabilities).",
          "Gemini model for text analysis, summarization, and suggestion generation within protocols."
        ],
        uiUx: [
          "Dispatcher Dashboard: Template builder interface (drag-and-drop or schema-based). View completed protocols.",
          "Technician Mobile App: Intuitive form-filling experience. Clear integration of AI assistance (e.g., mic button for voice, suggestion prompts).",
          "Option to generate PDF from completed protocol."
        ],
        integrationPoints: [
          "Completed protocol data feeds into FTFR Analytics (e.g., issues found, parts used).",
          "Contributes to the AI Knowledge Base (common fixes, observed symptoms).",
          "Informs Intelligent Parts Management (actual parts usage).",
          "Digital Customer Signatures can be part of a protocol.",
          "Firebase Storage for PDF versions or attached media."
        ],
        technicalChallenges: [
          "Designing a flexible and user-friendly form template builder.",
          "Reliability of voice-to-text, especially in noisy field environments.",
          "Accuracy and relevance of AI-driven suggestions and data extraction.",
          "Managing complex form logic or conditional fields in templates."
        ],
        successMetrics: [
          "Significant reduction in time spent by technicians on paperwork.",
          "Improved consistency and completeness of job documentation.",
          "Higher quality data for analytics and AI model training.",
          "Better compliance with industry standards and reporting requirements."
        ]
      }
    },
    {
      title: "Emergency Dispatch with Resource Check (HVAC/SHK)",
      description: "Implement an \"Emergency\" function for dispatchers that triggers immediate route re-optimization, considering technician qualifications and the availability of specific emergency kits or parts for HVAC/SHK scenarios.",
      icon: AlertOctagon,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Flag a new or existing job as 'Emergency'.",
          "This triggers an immediate, high-priority re-evaluation of assignments by the 'Advanced Real-time Dynamic Re-optimization' engine.",
          "AI considers: nearest available AND qualified (skills/certs) technician. Future: availability of specific 'emergency kits' or critical parts in van stock."
        ],
        dataModels: [
          "`Job` document: add `isEmergency: boolean` (defaults to false).",
          "`Technician` profile: (Future for parts) `hasEmergencyKit: boolean` or list of `specialEquipment: string[]`."
        ],
        aiComponents: [
          "`allocateJobFlow` and `dynamicReoptimizerFlow` must be adapted to give extreme priority to emergency jobs and factor in skills/resources."
        ],
        uiUx: [
          "Dispatcher Dashboard: Clear 'Mark as Emergency' button/option during job creation or on existing job details.",
          "Visual distinction for emergency jobs on map and lists (e.g., flashing icon, red highlighting).",
          "Notifications to assigned technician about the emergency nature of the job."
        ],
        integrationPoints: [
          "Tightly coupled with 'Advanced Real-time Dynamic Re-optimization'.",
          "Utilizes 'Smart Skill Matching'.",
          "Future: Integrates with 'Intelligent Parts & Van Stock Management' for resource checks."
        ],
        technicalChallenges: [
          "Defining the override logic for non-emergency tasks when an emergency arises (e.g., how much disruption is acceptable?).",
          "Ensuring the AI can quickly find the *best possible* (not just any) response for an emergency."
        ],
        successMetrics: [
          "Drastic reduction in response times for emergency jobs.",
          "Improved customer satisfaction in critical situations.",
          "Efficient allocation of appropriately skilled technicians to emergencies."
        ]
      }
    },
    {
      title: "AI-Powered Mobile Knowledge Base & Troubleshooting Guides",
      description: "Provides technicians with quick, in-app access to equipment manuals, error code lookups, and best practices. AI enhances this by enabling natural language queries (e.g., 'What does error E47 mean?'), AI-guided diagnostics based on symptoms, and contextual information suggestions based on the job type. The knowledge base continuously improves by learning from successfully documented solutions and common issues identified in completed job protocols. This empowers technicians to resolve issues faster on-site, improves first-time fix rates, and reduces reliance on support calls, directly addressing a major technician pain point of difficult on-site problem-solving.",
      icon: BookOpen,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Repository for documents: equipment manuals, troubleshooting guides, error code lists, best practice articles (PDFs, structured text, images).",
          "Technician Mobile App: Search (keyword-based initially, then AI natural language). Browse by category/equipment type.",
          "AI Query: Technicians ask questions like 'How to fix error X on Y model?' or describe symptoms.",
          "AI Guided Diagnostics: AI presents a series of questions or steps to narrow down a problem based on symptoms.",
          "Contextual Suggestions: AI suggests relevant articles based on current job's equipment type or description.",
          "Feedback Loop: Solutions from 'AI-Assisted Digital Protocols' can be used to refine/add to the knowledge base."
        ],
        dataModels: [
          "New Firestore collection: `KnowledgeBaseArticles` (fields: `articleId`, `title`, `content` (markdown/HTML), `equipmentTypeAssociation[]`, `errorCodes[]`, `tags[]`, `authorId`, `createdAt`, `updatedAt`, `sourceDocumentUrl?`).",
          "For AI search (RAG): Potentially use Vertex AI Vector Search or similar to store embeddings of article content."
        ],
        aiComponents: [
          "Genkit flow: `queryKnowledgeBaseFlow` (Input: natural language query, job context. Output: relevant articles, summaries, or diagnostic steps).",
          "Gemini model for understanding queries, summarizing articles, generating diagnostic questions (RAG pattern).",
          "Text embedding model (e.g., from Google AI Studio) for creating vectors for semantic search."
        ],
        uiUx: [
          "Dispatcher Dashboard: Interface for managing (uploading, editing, tagging) knowledge base articles.",
          "Technician Mobile App: Clean, easily searchable interface. Display articles clearly. Interactive diagnostic flow.",
          "Option for technicians to rate article usefulness or suggest improvements."
        ],
        integrationPoints: [
          "Data from 'AI-Assisted Digital Protocols' (successful fixes) can be curated to create new KB articles or validate existing ones.",
          "CRM/Equipment History can provide context for AI suggestions.",
          "Real-time Chat could allow AI to suggest KB articles to dispatchers/technicians."
        ],
        technicalChallenges: [
          "Initial creation and curation of a comprehensive knowledge base.",
          "Keeping content up-to-date.",
          "Effectiveness of AI natural language understanding and relevance of search results.",
          "Designing effective AI-guided diagnostic flows."
        ],
        successMetrics: [
          "Reduced average on-site troubleshooting time.",
          "Improved First-Time-Fix-Rate.",
          "Fewer support calls from technicians to dispatch/seniors.",
          "Increased technician confidence and autonomy.",
          "High usage and positive feedback on the KB feature."
        ]
      }
    },
    {
      title: "Basic Integrated CRM for Customer & Equipment Management",
      description: "Manage customer details, contact history, and site-specific notes. Crucially for technicians, this will track installed HVAC equipment (model, serial, installation date, warranty, service history) accessible via the mobile app, enabling better on-site preparation, faster diagnosis, and reducing technician frustration from lack of information about the customer or equipment. This data also enhances AI job allocation and parts suggestions.",
      icon: ClipboardList,
      status: "Consideration",
      developerBrief: {
        coreFunctionality: [
          "Manage customer records (name, contact info, multiple site addresses).",
          "Track equipment installed at customer sites (type, make, model, serial, installation date, warranty info).",
          "Log service history against each piece of equipment (linking to completed jobs).",
          "Technicians can view relevant customer and equipment details for their assigned jobs on mobile."
        ],
        dataModels: [
          "New Firestore collection: `Customers` (fields: `customerId`, `name`, `contactPerson`, `phone`, `email`, `billingAddress`, `siteAddresses: [{ addressId, fullAddress, notes }]`).",
          "New Firestore collection: `Equipment` (fields: `equipmentId`, `customerId`, `siteAddressId`, `type`, `make`, `model`, `serialNumber`, `installationDate`, `warrantyExpiryDate`, `notes`, `serviceHistoryJobIds: string[]`).",
          "`Job` document: link to `customerId` and potentially `equipmentId[]` being serviced."
        ],
        aiComponents: [
          "AI job allocation can use equipment history (e.g., technician familiar with specific model).",
          "AI parts suggestion can be more accurate with known equipment details.",
          "AI in Knowledge Base can use equipment type for contextual suggestions."
        ],
        uiUx: [
          "Dispatcher Dashboard: Interface for CRUD operations on customers and equipment. View to link equipment to customers/sites.",
          "Technician Mobile App: Clear display of customer contact details, site access notes, and detailed list of equipment at the job location with their service history.",
          "Easy way to add new equipment discovered on-site."
        ],
        integrationPoints: [
          "Foundation for 'Proactive Maintenance Scheduling'.",
          "Provides critical context for 'AI-Assisted Digital Protocols', 'Intelligent Parts Management', and 'AI-Powered Knowledge Base'.",
          "Job creation flow would allow selecting customer and site, then relevant equipment."
        ],
        technicalChallenges: [
          "Initial data migration/entry for existing customer and equipment data.",
          "Designing a user-friendly interface for managing potentially complex relationships (customers, multiple sites, multiple pieces of equipment per site).",
          "Ensuring data accuracy and consistency."
        ],
        successMetrics: [
          "Reduced time for technicians to find customer/equipment information on-site.",
          "Improved technician preparedness for jobs.",
          "Enhanced accuracy of AI suggestions (parts, allocation) due to better contextual data.",
          "Better tracking of equipment under maintenance contracts."
        ]
      }
    },
  ],
  futureVision: [
    {
      title: "Predictive Maintenance as a Service",
      description: "Analyze vehicle consumption data and machine data to predict maintenance needs and enable proactive service planning, minimizing downtime and extending equipment lifespan.",
      icon: Brain,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["Collect and analyze sensor data from HVAC equipment (if available via IoT) or patterns from manual service reports.", "AI models to predict failures or optimal maintenance timing."],
        dataModels: ["Requires `EquipmentSensorReadings` or detailed structured data from service protocols.", "AI models for anomaly detection/prediction."],
        technicalChallenges: ["Requires IoT integration or highly structured data. Complex AI modeling."]
      }
    },
    {
      title: "Smart City Infrastructure Integration",
      description: "Explore deeper integration with urban data sources like construction site information, parking availability, or environmental zones to further refine route optimization and ensure compliance.",
      icon: Building2,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["Integrate with public/private APIs for real-time city data."],
        aiComponents: ["Route optimization AI to consume new data streams."],
        technicalChallenges: ["API availability and reliability, data standardization."]
      }
    },
    {
      title: "AI-Powered Material Management & Inventory Optimization",
      description: "Extend AI to predict material requirements for jobs, optimizing warehousing and avoiding parts shortages in the field.",
      icon: Package,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["AI for demand forecasting of parts based on historical usage, job types, seasonality.", "Optimization of central warehouse stock levels."],
        integrationPoints: ["Extends 'Intelligent Parts & Van Stock Management'.", "Potential integration with supplier ERPs."],
        technicalChallenges: ["Complex AI for forecasting, requires significant historical data."]
      }
    },
    {
      title: "Augmented Reality (AR) for Technicians",
      description: "Utilize AR in the mobile app to support technicians on-site, e.g., through interactive instructions or by overlaying relevant device information.",
      icon: Glasses,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["Overlay digital information (manuals, schematics, sensor readings) onto a camera view of equipment."],
        uiUx: ["Mobile AR interface using ARKit/ARCore or WebXR."],
        technicalChallenges: ["High development complexity, device compatibility, creating AR content."]
      }
    },
    {
      title: "Marketplace for Craft Service Orders",
      description: "Develop a platform enabling craft businesses to share or take on unassigned jobs within a trusted network, optimizing industry-wide utilization.",
      icon: ShoppingCart,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["Platform for businesses to post jobs they can't handle and for others to bid/accept.", "Reputation and payment systems."],
        technicalChallenges: ["Multi-tenancy, trust and safety, complex business logic."]
      }
    },
    {
      title: "Automated Invoicing and Report Creation",
      description: "Fully integrate job documentation into automated administrative processes to further reduce office workload.",
      icon: FileSpreadsheet,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["Generate invoices from completed job data (time, parts, protocols).", "Automate creation of customer service reports."],
        integrationPoints: ["Uses data from Time Tracking, Parts Management, Digital Protocols.", "Potential integration with accounting software (e.g., DATEV, Lexoffice)."],
        technicalChallenges: ["Tax calculation, localization, diverse invoicing requirements."]
      }
    },
    {
      title: "Machine Learning for Skills Development",
      description: "Analyze job data and technician performance to generate personalized further education recommendations for technicians, actively helping to combat 'Fachkräftemangel' (labor shortage) through targeted qualification.",
      icon: GraduationCap,
      status: "Vision",
      developerBrief: {
        coreFunctionality: ["AI analyzes technician performance on different job types/equipment vs. their current skills/certifications.", "Suggests relevant training modules or areas for development."],
        dataModels: ["Requires detailed performance data (FTFR, job duration, customer feedback) linked to technician skills."],
        aiComponents: ["ML models for skill gap analysis and recommendation."],
        technicalChallenges: ["Defining performance objectively, sourcing/integrating training content."]
      }
    },
  ]
};

export default function RoadmapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">FleetSync AI Roadmap</h1>
        <p className="text-muted-foreground">
          Our planned features, improvements, and long-term vision to make fleet management smarter and more efficient,
          directly addressing key industry pain points and leveraging cutting-edge AI.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b font-headline">Core AI & Dispatcher Experience</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.coreAiDispatcher.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">HVAC/SHK Specific Enhancements</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.hvacSpecific.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Future Innovations &amp; Long-Term Vision</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.futureVision.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}

    
