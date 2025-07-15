
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, User, ShieldQuestion, HelpCircle } from 'lucide-react';
import type { CheckScheduleHealthResult } from '@/actions/ai-actions';
import { cn } from '@/lib/utils';

interface ScheduleHealthDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  healthResults: CheckScheduleHealthResult[];
}

const getRiskBadgeVariant = (delayMinutes: number): "default" | "destructive" | "secondary" | "outline" => {
    if (delayMinutes > 15) return "destructive"; // High risk
    if (delayMinutes > 0) return "default"; // Medium risk (yellowish via default variant)
    return "secondary"; // Low risk
}

const getRiskIcon = (delayMinutes: number) => {
    if (delayMinutes > 15) return <AlertTriangle className="h-4 w-4 mr-1.5 text-destructive" />;
    if (delayMinutes > 0) return <Clock className="h-4 w-4 mr-1.5 text-primary" />;
    return <CheckCircle className="h-4 w-4 mr-1.5 text-green-600" />;
}

const getRiskText = (delayMinutes: number): string => {
    if (delayMinutes > 0) return `At Risk of ~${delayMinutes} min delay`;
    return 'On Schedule';
}

const ScheduleHealthDialog: React.FC<ScheduleHealthDialogProps> = ({
  isOpen,
  setIsOpen,
  healthResults,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <ShieldQuestion className="text-primary h-5 w-5" /> Fleetie's Schedule Risk Report
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of active technicians' schedules to predict potential delays for their next job.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {healthResults.length > 0 ? (
            <div className="space-y-4 py-2">
              {healthResults.map(({ technician, currentJob, nextJob, risk, error }) => {
                const isAtRisk = risk && risk.predictedDelayMinutes > 0;
                return (
                  <div key={technician.id} className={cn(
                    "p-4 rounded-md border text-sm",
                    isAtRisk ? "border-amber-400 bg-amber-50" : "border-border"
                  )}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground"/>
                            <h4 className="font-semibold">{technician.name}</h4>
                        </div>
                        {risk ? (
                           <Badge variant={getRiskBadgeVariant(risk.predictedDelayMinutes)} className="flex items-center">
                               {getRiskIcon(risk.predictedDelayMinutes)}
                               {getRiskText(risk.predictedDelayMinutes)}
                           </Badge>
                        ) : (
                           <Badge variant="outline" className="flex items-center">
                               <HelpCircle className="h-4 w-4 mr-1.5" />
                               {error ? 'Analysis Error' : 'No Next Job'}
                           </Badge>
                        )}
                    </div>
                    <hr className="my-2"/>
                     <div className="space-y-1 text-xs text-muted-foreground">
                        <p><strong>Current:</strong> {currentJob.title}</p>
                        <p><strong>Next:</strong> {nextJob?.title || 'None assigned'}</p>
                        {risk && <p className="mt-1"><strong>Fleetie's Reason:</strong> <span className="italic">{risk.reasoning}</span></p>}
                        {error && <p className="mt-1 text-destructive"><strong>Error:</strong> <span className="italic">{error}</span></p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No active technicians to analyze.</p>
          )}
        </ScrollArea>
        <DialogFooter className="sm:justify-end mt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleHealthDialog;
