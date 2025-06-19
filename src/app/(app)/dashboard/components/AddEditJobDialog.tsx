
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
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placeChangedListenerRef = useRef<google.maps.MapsEventListener | null>(null);

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
  }, [job, isOpen]); // Rerun when job changes or dialog opens/closes to reset form


  const initAutocomplete = useCallback(() => {
    if (isOpen && addressInputRef.current) {
      if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete) {
        if (!autocompleteInstanceRef.current) { // Initialize only once
          autocompleteInstanceRef.current = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            { types: ['address'], fields: ['formatted_address', 'geometry.location'] }
          );

          placeChangedListenerRef.current = autocompleteInstanceRef.current.addListener('place_changed', () => {
            const place = autocompleteInstanceRef.current?.getPlace();
            if (place && place.formatted_address && place.geometry && place.geometry.location) {
              setLocationAddress(place.formatted_address);
              setLatitude(place.geometry.location.lat());
              setLongitude(place.geometry.location.lng());
              // Manually update the input's value if Google doesn't, though it usually does
              if (addressInputRef.current) {
                addressInputRef.current.value = place.formatted_address;
              }
            } else {
              console.warn("Autocomplete: place_changed event fired, but place data is incomplete.", place);
            }
          });
        }
      } else {
        console.warn('Google Maps API, Places library, or Autocomplete service not available yet. Retrying in 500ms...');
        // Optionally, retry initialization after a short delay if the script might still be loading
        // This might be aggressive and lead to multiple timers if not handled carefully.
        // For now, a console warning is safer. Users might need to close/reopen dialog if script loads late.
      }
    }
  }, [isOpen]); // Dependency: isOpen

  useEffect(() => {
    initAutocomplete(); // Attempt to initialize when isOpen changes (e.g. dialog opens)

    return () => {
      // Cleanup logic
      if (placeChangedListenerRef.current) {
        placeChangedListenerRef.current.remove();
        placeChangedListenerRef.current = null;
      }
      // Note: Google recommends not to directly manage the Autocomplete instance for deletion
      // unless you are sure it's necessary and won't be reused.
      // The .pac-container is managed by Google, but we can try to remove leftovers if they persist after dialog close.
      if (!isOpen) { // Only remove pac-containers when dialog is truly closing
        const pacContainers = document.getElementsByClassName('pac-container');
        for (let i = 0; i < pacContainers.length; i++) {
          // Check if it's not a persisted one for another map instance, if necessary
          if (pacContainers[i].parentElement === document.body) { // A common check
             pacContainers[i].remove();
          }
        }
        autocompleteInstanceRef.current = null; // Allow re-initialization
      }
    };
  }, [isOpen, initAutocomplete]); // initAutocomplete is now a dependency


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationAddress.trim() || !description.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Title, Description, and Location Address.", variant: "destructive" });
      return;
    }
    
    // Check if the address input still holds the user's typed value vs. a selected place
    // This is important because if they typed but didn't select, locationAddress might be stale
    // or latitude/longitude might not match.
    if (addressInputRef.current && addressInputRef.current.value !== locationAddress) {
        // Potentially the user typed more after selecting a place, or never selected one.
        // We might want to force selection or use the typed value.
        // For now, we rely on the 'place_changed' event to set locationAddress, lat, lon.
        // If they type and submit without selecting, lat/lon might be from a previous selection or default.
        console.warn("Address input differs from selected/stored address. Using stored address for submission:", locationAddress);
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
    <Dialog open={isOpen} onOpenChange={(openState) => {
        setIsOpen(openState);
        if (!openState) {
            // Reset autocomplete instance when dialog closes
            autocompleteInstanceRef.current = null; 
        }
    }}>
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
              defaultValue={locationAddress} // Use defaultValue, allow Google Autocomplete to control during interaction
              onChange={(e) => {
                  // If user types manually *after* selection, this could update address
                  // but lat/lon might become out of sync.
                  // Best to rely on 'place_changed' for setting state.
                  // This onChange is mainly for if they clear it or type something totally new
                  // *without* selecting from Autocomplete.
                  setLocationAddress(e.target.value);
              }}
              onFocus={initAutocomplete} // Attempt to init if not already, e.g. if dialog opened but input wasn't focused.
              placeholder="Start typing address for suggestions..." 
              required
              autoComplete="off" // Important to prevent browser's own autocomplete interfering
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
    
