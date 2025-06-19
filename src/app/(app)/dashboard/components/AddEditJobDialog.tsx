
"use client";

import React, { useState, useEffect, useRef } from 'react';
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

interface AddEditJobDialogProps {
  children: React.ReactNode; // Trigger element
  job?: Job; // Job to edit, undefined for new job
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
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState(34.0522); 
  const [longitude, setLongitude] = useState(-118.2437);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setDescription(job.description);
      setPriority(job.priority);
      setCustomerName(job.customerName);
      setCustomerPhone(job.customerPhone);
      setLocationAddress(job.location.address || '');
      setLatitude(job.location.latitude);
      setLongitude(job.location.longitude);
    } else {
      // Reset for new job form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setCustomerName('');
      setCustomerPhone('');
      setLocationAddress(''); 
      setLatitude(34.0522); 
      setLongitude(-118.2437);
    }
  }, [job, isOpen]);


  useEffect(() => {
    if (isOpen && addressInputRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.places) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        { types: ['address'], fields: ['formatted_address', 'geometry.location'] }
      );
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          setLocationAddress(place.formatted_address || '');
          setLatitude(place.geometry.location.lat());
          setLongitude(place.geometry.location.lng());
        }
      });
    }

    return () => {
      // Clean up listener and pac-container
      // google.maps.event.clearInstanceListeners is tricky with Autocomplete instances directly.
      // Removing .pac-container elements is a common way to help with cleanup.
      const pacContainers = document.getElementsByClassName('pac-container');
      for (let i = pacContainers.length - 1; i >= 0; i--) {
        pacContainers[i].remove();
      }
    };
  }, [isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationAddress.trim() || !description.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Location Address.", variant: "destructive" });
      return;
    }
    
    const isDefaultCoords = latitude === 34.0522 && longitude === -118.2437;
    const isDefaultAddressForExample = locationAddress === "123 Main St, Los Angeles, CA"; 
    if (locationAddress.trim() && isDefaultCoords && !isDefaultAddressForExample) {
        console.warn("Submitting job with potentially default/invalid coordinates for the address: ", locationAddress, "Coords:", latitude, longitude);
    }

    setIsLoading(true);

    const jobData = {
      title,
      description,
      priority,
      customerName: customerName || "N/A",
      customerPhone: customerPhone || "N/A",
      location: { 
        latitude: latitude, 
        longitude: longitude, 
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
            <Input id="jobTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" required />
          </div>
          <div>
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea id="jobDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job requirements..." required rows={3}/>
          </div>
          <div>
            <Label htmlFor="jobPriority">Job Priority *</Label>
            <Select value={priority} onValueChange={(value: JobPriority) => setPriority(value)}>
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
            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div>
            <Label htmlFor="customerPhone">Customer Phone</Label>
            <Input id="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 555-1234" />
          </div>
          <div>
            <Label htmlFor="jobLocationAddress">Job Location (Address) *</Label>
            <Input 
              id="jobLocationAddress" 
              ref={addressInputRef}
              defaultValue={locationAddress} 
              onChange={(e) => {
                  setLocationAddress(e.target.value);
              }}
              placeholder="Start typing address for suggestions..." 
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Select an address from suggestions to set coordinates automatically.</p>
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
    
