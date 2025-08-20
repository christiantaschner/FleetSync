
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Technician, SummarizeFtfrOutput } from "@/types";
import {
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
  Route,
  Coffee,
  Info,
  Bot,
  BarChart,
  Waypoints,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { summarizeFtfrAction } from "@/actions/ai-actions";
import { mockJobs, mockTechnicians } from "@/lib/mock-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 0 || isNaN(milliseconds)) return "0m";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;
    
    return result.trim() || '0m';
}

const KpiCard = ({ title, value, desc, icon: Icon, tooltipText }: { title: string; value: string | number; desc: string; icon: React.ElementType, tooltipText: string }) => {
    return (
        <Card>
            <CardHeader className="pb-2">
                 <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{title}</CardDescription>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end" className="max-w-xs">
                                <p>{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </CardContent>
        </Card>
    );
};


export default function ReportClientView() {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("all");
  
  const [ftfrSummary, setFtfrSummary] = useState<SummarizeFtfrOutput | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        setJobs(mockJobs);
        setTechnicians(mockTechnicians);
        setIsLoading(false);
        return;
    }

    if (!db || !userProfile?.companyId) {
      setIsLoading(false);
      return;
    }
    
    const companyId = userProfile.companyId;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!appId) {
      setIsLoading(false);
      return;
    }

    const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId));
    const techniciansQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", companyId));

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => {
        const data = doc.data();
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
  }, [authLoading, userProfile]);

  const dateFilteredJobs = useMemo(() => {
    return jobs.filter(job => {
        if (!date || !date.from) return true;
        const jobDate = new Date(job.createdAt);
        const fromDate = date.from;
        const toDate = date.to ? new Date(new Date(date.to).setHours(23, 59, 59, 999)) : new Date();
        return jobDate >= fromDate && jobDate <= toDate;
    });
  }, [jobs, date]);

  const filteredJobs = useMemo(() => {
    if (selectedTechnicianId === 'all') return dateFilteredJobs;
    return dateFilteredJobs.filter(job => job.assignedTechnicianId === selectedTechnicianId);
  }, [dateFilteredJobs, selectedTechnicianId]);

  const ftfrFeedbackNotesCount = useMemo(() => {
    return filteredJobs.filter(job => 
        job.isFirstTimeFix === false && job.reasonForFollowUp && job.reasonForFollowUp.trim() !== ''
    ).length;
  }, [filteredJobs]);

  useEffect(() => {
    setFtfrSummary(null);
  }, [date, selectedTechnicianId]);

  const handleSummarizeFtfr = async () => {
    setIsSummarizing(true);
    setFtfrSummary(null);
    const result = await summarizeFtfrAction({ jobs: filteredJobs });
    if (result.error) {
        toast({ title: "Summarization Failed", description: result.error, variant: "destructive" });
    } else {
        setFtfrSummary(result.data);
    }
    setIsSummarizing(false);
  };

  const reportData = useMemo(() => {
    const completedJobs = filteredJobs.filter(j => j.status === "Completed");

    // KPI Calculations
    const completedJobsWithTime = completedJobs.filter(j => j.completedAt && j.inProgressAt);
    const totalDurationMs = completedJobsWithTime.reduce((acc, j) => {
        const start = new Date(j.inProgressAt!).getTime();
        const end = new Date(j.completedAt!).getTime();
        const grossDuration = end - start;
        const breakDuration = j.breaks?.reduce((breakAcc, breakItem) => {
            if (breakItem.start && breakItem.end) return breakAcc + (new Date(breakItem.end).getTime() - new Date(breakItem.start).getTime());
            return breakAcc;
        }, 0) || 0;
        return acc + (grossDuration - breakDuration);
    }, 0);
    const avgDurationMs = completedJobsWithTime.length > 0 ? totalDurationMs / completedJobsWithTime.length : 0;
        
    const assignedJobsWithTime = filteredJobs.filter(j => j.assignedAt && j.createdAt);
    const totalTimeToAssignMs = assignedJobsWithTime.reduce((acc, j) => {
        const created = new Date(j.createdAt).getTime();
        const assigned = new Date(j.assignedAt!).getTime();
        return acc + (assigned - created);
    }, 0);
    const avgTimeToAssignMs = assignedJobsWithTime.length > 0 ? totalTimeToAssignMs / assignedJobsWithTime.length : 0;
    
    const jobsWithSatisfaction = completedJobs.filter(j => typeof j.customerSatisfactionScore === 'number');
    const totalSatisfactionScore = jobsWithSatisfaction.reduce((acc, j) => acc + j.customerSatisfactionScore!, 0);
    const avgSatisfaction = jobsWithSatisfaction.length > 0 ? (totalSatisfactionScore / jobsWithSatisfaction.length).toFixed(2) : "0.00";
    
    const ftfrJobs = completedJobs.filter(j => typeof j.isFirstTimeFix === 'boolean');
    const firstTimeFixes = ftfrJobs.filter(j => j.isFirstTimeFix).length;
    const ftfrPercentage = ftfrJobs.length > 0 ? ((firstTimeFixes / ftfrJobs.length) * 100).toFixed(1) : "0";

    const jobsWithPunctualityData = completedJobs.filter(j => j.scheduledTime && j.inProgressAt);
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
    const onTimeArrivalRate = totalPunctualityJobs > 0 ? (((punctuality.early + punctuality.onTime) / totalPunctualityJobs) * 100).toFixed(1) : "0";
    
    const totalEmissions = completedJobs.reduce((acc, j) => acc + (j.co2EmissionsKg || 0), 0);
    
    const totalTravelDistance = completedJobs.reduce((acc, j) => acc + (j.travelDistanceKm || 0), 0);

    const jobsWithTravelTime = completedJobs.filter(j => j.enRouteAt && j.inProgressAt);
    const totalTravelTimeMs = jobsWithTravelTime.reduce((acc, j) => {
        const start = new Date(j.enRouteAt!).getTime();
        const end = new Date(j.inProgressAt!).getTime();
        return acc + (end - start);
    }, 0);
    const avgTravelTimeMs = jobsWithTravelTime.length > 0 ? totalTravelTimeMs / jobsWithTravelTime.length : 0;

    const jobsWithBreaks = completedJobs.filter(j => j.breaks && j.breaks.length > 0);
    const totalBreakTimeMs = jobsWithBreaks.reduce((acc, j) => {
        return acc + (j.breaks?.reduce((breakAcc, breakItem) => {
            if (breakItem.start && breakItem.end) return breakAcc + (new Date(breakItem.end).getTime() - new Date(breakItem.start).getTime());
            return breakAcc;
        }, 0) || 0);
    }, 0);
    const avgBreakTimeMs = jobsWithBreaks.length > 0 ? totalBreakTimeMs / jobsWithBreaks.length : 0;

    const assignedTechnicianIds = new Set(completedJobs.map(j => j.assignedTechnicianId).filter(Boolean));
    const technicianCountInPeriod = assignedTechnicianIds.size;
    const avgJobsPerTech = technicianCountInPeriod > 0 ? (completedJobs.length / technicianCountInPeriod).toFixed(1) : "0.0";

    return {
      kpis: {
        totalJobs: filteredJobs.length,
        completedJobs: completedJobs.length,
        avgDuration: formatDuration(avgDurationMs),
        avgTimeToAssign: formatDuration(avgTimeToAssignMs),
        avgSatisfaction: avgSatisfaction,
        ftfr: ftfrPercentage,
        onTimeArrivalRate: onTimeArrivalRate,
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        totalTravelDistance: parseFloat(totalTravelDistance.toFixed(2)),
        avgTravelTime: formatDuration(avgTravelTimeMs),
        avgBreakTime: formatDuration(avgBreakTimeMs),
        avgJobsPerTech,
      },
    };
  }, [filteredJobs]);

  if (authLoading || isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Reporting & Analytics</h1>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                    <SelectTrigger className="w-full sm:w-[220px] bg-card"><SelectValue placeholder="Filter by Technician" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all"><div className="flex items-center gap-2"><Users className="h-4 w-4" /> All Technicians</div></SelectItem>
                        {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}><div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={tech.avatarUrl} alt={tech.name} /><AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>{tech.name}</div></SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <DateRangePicker date={date} setDate={setDate} className="bg-card" />
            </div>
        </CardContent>
      </Card>


       <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Waypoints /> Overall Performance</CardTitle>
                    <CardDescription>A high-level overview of operational volume and success rates in the selected period.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Total Jobs" value={reportData.kpis.totalJobs} desc="All jobs in period" icon={Briefcase} tooltipText="Total count of all jobs (completed, pending, etc.) created within the date range. A key indicator of business volume." />
                    <KpiCard title="Completed Jobs" value={reportData.kpis.completedJobs} desc="Successfully finished" icon={CheckCircle} tooltipText="Count of jobs marked 'Completed'. Comparing this to 'Total Jobs' gives a rough idea of your completion rate." />
                    <KpiCard title="First-Time-Fix Rate" value={`${reportData.kpis.ftfr}%`} desc="Resolved in one visit" icon={ThumbsUp} tooltipText="The percentage of jobs resolved in a single visit without needing a follow-up. Use the AI Summary to diagnose reasons for low rates." />
                    <KpiCard title="On-Time Arrival Rate" value={`${reportData.kpis.onTimeArrivalRate}%`} desc="Within 15min of schedule" icon={CalendarClock} tooltipText="Percentage of jobs where technicians arrived within a 15-minute window of the scheduled time. Low rates impact customer satisfaction." />
                </CardContent>
                 {ftfrFeedbackNotesCount > 0 && (
                    <CardFooter className="flex-col items-start gap-2 pt-3 border-t">
                      {ftfrSummary && !isSummarizing && (
                          <div className="space-y-2 text-sm">
                              <h4 className="font-semibold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> AI Summary for Failed First-Time Fixes</h4>
                              <p className="text-muted-foreground">{ftfrSummary.summary}</p>
                              <div className="flex flex-wrap gap-1">
                                  {ftfrSummary.themes.map(theme => <Badge key={theme} variant="secondary">{theme}</Badge>)}
                              </div>
                          </div>
                      )}
                      <Button onClick={handleSummarizeFtfr} disabled={isSummarizing} size="sm" variant="outline">
                        {isSummarizing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="mr-2 h-4 w-4" />
                        )}
                        Summarize Feedback ({ftfrFeedbackNotesCount})
                      </Button>
                    </CardFooter>
                  )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BarChart /> Technician Efficiency</CardTitle>
                    <CardDescription>Metrics focused on how effectively your team spends their time.</CardDescription>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Avg. On-Site Duration" value={reportData.kpis.avgDuration} desc="From start to completion" icon={Clock} tooltipText="The average time a technician spends actively working on a job, excluding travel and breaks." />
                    <KpiCard title="Avg. Travel Time" value={reportData.kpis.avgTravelTime} desc="Per job" icon={Route} tooltipText="Average time spent driving to jobs. Use route optimization to reduce this non-billable time." />
                    <KpiCard title="Avg. Time to Assign" value={reportData.kpis.avgTimeToAssign} desc="Dispatcher response time" icon={Timer} tooltipText="The average time a new job waits before being assigned. Use 'AI Batch Assign' to improve this." />
                    <KpiCard title="Avg. Jobs per Technician" value={reportData.kpis.avgJobsPerTech} desc="Completed in period" icon={Users} tooltipText="The average number of jobs each technician completes. Helps in balancing workload." />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Smile /> Customer Experience</CardTitle>
                    <CardDescription>Key indicators of customer satisfaction and service quality.</CardDescription>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Avg. Satisfaction" value={`${reportData.kpis.avgSatisfaction} / 5`} desc="From all rated jobs" icon={Smile} tooltipText="The average customer satisfaction rating (1-5 stars) collected after job completion." />
                    <KpiCard title="Avg. Break Time" value={reportData.kpis.avgBreakTime} desc="Per job with breaks" icon={Coffee} tooltipText="The average time technicians log for breaks during a job." />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Leaf /> Environmental Impact</CardTitle>
                    <CardDescription>Estimates based on fleet travel data.</CardDescription>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Total Travel Distance" value={`${reportData.kpis.totalTravelDistance} km`} desc="All completed jobs" icon={Route} tooltipText="Sum of the estimated distance driven for all completed jobs. Better routing reduces this." />
                    <KpiCard title="Total CO₂ Emissions" value={`${reportData.kpis.totalEmissions} kg`} desc="Estimated from travel" icon={Leaf} tooltipText="Estimated carbon footprint based on travel and your company's emission factor setting." />
                </CardContent>
            </Card>
       </div>
    </div>
  )
}
