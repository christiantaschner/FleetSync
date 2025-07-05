
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Job, Technician, JobStatus, Location } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachDay, addMonths, subMonths, isSameMonth, getDay, isBefore, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase, User, Circle, ShieldQuestion, Shuffle, Calendar, Grid3x3, UserPlus } from 'lucide-react';
import OptimizeRouteDialog from './optimize-route-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

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

const JobBlock = ({ job, dayStart, totalMinutes }: { job: Job, dayStart: Date, totalMinutes: number }) => {
  if (!job.scheduledTime) return null;

  const jobStart = new Date(job.scheduledTime);
  const offsetMinutes = (jobStart.getTime() - dayStart.getTime()) / 60000;
  const durationMinutes = job.estimatedDurationMinutes || 60;

  const left = (offsetMinutes / totalMinutes) * 100;
  const width = (durationMinutes / totalMinutes) * 100;

  if (left > 100 || (left + width) < 0) return null;

  const priorityColor = job.priority === 'High' ? 'ring-destructive' : job.priority === 'Medium' ? 'ring-yellow-500' : 'ring-gray-300';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute h-full p-2 rounded-md text-xs overflow-hidden flex items-center shadow-sm cursor-pointer ring-1 ring-inset",
              getStatusAppearance(job.status),
              priorityColor
            )}
            style={{ 
              left: `${Math.max(0, left)}%`, 
              width: `${Math.min(100 - Math.max(0, left), width)}%`,
              minWidth: '20px'
            }}
          >
            <div className="flex flex-col w-full truncate">
                <span className="font-bold truncate">{format(jobStart, 'p')}</span>
                <span className="truncate">{job.customerName}</span>
                <span className="text-muted-foreground truncate italic">{job.title}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-background border shadow-xl p-3 max-w-xs">
          <p className="font-bold text-base mb-1">{job.title}</p>
          <p className="text-sm"><strong>Status:</strong> {job.status}</p>
          <p className="text-sm"><strong>Priority:</strong> {job.priority}</p>
          <p className="text-sm"><strong>Customer:</strong> {job.customerName}</p>
          <p className="text-sm"><strong>Address:</strong> {job.location.address}</p>
          <p className="text-sm"><strong>Scheduled:</strong> {format(jobStart, 'PP p')}</p>
          <p className="text-sm"><strong>Duration:</strong> {durationMinutes} mins</p>
          {job.description && <p className="text-sm mt-2 pt-2 border-t"><strong>Notes:</strong> {job.description}</p>}
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
const getTechnicianColor = (technicianId: string) => {
    let hash = 0;
    for (let i = 0; i < technicianId.length; i++) {
        hash = technicianId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % technicianColors.length);
    return technicianColors[index];
};

