
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
import { suggestScheduleTimeAction } from '@/actions/ai-actions';
import type { Contract, Technician, Job, JobStatus, SuggestScheduleTimeOutput, Customer } from '@/types';
import { Loader2, Sparkles, X, UserCheck, Bot, RefreshCw, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface SuggestAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  technicians: Technician[];
  jobs: Job[];
  customers: Customer[];
  onJobCreated: () => void;
}

const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Draft'];

const SuggestAppointmentDialog: React.FC<SuggestAppointmentDialogProps> = ({ isOpen, onClose, contract, technicians, jobs, customers, onJobCreated }) => {
  const { toast } = useToast();
  const { userProfile, company } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestScheduleTimeOutput['suggestions']>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestScheduleTimeOutput['suggestions'][number] | null>(null);
  const [rejectedTimes, setRejectedTimes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const customerEmail = contract ? customers.find(c => c.name === contract.customerName)?.email : null;

  const getSuggestions = useCallback(async (isGettingMore: boolean = false) => {
    if (!isOpen || !contract || !userProfile?.companyId || !appId || !company) return;

    setIsLoading(true);
    setError(null);

    if (!isGettingMore) {
        setSuggestions([]);
        setSelectedSuggestion(null);
        setRejectedTimes([]);
    }
    
    const timesToExclude = isGettingMore ? [...rejectedTimes, ...suggestions.map(s => s.time)] : [];

    const result = await suggestScheduleTimeAction({
      companyId: userProfile.companyId,
      jobPriority: contract.jobTemplate.priority,
      requiredSkills: contract.jobTemplate.requiredSkills || [],
      currentTime: new Date().toISOString(),
      businessHours: company.settings?.businessHours || [],
      excludedTimes: timesToExclude,
      technicians: technicians.map(tech => ({
        id: tech.id,
        name: tech.name,
        skills: tech.skills.map(s => s.name),
        jobs: jobs.filter(j => j.assignedTechnicianId === tech.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
            .map(j => ({ id: j.id, scheduledTime: j.scheduledTime! }))
      }))
    });

    if (result.error) {
      setError(result.error);
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data?.suggestions) {
      const newSuggestions = result.data.suggestions;
      if (newSuggestions.length === 0 && isGettingMore) {
        toast({ title: "No More Suggestions", description: "Fleety could not find any other suitable time slots.", variant: "default" });
      }
      setSuggestions(prev => [...prev, ...newSuggestions]);
    }
    setIsLoading(false);
  }, [isOpen, contract, userProfile, appId, company, technicians, jobs, toast, suggestions, rejectedTimes]);
  
  useEffect(() => {
    if (isOpen) {
      getSuggestions(false);
    }
  }, [isOpen]); // simplified dependency array

  const handleConfirm = async () => {
    if (!selectedSuggestion || !contract || !userProfile?.companyId || !appId || !db) return;

    setIsConfirming(true);
    try {
        const newJobPayload = {
            ...contract.jobTemplate,
            companyId: userProfile.companyId,
            customerName: contract.customerName,
            customerPhone: contract.customerPhone || '',
            customerEmail: customerEmail || '',
            location: { address: contract.customerAddress, latitude: 0, longitude: 0 },
            status: 'Unassigned' as const,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            scheduledTime: selectedSuggestion.time,
            sourceContractId: contract.id,
            notes: `Generated from Contract ID: ${contract.id} via "Suggest Appointment" feature.`,
            assignedTechnicianId: null, // Start as unassigned
        };

        const jobsCollectionRef = collection(db, `artifacts/${appId}/public/data/jobs`);
        await addDoc(jobsCollectionRef, newJobPayload);
        
        toast({
            title: "Job Scheduled!",
            description: `A new job for ${contract.customerName} has been added to the schedule for ${format(new Date(selectedSuggestion.time), 'PPp')}.`
        });
        
        onJobCreated();
        onClose();

    } catch (e: any) {
        console.error("Failed to create job from suggestion:", e);
        toast({ title: "Error", description: `Could not create job: ${e.message}`, variant: "destructive" });
    } finally {
        setIsConfirming(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose() }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Appointment Suggestion
          </DialogTitle>
          <DialogDescription>
            Fleety has analyzed all technician schedules to find the best time for {contract?.jobTemplate.title} for {contract?.customerName}.
          </DialogDescription>
        </DialogHeader>

        {contract?.customerName && (
          <Alert variant="default" className="border-blue-200 bg-blue-50 mt-4">
            <Phone className="h-4 w-4 text-blue-600"/>
            <AlertTitle className="font-semibold text-blue-800">Contact Customer to Confirm</AlertTitle>
            <AlertDescription className="text-blue-700">
                <p>Please call <strong>{contract.customerName}</strong> to confirm a new appointment time.</p>
                <div className="text-xs mt-1 space-y-0.5">
                    <p><strong>Phone:</strong> <a href={`tel:${contract.customerPhone}`} className="font-bold underline">{contract.customerPhone || 'N/A'}</a></p>
                    <p><strong>Email:</strong> <a href={`mailto:${customerEmail}`} className="font-bold underline">{customerEmail || 'N/A'}</a></p>
                </div>
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading && suggestions.length === 0 && (
            <div className="flex items-center justify-center p-10 space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Finding the best time slots...</span>
            </div>
        )}

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Suggestion Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {suggestions.length > 0 && (
            <div className="space-y-3 py-2 max-h-80 overflow-y-auto pr-3">
               {suggestions.map((suggestion, index) => {
                    const techName = technicians.find(t => t.id === suggestion.technicianId)?.name || 'Unknown';
                    return (
                        <button
                           key={`${suggestion.time}-${index}`}
                           type="button"
                           onClick={() => setSelectedSuggestion(suggestion)}
                           className={cn(
                            "w-full p-3 border rounded-md text-left hover:bg-secondary transition-all",
                            selectedSuggestion?.time === suggestion.time && "ring-2 ring-green-500 bg-green-50"
                           )}
                       >
                           <p className="font-semibold text-sm">{format(new Date(suggestion.time), 'EEEE, MMM d @ p')}</p>
                           <p className="text-xs text-muted-foreground">with {techName}</p>
                           <p className="text-xs text-muted-foreground mt-1 italic">"{suggestion.reasoning}"</p>
                       </button>
                    )
               })}
            </div>
        )}

        {!isLoading && suggestions.length === 0 && !error && (
            <Alert>
                <AlertTitle>No Suggestions Found</AlertTitle>
                <AlertDescription>
                    Fleety could not find any suitable appointment times based on current schedules and technician availability. You may need to adjust technician working hours or clear some existing jobs.
                </AlertDescription>
            </Alert>
        )}

        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2 sm:justify-between">
           <Button
                type="button"
                variant="ghost"
                onClick={() => getSuggestions(true)}
                disabled={isLoading || suggestions.length === 0}
            >
                <RefreshCw className="mr-2 h-4 w-4" /> Get More Suggestions
            </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedSuggestion || isConfirming}>
                {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCheck className="mr-2 h-4 w-4"/>}
                Schedule Job
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestAppointmentDialog;
