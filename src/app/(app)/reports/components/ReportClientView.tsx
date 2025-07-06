
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
import { summarizeFtfrAction } from "@/actions/report-actions";

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

  const kpiCards = [
    {
      title: "Total Jobs",
      value: reportData.kpis.totalJobs,
      desc: "In selected period",
      icon: Briefcase,
      tooltip: {
        desc: "A count of all jobs created within the selected date range, regardless of their status.",
        action: "This is an informational metric. Trends can indicate business growth or seasonality."
      }
    },
    {
      title: "Completed Jobs",
      value: reportData.kpis.completedJobs,
      desc: "In selected period",
      icon: CheckCircle,
      tooltip: {
        desc: "A count of all jobs marked as 'Completed' within the date range.",
        action: "Comparing this to 'Total Jobs' gives a rough idea of your completion rate."
      }
    },
    {
      title: "On-Time Arrival Rate",
      value: `${reportData.kpis.onTimeArrivalRate}%`,
      desc: "Within 15min of schedule",
      icon: CalendarClock,
      tooltip: {
        desc: "Measures the percentage of jobs where the technician arrived within 15 minutes of the scheduled time. High rates lead to better customer satisfaction.",
        action: "If this rate is low, use the 'Find Schedule Risks' feature on the Schedule page to proactively identify and address potential delays before they happen."
      }
    },
    {
      title: "Avg. On-Site Duration",
      value: reportData.kpis.avgDuration,
      desc: "From start to completion",
      icon: Clock,
      tooltip: {
        desc: "The average time a technician spends actively working on a job, excluding travel and breaks.",
        action: "Consistently high durations for specific job types may indicate a need for better training or more accurate initial time estimates."
      }
    },
    {
      title: "Avg. Time to Assign",
      value: reportData.kpis.avgTimeToAssign,
      desc: "From creation to assignment",
      icon: Timer,
      tooltip: {
        desc: "The average time a new job waits before being assigned to a technician. A direct measure of dispatcher responsiveness.",
        action: "If this number is high, use the 'AI Batch Assign' feature on the Dashboard to quickly clear the pending queue."
      }
    },
    {
      title: "Avg. Travel Time",
      value: reportData.kpis.avgTravelTime,
      desc: "Per job, from en route to start",
      icon: Route,
      tooltip: {
        desc: "The average time a technician spends driving to a job site. This is non-billable time that impacts efficiency.",
        action: "A high average travel time is a strong indicator to use the 'Re-Optimize Route' feature more frequently, especially when schedules change."
      }
    },
    {
      title: "Avg. Satisfaction",
      value: `${reportData.kpis.avgSatisfaction} / 5`,
      desc: "Across all rated jobs",
      icon: Smile,
      tooltip: {
        desc: "The average customer satisfaction rating (1-5 stars) collected by technicians after job completion.",
        action: "Low scores for a particular technician or job type can highlight areas for customer service training or process improvement."
      }
    },
    {
      title: "First-Time-Fix Rate",
      value: `${reportData.kpis.ftfr}%`,
      desc: "Of jobs resolved in one visit",
      icon: ThumbsUp,
      tooltip: {
        desc: "The percentage of jobs resolved in a single visit without needing a follow-up. A critical efficiency metric.",
        action: "If low, check the technicians' 'Reason for Follow-up' notes. This often reveals needs for specific skills training or better initial parts allocation."
      }
    },
    {
      title: "Avg. Jobs per Technician",
      value: reportData.kpis.avgJobsPerTech,
      desc: "Completed in period",
      icon: Users,
      tooltip: {
        desc: "The average number of jobs each technician completes. Helps in balancing workload and identifying high-performers.",
        action: "Filter the report by technician to dive deeper into individual performance."
      }
    },
     {
      title: "Avg. Break Time",
      value: reportData.kpis.avgBreakTime,
      desc: "Per job with breaks logged",
      icon: Coffee,
      tooltip: {
        desc: "The average time technicians take for breaks during a job.",
        action: "Monitoring this helps ensure accurate job costing and schedule planning."
      }
    },
     {
      title: "Total Travel Distance",
      value: `${reportData.kpis.totalTravelDistance} km`,
      desc: "Across all completed jobs",
      icon: Route,
      tooltip: {
        desc: "The sum of the estimated distance driven for all completed jobs in the selected period.",
        action: "High travel distances suggest opportunities for better geographical batching of jobs or route optimization to increase efficiency."
      }
    },
    {
      title: "Total CO2 Emissions",
      value: `${reportData.kpis.totalEmissions} kg`,
      desc: "Est. from travel distance",
      icon: Leaf,
      tooltip: {
        desc: "An estimate of the fleet's carbon footprint based on total travel distance and the emission factor set in your company settings.",
        action: "Reducing travel time through route optimization directly lowers this value, saving fuel costs and improving your company's environmental impact."
      }
    },
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">Reporting & Analytics</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Filter by Technician" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all"><div className="flex items-center gap-2"><Users className="h-4 w-4" /> All Technicians</div></SelectItem>
                    {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}><div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={tech.avatarUrl} alt={tech.name} /><AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>{tech.name}</div></SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DateRangePicker date={date} setDate={setDate} />
          </div>
      </div>

       <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map(kpi => (
              <Dialog key={kpi.title}>
                <Card className="flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 -mt-1 -mr-2 text-muted-foreground hover:bg-secondary">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">More Info</span>
                        </Button>
                    </DialogTrigger>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground">{kpi.desc}</p>
                  </CardContent>
                  {kpi.title === "First-Time-Fix Rate" && (
                    <CardFooter className="flex-col items-start gap-2 pt-3 border-t">
                      {ftfrSummary && !isSummarizing && (
                          <div className="space-y-2 text-xs">
                              <h4 className="font-semibold text-sm flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> AI Summary</h4>
                              <p className="text-muted-foreground">{ftfrSummary.summary}</p>
                              <div className="flex flex-wrap gap-1">
                                  {ftfrSummary.themes.map(theme => <Badge key={theme} variant="secondary">{theme}</Badge>)}
                              </div>
                          </div>
                      )}
                      <Button onClick={handleSummarizeFtfr} disabled={isSummarizing || ftfrFeedbackNotesCount === 0} className="w-full mt-auto" size="sm" variant="outline">
                        {isSummarizing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Summarize Feedback ({ftfrFeedbackNotesCount})
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg">
                        <kpi.icon className="h-5 w-5 text-primary" />
                        {kpi.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <h4 className="font-semibold text-base">What it means</h4>
                            <p className="text-sm text-muted-foreground">{kpi.tooltip.desc}</p>
                        </div>
                         <div className="p-3 bg-secondary/50 rounded-md border border-primary/20">
                            <h4 className="font-semibold text-base text-primary">Actionable Insight</h4>
                            <p className="text-sm text-muted-foreground">{kpi.tooltip.action}</p>
                        </div>
                    </div>
                </DialogContent>
              </Dialog>
            ))}
        </div>
    </div>
  );
}
