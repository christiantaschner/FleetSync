
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Job, Technician, JobStatus, Location } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachDay, addMonths, subMonths, isSameMonth, getDay, isBefore, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase, User, Circle, ShieldQuestion, Shuffle, Calendar, Grid3x3, UserPlus, Users, Info, Car, Coffee, Play, Wrench, Save, X, Loader2 } from 'lucide-react';
import OptimizeRouteDialog from './optimize-route-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useToast } from "@/hooks/use-toast";
import { reassignJobAction } from '@/actions/fleet-actions';
import { useAuth } from '@/contexts/auth-context';

const getStatusAppearance = (status: JobStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 border-l-4 border-green-500 text-green-800';
      case 'In Progress': return 'bg-blue-100 border-l-4 border-blue-500 text-blue-800';
      case 'En Route': return 'bg-indigo-100 border-l-4 border-indigo-500 text-indigo-800';
      case 'Assigned': return 'bg-sky-100 border-l-4 border-sky-500 text-sky-800';
      case 'Pending': return 'bg-amber-100 border-l-4 border-amber-500 text-amber-800';
      case 'Cancelled': return 'bg-red-100/70 border-l-4 border-red-500 text-red-800 line-through';
      default: return 'bg-gray-100 border-l-4 border-gray-400 text-gray-700';
    }
};

const formatDuration = (start: Date, end: Date): string => {
    if (end <= start) return "0m";
    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};


