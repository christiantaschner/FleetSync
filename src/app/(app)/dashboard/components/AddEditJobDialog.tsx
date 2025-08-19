
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
import type { Job, JobPriority, JobStatus, Technician, Customer, Contract, SuggestScheduleTimeOutput } from '@/types';
import { Loader2, UserCheck, Save, Calendar as CalendarIcon, ListChecks, AlertTriangle, Lightbulb, Settings, Trash2, FilePenLine, Link as LinkIcon, Copy, Check, Info, Repeat, Bot, Clock, Sparkles, RefreshCw, ChevronsUpDown } from 'lucide-react';
import { suggestScheduleTimeAction, generateTriageLinkAction, suggestJobSkillsAction } from '@/actions/ai-actions';
import { deleteJobAction } from '@/actions/fleet-actions';
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const UNASSIGNED_VALUE = '_unassigned_'; // Special value for unassigned technician
const ALL_JOB_STATUSES: JobStatus[] = ['Draft', 'Unassigned', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Cancelled'];
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Draft'];


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
  const { userProfile, company } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [isFetchingSkills, setIsFetchingSkills] = useState(false);
  
  const [timeSuggestions, setTimeSuggestions] = useState<SuggestScheduleTimeOutput['suggestions']>([]);
  const [rejectedTimes, setRejectedTimes] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [status, setStatus] = useState<JobStatus>('Unassigned');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('hours');
  const [manualTechnicianId, setManualTechnicianId] = useState<string>(UNASSIGNED_VALUE);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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
    setStatus(job?.status || 'Unassigned');
    setRequiredSkills(job?.requiredSkills || []);
    setCustomerName(job?.customerName || '');
    setCustomerEmail(job?.customerEmail || '');
    setCustomerPhone(job?.customerPhone || '');
    setLocationAddress(job?.location.address || '');
    setLatitude(job?.location.latitude || null);
    setLongitude(job?.location.longitude || null);
    setScheduledTime(job?.scheduledTime ? new Date(job.scheduledTime) : undefined);
    setEstimatedDuration(job?.estimatedDuration || 1);
    setDurationUnit(job?.durationUnit || 'hours');
    setManualTechnicianId(job?.assignedTechnicianId || UNASSIGNED_VALUE);
    setSelectedContractId(job?.sourceContractId || '');
    setSelectedCustomerId(job?.customerId || null);
    setCustomerSuggestions([]);
    setIsCustomerPopoverOpen(false);
    setSkillSearchTerm('');
    setTriageMessage(null);
    setIsGeneratingLink(false);
    setIsCopied(false);
    setRejectedTimes([]);
    setTimeSuggestions([]);
  }, [job]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, isOpen, resetForm]);

  // Handle smart status updates
  useEffect(() => {
    if (manualTechnicianId === UNASSIGNED_VALUE && (status === 'Assigned' || status === 'En Route' || status === 'In Progress')) {
        setStatus('Unassigned');
    }

    if (manualTechnicianId !== UNASSIGNED_VALUE && (status === 'Unassigned' || status === 'Draft')) {
        setStatus('Assigned');
    }
    
    if (status === 'Unassigned' && manualTechnicianId !== UNASSIGNED_VALUE) {
        setManualTechnicianId(UNASSIGNED_VALUE);
    }
  }, [status, manualTechnicianId]);

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    setSelectedContractId('');
    setSelectedCustomerId(null);
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
      setSelectedCustomerId(customer.id);
      setIsCustomerPopoverOpen(false);
      setCustomerSuggestions([]);
  };

   const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    if (contractId === 'unlinked') {
      setSelectedContractId('');
      return;
    }
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setCustomerName(contract.customerName);
      setCustomerPhone(contract.customerPhone || '');
      setLocationAddress(contract.customerAddress);
      setCustomerEmail(''); // Contracts don't have email, clear it
      setSelectedCustomerId(null); // Contracts don't have a direct customer ID link yet
    }
  };

  const fetchAITimeSuggestion = useCallback(async (getMore: boolean = false) => {
    if (!description.trim() && !title.trim() || !userProfile?.companyId || !appId) {
        toast({ title: "Cannot Suggest Time", description: "Please enter a Job Title.", variant: "default" });
        return;
    }
    setIsFetchingAISuggestion(true);
    
    const currentRejectedTimes = getMore ? [...rejectedTimes, ...timeSuggestions.map(s => s.time)] : [];
    if(getMore) {
        setRejectedTimes(currentRejectedTimes);
    }

    const result = await suggestScheduleTimeAction({
        companyId: userProfile.companyId,
        jobPriority: priority,
        requiredSkills: requiredSkills,
        currentTime: new Date().toISOString(),
        businessHours: company?.settings?.businessHours || [],
        excludedTimes: currentRejectedTimes,
        technicians: technicians.map(tech => ({
            id: tech.id,
            name: tech.name,
            skills: tech.skills.map(s => s.name),
            jobs: jobs.filter(j => j.assignedTechnicianId === tech.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
                .map(j => ({ id: j.id, scheduledTime: j.scheduledTime! }))
        }))
    });

    setIsFetchingAISuggestion(false);

    if (result.error) {
        toast({ title: "Fleety Suggestion Error", description: result.error, variant: "destructive" });
    } else if (result.data?.suggestions) {
        if(result.data.suggestions.length === 0) {
            toast({ title: "No More Suggestions", description: "Fleety could not find any other suitable time slots.", variant: "default" });
        }
        setTimeSuggestions(result.data.suggestions);
    }

  }, [description, title, priority, requiredSkills, userProfile, appId, company, technicians, jobs, timeSuggestions, rejectedTimes, toast]);
  
  const handleAcceptSuggestion = (suggestion: SuggestScheduleTimeOutput['suggestions'][number]) => {
      setScheduledTime(new Date(suggestion.time));
      setManualTechnicianId(suggestion.technicianId);
      setTimeSuggestions([]); // Clear suggestions after accepting one
      toast({ title: "Details Updated", description: "Time and technician have been set based on the suggestion.", variant: "default"});
  };

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
    if (!title || !customerName) {
      toast({ title: "Cannot Generate Link", description: "Please provide a Job Title and Customer Name first.", variant: "default" });
      return;
    }
    if (!job && !userProfile?.companyId) {
      toast({ title: "Cannot Generate Link", description: "Save this job first to create a photo request link.", variant: "default" });
      return;
    }

    if (!userProfile?.companyId || !appId) return;
    
    setIsGeneratingLink(true);

    let jobIdToUse = job?.id;

    if (!jobIdToUse) {
       const tempJobData = {
          companyId: userProfile.companyId,
          customerId: selectedCustomerId,
          title, description, priority, requiredSkills, customerName, customerEmail, customerPhone,
          location: { latitude: latitude ?? 0, longitude: longitude ?? 0, address: locationAddress },
          scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
          status: 'Draft' as const,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          estimatedDuration,
          durationUnit,
      };
      const newJobRef = await addDoc(collection(db, `artifacts/${appId}/public/data/jobs`), tempJobData);
      jobIdToUse = newJobRef.id;
      if (onJobAddedOrUpdated) {
        onJobAddedOrUpdated({ ...tempJobData, id: jobIdToUse, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Job, null);
      }
    }
    
    if (!jobIdToUse) {
      setIsGeneratingLink(false);
      return;
    }

    const result = await generateTriageLinkAction({
        jobId: jobIdToUse,
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
  
  const handleSuggestSkills = async () => {
    if (!description.trim() && !title.trim()) {
        toast({ title: "Cannot Suggest Skills", description: "Please enter a Job Title or Description.", variant: "default" });
        return;
    }
    setIsFetchingSkills(true);
    const result = await suggestJobSkillsAction({ jobTitle: title, jobDescription: description, availableSkills: allSkills });
    if (result.error) {
        toast({ title: "Skill Suggestion Error", description: result.error, variant: "destructive" });
    } else if (result.data?.suggestedSkills) {
        if (result.data.suggestedSkills.length === 0) {
            toast({ title: "No specific skills suggested", description: result.data.reasoning || "The AI could not identify specific skills from the job description.", variant: "default" });
        } else {
            setRequiredSkills(prev => [...new Set([...prev, ...result.data!.suggestedSkills])]);
            toast({ title: "Skills Suggested", description: `Fleety added ${result.data.suggestedSkills.length} skill(s). Please review.` });
        }
    }
    setIsFetchingSkills(false);
  };

  const handleSubmit = async (assignTechId: string | null = null) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        toast({ title: 'Success', description: 'Job saved in mock mode.' });
        onClose();
        return;
    }
    if (!title.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title and Address.", variant: "destructive" });
      return;
    }

    if (estimatedDuration === undefined || estimatedDuration <= 0) {
      toast({ title: "Invalid Duration", description: "Please enter a valid estimated duration greater than 0.", variant: "destructive" });
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
      customerId: selectedCustomerId,
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
      estimatedDuration,
      durationUnit,
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
                updatePayload.status = 'Unassigned';
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
        
        const batch = writeBatch(db);

        const newJobRef = doc(collection(db, `artifacts/${appId}/public/data/jobs`));
        
        const newJobPayload: any = {
          ...jobData,
          status: techToAssignId ? 'Assigned' as JobStatus : 'Unassigned' as JobStatus,
          assignedTechnicianId: techToAssignId || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notes: '',
          photos: [],
          estimatedDuration: estimatedDuration,
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
        }
        
        await batch.commit();

        finalJobDataForCallback = {
            ...newJobPayload,
            id: newJobRef.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (techToAssignId) {
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
  
  const titleText = job ? 'Edit Job' : 'Add New Job';
  const descriptionText = job ? 'Update the details for this job.' : userProfile?.role === 'csr' ? 'Create a job ticket for a dispatcher to review and assign.' : '';

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
                    This is a draft job. Please complete all required fields and set a status such as "Unassigned" to activate it.
                  </AlertDescription>
                </Alert>
              )}
              {job?.sourceContractId && (
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600">
                    <Repeat className="h-4 w-4"/>
                    <AlertTitle>Contract Job</AlertTitle>
                    <AlertDescription>
                        This job was generated from a Service Contract. <Link href="/contracts" className="font-semibold underline">View contracts</Link>.
                    </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
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
                  <div>
                    <Label htmlFor="contractId">Link to Contract (Optional)</Label>
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
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input id="jobTitle" name="jobTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" required />
                  </div>
                  <div>
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <Textarea id="jobDescription" name="jobDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job requirements..." rows={3} />
                  </div>
                </div>

                <div className="space-y-4">
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
                     <div>
                      <Label>Estimated Duration *</Label>
                      <div className="flex items-center gap-2">
                          <Input
                              id="estimatedDuration"
                              type="number"
                              value={estimatedDuration || ''}
                              onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value, 10) : 1)}
                              min="1"
                              placeholder="e.g., 2"
                          />
                          <Select value={durationUnit} onValueChange={(value: 'hours' | 'days') => setDurationUnit(value)}>
                              <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="hours">Hours</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center mb-1">
                        <Label className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4" />
                            Required Skills
                        </Label>
                         <Button type="button" variant="outline" size="sm" onClick={handleSuggestSkills} disabled={isFetchingSkills || !title.trim() && !description.trim()}>
                            {isFetchingSkills ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                            Suggest
                        </Button>
                    </div>
                    <Input
                      placeholder="Search skills..."
                      value={skillSearchTerm}
                      onChange={(e) => setSkillSearchTerm(e.target.value)}
                      className="mb-2 h-8"
                    />
                    <ScrollArea className="h-24 rounded-md border p-3">
                      <div className="space-y-2">
                        {allSkills.length === 0 ? (
                          <div className="text-center flex flex-col items-center justify-center h-full pt-4">
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
                    {job && (job.aiIdentifiedModel || (job.aiSuggestedParts && job.aiSuggestedParts.length > 0) || job.aiRepairGuide) ? (
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
                </div>
              </div>
            </div>

            <div className="px-6 pb-2">
              <Separator />
              <div className="pt-4 space-y-4">
                   <div className="flex flex-wrap gap-2 items-center justify-between">
                       <h3 className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> AI Scheduler</h3>
                       <div className="flex flex-wrap gap-2">
                           <Button type="button" variant="accent" onClick={() => fetchAITimeSuggestion()} disabled={isFetchingAISuggestion || !title}>
                                {isFetchingAISuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                Fleety Suggest Time & Tech
                            </Button>
                            {timeSuggestions.length > 0 && (
                                <Button type="button" variant="outline" onClick={() => fetchAITimeSuggestion(true)} disabled={isFetchingAISuggestion}>
                                    <RefreshCw className="mr-2 h-4 w-4"/>
                                    Get More Suggestions
                                </Button>
                            )}
                       </div>
                   </div>
                   {timeSuggestions.length > 0 && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                           {timeSuggestions.map(suggestion => (
                               <button 
                                   key={suggestion.time}
                                   type="button" 
                                   onClick={() => handleAcceptSuggestion(suggestion)} 
                                   className="p-3 border rounded-md text-left hover:bg-secondary transition-colors"
                                >
                                    <p className="font-semibold text-sm">{format(new Date(suggestion.time), 'PPp')}</p>
                                    <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                               </button>
                           ))}
                       </div>
                   )}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="manual-override">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2 text-sm font-medium"><ChevronsUpDown className="h-4 w-4"/>Manual Override</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
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
                          <div className="space-y-2">
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
                           {job && (
                            <div className="space-y-2">
                                <Label htmlFor="jobStatus">Status</Label>
                                <Select 
                                    value={status} 
                                    onValueChange={(value: JobStatus) => setStatus(value)}
                                >
                                <SelectTrigger id="jobStatus">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_JOB_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0 flex-row justify-between items-center gap-2">
              <div className="flex-shrink-0">
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
              <div className="flex items-center gap-2">
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
                      <Button
                        type="submit"
                        disabled={isLoading}
                        variant={'default'}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {userProfile?.role === 'csr' ? 'Create Job Ticket' : 'Save Job'}
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
