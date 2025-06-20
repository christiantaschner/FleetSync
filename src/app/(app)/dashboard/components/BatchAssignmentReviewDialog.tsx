
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
import type { Job, Technician } from '@/types';
import type { AllocateJobOutput } from "@/ai/flows/allocate-job";
import { AlertTriangle, CheckCircle, User, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AssignmentSuggestion {
  job: Job;
  suggestion: AllocateJobOutput | null;
  suggestedTechnicianDetails: Technician | null;
  error?: string | null;
}

interface BatchAssignmentReviewDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  assignmentSuggestions: AssignmentSuggestion[];
  onConfirmAssignments: (assignmentsToConfirm: AssignmentSuggestion[]) => void;
  isLoadingConfirmation: boolean;
}

const BatchAssignmentReviewDialog: React.FC<BatchAssignmentReviewDialogProps> = ({
  isOpen,
  setIsOpen,
  assignmentSuggestions,
  onConfirmAssignments,
  isLoadingConfirmation,
}) => {
  
  const validSuggestions = assignmentSuggestions.filter(
    s => s.suggestion && s.suggestedTechnicianDetails && s.suggestedTechnicianDetails.isAvailable && !s.error
  );

  const handleConfirm = () => {
    onConfirmAssignments(validSuggestions);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" /> Review AI Batch Assignments
          </DialogTitle>
          <DialogDescription>
            Review the AI's suggestions for pending jobs. Only assignments to currently available technicians can be confirmed.
            {validSuggestions.length !== assignmentSuggestions.length && (
                <span className="block text-sm text-destructive mt-1">
                    {assignmentSuggestions.length - validSuggestions.length} suggestion(s) cannot be confirmed (e.g., technician unavailable or AI error).
                </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {assignmentSuggestions.length > 0 ? (
            <div className="space-y-4 py-2">
              {assignmentSuggestions.map(({ job, suggestion, suggestedTechnicianDetails, error }, index) => {
                const isConfirmable = suggestion && suggestedTechnicianDetails && suggestedTechnicianDetails.isAvailable && !error;
                return (
                  <div key={job.id} className={cn(
                    "p-4 rounded-md border",
                    isConfirmable ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50 opacity-75"
                  )}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{job.title}</h4>
                            <p className="text-xs text-muted-foreground">Priority: {job.priority}</p>
                        </div>
                         {isConfirmable ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="mr-1 h-3 w-3" /> Ready to Assign
                            </Badge>
                        ) : (
                             <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" /> Cannot Assign
                            </Badge>
                        )}
                    </div>
                    <hr className="my-2"/>
                    {error && (
                        <p className="text-sm text-destructive"><AlertTriangle className="inline h-4 w-4 mr-1"/> AI Error: {error}</p>
                    )}
                    {suggestion && suggestedTechnicianDetails ? (
                      <>
                        <p className="text-sm">
                          <User className="inline h-4 w-4 mr-1" /> Suggested: <strong>{suggestedTechnicianDetails.name}</strong>
                          {!suggestedTechnicianDetails.isAvailable && <span className="text-red-600 font-semibold ml-1">(Unavailable)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Skills: {suggestedTechnicianDetails.skills.join(', ') || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground mt-1">AI Reason: {suggestion.reasoning}</p>
                      </>
                    ) : !error && (
                      <p className="text-sm text-muted-foreground">No AI suggestion available for this job.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No assignment suggestions to review.</p>
          )}
        </ScrollArea>
        <DialogFooter className="sm:justify-between items-center mt-4 gap-2">
          <p className="text-sm text-muted-foreground">
            Confirming: {validSuggestions.length} job(s)
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoadingConfirmation}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm} 
              disabled={validSuggestions.length === 0 || isLoadingConfirmation}
            >
              {isLoadingConfirmation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm {validSuggestions.length} Assignment(s)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAssignmentReviewDialog;

