
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Job, Technician, JobStatus, Location, OptimizationSuggestion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachDay, addMonths, subMonths, isSameMonth, getDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase, User, Circle, ShieldQuestion, Shuffle, Calendar, Grid3x3, UserPlus, Users, Info, Car, Coffee, Play, Wrench, Save, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useDraggable, useDroppable, DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useToast } from "@/hooks/use-toast";
import { reassignJobAction, confirmFleetOptimizationAction } from '@/actions/fleet-actions';
import ReassignJobDialog from './ReassignJobDialog';
import { useAuth } from '@/contexts/auth-context';
import FleetOptimizationReviewDialog from './FleetOptimizationReviewDialog';

const getStatusAppearance = (status: JobStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 border-green-500 text-green-800';
      case 'In Progress': return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'En Route': return 'bg-indigo-100 border-indigo-500 text-indigo-800';
      case 'Assigned': return 'bg-sky-100 border-sky-500 text-sky-800';
      case 'Unassigned': return 'bg-amber-100 border-amber-500 text-amber-800';
      case 'Cancelled': return 'bg-red-100/70 border-red-500 text-red-800 line-through';
      default: return 'bg-gray-100 border-gray-400 text-gray-700';
    }
};

const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 0 || isNaN(milliseconds)) return "0m";
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const JobBlock = ({ job, dayStart, totalMinutes, onClick, isProposed }: { job: Job, dayStart: Date, totalMinutes: number, onClick?: (e: React.MouseEvent, job: Job) => void, isProposed?: boolean }) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: job.id,
    data: { type: 'schedule-job', job }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100 // Bring to front while dragging
  } : undefined;
  
  if (!job.scheduledTime) return null;

  const jobStart = new Date(job.scheduledTime);
  const jobEnd = new Date(jobStart.getTime() + (job.estimatedDurationMinutes || 60) * 60000);

  const offsetMinutes = (jobStart.getTime() - dayStart.getTime()) / 60000;
  const left = (offsetMinutes / totalMinutes) * 100;
  const durationMinutes = (jobEnd.getTime() - jobStart.getTime()) / 60000;
  const width = (durationMinutes / totalMinutes) * 100;

  if (left > 100 || (left + width) < 0 || durationMinutes <= 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e, job);
  };

  return (
    <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={setNodeRef}
              style={{ 
                left: `${Math.max(0, left)}%`, 
                width: `${Math.min(100 - Math.max(0, left), width)}%`,
                minWidth: '20px',
                ...style
              }}
              {...listeners}
              {...attributes}
              onClick={handleClick}
              className={cn(
                "absolute top-0 h-full p-2 rounded-md text-xs overflow-hidden flex items-center shadow-sm cursor-grab ring-1 ring-inset ring-black/10 transition-opacity border-l-4",
                getStatusAppearance(job.status),
                isProposed && "opacity-60 ring-primary ring-2"
              )}
            >
              <div className="flex flex-col w-full truncate">
                <span className="font-bold truncate"><Wrench className="inline h-3 w-3 mr-1" />{format(new Date(job.scheduledTime), 'p')} - {job.customerName}</span>
                <span className="text-muted-foreground truncate italic">{job.title}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-card text-card-foreground border-border shadow-lg">
            <p className="font-semibold">{job.title}</p>
            <p className="text-sm text-muted-foreground">Customer: {job.customerName}</p>
            {job.scheduledTime && <p className="text-sm text-muted-foreground">Time: {format(new Date(job.scheduledTime), 'p')}</p>}
          </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
};


const TravelBlock = ({ from, dayStart, totalMinutes }: { from: Date, dayStart: Date, totalMinutes: number }) => {
    const jobEndTime = from.getTime();
    const travelStartTime = jobEndTime;
    const travelTimeMs = 30 * 60000; // 30 minutes travel time
    const travelEndTime = travelStartTime + travelTimeMs;

    const offsetMinutes = (travelStartTime - dayStart.getTime()) / 60000;
    const width = (travelTimeMs / 60000 / totalMinutes) * 100;
    
    if (offsetMinutes < 0 || offsetMinutes > totalMinutes) return null;

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
                className="absolute top-0 h-full p-2 rounded-md text-xs overflow-hidden flex items-center bg-slate-200 border-l-4 border-slate-400 text-slate-600 shadow-inner"
                style={{ left: `${offsetMinutes / totalMinutes * 100}%`, width: `${width}%` }}
            >
                 <div className="flex w-full truncate items-center justify-center">
                    <Car className="inline h-3 w-3 mr-1.5 shrink-0" />
                    <span className="truncate italic">30m travel</span>
                </div>
            </div>
          </TooltipTrigger>
           <TooltipContent className="bg-card text-card-foreground border-border shadow-lg">
            <p>Estimated Travel Time: 30 minutes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
};

