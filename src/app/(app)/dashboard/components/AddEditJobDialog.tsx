
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
import { Loader2, Sparkles, UserCheck, Save } from 'lucide-react';
import { allocateJobAction, AllocateJobActionInput } from "@/actions/fleet-actions";
import type { AllocateJobOutput } from "@/ai/flows/allocate-job";

interface AddEditJobDialogProps {
  children: React.ReactNode;
  job?: Job;
  technicians: Technician[];
  onJobAddedOrUpdated?: (job: Job, assignedTechnicianId?: string | null) => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ children, job, technicians, onJobAddedOrUpdated }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAISuggestion, setIsFetchingAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AllocateJobOutput | null>(null);
  const [suggestedTechnicianDetails, setSuggestedTechnicianDetails] = useState<Technician | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const resetForm = useCallback(() => {
    setTitle(job?.title || '');
    setDescription(job?.description || '');
    setPriority(job?.priority || 'Medium');
    setCustomerName(job?.customerName || '');
    setCustomerPhone(job?.customerPhone || '');
    setLocationAddress(job?.location.address || '');
    setAiSuggestion(null);
    setSuggestedTechnicianDetails(null);
  }, [job]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [job, isOpen, resetForm]);

  const fetchAISuggestion = useCallback(async (currentDescription: string, currentPriority: JobPriority) => {
    if (!currentDescription || !currentPriority || technicians.length === 0) {
      setAiSuggestion(null);
      setSuggestedTechnicianDetails(null);
      return;
    }
    setIsFetchingAISuggestion(true);
    setAiSuggestion(null);
    setSuggestedTechnicianDetails(null);

    const availableAITechnicians: AITechnician[] = technicians.map(t => ({
      technicianId: t.id,
      technicianName: t.name,
      isAvailable: t.isAvailable,
      skills: t.skills as string[],
      location: {
        latitude: t.location.latitude,
        longitude: t.location.longitude,
      },
    }));

    const input: AllocateJobActionInput = {
      jobDescription: currentDescription,
      jobPriority: currentPriority,
      technicianAvailability: availableAITechnicians,
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
  }, [technicians, toast]);

  useEffect(() => {
    if (isOpen && !job && description.trim() && priority) { 
      const timer = setTimeout(() => {
        fetchAISuggestion(description, priority);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [description, priority, isOpen, job, fetchAISuggestion]);


  const handleSubmit = async (assignTechId: string | null = null) => {
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Address.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'assignedTechnicianId' | 'notes' | 'photos' | 'estimatedDurationMinutes'> & { updatedAt: any } = {
      title,
      description,
      priority,
      customerName: customerName || "N/A",
      customerPhone: customerPhone || "N/A",
      location: {
        // For manual address entry, lat/lng might need to be geocoded separately or remain 0
        // Or if editing, preserve original lat/lng if address hasn't changed significantly
        latitude: job?.location.latitude ?? 0, 
        longitude: job?.location.longitude ?? 0,
        address: locationAddress 
      },
      updatedAt: serverTimestamp(),
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
      <DialogContent className="sm:max-w-lg">
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
            <Label htmlFor="customerName">Customer Name</Label>
            <Input id="customerName" name="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div>
            <Label htmlFor="customerPhone">Customer Phone</Label>
            <Input id="customerPhone" name="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 555-1234" />
          </div>
          
          <div>
            <Label htmlFor="jobLocationAddress">Job Location (Address) *</Label>
            <Input 
                id="jobLocationAddress"
                name="jobLocationAddress"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Enter job address manually"
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
                  {isLoading && aiSuggestion?.suggestedTechnicianId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
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
