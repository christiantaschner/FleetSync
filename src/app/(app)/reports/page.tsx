
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Technician } from "@/types";
import {
  BarChart,
  PieChart as PieChartIcon,
  CheckCircle,
  Clock,
  Briefcase,
  Users,
  Loader2,
  Timer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const pieChartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#FBBF24", // yellow-400
];

const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 0) return "N/A";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;
    
    return result.trim() || '0m';
}


export default function ReportsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    const jobsQuery = query(collection(db, "jobs"));
    const techniciansQuery = query(collection(db, "technicians"));

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      setJobs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Job)));
      setIsLoading(false);
    });

    const unsubscribeTechnicians = onSnapshot(techniciansQuery, (snapshot) => {
      setTechnicians(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician))
      );
    });

    return () => {
      unsubscribeJobs();
      unsubscribeTechnicians();
    };
  }, []);

  const reportData = useMemo(() => {
    if (jobs.length === 0) {
      return {
        kpis: {
          totalJobs: 0,
          completedJobs: 0,
          avgDuration: "N/A",
          avgTimeToAssign: "N/A",
        },
        jobsByStatus: [],
        jobsPerTechnician: [],
      };
    }

    const completedJobsWithTime = jobs.filter(
      (j) => j.status === "Completed" && j.completedAt && j.inProgressAt
    );

    const totalDurationMs = completedJobsWithTime.reduce((acc, j) => {
        const start = new Date(j.inProgressAt!).getTime();
        const end = new Date(j.completedAt!).getTime();
        return acc + (end - start);
    }, 0);
    
    const avgDurationMs =
      completedJobsWithTime.length > 0
        ? totalDurationMs / completedJobsWithTime.length
        : 0;
        
    const assignedJobsWithTime = jobs.filter(j => j.assignedAt && j.createdAt);

    const totalTimeToAssignMs = assignedJobsWithTime.reduce((acc, j) => {
        const created = new Date(j.createdAt).getTime();
        const assigned = new Date(j.assignedAt!).getTime();
        return acc + (assigned - created);
    }, 0);

    const avgTimeToAssignMs = 
        assignedJobsWithTime.length > 0
        ? totalTimeToAssignMs / assignedJobsWithTime.length
        : 0;


    const jobsByStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<Job["status"], number>);

    const pieData = Object.entries(jobsByStatus).map(([name, value]) => ({
      name,
      value,
      fill: `var(--color-${name.toLowerCase().replace(" ", "")})`,
    }));

    const jobsPerTechnician = technicians.map((tech) => ({
      name: tech.name,
      completed: jobs.filter(
        (j) => j.assignedTechnicianId === tech.id && j.status === "Completed"
      ).length,
    }));

    return {
      kpis: {
        totalJobs: jobs.length,
        completedJobs: completedJobsWithTime.length,
        avgDuration: formatDuration(avgDurationMs),
        avgTimeToAssign: formatDuration(avgTimeToAssignMs),
      },
      jobsByStatus: pieData,
      jobsPerTechnician: jobsPerTechnician.filter(t => t.completed > 0),
    };
  }, [jobs, technicians]);

  const jobsByStatusChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    reportData.jobsByStatus.forEach((item) => {
      config[item.name.toLowerCase().replace(" ", "")] = {
        label: item.name,
      };
    });
    return config;
  }, [reportData.jobsByStatus]);

  const jobsPerTechnicianChartConfig = {
      completed: {
        label: "Completed Jobs",
      },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            Reporting & Analytics
          </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.completedJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Assign</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.avgTimeToAssign}</div>
            <p className="text-xs text-muted-foreground">From creation to assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. On-Site Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.avgDuration}</div>
            <p className="text-xs text-muted-foreground">From start to completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <PieChartIcon /> Jobs by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.jobsByStatus.length > 0 ? (
            <ChartContainer config={jobsByStatusChartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie
                    data={reportData.jobsByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs font-bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {reportData.jobsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            ) : (
                <p className="text-muted-foreground text-center py-10">No job data available for this chart.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <BarChart /> Completed Jobs per Technician
            </CardTitle>
          </CardHeader>
          <CardContent>
             {reportData.jobsPerTechnician.length > 0 ? (
            <ChartContainer config={jobsPerTechnicianChartConfig} className="min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.jobsPerTechnician}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            className="text-xs"
                        />
                         <YAxis allowDecimals={false} />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={4} />
                    </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
             ) : (
                <p className="text-muted-foreground text-center py-10">No completed jobs to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