const CurrentTimeIndicator = ({ dayStart, totalMinutes }: { dayStart: Date, totalMinutes: number }) => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
      setCurrentTime(new Date());
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
    }, []);

    if (!currentTime || !isSameDay(currentTime, dayStart)) return null;
    const offsetMinutes = (currentTime.getTime() - dayStart.getTime()) / 60000;
    const left = (offsetMinutes / totalMinutes) * 100;
    if (left < 0 || left > 100) return null;

    return (
        <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500" style={{ left: `${left}%` }}>
            <div className="absolute -top-1 -translate-x-1/2 h-2 w-2 rounded-full bg-red-500"></div>
        </div>
    );
};

const TechnicianRow = ({ technician, children, onOptimize, isOptimizing, timelineRef }: { technician: Technician, children: React.ReactNode, onOptimize: () => void, isOptimizing: boolean, timelineRef: React.RefObject<HTMLDivElement> }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: technician.id,
        data: { type: 'technician', timelineRef }
    });

    return (
        <div className={cn("flex h-20 items-center border-t", isOver && "bg-primary/10")}>
            <div className="w-48 shrink-0 p-2 flex items-center justify-between gap-2 border-r h-full bg-background">
                <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={technician.avatarUrl} alt={technician.name} />
                        <AvatarFallback>{technician.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                        <span className="font-medium text-sm truncate block">{technician.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Circle className={cn("h-2 w-2 fill-current", technician.isAvailable ? "text-green-500" : "text-red-500")} />
                            <span>{technician.isAvailable ? 'Available' : 'Unavailable'}</span>
                        </div>
                    </div>
                </div>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-primary shrink-0" onClick={onOptimize} disabled={isOptimizing}>
                                {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Shuffle className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Suggest schedule resolution</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div ref={setNodeRef} className="flex-1 relative h-full">
                {children}
            </div>
        </div>
    );
}

interface ScheduleCalendarViewProps {
  jobs: Job[];
  technicians: Technician[];
  onJobClick: (job: Job) => void;
  onFleetOptimize: () => void;
  isFleetOptimizing: boolean;
  optimizationResult: {
    suggestedChanges: OptimizationSuggestion[];
    overallReasoning: string;
  } | null;
  setOptimizationResult: React.Dispatch<React.SetStateAction<{
    suggestedChanges: OptimizationSuggestion[];
    overallReasoning: string;
  } | null>>;
  isFleetOptimizationDialogOpen: boolean;
  setIsFleetOptimizationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedFleetChanges: OptimizationSuggestion[];
  setSelectedFleetChanges: React.Dispatch<React.SetStateAction<OptimizationSuggestion[]>>;
  onScheduleChange: (jobId: string, newTechnicianId: string, newScheduledTime: string) => void;
  proposedJobs: Job[];
  setProposedJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}


const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ 
    jobs, 
    technicians,
    onJobClick,
    onFleetOptimize,
    isFleetOptimizing,
    optimizationResult,
    isFleetOptimizationDialogOpen,
    setIsFleetOptimizationDialogOpen,
    selectedFleetChanges,
    setSelectedFleetChanges,
    onScheduleChange,
    proposedJobs,
    setProposedJobs,
    isSaving,
    onSave,
    onCancel,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRefs = useRef<Map<string, React.RefObject<HTMLDivElement>>>(new Map());
  const [optimizingTechId, setOptimizingTechId] = useState<string | null>(null);

  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [jobToReassign, setJobToReassign] = useState<Job | null>(null);
  const { toast } = useToast();

  const dayStart = useMemo(() => {
    const d = startOfDay(currentDate);
    d.setHours(7, 0, 0, 0);
    return d;
  }, [currentDate]);

  const dayEnd = useMemo(() => {
    const d = startOfDay(currentDate);
    d.setHours(19, 0, 0, 0);
    return d;
  }, [currentDate]);

  const hours = useMemo(() => eachHourOfInterval({ start: dayStart, end: dayEnd }), [dayStart, dayEnd]);
  const totalMinutes = useMemo(() => (dayEnd.getTime() - dayStart.getTime()) / 60000, [dayStart, dayEnd]);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over || !active.data.current) return;
    
    const job = active.data.current.job as Job;
    const newTechnicianId = over.id as string;

    if (active.data.current.type === 'schedule-job') {
        const timelineRef = over.data.current?.timelineRef;
        if (!timelineRef || !timelineRef.current) return;
        
        const timelineRect = timelineRef.current.getBoundingClientRect();
        
        // Calculate the initial position percentage
        const initialOffsetMinutes = (new Date(job.scheduledTime!).getTime() - dayStart.getTime()) / 60000;
        const initialLeftPx = (initialOffsetMinutes / totalMinutes) * timelineRect.width;

        // Add the drag delta
        const finalLeftPx = initialLeftPx + delta.x;
        
        const minutesFromStart = (finalLeftPx / timelineRect.width) * totalMinutes;
        const snappedMinutes = Math.round(minutesFromStart / 10) * 10;
        
        const newStartTime = new Date(dayStart.getTime() + snappedMinutes * 60000);

        onScheduleChange(job.id, newTechnicianId, newStartTime.toISOString());
    }
  };


  useEffect(() => {
    if (containerRef.current && isSameDay(currentDate, new Date())) {
        const now = new Date();
        const startHour = dayStart.getHours();
        const currentHour = now.getHours();
        const scrollPosition = (containerRef.current.scrollWidth / hours.length) * (currentHour - startHour - 1);
        containerRef.current.scrollLeft = scrollPosition > 0 ? scrollPosition : 0;
    }
  }, [currentDate, dayStart, hours.length]);

  const jobsByTechnician = useCallback((techId: string) => {
    const startOfDayDate = startOfDay(currentDate);
    
    // Create a Set of proposed job IDs for quick lookups
    const proposedJobIds = new Set(proposedJobs.map(p => p.id));
    
    // Get original jobs for this tech on the current day, EXCLUDING any that are in the proposed list
    const originalJobs = jobs.filter(job =>
      job.assignedTechnicianId === techId &&
      !proposedJobIds.has(job.id) && // Exclude original jobs that have been moved
      job.scheduledTime &&
      isSameDay(new Date(job.scheduledTime), startOfDayDate)
    );

    // Get proposed changes for this technician on the current day
    const proposedJobsForTech = proposedJobs.filter(
      pJob => pJob.assignedTechnicianId === techId &&
      pJob.scheduledTime &&
      isSameDay(new Date(pJob.scheduledTime), startOfDayDate)
    );

    // Combine the filtered original jobs with the proposed jobs
    const finalJobs = [...originalJobs, ...proposedJobsForTech];
    
    return finalJobs.sort((a,b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
  }, [currentDate, jobs, proposedJobs]);
  
  const handlePrev = () => setCurrentDate(subDays(currentDate, 1));
  const handleNext = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());
  
  const handleOptimize = (technicianId: string) => {
    const jobsForOptimization = jobs.filter(j => 
        j.assignedTechnicianId === technicianId && 
        j.scheduledTime &&
        isSameDay(new Date(j.scheduledTime), currentDate) &&
        (j.status === 'Assigned' || j.status === 'En Route' || j.status === 'In Progress')
    );

    if (jobsForOptimization.length < 1) {
        toast({ title: "Not Enough Jobs", description: `This technician does not have enough scheduled jobs today to optimize.`, variant: "default" });
        return;
    }
    
    setJobToReassign(jobsForOptimization[0]);
    setIsReassignOpen(true);
  };
  
  const handleConfirmFleetOptimization = async (changesToConfirm: OptimizationSuggestion[]) => {
    // This action is handled by the parent DashboardPage now.
  };

  return (
        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="font-headline">Technician Schedule</CardTitle>
                    <CardDescription>Daily timeline view of technician assignments. Drag jobs to reschedule.</CardDescription>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" className="w-36 md:w-40" onClick={handleToday}>
                        {format(currentDate, 'PPP')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
             {proposedJobs.length > 0 && (
                <div className="mt-4 p-3 border rounded-md bg-amber-50 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-sm font-medium text-amber-900">You have unsaved schedule changes.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                            <X className="mr-2 h-4 w-4"/> Cancel
                        </Button>
                        <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                           {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <Alert className="text-sm border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600 flex-1">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-semibold">AI Proactive Monitoring</AlertTitle>
                    <AlertDescription>
                        AI continuously checks schedules. If a delay risk is detected, an alert will appear on the dashboard.
                    </AlertDescription>
                </Alert>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={onFleetOptimize} disabled={isFleetOptimizing} className="w-full sm:w-auto">
                                {isFleetOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shuffle className="mr-2 h-4 w-4" />}
                                Optimize Fleet
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Optimize the schedule for the currently selected day.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 relative">
            <DndContext onDragEnd={handleDragEnd}>
                {jobToReassign && (
                    <ReassignJobDialog
                        isOpen={isReassignOpen}
                        setIsOpen={setIsReassignOpen}
                        jobToReassign={jobToReassign}
                        allJobs={jobs}
                        technicians={technicians}
                        onReassignmentComplete={() => {}}
                    />
                )}
                <FleetOptimizationReviewDialog
                    isOpen={isFleetOptimizationDialogOpen}
                    setIsOpen={setIsFleetOptimizationDialogOpen}
                    optimizationResult={optimizationResult}
                    technicians={technicians}
                    jobs={jobs}
                    onConfirmChanges={handleConfirmFleetOptimization}
                    isLoadingConfirmation={isFleetOptimizing}
                    selectedChanges={selectedFleetChanges}
                    setSelectedChanges={setSelectedFleetChanges}
                />
                <div ref={containerRef} className="overflow-x-auto">
                <div className="relative min-w-[1200px]">
                    <div className="sticky top-0 z-20 h-10 flex border-b bg-muted/50">
                        <div className="w-48 shrink-0 p-2 font-semibold text-sm flex items-center border-r">Technician</div>
                        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                        {hours.map((hour, index) => (
                            <div key={hour.toString()} className={cn("text-center text-xs text-muted-foreground pt-2", index > 0 && "border-l")}>
                            {format(hour, 'ha')}
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="relative">
                        {technicians.length > 0 ? technicians.map((tech) => {
                            if (!timelineRefs.current.has(tech.id)) {
                                timelineRefs.current.set(tech.id, React.createRef<HTMLDivElement>());
                            }
                            const techTimelineRef = timelineRefs.current.get(tech.id)!;
                            const techJobs = jobsByTechnician(tech.id);
                            
                            return (
                                <TechnicianRow 
                                    key={tech.id} 
                                    technician={tech} 
                                    onOptimize={() => handleOptimize(tech.id)}
                                    isOptimizing={optimizingTechId === tech.id}
                                    timelineRef={techTimelineRef}
                                >
                                    <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                                        {hours.map((_, index) => (
                                            <div key={index} className={cn("h-full", index > 0 && "border-l", (index % 2 !== 0) && "bg-muted/30")}></div>
                                        ))}
                                    </div>
                                    <div ref={techTimelineRef} className="relative h-full p-1.5">
                                        {techJobs.map((job, index) => {
                                            const prevJob = techJobs[index-1];
                                            const travelStartTime = prevJob ? new Date(new Date(prevJob.scheduledTime!).getTime() + (prevJob.estimatedDurationMinutes || 60) * 60000) : null;
                                            const isProposed = proposedJobs.some(p => p.id === job.id);
                                            
                                            return (
                                                <React.Fragment key={job.id}>
                                                    {travelStartTime && (
                                                        <TravelBlock from={travelStartTime} dayStart={dayStart} totalMinutes={totalMinutes} />
                                                    )}
                                                    <JobBlock 
                                                        job={job} 
                                                        dayStart={dayStart} 
                                                        totalMinutes={totalMinutes} 
                                                        onClick={(e, job) => {
                                                            e.stopPropagation();
                                                            onJobClick(job);
                                                        }}
                                                        isProposed={isProposed}
                                                    />
                                                </React.Fragment>
                                            )
                                        })}
                                    </div>
                                </TechnicianRow>
                            )
                        }) : (
                            <div className="pt-6">
                                <Alert className="m-4 border-primary/30 bg-primary/5">
                                    <UserPlus className="h-4 w-4 text-primary" />
                                    <AlertTitle className="font-semibold text-primary">No Technicians to Schedule</AlertTitle>
                                    <AlertDescription>
                                        The schedule is empty because no technicians have been added yet. Visit User Management to invite your team.
                                    </AlertDescription>
                                    <div className="mt-4">
                                        <Link href="/settings?tab=users">
                                            <Button variant="default" size="sm">
                                                <Users className="mr-2 h-4 w-4" /> Go to User Management
                                            </Button>
                                        </Link>
                                    </div>
                                </Alert>
                            </div>
                        )}
                        <CurrentTimeIndicator dayStart={dayStart} totalMinutes={totalMinutes} />
                    </div>
                </div>
                </div>
            </DndContext>
        </CardContent>
        </Card>
  );
};

export default ScheduleCalendarView;
