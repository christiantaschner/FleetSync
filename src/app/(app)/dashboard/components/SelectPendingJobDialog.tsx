

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
import type { Job } from '@/types';
import { Briefcase, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// This component might no longer be used if AI assignment is moved contextually to JobListItem.
// Keeping it for now in case of other use-cases or if the user wants to revert.
// If confirmed as unused, it can be removed.

interface SelectPendingJobDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  jobs: Job[];
  onJobSelected: (job: Job) => void;
}

const SelectPendingJobDialog: React.FC<SelectPendingJobDialogProps> = ({
  isOpen,
  setIsOpen,
  jobs,
  onJobSelected,
}) => {
  const pendingJobs = jobs.filter(job => job.status === 'Unassigned').sort((a, b) => {
    const priorityOrder: Record<Job['priority'], number> = { High: 1, Medium: 2, Low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Select Unassigned Job for AI Assignment</DialogTitle>
          <DialogDescription>
            Choose an unassigned job from the list below to get an AI technician suggestion.
            (This dialog might be deprecated if assignment is done contextually)
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {pendingJobs.length > 0 ? (
            <div className="space-y-3 py-2">
              {pendingJobs.map((job) => (
                <Button
                  key={job.id}
                  variant="outline"
                  className="w-full h-auto justify-start text-left p-3 space-x-3 items-start"
                  onClick={() => onJobSelected(job)}
                >
                  <Briefcase className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold">{job.title}</h4>
                      <Badge variant={job.priority === 'High' ? 'destructive' : job.priority === 'Medium' ? 'default' : 'secondary'} className="ml-2">
                        <AlertTriangle className="mr-1 h-3 w-3" /> {job.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{job.description}</p>
                    <div className="text-xs text-muted-foreground flex items-center">
                       <Clock className="mr-1 h-3 w-3" /> Created: {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No unassigned jobs available for assignment.</p>
          )}
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectPendingJobDialog;
