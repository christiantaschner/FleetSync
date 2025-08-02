
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap, BarChart, User,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList, Timer, BookOpen, WifiOff, CalendarDays, Cog,
  Sparkles, Navigation, Repeat, ShieldQuestion, Users2, CalendarClock, CreditCard, ImageIcon, Mailbox, Search, Eye,
  List, MousePointerClick, HelpCircle, CloudRain, LayoutDashboard, Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const roadmapFeatures = {
  completed: [
    {
      title: "Basic Dispatcher Web Dashboard",
      description: "A centralized web interface for managing jobs and viewing technician locations on a map.",
      icon: LayoutDashboard,
      status: "Completed",
    },
    {
      title: "Technician Mobile App Foundation",
      description: "Core mobile view for technicians to see their assigned jobs, update statuses, and navigate to sites.",
      icon: Smartphone,
      status: "Completed",
    },
    {
      title: "AI-Powered Job Allocation",
      description: "Core AI feature suggests the best technician for new jobs, with single and batch assignment modes.",
      icon: Sparkles,
      status: "Completed",
    },
    {
      title: "Dispatcher-Triggered Route Re-optimization",
      description: "AI engine re-optimizes a single technician's route upon dispatcher request, ideal after schedule changes.",
      icon: Shuffle, 
      status: "Completed",
    },
    {
      title: "Automated Schedule Risk Warnings",
      description: "The system automatically checks for schedule risks and proactively warns dispatchers about potential delays.",
      icon: ShieldQuestion,
      status: "Completed",
    },
    {
      title: "Basic Performance Analytics",
      description: "A dashboard providing insights into key KPIs like on-time arrival, jobs completed, and travel times.",
      icon: BarChart,
      status: "Completed",
    },
    {
      title: "Interactive Visual Calendar Scheduling",
      description: "A multi-day calendar view for dispatchers to visually manage all jobs, technicians, and schedules.",
      icon: CalendarDays,
      status: "Completed",
    },
     {
      title: "Technician Profile & Change Requests",
      description: "Technicians can view their profiles and suggest changes, which dispatchers can review and approve.",
      icon: User, 
      status: "Completed",
    },
    {
      title: "Handle Technician Unavailability",
      description: "Allows marking a technician as unavailable, which unassigns their jobs and can trigger AI for reassignment.",
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
      title: "CSV Job Data Import",
      description: "Allows for bulk import of existing job data via CSV files to speed up onboarding.",
      icon: FileSpreadsheet,
      status: "Completed",
    },
    {
      title: "Digital Time Tracking",
      description: "Technicians can digitally log working hours (travel, on-site, breaks) for accurate job costing and payroll.",
      icon: Timer,
      status: "Completed",
    },
    {
      title: "Getting Started Checklist",
      description: "A simple, interactive checklist on the dashboard to guide new users through essential first steps like adding a technician and creating a job.",
      icon: List,
      status: "Completed"
    },
    {
      title: "One-Click Sample Data",
      description: "A feature for new accounts to generate a set of sample technicians and jobs, allowing them to explore the app's features without manual data entry.",
      icon: MousePointerClick,
      status: "Completed"
    },
    {
      title: "Contextual In-App Guidance",
      description: "Non-intrusive tooltips and info icons next to key features to provide brief, helpful explanations right where the user needs them.",
      icon: Lightbulb,
      status: "Completed"
    },
    {
      title: "AI Help Assistant",
      description: "An in-app chat assistant powered by Genkit that can answer user questions about how to use the application's features.",
      icon: HelpCircle,
      status: "Completed"
    },
  ],
  inProgress: [
    {
      title: "Stripe Subscription & Billing Integration",
      description: "Integrate Stripe to manage customer subscriptions for different pricing plans after a 30-day free trial.",
      icon: CreditCard,
      status: "In Progress",
    },
  ],
  planned: [
     {
      title: "Live GPS Tracking of Technicians",
      description: "Provides real-time location updates of all active field technicians on the dispatcher's map view. This data is fed directly from the technician's mobile app.",
      icon: MapPin,
      status: "Planned",
    },
    {
      title: "Customer Live Tracking Portal",
      description: "Allow dispatchers to send a unique link to customers, enabling them to see their technician's real-time location on a map.",
      icon: Navigation,
      status: "Planned",
    },
    {
      title: "Enhanced Automated Customer Communication",
      description: "Automatically trigger and intelligently word notifications for predicted delays, managing customer expectations proactively.",
      icon: MessageSquare,
      status: "Planned",
    },
     {
      title: "Real-time Traffic & Basic Weather Overlays on Map",
      description: "Enhance the dispatcher's map with real-time overlays for traffic congestion and basic weather patterns (e.g., rain, snow).",
      icon: CloudRain,
      status: "Planned",
    },
     {
      title: "Tiered Feature Access & Subscription Logic",
      description: "Implement logic to restrict access to features based on the customer's subscription plan (Starter, Professional, Enterprise).",
      icon: CreditCard,
      status: "Planned",
    },
  ],
  vision: [
     {
      title: "Advanced Multi-Technician Re-optimization",
      description: "The AI constantly monitors the entire fleet and external data, automatically recalculating the most efficient routes and assignments for all technicians in response to any event.",
      icon: Brain,
      status: "Vision",
    },
    {
      title: "Hyper-Accurate ETA Predictions",
      description: "Leverage historical data, live traffic, and weather to provide highly precise ETAs for each job.",
      icon: Zap,
      status: "Vision"
    },
    {
      title: "Disruption Forecasting (Predicted Bottlenecks)",
      description: "The AI analyzes complex data patterns (traffic, weather, local events) to predict future potential delays or bottlenecks. For example, it might highlight: 'High traffic predicted near the stadium between 4-6 PM due to concert.'",
      icon: Eye,
      status: "Vision",
    },
    {
      title: "\"Why this happened\" AI Insights",
      description: "The system provides explanations for significant deviations or AI decisions. If an ETA was off, or a specific route was chosen, the AI can offer a concise reason (e.g., 'Job #123 was delayed by 20 minutes due to unexpected road closure on Elm Street').",
      icon: Search,
      status: "Vision",
    },
    {
      title: "CRM/Accounting Software Integrations",
      description: "Seamless, automated data flow between FleetSync AI and existing business software like Salesforce, QuickBooks, or HubSpot.",
      icon: Building2,
      status: "Vision",
    },
    {
      title: "AI-Powered Smart Inbox",
      description: "An intelligent inbox that automatically parses incoming emails or service requests, creating draft job tickets with suggested priorities and technicians.",
      icon: Mailbox,
      status: "Vision",
    },
     {
      title: "Offline Mode for Core Mobile App Functions",
      description: "Allows technicians to access job details, update statuses, and document work even without internet. Data syncs when connectivity is restored.",
      icon: WifiOff,
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
          Our planned features, improvements, and long-term vision to make fleet management smarter and more efficient.
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
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">In Progress</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roadmapFeatures.inProgress.length > 0 ? roadmapFeatures.inProgress.map((item) => (
                <RoadmapItem key={item.title} {...item} />
            )) : <p className="text-muted-foreground col-span-full">No features currently in progress.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Planned Features</h2>
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
