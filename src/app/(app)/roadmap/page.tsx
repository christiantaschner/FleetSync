
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, CheckSquare, MessageSquare, Map, Settings2, Wrench, Truck, FileText, History, AlertOctagon, 
  Brain, Search, Building2, Package, Glasses, ShoppingCart, FileSpreadsheet, GraduationCap,
  FileSignature, ThumbsUp, Leaf, Smile, Shuffle, Zap, ClipboardList // Added ClipboardList
} from 'lucide-react';

interface RoadmapItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: 'Planned' | 'In Progress' | 'Consideration' | 'Vision';
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
      title: "Google Maps Address Autocomplete",
      description: "Integrate Google Maps Places API for automatic address suggestions in job creation/editing forms to improve accuracy and speed.",
      icon: Map,
      status: "Planned"
    },
    {
      title: "AI-Powered \"Next Up Technicians\" Prediction",
      description: "Develop an AI model to predict which technicians will become available soonest, considering current job types, travel time, and historical data. Display this on the dashboard.",
      icon: Lightbulb,
      status: "Planned"
    },
    {
      title: "Advanced Real-time Dynamic Re-optimization",
      description: "Core AI engine continuously re-optimizing routes and assignments based on live events like early/late job completions, new urgent jobs, traffic changes, and technician unavailability, ensuring minimal downtime and maximizing punctuality.",
      icon: Shuffle, 
      status: "Planned"
    },
    {
      title: "Digital Customer Signatures (Mobile App)",
      description: "Enable technicians to capture customer signatures digitally on the mobile app for proof of service and streamlined documentation.",
      icon: FileSignature,
      status: "Planned"
    },
    {
      title: "First-Time-Fix-Rate (FTFR) Analytics",
      description: "Track and analyze the First-Time-Fix-Rate (FTFR) to identify areas for improvement in technician skills, parts availability, or initial job diagnosis.",
      icon: ThumbsUp,
      status: "Planned"
    },
    {
      title: "CO2 Emission Estimation & Reporting",
      description: "Estimate and report CO2 emissions based on travel data, helping businesses track and improve their environmental footprint.",
      icon: Leaf,
      status: "Planned"
    },
    {
      title: "Customer Satisfaction & Response Time Analytics",
      description: "Implement tracking for customer satisfaction scores and critical response times to monitor and enhance service quality.",
      icon: Smile,
      status: "Planned"
    },
    {
      title: "Real-time Chat with Technicians",
      description: "Implement a direct messaging feature between dispatchers and technicians for quick communication and updates.",
      icon: MessageSquare,
      status: "Consideration"
    },
    {
      title: "Visual Route Optimization Comparison",
      description: "Display a mini-map preview showing the current vs. AI-optimized route in the \"Optimize Route\" dialog to build trust and provide clarity.",
      icon: Settings2,
      status: "Consideration"
    },
    {
      title: "Quantify Route Optimization Benefits",
      description: "Show estimated time and distance savings (e.g., \"Saves approx. 15 minutes & 3 miles\") when AI suggests an optimized route.",
      icon: CheckSquare,
      status: "Consideration"
    },
  ],
  hvacSpecific: [
    {
      title: "Smart Skill Matching for Technicians (HVAC/SHK)",
      description: "Enhance technician profiles with specific certifications (e.g., gas, oil, heat pumps, refrigeration, drinking water hygiene). AI job allocation will prioritize technicians with the necessary qualifications for each specific job, alongside proximity and availability.",
      icon: Wrench,
      status: "Planned"
    },
    {
      title: "Intelligent Parts & Van Stock Management (HVAC/SHK)",
      description: "Allow tracking of technician van stock or central warehouse inventory. AI will consider available parts when assigning repair jobs, prioritizing technicians likely to have needed standard parts on hand to reduce trips to wholesalers.",
      icon: Truck,
      status: "Planned"
    },
    {
      title: "Proactive Maintenance Scheduling & Equipment History (HVAC/SHK)",
      description: "Manage recurring maintenance contracts (heating, AC). The system will automatically suggest and help schedule these appointments. Provide access to equipment history (model, past repairs, service intervals) at job locations.",
      icon: History,
      status: "Planned"
    },
    {
      title: "Digital On-Site Protocols & Checklists (HVAC/SHK)",
      description: "Provide customizable digital forms for technicians to complete on-site (e.g., for maintenance, gas inspections, complex repairs). Include fields for measurements, photos, defect descriptions, and follow-up work. Store digitally and allow sending to customers.",
      icon: FileText,
      status: "Planned"
    },
    {
      title: "Emergency Dispatch with Resource Check (HVAC/SHK)",
      description: "Implement an \"Emergency\" function for dispatchers that triggers immediate route re-optimization, considering technician qualifications and the availability of specific emergency kits or parts.",
      icon: AlertOctagon,
      status: "Planned"
    },
    {
      title: "Basic Integrated CRM for Customer & Equipment Management",
      description: "Manage customer details, contact history, site-specific notes, and track installed HVAC equipment (model, serial, installation date, warranty, service history) directly within the app. Link equipment to jobs for better technician preparation and service tracking.",
      icon: ClipboardList,
      status: "Consideration"
    },
  ],
  futureVision: [
    {
      title: "Predictive Maintenance as a Service",
      description: "Analyze vehicle consumption data and machine data to predict maintenance needs and enable proactive service planning, minimizing downtime and extending equipment lifespan.",
      icon: Brain,
      status: "Vision"
    },
    {
      title: "Smart City Infrastructure Integration",
      description: "Explore deeper integration with urban data sources like construction site information, parking availability, or environmental zones to further refine route optimization and ensure compliance.",
      icon: Building2,
      status: "Vision"
    },
    {
      title: "AI-Powered Material Management & Inventory Optimization",
      description: "Extend AI to predict material requirements for jobs, optimizing warehousing and avoiding parts shortages in the field.",
      icon: Package,
      status: "Vision"
    },
    {
      title: "Augmented Reality (AR) for Technicians",
      description: "Utilize AR in the mobile app to support technicians on-site, e.g., through interactive instructions or by overlaying relevant device information.",
      icon: Glasses,
      status: "Vision"
    },
    {
      title: "Marketplace for Craft Service Orders",
      description: "Develop a platform enabling craft businesses to share or take on unassigned jobs within a trusted network, optimizing industry-wide utilization.",
      icon: ShoppingCart,
      status: "Vision"
    },
    {
      title: "Automated Invoicing and Report Creation",
      description: "Fully integrate job documentation into automated administrative processes to further reduce office workload.",
      icon: FileSpreadsheet,
      status: "Vision"
    },
    {
      title: "Machine Learning for Skills Development",
      description: "Analyze job data and technician performance to generate personalized further education recommendations for technicians, combating skills shortages through targeted qualification.",
      icon: GraduationCap,
      status: "Vision"
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

