

"use client";

import React, from 'react';
import { Briefcase, MapPin, AlertTriangle, CheckCircle, Edit, Users2, ListChecks, MessageSquare, Share2, Truck, XCircle, FilePenLine, Bot, Wrench, MapIcon, UserCheck, Eye } from 'lucide-react';
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

interface JobListItemProps {
  job: Job;
  technicians: Technician[];
  onOpenChat: (job: Job) => void;
  onAIAssign: (job: Job) => void;
  onViewOnMap: (location: Location) => void;
  onShareTracking: (job: Job) => void;
  onEdit: (job: Job) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ 
    job, 
    technicians, 
    onOpenChat, 
    onAIAssign, 
    onViewOnMap,
    onShareTracking,
    onEdit,
}) => {

  const getPriorityBadgeVariant = (priority: Job['priority']): "default" | "secondary" | "destructive" | "outline" => {
    if (priority === 'High') return 'destructive';
    if (priority === 'Medium') return 'default'; 
    return 'secondary';
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return <AlertTriangle className="text-amber-500" />;
      case 'Assigned': return <UserCheck className="text-sky-500" />;
      case 'En Route': return <Truck className="text-indigo-500" />;
      case 'In Progress': return <Wrench className="text-blue-500" />;
      case 'Completed': return <CheckCircle className="text-green-500" />;
      case 'Cancelled': return <XCircle className="text-destructive" />;
      case 'Draft': return <FilePenLine className="text-gray-500" />;
      default: return <Briefcase />;
    }
  };

  const isHighPriorityPending = job.priority === 'High' && job.status === 'Pending';
  const isMediumOrLowPriorityPending = (job.priority === 'Medium' || job.priority === 'Low') && job.status === 'Pending';
  const isDraft = job.status === 'Draft';
  
  const isUnassigned = job.status === 'Pending' && !job.assignedTechnicianId;
  const isRoutable = (job.status === 'Assigned' || job.status === 'En Route' || job.status === 'In Progress') && job.assignedTechnicianId;
  const assignedTechnician = job.assignedTechnicianId ? technicians.find(t => t.id === job.assignedTechnicianId) : null;

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow duration-200",
      isHighPriorityPending && "border-destructive bg-destructive/5",
      isMediumOrLowPriorityPending && "border-amber-400 bg-amber-50",
      isDraft && "border-dashed border-gray-400 bg-gray-50/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className={cn("text-lg font-headline flex items-center gap-2", 
              isHighPriorityPending && "text-destructive",
              isMediumOrLowPriorityPending && "text-amber-900",
              isDraft && "text-gray-600"
            )}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{getStatusIcon(job.status)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{job.status === 'Pending' ? 'Unassigned' : job.status}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Wrench className="h-3 w-3" /> {assignedTechnician.name}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                Unassigned
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-3 pb-3">
         {isUnassigned && (
            <Button variant="accent" size="sm" onClick={(e) => { e.preventDefault(); onAIAssign(job); }}>
                <Bot className="mr-1 h-3 w-3" /> Fleety Assign
            </Button>
        )}
        {isRoutable && (
          <>
            <Button variant="outline" size="sm" onClick={() => onShareTracking(job)}>
                <Share2 className="mr-2 h-3 w-3 text-primary" /> Share Tracking
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChat(job)}>
                <MessageSquare className="mr-1 h-3 w-3 text-primary" /> Chat
            </Button>
          </>
        )}
         <Button variant="outline" size="sm" onClick={() => onViewOnMap(job.location)}>
            <MapIcon className="mr-2 h-3 w-3" /> View on Map
        </Button>
        <Link href={`/job/${job.id}`}>
          <Button variant="secondary" className="bg-secondary hover:bg-muted" size="sm">
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default JobListItem;