const MonthView = ({ currentDate, jobs, technicians }: { currentDate: Date, jobs: Job[], technicians: Technician[] }) => {
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
                                                    <Badge className={cn("w-full justify-start truncate text-white", getTechnicianColor(job.assignedTechnicianId!))}>
                                                        {technicians.find(t => t.id === job.assignedTechnicianId)?.name.split(' ')[0]}: {job.title}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-bold">{job.title}</p>
                                                    <p>{technicians.find(t => t.id === job.assignedTechnicianId)?.name}</p>
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


interface ScheduleCalendarViewProps {
  jobs: Job[];
  technicians: Technician[];
  onCheckScheduleHealth: () => void;
  isCheckingHealth: boolean;
  busyTechniciansCount: number;
}

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ 
    jobs, 
    technicians,
    onCheckScheduleHealth,
    isCheckingHealth,
    busyTechniciansCount
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const containerRef = useRef<HTMLDivElement>(null);

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


  const jobsByTechnician = (techId: string) => {
    const startOfDayDate = startOfDay(currentDate);
    const endOfDayDate = endOfDay(currentDate);
    return jobs.filter(job =>
      job.assignedTechnicianId === techId &&
      job.scheduledTime &&
      new Date(job.scheduledTime) >= startOfDayDate &&
      new Date(job.scheduledTime) <= endOfDayDate
    );
  };
  
  const handlePrev = () => setCurrentDate(viewMode === 'day' ? subDays(currentDate, 1) : subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(viewMode === 'day' ? addDays(currentDate, 1) : addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="font-headline">Technician Schedule</CardTitle>
                <CardDescription>Daily timeline view of technician assignments.</CardDescription>
            </div>
            <div className="flex items-center flex-wrap gap-2">
                 <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
                    <Button variant="accent" disabled={busyTechniciansCount === 0}>
                        <Shuffle className="mr-2 h-4 w-4" /> Re-Optimize Schedule
                    </Button>
                </OptimizeRouteDialog>
                <Button variant="outline" onClick={onCheckScheduleHealth} disabled={busyTechniciansCount === 0 || isCheckingHealth} className="hover:bg-primary hover:text-primary-foreground">
                    <ShieldQuestion className="mr-2 h-4 w-4" /> Find Schedule Risks
                </Button>
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
      </CardHeader>
      <CardContent className="min-h-[500px] p-0 sm:p-6">
        {viewMode === 'day' ? (
        <div className="w-full overflow-x-auto" ref={containerRef}>
          <div className="relative" style={{ minWidth: '1200px' }}>
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
                  {technicians.length > 0 ? technicians.map(tech => (
                  <div key={tech.id} className="flex h-20 items-center border-t">
                      <div className="w-48 shrink-0 p-2 flex items-center gap-2 border-r h-full bg-background">
                      <Avatar className="h-9 w-9">
                          <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                          <AvatarFallback>{tech.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                          <span className="font-medium text-sm truncate block">{tech.name}</span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Circle className={cn("h-2 w-2 fill-current", tech.isAvailable ? "text-green-500" : "text-red-500")} />
                              <span>{tech.isAvailable ? 'Available' : 'Unavailable'}</span>
                          </div>
                      </div>
                      </div>
                      <div className="flex-1 relative h-full">
                          <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                          {hours.map((_, index) => (
                              <div key={index} className={cn("h-full", index > 0 && "border-l", (index % 2 !== 0) && "bg-muted/30")}></div>
                          ))}
                      </div>
                      <div className="relative h-full p-1.5">
                          {jobsByTechnician(tech.id).map(job => (
                          <JobBlock key={job.id} job={job} dayStart={dayStart} totalMinutes={totalMinutes} />
                          ))}
                      </div>
                      </div>
                  </div>
                  )) : (
                    <Alert variant="default" className="m-4">
                        <UserPlus className="h-4 w-4" />
                        <AlertTitle className="font-semibold">No Technicians Found</AlertTitle>
                        <AlertDescription>
                            Your schedule is empty because no technicians have been created yet. Technicians are added by inviting them as a new user with the 'Technician' role. Go to{' '}
                            <Link href="/settings?tab=users" className="font-bold underline">
                                Settings &gt; User Management
                            </Link>
                            {' '}to send an invite.
                        </AlertDescription>
                    </Alert>
                  )}
                  <CurrentTimeIndicator dayStart={dayStart} totalMinutes={totalMinutes} />
              </div>
          </div>
        </div>
         ) : (
            technicians.length > 0 ? (
                <MonthView currentDate={currentDate} jobs={jobs} technicians={technicians} />
            ) : (
                <Alert variant="default" className="m-4">
                    <UserPlus className="h-4 w-4" />
                    <AlertTitle className="font-semibold">No Technicians Found</AlertTitle>
                    <AlertDescription>
                        Your schedule is empty because no technicians have been created yet. Technicians are added by inviting them as a new user with the 'Technician' role. Go to{' '}
                        <Link href="/settings?tab=users" className="font-bold underline">
                            Settings &gt; User Management
                        </Link>
                        {' '}to send an invite.
                    </AlertDescription>
                </Alert>
            )
         )}
      </CardContent>
    </Card>
  );
};

export default ScheduleCalendarView;
