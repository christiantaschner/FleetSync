
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { allocateJobAction, AllocateJobActionInput } from "@/actions/fleet-actions";
import type { AllocateJobOutput } from "@/ai/flows/allocate-job";
import type { Technician, Job, AITechnician } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions

interface SmartJobAllocationDialogProps {
  children: React.ReactNode;
  technicians: Technician[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>; // To optimistically update UI
  setTechnicians: React.Dispatch<React.SetStateAction<Technician[]>>; // To optimistically update UI
}

const SmartJobAllocationDialog: React.FC<SmartJobAllocationDialogProps> = ({ children, technicians, setJobs, setTechnicians }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssign, setIsLoadingAssign] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobPriority, setJobPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [suggestedTechnician, setSuggestedTechnician] = useState<AllocateJobOutput | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [jobLocation, setJobLocation] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      toast({ title: "Error", description: "Job description cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSuggestedTechnician(null);

    const availableAITechnicians: AITechnician[] = technicians.map(t => ({
      technicianId: t.id,
      technicianName: t.name, // Added technician name
      isAvailable: t.isAvailable,
      skills: t.skills as string[],
      location: {
        latitude: t.location.latitude,
        longitude: t.location.longitude,
      },
    }));
    
    const input: AllocateJobActionInput = {
      jobDescription,
      jobPriority,
      technicianAvailability: availableAITechnicians,
    };

    const result = await allocateJobAction(input);
    setIsLoading(false);

    if (result.error) {
      toast({ title: "AI Allocation Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      const tech = technicians.find(t => t.id === result.data!.suggestedTechnicianId);
      toast({ title: "AI Suggestion Received", description: `Technician ${tech?.name || result.data.suggestedTechnicianId} suggested.` });
      setSuggestedTechnician(result.data);
    }
  };

  const handleAssignJob = async () => {
    if (!suggestedTechnician || !db) return;
    if (!jobTitle.trim() || !jobLocation.trim()) {
         toast({ title: "Missing Information", description: "Please provide a Job Title and Location.", variant: "destructive" });
        return;
    }

    setIsLoadingAssign(true);

    try {
      const newJobData = {
        title: jobTitle || "New AI Assigned Job",
        description: jobDescription,
        priority: jobPriority,
        status: 'Assigned' as Job['status'],
        assignedTechnicianId: suggestedTechnician.suggestedTechnicianId,
        location: { latitude: 34.0522, longitude: -118.2437, address: jobLocation }, // TODO: Geocode address or allow lat/lon input
        customerName: customerName || "N/A",
        customerPhone: customerPhone || "N/A",
        createdAt: new Date().toISOString(), // Or serverTimestamp() for Firestore native time
        updatedAt: new Date().toISOString(),
        notes: '',
        photos: [],
      };

      // Add job to Firestore
      const jobRef = await addDoc(collection(db, "jobs"), {
        ...newJobData,
        createdAt: serverTimestamp(), // Use server timestamp for creation
        updatedAt: serverTimestamp(), // Use server timestamp for update
      });
      
      const newJobWithId: Job = { ...newJobData, id: jobRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };


      // Update technician in Firestore
      const techDocRef = doc(db, "technicians", suggestedTechnician.suggestedTechnicianId);
      await updateDoc(techDocRef, {
        isAvailable: false,
        currentJobId: jobRef.id,
      });

      // Optimistically update local state
      setJobs(prevJobs => [newJobWithId, ...prevJobs]);
      setTechnicians(prevTechs => 
        prevTechs.map(t => 
          t.id === suggestedTechnician.suggestedTechnicianId 
            ? { ...t, isAvailable: false, currentJobId: jobRef.id } 
            : t
        )
      );
      
      const assignedTech = technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId);
      toast({ title: "Job Assigned to Firestore", description: `Job "${newJobWithId.title}" assigned to ${assignedTech?.name || suggestedTechnician.suggestedTechnicianId}.`});
      
      setIsOpen(false);
      // Reset form fields
      setJobDescription('');
      setJobPriority('Medium');
      setJobTitle('');
      setCustomerName('');
      setCustomerPhone('');
      setJobLocation('');
      setSuggestedTechnician(null);

    } catch (error) {
      console.error("Error assigning job to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not assign job. Check console.", variant: "destructive" });
    } finally {
      setIsLoadingAssign(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            setSuggestedTechnician(null); // Reset suggestion when dialog closes
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Smart Job Allocation (AI)</DialogTitle>
          <DialogDescription>
            Let AI suggest the best technician for a new job based on availability, skills, and location. Fill in job details first.
          </DialogDescription>
        </DialogHeader>
        {/* Form for Job Details */}
        <div className="space-y-3 py-1">
            <div>
                <Label htmlFor="jobTitleDialog">Job Title *</Label>
                <Input id="jobTitleDialog" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" required />
            </div>
            <div>
                <Label htmlFor="jobDescriptionDialog">Job Description *</Label>
                <Textarea id="jobDescriptionDialog" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Describe the job requirements..." required />
            </div>
            <div>
                <Label htmlFor="jobPriorityDialog">Job Priority *</Label>
                <Select value={jobPriority} onValueChange={(value: 'High' | 'Medium' | 'Low') => setJobPriority(value)}>
                <SelectTrigger id="jobPriorityDialog">
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
                <Label htmlFor="customerNameDialog">Customer Name</Label>
                <Input id="customerNameDialog" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., John Doe" />
            </div>
            <div>
                <Label htmlFor="customerPhoneDialog">Customer Phone</Label>
                <Input id="customerPhoneDialog" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 555-1234" />
            </div>
            <div>
                <Label htmlFor="jobLocationDialog">Job Location (Address) *</Label>
                <Input id="jobLocationDialog" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g., 123 Main St, Anytown, USA" required/>
            </div>
        </div>

        <Button onClick={handleSubmit} disabled={isLoading || !jobTitle || !jobDescription || !jobLocation} className="w-full mt-2">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Get AI Suggestion
        </Button>
        
        {suggestedTechnician && (
          <div className="mt-4 p-4 bg-secondary rounded-md">
            <h3 className="text-lg font-semibold font-headline">AI Suggestion:</h3>
            <p><strong>Technician:</strong> {technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId)?.name || suggestedTechnician.suggestedTechnicianId}</p>
            <p><strong>Reasoning:</strong> {suggestedTechnician.reasoning}</p>
            <Button onClick={handleAssignJob} className="w-full mt-3" variant="default" disabled={isLoadingAssign}>
              {isLoadingAssign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assign Job to {technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId)?.name || suggestedTechnician.suggestedTechnicianId}
            </Button>
          </div>
        )}
        <DialogFooter className="sm:justify-start mt-3">
           <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartJobAllocationDialog;
