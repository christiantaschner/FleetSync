
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
import { Loader2, UserCheck, Bot, DollarSign, User, Check, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [aiSuggestions, setAiSuggestions] = useState<AllocateJobOutput[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AllocateJobOutput | null>(null);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const getAISuggestion = async () => {
    if (!jobToAssign || !appId) {
      return;
    }
    setIsLoadingAI(true);
    setAiSuggestions([]);
    setSelectedSuggestion(null);

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
          estimatedDurationMinutes: j.estimatedDurationMinutes
        })),
      workingHours: t.workingHours,
      isOnCall: t.isOnCall,
      hourlyCost: t.hourlyCost,
      commissionRate: t.commissionRate,
      bonus: t.bonus,
      vanInventory: t.vanInventory || [],
      maxDailyHours: t.maxDailyHours,
    }));
    
    const input = {
        appId,
        jobDescription: jobToAssign.description,
        jobPriority: jobToAssign.priority,
        requiredSkills: jobToAssign.requiredSkills,
        requiredParts: jobToAssign.requiredParts,
        scheduledTime: jobToAssign.scheduledTime,
        quotedValue: jobToAssign.quotedValue,
        expectedPartsCost: jobToAssign.expectedPartsCost,
        slaPenalty: 0, // Placeholder
        technicianAvailability: aiTechnicians,
        currentTime: new Date().toISOString(),
        featureFlags: company?.settings?.featureFlags,
        partsLibrary: [], // TODO: Populate this from a central parts collection
        rejectedSuggestions: aiSuggestions,
    };

    const result = await allocateJobAction(input);
    setIsLoadingAI(false);

    if (result.error) {
        toast({ title: "AI Allocation Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
        const newSuggestion = result.data;
        // In a real multi-suggestion flow, we would get an array and sort it.
        // For now, we'll simulate a list by just adding one suggestion.
        const newSuggestions = [newSuggestion]; 
        setAiSuggestions(newSuggestions);
        if (newSuggestion.suggestedTechnicianId) {
            setSelectedSuggestion(newSuggestion);
        }
    }
  };
  
  useEffect(() => {
    if (isOpen && jobToAssign) {
      getAISuggestion();
    }
    if(!isOpen) {
        setAiSuggestions([]); 
        setSelectedSuggestion(null);
    }
  }, [isOpen, jobToAssign]);


  const handleConfirmAssignJob = async () => {
    if (!selectedSuggestion || !selectedSuggestion.suggestedTechnicianId || !db || !jobToAssign || !appId) return;

    setIsLoadingAssign(true);

    const assignedTechDetails = technicians.find(t => t.id === selectedSuggestion.suggestedTechnicianId);
    if (!assignedTechDetails) {
        toast({ title: "Error", description: "Selected technician details not found.", variant: "destructive" });
        setIsLoadingAssign(false);
        return;
    }

    try {
      const batch = writeBatch(db);
      const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobToAssign.id);
      
      const updatePayload: any = {
        assignedTechnicianId: selectedSuggestion.suggestedTechnicianId,
        status: 'Assigned' as Job['status'],
        updatedAt: serverTimestamp(),
        assignedAt: serverTimestamp(),
        profitScore: selectedSuggestion.profitScore,
      };
      
      batch.update(jobDocRef, updatePayload);
      
      const updatedJob: Job = { 
        ...jobToAssign, 
        ...updatePayload,
        updatedAt: new Date().toISOString(),
        assignedAt: new Date().toISOString(),
      };

      const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, selectedSuggestion.suggestedTechnicianId);
      batch.update(techDocRef, {
        isAvailable: false,
        currentJobId: jobToAssign.id,
      });
      
      const updatedTechnician: Technician = {
        ...assignedTechDetails,
        isAvailable: false,
        currentJobId: jobToAssign.id,
      };

      await batch.commit();
      
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

  const getTechnicianName = (id: string | null) => {
    if (!id) return 'N/A';
    return technicians.find(t => t.id === id)?.name || 'Unknown Tech';
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/>Profit-First Assignment</DialogTitle>
          {jobToAssign && (
            <DialogDescription>
              AI is ranking technicians for "<strong>{jobToAssign.title}</strong>" based on maximum profitability.
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isLoadingAI && aiSuggestions.length === 0 && (
            <div className="flex items-center justify-center flex-col my-4 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Calculating profit scores...</p>
            </div>
        )}

        {aiSuggestions.length > 0 && (
            <div className="mt-4 space-y-2">
                <ScrollArea className="h-64 pr-3">
                    <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedSuggestion(suggestion)}
                            className={cn(
                                "w-full p-3 border rounded-md text-left flex items-start gap-3 transition-all",
                                selectedSuggestion?.suggestedTechnicianId === suggestion.suggestedTechnicianId
                                    ? "ring-2 ring-primary bg-primary/10"
                                    : "bg-secondary/50 hover:bg-secondary"
                            )}
                            disabled={!suggestion.suggestedTechnicianId}
                        >
                             <div className="mt-1">
                                {selectedSuggestion?.suggestedTechnicianId === suggestion.suggestedTechnicianId ? (
                                    <Check className="h-5 w-5 text-primary" />
                                ) : (
                                    <User className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{getTechnicianName(suggestion.suggestedTechnicianId)}</p>
                                    {suggestion.profitScore !== undefined && (
                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                            <DollarSign className="mr-1 h-3 w-3"/>
                                            ${suggestion.profitScore.toFixed(2)}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground italic mt-1">"{suggestion.reasoning}"</p>
                            </div>
                        </button>
                    ))}
                    </div>
                </ScrollArea>
                <div className="flex justify-end pt-2">
                     <Button variant="link" size="sm" onClick={getAISuggestion} disabled={isLoadingAI}>
                        <RefreshCw className="mr-2 h-3.5 w-3.5"/>
                        Recalculate
                     </Button>
                </div>
            </div>
        )}
        
        {jobToAssign && !isLoadingAI && aiSuggestions.length === 0 && (
            <Alert variant="destructive">
                <AlertTitle>No Suitable Technicians Found</AlertTitle>
                <AlertDescription>
                    The AI could not find any technicians who meet all job requirements (skills, parts, availability). Please check the job details or technician profiles.
                </AlertDescription>
            </Alert>
        )}

        <DialogFooter className="sm:justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignJob} 
              variant="default" 
              disabled={isLoadingAssign || isLoadingAI || !selectedSuggestion || !selectedSuggestion.suggestedTechnicianId}
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
