
"use client";

import React from 'react';
import { MapPin, Briefcase, Phone, Mail, Circle, Edit, AlertOctagon, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Technician, Job } from '@/types';
import { cn } from '@/lib/utils';
import AddEditTechnicianDialog from './AddEditTechnicianDialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

interface TechnicianCardProps {
  technician: Technician;
  jobs: Job[];
  allSkills: string[];
  onTechnicianUpdated: (technician: Technician) => void;
  onMarkUnavailable: (technicianId: string) => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, jobs, allSkills, onTechnicianUpdated, onMarkUnavailable }) => {
  const currentJob = jobs.find(job => job.id === technician.currentJobId);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={technician.avatarUrl} alt={technician.name} data-ai-hint="person portrait" />
          <AvatarFallback>{technician.name ? technician.name.split(' ').map(n => n[0]).join('') : 'T'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-headline">{technician.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <Circle className={cn("h-2.5 w-2.5 fill-current", technician.isAvailable ? "text-green-500" : "text-red-500")} />
            {technician.isAvailable ? 'Available' : 'Unavailable'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{technician.location.address || `Lat: ${technician.location.latitude.toFixed(2)}, Lon: ${technician.location.longitude.toFixed(2)}`}</span>
        </div>
        
        <div className="pt-1">
          <p className="font-medium text-xs text-foreground mb-1.5">Skills:</p>
          <div className="flex flex-wrap gap-1">
            {(technician.skills && technician.skills.length > 0) ? (
              technician.skills.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No skills listed.</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-3 pb-3 flex justify-between items-center">
        <div>
          {currentJob ? (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>On Job: {currentJob.title}</span>
            </div>
          ) : (
            <span>{technician.isAvailable ? 'Awaiting assignment' : 'Currently idle'}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-destructive hover:bg-destructive/10 hover:text-destructive" title="Mark unavailable and reassign jobs">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  <span className="sr-only">Mark Unavailable</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark <strong>{technician.name}</strong> as unavailable and unassign all their active jobs.
                  The system will then help you reassign these jobs. This action cannot be undone immediately from this screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onMarkUnavailable(technician.id)} className="bg-destructive hover:bg-destructive/90">
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AddEditTechnicianDialog technician={technician} onTechnicianAddedOrUpdated={onTechnicianUpdated} allSkills={allSkills}>
            <Button variant="ghost" size="sm" className="px-2 py-1 h-auto">
              <Edit className="h-3.5 w-3.5" />
              <span className="sr-only">Edit Technician</span>
            </Button>
          </AddEditTechnicianDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TechnicianCard;
