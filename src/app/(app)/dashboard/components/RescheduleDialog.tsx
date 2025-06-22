
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { optimizeRoutesAction, type OptimizeRoutesActionInput, confirmManualRescheduleAction, notifyCustomerAction } from "@/actions/fleet-actions";
import type { OptimizeRoutesOutput, Technician, Job, AITask } from "@/types";
import type { EventDropArg } from '@fullcalendar/core';
import { Loader2, MapIcon, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// A small, self-contained component for the toast body
const ToastWithCopy = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => {
  const { toast } = useToast();
  return (
    <div className="w-full space-y-3">
      <p className="text-sm">{message}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            navigator.clipboard.writeText(message);
            toast({ title: "Copied to clipboard!", duration: 2000 });
          }}
        >
          <Copy className="mr-2 h-4 w-4" /> Copy Text
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Close
        </Button>
      </div>
    </div>
  );
};


interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: (reverted: boolean) => void;
  dropInfo: EventDropArg;
  jobs: Job[];
  technicians: Technician[];
  onRescheduleConfirmed: () => void;
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  isOpen,
  onClose,
  dropInfo,
  jobs,
  technicians,
  onRescheduleConfirmed
}) => {
  const { toast } = useToast();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizeRoutesOutput | null>(null);

  const { event } = dropInfo;
  const technicianId = event.extendedProps.technicianId;
  const technician = useMemo(() => technicians.find(t => t.id === technicianId), [technicians, technicianId]);
  
  const jobsForThisTech = useMemo(() => {
    if (!technicianId) return [];
    return jobs.filter(j => j.assignedTechnicianId === technicianId && (j.status === 'Assigned' || j.status === 'En Route'));
  }, [jobs, technicianId]);

  useEffect(() => {
    if (!isOpen || !technician || !event.start) return;

    const fetchOptimizedRoute = async () => {
      setIsLoadingAI(true);
      setOptimizedRoute(null);

      const tasksForOptimization: AITask[] = jobsForThisTech.map(job => {
        let priority: 'high' | 'medium' | 'low';
        switch (job.priority) {
          case 'High': priority = 'high'; break;
          case 'Medium': priority = 'medium'; break;
          default: priority = 'low';
        }
        
        return {
          taskId: job.id,
          location: {
            latitude: job.location.latitude,
            longitude: job.location.longitude,
          },
          priority: priority,
          // For the moved job, use the new time as a hard constraint
          scheduledTime: job.id === event.id ? event.start!.toISOString() : job.scheduledTime,
        };
      });

      const input: OptimizeRoutesActionInput = {
        technicianId: technician.id,
        currentLocation: technician.location,
        tasks: tasksForOptimization,
      };

      const result = await optimizeRoutesAction(input);
      setIsLoadingAI(false);

      if (result.error) {
        toast({ title: "Route Optimization Error", description: result.error, variant: "destructive" });
        onClose(true); // Close and revert the event on the calendar
      } else if (result.data) {
        setOptimizedRoute(result.data);
      }
    };

    fetchOptimizedRoute();
  }, [isOpen, technician, event, jobsForThisTech, onClose, toast]);

  const handleConfirm = async () => {
    if (!optimizedRoute || !technician || !event.start) return;
    
    setIsConfirming(true);
    const result = await confirmManualRescheduleAction({
        technicianId: technician.id,
        movedJobId: event.id,
        newScheduledTime: event.start.toISOString(),
        optimizedRoute: optimizedRoute.optimizedRoute,
    });
    setIsConfirming(false);

    if (result.error) {
        toast({ title: "Failed to Update Schedule", description: result.error, variant: "destructive" });
        onClose(true); // Revert calendar on failure
    } else {
        toast({ title: "Schedule Updated", description: "The technician's route has been successfully updated." });

        const movedJob = jobs.find(j => j.id === event.id);
        if (movedJob) {
            // Fire-and-forget to generate the draft message
            notifyCustomerAction({
                jobId: movedJob.id,
                customerName: movedJob.customerName,
                technicianName: technician.name,
                newTime: new Date(event.start!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
            }).then(notificationResult => {
                if(notificationResult.data?.message) {
                    const { dismiss } = toast({
                        title: "AI Message Draft (For Reschedule)",
                        description: <ToastWithCopy message={notificationResult.data.message} onDismiss={() => dismiss()} />,
                        duration: Infinity,
                    });
                }
            });
        }

        onRescheduleConfirmed();
        onClose(false); // Close without reverting
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(true)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Confirm Reschedule & Re-Optimize</DialogTitle>
          <DialogDescription>
            You have moved a job for <strong>{technician?.name || 'N/A'}</strong>. The AI has re-optimized their route. Review and confirm the new schedule.
          </DialogDescription>
        </DialogHeader>

        {isLoadingAI && (
          <div className="flex items-center justify-center p-8 space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">AI is re-optimizing the route...</p>
          </div>
        )}

        {optimizedRoute && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-md">
            <h3 className="text-lg font-semibold font-headline flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary" /> New Optimized Route:</h3>
            <p className="text-xs text-muted-foreground mb-2">{optimizedRoute.reasoning}</p>
            <ul className="list-decimal list-inside ml-4 space-y-1 text-sm">
              {optimizedRoute.optimizedRoute.map(step => (
                <li key={step.taskId}>
                  <strong>{jobs.find(j => j.id === step.taskId)?.title || step.taskId}</strong> (New ETA: {step.estimatedArrivalTime})
                </li>
              ))}
            </ul>
             <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Confirm Changes</AlertTitle>
                <AlertDescription>
                    Applying this change will update the scheduled time and route for this technician. A message draft will be generated for the customer.
                </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="sm:justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => onClose(true)} disabled={isConfirming}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={!optimizedRoute || isConfirming || isLoadingAI}
          >
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Confirm New Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
