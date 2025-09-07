
"use client";

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap, BarChart, User,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList, Timer, BookOpen, WifiOff, CalendarDays, Cog,
  Sparkles, Navigation, Repeat, ShieldQuestion, Users2, CalendarClock, CreditCard, ImageIcon, Mailbox, Search, Eye,
  List, MousePointerClick, HelpCircle, CloudRain, LayoutDashboard, Smartphone, Target, DollarSign, Loader2, TrendingUp, Award, Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-language';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface RoadmapItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: 'Planned' | 'In Progress' | 'Completed' | 'Vision';
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
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
      </CardContent>
    </Card>
  );
};

const roadmapFeatures = {
  completed: [
    {
      title: "Core Dispatcher Dashboard & Technician View",
      description: "A centralized web interface for managing jobs and a mobile-optimized view for technicians to see their assigned jobs, update statuses, and navigate to sites.",
      icon: LayoutDashboard,
      status: "Completed",
    },
    {
      title: "Profit-Aware Dispatching",
      description: "An advanced AI mode that considers job revenue, parts cost, and technician labor costs to assign jobs based on maximum profitability. Dispatchers see a profit-ranked list of suggestions in the new Smart Allocation dialog.",
      icon: DollarSign,
      status: "Completed",
    },
     {
      title: "Automated Job Actuals Calculation",
      description: "Upon job completion, the system automatically calculates the actual travel time, on-site duration, and final profit margin, providing crucial data for the AI's learning loop and for accurate financial reporting.",
      icon: CheckSquare,
      status: "Completed",
    },
    {
      title: "Automated AI Feedback Loop",
      description: "The system automatically feeds job outcomes (e.g., actual vs. estimated profit) and dispatcher overrides back into the AI model. The AI analyzes discrepancies to refine its predictions over time, becoming more accurate for your specific business.",
      icon: Brain,
      status: "Completed",
    },
    {
      title: "Profitability Dashboard & Reporting",
      description: "A dedicated dashboard to visualize key financial metrics. Includes widgets for Total Profit, SLA Misses, Upsell Revenue, and a Technician Leaderboard based on profit and upsell performance.",
      icon: TrendingUp,
      status: "Completed",
    },
    {
      title: "Technician Commission & Bonus Pay",
      description: "Allow companies to configure commission structures (% of revenue, flat-rate bonuses) that are automatically factored into the Profit Score. Provides a true net-profit calculation and enables gamified leaderboards based on total earnings.",
      icon: Award,
      status: "Completed",
    },
    {
      title: "Technician Profit Leaderboard",
      description: "A leaderboard on the Reports page that ranks technicians by the actual profit margin and upsell revenue they've generated, turning performance into a measurable and motivational metric.",
      icon: Award,
      status: "Completed",
    },
    {
      title: "Dashboard Analytics for Upsell",
      description: "Surface key upsell metrics on the reporting dashboard, including total revenue from upsells, conversion rates, and a leaderboard of top-performing technicians in sales.",
      icon: BarChart,
      status: "Completed",
    },
    {
      title: "Advanced Drag-and-Drop Scheduling",
      description: "Transform the schedule into a fully interactive board. Dispatchers can assign, re-assign, and reschedule jobs by simply dragging and dropping them between technicians and time slots. The view features clear, color-coded statuses for jobs and availability.",
      icon: MousePointerClick,
      status: "Completed",
    },
    {
      title: "Automated Schedule Risk Warnings & AI Resolution",
      description: "The system automatically checks for schedule risks, proactively warns dispatchers about potential delays, and offers AI-powered one-click resolutions to reassign or reschedule the at-risk job.",
      icon: ShieldQuestion,
      status: "Completed",
    },
    {
      title: "Advanced Fleet-Wide Re-optimization",
      description: "An AI that analyzes the entire day's schedule and suggests a set of reassignments to improve overall efficiency and profitability. Dispatchers review and approve the suggested changes.",
      icon: Brain,
      status: "Completed",
    },
    {
      title: "Visual Calendar & Schedule View",
      description: "A visual calendar for dispatchers to view all jobs and technicians. Includes day and month views to manage schedules.",
      icon: CalendarDays,
      status: "Completed",
    },
     {
      title: "Technician Profile & Change Requests",
      description: "Technicians can view their profiles and suggest changes (e.g., updating their phone number or skills), which dispatchers can review and approve.",
      icon: User, 
      status: "Completed",
    },
    {
      title: "Handle Technician Unavailability",
      description: "Allows marking a technician as unavailable, which unassigns their active jobs, making them available for AI-powered reassignment.",
      icon: AlertOctagon,
      status: "Completed",
    },
    {
      title: "Recurring Job & Contract Management",
      description: "Create and manage recurring service contracts, with AI assistance for scheduling future appointments.",
      icon: Repeat,
      status: "Completed",
    },
    {
      title: "Dynamic Skill Library & AI Suggestions",
      description: "Dispatchers can manage a central skill library, and the AI suggests required skills for new jobs.",
      icon: Cog, 
      status: "Completed",
    },
    {
      title: "AI-Powered Parts Suggestion & Van Inventory",
      description: "The AI suggests required parts from job descriptions and cross-references this with a real-time inventory of each technician's van, prioritizing technicians who already have the necessary parts.",
      icon: ShoppingCart,
      status: "Completed",
    },
    {
      title: "CSV Job Data Import",
      description: "Allows for bulk import of existing job data via CSV files to speed up onboarding.",
      icon: FileSpreadsheet,
      status: "Completed",
    },
    {
      title: "In-App Chat & Photo Documentation",
      description: "A simple communication hub for technicians and dispatchers. Technicians can also capture and upload before/after photos directly from the job site.",
      icon: MessageSquare,
      status: "Completed",
    },
    {
      title: "Digital Signature & Satisfaction Capture",
      description: "Technicians can capture a customer's signature and satisfaction rating directly on their device to confirm job completion.",
      icon: FileSignature,
      status: "Completed",
    },
    {
      title: "Onboarding & In-App Help",
      description: "A simple, interactive checklist on the dashboard guides new users. An AI Help Assistant is available to answer questions about using the application's features.",
      icon: HelpCircle,
      status: "Completed"
    },
    {
      title: "Stripe Subscription & Billing Integration",
      description: "Integrate Stripe to manage customer subscriptions for different pricing plans after a 30-day free trial. This includes creating checkout sessions and a customer portal to manage billing.",
      icon: CreditCard,
      status: "Completed",
    },
    {
      title: "Customer Live Tracking Portal",
      description: "Allows dispatchers to send a unique, secure link to customers, enabling them to see their technician's real-time location and updated ETA on a map as they approach the job site.",
      icon: Navigation,
      status: "Completed",
    },
    {
      title: "AI-Powered Triage",
      description: "Dispatchers can send customers a unique link to upload photos of an issue before a visit. The AI then analyzes these images to suggest required parts and preliminary repair steps, increasing the first-time fix rate.",
      icon: ImageIcon,
      status: "Completed",
    },
    {
      title: "Real-Time Technician Location Tracking",
      description: "Provides live GPS location updates of all active field technicians on the dispatcher's map view, fed directly from the technician's mobile app. This feature is the foundation for automated status updates.",
      icon: MapPin,
      status: "Completed",
    },
     {
      title: "AI-Drafted Customer Notifications",
      description: "Generate professional, context-aware SMS/email notifications for customers for appointment confirmations, reminders, and delays.",
      icon: MessageSquare,
      status: "Completed",
    },
    {
      title: "PWA & Offline Mode Foundations",
      description: "The application is now a Progressive Web App (PWA) with a service worker. Firestore's offline persistence is enabled, allowing the app to load and display cached data even without an internet connection.",
      icon: WifiOff,
      status: "Completed",
    },
    {
      title: "AI-Powered Upsell Intelligence",
      description: "The AI analyzes job details and customer history to identify upsell opportunities, calculate a potential profit score, and provide talking points for technicians. This data directly influences the profit-aware dispatching model.",
      icon: Lightbulb,
      status: "Completed"
    },
    {
      title: "Upsell Outcome Tracking",
      description: "Technicians can log whether an upsell suggestion was successful or declined, providing crucial data for sales performance analytics.",
      icon: TrendingUp,
      status: "Completed",
    },
    {
      title: "Break Tracking",
      description: "Allows technicians to log break times during a job. This data is now reflected in the reporting dashboard for more accurate on-site duration and efficiency KPIs.",
      icon: Timer,
      status: "Completed",
    },
    {
      title: "Job Flexibility Status",
      description: "Add a 'flexibility' status to jobs ('fixed', 'flexible', 'soft_window') so the AI can make smarter rescheduling decisions, such as moving a flexible maintenance job to make room for a fixed emergency call.",
      icon: Shuffle,
      status: "Completed",
    },
    {
      title: "Automated Geo-Fenced Status Updates",
      description: "Eliminate the need for manual check-ins. The system will use geo-fencing to automatically update a job's status to 'Arrived' when the technician reaches the job site and 'En Route' when they depart.",
      icon: Target,
      status: "Completed",
    },
    {
      title: "AI-Powered Customer Follow-Up",
      description: "After a job, the AI analyzes technician notes to draft personalized follow-up messages, including maintenance tips and a link to review the service, improving customer relations and generating positive reviews.",
      icon: Smile,
      status: "Completed",
    },
    {
      title: "Integrated Invoicing & Payments",
      description: "Enable technicians to capture signatures and mark jobs as complete, triggering a 'Pending Invoice' status for the back office. Auto-generates invoice PDFs and integrates with payment processing.",
      icon: DollarSign,
      status: "Completed",
    },
    {
      title: "Dashboard Profit Score Visibility & Sorting",
      description: "Make profit a primary metric on the main dashboard. Each job in the list now displays its AI-calculated profit score, and dispatchers can sort the entire job list by profitability.",
      icon: DollarSign,
      status: "Completed",
    },
    {
      title: "AI Feature Toggles",
      description: "Provide administrators with settings to enable or disable specific AI features, such as profit-aware dispatching or automatic schedule monitoring, allowing them to tailor the system's level of automation to their business needs.",
      icon: Cog,
      status: "Completed",
    },
    {
      title: "Dispatcher UX: One-Click AI Analysis",
      description: "Combine the individual 'Suggest Skills', 'Suggest Parts', and 'Suggest Priority' buttons into a single, powerful 'Analyze Job' button. One click will provide a comprehensive set of AI suggestions for dispatcher review.",
      icon: Wand2,
      status: "Completed",
    },
    {
      title: "Dispatcher UX: Compact Technician View",
      description: "Add a compact list-view option to the Technicians tab, allowing for easier management and overview of larger teams.",
      icon: List,
      status: "Completed",
    },
    {
      title: "Dispatcher UX: Interactive AI Scheduling",
      description: "Make the AI's time suggestions interactive. Clicking a suggestion will populate the manual scheduling fields, allowing dispatchers to accept it as a starting point and make minor adjustments.",
      icon: MousePointerClick,
      status: "Completed",
    },
    {
      title: "Technician UX: Offline Status Indicator",
      description: "Display a small, persistent icon in the technician view to clearly indicate the current network status (online/offline), giving technicians more confidence when working in areas with poor connectivity.",
      icon: WifiOff,
      status: "Completed",
    },
    {
      title: "Technician UX: Upsell Catalog",
      description: "Allow technicians to select from a predefined list of common upsell services or products when logging a successful sale, standardizing data entry and automatically calculating the upsell value.",
      icon: ShoppingCart,
      status: "Completed",
    },
     {
      title: "Customer Relationship Management (CRM)",
      description: "A dedicated customer view that provides a 360-degree overview of every client, including their full job history, active contracts, and a list of all installed equipment at their locations. Dispatchers can manage all customer-related activities from this central hub.",
      icon: Users2,
      status: "Completed",
    },
    {
      title: "Unified Customer Upsert Logic",
      description: "A robust, backend data management workflow that intelligently creates or updates customer records, preventing duplicates and ensuring data integrity across the platform.",
      icon: CheckSquare,
      status: "Completed"
    },
     {
      title: "Technician UX: Detailed Time Log Summary",
      description: "An enhanced view on the technician's profile page that shows a detailed breakdown of time spent on recent jobs, including travel, on-site work, and breaks.",
      icon: Timer,
      status: "Completed",
    },
    {
      title: "UX: Visual Cue for Unsaved Changes",
      description: "On the Schedule view, when a job is dragged to a new time or technician, its appearance will change (e.g., a dashed border or a glow) to clearly indicate that the change is a 'proposed' state that needs to be confirmed with the 'Save Changes' button.",
      icon: Eye,
      status: "Completed",
    },
  ],
  inProgress: [
  ],
  planned: [
    {
      title: "UX: Quick Add Job",
      description: "A simplified 'Quick Add' mode for the new job dialog, showing only the most essential fields (Customer, Title, Description). This allows dispatchers to rapidly log a service call and fill in the details for scheduling later.",
      icon: Rocket,
      status: "Planned",
    },
  ],
  vision: [
    {
      title: "Disruption Forecasting (Predicted Bottlenecks)",
      description: "The AI will analyze complex data patterns (traffic, weather, local events) to predict future potential delays. For example, it might highlight: 'High traffic predicted near the stadium between 4-6 PM due to a concert.'",
      icon: Eye,
      status: "Vision",
    },
    {
      title: "\"Why this happened\" AI Insights",
      description: "The system will provide explanations for significant deviations. If an ETA was missed or a specific route was chosen, the AI can offer a concise reason (e.g., 'Job #123 was delayed by 20 minutes due to unexpected road closure on Elm Street').",
      icon: Search,
      status: "Vision",
    },
    {
      title: "CRM/Accounting Software Integrations",
      description: "Seamless, automated data flow between FleetSync and existing business software like QuickBooks, Salesforce, or HubSpot, eliminating double-entry and ensuring all systems are in sync.",
      icon: Building2,
      status: "Vision",
    },
    {
      title: "AI-Powered Smart Inbox",
      description: "An intelligent inbox that automatically parses incoming emails or service requests from a website form, creating draft job tickets with suggested priorities, required skills, and even a suggested technician.",
      icon: Mailbox,
      status: "Vision",
    },
  ]
};

