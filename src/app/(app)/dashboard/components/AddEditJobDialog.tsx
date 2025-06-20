
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

// Declaration for the Google Maps Place Autocomplete Web Component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete-element': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'input-id'?: string;
        placeholder?: string;
        value?: string; // Web component's own value prop
        types?: string;
        // We will not use 'ref' directly on this for this diagnostic step
      }, HTMLElement>;
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
  
  // React state for location - for diagnostic, we will not directly bind this to the web component's value prop
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Ref for the web component, primarily to attach event listeners if needed later
  const placeAutocompleteRef = useRef<HTMLElement | null>(null);


  useEffect(() => {
    if (isOpen) {
      if (job) {
        setTitle(job.title);
        setDescription(job.description);
        setPriority(job.priority);
        setCustomerName(job.customerName);
        setCustomerPhone(job.customerPhone);
        // For diagnostic, do not programmatically set the web component's value initially from React state
        // We want to see if it's interactive on its own
        setLocationAddress(job.location.address || ''); // Keep React state updated
        setLatitude(job.location.latitude);
        setLongitude(job.location.longitude);

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
      }
    }
  }, [job, isOpen]);


  // Diagnostic: Attach event listener after component mounts, if the element is found
  useEffect(() => {
    const autocompleteElement = document.getElementById('gmp-address-input-element-diagnostic') as HTMLElement & { value?: string; place?: any; };
    
    if (autocompleteElement) {
        placeAutocompleteRef.current = autocompleteElement; // Assign to ref if needed for other logic
        
        const handlePlaceChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            const place = customEvent.detail?.place; // Access place from event.detail
            if (place && place.adrFormatAddress && place.location) {
                setLocationAddress(place.adrFormatAddress || '');
                setLatitude(place.location.lat() as number);
                setLongitude(place.location.lng() as number);
            }
        };

        const handleInputChange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            setLocationAddress(target.value); // Keep React state in sync
            // If user types after selecting, clear coordinates
            setLatitude(null);
            setLongitude(null);
        };

        autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);
        // Note: 'input' event might not fire on all web components as expected.
        // If issues persist, consider if gmp-place-autocomplete-element has a specific event for value changes.
        // For now, assuming it behaves like a standard input or fires 'gmp-placechange' for user input too (needs verification).
        autocompleteElement.addEventListener('input', handleInputChange); 


        return () => {
            autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
            autocompleteElement.removeEventListener('input', handleInputChange);
        };
    }
  }, [isOpen]); // Re-run if dialog opens/closes to re-attach if element is re-created

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title and Description.", variant: "destructive" });
      return;
    }
    
    // For diagnostic, we'll rely on React's state which should have been updated by event listeners
    if (!locationAddress.trim() && (latitude === null || longitude === null)) {
        // Relax this validation for now if field is not interactive
        console.warn("Submitting possibly without location data if input field is not working.");
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
            <Label htmlFor="location-input-for-gmp-label">Job Location (Address) *</Label>
            {/* For diagnostic: Using the web component with minimal React interaction */}
            <gmp-place-autocomplete-element
                id="gmp-address-input-element-diagnostic"
                input-id="location-input-internal-diagnostic" // Unique internal ID for this diagnostic version
                placeholder="Start typing address..."
                types="address"
                // NO value prop from React state for this diagnostic step
                // NO ref prop for this diagnostic step
                // NO key prop for this diagnostic step
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
             />
            <p className="text-xs text-muted-foreground mt-1">Enter address for suggestions. If field is not clickable, check environment errors.</p>
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
    
    