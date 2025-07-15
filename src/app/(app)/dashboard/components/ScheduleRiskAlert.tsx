
"use client";

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, MessageSquare, X, UserPlus, Info } from 'lucide-react';
import type { CheckScheduleHealthResult } from '@/actions/ai-actions';
import { notifyCustomerAction } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import type { Technician, Job } from '@/types';
import ReassignJobDialog from './ReassignJobDialog';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';


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
      jobTitle: nextJob.title,
      reasonForChange: `Technician is currently running behind due to their previous job.`,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data?.message) {
      // For simplicity, we'll just show a standard success toast now.
      // A custom toast with copy actions can be added back if needed.
       toast({
        title: "AI Message Drafted",
        description: "The customer notification has been drafted and is ready to be sent from your communication tool.",
      });
      onDismiss(technician.id);
    }
    setIsNotifying(false);
  };

  if (!risk || !nextJob) return null;

  const roundedDelay = Math.ceil(risk.predictedDelayMinutes / 15) * 15;

  return (
    <>
      <Alert variant="destructive" className="bg-amber-50 border-amber-400 text-amber-800 [&>svg]:text-amber-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-headline text-amber-900 flex justify-between items-center">
          <span>Fleety's Proactive Alert: Schedule at Risk</span>
           <TooltipProvider>
             <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-700 hover:bg-amber-100">
                            <Info className="h-3 w-3" />
                            <span className="sr-only">Show AI Reasoning</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end" className="max-w-xs">
                        <p className="text-xs">{risk.reasoning}</p>
                    </TooltipContent>
                </Tooltip>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-700 hover:bg-amber-100" onClick={() => onDismiss(technician.id)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Dismiss Alert</span>
                </Button>
             </div>
           </TooltipProvider>
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          <strong>{technician.name}</strong> is at risk of being <strong>~{roundedDelay} minutes late</strong> for job "{nextJob.title}".
        </AlertDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100" onClick={() => setIsReassignOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Find Alternative
          </Button>
          <Button size="sm" variant="default" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleDraftNotification} disabled={isNotifying}>
            {isNotifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            Draft Customer Notification
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
