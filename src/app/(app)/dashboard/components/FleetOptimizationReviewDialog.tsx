
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
import { AlertTriangle, CheckCircle, User, Bot, Loader2, Shuffle, ArrowRight, TrendingUp, Car, ShieldAlert, BadgeInfo, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Job, Technician, OptimizationSuggestion } from '@/types';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface FleetOptimizationReviewDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  optimizationResult: {
    suggestedChanges: OptimizationSuggestion[];
    overallReasoning: string;
  } | null;
  technicians: Technician[];
  jobs: Job[];
  onConfirmChanges: (changesToConfirm: OptimizationSuggestion[]) => void;
  isLoadingConfirmation: boolean;
  selectedChanges: OptimizationSuggestion[];
  setSelectedChanges: React.Dispatch<React.SetStateAction<OptimizationSuggestion[]>>;
}

const ChangeMetric = ({ icon: Icon, value, unit, className, label }: { icon: React.ElementType, value: number | undefined, unit: string, className?: string, label: string }) => {
    if (value === undefined) return null;
    const isPositive = value > 0;
    const isNeutral = value === 0;
    const colorClass = isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-red-600';
    return (
        <Badge variant="outline" className={cn("text-xs font-semibold", className, isPositive ? "border-green-200 bg-green-50" : isNeutral ? "border" : "border-red-200 bg-red-50")}>
            <Icon className={cn("h-4 w-4 mr-1", colorClass)} />
            <span className={cn(colorClass)}>
                {isNeutral ? '' : (isPositive ? '+' : '')}{value.toFixed(0)}{unit}
            </span>
            <span className="ml-1 text-muted-foreground font-normal">{label}</span>
        </Badge>
    );
};

const FleetOptimizationReviewDialog: React.FC<FleetOptimizationReviewDialogProps> = ({
  isOpen,
  setIsOpen,
  optimizationResult,
  technicians,
  jobs,
  onConfirmChanges,
  isLoadingConfirmation,
  selectedChanges,
  setSelectedChanges,
}) => {

  const handleToggleChange = (change: OptimizationSuggestion) => {
    setSelectedChanges(prev =>
      prev.some(c => c.jobId === change.jobId)
        ? prev.filter(c => c.jobId !== change.jobId)
        : [...prev, change]
    );
  };

  const getTechnicianName = (id: string | null | undefined) => {
    if (!id) return 'Unassigned';
    return technicians.find(t => t.id === id)?.name || 'Unknown Tech';
  }

  const getJobTitle = (id: string) => {
    return jobs.find(j => j.id === id)?.title || 'Unknown Job';
  }

  const handleConfirm = () => {
    onConfirmChanges(selectedChanges);
  };

  const renderChangeDescription = (change: OptimizationSuggestion) => {
     const jobTitle = getJobTitle(change.jobId);
     const originalTechnician = getTechnicianName(change.originalTechnicianId);
     const newTechnician = getTechnicianName(change.newTechnicianId);

     if (change.originalTechnicianId && change.newTechnicianId && change.originalTechnicianId !== change.newTechnicianId) {
         return <><span className="font-semibold">{`Reassign "${jobTitle}"`}</span><br/><span className="text-muted-foreground text-xs">{originalTechnician} <ArrowRight className="inline h-3 w-3"/> {newTechnician}</span></>;
     }
     if (!change.originalTechnicianId && change.newTechnicianId) {
         return <><span className="font-semibold">{`Assign "${jobTitle}"`}</span><br/><span className="text-muted-foreground text-xs">to {newTechnician}</span></>;
     }
     if(change.newScheduledTime) {
        return <><span className="font-semibold">{`Reschedule "${jobTitle}"`}</span><br/><span className="text-muted-foreground text-xs">for {newTechnician} to {new Date(change.newScheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></>;
     }
     return `Suggested change for "${jobTitle}"`;
  };
  
  const summary = React.useMemo(() => {
    return selectedChanges.reduce((acc, change) => {
        acc.profit += change.profitChange || 0;
        acc.driveTime += change.driveTimeChangeMinutes || 0;
        return acc;
    }, { profit: 0, driveTime: 0 });
  }, [selectedChanges]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary h-5 w-5" /> Fleet Optimization Suggestions
          </DialogTitle>
          <DialogDescription>
            The AI has analyzed the schedule and suggests the following changes to improve profitability. Select the changes you want to apply.
          </DialogDescription>
        </DialogHeader>
         
        {optimizationResult?.overallReasoning && (
             <Alert>
                <BadgeInfo className="h-4 w-4" />
                <AlertTitle>AI Analysis Summary</AlertTitle>
                <AlertDescription>
                    {optimizationResult.overallReasoning}
                </AlertDescription>
            </Alert>
        )}

        <ScrollArea className="max-h-[50vh] pr-3">
          {optimizationResult && optimizationResult.suggestedChanges.length > 0 ? (
            <div className="space-y-3 py-2">
              {optimizationResult.suggestedChanges.map((change) => {
                const isSelected = selectedChanges.some(c => c.jobId === change.jobId);
                return (
                  <div key={change.jobId} className={cn(
                    "p-4 rounded-md border transition-all cursor-pointer",
                    isSelected ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" : "bg-muted/50 hover:bg-muted"
                  )}
                  onClick={() => handleToggleChange(change)}
                  >
                    <div className="flex items-start gap-4">
                       <Checkbox
                          id={`select-change-${change.jobId}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleChange(change)}
                          disabled={isLoadingConfirmation}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                            <h4 className="font-semibold leading-tight">{renderChangeDescription(change)}</h4>
                             <div className="flex flex-wrap items-center gap-2">
                                <ChangeMetric icon={DollarSign} value={change.profitChange} unit="" label="Profit" />
                                <ChangeMetric icon={Car} value={change.driveTimeChangeMinutes} unit=" min" label="Drive" />
                                <ChangeMetric icon={ShieldAlert} value={change.slaRiskChange} unit="%" label="SLA Risk" />
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                <span className="font-semibold">Justification:</span> {change.justification}
                            </p>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No optimization suggestions at this time.</p>
          )}
        </ScrollArea>
        <DialogFooter className="sm:justify-between items-center mt-4 gap-2 border-t pt-4">
           <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-semibold">Total Gain for {selectedChanges.length} Change(s):</p>
            <div className="flex flex-wrap gap-2">
              <ChangeMetric icon={DollarSign} value={summary.profit} unit="" label="Total Profit"/>
              <ChangeMetric icon={Car} value={summary.driveTime} unit=" min" label="Total Drive Time"/>
            </div>
           </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoadingConfirmation}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm} 
              disabled={selectedChanges.length === 0 || isLoadingConfirmation}
            >
              {isLoadingConfirmation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm {selectedChanges.length} Change(s)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FleetOptimizationReviewDialog;
