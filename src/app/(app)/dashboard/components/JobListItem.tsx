
"use client";

import React from 'react';
import { Briefcase, MapPin, AlertTriangle, CheckCircle, Edit, Users2, ListChecks, MessageSquare, Share2, Truck, XCircle, FilePenLine, Bot, Wrench, MapIcon, UserCheck, Eye, Clock, Lock, Repeat, DollarSign, ChevronDown } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  
  const profitPerHour = (job.profitScore && job.estimatedDurationMinutes) 
    ? (job.profitScore / job.estimatedDurationMinutes) * 60 
    : 0;

  const getProfitColorClass = (score: number | undefined) => {
    if (score === undefined) return '';
    if (score > 150) return 'border-green-400 bg-green-50/50';
    if (score > 50) return 'border-amber-400 bg-amber-50/50';
    if (score > 0) return 'border-red-400 bg-red-50/50';
    return 'border-gray-300';
  };

  return (
     <div ref={setNodeRef} style={style} {...attributes}>
        <Card className={cn(
          "hover:shadow-md transition-shadow duration-200",
          getProfitColorClass(job.profitScore),
          job.status === 'Draft' && "border-gray-400 bg-gray-50/50"
        )}>
            <Accordion type="single" collapsible>
                <AccordionItem value={job.id} className="border-b-0">
                    <div className={cn("flex items-center", !isLocked && "cursor-grab")} {...listeners}>
                        <AccordionTrigger className="flex-1 p-4 hover:no-underline">
                            <div className="flex items-start justify-between gap-4 w-full">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className={cn("text-base font-headline flex items-start gap-2", 
                                    job.status === 'Draft' && "text-gray-600"
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
                                    <span className="truncate text-left">{job.title}</span>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1 text-sm mt-1">
                                       <Users2 className="h-3 w-3 shrink-0" /> <span className="truncate">{job.customerName}</span>
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-right">
                                    <Badge variant={getPriorityBadgeVariant(job.priority)} className="shrink-0">{job.priority}</Badge>
                                    {job.assignedTechnicianId ? (
                                        <Badge variant="secondary" className="max-w-[150px]">
                                            <UserCheck className="h-3 w-3 mr-1"/>
                                            <span className="truncate">{technicians.find(t => t.id === job.assignedTechnicianId)?.name}</span>
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Unassigned</Badge>
                                    )}
                                </div>
                            </div>
                        </AccordionTrigger>
                    </div>

                    <AccordionContent className="px-4 pb-0">
                        <div className="border-t pt-3">
                            <CardContent className="space-y-3 text-sm pb-3">
                                <p className="text-muted-foreground line-clamp-2">{job.description}</p>
                                
                                {job.location.address && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span className="truncate">{job.location.address}</span>
                                    </div>
                                )}

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
                                
                                {job.scheduledTime && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Scheduled: {new Date(job.scheduledTime).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t pt-3 pb-3">
                                {job.status === 'Unassigned' && (
                                    <Button variant="accent" size="sm" onClick={(e) => { e.preventDefault(); onAIAssign(job); }} className="w-full">
                                        <Bot className="mr-1 h-3 w-3" /> AI Assign
                                    </Button>
                                )}
                                {job.status === 'Assigned' && (
                                    <Button variant="outline" size="sm" onClick={() => onShareTracking(job)} className="w-full">
                                        <Share2 className="mr-2 h-3 w-3 text-primary" /> Share Tracking
                                    </Button>
                                )}
                                {job.assignedTechnicianId && (
                                    <Button variant="outline" size="sm" onClick={() => onOpenChat(job)} className="w-full">
                                        <MessageSquare className="mr-1 h-3 w-3 text-primary" /> Chat
                                    </Button>
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
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
     </div>
  );
};

export default JobListItem;
