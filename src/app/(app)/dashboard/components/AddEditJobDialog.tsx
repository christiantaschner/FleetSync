
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete-element': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'input-id'?: string;
        // value prop is intentionally omitted here to let the component manage its own state during typing
        // React will set the initial value programmatically and sync via events.
        placeholder?: string;
        types?: string; 
        style?: React.CSSProperties;
        key?: string | number; 
      }, HTMLElement & { place?: google.maps.places.PlaceResult; value: string }>;
    }
  }
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
  
  const [locationAddress, setLocationAddress] = useState(''); // Always initialize to empty string
  const [latitude, setLatitude] = useState<number | null>(null); 
  const [longitude, setLongitude] = useState<number | null>(null);

  const placeAutocompleteRef = useRef<HTMLElement & { place?: google.maps.places.PlaceResult; value: string }>(null);

  // Effect to set initial form values when dialog opens or job changes
  useEffect(() => {
    if (isOpen) {
      const autocompleteElement = placeAutocompleteRef.current;
      if (job) {
        setTitle(job.title);
        setDescription(job.description);
        setPriority(job.priority);
        setCustomerName(job.customerName);
        setCustomerPhone(job.customerPhone);
        
        const initialAddress = job.location.address || '';
        setLocationAddress(initialAddress); // Update React state
        if (autocompleteElement) {
          autocompleteElement.value = initialAddress; // Programmatically set web component's value
        }
        setLatitude(job.location.latitude);
        setLongitude(job.location.longitude);
      } else {
        // Reset for new job
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setCustomerName('');
        setCustomerPhone('');
        setLocationAddress(''); // Update React state
        if (autocompleteElement) {
          autocompleteElement.value = ''; // Programmatically set web component's value
        }
        setLatitude(null);
        setLongitude(null);
      }
    }
  }, [job, isOpen]);


  // Effect to add/remove event listeners for the autocomplete element
  useEffect(() => {
    const autocompleteElement = placeAutocompleteRef.current;
    // Ensure API is ready and element is available
    if (isOpen && autocompleteElement && window.google?.maps?.places?.PlaceAutocompleteElement) {
      
      const handlePlaceChange = () => {
        const gmpElement = autocompleteElement as HTMLElement & { place?: google.maps.places.PlaceResult; value: string };
        if (gmpElement.place && gmpElement.place.geometry && gmpElement.place.geometry.location) {
          const newPlace = gmpElement.place;
          setLocationAddress(newPlace.formatted_address || gmpElement.value);
          setLatitude(newPlace.geometry.location.lat());
          setLongitude(newPlace.geometry.location.lng());
        } else {
           if (gmpElement.value !== locationAddress) { 
            setLocationAddress(gmpElement.value);
          }
          setLatitude(null);
          setLongitude(null);
        }
      };

      const handleDirectInput = (event: Event) => {
         const target = event.target as (HTMLElement & { value: string });
         if (target.value !== locationAddress) { 
            setLocationAddress(target.value);
         }
         if (latitude !== null || longitude !== null) {
            setLatitude(null);
            setLongitude(null);
         }
      };
      
      autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);
      autocompleteElement.addEventListener('input', handleDirectInput);

      return () => {
        autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
        autocompleteElement.removeEventListener('input', handleDirectInput);
      };
    }
  }, [isOpen, locationAddress, latitude, longitude]); 


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title and Description.", variant: "destructive" });
      return;
    }
    if (!locationAddress.trim()) {
        toast({ title: "Location Missing", description: "Please enter and select a job location.", variant: "destructive"});
        return;
    }
    if (latitude === null || longitude === null) {
        const gmpElement = placeAutocompleteRef.current;
        if (locationAddress.trim() && (gmpElement?.value && !gmpElement?.place)) {
            toast({ title: "Location Incomplete", description: "Please select a valid address from suggestions, or ensure the address provides coordinates.", variant: "destructive"});
            return;
        }
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
            <Label htmlFor="jobLocationAddressGmp">Job Location (Address) *</Label>
            <gmp-place-autocomplete-element
                key={job?.id || 'new-job-location-autocomplete'} 
                ref={placeAutocompleteRef}
                input-id="jobLocationAddressGmp" 
                placeholder="Start typing address..."
                types="address"
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
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
    
