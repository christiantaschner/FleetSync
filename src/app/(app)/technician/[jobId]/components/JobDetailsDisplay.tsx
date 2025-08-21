"use client";

import React from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, UserCircle, Briefcase, ListChecks, Calendar, Clock, MessageSquare, Bot } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface JobDetailsDisplayProps {
    job: Job;
}

const JobDetailsDisplay: React.FC<JobDetailsDisplayProps> = ({ job }) => {
    
    const getStatusBadgeVariant = (status: Job['status']): "default" | "secondary" | "destructive" | "outline" => {
        switch(status) {
            case 'Completed': return 'secondary';
            case 'Cancelled': return 'destructive';
            case 'In Progress':
            case 'En Route': return 'default';
            default: return 'outline';
        }
    }
    
    const getPriorityBadgeVariant = (priority: Job['priority']): "default" | "secondary" | "destructive" | "outline" => {
        if (priority === 'High') return 'destructive';
        if (priority === 'Medium') return 'default';
        return 'secondary';
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="text-2xl font-bold font-headline">{job.title}</CardTitle>
                        <CardDescription className="text-base flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" /> {job.location.address || `Lat: ${job.location.latitude}, Lon: ${job.location.longitude}`}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">{job.status}</Badge>
                        <Badge variant={getPriorityBadgeVariant(job.priority)}>{job.priority}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                     <div className="flex items-center gap-3">
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground text-xs">Customer</p>
                            <p className="font-medium">{job.customerName}</p>
                            <p className="text-xs">{job.customerPhone || 'No phone'}</p>
                        </div>
                    </div>
                    {job.scheduledTime && (
                         <div className="flex items-center gap-3">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground text-xs">Scheduled Time</p>
                                <p className="font-medium">{format(new Date(job.scheduledTime), 'PPp')}</p>
                            </div>
                        </div>
                    )}
                </div>
                 <div>
                    <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Briefcase className="h-4 w-4"/>Job Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                     <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ListChecks className="h-4 w-4"/>Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map(skill => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                 {(job.aiIdentifiedModel || (job.aiSuggestedParts && job.aiSuggestedParts.length > 0) || job.aiRepairGuide) && (
                     <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Bot className="h-4 w-4"/> AI Triage Analysis</h3>
                        <div className="space-y-1 text-sm p-3 bg-secondary/50 rounded-md border">
                           <p><strong>Identified Model:</strong> {job.aiIdentifiedModel || 'Not identified'}</p>
                           <p><strong>Suggested Parts:</strong> {job.aiSuggestedParts?.join(', ') || 'None'}</p>
                           {job.aiRepairGuide && <div><p><strong>Repair Guide:</strong></p><p className="whitespace-pre-wrap text-muted-foreground text-xs italic">{job.aiRepairGuide}</p></div>}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default JobDetailsDisplay;