export default function RoadmapPage() {
    const { t, language } = useTranslation();
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    const appName = "MarginMax";
    const description = `Our planned features, improvements, and long-term vision to make fleet management smarter and more efficient.`;

    useEffect(() => {
        if (!loading && userProfile?.role !== 'superAdmin') {
            router.replace('/dashboard');
        }
    }, [userProfile, loading, router]);
    
    if (loading || userProfile?.role !== 'superAdmin') {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{appName} Roadmap</h1>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

       <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">In Progress</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roadmapFeatures.inProgress.length > 0 ? roadmapFeatures.inProgress.map((item) => (
                <RoadmapItem key={item.title} {...item} />
            )) : <p className="text-muted-foreground col-span-full">No features currently in progress.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Planned Features</h2>
         <Accordion type="single" collapsible className="w-full" defaultValue="ux">
            <AccordionItem value="ux">
              <AccordionTrigger className="text-xl font-semibold">UX/Workflow Improvements</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
                  {roadmapFeatures.planned.length > 0 ? roadmapFeatures.planned.map((item) => (
                    <RoadmapItem key={item.title} {...item} />
                  )) : <p className="text-muted-foreground col-span-full">All UX improvements are complete!</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Completed Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.completed.map((item) => (
            <RoadmapItem key={item.title} {...item} />
          ))}
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
