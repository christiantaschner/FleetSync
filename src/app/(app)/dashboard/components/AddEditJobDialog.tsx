
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
  }, [job, isOpen]); 


  const initAutocomplete = useCallback(() => {
    if (isOpen && addressInputRef.current && !autocompleteInstanceRef.current) {
      if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete) {
        
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
            if (addressInputRef.current) {
              addressInputRef.current.value = place.formatted_address; // Ensure input field also reflects the change
            }
          } else {
            console.warn("Autocomplete: place_changed event fired, but place data is incomplete or not available.", place);
          }
        });
      } else {
        console.warn('Google Maps API, Places library, or Autocomplete service not available yet. Ensure the API script is loaded with libraries=places.');
      }
    }
  }, [isOpen]); 

  useEffect(() => {
    if (isOpen) {
      initAutocomplete();
    }

    return () => {
      if (placeChangedListenerRef.current) {
        placeChangedListenerRef.current.remove();
        placeChangedListenerRef.current = null;
      }
      // Important: Detach Autocomplete from input to prevent memory leaks
      // This does not destroy the Autocomplete instance itself, but removes its listeners from the input
      if (autocompleteInstanceRef.current && addressInputRef.current) {
          // No direct 'destroy' or 'unbind' method for the Autocomplete instance itself.
          // Clearing listeners for the instance and removing the input's association is key.
          // window.google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
          // The above line can be problematic. It's often better to just nullify the ref and let GC handle it
          // or if Google specifically provides a dispose method for the Autocomplete object.
      }
      autocompleteInstanceRef.current = null; // Nullify to allow re-initialization if dialog reopens

      // Clean up .pac-container elements that Google Maps API appends to the body
      // This should be done carefully to avoid removing containers from other map instances.
      if (!isOpen) { // Only on actual dialog close
        const pacContainers = document.getElementsByClassName('pac-container');
        // Convert HTMLCollection to array to iterate safely while removing
        Array.from(pacContainers).forEach(container => {
            // A more specific check could be added if there are multiple autocomplete instances on the page
            // For now, this removes all, assuming this dialog is the primary user of Autocomplete
            if (container.parentElement === document.body) {
                container.remove();
            }
        });
      }
    };
  }, [isOpen, initAutocomplete]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationAddress.trim() || !description.trim()) {
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
              value={locationAddress} // Controlled by state
              onChange={(e) => {
                  setLocationAddress(e.target.value); // Directly update state on manual typing
                  // Autocomplete may still try to take over, but this ensures state reflects input
              }}
              onFocus={initAutocomplete} 
              placeholder="Start typing address for suggestions..." 
              required
              autoComplete="off" 
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
    
