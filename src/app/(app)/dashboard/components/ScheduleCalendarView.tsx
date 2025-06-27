
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Job, Technician, JobStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase, Clock, User, MapPin, Circle, ShieldQuestion, Shuffle } from 'lucide-react';
import OptimizeRouteDialog from './optimize-route-dialog';

// Color mapping for job blocks based on status
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
      // Set initial time on client mount to avoid hydration mismatch
      setCurrentTime(new Date());

      const timer = setInterval(() => {
          setCurrentTime(new Date());
      }, 60000); // Update every minute
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
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  const dayStart = useMemo(() => {
    const d = startOfDay(currentDate);
    d.setHours(7, 0, 0, 0); // View starts at 7:00 AM
    return d;
  }, [currentDate]);

  const dayEnd = useMemo(() => {
    const d = startOfDay(currentDate);
    d.setHours(19, 0, 0, 0); // View ends at 7:00 PM (19:00)
    return d;
  }, [currentDate]);

  const hours = useMemo(() => eachHourOfInterval({ start: dayStart, end: dayEnd }), [dayStart, dayEnd]);
  const totalMinutes = useMemo(() => (dayEnd.getTime() - dayStart.getTime()) / 60000, [dayStart, dayEnd]);

  useEffect(() => {
    if (containerRef.current && isSameDay(currentDate, new Date())) {
        const now = new Date();
        const startHour = dayStart.getHours();
        const currentHour = now.getHours();
        const scrollPosition = (containerRef.current.scrollWidth / hours.length) * (currentHour - startHour - 1);
        containerRef.current.scrollLeft = scrollPosition > 0 ? scrollPosition : 0;
    }
  }, [currentDate, dayStart, hours.length]);


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
  
  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
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
                    <Button variant="outline" disabled={busyTechniciansCount === 0}>
                        <Shuffle className="mr-2 h-4 w-4" /> Re-Optimize Route
                    </Button>
                </OptimizeRouteDialog>
                 <Button variant="outline" onClick={onCheckScheduleHealth} disabled={busyTechniciansCount === 0 || isCheckingHealth}>
                    <ShieldQuestion className="mr-2 h-4 w-4" /> Find Schedule Risks
                </Button>
                <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="w-36 md:w-40" onClick={handleToday}>
                    {format(currentDate, 'PPP')}
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day"><ChevronRight className="h-4 w-4" /></Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg" ref={containerRef}>
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
                            <div key={index} className={cn("h-full bg-white", index > 0 && "border-l", (index % 2 !== 0) && "bg-muted/30")}></div>
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
                 <div className="text-center py-16 text-muted-foreground">No technicians have been added yet.</div>
              )}
               <CurrentTimeIndicator dayStart={dayStart} totalMinutes={totalMinutes} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCalendarView;
