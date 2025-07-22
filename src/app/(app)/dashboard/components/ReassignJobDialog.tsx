
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { reassignJobAction } from '@/actions/fleet-actions';
import type { AllocateJobOutput, Technician, Job, AITechnician, JobStatus } from '@/types';
import { Loader2, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];

interface ReassignJobDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    jobToReassign: Job;
    allJobs: Job[]; // Pass all jobs to calculate current load
    technicians: Technician[];
    onReassignmentComplete: () => void;
}

const ReassignJobDialog: React.FC<ReassignJobDialogProps> = ({ 
    isOpen, 
    setIsOpen, 
    jobToReassign, 
    allJobs,
    technicians, 
    onReassignmentComplete 
}) => {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [suggestion, setSuggestion] = useState<AllocateJobOutput | null>(null);
    const [suggestedTech, setSuggestedTech] = useState<Technician | null>(null);
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const getSuggestion = useCallback(async () => {
        setIsLoadingAI(true);
        setSuggestion(null);
        setSuggestedTech(null);

        // Find available technicians, excluding the one currently assigned
        const technicianPool = technicians.filter(t => t.id !== jobToReassign.assignedTechnicianId && t.isAvailable);

        if (technicianPool.length === 0) {
            toast({ title: "No available technicians found for reassignment.", variant: "default" });
            setIsLoadingAI(false);
            return;
        }

        const aiTechnicians: AITechnician[] = technicianPool.map(t => ({
            technicianId: t.id,
            technicianName: t.name,
            isAvailable: t.isAvailable,
            skills: t.skills as string[],
            location: {
                latitude: t.location.latitude,
                longitude: t.location.longitude,
            },
            currentJobs: allJobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status)).map(j => ({ jobId: j.id, scheduledTime: j.scheduledTime, priority: j.priority })),
        }));

        const input = {
            jobDescription: jobToReassign.description,
            jobPriority: jobToReassign.priority,
            requiredSkills: jobToReassign.requiredSkills || [],
            scheduledTime: jobToReassign.scheduledTime,
            technicianAvailability: aiTechnicians,
        };

        const result = await allocateJobAction(input);

        if (result.data) {
            const techDetails = technicians.find(t => t.id === result.data!.suggestedTechnicianId) || null;
            setSuggestion(result.data);
            setSuggestedTech(techDetails);
        } else {
            toast({ title: "Fleety Suggestion Failed", description: result.error, variant: "destructive" });
        }

        setIsLoadingAI(false);
    }, [jobToReassign, technicians, allJobs, toast]);

    useEffect(() => {
        if (isOpen) {
            getSuggestion();
        }
    }, [isOpen, getSuggestion]);

    const handleConfirm = async () => {
        if (!suggestedTech || !userProfile?.companyId || !appId) return;
        setIsConfirming(true);

        const result = await reassignJobAction({
            companyId: userProfile.companyId,
            jobId: jobToReassign.id,
            newTechnicianId: suggestedTech.id,
            reason: `Job at risk of delay. Reassigned from another technician.`,
            appId,
        });
        
        setIsConfirming(false);

        if (result.error) {
            toast({ title: "Reassignment Failed", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Job Reassigned", description: `Successfully reassigned "${jobToReassign.title}" to ${suggestedTech.name}.` });
            onReassignmentComplete();
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">Fleety's Reassignment Suggestion</DialogTitle>
                    <DialogDescription>
                        For job "<strong>{jobToReassign.title}</strong>", Fleety suggests an alternative technician to avoid a potential delay.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingAI && (
                    <div className="flex items-center justify-center p-8 space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-muted-foreground">Finding best available technician...</p>
                    </div>
                )}

                {!isLoadingAI && suggestedTech && suggestion && (
                    <div className="mt-4 p-4 bg-secondary/50 rounded-md space-y-2">
                         <h3 className="text-lg font-semibold font-headline flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Fleety's Suggestion:</h3>
                         <p>Assign to: <strong>{suggestedTech.name}</strong></p>
                         <p className="text-sm text-muted-foreground">Reasoning: <em>{suggestion.reasoning}</em></p>
                    </div>
                )}

                {!isLoadingAI && !suggestedTech && (
                    <div className="text-center p-8">
                        <p className="text-muted-foreground">Could not find a suitable alternative technician at this time.</p>
                    </div>
                )}

                <DialogFooter className="sm:justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button 
                        type="button" 
                        onClick={handleConfirm}
                        disabled={!suggestedTech || isConfirming || isLoadingAI}
                    >
                        {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                        Confirm Reassignment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReassignJobDialog;
