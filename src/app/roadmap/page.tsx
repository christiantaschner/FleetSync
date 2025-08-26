
"use client";

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap, BarChart, User,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList, Timer, BookOpen, WifiOff, CalendarDays, Cog,
  Sparkles, Navigation, Repeat, ShieldQuestion, Users2, CalendarClock, CreditCard, ImageIcon, Mailbox, Search, Eye,
  List, MousePointerClick, HelpCircle, CloudRain, LayoutDashboard, Smartphone, Target, DollarSign, Loader2, Star, Workflow, TrendingUp, ListChecks
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
  phase1: [
     {
      title: "Job Profit Scoring Engine",
      description: "Evaluate each job using revenue & cost drivers.",
      icon: TrendingUp,
    },
    {
      title: "Fleet-Wide Profit Optimization",
      description: "Assign jobs to maximize profit/hour across all technicians.",
      icon: Brain,
    },
    {
      title: "Basic Tech Skill Matching",
      description: "Ensure techs are assigned to jobs they are qualified for.",
      icon: ListChecks,
    },
    {
      title: "Real-Time Dashboard (Simplified)",
      description: "Show job list, profit/hour per tech, and SLA compliance.",
      icon: BarChart,
    },
  ],
  phase2: [
    {
      title: "SLA Risk Prediction",
      description: "Forecast jobs likely to breach SLAs and auto-adjust assignments.",
      icon: CalendarClock,
    },
    {
      title: "Upsell Opportunity Prediction",
      description: "Identify jobs with highest upsell potential for each tech.",
      icon: Lightbulb,
    },
    {
      title: "Return Visit Risk Modeling",
      description: "Flag jobs likely to require follow-ups.",
      icon: AlertOctagon,
    },
    {
      title: "Dynamic Schedule Adjustments",
      description: "Auto-reschedule jobs if delays or cancellations occur.",
      icon: Shuffle,
    },
  ],
  phase3: [
    {
      title: "Pre-Built Industry Templates",
      description: "Templates for HVAC, Electrical, Plumbing, Pest Control, etc.",
      icon: Building2,
    },
    {
      title: "Customizable Rules Engine",
      description: "Businesses define revenue, cost, SLA, and priority rules without coding.",
      icon: Cog,
    },
    {
      title: "Regulatory Awareness",
      description: "Overtime, hazardous work, local labor laws incorporated automatically.",
      icon: FileText,
    },
  ],
  phase4: [
    {
      title: "Profit Cockpit",
      description: "Profit per job, per tech, fleet-wide, with real-time updates.",
      icon: Rocket,
    },
    {
      title: "Opportunity Heatmaps",
      description: "Identify unscheduled high-value jobs and underperforming techs.",
      icon: Map,
    },
    {
      title: "Scenario Modeling",
      description: "Visualize “what-if” profit impact for different assignment strategies.",
      icon: Brain,
    },
    {
      title: "Tech Performance Analytics",
      description: "Track speed, accuracy, upsell performance, and SLA compliance.",
      icon: Users2,
    },
  ],
  phase5: [
    {
      title: "End-to-End Integration",
      description: "Accounting, inventory, CRM, payroll, and customer notifications.",
      icon: Workflow,
    },
    {
      title: "Smart Alerts",
      description: "Notify dispatchers of revenue threats, SLA breaches, or missed upsells.",
      icon: Zap,
    },
    {
      title: "Tech Marketplace Integration",
      description: "Auto-source subcontractors for specialized jobs.",
      icon: Users,
    },
    {
      title: "Benchmarking & Competitive Analytics",
      description: "Compare profit/hour against anonymized industry data.",
      icon: BarChart,
    },
  ],
  phase6: [
    {
      title: "Mobile-First UX",
      description: "Techs can view schedules, routes, and profit opportunities on the go.",
      icon: Smartphone,
    },
    {
      title: "Gamification",
      description: "Reward techs or dispatchers for achieving profit targets or SLA compliance.",
      icon: Star,
    },
    {
      title: "Interactive Dashboards",
      description: "Drag-and-drop schedule adjustments, AI suggestions, and instant profit recalculation.",
      icon: MousePointerClick,
    },
  ]
};

export default function RoadmapPage() {
    const { t, language } = useTranslation();
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    const appName = "MarginMax";
    const description = language === 'de' 
        ? `Unsere geplante Funktionen, Verbesserungen und langfristige Vision, um die Flottenverwaltung intelligenter und effizienter zu gestalten.`
        : `Our planned features, improvements, and long-term vision to make fleet management smarter and more efficient.`;

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
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Phase 1 – Foundation: Profit-First AI Core (0–6 months)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roadmapFeatures.phase1.map((item) => (
            <RoadmapItem key={item.title} {...item} status="In Progress" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Phase 2 – Predictive Intelligence & SLA Automation (6–12 months)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roadmapFeatures.phase2.map((item) => (
            <RoadmapItem key={item.title} {...item} status="Planned" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Phase 3 – Industry Specialization & Rule Customization (12–18 months)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roadmapFeatures.phase3.map((item) => (
            <RoadmapItem key={item.title} {...item} status="Planned" />
          ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Phase 4 – Advanced Business Cockpit & Analytics (18–24 months)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roadmapFeatures.phase4.map((item) => (
            <RoadmapItem key={item.title} {...item} status="Planned" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Phase 5 – Ecosystem & Automation (24–36 months)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roadmapFeatures.phase5.map((item) => (
            <RoadmapItem key={item.title} {...item} status="Vision" />
          ))}
        </div>
      </section>

       <section>
        <h2 className="text-2xl font-semibold mb-4 mt-6 pb-2 border-b font-headline">Phase 6 – UX & Engagement Enhancements (Ongoing)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roadmapFeatures.phase6.map((item) => (
            <RoadmapItem key={item.title} {...item} status="Vision" />
          ))}
        </div>
      </section>

    </div>
  );
}
