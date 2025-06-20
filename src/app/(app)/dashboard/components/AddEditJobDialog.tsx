
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
import { cn } from '@/lib/utils';

// TypeScript declaration for the Google Maps Place Autocomplete web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete-element': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        value?: string;
        placeholder?: string;
        id?: string;
        name?: string;
        // Add other specific props if known and needed
      }, HTMLElement>;
    }
  }
}

interface PlaceAutocompleteElement extends HTMLElement {
  value: string | null;
  getPlace: () => Promise<google.maps.places.PlaceResult | null>;
  // Add other properties or methods if needed based on the web component's API
}


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
  
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const placeAutocompleteRef = useRef<PlaceAutocompleteElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (job) {
        setTitle(job.title);
        setDescription(job.description);
        setPriority(job.priority);
        setCustomerName(job.customerName);
        setCustomerPhone(job.customerPhone);
        setLocationAddress(job.location.address || '');
        setLatitude(job.location.latitude);
        setLongitude(job.location.longitude);
        // Programmatically set value for gmp-place-autocomplete-element if editing
        if (placeAutocompleteRef.current) {
          placeAutocompleteRef.current.value = job.location.address || '';
        }
      } else {
        // Reset for new job
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setCustomerName('');
        setCustomerPhone('');
        setLocationAddress('');
        setLatitude(null);
        setLongitude(null);
        if (placeAutocompleteRef.current) {
          placeAutocompleteRef.current.value = '';
        }
      }
    }
  }, [job, isOpen]);

  useEffect(() => {
    const autocompleteElement = placeAutocompleteRef.current;
    if (!autocompleteElement || !isOpen) return;

    const handlePlaceSelect = async (event: Event) => {
      // The event for gmp-place-autocomplete-element might be 'gmp-placeselect'
      // or another custom event. Check the component's documentation.
      // Assuming it's 'gmp-placeselect' and the element has a getPlace() method
      try {
        const place = await autocompleteElement.getPlace();
        if (place && place.formatted_address) {
          setLocationAddress(place.formatted_address);
          if (place.geometry && place.geometry.location) {
            setLatitude(place.geometry.location.lat());
            setLongitude(place.geometry.location.lng());
          } else {
            setLatitude(null);
            setLongitude(null);
          }
        }
      } catch (error) {
        console.error("Error getting place details:", error);
        toast({ title: "Address Error", description: "Could not fetch place details.", variant: "destructive" });
      }
    };
    
    const handleInputChange = (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        if (target) {
            setLocationAddress(target.value || '');
            // If user types manually, clear lat/lng as it's no longer from a selected place
            setLatitude(null);
            setLongitude(null);
        }
    };

    autocompleteElement.addEventListener('gmp-placeselect', handlePlaceSelect);
    autocompleteElement.addEventListener('input', handleInputChange); // Listen to direct input changes

    return () => {
      autocompleteElement.removeEventListener('gmp-placeselect', handlePlaceSelect);
      autocompleteElement.removeEventListener('input', handleInputChange);
    };
  }, [isOpen, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Location Address.", variant: "destructive" });
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
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
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
            {/* 
              The 'value' prop on gmp-place-autocomplete-element is used for initial setting.
              React state 'locationAddress' is updated via event listeners.
              To ensure the displayed text updates if 'locationAddress' is changed by other means
              (though less common for this specific setup), we bind its value prop.
            */}
            <gmp-place-autocomplete-element
              id="jobLocationAddress"
              name="jobLocationAddress"
              ref={placeAutocompleteRef}
              placeholder="Start typing address..."
              value={locationAddress} 
              // The `value` attribute here ensures that if locationAddress is updated externally
              // while the component is mounted, it reflects. However, direct manipulation
              // of this web component's value is often done via its JS API or direct property set.
              // We already handle setting initial value in useEffect.
              // The 'input' event listener above handles user typing.
            />
             <p className="text-xs text-muted-foreground mt-1">Start typing for address suggestions.</p>
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
