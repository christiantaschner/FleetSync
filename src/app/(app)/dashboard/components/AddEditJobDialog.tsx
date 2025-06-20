
"use client";

import React, { useState, useEffect } from 'react';
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
import type { Job, JobPriority, JobStatus } from '@/types';
import { Loader2 } from 'lucide-react';

// No gmp-place-autocomplete-element specific declarations needed now

interface AddEditJobDialogProps {
  children: React.ReactNode;
  job?: Job;
  onJobAddedOrUpdated?: (job: Job) => void;
}

const AddEditJobDialog: React.FC<AddEditJobDialogProps> = ({ children, job, onJobAddedOrUpdated }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('Medium');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState(''); // Standard text input for address

  useEffect(() => {
    if (isOpen) {
      if (job) {
        setTitle(job.title);
        setDescription(job.description);
        setPriority(job.priority);
        setCustomerName(job.customerName);
        setCustomerPhone(job.customerPhone);
        setLocationAddress(job.location.address || '');
      } else {
        // Reset for new job
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setCustomerName('');
        setCustomerPhone('');
        setLocationAddress('');
      }
    }
  }, [job, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Address.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const jobData = {
      title,
      description,
      priority,
      customerName: customerName || "N/A",
      customerPhone: customerPhone || "N/A",
      location: {
        // Latitude and longitude will not be set from address suggestions
        // They will default to 0 or existing values if editing.
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
        await updateDoc(jobDocRef, jobData);
        finalJob = { ...job, ...jobData, updatedAt: new Date().toISOString() };
        toast({ title: "Job Updated", description: `Job "${finalJob.title}" has been updated.` });
      } else {
        const newJobPayload = {
          ...jobData,
          status: 'Pending' as JobStatus,
          assignedTechnicianId: null,
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
        toast({ title: "Job Added", description: `New job "${finalJob.title}" created with Pending status.` });
      }

      onJobAddedOrUpdated?.(finalJob);
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
            {job ? 'Update the details for this job.' : 'Fill in the details for the new job. It will be created with "Pending" status.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
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
              <SelectTrigger id="jobPriority">
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
             <p className="text-xs text-muted-foreground mt-1">
              Address suggestions are temporarily unavailable. Please enter manually.
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {job ? 'Save Changes' : 'Add Job'}
          </Button>
        </form>
        <DialogFooter className="sm:justify-start mt-2">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditJobDialog;
