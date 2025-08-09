

"use client";

import React from 'react';
import Image from 'next/image';
import { MapPin, UserCircle, Phone, Clock, AlertTriangle, Edit, Info, CalendarDays, Users, FileSignature, ThumbsUp, Smile, Star, Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Job } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface JobDetailsDisplayProps {
  job: Job;
}

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
               <Link href={`/customers?search=${encodeURIComponent(job.customerName)}`} className="font-medium text-foreground hover:underline hover:text-primary transition-colors">
                {job.customerName}
              </Link>
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
        
        {(job.customerSignatureUrl || job.customerSatisfactionScore) && (
          <>
            <Separator />
            <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><ThumbsUp /> Customer Feedback</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.customerSignatureUrl && (
                        <div>
                            <p className="font-medium text-foreground flex items-center gap-1"><FileSignature size={14}/> Signature</p>
                            <div className="p-2 border rounded-md bg-muted/50 max-w-sm mt-1">
                                <Image src={job.customerSignatureUrl} alt="Customer Signature" width={400} height={200} className="w-full h-auto" />
                            </div>
                            {job.customerSignatureTimestamp && <p className="text-xs text-muted-foreground mt-1">Signed on: {new Date(job.customerSignatureTimestamp).toLocaleString()}</p>}
                        </div>
                    )}
                    {job.customerSatisfactionScore && (
                         <div>
                            <p className="font-medium text-foreground flex items-center gap-1"><Smile size={14}/> Rating</p>
                             <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                   <Star key={star} className={cn("h-6 w-6", job.customerSatisfactionScore && job.customerSatisfactionScore >= star ? "text-yellow-400" : "text-gray-300")} fill="currentColor"/>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </>
        )}

        <Separator />

         <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><Clock />Timestamps &amp; History</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-2 text-xs">
                <div>
                    <p className="font-medium text-foreground">Created</p>
                    <p className="text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                 {job.enRouteAt && (
                    <div>
                        <p className="font-medium text-foreground">Departed</p>
                        <p className="text-muted-foreground">{new Date(job.enRouteAt).toLocaleString()}</p>
                    </div>
                 )}
                 {job.inProgressAt && (
                    <div>
                        <p className="font-medium text-foreground">Started Work</p>
                        <p className="text-muted-foreground">{new Date(job.inProgressAt).toLocaleString()}</p>
                    </div>
                 )}
                  {job.completedAt && (
                    <div>
                        <p className="font-medium text-foreground">Completed</p>
                        <p className="text-muted-foreground">{new Date(job.completedAt).toLocaleString()}</p>
                    </div>
                 )}
                <div>
                    <p className="font-medium text-foreground">Last Updated</p>
                    <p className="text-muted-foreground">{new Date(job.updatedAt).toLocaleString()}</p>
                </div>
            </div>
             {job.breaks && job.breaks.length > 0 && (
                <div className="mt-4">
                     <h4 className="font-medium text-foreground text-xs flex items-center gap-1"><Timer size={14}/> Break History</h4>
                     <ul className="list-disc pl-5 mt-1 text-xs text-muted-foreground">
                        {job.breaks.map((b, index) => (
                            <li key={index}>
                                {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                {b.end ? ` ${new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Ongoing)'}
                                {b.end && <span className="font-semibold text-foreground ml-2">({formatDuration(new Date(b.end).getTime() - new Date(b.start).getTime())})</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDetailsDisplay;
