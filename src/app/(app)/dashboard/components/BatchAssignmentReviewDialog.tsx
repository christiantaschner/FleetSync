
"use client";

import React, { useState, useEffect } from 'react';
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
import type { AllocateJobOutput } from "@/types";
import { AlertTriangle, CheckCircle, User, Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface AssignmentSuggestion {
  job: Job;
  suggestion: AllocateJobOutput | null;
  suggestedTechnicianDetails: Technician | null;
  error?: string | null;
}

// The data structure used for the confirmation action
export interface FinalAssignment {
    jobId: string;
    technicianId: string;
}

interface BatchAssignmentReviewDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  assignmentSuggestions: AssignmentSuggestion[];
  technicians: Technician[]; // Pass all technicians for the dropdown
  onConfirmAssignments: (assignmentsToConfirm: FinalAssignment[]) => void;
  isLoadingConfirmation: boolean;
}

const BatchAssignmentReviewDialog: React.FC<BatchAssignmentReviewDialogProps> = ({
  isOpen,
  setIsOpen,
  assignmentSuggestions,
  technicians,
  onConfirmAssignments,
  isLoadingConfirmation,
}) => {
  const [editableAssignments, setEditableAssignments] = useState<FinalAssignment[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Initialize the editable state when the dialog opens
      const initialAssignments = assignmentSuggestions
        .filter(s => s.suggestion && s.suggestedTechnicianDetails)
        .map(s => ({
          jobId: s.job.id,
          technicianId: s.suggestion!.suggestedTechnicianId!,
        }));
      setEditableAssignments(initialAssignments);
    }
  }, [isOpen, assignmentSuggestions]);

  const handleToggleAssignment = (jobId: string, technicianId: string) => {
    setEditableAssignments(prev =>
      prev.some(a => a.jobId === jobId)
        ? prev.filter(a => a.jobId !== jobId)
        : [...prev, { jobId, technicianId }]
    );
  };

  const handleTechnicianChange = (jobId: string, newTechnicianId: string) => {
    setEditableAssignments(prev =>
      prev.map(a => (a.jobId === jobId ? { ...a, technicianId: newTechnicianId } : a))
    );
  };
  
  const handleConfirm = () => {
    onConfirmAssignments(editableAssignments);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary h-5 w-5" /> Review Fleety's Batch Assignments
          </DialogTitle>
          <DialogDescription>
            Select jobs to assign and change technicians if needed. Unchecked jobs will not be assigned.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {assignmentSuggestions.length > 0 ? (
            <div className="space-y-4 py-2">
              {assignmentSuggestions.map(({ job, suggestion, suggestedTechnicianDetails, error }) => {
                const isSelected = editableAssignments.some(a => a.jobId === job.id);
                const isOriginallyConfirmable = suggestion && suggestedTechnicianDetails && !error;
                const selectedTechnicianId = editableAssignments.find(a => a.jobId === job.id)?.technicianId;

                return (
                  <div key={job.id} className={cn(
                    "p-4 rounded-md border transition-all",
                    isSelected ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" : "bg-muted/50",
                    !isOriginallyConfirmable && "opacity-60"
                  )}>
                    <div className="flex justify-between items-start gap-4">
                       <Checkbox
                          id={`select-job-${job.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleAssignment(job.id, suggestion?.suggestedTechnicianId || '')}
                          disabled={!isOriginallyConfirmable || isLoadingConfirmation}
                          className="mt-1"
                        />
                        <div className="flex-1">
                            <h4 className="font-semibold">{job.title}</h4>
                            <p className="text-xs text-muted-foreground">Priority: {job.priority}</p>
                        </div>
                        {isOriginallyConfirmable ? (
                          <div className="w-48">
                             <Select
                                value={selectedTechnicianId || ''}
                                onValueChange={(techId) => handleTechnicianChange(job.id, techId)}
                                disabled={!isSelected || isLoadingConfirmation}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Technician" />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map(tech => (
                                        <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </div>
                        ) : (
                             <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" /> Cannot Assign
                            </Badge>
                        )}
                    </div>
                    {isOriginallyConfirmable && (
                       <p className="text-xs text-muted-foreground mt-2 pl-8">
                         Fleety's Reason: {suggestion!.reasoning}
                       </p>
                    )}
                    {error && (
                        <p className="text-sm text-destructive mt-2 pl-8"><AlertTriangle className="inline h-4 w-4 mr-1"/> AI Error: {error}</p>
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
            Selected for assignment: {editableAssignments.length} job(s)
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoadingConfirmation}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm} 
              disabled={editableAssignments.length === 0 || isLoadingConfirmation}
            >
              {isLoadingConfirmation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm {editableAssignments.length} Assignment(s)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAssignmentReviewDialog;
