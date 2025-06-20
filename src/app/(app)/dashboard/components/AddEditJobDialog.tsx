
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
import { Input } from '@/components/ui/input'; // Keep for other fields
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Job, JobPriority, JobStatus } from '@/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// TypeScript declaration for the Google Maps Place Autocomplete Web Component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete-element': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'input-id'?: string;
        value?: string; // For initial value and potentially for reading
        placeholder?: string;
        types?: string; // e.g. "address"
        // Additional attributes like country, location-bias can be added if needed
        style?: React.CSSProperties;
      }, HTMLElement & { place?: google.maps.places.PlaceResult; value: string }>;
    }
  }
}


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
  
  // Location state
  const [locationAddress, setLocationAddress] = useState(''); 
  const [latitude, setLatitude] = useState<number | null>(null); 
  const [longitude, setLongitude] = useState<number | null>(null);

  const placeAutocompleteRef = useRef<HTMLElement & { place?: google.maps.places.PlaceResult; value: string }>(null);

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
      // Set initial value for the autocomplete element when editing
      if (placeAutocompleteRef.current) {
        placeAutocompleteRef.current.value = job.location.address || '';
      }
    } else {
      // Reset for new job form
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
  }, [job, isOpen]); 


  useEffect(() => {
    const autocompleteElement = placeAutocompleteRef.current;
    if (isOpen && autocompleteElement && window.google && window.google.maps && window.google.maps.places) {
      
      const handlePlaceChange = () => {
        if (autocompleteElement.place && autocompleteElement.place.geometry && autocompleteElement.place.geometry.location) {
          const newPlace = autocompleteElement.place;
          setLocationAddress(newPlace.formatted_address || autocompleteElement.value);
          setLatitude(newPlace.geometry.location.lat());
          setLongitude(newPlace.geometry.location.lng());
        } else {
          // If place details are not available, update address from input value
          // This covers manual typing or clearing the input
          setLocationAddress(autocompleteElement.value);
          // Potentially clear lat/lng if address is manually changed and not a valid place
          // setLatitude(null); 
          // setLongitude(null);
        }
      };

      // Event listener for when a place is selected from suggestions
      autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);
      
      // Event listener for direct input changes (typing)
      // This helps keep locationAddress state in sync with what user types
      const handleDirectInput = (event: Event) => {
         setLocationAddress((event.target as HTMLInputElement).value);
      };
      autocompleteElement.addEventListener('input', handleDirectInput);


      return () => {
        autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
        autocompleteElement.removeEventListener('input', handleDirectInput);
      };
    }
  }, [isOpen]); // Re-attach listeners when dialog opens


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationAddress.trim() || !description.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Location Address.", variant: "destructive" });
      return;
    }
    if (latitude === null || longitude === null) {
         // If a place was selected, lat/lng should be set.
         // If user typed an address and didn't select, and we didn't get lat/lng,
         // we might want to prevent submission or try to geocode the address.
         // For now, let's require a selected place or an address that resolved to coordinates.
         // This check can be refined based on desired behavior for non-selected addresses.
         if (placeAutocompleteRef.current?.value && !placeAutocompleteRef.current?.place) {
            toast({ title: "Location Incomplete", description: "Please select a valid address from suggestions, or ensure the address provides coordinates.", variant: "destructive"});
            return;
         } else if (!placeAutocompleteRef.current?.value) {
             toast({ title: "Location Missing", description: "Please enter and select a job location.", variant: "destructive"});
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
        // Ensure latitude and longitude are numbers. Fallback if somehow still null.
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
            {/* 
              The value prop on gmp-place-autocomplete-element is for the *initial* value.
              To make it behave more like a controlled component, we update its .value property
              in the useEffect when `job` (and thus `locationAddress` state) changes.
              The `locationAddress` state is updated via the 'input' event listener.
            */}
            <gmp-place-autocomplete-element
                ref={placeAutocompleteRef}
                input-id="jobLocationAddressGmp" // For associating label, though not strictly needed for functionality here
                placeholder="Start typing address..."
                types="address" // Restrict to addresses
                className={cn( // Apply ShadCN input styles to the host element
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
                // value={locationAddress} // Initial value is set via ref in useEffect
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
    
