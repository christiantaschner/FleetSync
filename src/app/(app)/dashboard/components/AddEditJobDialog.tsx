
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Job, JobPriority, JobStatus, Technician, AITechnician } from '@/types';
import { Loader2, Sparkles, UserCheck, Save, Calendar as CalendarIcon, ListChecks, AlertTriangle, Lightbulb, Package } from 'lucide-react';
import { allocateJobAction, AllocateJobActionInput, suggestJobSkillsAction, SuggestJobSkillsActionInput, suggestJobPriorityAction, SuggestJobPriorityActionInput, suggestJobPartsAction, SuggestJobPartsActionInput } from "@/actions/fleet-actions";
import type { AllocateJobOutput, SuggestJobPriorityOutput } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';

const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];

interface AddEditJobDialogProps {
  children: React.ReactNode;
  job?: Job;
  jobs: Job[];
  technicians: Technician[];
  allSkills: string[];
  allParts: string[];
  onJobAddedOrUpdated?: (job: Job, assignedTechnicianId?: string | null) => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ children, job, jobs, technicians, allSkills, allParts, onJobAddedOrUpdated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [isFetchingSkillSuggestion, setIsFetchingSkillSuggestion] = useState(false);
  const [isFetchingPartSuggestion, setIsFetchingPartSuggestion] = useState(false);
  const [isFetchingPrioritySuggestion, setIsFetchingPrioritySuggestion] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState<AllocateJobOutput | null>(null);
  const [aiPrioritySuggestion, setAiPrioritySuggestion] = useState<SuggestJobPriorityOutput | null>(null);
  const [suggestedTechnicianDetails, setSuggestedTechnicianDetails] = useState<Technician | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requiredParts, setRequiredParts] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);

  const resetForm = useCallback(() => {
    setTitle(job?.title || '');
    setDescription(job?.description || '');
    setPriority(job?.priority || 'Medium');
    setRequiredSkills(job?.requiredSkills || []);
    setRequiredParts(job?.requiredParts || []);
    setCustomerName(job?.customerName || '');
    setCustomerPhone(job?.customerPhone || '');
    setLocationAddress(job?.location.address || '');
    setLatitude(job?.location.latitude || null);
    setLongitude(job?.location.longitude || null);
    setScheduledTime(job?.scheduledTime ? new Date(job.scheduledTime) : undefined);
    setAiSuggestion(null);
    setAiPrioritySuggestion(null);
    setSuggestedTechnicianDetails(null);
  }, [job]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, isOpen, resetForm]);
  
  const fetchAISkillSuggestion = useCallback(async (currentDescription: string) => {
    if (!currentDescription.trim() || allSkills.length === 0) {
      return;
    }
    setIsFetchingSkillSuggestion(true);
    const input: SuggestJobSkillsActionInput = {
      jobDescription: currentDescription,
      availableSkills: allSkills,
    };
    const result = await suggestJobSkillsAction(input);
    if(result.data?.suggestedSkills) {
      setRequiredSkills(result.data.suggestedSkills);
    }
    setIsFetchingSkillSuggestion(false);
  }, [allSkills]);

  const fetchAIPartSuggestion = useCallback(async (currentDescription: string) => {
    if (!currentDescription.trim() || allParts.length === 0) {
      return;
    }
    setIsFetchingPartSuggestion(true);
    const input: SuggestJobPartsActionInput = {
      jobDescription: currentDescription,
      availableParts: allParts,
    };
    const result = await suggestJobPartsAction(input);
    if(result.data?.suggestedParts) {
      setRequiredParts(result.data.suggestedParts);
    }
    setIsFetchingPartSuggestion(false);
  }, [allParts]);


  const fetchAIPrioritySuggestion = useCallback(async (currentDescription: string) => {
    if (!currentDescription.trim()) {
      setAiPrioritySuggestion(null);
      return;
    }
    setIsFetchingPrioritySuggestion(true);
    setAiPrioritySuggestion(null);
    const input: SuggestJobPriorityActionInput = { jobDescription: currentDescription };
    const result = await suggestJobPriorityAction(input);
    if (result.data) {
        setAiPrioritySuggestion(result.data);
    }
    setIsFetchingPrioritySuggestion(false);
  }, []);

  useEffect(() => {
    if (isOpen && !job && description.trim()) {
        const timer = setTimeout(() => {
            fetchAISkillSuggestion(description);
            fetchAIPartSuggestion(description);
            fetchAIPrioritySuggestion(description);
        }, 1000); // Debounce
        return () => clearTimeout(timer);
    }
  }, [description, isOpen, job, fetchAISkillSuggestion, fetchAIPrioritySuggestion, fetchAIPartSuggestion]);

  const fetchAIAssignmentSuggestion = useCallback(async (currentDescription: string, currentPriority: JobPriority, currentRequiredSkills: string[], currentRequiredParts: string[], currentScheduledTime?: Date) => {
    if (!currentDescription || !currentPriority || technicians.length === 0) {
      setAiSuggestion(null);
      setSuggestedTechnicianDetails(null);
      return;
    }
    setIsFetchingAISuggestion(true);
    setAiSuggestion(null);
    setSuggestedTechnicianDetails(null);

    const aiTechnicians: AITechnician[] = technicians.map(t => {
      const currentJobs = jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
        .map(j => ({
          jobId: j.id,
          scheduledTime: j.scheduledTime,
          priority: j.priority,
        }));
        
      return {
        technicianId: t.id,
        technicianName: t.name,
        isAvailable: t.isAvailable,
        skills: t.skills as string[],
        partsInventory: t.partsInventory || [],
        location: {
          latitude: t.location.latitude,
          longitude: t.location.longitude,
        },
        currentJobs: currentJobs,
      };
    });

    const input: AllocateJobActionInput = {
      jobDescription: currentDescription,
      jobPriority: currentPriority,
      requiredSkills: currentRequiredSkills,
      requiredParts: currentRequiredParts,
      technicianAvailability: aiTechnicians,
      scheduledTime: currentScheduledTime?.toISOString(),
    };

    const result = await allocateJobAction(input);
    setIsFetchingAISuggestion(false);

    if (result.error) {
      toast({ title: "AI Suggestion Error", description: result.error, variant: "destructive" });
      setAiSuggestion(null);
    } else if (result.data) {
      setAiSuggestion(result.data);
      const tech = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
      setSuggestedTechnicianDetails(tech || null);
    }
  }, [technicians, toast, jobs]);


  useEffect(() => {
    if (isOpen && !job && description.trim() && priority) { 
      const timer = setTimeout(() => {
        fetchAIAssignmentSuggestion(description, priority, requiredSkills, requiredParts, scheduledTime);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [description, priority, requiredSkills, requiredParts, scheduledTime, isOpen, job, fetchAIAssignmentSuggestion]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setLocationAddress(location.address);
    setLatitude(location.lat);
    setLongitude(location.lng);
  };
  
  const handleSkillChange = (skill: string) => {
    setRequiredSkills(prevSkills => 
      prevSkills.includes(skill) 
        ? prevSkills.filter(s => s !== skill) 
        : [...prevSkills, skill]
    );
  };
  
  const handlePartChange = (part: string) => {
    setRequiredParts(prevParts => 
      prevParts.includes(part) 
        ? prevParts.filter(p => p !== part) 
        : [...prevParts, part]
    );
  };


  const handleSubmit = async (assignTechId: string | null = null) => {
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Address.", variant: "destructive" });
      return;
    }
    
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'assignedTechnicianId' | 'notes' | 'photos' | 'estimatedDurationMinutes'> & { companyId: string, scheduledTime?: string; requiredSkills?: string[]; requiredParts?: string[] } = {
      companyId: user.uid,
      title,
      description,
      priority,
      requiredSkills,
      requiredParts,
      customerName: customerName || "N/A",
      customerPhone: customerPhone || "N/A",
      location: {
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
        address: locationAddress 
      },
      scheduledTime: scheduledTime?.toISOString(),
    };

    try {
      let finalJobDataForCallback: Job;

      if (job) { // EDITING A JOB
        const jobDocRef = doc(db, "jobs", job.id);
        const updatePayload: any = { ...jobData, updatedAt: serverTimestamp() };
        if (assignTechId && job.assignedTechnicianId !== assignTechId) {
            updatePayload.assignedTechnicianId = assignTechId;
            updatePayload.status = 'Assigned';
            updatePayload.assignedAt = serverTimestamp();
        }
        await updateDoc(jobDocRef, updatePayload);
        finalJobDataForCallback = { ...job, ...updatePayload, updatedAt: new Date().toISOString() };
        toast({ title: "Job Updated", description: `Job "${finalJobDataForCallback.title}" has been updated.` });
        onJobAddedOrUpdated?.(finalJobDataForCallback, assignTechId);

      } else { // CREATING A NEW JOB
        const techToAssign = assignTechId ? technicians.find(t => t.id === assignTechId) : null;
        const isInterruption = !!(techToAssign && !techToAssign.isAvailable && techToAssign.currentJobId);

        const batch = writeBatch(db);

        const newJobRef = doc(collection(db, "jobs"));
        
        const newJobPayload: any = {
          ...jobData,
          status: assignTechId ? 'Assigned' as JobStatus : 'Pending' as JobStatus,
          assignedTechnicianId: assignTechId || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notes: '',
          photos: [],
          estimatedDurationMinutes: 0,
        };

        if(assignTechId) {
            newJobPayload.assignedAt = serverTimestamp();
        }

        batch.set(newJobRef, newJobPayload);

        if (assignTechId && techToAssign) {
          const techDocRef = doc(db, "technicians", assignTechId);
          batch.update(techDocRef, {
              isAvailable: false, // Tech will be busy with the new job
              currentJobId: newJobRef.id,
          });

          if (isInterruption) {
              const oldJobRef = doc(db, "jobs", techToAssign.currentJobId!);
              batch.update(oldJobRef, {
                  status: 'Pending' as JobStatus,
                  assignedTechnicianId: null,
                  notes: 'This job was unassigned due to a higher priority interruption.',
              });
          }
        }
        
        await batch.commit();

        finalJobDataForCallback = {
            ...newJobPayload,
            id: newJobRef.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (isInterruption) {
            toast({ title: "Job Interrupted & Assigned", description: `Assigned "${finalJobDataForCallback.title}" and returned previous job to queue.` });
        } else if (assignTechId) {
            toast({ title: "Job Added & Assigned", description: `New job "${finalJobDataForCallback.title}" created and assigned.` });
        } else {
            toast({ title: "Job Added", description: `New job "${finalJobDataForCallback.title}" created.` });
        }

        onJobAddedOrUpdated?.(finalJobDataForCallback, assignTechId);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving job to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not save job. Check console.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const isInterruptionSuggestion = aiSuggestion?.suggestedTechnicianId && suggestedTechnicianDetails && !suggestedTechnicianDetails.isAvailable;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{job ? 'Edit Job Details' : 'Add New Job'}</DialogTitle>
          <DialogDescription>
            {job ? 'Update the details for this job.' : 'Fill in the details for the new job. AI will suggest a technician.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(null);}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input id="jobTitle" name="jobTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" required />
          </div>
          <div>
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea id="jobDescription" name="jobDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job requirements..." required rows={3}/>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobPriority">Job Priority *</Label>
              <Select value={priority} onValueChange={(value: JobPriority) => setPriority(value)} name="jobPriority">
                <SelectTrigger id="jobPriority" name="jobPriorityTrigger">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              {isFetchingPrioritySuggestion && !job && (
                <div className="flex items-center text-xs mt-1.5 text-muted-foreground">
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> AI is analyzing...
                </div>
              )}
              {!isFetchingPrioritySuggestion && aiPrioritySuggestion && !job && (
                <div className="text-xs mt-1.5 p-2 bg-secondary/50 rounded-md border">
                    <p className="font-medium flex items-center gap-1.5"><Lightbulb className="h-3 w-3 text-primary"/> AI Suggests: <strong className="text-primary">{aiPrioritySuggestion.suggestedPriority}</strong></p>
                    <p className="text-muted-foreground italic">"{aiPrioritySuggestion.reasoning}"</p>
                </div>
              )}
            </div>
             <div>
                <Label htmlFor="scheduledTime">Scheduled Time (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="scheduledTime"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledTime && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledTime ? format(scheduledTime, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={scheduledTime}
                        onSelect={setScheduledTime}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <Label className="flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5" />
                  Required Skills
                  {isFetchingSkillSuggestion && <Loader2 className="h-4 w-4 animate-spin" />}
                </Label>
                <ScrollArea className="h-40 rounded-md border p-3 mt-1">
                  <div className="space-y-2">
                    {allSkills.length === 0 && <p className="text-sm text-muted-foreground">No skills defined in library.</p>}
                    {allSkills.map(skill => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={`skill-${skill.replace(/\s+/g, '-')}`}
                          checked={requiredSkills.includes(skill)}
                          onCheckedChange={() => handleSkillChange(skill)}
                        />
                        <Label htmlFor={`skill-${skill.replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" /> Required Parts
                    {isFetchingPartSuggestion && <Loader2 className="h-4 w-4 animate-spin" />}
                </Label>
                 <ScrollArea className="h-40 rounded-md border p-3 mt-1">
                  <div className="space-y-2">
                    {allParts.length === 0 && <p className="text-sm text-muted-foreground">No parts defined in library.</p>}
                    {allParts.map(part => (
                      <div key={part} className="flex items-center space-x-2">
                        <Checkbox
                          id={`part-${part.replace(/\s+/g, '-')}`}
                          checked={requiredParts.includes(part)}
                          onCheckedChange={() => handlePartChange(part)}
                        />
                        <Label htmlFor={`part-${part.replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                          {part}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input id="customerName" name="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div>
            <Label htmlFor="customerPhone">Customer Phone</Label>
            <Input id="customerPhone" name="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 555-1234" />
          </div>
          
          <div>
            <Label htmlFor="jobLocationAddress">Job Location (Address) *</Label>
            <AddressAutocompleteInput
                value={locationAddress}
                onValueChange={setLocationAddress}
                onLocationSelect={handleLocationSelect}
                placeholder="Start typing job address..."
                required
            />
          </div>

          {!job && technicians.length > 0 && (description.trim() || priority) && (
            <div className="p-3 my-2 border rounded-md bg-secondary/50">
              {isFetchingAISuggestion && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>AI is finding the best technician...</span>
                </div>
              )}
              {!isFetchingAISuggestion && aiSuggestion && suggestedTechnicianDetails && (
                <div>
                  <h4 className="text-sm font-semibold mb-1 flex items-center"><Sparkles className="h-4 w-4 mr-1 text-primary" /> AI Suggestion:</h4>
                  <p className="text-sm">
                    Assign to: <strong>{suggestedTechnicianDetails.name}</strong> ({suggestedTechnicianDetails.isAvailable ? "Available" : "Unavailable"}, Skills: {suggestedTechnicianDetails.skills.join(', ') || 'N/A'})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Reason: {aiSuggestion.reasoning}</p>
                </div>
              )}
              {!isFetchingAISuggestion && !aiSuggestion && (description.trim() && priority) && (
                <p className="text-sm text-muted-foreground">Enter job details for AI assignment suggestion.</p>
              )}
            </div>
          )}
          
          <DialogFooter className="sm:justify-start gap-2 mt-4 pt-4 border-t">
            {job ? ( 
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            ) : ( 
              <>
                <Button 
                  type="button" 
                  onClick={() => handleSubmit(aiSuggestion?.suggestedTechnicianId || null)} 
                  disabled={isLoading || isFetchingAISuggestion || !aiSuggestion?.suggestedTechnicianId}
                  variant={isInterruptionSuggestion ? "destructive" : "default"}
                  className="flex-1"
                  title={isInterruptionSuggestion ? `Interrupts ${suggestedTechnicianDetails?.name}'s current low-priority job.` : `Assign to ${suggestedTechnicianDetails?.name}`}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isInterruptionSuggestion ? <AlertTriangle className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                  {isInterruptionSuggestion ? 'Interrupt & Assign' : `Save & Assign to ${suggestedTechnicianDetails?.name || 'Suggested'}`}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  variant="outline"
                  className="flex-1"
                >
                   {isLoading && !aiSuggestion?.suggestedTechnicianId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save as Pending
                </Button>
              </>
            )}
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="sm:ml-auto">
              Close
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditJobDialog;
