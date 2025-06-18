
"use client";

import React from 'react';
import { MapPin, UserCircle, Phone, Clock, AlertTriangle, Edit, Info, CalendarDays, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Job } from '@/types';

interface JobDetailsDisplayProps {
  job: Job;
}

const JobDetailsDisplay: React.FC<JobDetailsDisplayProps> = ({ job }) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="text-2xl font-bold mb-2 sm:mb-0 font-headline">{job.title}</CardTitle>
          <Badge 
            variant={job.priority === 'High' ? 'destructive' : job.priority === 'Medium' ? 'default' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            <AlertTriangle size={14} className="mr-1" /> {job.priority} Priority
          </Badge>
        </div>
        <CardDescription className="text-base">
          Status: <span className="font-semibold text-primary">{job.status}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1 text-muted-foreground flex items-center gap-1"><Info />Description</h3>
          <p className="text-foreground">{job.description}</p>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><MapPin/>Location &amp; Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-foreground">{job.customerName}</p>
              <p className="text-muted-foreground">{job.location.address || `Lat: ${job.location.latitude.toFixed(4)}, Lon: ${job.location.longitude.toFixed(4)}`}</p>
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-1"><Phone size={14}/>{job.customerPhone}</p>
            </div>
          </div>
        </div>

        <Separator />
        
        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><CalendarDays/>Scheduling &amp; Timing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-foreground">Scheduled Time</p>
              <p className="text-muted-foreground">{job.scheduledTime ? new Date(job.scheduledTime).toLocaleString() : 'Not specified'}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Estimated Duration</p>
              <p className="text-muted-foreground">{job.estimatedDurationMinutes ? `${job.estimatedDurationMinutes} minutes` : 'Not specified'}</p>
            </div>
          </div>
        </div>

        {job.notes && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-1 text-muted-foreground flex items-center gap-1"><Edit/>Dispatcher Notes</h3>
              <p className="text-foreground whitespace-pre-wrap">{job.notes}</p>
            </div>
          </>
        )}

        <Separator />

         <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><Clock />Timestamps</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                    <p className="font-medium text-foreground">Created At</p>
                    <p className="text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div>
                    <p className="font-medium text-foreground">Last Updated</p>
                    <p className="text-muted-foreground">{new Date(job.updatedAt).toLocaleString()}</p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDetailsDisplay;
