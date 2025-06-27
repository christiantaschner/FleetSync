
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap, PieChart, User,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList, Timer, BookOpen, WifiOff, CalendarDays, Cog,
  Sparkles, Navigation, Repeat, ShieldQuestion, Users2, CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoadmapItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: 'Planned' | 'In Progress' | 'Consideration' | 'Vision' | 'Completed';
}

const RoadmapItem: React.FC<RoadmapItemProps> = ({ title, description, icon: Icon, status }) => {
  return (
    <Card className={cn(
        "hover:shadow-lg transition-shadow h-full flex flex-col",
        status === 'Completed' && "border-green-600/50 bg-green-50/50",
        status === 'In Progress' && "border-amber-500/50 bg-amber-50/50 ring-2 ring-amber-500/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-6 w-6 text-primary", 
            status === 'Completed' && "text-green-600",
            status === 'In Progress' && "text-amber-600"
          )} />
          <CardTitle className="text-lg font-headline">{title}</CardTitle>
        </div>
        {status && (
          <CardDescription className={cn("text-xs pt-1", 
            status === 'Completed' && "text-green-700 font-semibold",
            status === 'In Progress' && "text-amber-700 font-semibold"
          )}>Status: {status}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const roadmapFeatures = {
  completed: [
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
      title: "Interactive Visual Calendar Scheduling",
      description: "Provides dispatchers a multi-day visual calendar to view all jobs, assigned technicians, and times. Supports drag-and-drop job reassignment, which triggers AI to draft an optimized schedule for affected technicians. Dispatcher reviews and confirms changes. This is key for gradual migration from existing scheduling tools.",
      icon: CalendarDays,
      status: "Completed",
    },
    {
      title: "Digital Customer Signatures & Photo Documentation",
      description: "Enable technicians to capture customer signatures digitally on the mobile app for proof of service and upload photos of completed work, reducing paperwork and streamlining job completion.",
      icon: FileSignature,
      status: "Completed",
    },
    {
      title: "Advanced Real-time Dynamic Re-optimization",
      description: "Core AI engine tackles 'Ineffiziente Disposition' by re-optimizing routes based on dispatcher triggers. Includes manual and automated schedule health checks to predict delays and enable proactive responses.",
      icon: Shuffle, 
      status: "Completed",
    },
     {
      title: "Proactive Delay Warnings & Smart Suggestions",
      description: "The system proactively warns dispatchers BEFORE a technician misses a time window and suggests concrete solutions, such as notifying the customer or reassigning the job.",
      icon: ShieldQuestion,
      status: "Completed",
    },
    {
      title: "Recurring Job & Maintenance Contract Management",
      description: "Create recurring jobs for routine maintenance contracts. The AI will suggest optimal scheduling windows in the future, simplifying long-term planning for dispatchers.",
      icon: Repeat,
      status: "Completed",
    },
    {
      title: "In-App Chat & Media Sharing",
      description: "Enable direct, job-specific chat between dispatchers and technicians. Allows for quick questions and on-site photo sharing, reducing reliance on external apps.",
      icon: MessageSquare,
      status: "Completed",
    },
    {
      title: "AI-Assisted Digital Protocols & Checklists",
      description: "Enable technicians to complete job-specific digital checklists and protocols on their mobile device. This ensures standardized procedures, captures structured data for better analytics, and replaces paper forms.",
      icon: ClipboardList,
      status: "Completed",
    },
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
      title: "Intelligent Parts & Van Stock Management",
      description: "The AI will know which technician has which parts or special tools in their van, and factor this into job allocation to avoid unnecessary trips to the warehouse. This is a key step towards reducing 'Kosten' and improving first-time fix rates.",
      icon: Wrench,
      status: "Completed",
    },
    {
      title: "AI-Powered Job Priority Suggestion",
      description: "When a dispatcher creates a new job, the AI analyzes the description to suggest a priority level (e.g., 'High' for 'emergency,' 'Low' for 'maintenance'). It will also provide a brief justification for the suggested priority, helping dispatchers make faster, more consistent decisions.",
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
      title: "Proactive Emergency Dispatch AI",
      description: "When a new high-priority job is created, the AI automatically evaluates the best assignment across the entire fleet, even suggesting interruptions. The dispatcher is presented with this optimal suggestion on the dashboard for immediate approval.",
      icon: Zap,
      status: "Completed",
    },
    {
      title: "Technician Job Navigation",
      description: "Technicians can tap a 'Navigate' button in their job view to open Google Maps on their mobile device with turn-by-turn directions to the job site.",
      icon: Navigation,
      status: "Completed",
    },
     {
      title: "Technician Profile Viewing & Change Suggestions",
      description: "Enable technicians to view their own detailed profiles (including skills, certifications, contact info) via the mobile app. Implement a system for them to suggest changes or additions (e.g., new skill acquired), which dispatchers can review and approve. Improves data accuracy and empowers technicians.",
      icon: User, 
      status: "Completed",
    },
    {
      title: "Digital Time Tracking & Management",
      description: "Implement features for technicians to digitally record working hours (travel, on-site, breaks) via the mobile app. This simplifies their daily logging, helps control 'Kosten' by managing overtime, and provides data for accurate job costing and payroll. Accurate historical time data from this system also enhances the precision of AI-driven route optimization and future job scheduling.",
      icon: Timer,
      status: "Completed",
    },
    {
      title: "Real-time Notifications for Schedule Changes",
      description: "Actively notify technicians (e.g., via a visual alert or eventually a push notification) when their schedule has been changed by a dispatcher, ensuring they are always aware of the latest plan.",
      icon: Zap,
      status: "Completed",
    },
    {
      title: "First-Time-Fix-Rate (FTFR) Analytics",
      description: "Track and analyze the First-Time-Fix-Rate (FTFR) to identify areas for improvement in technician skills, parts availability, or initial job diagnosis, contributing to higher efficiency and customer satisfaction.",
      icon: ThumbsUp,
      status: "Completed",
    },
    {
      title: "Customer Satisfaction & Response Time Analytics",
      description: "Implement tracking for customer satisfaction scores and critical response times to monitor and enhance service quality, directly impacting customer retention.",
      icon: Smile,
      status: "Completed",
    },
     {
      title: "Basic Reporting Dashboard",
      description: "A dashboard providing insights into key performance indicators (KPIs) like job completion rates and technician workloads. Includes charts for jobs by status and jobs completed per technician.",
      icon: PieChart,
      status: "Completed",
    },
    {
      title: "Advanced Analytics & Performance Insights",
      description: "Provide deeper insights by comparing planned vs. actual times, analyzing technician utilization rates, tracking punctuality, and identifying common reasons for schedule deviations to continuously refine planning estimates.",
      icon: PieChart,
      status: "Completed",
    },
    {
      title: "AI-Powered Mobile Knowledge Base & Troubleshooting Guides",
      description: "Provides technicians with quick, in-app access to equipment manuals, error code lookups, and best practices. AI enhances this by enabling natural language queries and guided diagnostics based on symptoms.",
      icon: BookOpen,
      status: "Completed",
    },
    {
      title: "Basic Integrated CRM for Customer & Equipment Management",
      description: "Manage customer details, contact history, and track installed HVAC equipment, enabling better on-site preparation and faster diagnosis. This data also enhances AI job allocation.",
      icon: ClipboardList,
      status: "Completed",
    },
    {
      title: "Live Technician Tracking Portal for Customers",
      description: "Allow dispatchers to send a unique link to customers, enabling them to see their technician's real-time location on a map and their updated ETA, similar to modern package delivery services.",
      icon: Navigation,
      status: "Completed",
    },
    {
      title: "CO2 Emission Estimation & Reporting",
      description: "Estimate and report CO2 emissions based on travel data, contributing to 'Nachhaltigkeit' (sustainability) and helping reduce fuel 'Kosten' through awareness and optimized routing.",
      icon: Leaf,
      status: "Completed",
    },
  ],
  planned: [
    {
      title: "Technician Teams & Joint Scheduling (Meister/Lehrling)",
      description: "Ability to group technicians (e.g., a master craftsman and an apprentice) who are always scheduled for jobs together. The AI allocation engine will be updated to assign suitable jobs to a team, respecting their combined skills and availability.",
      icon: Users2,
      status: "Planned",
    },
    {
      title: "Customizable Technician Working Hours",
      description: "Define standard working hours and days for each technician (e.g., Mon-Thu, 8am-2pm). The AI scheduling engine will respect these hours for regular job assignments, improving scheduling accuracy and work-life balance.",
      icon: CalendarClock,
      status: "Planned",
    },
    {
      title: "On-Call & Emergency Duty Roster",
      description: "Create and manage on-call schedules for emergency jobs that occur outside of normal business hours. The AI will prioritize the designated on-duty technician for any urgent weekend or night-time requests.",
      icon: Zap,
      status: "Planned",
    },
  ],
  vision: [
     {
      title: "Offline Mode for Core Mobile App Functions",
      description: "Allows technicians to access job details, update statuses, and document work even without internet. Data syncs when connectivity is restored, ensuring uninterrupted workflow in areas with poor signal (e.g., basements, remote sites).",
      icon: WifiOff,
      status: "Vision",
    },
    {
      title: "Predictive Maintenance as a Service",
      description: "Analyze vehicle consumption data and machine data to predict maintenance needs and enable proactive service planning, minimizing downtime and extending equipment lifespan.",
      icon: Brain,
      status: "Vision",
    },
    {
      title: "Smart City Infrastructure Integration",
      description: "Explore deeper integration with urban data sources like construction site information, parking availability, or environmental zones to further refine route optimization and ensure compliance.",
      icon: Building2,
      status: "Vision",
    },
    {
      title: "AI-Powered Material Management & Inventory Optimization",
      description: "Extend AI to predict material requirements for jobs, optimizing warehousing and avoiding parts shortages in the field.",
      icon: Package,
      status: "Vision",
    },
    {
      title: "Augmented Reality (AR) for Technicians",
      description: "Utilize AR in the mobile app to support technicians on-site, e.g., through interactive instructions or by overlaying relevant device information.",
      icon: Glasses,
      status: "Vision",
    },
    {
      title: "Marketplace for Craft Service Orders",
      description: "Develop a platform enabling craft businesses to share or take on unassigned jobs within a trusted network, optimizing industry-wide utilization.",
      icon: ShoppingCart,
      status: "Vision",
    },
    {
      title: "Automated Invoicing and Report Creation",
      description: "Fully integrate job documentation into automated administrative processes to further reduce office workload.",
      icon: FileSpreadsheet,
      status: "Vision",
    },
    {
      title: "Machine Learning for Skills Development",
      description: "Analyze job data and technician performance to generate personalized further education recommendations for technicians, actively helping to combat 'Fachkräftemangel' (labor shortage) through targeted qualification.",
      icon: GraduationCap,
      status: "Vision",
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
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b font-headline">Completed Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.completed.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b font-headline">Planned Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roadmapFeatures.planned.length > 0 ? roadmapFeatures.planned.map((item) => (
                <RoadmapItem key={item.title} {...item} />
            )) : <p className="text-muted-foreground col-span-full">All planned features are complete! See the Vision section for what's next.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Future Innovations &amp; Long-Term Vision</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.vision.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
