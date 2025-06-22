
"use client";

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, MessageSquare, Shuffle, X, Copy, UserPlus } from 'lucide-react';
import type { CheckScheduleHealthResult } from '@/actions/fleet-actions';
import { notifyCustomerAction } from '@/actions/fleet-actions';
import { useToast } from '@/hooks/use-toast';
import OptimizeRouteDialog from './optimize-route-dialog';
import type { Technician, Job } from '@/types';
import ReassignJobDialog from './ReassignJobDialog';


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

interface ScheduleRiskAlertProps {
  riskAlert: CheckScheduleHealthResult;
  onDismiss: (technicianId: string) => void;
  technicians: Technician[];
  jobs: Job[];
}

export const ScheduleRiskAlert: React.FC<ScheduleRiskAlertProps> = ({ riskAlert, onDismiss, technicians, jobs }) => {
  const { toast } = useToast();
  const [isNotifying, setIsNotifying] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const { technician, nextJob, risk } = riskAlert;

  const handleDraftNotification = async () => {
    if (!nextJob || !risk) return;
    setIsNotifying(true);
    const result = await notifyCustomerAction({
      jobId: nextJob.id,
      customerName: nextJob.customerName,
      technicianName: technician.name,
      delayMinutes: risk.predictedDelayMinutes,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data?.message) {
      const { dismiss } = toast({
        title: "AI Message Draft",
        description: <ToastWithCopy message={result.data.message} onDismiss={() => dismiss()} />,
        duration: Infinity,
      });
      onDismiss(technician.id);
    }
    setIsNotifying(false);
  };

  if (!risk || !nextJob) return null;

  return (
    <>
      <Alert variant="destructive" className="bg-amber-50 border-amber-400 text-amber-800 [&>svg]:text-amber-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-headline text-amber-900 flex justify-between items-center">
          <span>Proactive Alert: Schedule at Risk</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-700 hover:bg-amber-100" onClick={() => onDismiss(technician.id)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss Alert</span>
          </Button>
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          Technician <strong>{technician.name}</strong> is at risk of being{' '}
          <strong>~{risk.predictedDelayMinutes} minutes late</strong> for their next job, "{nextJob.title}".
          <p className="text-xs mt-1">
            <em>AI Reason: {risk.reasoning}</em>
          </p>
        </AlertDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100" onClick={() => setIsReassignOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Find Alternative
          </Button>
          <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
            <Button size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100">
              <Shuffle className="mr-2 h-4 w-4" /> Re-Optimize Route
            </Button>
          </OptimizeRouteDialog>
          <Button size="sm" variant="default" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleDraftNotification} disabled={isNotifying}>
            {isNotifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            Draft Notification
          </Button>
        </div>
      </Alert>
      
      {nextJob && (
          <ReassignJobDialog
              isOpen={isReassignOpen}
              setIsOpen={setIsReassignOpen}
              jobToReassign={nextJob}
              allJobs={jobs}
              technicians={technicians}
              onReassignmentComplete={() => onDismiss(technician.id)}
          />
      )}
    </>
  );
};
