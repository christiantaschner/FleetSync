
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import type { Job, JobPriority, JobStatus, Technician, Customer, Contract, SuggestScheduleTimeOutput, Part, JobFlexibility } from '@/types';
import { Loader2, UserCheck, Save, Calendar as CalendarIcon, ListChecks, Settings, Trash2, FilePenLine, Link as LinkIcon, Copy, Check, Info, Repeat, Bot, Clock, Sparkles, RefreshCw, ChevronsUpDown, X, User, MapPin, Wrench, DollarSign, Package, Lock, Unlock, Wand2, Lightbulb } from 'lucide-react';
import { suggestScheduleTimeAction, generateTriageLinkAction, analyzeJobAction } from '@/actions/ai-actions';
import { deleteJobAction } from '@/actions/fleet-actions';
import { upsertCustomerAction } from '@/actions/customer-actions';
import { Popover, PopoverContent, PopoverAnchor, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { addHours, format } from 'date-fns';
import { cn } from '@/lib/utils';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { MultiSelectFilter } from './MultiSelectFilter';


const UNASSIGNED_VALUE = '_unassigned_'; // Special value for unassigned technician
const ALL_JOB_STATUSES: JobStatus[] = ['Draft', 'Unassigned', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Pending Invoice', 'Finished', 'Cancelled'];
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Draft'];


interface AddEditJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  prefilledData?: Partial<Job> | null;
  jobs: Job[];
  technicians: Technician[];
  customers: Customer[];
  contracts: Contract[];
  allSkills: string[];
  allParts: Part[];
  onJobAddedOrUpdated?: (job: Job, assignedTechnicianId?: string | null) => void;
  onManageSkills: () => void;
  onManageParts: () => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ isOpen, onClose, job, prefilledData, jobs, technicians, customers, contracts, allSkills, allParts, onJobAddedOrUpdated, onManageSkills, onManageParts }) => {
  const { userProfile, company } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  
  const [timeSuggestions, setTimeSuggestions] = useState<SuggestScheduleTimeOutput['suggestions']>([]);
  const [rejectedTimes, setRejectedTimes] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [status, setStatus] = useState<JobStatus>('Unassigned');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requiredParts, setRequiredParts] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number>(60);
  const [manualTechnicianId, setManualTechnicianId] = useState<string>(UNASSIGNED_VALUE);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [quotedValue, setQuotedValue] = useState<number | undefined>(undefined);
  const [expectedPartsCost, setExpectedPartsCost] = useState<number | undefined>(undefined);
  const [slaDeadline, setSlaDeadline] = useState<Date | undefined>(undefined);
  const [upsellScore, setUpsellScore] = useState<number | undefined>(undefined);
  const [upsellReasoning, setUpsellReasoning] = useState<string | undefined>(undefined);
  const [flexibility, setFlexibility] = useState<JobFlexibility>('flexible');
  const [dispatchLocked, setDispatchLocked] = useState(false);


  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  
  const [triageMessage, setTriageMessage] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [triageToken, setTriageToken] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const estimatedProfit = useMemo(() => {
    if (quotedValue === undefined || expectedPartsCost === undefined) return null;
    return quotedValue - expectedPartsCost;
  }, [quotedValue, expectedPartsCost]);


  const estimatedMargin = useMemo(() => {
    if (estimatedProfit === null || !quotedValue || quotedValue === 0) return null;
    return (estimatedProfit / quotedValue) * 100;
  }, [estimatedProfit, quotedValue]);

  const getMarginColor = (margin: number | null) => {
    if (margin === null) return 'text-muted-foreground';
    if (margin >= 50) return 'text-green-600';
    if (margin >= 25) return 'text-amber-600';
    return 'text-red-600';
  };

  const resetForm = useCallback(() => {
    const initialData = job || prefilledData || {};
    setTitle(initialData.title || '');
    setDescription(initialData.description || '');
    setPriority(initialData.priority || 'Medium');
    setStatus(initialData.status || 'Unassigned');
    setRequiredSkills(initialData.requiredSkills || []);
    setRequiredParts(initialData.requiredParts || []);
    setCustomerName(initialData.customerName || '');
    setCustomerEmail(initialData.customerEmail || '');
    setCustomerPhone(initialData.customerPhone || '');
    setLocationAddress(initialData.location?.address || '');
    setLatitude(initialData.location?.latitude || null);
    setLongitude(initialData.location?.longitude || null);
    setScheduledTime(initialData.scheduledTime ? new Date(initialData.scheduledTime) : undefined);
    setEstimatedDurationMinutes(initialData.estimatedDurationMinutes || 60);
    setManualTechnicianId(initialData.assignedTechnicianId || UNASSIGNED_VALUE);
    setSelectedContractId(initialData.sourceContractId || '');
    setSelectedCustomerId(initialData.customerId || null);
    setQuotedValue(initialData.quotedValue);
    setExpectedPartsCost(initialData.expectedPartsCost);
    setSlaDeadline(initialData.slaDeadline ? new Date(initialData.slaDeadline) : undefined);
    setUpsellScore(initialData.upsellScore);
    setUpsellReasoning(initialData.upsellReasoning);
    setFlexibility(initialData.flexibility || 'flexible');
    setDispatchLocked(initialData.dispatchLocked || false);
    setCustomerSuggestions([]);
    setIsCustomerPopoverOpen(false);
    setTriageMessage(null);
    setIsGeneratingLink(false);
    setIsCopied(false);
    setRejectedTimes([]);
    setTimeSuggestions([]);
    setTriageToken(null);
  }, [job, prefilledData]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, prefilledData, isOpen, resetForm]);
  
  // A job is fully assigned if it has a tech and a time
  const isReadyForAssignment = useMemo(() => {
    if (manualTechnicianId !== UNASSIGNED_VALUE && scheduledTime) {
      return true;
    }
    return false;
  }, [manualTechnicianId, scheduledTime]);
  
  // A job has all its core, non-assignment info filled out
  const hasAllCoreInfo = useMemo(() => {
      return !!(title.trim() && customerName.trim() && locationAddress.trim() && estimatedDurationMinutes > 0);
  }, [title, customerName, locationAddress, estimatedDurationMinutes]);


  // Handle smart status updates
  useEffect(() => {
    if (manualTechnicianId === UNASSIGNED_VALUE && (status === 'Assigned' || status === 'En Route' || status === 'In Progress')) {
        setStatus('Unassigned');
    }

    if (manualTechnicianId !== UNASSIGNED_VALUE && (status === 'Unassigned' || status === 'Draft')) {
        setStatus('Assigned');
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
      setSelectedCustomerId(contract.id || null);
    }
  };

  const fetchAITimeSuggestion = useCallback(async (isGettingMore: boolean = false) => {
    if (!description.trim() && !title.trim() || !userProfile?.companyId || !appId) {
        toast({ title: "Cannot Suggest Time", description: "Please enter a Job Title.", variant: "default" });
        return;
    }
    setIsFetchingAISuggestion(true);

    const timesToExclude = isGettingMore ? [...rejectedTimes, ...timeSuggestions.map(s => s.time)] : [];
    
    if (isGettingMore) {
        setRejectedTimes(prev => [...new Set([...prev, ...timeSuggestions.map(s => s.time)])]);
    } else {
        setTimeSuggestions([]);
    }

    const result = await suggestScheduleTimeAction({
        companyId: userProfile.companyId,
        jobPriority: priority,
        requiredSkills: requiredSkills,
        currentTime: new Date().toISOString(),
        businessHours: company?.settings?.businessHours || [],
        excludedTimes: timesToExclude,
        technicians: technicians.map(tech => ({
            id: tech.id,
            name: tech.name,
            skills: tech.skills.map(s => s),
            jobs: jobs.filter(j => j.assignedTechnicianId === tech.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
                .map(j => ({ id: j.id, scheduledTime: j.scheduledTime! }))
        }))
    });

    setIsFetchingAISuggestion(false);

    if (result.error) {
        toast({ title: "AI Suggestion Error", description: result.error, variant: "destructive" });
    } else if (result.data?.suggestions) {
        const newSuggestions = result.data.suggestions;
        if(newSuggestions.length === 0 && isGettingMore) {
            toast({ title: "No More Suggestions", description: "The AI could not find any other suitable time slots.", variant: "default" });
        }
        
        if (isGettingMore) {
          setTimeSuggestions(prev => [...prev, ...newSuggestions]);
        } else {
          setTimeSuggestions(newSuggestions);
        }
    }
  }, [description, title, priority, requiredSkills, userProfile, appId, company, technicians, jobs, timeSuggestions, rejectedTimes, toast]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setLocationAddress(location.address);
    setLatitude(location.lat);
    setLongitude(location.lng);
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
  
  const handleManualTechnicianChange = (techId: string) => {
    setManualTechnicianId(techId);
  };

  const handleSelectAISuggestion = (suggestion: SuggestScheduleTimeOutput['suggestions'][number]) => {
      setScheduledTime(new Date(suggestion.time));
      setManualTechnicianId(suggestion.technicianId);
      toast({ title: "Suggestion Selected", description: "The schedule time and technician have been updated. You can make further adjustments or save the job." });
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
    if (!userProfile?.companyId || !appId) return;

    setIsGeneratingLink(true);
    const result = await generateTriageLinkAction({
      jobId: job?.id,
      companyId: userProfile.companyId,
      appId,
      customerName,
      jobTitle: title,
    });
    setIsGeneratingLink(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setTriageMessage(result.data.message);
      setTriageToken(result.data.token);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (triageMessage) {
      navigator.clipboard.writeText(triageMessage);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Message copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleAnalyzeJob = async () => {
    if (!title && !description) {
        toast({ title: "Cannot Analyze Job", description: "Please provide a Job Title or Description.", variant: "default" });
        return;
    }
    if (!userProfile?.companyId || !appId || !company?.settings?.companySpecialties) return;

    setIsAnalyzingJob(true);
    const result = await analyzeJobAction({
        appId: appId,
        companyId: userProfile.companyId,
        jobTitle: title,
        jobDescription: description,
        customerName: customerName,
        availableSkills: allSkills,
        availableParts: allParts.map(p => p.name),
        companySpecialties: company.settings.companySpecialties,
    });
    setIsAnalyzingJob(false);

    if (result.error) {
        toast({ title: "Analysis Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
        let updateCount = 0;
        const { suggestedSkills, suggestedParts, upsellOpportunity } = result.data;
        if (suggestedSkills.suggestedSkills.length > 0) {
            setRequiredSkills(prev => [...new Set([...prev, ...suggestedSkills.suggestedSkills])]);
            updateCount += suggestedSkills.suggestedSkills.length;
        }
        if (suggestedParts.suggestedParts.length > 0) {
            setRequiredParts(prev => [...new Set([...prev, ...suggestedParts.suggestedParts])]);
            updateCount += suggestedParts.suggestedParts.length;
        }
        setUpsellScore(upsellOpportunity.upsellScore);
        setUpsellReasoning(upsellOpportunity.reasoning);
        if(upsellOpportunity.upsellScore > 0) updateCount++;
        
        toast({ title: "Analysis Complete", description: `AI added ${updateCount} suggestion(s). Please review.` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        toast({ title: 'Success', description: 'Job saved in mock mode.' });
        onClose();
        return;
    }
    
    // Defer the full validation check to this point.
    if (!hasAllCoreInfo) {
      toast({ title: "Missing Information", description: "Please fill in Title, Customer Name, Address, and Duration.", variant: "destructive" });
      return;
    }
    
    if (!userProfile?.companyId || !appId) {
      toast({ title: "Authentication Error", description: "Company ID not found.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    let customerIdToUse = selectedCustomerId;
    if (!customerIdToUse) {
        const customerResult = await upsertCustomerAction({
            companyId: userProfile.companyId,
            appId,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: locationAddress
        });
        if (customerResult.data?.id) {
            customerIdToUse = customerResult.data.id;
        } else {
            toast({ title: "Customer Creation Failed", description: customerResult.error, variant: "destructive" });
            setIsLoading(false);
            return;
        }
    }


    const finalTechId = manualTechnicianId !== UNASSIGNED_VALUE ? manualTechnicianId : null;
    const finalScheduledTime = scheduledTime;

    const jobData: any = {
      companyId: userProfile.companyId,
      customerId: customerIdToUse,
      title,
      description,
      priority,
      requiredSkills,
      requiredParts,
      customerName: customerName || "N/A",
      customerEmail: customerEmail || "N/A",
      customerPhone: customerPhone || "N/A",
      location: {
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
        address: locationAddress 
      },
      scheduledTime: finalScheduledTime ? finalScheduledTime.toISOString() : null,
      estimatedDurationMinutes,
      sourceContractId: selectedContractId || job?.sourceContractId || null,
      quotedValue,
      expectedPartsCost,
      slaDeadline: slaDeadline ? slaDeadline.toISOString() : null,
      upsellScore: upsellScore,
      upsellReasoning: upsellReasoning,
      flexibility,
      dispatchLocked,
      ...(triageToken && { 
        triageToken: triageToken,
        triageTokenExpiresAt: addHours(new Date(), 24).toISOString()
      }),
    };

    try {
      let finalJobDataForCallback: Job;
      let finalStatus: JobStatus;

      // Determine final status based on the new logic
      if (!hasAllCoreInfo) {
        finalStatus = 'Draft';
      } else if (isReadyForAssignment) {
        finalStatus = (job && job.status !== 'Draft') ? status : 'Assigned';
      } else {
        finalStatus = 'Unassigned';
      }
      jobData.status = finalStatus;

      if (job) { // EDITING A JOB
        const batch = writeBatch(db);
        const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
        const updatePayload: any = { ...jobData, status: finalStatus, updatedAt: serverTimestamp() };

        const newAssignedTechId = finalTechId;
        const currentAssignedId = job.assignedTechnicianId || null;
        const technicianHasChanged = newAssignedTechId !== currentAssignedId;
        
        if (technicianHasChanged) {
            if (newAssignedTechId === null) { // Un-assigning
                updatePayload.assignedTechnicianId = null;
                updatePayload.status = hasAllCoreInfo ? 'Unassigned' : 'Draft';
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
        }
        
        const effectiveStatus = updatePayload.status || job.status;
        const wasCompletedOrCancelled = job.status === 'Completed' || job.status === 'Cancelled' || job.status === 'Finished';
        const isNowCompletedOrCancelled = effectiveStatus === 'Completed' || effectiveStatus === 'Cancelled' || effectiveStatus === 'Finished';
        
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
        const techToAssignId = finalTechId;
        const techToAssign = techToAssignId ? technicians.find(t => t.id === techToAssignId) : null;
        
        const batch = writeBatch(db);
        const newJobRef = doc(collection(db, `artifacts/${appId}/public/data/jobs`));
        
        const newJobPayload: any = {
          ...jobData,
          status: finalStatus,
          assignedTechnicianId: techToAssignId || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notes: '',
          photos: [],
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

        if (finalStatus === 'Draft') {
          toast({ title: "Draft Saved", description: `Job "${finalJobDataForCallback.title}" has been saved as a draft.` });
        } else if (finalStatus === 'Unassigned') {
            toast({ title: "Job Created", description: `Job "${finalJobDataForCallback.title}" created and is ready for assignment.` });
        } else if (techToAssignId) {
            toast({ title: "Job Added & Assigned", description: `New job "${finalJobDataForCallback.title}" created and assigned.` });
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
  const descriptionText = job ? 'Update the details for this job.' : userProfile?.role === 'csr' ? 'Create a job ticket for a dispatcher to review and assign.' : 'Fill in the details below to create and assign a new job.';

  const skillOptions = allSkills.map(skill => ({ value: skill, label: skill }));
  const partOptions = allParts.map(part => ({ value: part.name, label: part.name }));
  
  const saveButtonText = useMemo(() => {
    if (job) return "Save Changes";
    if (hasAllCoreInfo) return "Save Job";
    return "Save as Draft";
  }, [job, hasAllCoreInfo]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90dvh] p-0">
          <DialogHeader className="px-6 pt-6 flex-shrink-0">
            <DialogTitle className="font-headline">{titleText}</DialogTitle>
            {descriptionText && <DialogDescription>{descriptionText}</DialogDescription>}
          </DialogHeader>
          <form id="job-form" ref={formRef} onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto px-6">
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-base font-semibold"><div className="flex items-center gap-2"><User className="h-4 w-4"/>Customer & Location</div></AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                             <div>
                                <Label htmlFor="customerName">Customer Name *</Label>
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
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                         <AccordionTrigger className="text-base font-semibold"><div className="flex items-center gap-2"><Wrench className="h-4 w-4"/>Job Details</div></AccordionTrigger>
                         <AccordionContent className="space-y-4 pt-2">
                             <div>
                                <Label htmlFor="jobTitle">Job Title *</Label>
                                <Input id="jobTitle" name="jobTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" required />
                            </div>
                            <div>
                                <Label htmlFor="jobDescription">Job Description</Label>
                                <Textarea id="jobDescription" name="jobDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job requirements..." rows={3} className="bg-card" />
                            </div>
                         </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-base font-semibold"><div className="flex items-center gap-2"><Settings className="h-4 w-4"/>Configuration & Financials</div></AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
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
                                    <Label htmlFor="estimatedDurationMinutes">Estimated Duration (minutes) *</Label>
                                    <Input
                                        id="estimatedDurationMinutes"
                                        type="number"
                                        value={estimatedDurationMinutes || ''}
                                        onChange={(e) => setEstimatedDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : 0)}
                                        min="1"
                                        placeholder="e.g., 60"
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="quotedValue">Quoted Value ($)</Label>
                                    <Input id="quotedValue" type="number" step="0.01" value={quotedValue ?? ''} onChange={e => setQuotedValue(e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="e.g., 250.00"/>
                                </div>
                                <div>
                                    <Label htmlFor="expectedPartsCost">Expected Parts Cost ($)</Label>
                                    <Input id="expectedPartsCost" type="number" step="0.01" value={expectedPartsCost ?? ''} onChange={e => setExpectedPartsCost(e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="e.g., 50.00"/>
                                </div>
                            </div>
                            {estimatedProfit !== null && (
                                <div className="p-3 border rounded-md bg-secondary/50 flex items-center justify-around text-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help">
                                                    <p className="text-xs text-muted-foreground">Est. Job Profit</p>
                                                    <p className={cn("text-xl font-bold", getMarginColor(estimatedMargin))}>
                                                        ${estimatedProfit.toFixed(2)}
                                                    </p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Quote - Parts Cost</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Separator orientation="vertical" className="h-10"/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Est. Profit Margin</p>
                                        <p className={cn("text-xl font-bold", getMarginColor(estimatedMargin))}>
                                            {estimatedMargin !== null ? `${estimatedMargin.toFixed(0)}%` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            )}
                             <div className="p-3 border rounded-md bg-secondary/50">
                                <h4 className="text-sm font-medium mb-2">Scheduling Constraints</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                    <Label htmlFor="flexibility">Scheduling Flexibility</Label>
                                    <Select value={flexibility} onValueChange={(value: JobFlexibility) => setFlexibility(value)}>
                                        <SelectTrigger id="flexibility">
                                            <SelectValue placeholder="Select flexibility" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="flexible"><div className="flex items-center gap-2"><Repeat className="h-4 w-4"/>Flexible</div></SelectItem>
                                            <SelectItem value="fixed"><div className="flex items-center gap-2"><Lock className="h-4 w-4"/>Fixed Appointment</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </div>
                                    <div className="flex items-end pb-1">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="dispatchLocked" checked={dispatchLocked} onCheckedChange={(checked) => setDispatchLocked(Boolean(checked))} />
                                        <Label htmlFor="dispatchLocked" className="flex items-center gap-1.5"><Lock className="h-4 w-4"/>Lock Assignment</Label>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-4">
                        <AccordionTrigger className="text-base font-semibold"><div className="flex items-center gap-2"><ListChecks className="h-4 w-4"/>Skills & Parts</div></AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                              <div className="flex flex-col space-y-2">
                                <Label className="flex items-center gap-2">Required Skills</Label>
                                <MultiSelectFilter
                                    options={skillOptions}
                                    selected={requiredSkills}
                                    onChange={setRequiredSkills}
                                    placeholder="Select required skills..."
                                />
                                <Button type="button" variant="link" size="sm" onClick={onManageSkills} className="h-auto p-0 self-end">Manage Skills</Button>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label className="flex items-center gap-2">Required Parts</Label>
                                <MultiSelectFilter
                                    options={partOptions}
                                    selected={requiredParts}
                                    onChange={setRequiredParts}
                                    placeholder="Select required parts..."
                                />
                                <Button type="button" variant="link" size="sm" onClick={onManageParts} className="h-auto p-0 self-end">Manage Parts</Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                 <div className="space-y-2 border-t pt-4 mt-4">
                     <div className="flex items-center justify-between">
                         <Label className="flex items-center gap-2 font-semibold text-lg"><Wand2 className="h-5 w-5 text-primary"/>AI Job Analysis</Label>
                          <Button type="button" variant="outline" size="sm" onClick={handleAnalyzeJob} disabled={isAnalyzingJob || (!title.trim() && !description.trim())} className="h-9">
                              {isAnalyzingJob ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />}
                              Analyze Job
                          </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Get AI suggestions for skills, parts, and upsell opportunities based on the job details.</p>
                      {upsellReasoning && <Alert className="mt-2"><Lightbulb className="h-4 w-4"/><AlertTitle>Upsell Suggestion</AlertTitle><AlertDescription className="text-xs">{upsellReasoning}</AlertDescription></Alert>}
                  </div>
            </div>

            <div className="px-6 pb-2 mt-4 pt-4 border-t bg-secondary/50 -mx-6 space-y-4">
                   <div className="px-6 flex flex-wrap gap-2 items-center justify-between">
                       <h3 className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> AI Scheduler</h3>
                       <div className="flex flex-wrap gap-2">
                           <Button type="button" variant="accent" onClick={() => fetchAITimeSuggestion()} disabled={isFetchingAISuggestion || !title}>
                                {isFetchingAISuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                AI Suggest Time & Tech
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
                       <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                           {timeSuggestions.slice(0, 3).map(suggestion => {
                               const techName = technicians.find(t => t.id === suggestion.technicianId)?.name || 'Unknown Tech';
                               return (
                                   <button
                                       key={suggestion.time}
                                       type="button"
                                       onClick={() => handleSelectAISuggestion(suggestion)}
                                       className="p-3 border rounded-md text-left hover:bg-background transition-colors bg-card"
                                   >
                                       <p className="font-semibold text-sm">{format(new Date(suggestion.time), 'MMM d, p')}</p>
                                       <p className="text-xs text-muted-foreground">with {techName}</p>
                                       <p className="text-xs text-muted-foreground mt-1 italic">"{suggestion.reasoning}"</p>
                                   </button>
                               )
                           })}
                       </div>
                   )}
                  <Accordion type="single" collapsible className="w-full px-6">
                    <AccordionItem value="manual-override" className="border-b-0">
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
                            <Select value={manualTechnicianId} onValueChange={handleManualTechnicianChange}>
                                <SelectTrigger id="assign-technician" className="bg-card">
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
                                <SelectTrigger id="jobStatus" className="bg-card">
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

            <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0 flex-row justify-between items-center gap-2 bg-background">
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
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {saveButtonText}
                  </Button>
              </div>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditJobDialog;
