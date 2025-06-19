
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
import type { Technician, Job, AITechnician, JobPriority } from '@/types';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface SmartJobAllocationDialogProps {
  children?: React.ReactNode; // Trigger element, now optional as it can be controlled programmatically
  jobToAssign: Job | null; // The job to assign
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

  // Reset suggestion when dialog is opened or jobToAssign changes
  useEffect(() => {
    if (isOpen) {
      setSuggestedTechnician(null); 
    }
  }, [isOpen, jobToAssign]);


  const handleGetAISuggestion = async () => {
    if (!jobToAssign) {
      toast({ title: "Error", description: "No job selected for assignment.", variant: "destructive" });
      return;
    }
    setIsLoadingAI(true);
    setSuggestedTechnician(null);

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

  const handleConfirmAssignJob = async () => {
    if (!suggestedTechnician || !db || !jobToAssign) return;

    setIsLoadingAssign(true);

    try {
      // Update existing job in Firestore
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

      // Update technician in Firestore
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
      setSuggestedTechnician(null);

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
        if (!open) {
            setSuggestedTechnician(null);
        }
    }}>
      {/* DialogTrigger is now handled by parent component */}
      {/* <DialogTrigger asChild>{children}</DialogTrigger> */} 
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">AI Job Assignment</DialogTitle>
          {jobToAssign && (
            <DialogDescription>
              Review job details and get an AI suggestion for assigning: <strong>{jobToAssign.title}</strong> (Priority: {jobToAssign.priority}).
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


        <Button onClick={handleGetAISuggestion} disabled={isLoadingAI || !jobToAssign} className="w-full mt-2">
            {isLoadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Get AI Suggestion
        </Button>
        
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

