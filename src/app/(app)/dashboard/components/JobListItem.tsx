
"use client";

import React from 'react';
import { Briefcase, MapPin, User, Clock, AlertTriangle, CheckCircle, Edit, Users2, Star, ListChecks, Package, MessageSquare, Share2, Truck, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Job, Technician } from '@/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

interface JobListItemProps {
  job: Job;
  onAssignWithAI: (job: Job) => void;
  onOpenChat: (job: Job) => void;
  onShareTracking: (job: Job) => void;
  onEdit: (job: Job) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ job, onAssignWithAI, onOpenChat, onShareTracking, onEdit }) => {
  const getPriorityBadgeVariant = (priority: Job['priority']): "default" | "secondary" | "destructive" | "outline" => {
    if (priority === 'High') return 'destructive';
    if (priority === 'Medium') return 'default'; 
    return 'secondary';
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return <AlertTriangle className="text-amber-500" />;
      case 'Assigned': return <User className="text-sky-500" />;
      case 'En Route': return <Truck className="text-indigo-500" />;
      case 'In Progress': return <Clock className="text-blue-500" />;
      case 'Completed': return <CheckCircle className="text-green-500" />;
      case 'Cancelled': return <XCircle className="text-destructive" />;
      default: return <Briefcase />;
    }
  };

  const isHighPriorityPending = job.priority === 'High' && job.status === 'Pending';
  const canShareTracking = job.status === 'Assigned' || job.status === 'En Route' || job.status === 'In Progress';

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow duration-200 ease-in-out",
      isHighPriorityPending && "border-destructive border-2 ring-2 ring-destructive/50 bg-destructive/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-lg font-headline flex items-center gap-2", isHighPriorityPending && "text-destructive")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{getStatusIcon(job.status)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{job.status}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isHighPriorityPending && <Star className="h-5 w-5 text-destructive fill-destructive" />}
            {job.title}
          </CardTitle>
          <Badge variant={getPriorityBadgeVariant(job.priority)}>{job.priority}</Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3" /> {job.location.address || `Lat: ${job.location.latitude.toFixed(2)}, Lon: ${job.location.longitude.toFixed(2)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm pb-3">
        <p className="text-muted-foreground line-clamp-2">{job.description}</p>
        
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
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {job.scheduledTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Scheduled: {new Date(job.scheduledTime).toLocaleDateString()} {new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div>
            {job.assignedTechnicianId ? (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {job.assignedTechnicianId}
              </span>
            ) : (
              <span className={cn("flex items-center gap-1", job.status === 'Pending' ? 'text-accent font-semibold' : 'text-muted-foreground')}>
                <AlertTriangle className="h-3 w-3" /> Unassigned
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-3 pb-3">
        {job.status !== 'Pending' && job.assignedTechnicianId && (
            <Button variant="outline" size="sm" onClick={() => onOpenChat(job)}>
                <MessageSquare className="mr-1 h-3 w-3" /> Chat
            </Button>
        )}
        {canShareTracking && (
            <Button variant="outline" size="sm" onClick={() => onShareTracking(job)}>
                <Share2 className="mr-1 h-3 w-3" /> Share Tracking
            </Button>
        )}
        {job.status === 'Pending' && (
          <Button variant="outline" size="sm" onClick={() => onAssignWithAI(job)}>
            <Users2 className="mr-1 h-3 w-3" /> Assign (AI)
          </Button>
        )}
         <Button variant="secondary" size="sm" onClick={() => onEdit(job)}>
            <Edit className="mr-1 h-3 w-3" /> Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobListItem;

    