
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Briefcase, Phone, Mail, Circle, Edit, AlertOctagon, Package, Calendar as CalendarIcon, Shuffle } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth-context';
import OptimizeRouteDialog from './optimize-route-dialog';

interface TechnicianCardProps {
  technician: Technician;
  jobs: Job[];
  allTechnicians: Technician[]; // Pass all technicians for the dialog
  onEdit: (technician: Technician) => void;
  onMarkUnavailable: (technicianId: string, reason?: string, unavailableFrom?: string, unavailableUntil?: string) => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, jobs, allTechnicians, onEdit, onMarkUnavailable }) => {
  const { userProfile } = useAuth();
  const currentJob = jobs.find(job => job.id === technician.currentJobId);
  const [reason, setReason] = useState('');
  const [unavailableFrom, setUnavailableFrom] = useState<Date | undefined>(new Date());
  const [unavailableUntil, setUnavailableUntil] = useState<Date | undefined>();

  const handleMarkUnavailable = () => {
    if (userProfile?.companyId) {
      onMarkUnavailable(
        technician.id, 
        reason, 
        unavailableFrom?.toISOString(), 
        unavailableUntil?.toISOString()
      );
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={technician.avatarUrl} alt={technician.name} data-ai-hint="person portrait" />
              <AvatarFallback>{technician.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg font-headline">{technician.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-sm">
                <Circle className={cn("h-2.5 w-2.5 fill-current", technician.isAvailable ? "text-green-500" : "text-red-500")} />
                {technician.isAvailable ? 'Available' : 'Unavailable'}
              </CardDescription>
            </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={() => onEdit(technician)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Technician</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
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
      <CardFooter className="text-xs text-muted-foreground border-t pt-3 pb-3 flex flex-col items-start gap-2">
        <div className="w-full">
            <p className="font-medium text-foreground">Current Job:</p>
             <div className="h-10 flex items-center">
                 {currentJob ? (
                    <Link href={`/technician/${currentJob.id}`} className="text-primary hover:underline line-clamp-2">
                        {currentJob.title}
                    </Link>
                ) : (
                    <span className="truncate">{technician.isAvailable ? 'Awaiting assignment' : 'Idle'}</span>
                )}
             </div>
        </div>
        <div className="w-full grid grid-cols-2 gap-2">
            <OptimizeRouteDialog technicians={allTechnicians} jobs={jobs} defaultTechnicianId={technician.id}>
                <Button variant="accent" size="sm" className="w-full" disabled={technician.isAvailable}>
                    <Shuffle className="mr-2 h-4 w-4" /> Re-Optimize
                </Button>
            </OptimizeRouteDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                      <AlertOctagon className="mr-2 h-4 w-4" />
                      Mark Unavailable
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark {technician.name} as Unavailable?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will unassign all their active jobs. You can provide a reason and an unavailability period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                 <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="unavailability-reason">Reason (Optional)</Label>
                        <Textarea id="unavailability-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., On vacation, sick leave" />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Unavailable From</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !unavailableFrom && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {unavailableFrom ? format(unavailableFrom, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={unavailableFrom} onSelect={setUnavailableFrom} initialFocus /></PopoverContent>
                            </Popover>
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
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setReason(''); setUnavailableFrom(new Date()); setUnavailableUntil(undefined); }}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkUnavailable}>
                    Confirm & Unassign Jobs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TechnicianCard;
