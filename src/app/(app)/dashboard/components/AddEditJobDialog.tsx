
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
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Job, JobPriority, JobStatus, Technician, AITechnician } from '@/types';
import { Loader2, Sparkles, UserCheck, Save, Calendar as CalendarIcon, ListChecks } from 'lucide-react';
import { allocateJobAction, AllocateJobActionInput, suggestJobSkillsAction, SuggestJobSkillsActionInput } from "@/actions/fleet-actions";
import type { AllocateJobOutput } from "@/ai/flows/allocate-job";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];

interface AddEditJobDialogProps {
  children: React.ReactNode;
  job?: Job;
  jobs: Job[];
  technicians: Technician[];
  allSkills: string[];
  onJobAddedOrUpdated?: (job: Job, assignedTechnicianId?: string | null) => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ children, job, jobs, technicians, allSkills, onJobAddedOrUpdated }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AllocateJobOutput | null>(null);
  const [suggestedTechnicianDetails, setSuggestedTechnicianDetails] = useState<Technician | null>(null);
  const [isFetchingSkills, setIsFetchingSkills] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
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
    setCustomerName(job?.customerName || '');
    setCustomerPhone(job?.customerPhone || '');
    setLocationAddress(job?.location.address || '');
    setLatitude(job?.location.latitude || null);
    setLongitude(job?.location.longitude || null);
    setScheduledTime(job?.scheduledTime ? new Date(job.scheduledTime) : undefined);
    setAiSuggestion(null);
    setSuggestedTechnicianDetails(null);
  }, [job]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, isOpen, resetForm]);

  const fetchAISuggestion = useCallback(async (currentDescription: string, currentPriority: JobPriority, currentRequiredSkills: string[], currentScheduledTime?: Date) => {
    if (!currentDescription || !currentPriority || technicians.length === 0) {
      setAiSuggestion(null);
      setSuggestedTechnicianDetails(null);
      return;
    }
    setIsFetchingAISuggestion(true);
    setAiSuggestion(null);
    setSuggestedTechnicianDetails(null);

    const availableAITechnicians: AITechnician[] = technicians.map(t => {
      const currentJobs = jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
        .map(j => ({
          jobId: j.id,
          scheduledTime: j.scheduledTime,
        }));
        
      return {
        technicianId: t.id,
        technicianName: t.name,
        isAvailable: t.isAvailable,
        skills: t.skills as string[],
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
      technicianAvailability: availableAITechnicians,
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

  // Debounced effect for fetching AI skill suggestions
  useEffect(() => {
    if (isOpen && !job && description.trim() && allSkills.length > 0) {
      const handler = setTimeout(async () => {
        setIsFetchingSkills(true);
        const result = await suggestJobSkillsAction({
          jobDescription: description,
          availableSkills: allSkills,
        });
        if (result.data?.suggestedSkills) {
          setRequiredSkills(currentSkills => Array.from(new Set([...currentSkills, ...result.data!.suggestedSkills!])));
        }
        if(result.error) {
            toast({ title: "AI Skill Suggestion Error", description: result.error, variant: "destructive" });
        }
        setIsFetchingSkills(false);
      }, 1500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [description, isOpen, job, allSkills, toast]);


  useEffect(() => {
    if (isOpen && !job && description.trim() && priority) { 
      const timer = setTimeout(() => {
        fetchAISuggestion(description, priority, requiredSkills, scheduledTime);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [description, priority, requiredSkills, scheduledTime, isOpen, job, fetchAISuggestion]);

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

  const handleSubmit = async (assignTechId: string | null = null) => {
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Address.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'assignedTechnicianId' | 'notes' | 'photos' | 'estimatedDurationMinutes'> & { updatedAt: any; scheduledTime?: string; requiredSkills?: string[] } = {
      title,
      description,
      priority,
      requiredSkills,
      customerName: customerName || "N/A",
      customerPhone: customerPhone || "N/A",
      location: {
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
        address: locationAddress 
      },
      updatedAt: serverTimestamp(),
      scheduledTime: scheduledTime?.toISOString(),
    };

    try {
      let finalJob: Job;
      if (job) { 
        const jobDocRef = doc(db, "jobs", job.id);
        const updatePayload = { ...jobData, ...(assignTechId && { assignedTechnicianId: assignTechId, status: 'Assigned' as JobStatus }) };
        await updateDoc(jobDocRef, updatePayload);
        finalJob = { ...job, ...updatePayload, updatedAt: new Date().toISOString() };
        toast({ title: "Job Updated", description: `Job "${finalJob.title}" has been updated.` });
        onJobAddedOrUpdated?.(finalJob, assignTechId);

      } else { 
        const newJobPayload = {
          ...jobData,
          status: assignTechId ? 'Assigned' as JobStatus : 'Pending' as JobStatus,
          assignedTechnicianId: assignTechId || null,
          createdAt: serverTimestamp(),
          notes: '',
          photos: [],
          estimatedDurationMinutes: 0, 
        };
        const docRef = await addDoc(collection(db, "jobs"), newJobPayload);
        finalJob = {
            ...newJobPayload,
            id: docRef.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        toast({ title: "Job Added", description: `New job "${finalJob.title}" created.` });
        
        if (assignTechId) {
          const techDocRef = doc(db, "technicians", assignTechId);
          await updateDoc(techDocRef, {
            isAvailable: false,
            currentJobId: finalJob.id,
          });
        }
        onJobAddedOrUpdated?.(finalJob, assignTechId);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving job to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not save job. Check console.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{job ? 'Edit Job Details' : 'Add New Job'}</DialogTitle>
          <DialogDescription>
            {job ? 'Update the details for this job.' : 'Fill in the details for the new job. AI will suggest a technician and required skills.'}
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
           <div>
              <Label className="flex items-center gap-2"><ListChecks className="inline h-3.5 w-3.5 mr-1" />Required Skills {isFetchingSkills && <Loader2 className="h-4 w-4 animate-spin"/>}</Label>
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
                  disabled={isLoading || isFetchingAISuggestion || !aiSuggestion?.suggestedTechnicianId || !suggestedTechnicianDetails?.isAvailable}
                  variant={aiSuggestion?.suggestedTechnicianId && suggestedTechnicianDetails?.isAvailable ? "default" : "secondary"}
                  className="flex-1"
                  title={aiSuggestion?.suggestedTechnicianId && !suggestedTechnicianDetails?.isAvailable ? `${suggestedTechnicianDetails?.name} is unavailable` : ''}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                  Save & Assign to {suggestedTechnicianDetails?.name || "Suggested"}
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
