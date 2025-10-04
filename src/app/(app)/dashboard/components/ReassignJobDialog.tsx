
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
import { allocateJobAction, suggestScheduleTimeAction } from '@/actions/ai-actions';
import { reassignJobAction } from '@/actions/fleet-actions';
import type { AllocateJobOutput, SuggestScheduleTimeOutput, Technician, Job, AITechnician, JobStatus } from '@/types';
import { Loader2, Bot, UserCheck, AlertTriangle, Phone, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Draft'];

interface ReassignJobDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    jobToReassign: Job;
    allJobs: Job[];
    technicians: Technician[];
    onReassignmentComplete: () => void;
}

type Suggestion = {
    type: 'reassign' | 'reschedule';
    technician: Technician;
    reasoning: string;
    newTechnicianId?: string;
    newScheduledTime?: string;
};

const ReassignJobDialog: React.FC<ReassignJobDialogProps> = ({ 
    isOpen, 
    setIsOpen, 
    jobToReassign, 
    allJobs,
    technicians, 
    onReassignmentComplete 
}) => {
    const { userProfile, company } = useAuth();
    const { toast } = useToast();
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [rejectedTimes, setRejectedTimes] = useState<string[]>([]);
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const getSuggestion = useCallback(async (excludedTimes: string[] = []) => {
        if (!jobToReassign || !userProfile?.companyId || !appId) return;

        setIsLoadingAI(true);
        setSuggestion(null);

        // 1. Try to find an alternative technician
        const otherTechnicians = technicians.filter(t => t.id !== jobToReassign.assignedTechnicianId);

        if (otherTechnicians.length > 0 && excludedTimes.length === 0) { // Only try reassignment on the first attempt
            const aiTechnicians: AITechnician[] = otherTechnicians.map(t => ({
                technicianId: t.id,
                technicianName: t.name,
                isAvailable: t.isAvailable,
                skills: t.skills,
                liveLocation: t.location,
                homeBaseLocation: company?.settings?.address ? { address: company.settings.address, latitude: 0, longitude: 0 } : t.location,
                currentJobs: allJobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status)).map(j => ({ jobId: j.id, scheduledTime: j.scheduledTime, priority: j.priority, location: j.location, startedAt: j.inProgressAt, estimatedDurationMinutes: j.estimatedDurationMinutes || 60 })),
                hourlyCost: t.hourlyCost,
            }));

            const result = await allocateJobAction({
                appId,
                jobDescription: jobToReassign.description || '',
                jobPriority: jobToReassign.priority,
                requiredSkills: jobToReassign.requiredSkills || [],
                scheduledTime: jobToReassign.scheduledTime,
                technicianAvailability: aiTechnicians,
                currentTime: new Date().toISOString(),
                featureFlags: company?.settings?.featureFlags
            });

            if (result.data?.suggestedTechnicianId) {
                const techDetails = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
                if (techDetails) {
                    setSuggestion({
                        type: 'reassign',
                        technician: techDetails,
                        reasoning: result.data.reasoning,
                        newTechnicianId: techDetails.id,
                    });
                    setIsLoadingAI(false);
                    return;
                }
            }
        }

        // 2. If no tech found, suggest a new time for the original tech
        const originalTechnician = technicians.find(t => t.id === jobToReassign.assignedTechnicianId);
        if (originalTechnician) {
            const result = await suggestScheduleTimeAction({
                companyId: userProfile.companyId,
                jobPriority: jobToReassign.priority,
                requiredSkills: jobToReassign.requiredSkills || [],
                currentTime: new Date().toISOString(),
                businessHours: company?.settings?.businessHours || [],
                excludedTimes: excludedTimes,
                technicians: [
                    {
                        id: originalTechnician.id,
                        name: originalTechnician.name,
                        skills: originalTechnician.skills.map(s => s),
                        jobs: allJobs
                            .filter(j => j.assignedTechnicianId === originalTechnician.id && j.id !== jobToReassign.id && j.scheduledTime)
                            .map(j => ({ id: j.id, scheduledTime: j.scheduledTime! })),
                    },
                ],
            });

            if (result.data?.suggestions && result.data.suggestions.length > 0) {
                const firstSuggestion = result.data.suggestions[0];
                setSuggestion({
                    type: 'reschedule',
                    technician: originalTechnician,
                    reasoning: firstSuggestion.reasoning,
                    newScheduledTime: firstSuggestion.time,
                });
            } else {
                toast({ title: "No More Alternatives", description: "The AI could not find any other suitable time slots.", variant: "default" });
            }
        }

        setIsLoadingAI(false);
    }, [jobToReassign, technicians, allJobs, toast, company, userProfile, appId]);

    useEffect(() => {
        if (isOpen) {
            getSuggestion();
        } else {
            // Reset state when dialog closes
            setRejectedTimes([]);
            setSuggestion(null);
        }
    }, [isOpen, getSuggestion]);

    const handleFindNext = () => {
        if (suggestion?.type === 'reschedule' && suggestion.newScheduledTime) {
            const newRejectedTimes = [...rejectedTimes, suggestion.newScheduledTime];
            setRejectedTimes(newRejectedTimes);
            getSuggestion(newRejectedTimes);
        }
    };


    const handleConfirm = async () => {
        if (!suggestion || !userProfile?.companyId || !appId) return;
        setIsConfirming(true);

        const result = await reassignJobAction({
            companyId: userProfile.companyId,
            jobId: jobToReassign.id,
            newTechnicianId: suggestion.newTechnicianId || jobToReassign.assignedTechnicianId!,
            newScheduledTime: suggestion.newScheduledTime,
            reason: `Job at risk of delay. Resolved via AI suggestion.`,
            appId,
        });
        
        setIsConfirming(false);

        if (result.error) {
            toast({ title: "Update Failed", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Schedule Updated", description: `Successfully resolved conflict for "${jobToReassign.title}".` });
            onReassignmentComplete();
            setIsOpen(false);
        }
    };

    const renderSuggestion = () => {
        if (!suggestion) return <p className="text-muted-foreground">Could not find a suitable resolution at this time.</p>;

        if (suggestion.type === 'reassign') {
            return (
                <>
                    <h3 className="text-lg font-semibold font-headline flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Suggestion: Reassign Job</h3>
                    <p>To avoid delay, assign this job to: <strong>{suggestion.technician.name}</strong></p>
                    <p className="text-sm text-muted-foreground">Reasoning: <em>{suggestion.reasoning}</em></p>
                </>
            )
        }
        if (suggestion.type === 'reschedule') {
             return (
                <>
                    <h3 className="text-lg font-semibold font-headline flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Suggestion: Reschedule Job</h3>
                    <p>No other technicians are available. Suggest rescheduling for <strong>{suggestion.technician.name}</strong> to a new time:</p>
                    <p className="font-bold text-center text-lg my-2 p-2 bg-background rounded-md border">{format(new Date(suggestion.newScheduledTime!), 'PPp')}</p>
                    <p className="text-sm text-muted-foreground">Reasoning: <em>{suggestion.reasoning}</em></p>
                </>
            )
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">AI Schedule Resolution</DialogTitle>
                    <DialogDescription>
                        For job "<strong>{jobToReassign.title}</strong>", the AI suggests the following action to avoid a potential delay.
                    </DialogDescription>
                </DialogHeader>
                 
                {suggestion?.type === 'reschedule' && jobToReassign.customerName && (
                  <Alert variant="default" className="border-blue-200 bg-blue-50">
                    <Phone className="h-4 w-4 text-blue-600"/>
                    <AlertTitle className="font-semibold text-blue-800">Contact Customer</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Please call <strong>{jobToReassign.customerName}</strong> at <a href={`tel:${jobToReassign.customerPhone}`} className="font-bold underline">{jobToReassign.customerPhone}</a> to confirm the new time.
                    </AlertDescription>
                  </Alert>
                )}

                {isLoadingAI && (
                    <div className="flex items-center justify-center p-8 space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing schedule...</p>
                    </div>
                )}

                {!isLoadingAI && (
                    <div className="mt-4 p-4 bg-secondary/50 rounded-md space-y-2">
                         {renderSuggestion()}
                    </div>
                )}

                <DialogFooter className="sm:justify-between items-center mt-4 gap-2">
                     <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={handleFindNext}
                        disabled={isLoadingAI || suggestion?.type !== 'reschedule'}
                        className="text-primary"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Find Next Suggestion
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button 
                            type="button" 
                            onClick={handleConfirm}
                            disabled={!suggestion || isConfirming || isLoadingAI}
                        >
                            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            Confirm Suggestion
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReassignJobDialog;
