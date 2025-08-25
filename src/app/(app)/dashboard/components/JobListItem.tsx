
"use client";

import React from 'react';
import { Briefcase, MapPin, AlertTriangle, CheckCircle, Edit, Users2, ListChecks, MessageSquare, Share2, Truck, XCircle, FilePenLine, Bot, Wrench, MapIcon, UserCheck, Eye, Clock, Lock, Repeat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Job, Technician, Location } from '@/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';

interface JobListItemProps {
  job: Job;
  technicians: Technician[];
  onOpenChat: (job: Job) => void;
  onAIAssign: (job: Job) => void;
  onViewOnMap: (location: Location) => void;
  onShareTracking: (job: Job) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ 
    job, 
    technicians, 
    onOpenChat, 
    onAIAssign, 
    onViewOnMap,
    onShareTracking,
}) => {
  const isLocked = job.dispatchLocked || job.flexibility === 'fixed';
  
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: job.id,
    data: {
      type: 'job',
      job,
    },
    disabled: isLocked,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100, // Keep on top while dragging
  } : undefined;

  const getPriorityBadgeVariant = (priority: Job['priority']): "default" | "secondary" | "destructive" | "outline" => {
    if (priority === 'High') return 'destructive';
    if (priority === 'Medium') return 'default'; 
    return 'secondary';
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'Unassigned': return <AlertTriangle className="text-amber-500" />;
      case 'Assigned': return <UserCheck className="text-sky-500" />;
      case 'En Route': return <Truck className="text-indigo-500" />;
      case 'In Progress': return <Wrench className="text-blue-500" />;
      case 'Completed': return <CheckCircle className="text-green-500" />;
      case 'Cancelled': return <XCircle className="text-destructive" />;
      case 'Draft': return <FilePenLine className="text-gray-500" />;
      default: return <Briefcase />;
    }
  };

  const isHighPriorityUnassigned = job.priority === 'High' && job.status === 'Unassigned';
  const isMediumOrLowPriorityUnassigned = (job.priority === 'Medium' || job.priority === 'Low') && job.status === 'Unassigned';
  const isFlexible = job.flexibility === 'flexible';
  const isDraft = job.status === 'Draft';
  
  const isUnassigned = job.status === 'Unassigned' && !job.assignedTechnicianId;
  const isRoutable = (job.status === 'Assigned' || job.status === 'En Route' || job.status === 'In Progress') && job.assignedTechnicianId;
  const assignedTechnician = job.assignedTechnicianId ? technicians.find(t => t.id === job.assignedTechnicianId) : null;
  
  const JobCardWrapper = ({ children }: { children: React.ReactNode }) => (
     <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <Card className={cn(
          "hover:shadow-md transition-shadow duration-200",
          !isLocked && "cursor-grab",
          isLocked && "cursor-not-allowed",
          isHighPriorityUnassigned && "border-destructive bg-destructive/5",
          isMediumOrLowPriorityUnassigned && "border-amber-400 bg-amber-50",
          isFlexible && !isDraft && "border-dashed",
          isDraft && "border-gray-400 bg-gray-50/50"
        )}>
            {children}
        </Card>
     </div>
  );

  const cardContent = (
    <>
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className={cn("text-lg font-headline flex items-start gap-2", 
                  isHighPriorityUnassigned && "text-destructive",
                  isMediumOrLowPriorityUnassigned && "text-amber-900",
                  isDraft && "text-gray-600"
                )}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex-shrink-0 mt-1">{getStatusIcon(job.status)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{job.status}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {isLocked && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Job is locked and cannot be moved.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                   {isFlexible && (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Repeat className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This is a flexible job that can be optimized.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span className="truncate">{job.title}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm mt-1">
                  <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{job.location.address || `Lat: ${job.location.latitude.toFixed(2)}, Lon: ${job.location.longitude.toFixed(2)}`}</span>
                </CardDescription>
              </div>
              <Badge variant={getPriorityBadgeVariant(job.priority)} className="shrink-0">{job.priority}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm pb-3">
            <div className="flex items-center gap-2">
                <span className="font-medium">{job.customerName}</span>
            </div>
            <p className="text-muted-foreground line-clamp-2">{job.description}</p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div>
                {job.scheduledTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Scheduled: {new Date(job.scheduledTime).toLocaleString()}
                  </span>
                )}
              </div>
              <div>
                {assignedTechnician ? (
                  <Link href={`/technician/jobs/${assignedTechnician.id}`} className="flex items-center gap-1 font-medium text-primary hover:underline">
                    <Wrench className="h-3 w-3" /> {assignedTechnician.name}
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t pt-3 pb-3">
             {isUnassigned && (
                <Button variant="accent" size="sm" onClick={(e) => { e.preventDefault(); onAIAssign(job); }} className="w-full">
                    <Bot className="mr-1 h-3 w-3" /> Fleety Assign
                </Button>
            )}
            {isRoutable && (
              <>
                <Button variant="outline" size="sm" onClick={() => onShareTracking(job)} className="w-full">
                    <Share2 className="mr-2 h-3 w-3 text-primary" /> Share Tracking
                </Button>
                <Button variant="outline" size="sm" onClick={() => onOpenChat(job)} className="w-full">
                    <MessageSquare className="mr-1 h-3 w-3 text-primary" /> Chat with Dispatch
                </Button>
              </>
            )}
             <Button variant="outline" size="sm" onClick={() => onViewOnMap(job.location)} className="w-full">
                <MapIcon className="mr-2 h-3 w-3" /> View on Map
            </Button>
            <Link href={`/job/${job.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                   <Eye className="mr-2 h-4 w-4" /> View/Edit
                </Button>
            </Link>
          </CardFooter>
    </>
  );
  
  if (isLocked) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <JobCardWrapper>{cardContent}</JobCardWrapper>
                </TooltipTrigger>
                <TooltipContent>
                    <p>This job is locked and cannot be moved by drag-and-drop.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
  }

  return <JobCardWrapper>{cardContent}</JobCardWrapper>;
};

export default JobListItem;

