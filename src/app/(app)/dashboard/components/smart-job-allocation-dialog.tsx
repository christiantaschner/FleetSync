
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
import { allocateJobAction } from "@/actions/ai-actions";
import type { AllocateJobOutput, Technician, Job, AITechnician, JobStatus } from '@/types';
import { Label } from '@/components/ui/label';
import { Loader2, UserCheck, Bot } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SmartJobAllocationDialogProps {
  jobToAssign: Job | null; 
  technicians: Technician[];
  jobs: Job[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onJobAssigned: (job: Job, technician: Technician) => void;
}

const SmartJobAllocationDialog: React.FC<SmartJobAllocationDialogProps> = ({ 
    jobToAssign, 
    technicians,
    jobs,
    isOpen,
    setIsOpen,
    onJobAssigned
}) => {
  const { toast } = useToast();
  const { userProfile, company } = useAuth();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingAssign, setIsLoadingAssign] = useState(false);
  const [suggestedTechnician, setSuggestedTechnician] = useState<AllocateJobOutput | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    const getAISuggestion = async () => {
        if (!jobToAssign || !appId) {
          return;
        }
        setIsLoadingAI(true);

        const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];
        
        const aiTechnicians: AITechnician[] = technicians.map(t => ({
          technicianId: t.id,
          technicianName: t.name,
          isAvailable: t.isAvailable,
          skills: t.skills || [],
          liveLocation: t.location,
          homeBaseLocation: company?.settings?.address ? { address: company.settings.address, latitude: 0, longitude: 0 } : t.location,
          currentJobs: jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
            .map(j => ({
              jobId: j.id,
              scheduledTime: j.scheduledTime,
              priority: j.priority,
              location: j.location,
            })),
          workingHours: t.workingHours,
          isOnCall: t.isOnCall,
        }));
        
        const input = {
            appId,
            jobDescription: jobToAssign.description,
            jobPriority: jobToAssign.priority,
            requiredSkills: jobToAssign.requiredSkills,
            scheduledTime: jobToAssign.scheduledTime,
            technicianAvailability: aiTechnicians,
            currentTime: new Date().toISOString(),
        };

        const result = await allocateJobAction(input);
        setIsLoadingAI(false);

        if (result.error) {
            toast({ title: "AI Allocation Error", description: result.error, variant: "destructive" });
        } else if (result.data) {
            const tech = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
            toast({ title: "AI Suggestion Received", description: `Fleety suggests ${tech?.name || 'a technician'}.` });
            setSuggestedTechnician(result.data);
            setSelectedTechnicianId(result.data.suggestedTechnicianId);
        }
    };
    
    if (isOpen && jobToAssign && !suggestedTechnician && !isLoadingAI) {
      getAISuggestion();
    }
    if(!isOpen) {
        setSuggestedTechnician(null); 
        setSelectedTechnicianId(null);
    }
  }, [isOpen, jobToAssign, technicians, jobs, company, suggestedTechnician, isLoadingAI, toast, appId]);


  const handleConfirmAssignJob = async () => {
    if (!selectedTechnicianId || !db || !jobToAssign || !appId) return;

    setIsLoadingAssign(true);

    const assignedTechDetails = technicians.find(t => t.id === selectedTechnicianId);
    if (!assignedTechDetails) {
        toast({ title: "Error", description: "Selected technician details not found.", variant: "destructive" });
        setIsLoadingAssign(false);
        return;
    }
    
    const wasOriginallySuggested = suggestedTechnician?.suggestedTechnicianId === selectedTechnicianId;

    if (!wasOriginallySuggested && !assignedTechDetails.isAvailable) {
        toast({ title: "Assignment Error", description: `${assignedTechDetails.name} is not available. Please select an available technician.`, variant: "destructive" });
        setIsLoadingAssign(false);
        return;
    }


    try {
      const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobToAssign.id);
      await updateDoc(jobDocRef, {
        assignedTechnicianId: selectedTechnicianId,
        status: 'Assigned' as Job['status'],
        updatedAt: serverTimestamp(),
        assignedAt: serverTimestamp(),
      });
      
      const updatedJob: Job = { 
        ...jobToAssign, 
        assignedTechnicianId: selectedTechnicianId,
        status: 'Assigned',
        updatedAt: new Date().toISOString(),
        assignedAt: new Date().toISOString(),
      };

      const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, selectedTechnicianId);
      await updateDoc(techDocRef, {
        isAvailable: false,
        currentJobId: jobToAssign.id,
      });
      
      const updatedTechnician: Technician = {
        ...assignedTechDetails,
        isAvailable: false,
        currentJobId: jobToAssign.id,
      };
      
      onJobAssigned(updatedJob, updatedTechnician);
      toast({ title: "Job Assigned", description: `Job "${updatedJob.title}" assigned to ${assignedTechDetails?.name}.`});
      setIsOpen(false);

    } catch (error) {
      console.error("Error assigning job via AI Dialog: ", error);
      toast({ title: "Firestore Error", description: "Could not assign job. Check console.", variant: "destructive" });
    } finally {
      setIsLoadingAssign(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/>AI Job Assignment</DialogTitle>
          {jobToAssign && (
            <DialogDescription>
              Fleety is suggesting the best technician for: <strong>{jobToAssign.title}</strong>
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isLoadingAI && !suggestedTechnician && (
            <div className="flex items-center justify-center flex-col my-4 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing technicians & routes...</p>
            </div>
        )}

        {suggestedTechnician && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-md space-y-2 border">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Fleety's Suggestion:</h3>
            <p className="text-sm text-muted-foreground italic">"{suggestedTechnician.reasoning}"</p>
            <div className="space-y-1 pt-2">
                <Label htmlFor="technician-override">Assign To</Label>
                <Select value={selectedTechnicianId || ''} onValueChange={setSelectedTechnicianId}>
                    <SelectTrigger id="technician-override">
                        <SelectValue placeholder="Select a technician" />
                    </SelectTrigger>
                    <SelectContent>
                        {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>
                                <div className="flex items-center gap-2">
                                    {tech.id === suggestedTechnician.suggestedTechnicianId && <Bot className="h-4 w-4 text-blue-600" />}
                                    {tech.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        )}
        
        {jobToAssign && !isLoadingAI && !suggestedTechnician && (
            <div className="text-center p-4">
                <p className="text-muted-foreground">The AI could not find a suitable technician based on the current constraints.</p>
            </div>
        )}

        <DialogFooter className="sm:justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignJob} 
              variant="default" 
              disabled={isLoadingAssign || isLoadingAI || !selectedTechnicianId}
            >
              {isLoadingAssign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Confirm & Assign Job
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartJobAllocationDialog;
