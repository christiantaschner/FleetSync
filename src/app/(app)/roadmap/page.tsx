
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap, PieChart, User,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList, Timer, BookOpen, WifiOff, CalendarDays, Cog,
  Sparkles, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoadmapItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: 'Planned' | 'In Progress' | 'Consideration' | 'Vision' | 'Completed';
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
    <Card className={cn(
        "hover:shadow-lg transition-shadow h-full flex flex-col",
        status === 'Completed' && "border-green-600/50 bg-green-50/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-6 w-6 text-primary", status === 'Completed' && "text-green-600")} />
          <CardTitle className="text-lg font-headline">{title}</CardTitle>
        </div>
        {status && (
          <CardDescription className={cn("text-xs pt-1", status === 'Completed' && "text-green-700 font-semibold")}>Status: {status}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const roadmapFeatures = {
  mvp: [
    {
      title: "AI-Powered Job Allocation (Single & Batch)",
      description: "Core AI feature suggests the best technician for new jobs. Includes a batch assignment mode with a review step for all pending jobs.",
      icon: Sparkles,
      status: "Completed",
    },
    {
      title: "CSV Job Data Import",
      description: "A critical feature for rapid onboarding. Allows dispatchers to import their existing job schedules from a CSV file, minimizing manual data entry.",
      icon: FileSpreadsheet,
      status: "Completed",
    },
    {
        title: "Google Maps Address Autocomplete",
        description: "Integrate Google Maps Places API for automatic address suggestions in job creation/editing forms to improve accuracy and speed.",
        icon: Map,
        status: "Completed",
    },
    {
        title: "Dashboard Map with Live Traffic",
        description: "The main dashboard map view is enhanced with a real-time traffic layer from Google Maps, providing crucial operational awareness.",
        icon: Map,
        status: "Completed",
    },
     {
      title: "Handle Technician Unavailability & AI Reassignment",
      description: "Allows dispatchers to mark a technician as unavailable, which automatically unassigns their active jobs and triggers the AI to suggest reassignments for those jobs, streamlining the response to unexpected staff changes.",
      icon: AlertOctagon,
      status: "Completed",
    },
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
      title: "Interactive Visual Calendar Scheduling with AI-Assisted Reassignment",
      description: "Provides dispatchers a multi-day visual calendar to view all jobs, assigned technicians, and times. Supports drag-and-drop job reassignment, which triggers AI to draft an optimized schedule for affected technicians. Dispatcher reviews and confirms changes. This is key for gradual migration from existing scheduling tools.",
      icon: CalendarDays,
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Display jobs on a multi-day calendar view (e.g., weekly, daily per technician). This allows dispatchers to manage future schedules in FleetSync while still running the current day on an old system, easing migration.",
          "Show key job info (title, technician, time) directly on calendar events.",
          "Allow filtering by technician or viewing all.",
          "Implement drag-and-drop of job 'events' between technicians or time slots.",
          "When a job is dropped, trigger an AI re-optimization for the source and target technicians' schedules (and potentially others affected by cascading changes).",
          "AI calculates a 'draft' schedule; no immediate live update.",
          "Dispatcher is presented with the proposed changes (e.g., 'Technician A's new schedule: ...', 'Technician B's new schedule: ...').",
          "Dispatcher can confirm or reject the draft. Confirmation applies changes to live data."
        ],
        dataModels: [
          "No new core collections, but `Job` data (`scheduledTime`, `estimatedDurationMinutes`, `assignedTechnicianId`) is key.",
          "May need temporary data structures in frontend state or a temporary backend store for 'draft schedules' if they are complex and involve many technicians."
        ],
        aiComponents: [
          "Relies heavily on a mature 'Advanced Real-time Dynamic Re-optimization' flow.",
          "The re-optimization flow would need to accept input specifying a 'manual move' of a job as a strong constraint/starting point for its calculation.",
          "Output of the AI would be the 'draft' schedules for affected technicians."
        ],
        uiUx: [
          "A robust calendar component (e.g., FullCalendar, or a custom solution).",
          "Clear visual representation of jobs, technicians, and time.",
          "Intuitive drag-and-drop interactions.",
          "A modal or dedicated UI panel to display the 'draft changes' proposed by AI for review before confirmation.",
          "Visual cues for jobs that have fixed `scheduledTime` constraints, making them less 'draggable' or warning if a drag violates the constraint."
        ],
        integrationPoints: [
          "Directly uses and enhances the 'Advanced Real-time Dynamic Re-optimization' capability.",
          "Job creation/editing dialogs would update the calendar view. Crucially, the 'CSV Job Data Import' feature would populate this calendar.",
          "Technician status updates (e.g., job completion) should reflect on the calendar.",
          "Future Vision: Integration with external calendar APIs (Google Calendar, Outlook) for technician/company-wide visibility."
        ],
        technicalChallenges: [
          "Implementing a performant and interactive calendar UI, especially with many jobs/technicians.",
          "Managing the 'draft state' of AI-proposed changes without affecting live data until confirmation.",
          "Ensuring the AI re-optimization is fast enough for interactive use after a drag-and-drop.",
          "Handling edge cases and conflicts gracefully (e.g., dragging a job to an unqualified technician, or to an impossible time slot).",
          "Complexity of updating multiple technicians' schedules atomically upon confirmation."
        ],
        successMetrics: [
          "Reduced time for dispatchers to perform complex rescheduling tasks.",
          "Improved dispatcher confidence and control over AI-assisted planning.",
          "Better overall schedule coherence and optimization.",
          "High adoption rate by dispatchers migrating from spreadsheet-based planning."
        ]
      }
    },
  ],
  coreAiDispatcher: [
    {
      title: "Dynamic Skill Library Management",
      description: "Allows dispatchers to define and manage a central library of technician skills (e.g., specific certifications, equipment expertise). This list populates selection options when editing technicians and is used by AI for smarter job allocation. Ensures consistent skill terminology and makes skill-based assignment more robust.",
      icon: Cog, 
      status: "Completed",
    },
    {
      title: "AI Job Skill Suggestion",
      description: "AI automatically analyzes job descriptions to suggest required skills from the company's skill library, which the dispatcher can then review and edit.",
      icon: Lightbulb,
      status: "Completed",
    },
    {
      title: "AI-Powered \"Next Up Technicians\" Prediction",
      description: "Develop an AI model to predict which technicians will become available soonest, considering current job types, travel time, and historical data from time tracking and job statuses. Display this on the dashboard.",
      icon: Lightbulb,
      status: "Completed",
    },
    {
      title: "Technician Job Navigation",
      description: "Technicians can tap a 'Navigate' button in their job view to open Google Maps on their mobile device with turn-by-turn directions to the job site.",
      icon: Navigation,
      status: "Completed",
    },
    {
      title: "Digital Customer Signatures (Mobile App)",
      description: "Enable technicians to capture customer signatures digitally on the mobile app for proof of service, reducing paperwork and streamlining job completion.",
      icon: FileSignature,
      status: "Completed",
    },
     {
      title: "Technician Profile Viewing & Change Suggestions",
      description: "Enable technicians to view their own detailed profiles (including skills, certifications, contact info) via the mobile app. Implement a system for them to suggest changes or additions (e.g., new skill acquired), which dispatchers can review and approve. Improves data accuracy and empowers technicians.",
      icon: User, 
      status: "Planned",
      developerBrief: {
        coreFunctionality: [
          "Technician Mobile App: A new 'My Profile' section displaying all their data stored in the `technicians` collection.",
          "Interface for technicians to submit change requests (e.g., 'Add skill: Advanced Heat Pump Diagnostics', 'Update phone number').",
          "Dispatcher Dashboard: A notification system or dedicated area to review and approve/reject these suggestions.",
          "Approved suggestions update the technician's Firestore document."
        ],
        dataModels: [
          "Potentially a new Firestore collection: `profileChangeRequests` (fields: `requestId`, `technicianId`, `requestedChanges: object`, `status: 'pending' | 'approved' | 'rejected'`, `requestDate`, `reviewDate?`, `reviewerId?`).",
          "Updates to the `technicians` collection upon approval."
        ],
        aiComponents: ["N/A for this feature directly, but accurate technician profiles benefit AI allocation."],
        uiUx: [
          "Mobile App: Clear, read-only display of profile data. Simple form for submitting change suggestions.",
          "Dispatcher Dashboard: List of pending suggestions with diffs or clear indication of requested changes. Approve/Reject buttons."
        ],
        integrationPoints: [
          "Relies on Firebase Authentication for identifying the technician.",
          "Updates `technicians` data used by all other parts of the system."
        ],
        technicalChallenges: [
          "Designing a secure and auditable approval workflow.",
          "Handling concurrent edits if a dispatcher modifies a profile while a suggestion is pending.",
          "User experience for both technicians submitting suggestions and dispatchers reviewing them."
        ],
        successMetrics: [
          "More accurate and up-to-date technician profiles.",
          "Increased technician engagement and ownership of their data.",
          "Reduced administrative burden on dispatchers for routine profile updates.",
          "Improved data quality feeding into AI systems."
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
      title: "Reporting & Analytics Dashboard",
      description: "A dashboard providing insights into key performance indicators (KPIs) like job completion rates and technician workloads. Includes charts for jobs by status and jobs completed per technician.",
      icon: PieChart,
      status: "Completed",
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
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b font-headline">MVP: Core Features for Launch</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.mvp.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b font-headline">Post-MVP: Core Enhancements</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.coreAiDispatcher.map((item) => (
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
