
"use client";

import React, { useState } from 'react';
import { MapPin, Briefcase, Phone, Mail, Circle, Edit, AlertOctagon, Package, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Technician, Job } from '@/types';
import { cn } from '@/lib/utils';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface TechnicianCardProps {
  technician: Technician;
  jobs: Job[];
  onEdit: (technician: Technician) => void;
  onMarkUnavailable: (technicianId: string, reason?: string, unavailableUntil?: string) => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, jobs, onEdit, onMarkUnavailable }) => {
  const currentJob = jobs.find(job => job.id === technician.currentJobId);
  const [reason, setReason] = useState('');
  const [unavailableUntil, setUnavailableUntil] = useState<Date | undefined>();

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
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
          <Mail className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="truncate">{technician.email || 'No email'}</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{technician.phone || 'No phone'}</span>
        </div>
        
        <div className="pt-1">
          <p className="font-medium text-xs text-foreground mb-1.5">Skills:</p>
          <div className="flex flex-wrap gap-1">
            {(technician.skills && technician.skills.length > 0) ? (
              <>
                {technician.skills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
                {technician.skills.length > 3 && (
                  <Badge variant="outline">+{technician.skills.length - 3} more</Badge>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No skills listed.</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-3 pb-3 flex flex-col items-stretch gap-2">
        <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Current Job:</p>
            <span className="truncate ml-2">{currentJob ? currentJob.title : (technician.isAvailable ? 'Awaiting assignment' : 'Idle')}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex-1">
                      <AlertOctagon className="mr-2 h-4 w-4" />
                      Set Unavailability
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark {technician.name} as Unavailable?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will unassign all their active jobs. You can provide a reason and an end date for their unavailability.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                 <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="unavailability-reason">Reason (Optional)</Label>
                        <Textarea id="unavailability-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., On vacation, sick leave" />
                    </div>
                    <div>
                        <Label>Unavailable Until (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !unavailableUntil && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {unavailableUntil ? format(unavailableUntil, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={unavailableUntil} onSelect={setUnavailableUntil} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setReason(''); setUnavailableUntil(undefined); }}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onMarkUnavailable(technician.id, reason, unavailableUntil?.toISOString())}>
                    Confirm & Unassign Jobs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
           <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(technician)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TechnicianCard;
