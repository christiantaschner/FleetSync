
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Job, Technician, JobStatus, Location, OptimizationSuggestion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachDay, addMonths, subMonths, isSameMonth, getDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase, User, Circle, ShieldQuestion, Shuffle, Calendar, Grid3x3, UserPlus, Users, Info, Car, Coffee, Play, Wrench, Save, X, Loader2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useDraggable, useDroppable, DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useToast } from "@/hooks/use-toast";
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

export const JobBlock = ({ job, dayStart, totalMinutes, onClick, isProposed, profitChange }: { job: Job, dayStart: Date, totalMinutes: number, onClick?: (e: React.MouseEvent, job: Job) => void, isProposed?: boolean, profitChange?: number | null }) => {
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
  
  let profitChangeIndicator: React.ReactNode = null;
    if (profitChange !== undefined && profitChange !== null) {
        const isGain = profitChange > 0;
        const isLoss = profitChange < 0;
        profitChangeIndicator = (
             <Badge className={cn(
                "absolute -top-2 -right-2 text-xs font-bold z-10",
                isGain && "bg-green-600 text-white",
                isLoss && "bg-red-600 text-white",
                !isGain && !isLoss && "bg-muted text-muted-foreground"
            )}>
                {isGain ? '+' : ''}${profitChange.toFixed(0)}
            </Badge>
        );
    }

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
              {profitChangeIndicator}
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
             {profitChange !== undefined && profitChange !== null && (
                 <p className={cn(
                    "text-sm font-semibold",
                    profitChange > 0 && "text-green-600",
                    profitChange < 0 && "text-red-600"
                 )}>
                    Profit Change: {profitChange > 0 ? '+' : ''}${profitChange.toFixed(2)}
                 </p>
             )}
          </TooltipContent>
        </Tooltip>
    </TooltipProvider>
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

const UnassignedJobItem = ({ job }: { job: Job }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: job.id,
        data: { type: 'unassigned-job', job },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <Card className="cursor-grab bg-amber-50 border-amber-300 hover:shadow-md">
                <CardContent className="p-2">
                    <p className="font-semibold text-xs truncate text-amber-900">{job.title}</p>
                    <p className="text-xs text-amber-700 truncate">{job.customerName}</p>
                </CardContent>
            </Card>
        </div>
    );
};

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
  isFleetOptimizationDialogOpen: boolean;
  setIsFleetOptimizationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedFleetChanges: OptimizationSuggestion[];
  setSelectedFleetChanges: React.Dispatch<React.SetStateAction<OptimizationSuggestion[]>>;
  onScheduleChange: (jobId: string, newTechnicianId: string, newScheduledTime: string) => void;
  proposedJobs: Job[];
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  unassignedJobs: Job[];
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
    isSaving,
    onSave,
    onCancel,
    unassignedJobs,
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
  
  const calculateProfit = (job: Job, technician: Technician) => {
    const revenue = job.quotedValue || 0;
    const durationCost = technician.hourlyCost && job.estimatedDurationMinutes ? (job.estimatedDurationMinutes / 60) * technician.hourlyCost : 0;
    // Note: This is a simplified calculation. A real implementation would estimate travel time cost.
    return revenue - durationCost;
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over || !active.data.current) return;
    
    const job = active.data.current.job as Job;
    const newTechnicianId = over.id as string;
    const newTechnician = technicians.find(t => t.id === newTechnicianId);

    if (!newTechnician) return;

    const timelineRef = over.data.current?.timelineRef;
    if (!timelineRef || !timelineRef.current) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    
    let minutesFromStart;

    if (active.data.current.type === 'schedule-job') {
        const initialOffsetMinutes = (new Date(job.scheduledTime!).getTime() - dayStart.getTime()) / 60000;
        const initialLeftPx = (initialOffsetMinutes / totalMinutes) * timelineRect.width;
        const finalLeftPx = initialLeftPx + delta.x;
        minutesFromStart = (finalLeftPx / timelineRect.width) * totalMinutes;
    } else if (active.data.current.type === 'unassigned-job') {
        const dropX = event.delta.x; // Use delta.x directly as we're dropping from a static list
        minutesFromStart = (dropX / timelineRect.width) * totalMinutes;
    } else {
        return;
    }
    
    const snappedMinutes = Math.round(minutesFromStart / 10) * 10;
    const newStartTime = new Date(dayStart.getTime() + snappedMinutes * 60000);

    onScheduleChange(job.id, newTechnicianId, newStartTime.toISOString());
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
    
    const proposedJobIds = new Set(proposedJobs.map(p => p.id));
    
    const originalJobs = jobs.filter(job =>
      job.assignedTechnicianId === techId &&
      !proposedJobIds.has(job.id) &&
      job.scheduledTime &&
      isSameDay(new Date(job.scheduledTime), startOfDayDate)
    );

    const proposedJobsForTech = proposedJobs.filter(
      pJob => pJob.assignedTechnicianId === techId &&
      pJob.scheduledTime &&
      isSameDay(new Date(pJob.scheduledTime), startOfDayDate)
    );

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
  
  const handleConfirmFleetOptimization = async (changesToConfirm: OptimizationSuggestion[]) => {};

  return (
        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline">Technician Schedule</CardTitle>
                    <CardDescription>Daily timeline view of technician assignments. Drag jobs to reschedule.</CardDescription>
                </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" className="w-36 md:w-40" onClick={handleToday}>
                        {format(currentDate, 'PPP')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
                </div>
                 <div className="flex items-center justify-end gap-2 flex-1 w-full sm:w-auto">
                     {proposedJobs.length > 0 ? (
                        <div className="flex items-center gap-2 w-full justify-end">
                            <p className="text-sm font-medium text-amber-900 hidden md:block">You have unsaved changes.</p>
                            <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                                <X className="mr-2 h-4 w-4"/> Cancel
                            </Button>
                            <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                     ) : (
                        <>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                            <Info className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">AI proactively checks schedules. Delay risk alerts will appear on the dashboard.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button onClick={onFleetOptimize} disabled={isFleetOptimizing} className="w-full sm:w-auto">
                                {isFleetOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shuffle className="mr-2 h-4 w-4" />}
                                Optimize Fleet
                            </Button>
                        </>
                     )}
                 </div>
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
                <div className="flex w-full">
                    <div className="w-48 shrink-0 border-r">
                        <div className="sticky top-0 z-20 h-10 flex items-center p-2 font-semibold text-sm bg-muted/50 border-b">
                            Unassigned Jobs
                        </div>
                        <ScrollArea className="h-[calc(100vh-22rem)]">
                            <div className="p-2 space-y-2">
                                {unassignedJobs.length > 0 ? (
                                    unassignedJobs.map(job => <UnassignedJobItem key={job.id} job={job} />)
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground p-4">
                                        No unassigned jobs.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div ref={containerRef} className="overflow-x-auto flex-1">
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
                                                    const isProposed = proposedJobs.some(p => p.id === job.id);
                                                    let profitChange: number | null = null;
                                                    
                                                    if (isProposed) {
                                                        const originalJob = jobs.find(j => j.id === job.id);
                                                        const originalTechnician = technicians.find(t => t.id === originalJob?.assignedTechnicianId);
                                                        const newTechnician = technicians.find(t => t.id === job.assignedTechnicianId);

                                                        if (originalJob && originalTechnician && newTechnician) {
                                                            const originalProfit = calculateProfit(originalJob, originalTechnician);
                                                            const newProfit = calculateProfit(job, newTechnician);
                                                            profitChange = newProfit - originalProfit;
                                                        }
                                                    }

                                                    return (
                                                        <React.Fragment key={job.id}>
                                                            <JobBlock 
                                                                job={job} 
                                                                dayStart={dayStart} 
                                                                totalMinutes={totalMinutes} 
                                                                onClick={(e, job) => {
                                                                    e.stopPropagation();
                                                                    onJobClick(job);
                                                                }}
                                                                isProposed={isProposed}
                                                                profitChange={profitChange}
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
                            </div>
                        </div>
                    </div>
                </div>
            </DndContext>
        </CardContent>
        </Card>
  );
};

export default ScheduleCalendarView;

    