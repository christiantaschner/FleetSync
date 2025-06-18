
"use client";
import React from 'react';
import { BarChart3, Clock, Users, Route, Fuel } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from './components/kpi-card';
import SampleCharts from './components/sample-charts';

export default function ReportsPage() {
  // Mock KPI data
  const kpiData = {
    avgTravelTime: "35 mins",
    technicianUtilization: "78%",
    jobsCompletedToday: 12,
    fuelConsumptionTrend: "-5%", // Negative indicates reduction
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Reporting &amp; Analytics</h1>
      </div>

      <section aria-labelledby="kpi-overview">
        <h2 id="kpi-overview" className="text-xl font-semibold mb-4 font-headline">Key Performance Indicators</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Avg. Travel Time" value={kpiData.avgTravelTime} icon={Clock} description="Per job this month" />
          <KpiCard title="Technician Utilization" value={kpiData.technicianUtilization} icon={Users} description="Active vs. Idle time" />
          <KpiCard title="Jobs Completed Today" value={kpiData.jobsCompletedToday.toString()} icon={BarChart3} description="Across all technicians" />
          <KpiCard title="Fuel Efficiency" value={kpiData.fuelConsumptionTrend} icon={Fuel} description="Change from last month" positiveIsGood={kpiData.fuelConsumptionTrend.startsWith('-')} />
        </div>
      </section>

      <section aria-labelledby="detailed-charts">
         <h2 id="detailed-charts" className="text-xl font-semibold mb-4 mt-8 font-headline">Detailed Visualizations</h2>
         <SampleCharts />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Generate Custom Report</CardTitle>
          <CardDescription>
            Select parameters to generate a detailed report. (Feature placeholder)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Custom report generation interface will be here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
