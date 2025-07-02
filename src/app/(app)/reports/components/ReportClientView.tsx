
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Technician } from "@/types";
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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

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
    const dateFilteredJobs = jobs.filter(job => {
        if (!date || !date.from) return true;
        const jobDate = new Date(job.createdAt);
        const fromDate = date.from;
        const toDate = date.to ? new Date(new Date(date.to).setHours(23, 59, 59, 999)) : new Date();
        return jobDate >= fromDate && jobDate <= toDate;
    });

    const filteredJobs = selectedTechnicianId === 'all' 
        ? dateFilteredJobs 
        : dateFilteredJobs.filter(job => job.assignedTechnicianId === selectedTechnicianId);

    const technicianSummary = selectedTechnicianId !== 'all' 
        ? technicians.find(t => t.id === selectedTechnicianId) 
        : null;

    if (dateFilteredJobs.length === 0) { // Base check on date-filtered, not fully-filtered
      return {
        kpis: { totalJobs: 0, completedJobs: 0, avgDuration: "N/A", avgTimeToAssign: "N/A", avgSatisfaction: "N/A", ftfr: "N/A", onTimeArrivalRate: "N/A", totalEmissions: 0 },
        technicianSummary: technicianSummary ? { ...technicianSummary, completedJobs: 0, avgDuration: "N/A", ftfr: "N/A" } : null,
      };
    }
    
    // Calculate KPIs on the potentially filtered job list
    const completedJobs = filteredJobs.filter(j => j.status === "Completed");

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
    const avgSatisfaction = jobsWithSatisfaction.length > 0 ? (totalSatisfactionScore / jobsWithSatisfaction.length).toFixed(2) : "N/A";
    
    const ftfrJobs = completedJobs.filter(j => typeof j.isFirstTimeFix === 'boolean');
    const firstTimeFixes = ftfrJobs.filter(j => j.isFirstTimeFix).length;
    const ftfrPercentage = ftfrJobs.length > 0 ? ((firstTimeFixes / ftfrJobs.length) * 100).toFixed(1) : "N/A";

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
    const onTimeArrivalRate = totalPunctualityJobs > 0 ? (((punctuality.early + punctuality.onTime) / totalPunctualityJobs) * 100).toFixed(1) : "N/A";
    
    const totalEmissions = completedJobs.reduce((acc, j) => acc + (j.co2EmissionsKg || 0), 0);

    const technicianSummaryData = technicianSummary ? {
        ...technicianSummary,
        completedJobs: completedJobs.length,
        avgDuration: formatDuration(avgDurationMs),
        ftfr: ftfrPercentage,
    } : null;

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
      },
      technicianSummary: technicianSummaryData,
    };
  }, [jobs, technicians, date, selectedTechnicianId]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

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

      {reportData.technicianSummary && (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center gap-4">
                 <Avatar className="h-16 w-16 border-2 border-primary/50">
                    <AvatarImage src={reportData.technicianSummary.avatarUrl} alt={reportData.technicianSummary.name} />
                    <AvatarFallback>{reportData.technicianSummary.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-muted-foreground">Performance Report For</p>
                    <CardTitle className="font-headline text-2xl">{reportData.technicianSummary.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="p-3 bg-background rounded-lg border">
                    <p className="text-xs text-muted-foreground">Completed Jobs</p>
                    <p className="text-xl font-bold">{reportData.technicianSummary.completedJobs}</p>
                </div>
                 <div className="p-3 bg-background rounded-lg border">
                    <p className="text-xs text-muted-foreground">Avg. On-Site Duration</p>
                    <p className="text-xl font-bold">{reportData.technicianSummary.avgDuration}</p>
                </div>
                 <div className="p-3 bg-background rounded-lg border">
                    <p className="text-xs text-muted-foreground">First-Time-Fix Rate</p>
                    <p className="text-xl font-bold">{reportData.technicianSummary.ftfr}%</p>
                </div>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Jobs</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.totalJobs}</div><p className="text-xs text-muted-foreground">In selected period</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed Jobs</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.completedJobs}</div><p className="text-xs text-muted-foreground">In selected period</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">On-Time Arrival Rate</CardTitle><CalendarClock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.onTimeArrivalRate}%</div><p className="text-xs text-muted-foreground">Within 15min of schedule</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. On-Site Duration</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.avgDuration}</div><p className="text-xs text-muted-foreground">From start to completion</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Time to Assign</CardTitle><Timer className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.avgTimeToAssign}</div><p className="text-xs text-muted-foreground">From creation to assignment</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Satisfaction</CardTitle><Smile className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.avgSatisfaction} / 5</div><p className="text-xs text-muted-foreground">Across all rated jobs</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">First-Time-Fix Rate</CardTitle><ThumbsUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.ftfr}%</div><p className="text-xs text-muted-foreground">Of jobs resolved in one visit</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total CO2 Emissions</CardTitle><Leaf className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.kpis.totalEmissions} kg</div><p className="text-xs text-muted-foreground">Est. from travel distance</p></CardContent></Card>
      </div>
    </div>
  );
}
