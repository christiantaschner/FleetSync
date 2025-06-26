
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Technician } from "@/types";
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  CheckCircle,
  Clock,
  Briefcase,
  Users,
  Loader2,
  Timer,
  Smile,
  ThumbsUp,
  CalendarClock,
  User,
  Leaf,
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

import { BarChart } from 'recharts/lib/chart/BarChart';
import { PieChart } from 'recharts/lib/chart/PieChart';
import { Bar } from 'recharts/lib/cartesian/Bar';
import { XAxis } from 'recharts/lib/cartesian/XAxis';
import { YAxis } from 'recharts/lib/cartesian/YAxis';
import { CartesianGrid } from 'recharts/lib/cartesian/CartesianGrid';
import { Pie } from 'recharts/lib/polar/Pie';
import { Cell } from 'recharts/lib/component/Cell';


const pieChartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#FBBF24", // yellow-400
];

const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 0 || isNaN(milliseconds)) return "N/A";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;
    
    return result.trim() || '0m';
}


export default function ReportClientView() {
  const { userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("all");

  useEffect(() => {
    if (!db || !userProfile?.companyId) {
      setIsLoading(false);
      return;
    }
    
    const companyId = userProfile.companyId;

    const jobsQuery = query(collection(db, "jobs"), where("companyId", "==", companyId));
    const techniciansQuery = query(collection(db, "technicians"), where("companyId", "==", companyId));

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert any Firebase Timestamp fields to ISO strings to make them serializable
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
            }
        }
        return { id: doc.id, ...data } as Job;
      });
      setJobs(jobsData);
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
  }, [userProfile]);

  const reportData = useMemo(() => {
    // First, filter by date range
    const dateFilteredJobs = jobs.filter(job => {
        if (!date || !date.from) return true;
        const jobDate = new Date(job.createdAt);
        const fromDate = date.from;
        const toDate = date.to ? new Date(new Date(date.to).setHours(23, 59, 59, 999)) : new Date();
        return jobDate >= fromDate && jobDate <= toDate;
    });

    // Then, filter by technician if one is selected
    const filteredJobs = selectedTechnicianId === 'all' 
        ? dateFilteredJobs 
        : dateFilteredJobs.filter(job => job.assignedTechnicianId === selectedTechnicianId);


    if (filteredJobs.length === 0) {
      return {
        kpis: {
          totalJobs: 0,
          completedJobs: 0,
          avgDuration: "N/A",
          avgTimeToAssign: "N/A",
          avgSatisfaction: "N/A",
          ftfr: "N/A",
          onTimeArrivalRate: "N/A",
          avgEstimateAccuracy: 0,
          totalEmissions: 0,
        },
        jobsByStatus: [],
        jobsPerTechnician: [],
        punctualityChartData: [],
        durationComparisonChartData: [],
        emissionsPerTechnician: [],
      };
    }

    const completedJobs = filteredJobs.filter(j => j.status === "Completed");

    // --- KPI Calculations ---
    const completedJobsWithTime = completedJobs.filter(
      (j) => j.completedAt && j.inProgressAt
    );

    const totalDurationMs = completedJobsWithTime.reduce((acc, j) => {
        const start = new Date(j.inProgressAt!).getTime();
        const end = new Date(j.completedAt!).getTime();
        const grossDuration = end - start;

        const breakDuration = j.breaks?.reduce((breakAcc, breakItem) => {
            if (breakItem.start && breakItem.end) {
                return breakAcc + (new Date(breakItem.end).getTime() - new Date(breakItem.start).getTime());
            }
            return breakAcc;
        }, 0) || 0;

        return acc + (grossDuration - breakDuration);
    }, 0);
    
    const avgDurationMs =
      completedJobsWithTime.length > 0
        ? totalDurationMs / completedJobsWithTime.length
        : 0;
        
    const assignedJobsWithTime = filteredJobs.filter(j => j.assignedAt && j.createdAt);

    const totalTimeToAssignMs = assignedJobsWithTime.reduce((acc, j) => {
        const created = new Date(j.createdAt).getTime();
        const assigned = new Date(j.assignedAt!).getTime();
        return acc + (assigned - created);
    }, 0);

    const avgTimeToAssignMs = 
        assignedJobsWithTime.length > 0
        ? totalTimeToAssignMs / assignedJobsWithTime.length
        : 0;
    
    const jobsWithSatisfaction = completedJobs.filter(j => typeof j.customerSatisfactionScore === 'number');
    const totalSatisfactionScore = jobsWithSatisfaction.reduce((acc, j) => acc + j.customerSatisfactionScore!, 0);
    const avgSatisfaction = jobsWithSatisfaction.length > 0 
        ? (totalSatisfactionScore / jobsWithSatisfaction.length).toFixed(2)
        : "N/A";
    
    const ftfrJobs = completedJobs.filter(j => typeof j.isFirstTimeFix === 'boolean');
    const firstTimeFixes = ftfrJobs.filter(j => j.isFirstTimeFix).length;
    const ftfrPercentage = ftfrJobs.length > 0 ? ((firstTimeFixes / ftfrJobs.length) * 100).toFixed(1) : "N/A";

    const jobsWithPunctualityData = completedJobs.filter(
      (j) => j.scheduledTime && j.inProgressAt
    );
    
    const punctuality = { early: 0, onTime: 0, late: 0 };
    jobsWithPunctualityData.forEach(j => {
        const scheduled = new Date(j.scheduledTime!).getTime();
        const arrived = new Date(j.inProgressAt!).getTime();
        const diffMinutes = (arrived - scheduled) / (1000 * 60);

        if (diffMinutes < -15) punctuality.early++;
        else if (diffMinutes > 15) punctuality.late++;
        else punctuality.onTime++;
    });

    const totalPunctualityJobs = jobsWithPunctualityData.length;
    const onTimeArrivalRate = totalPunctualityJobs > 0 
        ? (((punctuality.early + punctuality.onTime) / totalPunctualityJobs) * 100).toFixed(1) 
        : "N/A";
    
    const completedJobsWithDuration = completedJobs.filter(
        j => j.inProgressAt && j.completedAt && j.estimatedDurationMinutes && j.estimatedDurationMinutes > 0
    );

    const totalDeviation = completedJobsWithDuration.reduce((acc, j) => {
        const actualDurationMs = new Date(j.completedAt!).getTime() - new Date(j.inProgressAt!).getTime();
        const actualDurationMinutes = Math.round(actualDurationMs / 60000);
        const deviation = Math.abs(actualDurationMinutes - j.estimatedDurationMinutes!);
        return acc + deviation;
    }, 0);

    const avgEstimateAccuracy = completedJobsWithDuration.length > 0 
        ? Math.round(totalDeviation / completedJobsWithDuration.length)
        : 0;
    
    const totalEmissions = completedJobs.reduce((acc, j) => acc + (j.co2EmissionsKg || 0), 0);

    // --- Chart Data ---
    const jobsByStatus = filteredJobs.reduce((acc, job) => {
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
      completed: completedJobs.filter(
        (j) => j.assignedTechnicianId === tech.id
      ).length,
    }));
    
    const punctualityChartData = [
        { name: 'Early', value: punctuality.early, fill: 'hsl(var(--chart-2))' },
        { name: 'On Time', value: punctuality.onTime, fill: 'hsl(var(--chart-1))' },
        { name: 'Late', value: punctuality.late, fill: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);
    
    const durationComparisonChartData = completedJobsWithDuration.map(j => {
        const actualDurationMs = new Date(j.completedAt!).getTime() - new Date(j.inProgressAt!).getTime();
        const actualDurationMinutes = Math.round(actualDurationMs / 60000);
        return {
            name: j.title.length > 20 ? j.title.substring(0, 17) + '...' : j.title,
            estimated: j.estimatedDurationMinutes,
            actual: actualDurationMinutes,
        };
    }).slice(-10); // Last 10 completed jobs

    const emissionsPerTechnician = technicians.map(tech => {
        const techJobs = completedJobs.filter(j => j.assignedTechnicianId === tech.id);
        const totalTechEmissions = techJobs.reduce((acc, j) => acc + (j.co2EmissionsKg || 0), 0);
        return {
            name: tech.name,
            emissions: parseFloat(totalTechEmissions.toFixed(2)),
        };
    });


    return {
      kpis: {
        totalJobs: filteredJobs.length,
        completedJobs: completedJobs.length,
        avgDuration: formatDuration(avgDurationMs),
        avgTimeToAssign: formatDuration(avgTimeToAssignMs),
        avgSatisfaction: avgSatisfaction,
        ftfr: ftfrPercentage,
        onTimeArrivalRate: onTimeArrivalRate,
        avgEstimateAccuracy: avgEstimateAccuracy,
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      },
      jobsByStatus: pieData,
      jobsPerTechnician: jobsPerTechnician.filter(t => t.completed > 0),
      punctualityChartData: punctualityChartData,
      durationComparisonChartData: durationComparisonChartData,
      emissionsPerTechnician: emissionsPerTechnician.filter(t => t.emissions > 0),
    };
  }, [jobs, technicians, date, selectedTechnicianId]);

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
        color: "hsl(var(--chart-1))",
      },
  } satisfies ChartConfig;

  const punctualityChartConfig = {
    'Early': { label: 'Early' },
    'On Time': { label: 'On Time' },
    'Late': { label: 'Late' },
  } satisfies ChartConfig;
  
  const durationComparisonChartConfig = {
      estimated: {
        label: "Estimated",
        color: "hsl(var(--chart-2))",
      },
      actual: {
        label: "Actual",
        color: "hsl(var(--chart-1))",
      },
  } satisfies ChartConfig;

  const emissionsChartConfig = {
      emissions: {
        label: "CO2 Emissions (kg)",
        color: "hsl(var(--chart-2))",
      },
  } satisfies ChartConfig;


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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filter by Technician" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                           <Users className="h-4 w-4" /> All Technicians
                        </div>
                    </SelectItem>
                    {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>
                             <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                                    <AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                {tech.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DateRangePicker date={date} setDate={setDate} />
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.totalJobs}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.completedJobs}</div>
             <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Arrival Rate</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.onTimeArrivalRate}%</div>
            <p className="text-xs text-muted-foreground">Within 15min of schedule</p>
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
            <CardTitle className="text-sm font-medium">Avg. Satisfaction</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.avgSatisfaction} / 5</div>
            <p className="text-xs text-muted-foreground">Across all rated jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First-Time-Fix Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.ftfr}%</div>
            <p className="text-xs text-muted-foreground">Of jobs resolved in one visit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CO2 Emissions</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.totalEmissions} kg</div>
            <p className="text-xs text-muted-foreground">Est. from travel distance</p>
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
            </ChartContainer>
            ) : (
                <p className="text-muted-foreground text-center py-10">No job data available for this chart.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <BarChartIcon /> Completed Jobs per Technician
            </CardTitle>
             <CardDescription>This chart shows all technicians, regardless of the filter above.</CardDescription>
          </CardHeader>
          <CardContent>
             {reportData.jobsPerTechnician.length > 0 ? (
            <ChartContainer config={jobsPerTechnicianChartConfig} className="min-h-[300px] w-full">
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
            </ChartContainer>
             ) : (
                <p className="text-muted-foreground text-center py-10">No completed jobs to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                <PieChartIcon /> Arrival Punctuality
                </CardTitle>
                <CardDescription>Breakdown of on-time, early, and late arrivals for scheduled jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                {reportData.punctualityChartData.length > 0 ? (
                <ChartContainer config={punctualityChartConfig} className="min-h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie
                      data={reportData.punctualityChartData}
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
                      {reportData.punctualityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
                </ChartContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-10">No punctuality data available for this chart.</p>
                )}
            </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <BarChartIcon /> CO2 Emissions by Technician
                    </CardTitle>
                    <CardDescription>Estimated CO2 emissions (in kg) from travel. This chart shows all technicians, regardless of the filter above.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reportData.emissionsPerTechnician.length > 0 ? (
                    <ChartContainer config={emissionsChartConfig} className="min-h-[300px] w-full">
                        <BarChart data={reportData.emissionsPerTechnician}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="text-xs"
                            />
                            <YAxis unit=" kg" />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="emissions" fill="hsl(var(--chart-2))" radius={4} />
                        </BarChart>
                    </ChartContainer>
                    ) : (
                        <p className="text-muted-foreground text-center py-10">No emissions data available to display.</p>
                    )}
                </CardContent>
            </Card>
      </div>
    </div>
  );
}
