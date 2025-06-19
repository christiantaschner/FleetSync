
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
import { useToast } from "@/hooks/use-toast";
import { allocateJobAction, AllocateJobActionInput } from "@/actions/fleet-actions";
import type { AllocateJobOutput } from "@/ai/flows/allocate-job";
import type { Technician, Job, AITechnician } from '@/types';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface SmartJobAllocationDialogProps {
  children?: React.ReactNode; 
  jobToAssign: Job | null; 
  technicians: Technician[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onJobAssigned: (job: Job, technician: Technician) => void;
}

const SmartJobAllocationDialog: React.FC<SmartJobAllocationDialogProps> = ({ 
    children, 
    jobToAssign, 
    technicians,
    isOpen,
    setIsOpen,
    onJobAssigned
}) => {
  const { toast } = useToast();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingAssign, setIsLoadingAssign] = useState(false);
  const [suggestedTechnician, setSuggestedTechnician] = useState<AllocateJobOutput | null>(null);

  const handleGetAISuggestion = async () => {
    if (!jobToAssign) {
      toast({ title: "Error", description: "No job selected for assignment.", variant: "destructive" });
      return;
    }
    setIsLoadingAI(true);
    // setSuggestedTechnician(null); // Keep previous suggestion if any, allow re-fetch if desired via button in future

    const availableAITechnicians: AITechnician[] = technicians.map(t => ({
      technicianId: t.id,
      technicianName: t.name,
      isAvailable: t.isAvailable,
      skills: t.skills as string[],
      location: {
        latitude: t.location.latitude,
        longitude: t.location.longitude,
      },
    }));
    
    const input: AllocateJobActionInput = {
      jobDescription: jobToAssign.description,
      jobPriority: jobToAssign.priority,
      technicianAvailability: availableAITechnicians,
    };

    const result = await allocateJobAction(input);
    setIsLoadingAI(false);

    if (result.error) {
      toast({ title: "AI Allocation Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      const tech = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
      toast({ title: "AI Suggestion Received", description: `Technician ${tech?.name || result.data.suggestedTechnicianId} suggested.` });
      setSuggestedTechnician(result.data);
    }
  };
  
  // Automatically fetch AI suggestion when dialog opens for a job, if no suggestion exists yet
  useEffect(() => {
    if (isOpen && jobToAssign && !suggestedTechnician && !isLoadingAI) {
      handleGetAISuggestion();
    }
    // Reset suggestion if dialog is closed or job changes
    if (!isOpen || (jobToAssign && suggestedTechnician && jobToAssign.id !== (technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId)?.currentJobId) )) {
        // This logic might be too complex or not perfectly reset.
        // Simpler: reset only when dialog closes OR when jobToAssign changes AND dialog is open.
    }
    if(!isOpen) {
        setSuggestedTechnician(null); // Clear suggestion when dialog closes
    }

  }, [isOpen, jobToAssign, suggestedTechnician, isLoadingAI]); // Dependencies for the effect


  const handleConfirmAssignJob = async () => {
    if (!suggestedTechnician || !db || !jobToAssign) return;

    setIsLoadingAssign(true);

    try {
      const jobDocRef = doc(db, "jobs", jobToAssign.id);
      await updateDoc(jobDocRef, {
        assignedTechnicianId: suggestedTechnician.suggestedTechnicianId,
        status: 'Assigned' as Job['status'],
        updatedAt: serverTimestamp(),
      });
      
      const updatedJob: Job = { 
        ...jobToAssign, 
        assignedTechnicianId: suggestedTechnician.suggestedTechnicianId,
        status: 'Assigned',
        updatedAt: new Date().toISOString() 
      };

      const techDocRef = doc(db, "technicians", suggestedTechnician.suggestedTechnicianId);
      await updateDoc(techDocRef, {
        isAvailable: false,
        currentJobId: jobToAssign.id,
      });
      
      const assignedTechDetails = technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId);
      if (!assignedTechDetails) throw new Error("Assigned technician details not found locally.");

      const updatedTechnician: Technician = {
        ...assignedTechDetails,
        isAvailable: false,
        currentJobId: jobToAssign.id,
      };
      
      onJobAssigned(updatedJob, updatedTechnician);
      toast({ title: "Job Assigned", description: `Job "${updatedJob.title}" assigned to ${assignedTechDetails?.name}.`});
      setIsOpen(false);
      // setSuggestedTechnician(null); // Already handled by useEffect when isOpen becomes false

    } catch (error) {
      console.error("Error assigning job via AI Dialog: ", error);
      toast({ title: "Firestore Error", description: "Could not assign job. Check console.", variant: "destructive" });
    } finally {
      setIsLoadingAssign(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        // if (!open) { // Moved to useEffect for better control
        //     setSuggestedTechnician(null); 
        // }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">AI Job Assignment</DialogTitle>
          {jobToAssign && (
            <DialogDescription>
              Review job details. AI is suggesting the best technician for: <strong>{jobToAssign.title}</strong> (Priority: {jobToAssign.priority}).
            </DialogDescription>
          )}
        </DialogHeader>
        
        {jobToAssign && (
            <div className="space-y-3 py-1 my-2 p-3 bg-muted/50 rounded-md border">
                <div>
                    <Label className="text-xs text-muted-foreground">Job Title</Label>
                    <p className="font-semibold">{jobToAssign.title}</p>
                </div>
                 <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm line-clamp-3">{jobToAssign.description}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <p className="text-sm">{jobToAssign.priority}</p>
                </div>
            </div>
        )}

        {/* Button to manually trigger AI suggestion can be hidden or removed if auto-fetch is preferred */}
        {/* 
        <Button onClick={handleGetAISuggestion} disabled={isLoadingAI || !jobToAssign} className="w-full mt-2">
            {isLoadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Get AI Suggestion
        </Button> 
        */}
        
        {isLoadingAI && !suggestedTechnician && (
            <div className="flex items-center justify-center flex-col my-4 p-4 bg-secondary rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Fetching AI suggestion...</p>
            </div>
        )}

        {suggestedTechnician && (
          <div className="mt-4 p-4 bg-secondary rounded-md">
            <h3 className="text-lg font-semibold font-headline">AI Suggestion:</h3>
            <p><strong>Technician:</strong> {technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId)?.name || suggestedTechnician.suggestedTechnicianId}</p>
            <p><strong>Reasoning:</strong> {suggestedTechnician.reasoning}</p>
            <Button onClick={handleConfirmAssignJob} className="w-full mt-3" variant="default" disabled={isLoadingAssign}>
              {isLoadingAssign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assign Job to {technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId)?.name || 'Suggested Tech'}
            </Button>
          </div>
        )}
        <DialogFooter className="sm:justify-start mt-3">
           <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartJobAllocationDialog;
