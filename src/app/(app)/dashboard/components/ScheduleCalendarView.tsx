
"use client";

import React, { useState } from 'react';
import type { Job, Technician, JobStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-600 border-green-700 text-green-50';
      case 'In Progress': return 'bg-blue-600 border-blue-700 text-blue-50';
      case 'En Route': return 'bg-yellow-500 border-yellow-600 text-yellow-50';
      case 'Assigned': return 'bg-gray-500 border-gray-600 text-gray-50';
      default: return 'bg-gray-400 border-gray-500 text-gray-900';
    }
};

const JobBlock = ({ job, dayStart, totalMinutes }: { job: Job, dayStart: Date, totalMinutes: number }) => {
  if (!job.scheduledTime) return null;

  const jobStart = new Date(job.scheduledTime);
  const offsetMinutes = (jobStart.getTime() - dayStart.getTime()) / 60000;
  const durationMinutes = job.estimatedDurationMinutes || 60;

  const left = (offsetMinutes / totalMinutes) * 100;
  const width = (durationMinutes / totalMinutes) * 100;

  // Don't render jobs that are completely outside the visible timeline
  if ((left + width) < 0 || left > 100) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("absolute h-full p-2 rounded-md text-xs overflow-hidden flex items-center shadow-md", getStatusColor(job.status))}
            style={{ 
              left: `${Math.max(0, left)}%`, 
              width: `${Math.min(100 - Math.max(0, left), width)}%`,
              minWidth: '20px'
            }}
          >
            <Briefcase className="h-3 w-3 mr-1.5 shrink-0" />
            <span className="truncate font-medium">{job.title}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">{job.title}</p>
          <p>Status: {job.status}</p>
          <p>Customer: {job.customerName}</p>
          <p>Scheduled: {format(jobStart, 'p')}</p>
          <p>Duration: {durationMinutes} mins</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


interface ScheduleCalendarViewProps {
  jobs: Job[];
  technicians: Technician[];
}

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ jobs, technicians }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dayStart = startOfDay(currentDate);
  dayStart.setHours(7, 0, 0, 0); // View starts at 7:00 AM
  const dayEnd = startOfDay(currentDate);
  dayEnd.setHours(19, 0, 0, 0); // View ends at 7:00 PM (19:00)

  const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });
  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

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
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="w-36 md:w-40" onClick={handleToday}>
                    {format(currentDate, 'PPP')}
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day"><ChevronRight className="h-4 w-4" /></Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <div className="relative" style={{ minWidth: '900px' }}>
            {/* Timeline Header */}
            <div className="relative h-10 flex border-b bg-muted/50">
              <div className="w-48 shrink-0 p-2 font-semibold text-sm flex items-center">Technician</div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                {hours.map((hour, index) => (
                  <div key={hour.toString()} className={cn("text-center text-xs text-muted-foreground pt-2", index > 0 && "border-l")}>
                    {format(hour, 'ha')}
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Lanes */}
            <div className="divide-y">
              {technicians.length > 0 ? technicians.map(tech => (
                <div key={tech.id} className="flex h-16 items-center">
                  <div className="w-48 shrink-0 p-2 flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                       <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                       <AvatarFallback>{tech.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate">{tech.name}</span>
                  </div>
                  <div className="flex-1 relative h-full">
                     {/* Background grid lines */}
                     <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                        {hours.map((_, index) => (
                            <div key={index} className={cn("h-full", index > 0 && "border-l")}></div>
                        ))}
                    </div>
                    {/* Job blocks container */}
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCalendarView;
