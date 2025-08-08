
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
import type { Job, JobPriority, JobStatus, Technician, Customer, Contract } from '@/types';
import { Loader2, UserCheck, Save, Calendar as CalendarIcon, ListChecks, AlertTriangle, Lightbulb, Settings, Trash2, FilePenLine, Link as LinkIcon, Copy, Check, Info, Repeat, Bot, Clock, Sparkles } from 'lucide-react';
import { allocateJobAction, suggestJobSkillsAction, suggestScheduleTimeAction, type AllocateJobActionInput, type SuggestJobSkillsActionInput, type SuggestScheduleTimeInput, generateTriageLinkAction } from "@/actions/ai-actions";
import { deleteJobAction } from '@/actions/fleet-actions';
import type { AllocateJobOutput, AITechnician } from "@/types";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

const UNASSIGNED_VALUE = '_unassigned_'; // Special value for unassigned technician
const ALL_JOB_STATUSES: JobStatus[] = ['Draft', 'Pending', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Cancelled'];
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress', 'Draft'];


interface AddEditJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  jobs: Job[];
  technicians: Technician[];
  customers: Customer[];
  contracts: Contract[];
  allSkills: string[];
  onJobAddedOrUpdated?: (job: Job, assignedTechnicianId?: string | null) => void;
  onManageSkills: () => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ isOpen, onClose, job, jobs, technicians, customers, contracts, allSkills, onJobAddedOrUpdated, onManageSkills }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [isFetchingSkillSuggestion, setIsFetchingSkillSuggestion] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState<AllocateJobOutput | null>(null);
  const [skillSuggestionReasoning, setSkillSuggestionReasoning] = useState<string | null>(null);
  const [suggestedTechnicianDetails, setSuggestedTechnicianDetails] = useState<Technician | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [status, setStatus] = useState<JobStatus>('Pending');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [manualTechnicianId, setManualTechnicianId] = useState<string>(UNASSIGNED_VALUE);
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  
  const [triageMessage, setTriageMessage] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const resetForm = useCallback(() => {
    setTitle(job?.title || '');
    setDescription(job?.description || '');
    setPriority(job?.priority || 'Medium');
    setStatus(job?.status || 'Pending');
    setRequiredSkills(job?.requiredSkills || []);
    setCustomerName(job?.customerName || '');
    setCustomerEmail(job?.customerEmail || '');
    setCustomerPhone(job?.customerPhone || '');
    setLocationAddress(job?.location.address || '');
    setLatitude(job?.location.latitude || null);
    setLongitude(job?.location.longitude || null);
    setScheduledTime(job?.scheduledTime ? new Date(job.scheduledTime) : undefined);
    setManualTechnicianId(job?.assignedTechnicianId || UNASSIGNED_VALUE);
    setSelectedContractId(job?.sourceContractId || '');
    setAiSuggestion(null);
    setSkillSuggestionReasoning(null);
    setSuggestedTechnicianDetails(null);
    setCustomerSuggestions([]);
    setIsCustomerPopoverOpen(false);
    setSkillSearchTerm('');
    setTriageMessage(null);
    setIsGeneratingLink(false);
    setIsCopied(false);
  }, [job]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, isOpen, resetForm]);

  // Handle smart status updates
  useEffect(() => {
    if (manualTechnicianId === UNASSIGNED_VALUE && (status === 'Assigned' || status === 'En Route' || status === 'In Progress')) {
        setStatus('Pending');
    }

    if (manualTechnicianId !== UNASSIGNED_VALUE && (status === 'Pending' || status === 'Draft')) {
        setStatus('Assigned');
    }
    
    if (status === 'Pending' && manualTechnicianId !== UNASSIGNED_VALUE) {
        setManualTechnicianId(UNASSIGNED_VALUE);
    }
  }, [status, manualTechnicianId]);

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    setSelectedContractId('');
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
      setCustomerEmail(customer.email || '');
      setCustomerPhone(customer.phone || '');
      setLocationAddress(customer.address || '');
      setIsCustomerPopoverOpen(false);
      setCustomerSuggestions([]);
  };

   const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setCustomerName(contract.customerName);
      setCustomerPhone(contract.customerPhone || '');
      setLocationAddress(contract.customerAddress);
      setCustomerEmail(''); // Contracts don't have email, clear it
    }
  };

  const fetchAISkillSuggestion = useCallback(async (currentTitle: string, currentDescription: string) => {
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
      jobTitle: currentTitle,
      jobDescription: currentDescription,
      availableSkills: allSkills,
    };
    const result = await suggestJobSkillsAction(input);
    if (result.data) {
        if (result.data.suggestedSkills && result.data.suggestedSkills.length > 0) {
            setRequiredSkills(result.data.suggestedSkills);
            toast({ title: "Fleety's Skills Suggestion", description: "Fleety has suggested skills based on the description." });
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
          location: j.location,
        }));
        
      return {
        technicianId: t.id,
        technicianName: t.name,
        isAvailable: t.isAvailable,
        skills: t.skills || [],
        liveLocation: t.location,
        homeBaseLocation: t.location,
        currentJobs: currentJobs,
        workingHours: t.workingHours,
        isOnCall: t.isOnCall
      };
    });

    if (!appId) {
        toast({ title: "Configuration Error", description: "Firebase Project ID not found.", variant: "destructive"});
        setIsFetchingAISuggestion(false);
        return;
    }

    const input: AllocateJobActionInput = {
      appId,
      currentTime: new Date().toISOString(),
      jobDescription: currentDescription,
      jobPriority: currentPriority,
      requiredSkills: currentRequiredSkills,
      technicianAvailability: aiTechnicians,
      scheduledTime: currentScheduledTime?.toISOString(),
    };

    const result = await allocateJobAction(input);
    setIsFetchingAISuggestion(false);

    if (result.error) {
      toast({ title: "Fleety Suggestion Error", description: result.error, variant: "destructive" });
      setAiSuggestion(null);
    } else if (result.data) {
      setAiSuggestion(result.data);
      if (result.data.suggestedTechnicianId) {
        const tech = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
        setSuggestedTechnicianDetails(tech || null);
        setManualTechnicianId(result.data.suggestedTechnicianId); // Pre-select the suggested technician
      }
    }
  }, [technicians, toast, jobs, appId]);

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
    if (!timeValue) return;

    const baseDate = scheduledTime || new Date();
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDateTime = new Date(baseDate);
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    setScheduledTime(newDateTime);
  };
  
  const handleDeleteJob = async () => {
    if (!job || !userProfile?.companyId || !appId) return;
    setIsDeleting(true);
    const result = await deleteJobAction({ jobId: job.id, companyId: userProfile.companyId, appId });
    if (result.error) {
        toast({ title: "Error", description: `Failed to delete job: ${result.error}`, variant: "destructive" });
    } else {
        toast({ title: "Success", description: `Job "${job.title}" has been deleted.` });
        onClose();
    }
    setIsDeleting(false);
  };

  const handleGenerateTriageLink = async () => {
    if (!job || !userProfile?.companyId || !appId) return;
    setIsGeneratingLink(true);
    const result = await generateTriageLinkAction({
        jobId: job.id,
        companyId: userProfile.companyId,
        appId,
        customerName: customerName || "Valued Customer",
        jobTitle: title || "Your Service",
    });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data?.message) {
      setTriageMessage(result.data.message);
    }
    setIsGeneratingLink(false);
  };
  
  const handleCopyToClipboard = () => {
    if (triageMessage) {
      navigator.clipboard.writeText(triageMessage);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Message copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = async (assignTechId: string | null = null) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        toast({ title: 'Success', description: 'Job saved in mock mode.' });
        onClose();
        return;
    }
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Address.", variant: "destructive" });
      return;
    }

    if (latitude === null || longitude === null) {
      toast({ title: "Invalid Address", description: "Please select a valid address from the dropdown suggestions to set the location.", variant: "destructive" });
      return;
    }
    
    if (!userProfile?.companyId || !appId) {
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
      customerEmail: customerEmail || "N/A",
      customerPhone: customerPhone || "N/A",
      location: {
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
        address: locationAddress 
      },
      scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
      sourceContractId: selectedContractId || job?.sourceContractId || null,
    };

    try {
      let finalJobDataForCallback: Job;

      if (job) { // EDITING A JOB
        const batch = writeBatch(db);
        const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
        const updatePayload: any = { ...jobData, updatedAt: serverTimestamp() };

        const newAssignedTechId = manualTechnicianId === UNASSIGNED_VALUE ? null : manualTechnicianId;
        const currentAssignedId = job.assignedTechnicianId || null;
        const technicianHasChanged = newAssignedTechId !== currentAssignedId;
        
        if (technicianHasChanged) {
            if (newAssignedTechId === null) { // Un-assigning
                updatePayload.assignedTechnicianId = null;
                updatePayload.status = 'Pending';
                if(job.assignedTechnicianId) {
                    const oldTechDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
                    batch.update(oldTechDocRef, { isAvailable: true, currentJobId: null });
                }
            } else { // Assigning or Re-assigning
                updatePayload.assignedTechnicianId = newAssignedTechId;
                updatePayload.status = 'Assigned';
                updatePayload.assignedAt = serverTimestamp();
                
                const newTechDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, newAssignedTechId);
                batch.update(newTechDocRef, { isAvailable: false, currentJobId: job.id });
                
                if (job.assignedTechnicianId) {
                    const oldTechDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
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
            const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, techToFree);
            batch.update(techDocRef, { isAvailable: true, currentJobId: null });
        }
        
        batch.update(jobDocRef, updatePayload);
        await batch.commit();

        finalJobDataForCallback = { ...job, ...updatePayload, updatedAt: new Date().toISOString() };
        toast({ title: "Job Updated", description: `Job "${finalJobDataForCallback.title}" has been updated.` });
        onJobAddedOrUpdated?.(finalJobDataForCallback, newAssignedTechId || null);

      } else { // CREATING A NEW JOB
        const techToAssignId = assignTechId || (manualTechnicianId !== UNASSIGNED_VALUE ? manualTechnicianId : null);
        const techToAssign = techToAssignId ? technicians.find(t => t.id === techToAssignId) : null;
        const isInterruption = !!(techToAssign && !techToAssign.isAvailable && techToAssign.currentJobId);

        const batch = writeBatch(db);

        const newJobRef = doc(collection(db, `artifacts/${appId}/public/data/jobs`));
        
        const newJobPayload: any = {
          ...jobData,
          status: techToAssignId ? 'Assigned' as JobStatus : 'Pending' as JobStatus,
          assignedTechnicianId: techToAssignId || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notes: '',
          photos: [],
          estimatedDurationMinutes: 0,
        };

        if(techToAssignId) {
            newJobPayload.assignedAt = serverTimestamp();
        }

        batch.set(newJobRef, newJobPayload);

        if (techToAssignId && techToAssign) {
          const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, techToAssignId);
          batch.update(techDocRef, {
              isAvailable: false, // Tech will be busy with the new job
              currentJobId: newJobRef.id,
          });

          if (isInterruption) {
              const oldJobRef = doc(db, `artifacts/${appId}/public/data/jobs`, techToAssign.currentJobId!);
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
        } else if (techToAssignId) {
            toast({ title: "Job Added & Assigned", description: `New job "${finalJobDataForCallback.title}" created and assigned.` });
        } else {
            toast({ title: "Job Added", description: `New job "${finalJobDataForCallback.title}" created.` });
        }

        onJobAddedOrUpdated?.(finalJobDataForCallback, techToAssignId);
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
  
  const titleText = job ? 'Edit Job' : 'Add New Job';
  const descriptionText = job ? 'Update the details for this job.' : userProfile?.role === 'csr' ? 'Create a job ticket for a dispatcher to review and assign.' : 'Fill in the details for the new job.';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90dvh] p-0">
          <DialogHeader className="px-6 pt-6 flex-shrink-0">
            <DialogTitle className="font-headline">{titleText}</DialogTitle>
            {descriptionText && <DialogDescription>{descriptionText}</DialogDescription>}
          </DialogHeader>
          <form id="job-form" ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(null); }} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {job?.status === 'Draft' && (
                <Alert variant="default" className="mb-4 bg-amber-50 border-amber-400 text-amber-900 [&>svg]:text-amber-600">
                  <FilePenLine className="h-4 w-4" />
                  <AlertTitle className="font-semibold">Editing Draft</AlertTitle>
                  <AlertDescription>
                    This is a draft job. Please complete all required fields and set a status to "Pending" to activate it.
                  </AlertDescription>
                </Alert>
              )}
              {job?.sourceContractId && (
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600">
                    <Repeat className="h-4 w-4"/>
                    <AlertTitle>Project / Contract Job</AlertTitle>
                    <AlertDescription>
                        This job was generated from a Project/Contract. <Link href="/contracts" className="font-semibold underline">View projects</Link>.
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
                    <Label htmlFor="contractId">Link to Project / Contract (Optional)</Label>
                    <Select value={selectedContractId} onValueChange={handleSelectContract}>
                        <SelectTrigger id="contractId">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unlinked">-- None --</SelectItem>
                            {contracts.map(c => (
                                <SelectItem key={c.id} value={c.id!}>{c.customerName} - {c.jobTemplate.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="jobDescription">Job Description *</Label>
                    <Textarea id="jobDescription" name="jobDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job requirements..." required rows={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Label htmlFor="jobPriority">Job Priority *</Label>
                            <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger type="button" asChild>
                                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p className="max-w-xs">
                                              <b>High:</b> Emergencies (e.g., leaks, power loss).<br/>
                                              <b>Medium:</b> Standard service calls and repairs.<br/>
                                              <b>Low:</b> Routine maintenance or inspections.
                                          </p>
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                        </div>
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
                          <Select 
                              value={status} 
                              onValueChange={(value: JobStatus) => setStatus(value)}
                          >
                            <SelectTrigger id="jobStatus">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_JOB_STATUSES.map(s => <SelectItem key={s} value={s}>{s === 'Pending' ? 'Unassigned' : s}</SelectItem>)}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="customerEmail">Customer Email</Label>
                        <Input id="customerEmail" name="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="e.g., name@example.com" />
                    </div>
                    <div>
                        <Label htmlFor="customerPhone">Customer Phone</Label>
                        <Input id="customerPhone" name="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 555-1234" />
                    </div>
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
                </div>
                <div className="space-y-4">
                  
                  <div>
                    <Label>Schedule Time</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "flex-1 justify-start text-left font-normal bg-card",
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
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                         <Input
                            ref={timeInputRef}
                            type="time"
                            onChange={handleTimeChange}
                            value={scheduledTime ? format(scheduledTime, 'HH:mm') : ''}
                            className="w-36 bg-card"
                        />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label className="flex items-center gap-2">
                            <ListChecks className="h-3.5 w-3.5" />
                            Required Skills
                        </Label>
                           <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => fetchAISkillSuggestion(title, description)}
                                disabled={isFetchingSkillSuggestion || !description.trim()}
                            >
                                {isFetchingSkillSuggestion ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Fleety Suggests
                            </Button>
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
                    <ScrollArea className="rounded-md border p-3 max-h-36">
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
                  
                  <div>
                    <Label htmlFor="assign-technician">Assigned Technician</Label>
                      <div className="flex gap-2">
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
                          {manualTechnicianId === UNASSIGNED_VALUE && (
                            <Button
                                type="button"
                                variant="accent"
                                size="sm"
                                onClick={() => fetchAIAssignmentSuggestion(description, priority, requiredSkills, scheduledTime)}
                                disabled={isFetchingAISuggestion || !description}
                            >
                                {isFetchingAISuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                Fleety Assign
                            </Button>
                          )}
                      </div>
                  </div>
                  
                  {job && (
                    <div className="space-y-2 rounded-md border p-4">
                      <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h3 className="text-sm font-semibold flex items-center gap-2 cursor-help"><Sparkles className="h-4 w-4 text-primary"/> Fleety's Service Prep <Info className="h-3 w-3 text-muted-foreground"/></h3>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">Generate a link to send to the customer. They can upload photos of the issue, which our AI will analyze. The uploaded pictures and AI diagnosis will appear here.</p>
                            </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {job.aiIdentifiedModel || (job.aiSuggestedParts && job.aiSuggestedParts.length > 0) || job.aiRepairGuide ? (
                        <div className="text-sm space-y-2">
                           <p><strong>Model:</strong> {job.aiIdentifiedModel || 'Not identified'}</p>
                           <p><strong>Suggested Parts:</strong> {job.aiSuggestedParts?.join(', ') || 'None suggested'}</p>
                           <div>
                             <p><strong>AI Repair Guide:</strong></p>
                             <p className="text-muted-foreground whitespace-pre-wrap">{job.aiRepairGuide || 'No guide available'}</p>
                           </div>
                        </div>
                      ) : triageMessage ? (
                        <div className="space-y-2">
                           <Label htmlFor="triage-link">Customer Message</Label>
                            <Textarea id="triage-message" readOnly value={triageMessage} rows={4} className="bg-secondary/50"/>
                            <Button size="sm" type="button" onClick={handleCopyToClipboard} className="h-9">
                                {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                Copy Message
                            </Button>
                            <p className="text-xs text-muted-foreground">The link in the message is valid for 24 hours.</p>
                        </div>
                      ) : (
                        <Button type="button" size="sm" onClick={handleGenerateTriageLink} disabled={isGeneratingLink} className="h-9">
                           {isGeneratingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIcon className="mr-2 h-4 w-4" />}
                           Request Photos
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4 border-t gap-2 px-6 pb-6 flex-shrink-0">
              <div className="flex gap-2">
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
                  <>
                  {job ? (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  ) : (
                    <>
                      {aiSuggestion && suggestedTechnicianDetails && (
                         <Button
                          type="button"
                          onClick={() => handleSubmit(aiSuggestion?.suggestedTechnicianId || null)}
                          disabled={isLoading || isFetchingAISuggestion || !aiSuggestion?.suggestedTechnicianId}
                          variant={isInterruptionSuggestion ? "destructive" : "accent"}
                          title={isInterruptionSuggestion ? `Interrupts ${suggestedTechnicianDetails?.name}'s current low-priority job.` : `Assign to ${suggestedTechnicianDetails?.name}`}
                        >
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isInterruptionSuggestion ? <AlertTriangle className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                          {isInterruptionSuggestion ? 'Interrupt & Assign' : `Save & Assign to ${suggestedTechnicianDetails?.name || 'Suggested'}`}
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        variant={'outline'}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {userProfile?.role === 'csr' ? 'Create Job Ticket' : 'Save as Pending'}
                      </Button>
                    </>
                  )}
                  </>
              </div>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditJobDialog;
