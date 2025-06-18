
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

interface SmartJobAllocationDialogProps {
  children: React.ReactNode;
  technicians: Technician[];
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const SmartJobAllocationDialog: React.FC<SmartJobAllocationDialogProps> = ({ children, technicians, jobs, setJobs }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      isAvailable: t.isAvailable,
      skills: t.skills as string[], // Map TechnicianSkill[] to string[]
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
      setSuggestedTechnician(result.data);
      toast({ title: "AI Suggestion Received", description: `Technician ${result.data.suggestedTechnicianId} suggested.` });
    }
  };

  const handleAssignJob = () => {
    if (!suggestedTechnician) return;

    // This is a mock assignment. In a real app, you'd update backend, etc.
    const newJob: Job = {
      id: `job_${Date.now()}`,
      title: jobTitle || "New AI Assigned Job",
      description: jobDescription,
      priority: jobPriority,
      status: 'Assigned',
      assignedTechnicianId: suggestedTechnician.suggestedTechnicianId,
      // For mock, parse location string or use a default
      location: { latitude: 34.0522, longitude: -118.2437, address: jobLocation || "Mock Address" },
      customerName: customerName || "N/A",
      customerPhone: customerPhone || "N/A",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJobs(prevJobs => [newJob, ...prevJobs]);
    toast({ title: "Job Assigned", description: `Job "${newJob.title}" assigned to ${suggestedTechnician.suggestedTechnicianId}.`});
    setIsOpen(false);
    // Reset form fields
    setJobDescription('');
    setJobPriority('Medium');
    setJobTitle('');
    setCustomerName('');
    setCustomerPhone('');
    setJobLocation('');
    setSuggestedTechnician(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Smart Job Allocation (AI)</DialogTitle>
          <DialogDescription>
            Let AI suggest the best technician for a new job based on availability, skills, and location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Emergency Plumbing Fix" />
          </div>
          <div>
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea id="jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Describe the job requirements..." required />
          </div>
          <div>
            <Label htmlFor="jobPriority">Job Priority</Label>
            <Select value={jobPriority} onValueChange={(value: 'High' | 'Medium' | 'Low') => setJobPriority(value)}>
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
            <Label htmlFor="jobLocation">Job Location (Address)</Label>
            <Input id="jobLocation" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g., 123 Main St, Anytown, USA" />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Get AI Suggestion
          </Button>
        </form>
        
        {suggestedTechnician && (
          <div className="mt-6 p-4 bg-secondary rounded-md">
            <h3 className="text-lg font-semibold font-headline">AI Suggestion:</h3>
            <p><strong>Technician ID:</strong> {suggestedTechnician.suggestedTechnicianId}</p>
            <p><strong>Reasoning:</strong> {suggestedTechnician.reasoning}</p>
            <Button onClick={handleAssignJob} className="w-full mt-4" variant="default">
              Assign Job to {technicians.find(t => t.id === suggestedTechnician.suggestedTechnicianId)?.name || suggestedTechnician.suggestedTechnicianId}
            </Button>
          </div>
        )}
        <DialogFooter className="sm:justify-start mt-2">
           <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartJobAllocationDialog;