const JobBlock = ({ job, dayStart, totalMinutes, onClick, isProposed }: { job: Job, dayStart: Date, totalMinutes: number, onClick: (job: Job) => void, isProposed?: boolean }) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: job.id,
    data: { job }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100 // Bring to front while dragging
  } : undefined;
  
  if (!job.scheduledTime) return null;

  const jobStart = new Date(job.scheduledTime);
  const jobEnd = new Date(jobStart.getTime() + (job.estimatedDurationMinutes || 60) * 60000);

  const offsetMinutes = (jobStart.getTime() - dayStart.getTime()) / 60000;
  const durationMinutes = (jobEnd.getTime() - jobStart.getTime()) / 60000;

  const left = (offsetMinutes / totalMinutes) * 100;
  const width = (durationMinutes / totalMinutes) * 100;

  if (left > 100 || (left + width) < 0 || durationMinutes <= 0) return null;

  const priorityColor = job.priority === 'High' ? 'ring-destructive' : job.priority === 'Medium' ? 'ring-yellow-500' : 'ring-gray-300';
  const isPendingOrAssigned = job.status === 'Pending' || job.status === 'Assigned';

  return (
    <TooltipProvider>
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
            onClick={() => onClick(job)}
            className={cn(
              "absolute top-0 p-2 rounded-md text-xs overflow-hidden flex items-center shadow-sm cursor-grab ring-1 ring-inset transition-opacity",
              getStatusAppearance(job.status),
              priorityColor,
              isPendingOrAssigned && "border-dashed",
              isProposed && "opacity-60 ring-primary ring-2"
            )}
          >
             <div className="flex flex-col w-full truncate">
                <span className="font-bold truncate"><Wrench className="inline h-3 w-3 mr-1" />{format(new Date(job.scheduledTime), 'p')} - {job.customerName}</span>
                <span className="text-muted-foreground truncate italic">{job.title}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-background border shadow-xl p-3 max-w-xs">
          {isProposed && <p className="font-bold text-primary mb-1 text-sm">PROPOSED CHANGE</p>}
          <p className="font-bold text-base mb-1">{job.title}</p>
          <p className="text-sm"><strong>Status:</strong> {job.status}</p>
          <p className="text-sm"><strong>Priority:</strong> {job.priority}</p>
          <p className="text-sm"><strong>Customer:</strong> {job.customerName}</p>
          <p className="text-sm"><strong>Address:</strong> {job.location.address}</p>
          <p className="text-sm"><strong>Scheduled:</strong> {format(new Date(job.scheduledTime), 'PP p')}</p>
          <p className="text-sm"><strong>Duration:</strong> {job.estimatedDurationMinutes} mins</p>
          {job.description && <p className="text-sm mt-2 pt-2 border-t"><strong>Notes:</strong> {job.description}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


const TravelBlock = ({ from, to, dayStart, totalMinutes }: { from: Date, to: Date, dayStart: Date, totalMinutes: number }) => {
    const offsetMinutes = (from.getTime() - dayStart.getTime()) / 60000;
    const durationMinutes = (to.getTime() - from.getTime()) / 60000;
    if (durationMinutes <= 1) return null;

    const left = (offsetMinutes / totalMinutes) * 100;
    const width = (durationMinutes / totalMinutes) * 100;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${width}%` }}>
                        <div className="relative w-full h-full flex items-center justify-center bg-gray-200/50">
                            <Car className="h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Travel Time: {formatDuration(from, to)}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const BreakBlock = ({ breakItem, dayStart, totalMinutes }: { breakItem: {start: string, end?: string}, dayStart: Date, totalMinutes: number }) => {
    if (!breakItem.end) return null; // Don't render ongoing breaks
    const start = new Date(breakItem.start);
    const end = new Date(breakItem.end);
    const offsetMinutes = (start.getTime() - dayStart.getTime()) / 60000;
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes <= 0) return null;

    const left = (offsetMinutes / totalMinutes) * 100;
    const width = (durationMinutes / totalMinutes) * 100;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <div className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${width}%` }}>
                        <div className="relative w-full h-full flex items-center justify-center bg-amber-200/60">
                            <Coffee className="h-4 w-4 text-amber-700" />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Break: {formatDuration(start, end)}</p>
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

const technicianColors = [ 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500' ];
const getTechnicianColor = (technicianId: string | null | undefined) => {
    if (!technicianId) return 'bg-gray-400';
    let hash = 0;
    for (let i = 0; i < technicianId.length; i++) {
        hash = technicianId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % technicianColors.length);
    return technicianColors[index];
};

const MonthView = ({ currentDate, jobs, technicians, onJobClick }: { currentDate: Date, jobs: Job[], technicians: Technician[], onJobClick: (job: Job) => void }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const firstDayOfMonth = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1; 
    const daysInMonth = eachDay({ start: monthStart, end: monthEnd });

    const leadingEmptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} className="border-r border-b"></div>);

    return (
        <div className="flex flex-col border-t border-l">
            <div className="grid grid-cols-7 text-center font-semibold text-sm">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-2 border-r border-b bg-muted/50">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {leadingEmptyDays}
                {daysInMonth.map(day => {
                    const jobsForDay = jobs.filter(job => job.scheduledTime && isSameDay(new Date(job.scheduledTime), day));
                    return (
                        <div key={day.toString()} className={cn("relative border-r border-b min-h-32 p-1.5", !isSameMonth(day, currentDate) && "bg-muted/30")}>
                           <span className={cn("text-xs font-semibold", isToday(day) && "bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center")}>
                                {format(day, 'd')}
                            </span>
                             <ScrollArea className="h-24 mt-1">
                                <div className="space-y-1 pr-1">
                                    {jobsForDay.map(job => (
                                        <TooltipProvider key={job.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge 
                                                        onClick={() => onJobClick(job)}
                                                        className={cn("w-full justify-start truncate text-white cursor-pointer", getTechnicianColor(job.assignedTechnicianId))}
                                                    >
                                                        {technicians.find(t => t.id === job.assignedTechnicianId)?.name.split(' ')[0]}: {job.title}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-bold">{job.title}</p>
                                                    <p>{technicians.find(t => t.id === job.assignedTechnicianId)?.name || 'Unassigned'}</p>
                                                    <p>{format(new Date(job.scheduledTime!), 'p')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TechnicianRow = ({ technician, children }: { technician: Technician, children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: technician.id,
    });

    return (
        <div ref={setNodeRef} className={cn("flex h-20 items-center border-t", isOver && "bg-primary/10")}>
            <div className="w-32 sm:w-48 shrink-0 p-2 flex items-center gap-2 border-r h-full bg-background">
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
            {children}
        </div>
    );
}

interface ScheduleCalendarViewProps {
  jobs: Job[];
  technicians: Technician[];
  onJobClick: (job: Job) => void;
  onRouteDirty: (technicianId: string) => void;
}

type ProposedChanges = Record<string, { scheduledTime: string; assignedTechnicianId: string; originalTechnicianId: string | null }>;


const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ 
    jobs, 
    technicians,
    onJobClick,
    onRouteDirty,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineGridRef = useRef<HTMLDivElement>(null);
  const [proposedChanges, setProposedChanges] = useState<ProposedChanges>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { userProfile, isMockMode } = useAuth();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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

  useEffect(() => {
    if (viewMode === 'day' && containerRef.current && isSameDay(currentDate, new Date())) {
        const now = new Date();
        const startHour = dayStart.getHours();
        const currentHour = now.getHours();
        const scrollPosition = (containerRef.current.scrollWidth / hours.length) * (currentHour - startHour - 1);
        containerRef.current.scrollLeft = scrollPosition > 0 ? scrollPosition : 0;
    }
  }, [currentDate, dayStart, hours.length, viewMode]);

  const jobsWithProposedChanges = useMemo(() => {
    return jobs.map(job => {
        if (proposedChanges[job.id]) {
            return {
                ...job,
                scheduledTime: proposedChanges[job.id].scheduledTime,
                assignedTechnicianId: proposedChanges[job.id].assignedTechnicianId,
            };
        }
        return job;
    });
  }, [jobs, proposedChanges]);


  const jobsByTechnician = useCallback((techId: string) => {
    const startOfDayDate = startOfDay(currentDate);
    const endOfDayDate = endOfDay(currentDate);
    return jobsWithProposedChanges.filter(job =>
      job.assignedTechnicianId === techId &&
      job.scheduledTime &&
      new Date(job.scheduledTime) >= startOfDayDate &&
      new Date(job.scheduledTime) <= endOfDayDate
    ).sort((a,b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
  }, [currentDate, jobsWithProposedChanges]);
  
  const handlePrev = () => setCurrentDate(viewMode === 'day' ? subDays(currentDate, 1) : subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(viewMode === 'day' ? addDays(currentDate, 1) : addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event;
    const job = active.data.current?.job as Job;
    if (!job || !timelineGridRef.current || !over) return;

    const targetTechnicianId = over.id as string;
    
    const gridWidth = timelineGridRef.current.offsetWidth;
    const minutesPerPixel = totalMinutes / gridWidth;
    const timeDeltaMinutes = delta.x * minutesPerPixel;

    const originalStartTime = new Date(proposedChanges[job.id]?.scheduledTime || job.scheduledTime!);
    const newStartTime = new Date(originalStartTime.getTime() + timeDeltaMinutes * 60000);

    setProposedChanges(prev => ({
        ...prev,
        [job.id]: {
            scheduledTime: newStartTime.toISOString(),
            assignedTechnicianId: targetTechnicianId!,
            originalTechnicianId: job.assignedTechnicianId || null,
        }
    }));
  };
  
  const handleConfirmChanges = async () => {
    if (isMockMode) {
        toast({ title: 'Schedule Updated (Mock)', description: 'Changes have been applied in mock mode.'});
        setProposedChanges({});
        return;
    }

    if (!userProfile?.companyId || !appId) {
        toast({ title: "Error", description: "Cannot save changes, user or app info is missing.", variant: "destructive"});
        return;
    }
    
    setIsSaving(true);
    const promises = Object.entries(proposedChanges).map(([jobId, change]) => {
        return reassignJobAction({
            companyId: userProfile.companyId,
            jobId,
            newTechnicianId: change.assignedTechnicianId,
            newScheduledTime: change.scheduledTime,
            appId,
            reason: "Manually rescheduled on calendar view"
        });
    });

    const results = await Promise.allSettled(promises);
    
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));

    if (failed.length > 0) {
        toast({ title: "Some Changes Failed", description: `${failed.length} of ${promises.length} changes could not be saved.`, variant: "destructive"});
    } else {
        toast({ title: "Schedule Updated", description: "All changes have been saved successfully." });
        
        // Check if only one technician was affected
        const affectedTechIds = new Set(Object.values(proposedChanges).map(c => c.assignedTechnicianId));
        Object.values(proposedChanges).forEach(c => {
          if (c.originalTechnicianId) {
            affectedTechIds.add(c.originalTechnicianId);
          }
        });
        
        if (affectedTechIds.size === 1) {
            const techId = affectedTechIds.values().next().value;
            onRouteDirty(techId);
        }
    }

    setProposedChanges({});
    setIsSaving(false);
  };

  const handleDiscardChanges = () => {
    setProposedChanges({});
  };
  
  const hasProposedChanges = Object.keys(proposedChanges).length > 0;

  return (
    <DndContext onDragEnd={handleDragEnd}>
        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="font-headline">Technician Schedule</CardTitle>
                    <CardDescription>Daily timeline view of technician assignments. Drag and drop jobs to reschedule.</CardDescription>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
                        <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                            <Shuffle className="mr-2 h-4 w-4" /> Re-Optimize Schedule
                        </Button>
                    </OptimizeRouteDialog>
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                        <Button size="icon" variant={viewMode === 'day' ? 'default' : 'ghost'} onClick={() => setViewMode('day')}><Grid3x3 className="h-4 w-4" /></Button>
                        <Button size="icon" variant={viewMode === 'month' ? 'default' : 'ghost'} onClick={() => setViewMode('month')}><Calendar className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" className="w-36 md:w-40" onClick={handleToday}>
                        {format(currentDate, viewMode === 'day' ? 'PPP' : 'MMMM yyyy')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
            <Alert className="mt-4 text-sm border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600">
                <Info className="h-4 w-4" />
                <AlertTitle className="font-semibold">Fleetie's Proactive Monitoring</AlertTitle>
                <AlertDescription>
                    Fleetie continuously checks schedules in the background. If a potential delay or issue is detected, an alert will appear on the dashboard.
                </AlertDescription>
            </Alert>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 relative">
            {viewMode === 'day' ? (
            <div ref={containerRef} className="overflow-x-auto">
            <div className="relative">
                <div className="sticky top-0 z-20 h-10 flex border-b bg-muted/50">
                    <div className="w-32 sm:w-48 shrink-0 p-2 font-semibold text-sm flex items-center border-r">Technician</div>
                    <div ref={timelineGridRef} className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                    {hours.map((hour, index) => (
                        <div key={hour.toString()} className={cn("text-center text-xs text-muted-foreground pt-2", index > 0 && "border-l")}>
                        {format(hour, 'ha')}
                        </div>
                    ))}
                    </div>
                </div>

                <div className="relative">
                    {technicians.length > 0 ? technicians.map((tech) => {
                        const techJobs = jobsByTechnician(tech.id);
                        return (
                            <TechnicianRow key={tech.id} technician={tech}>
                                <div className="flex-1 relative h-full">
                                    <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                                    {hours.map((_, index) => (
                                        <div key={index} className={cn("h-full", index > 0 && "border-l", (index % 2 !== 0) && "bg-muted/30")}></div>
                                    ))}
                                    </div>
                                    <div className="relative h-full p-1.5">
                                        {techJobs.map((job, jobIndex) => {
                                            const prevJob = jobIndex > 0 ? techJobs[jobIndex - 1] : null;
                                            const travelStartTime = prevJob?.completedAt ? new Date(prevJob.completedAt) : dayStart;
                                            const travelEndTime = job.enRouteAt ? new Date(job.enRouteAt) : (job.inProgressAt ? new Date(job.inProgressAt) : null);
                                            
                                            return (
                                                <React.Fragment key={job.id}>
                                                    {travelEndTime && <TravelBlock from={travelStartTime} to={travelEndTime} dayStart={dayStart} totalMinutes={totalMinutes} />}
                                                    <JobBlock 
                                                        job={job} 
                                                        dayStart={dayStart} 
                                                        totalMinutes={totalMinutes} 
                                                        onClick={onJobClick}
                                                        isProposed={!!proposedChanges[job.id]}
                                                     />
                                                    {job.breaks?.map((breakItem, breakIndex) => (
                                                        <BreakBlock key={breakIndex} breakItem={breakItem} dayStart={dayStart} totalMinutes={totalMinutes} />
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
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
            ) : (
                technicians.length > 0 ? (
                    <MonthView currentDate={currentDate} jobs={jobs} technicians={technicians} onJobClick={onJobClick} />
                ) : (
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
                )
            )}
            {hasProposedChanges && viewMode === 'day' && (
                <div className="sticky bottom-4 z-30 mx-auto w-fit flex items-center gap-2 rounded-full border bg-background p-2 shadow-lg animate-in fade-in-50">
                    <p className="text-sm font-medium px-2">You have unsaved schedule changes.</p>
                    <Button size="sm" variant="outline" onClick={handleDiscardChanges} disabled={isSaving}>
                        <X className="mr-1.5 h-4 w-4"/>
                        Discard
                    </Button>
                    <Button size="sm" onClick={handleConfirmChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : <Save className="mr-1.5 h-4 w-4" />}
                        Confirm Changes
                    </Button>
                </div>
            )}
        </CardContent>
        </Card>
    </DndContext>
  );
};

export default ScheduleCalendarView;
