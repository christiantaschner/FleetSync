
"use client";

import React from 'react';
import { Briefcase, MapPin, User, Clock, AlertTriangle, CheckCircle, Zap, Edit, Users2, Star } from 'lucide-react';
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
import AddEditJobDialog from './AddEditJobDialog';

interface JobListItemProps {
  job: Job;
  technicians: Technician[];
  onAssignWithAI: (job: Job) => void;
  onJobUpdated: (job: Job, assignedTechnicianId?: string | null) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ job, technicians, onAssignWithAI, onJobUpdated }) => {
  const assignedTechnician = technicians.find(t => t.id === job.assignedTechnicianId);

  const getPriorityBadgeVariant = (priority: Job['priority']): "default" | "secondary" | "destructive" | "outline" => {
    if (priority === 'High') return 'destructive';
    if (priority === 'Medium') return 'default'; 
    return 'secondary';
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return <AlertTriangle className="text-yellow-500" />;
      case 'Assigned': return <User className="text-primary" />; 
      case 'En Route': return <Zap className="text-accent" />; 
      case 'In Progress': return <Clock className="text-indigo-500" />; 
      case 'Completed': return <CheckCircle className="text-green-500" />;
      case 'Cancelled': return <AlertTriangle className="text-destructive" />;
      default: return <Briefcase />;
    }
  };

  const isHighPriorityPending = job.priority === 'High' && job.status === 'Pending';

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
      <CardContent className="space-y-2 text-sm pb-3">
        <p className="text-muted-foreground line-clamp-2">{job.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {job.scheduledTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Scheduled: {new Date(job.scheduledTime).toLocaleDateString()} {new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div>
            {assignedTechnician ? (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {assignedTechnician.name}
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
        {job.status === 'Pending' && (
          <Button variant="outline" size="sm" onClick={() => onAssignWithAI(job)}>
            <Users2 className="mr-1 h-3 w-3" /> Assign (AI)
          </Button>
        )}
         <AddEditJobDialog job={job} technicians={technicians} onJobAddedOrUpdated={onJobUpdated}>
            <Button variant="secondary" size="sm">
                <Edit className="mr-1 h-3 w-3" /> Edit
            </Button>
        </AddEditJobDialog>
      </CardFooter>
    </Card>
  );
};

export default JobListItem;

