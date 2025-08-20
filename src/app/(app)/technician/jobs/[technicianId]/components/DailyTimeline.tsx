
"use client";

import React from 'react';
import type { Job } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Briefcase, Car, Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DailyTimelineProps {
  jobs: Job[];
}

const DailyTimeline: React.FC<DailyTimelineProps> = ({ jobs }) => {
  let lastDate: string | null = null;

  return (
    <div className="relative pl-6">
      {/* The timeline's vertical line */}
      <div className="absolute left-6 top-0 h-full w-0.5 bg-border" />
      <div className="space-y-8">
        {jobs.map((job, index) => {
          if (!job.scheduledTime) return null;

          const jobDate = new Date(job.scheduledTime);
          const jobDateString = format(jobDate, 'PPPP'); // e.g., "Tuesday, October 26, 2021"
          const showDateHeader = jobDateString !== lastDate;
          lastDate = jobDateString;

          const travelTimeMinutes = 30; // Placeholder for travel time

          return (
            <React.Fragment key={job.id}>
              {showDateHeader && (
                <div className="relative">
                  <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-secondary flex items-center justify-center border-4 border-background">
                     <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="ml-6">
                    <h3 className="font-bold text-lg text-foreground">{jobDateString}</h3>
                    <Separator className="my-2"/>
                  </div>
                </div>
              )}

              <div className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary" />
                <div className="ml-6 space-y-2">
                  <p className="font-bold text-lg text-primary">
                    {format(jobDate, 'p')}
                  </p>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-base">{job.title}</h4>
                          <Badge variant={job.priority === 'High' ? 'destructive' : 'default'} className="shrink-0">{job.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> {job.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Est. {job.estimatedDurationMinutes} mins
                      </p>
                      <div className="pt-2">
                         <Link href={`/technician/${job.id}`}>
                           <Button variant="secondary" size="sm" className="w-full">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Travel Time Connector */}
                {index < jobs.length - 1 && !isSameDay(jobDate, new Date(jobs[index+1].scheduledTime!)) ? null : (index < jobs.length - 1 && (
                  <div className="relative h-12 ml-6">
                    <div className="absolute left-[-18px] top-0 h-full w-0.5 bg-border" />
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border">
                        <Car className="h-3 w-3" />
                        <span>~{travelTimeMinutes} min travel</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default DailyTimeline;
