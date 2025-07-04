
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Job, JobPriority, JobStatus, Technician, AITechnician, Customer } from '@/types';
import { Loader2, Sparkles, UserCheck, Save, Calendar as CalendarIcon, ListChecks, AlertTriangle, Lightbulb, Settings, Edit, Trash2, FilePenLine } from 'lucide-react';
import { allocateJobAction, AllocateJobActionInput, suggestJobSkillsAction, SuggestJobSkillsActionInput, suggestScheduleTimeAction, type SuggestScheduleTimeInput, deleteJobAction } from "@/actions/fleet-actions";
import type { AllocateJobOutput } from "@/types";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress', 'Draft'];
const ALL_JOB_STATUSES: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Cancelled', 'Draft'];
const UNASSIGNED_VALUE = '_unassigned_'; // Special value for unassigned technician

interface AddEditJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  jobs: Job[];
  technicians: Technician[];
  customers: Customer[];
  allSkills: string[];
  onJobAddedOrUpdated?: (job: Job, assignedTechnicianId?: string | null) => void;
  onManageSkills: () => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ isOpen, onClose, job, jobs, technicians, customers, allSkills, onJobAddedOrUpdated, onManageSkills }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [isFetchingSkillSuggestion, setIsFetchingSkillSuggestion] = useState(false);
  const [isFetchingScheduleSuggestion, setIsFetchingScheduleSuggestion] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState<AllocateJobOutput | null>(null);
  const [skillSuggestionReasoning, setSkillSuggestionReasoning] = useState<string | null>(null);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<{ time: string; reasoning: string }[] | null>(null);
  const [suggestedTechnicianDetails, setSuggestedTechnicianDetails] = useState<Technician | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [status, setStatus] = useState<JobStatus>('Pending');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [manualTechnicianId, setManualTechnicianId] = useState<string>(UNASSIGNED_VALUE);

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  const resetForm = useCallback(() => {
    setTitle(job?.title || '');
    setDescription(job?.description || '');
    setPriority(job?.priority || 'Medium');
    setStatus(job?.status || 'Pending');
    setRequiredSkills(job?.requiredSkills || []);
    setCustomerName(job?.customerName || '');
    setCustomerPhone(job?.customerPhone || '');
    setLocationAddress(job?.location.address || '');
    setLatitude(job?.location.latitude || null);
    setLongitude(job?.location.longitude || null);
    setScheduledTime(job?.scheduledTime ? new Date(job.scheduledTime) : undefined);
    setManualTechnicianId(job?.assignedTechnicianId || UNASSIGNED_VALUE);
    setAiSuggestion(null);
    setSkillSuggestionReasoning(null);
    setScheduleSuggestions(null);
    setSuggestedTechnicianDetails(null);
    setCustomerSuggestions([]);
    setIsCustomerPopoverOpen(false);
    setSkillSearchTerm('');
  }, [job]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, isOpen, resetForm]);

  const handleSaveDraft = useCallback(async () => {
    if (job || !userProfile?.companyId) return;

    if (title.trim() || description.trim()) {
        const draftPayload = {
            companyId: userProfile.companyId,
            title: title.trim() || "Untitled Draft",
            description: description.trim(),
            priority,
            requiredSkills,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            location: {
                latitude: latitude ?? 0,
                longitude: longitude ?? 0,
                address: locationAddress.trim(),
            },
            scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
            status: 'Draft' as JobStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            assignedTechnicianId: null,
            notes: 'This job was saved as a draft.',
        };
        try {
            await addDoc(collection(db, "jobs"), draftPayload);
            toast({ title: "Draft Saved", description: "The job has been saved as a draft for later." });
        } catch (error) {
            console.error("Error saving draft:", error);
            toast({ title: "Error", description: "Could not save job draft.", variant: "destructive" });
        }
    }
  }, [job, userProfile, title, description, priority, requiredSkills, customerName, customerPhone, locationAddress, latitude, longitude, scheduledTime, toast]);
  
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    if (value.length > 1) {
        const filtered = customers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
        setCustomerSuggestions(filtered);
        setIsCustomerPopoverOpen(filtered.length > 0);
    } else {
        setCustomerSuggestions([]);
        setIsCustomerPopoverOpen(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setLocationAddress(customer.address);
      setIsCustomerPopoverOpen(false);
      setCustomerSuggestions([]);
  };

  const fetchAISkillSuggestion = useCallback(async (currentDescription: string) => {
    if (!currentDescription.trim() || allSkills.length === 0) {
      toast({
        title: "Cannot Suggest Skills",
        description: "Please enter a job description first.",
        variant: "default",
      });
      return;
    }
    setIsFetchingSkillSuggestion(true);
    setSkillSuggestionReasoning(null);
    const input: SuggestJobSkillsActionInput = {
      jobDescription: currentDescription,
      availableSkills: allSkills,
    };
    const result = await suggestJobSkillsAction(input);
    if (result.data) {
        if (result.data.suggestedSkills && result.data.suggestedSkills.length > 0) {
            setRequiredSkills(result.data.suggestedSkills);
            toast({ title: "Skills Suggested", description: "AI has suggested skills based on the description." });
        } else {
            setRequiredSkills([]); // Clear existing skills if none are suggested
            const reasoning = result.data.reasoning || "No specific skills from the library seem to match the job description.";
            setSkillSuggestionReasoning(reasoning);
        }
    } else {
       setSkillSuggestionReasoning(result.error || "An error occurred while suggesting skills.");
    }
    setIsFetchingSkillSuggestion(false);
  }, [allSkills, toast]);

  const fetchScheduleSuggestion = useCallback(async (currentPriority: JobPriority, currentRequiredSkills: string[]) => {
    if (!currentPriority || technicians.length === 0) {
        setScheduleSuggestions(null);
        return;
    }
    setIsFetchingScheduleSuggestion(true);
    setScheduleSuggestions(null);

    const techWithJobs = technicians.map(t => ({
        id: t.id,
        name: t.name,
        skills: t.skills || [],
        jobs: jobs
            .filter(j => j.assignedTechnicianId === t.id && j.scheduledTime)
            .map(j => ({ id: j.id, scheduledTime: j.scheduledTime! })),
    }));

    const input: SuggestScheduleTimeInput = {
        jobPriority: currentPriority,
        requiredSkills: currentRequiredSkills,
        currentTime: new Date().toISOString(),
        technicians: techWithJobs,
    };

    const result = await suggestScheduleTimeAction(input);
    if (result.data) {
        setScheduleSuggestions(result.data.suggestions);
    }
    setIsFetchingScheduleSuggestion(false);
}, [technicians, jobs]);

  const fetchAIAssignmentSuggestion = useCallback(async (currentDescription: string, currentPriority: JobPriority, currentRequiredSkills: string[], currentScheduledTime?: Date) => {
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
        skills: t.skills || [],
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
      if (result.data.suggestedTechnicianId) {
        const tech = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
        setSuggestedTechnicianDetails(tech || null);
      }
    }
  }, [technicians, toast, jobs]);


  useEffect(() => {
    // Only fetch AI assignment suggestions automatically when we have enough info
    if (isOpen && !job && description.trim() && priority && locationAddress.trim() && latitude !== null && longitude !== null) {
      const timer = setTimeout(() => {
        fetchAIAssignmentSuggestion(description, priority, requiredSkills, scheduledTime);
        fetchScheduleSuggestion(priority, requiredSkills);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [description, priority, locationAddress, latitude, longitude, requiredSkills, scheduledTime, isOpen, job, fetchAIAssignmentSuggestion, fetchScheduleSuggestion]);

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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const hours = scheduledTime ? scheduledTime.getHours() : 9;
    const minutes = scheduledTime ? scheduledTime.getMinutes() : 0;
    const newDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes
    );
    setScheduledTime(newDateTime);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    if (!timeValue || !scheduledTime) return;
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDateTime = new Date(scheduledTime);
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    setScheduledTime(newDateTime);
  };
  
  const handleDeleteJob = async () => {
    if (!job) return;
    setIsDeleting(true);
    const result = await deleteJobAction({ jobId: job.id });
    if (result.error) {
        toast({ title: "Error", description: `Failed to delete job: ${result.error}`, variant: "destructive" });
    } else {
        toast({ title: "Success", description: `Job "${job.title}" has been deleted.` });
        onClose();
    }
    setIsDeleting(false);
  };

  const handleSubmit = async (assignTechId: string | null = null) => {
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Address.", variant: "destructive" });
      return;
    }

    if (latitude === null || longitude === null) {
      toast({ title: "Invalid Address", description: "Please select a valid address from the dropdown suggestions to set the location.", variant: "destructive" });
      return;
    }
    
    if (!userProfile?.companyId) {
      toast({ title: "Authentication Error", description: "Company ID not found.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const jobData: any = {
      companyId: userProfile.companyId,
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
      scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
    };

    try {
      let finalJobDataForCallback: Job;

      if (job) { // EDITING A JOB
        const batch = writeBatch(db);
        const jobDocRef = doc(db, "jobs", job.id);
        const updatePayload: any = { ...jobData, updatedAt: serverTimestamp() };

        const newAssignedTechId = manualTechnicianId === UNASSIGNED_VALUE ? null : manualTechnicianId;
        const currentAssignedId = job.assignedTechnicianId || null;
        const technicianHasChanged = newAssignedTechId !== currentAssignedId;
        
        if (technicianHasChanged) {
            if (newAssignedTechId === null) { // Un-assigning
                updatePayload.assignedTechnicianId = null;
                updatePayload.status = 'Pending';
                if(job.assignedTechnicianId) {
                    const oldTechDocRef = doc(db, "technicians", job.assignedTechnicianId);
                    batch.update(oldTechDocRef, { isAvailable: true, currentJobId: null });
                }
            } else { // Assigning or Re-assigning
                updatePayload.assignedTechnicianId = newAssignedTechId;
                updatePayload.status = 'Assigned';
                updatePayload.assignedAt = serverTimestamp();
                
                const newTechDocRef = doc(db, "technicians", newAssignedTechId);
                batch.update(newTechDocRef, { isAvailable: false, currentJobId: job.id });
                
                if (job.assignedTechnicianId) {
                    const oldTechDocRef = doc(db, "technicians", job.assignedTechnicianId);
                    batch.update(oldTechDocRef, { isAvailable: true, currentJobId: null });
                }
            }
        } else {
            // No technician change, just respect the status dropdown from the UI
            updatePayload.status = status;
        }

        const finalStatus = updatePayload.status || job.status;
        const wasCompletedOrCancelled = job.status === 'Completed' || job.status === 'Cancelled';
        const isNowCompletedOrCancelled = finalStatus === 'Completed' || finalStatus === 'Cancelled';
        
        if (!wasCompletedOrCancelled && isNowCompletedOrCancelled && job.assignedTechnicianId) {
            const techToFree = job.assignedTechnicianId;
            const techDocRef = doc(db, "technicians", techToFree);
            batch.update(techDocRef, { isAvailable: true, currentJobId: null });
        }
        
        batch.update(jobDocRef, updatePayload);
        await batch.commit();

        finalJobDataForCallback = { ...job, ...updatePayload, updatedAt: new Date().toISOString() };
        toast({ title: "Job Updated", description: `Job "${finalJobDataForCallback.title}" has been updated.` });
        onJobAddedOrUpdated?.(finalJobDataForCallback, newAssignedTechId || null);

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
      onClose();
    } catch (error) {
      console.error("Error saving job to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not save job. Check console.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const isInterruptionSuggestion = aiSuggestion?.suggestedTechnicianId && suggestedTechnicianDetails && !suggestedTechnicianDetails.isAvailable;
  
  const isEditingDraft = job?.status === 'Draft';
  
  const handleDialogClose = (open: boolean) => {
    if (!open && !job && !isLoading) { // Don't save draft if dialog was submitted or is loading
      handleSaveDraft();
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90dvh] p-0">
          <DialogHeader className="px-6 pt-6 flex-shrink-0">
            <DialogTitle className="font-headline">{job ? 'Edit Job Details' : 'Add New Job'}</DialogTitle>
            <DialogDescription>
              {job ? 'Update the details for this job.' : userProfile?.role === 'csr' ? 'Create a job ticket for a dispatcher to review and assign.' : 'Fill in the details for the new job. AI will suggest a technician.'}
            </DialogDescription>
          </DialogHeader>
          <form id="job-form" ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(null); }} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isEditingDraft && (
                <Alert variant="default" className="mb-4 bg-amber-50 border-amber-400 text-amber-900 [&>svg]:text-amber-600">
                  <FilePenLine className="h-4 w-4" />
                  <AlertTitle className="font-semibold">Editing Draft</AlertTitle>
                  <AlertDescription>
                    This is a draft job. Please complete all required fields and set a status to "Pending" to activate it.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input id="jobTitle" name="jobTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" required />
                  </div>
                  <div>
                    <Label htmlFor="jobDescription">Job Description *</Label>
                    <Textarea id="jobDescription" name="jobDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job requirements..." required rows={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {job && (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="jobStatus">Status</Label>
                          <Select value={status} onValueChange={(value: JobStatus) => setStatus(value)}
                            disabled={manualTechnicianId !== (job.assignedTechnicianId || UNASSIGNED_VALUE)}
                          >
                            <SelectTrigger id="jobStatus">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_JOB_STATUSES.filter(s => s !== 'Draft').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                      <PopoverAnchor>
                        <Input
                          id="customerName"
                          name="customerName"
                          value={customerName}
                          onChange={handleCustomerNameChange}
                          placeholder="e.g., John Doe"
                          autoComplete="off"
                        />
                      </PopoverAnchor>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="max-h-60 overflow-y-auto">
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 text-sm cursor-pointer hover:bg-accent"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <p className="font-semibold">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
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
                  {!job && (
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
                            {scheduledTime ? format(scheduledTime, "PPP p") : <span>Pick a date & time</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledTime}
                            onSelect={handleDateSelect}
                            initialFocus
                          />
                          <div className="p-3 border-t border-border">
                              <Label htmlFor="time-input" className="text-sm">Time</Label>
                              <Input
                                  id="time-input"
                                  type="time"
                                  onChange={handleTimeChange}
                                  value={scheduledTime ? format(scheduledTime, 'HH:mm') : ''}
                                  disabled={!scheduledTime}
                              />
                          </div>
                        </PopoverContent>
                      </Popover>
                      {isFetchingScheduleSuggestion && (
                        <div className="flex items-center text-xs mt-1.5 text-muted-foreground">
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> AI is suggesting a time...
                        </div>
                      )}
                      {!isFetchingScheduleSuggestion && scheduleSuggestions && scheduleSuggestions.length > 0 && !job && (
                        <div className="space-y-1 mt-2">
                          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lightbulb className="h-3 w-3 text-primary" />AI Time Suggestions</Label>
                          <Select onValueChange={(value) => setScheduledTime(new Date(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a suggested time..." />
                            </SelectTrigger>
                            <SelectContent>
                              {scheduleSuggestions.map((suggestion, index) => (
                                <SelectItem key={index} value={suggestion.time}>
                                  <div className="flex flex-col text-left">
                                    <span className="font-semibold">{format(new Date(suggestion.time), "EEE, PPP 'at' p")}</span>
                                    <span className="text-xs text-muted-foreground">{suggestion.reasoning}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                  {job && (
                    <div>
                      <Label htmlFor="assign-technician">Assigned Technician</Label>
                      <Select value={manualTechnicianId} onValueChange={setManualTechnicianId}>
                        <SelectTrigger id="assign-technician">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_VALUE}>-- Unassigned --</SelectItem>
                          {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label className="flex items-center gap-2">
                            <ListChecks className="h-3.5 w-3.5" />
                            Required Skills
                        </Label>
                        {!job && (
                           <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchAISkillSuggestion(description)}
                                disabled={isFetchingSkillSuggestion || !description.trim()}
                            >
                                {isFetchingSkillSuggestion ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Suggest Skills
                            </Button>
                        )}
                    </div>
                    <Input
                      placeholder="Search skills..."
                      value={skillSearchTerm}
                      onChange={(e) => setSkillSearchTerm(e.target.value)}
                      className="mb-2 h-8"
                    />
                    {skillSuggestionReasoning && !isFetchingSkillSuggestion && (
                        <div className="text-xs text-muted-foreground p-2 bg-secondary rounded-md mb-2">
                            {skillSuggestionReasoning}
                        </div>
                    )}
                    <ScrollArea className="h-32 rounded-md border p-3">
                      <div className="space-y-2">
                        {allSkills.length === 0 ? (
                          <div className="text-center flex flex-col items-center justify-center h-full pt-8">
                            <p className="text-sm text-muted-foreground">No skills defined in library.</p>
                            <Button type="button" variant="link" className="mt-1" onClick={onManageSkills}>
                              <Settings className="mr-2 h-4 w-4" /> Manage Skills
                            </Button>
                          </div>
                        ) : (
                          allSkills.filter(skill => skill.toLowerCase().includes(skillSearchTerm.toLowerCase())).map(skill => (
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
                          ))
                        )}
                        {allSkills.filter(skill => skill.toLowerCase().includes(skillSearchTerm.toLowerCase())).length === 0 && allSkills.length > 0 && (
                          <p className="text-sm text-muted-foreground text-center">No skills match your search.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  {userProfile?.role !== 'csr' && !job && (
                    <div className="p-3 my-2 border rounded-md bg-secondary/50">
                      {isFetchingAISuggestion && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>AI is finding the best technician...</span>
                        </div>
                      )}
                      {!isFetchingAISuggestion && aiSuggestion && aiSuggestion.suggestedTechnicianId && suggestedTechnicianDetails && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1 flex items-center"><Sparkles className="h-4 w-4 mr-1 text-primary" /> AI Suggestion:</h4>
                          <p className="text-sm">
                            Assign to: <strong>{suggestedTechnicianDetails.name}</strong> ({suggestedTechnicianDetails.isAvailable ? "Available" : "Unavailable"}, Skills: {suggestedTechnicianDetails.skills.join(', ') || 'N/A'})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Reason: {aiSuggestion.reasoning}</p>
                        </div>
                      )}
                      {!isFetchingAISuggestion && aiSuggestion && !aiSuggestion.suggestedTechnicianId && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1 flex items-center"><Sparkles className="h-4 w-4 mr-1 text-primary" /> AI Suggestion:</h4>
                          <p className="text-sm text-muted-foreground">Could not find a suitable technician.</p>
                          <p className="text-xs text-muted-foreground mt-1">Reason: {aiSuggestion.reasoning}</p>
                        </div>
                      )}
                      {!isFetchingAISuggestion && !aiSuggestion && (
                        <p className="text-sm text-muted-foreground">Enter job details and a valid address for an AI assignment suggestion.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4 border-t gap-2 px-6 pb-6 flex-shrink-0">
              <div>
                {job && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Job
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the job "{job.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteJob} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Close
                </Button>
                {job ? (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                ) : (
                  <>
                    {userProfile?.role !== 'csr' && (
                      <Button
                        type="button"
                        onClick={() => handleSubmit(aiSuggestion?.suggestedTechnicianId || null)}
                        disabled={isLoading || isFetchingAISuggestion || !aiSuggestion?.suggestedTechnicianId}
                        variant={isInterruptionSuggestion ? "destructive" : "default"}
                        title={isInterruptionSuggestion ? `Interrupts ${suggestedTechnicianDetails?.name}'s current low-priority job.` : `Assign to ${suggestedTechnicianDetails?.name}`}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isInterruptionSuggestion ? <AlertTriangle className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                        {isInterruptionSuggestion ? 'Interrupt & Assign' : `Save & Assign to ${suggestedTechnicianDetails?.name || 'Suggested'}`}
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant={userProfile?.role === 'csr' ? 'default' : 'outline'}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {userProfile?.role === 'csr' ? 'Create Job Ticket' : 'Save as Pending'}
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditJobDialog;
