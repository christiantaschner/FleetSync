
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { optimizeRoutesAction, OptimizeRoutesActionInput } from "@/actions/fleet-actions";
import type { OptimizeRoutesOutput } from "@/ai/flows/optimize-routes";
import type { Technician, Job, AITask } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapIcon } from 'lucide-react';

interface OptimizeRouteDialogProps {
  children: React.ReactNode;
  technicians: Technician[];
  jobs: Job[];
}

const OptimizeRouteDialog: React.FC<OptimizeRouteDialogProps> = ({ children, technicians, jobs }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizeRoutesOutput | null>(null);
  const [trafficData, setTrafficData] = useState<string>('');
  const [unexpectedEvents, setUnexpectedEvents] = useState<string>('');

  const technicianOptions = technicians.filter(t => !t.isAvailable && t.currentJobId); 
  
  const availableJobsForTech = useMemo(() => {
    if (!selectedTechnicianId) return [];
    return jobs.filter(j => 
      j.assignedTechnicianId === selectedTechnicianId && 
      (j.status === 'Assigned' || j.status === 'En Route' || j.status === 'In Progress')
    );
  }, [selectedTechnicianId, jobs]);

  useEffect(() => {
    // Auto-select all available jobs for the technician when the technician or their jobs change
    if (selectedTechnicianId && availableJobsForTech.length > 0) {
      setSelectedJobIds(availableJobsForTech.map(job => job.id));
    } else {
      setSelectedJobIds([]); // Clear if no tech or no jobs
    }
  }, [selectedTechnicianId, availableJobsForTech]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechnicianId) {
      toast({ title: "Error", description: "Please select a technician.", variant: "destructive" });
      return;
    }
    if (selectedJobIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one job for optimization.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setOptimizedRoute(null);

    const technician = technicians.find(t => t.id === selectedTechnicianId);
    if (!technician) {
      toast({ title: "Error", description: "Selected technician not found.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const tasksForOptimization: AITask[] = selectedJobIds.map(jobId => {
      const job = jobs.find(j => j.id === jobId);
      if (!job) throw new Error(`Job with ID ${jobId} not found`); 
      
      let priority: 'high' | 'medium' | 'low';
      switch(job.priority) {
        case 'High': priority = 'high'; break;
        case 'Medium': priority = 'medium'; break;
        case 'Low': priority = 'low'; break;
        default: priority = 'medium';
      }

      return {
        taskId: job.id,
        location: {
          latitude: job.location.latitude,
          longitude: job.location.longitude,
        },
        priority: priority,
      };
    });
    
    const input: OptimizeRoutesActionInput = {
      technicianId: selectedTechnicianId,
      currentLocation: technician.location,
      tasks: tasksForOptimization,
      trafficData: trafficData || undefined,
      unexpectedEvents: unexpectedEvents || undefined,
    };

    const result = await optimizeRoutesAction(input);
    setIsLoading(false);

    if (result.error) {
      toast({ title: "Route Optimization Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setOptimizedRoute(result.data);
      toast({ title: "Route Optimized", description: `New route generated for ${technician.name}.` });
    }
  };
  
  const handleJobSelection = (jobId: string) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) { // Reset state when dialog closes
        setSelectedTechnicianId('');
        setSelectedJobIds([]);
        setOptimizedRoute(null);
        setTrafficData('');
        setUnexpectedEvents('');
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Manual AI Route Re-Optimization</DialogTitle>
          <DialogDescription>
            Manually trigger AI to re-optimize a selected technician&apos;s current route, considering their active jobs and any new information like traffic or unexpected events.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="technicianSelect">Select Technician</Label>
            <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId} name="technicianSelect">
              <SelectTrigger id="technicianSelect">
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicianOptions.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTechnicianId && availableJobsForTech.length > 0 && (
            <div>
              <Label>Select Jobs to Optimize (defaults to all active)</Label>
              <div className="space-y-2 mt-1 max-h-40 overflow-y-auto rounded-md border p-2">
                {availableJobsForTech.map(job => (
                  <div key={job.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`job-opt-${job.id}`}
                      checked={selectedJobIds.includes(job.id)}
                      onCheckedChange={() => handleJobSelection(job.id)}
                    />
                    <Label htmlFor={`job-opt-${job.id}`} className="font-normal cursor-pointer">
                      {job.title} ({job.priority})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedTechnicianId && availableJobsForTech.length === 0 && (
             <p className="text-sm text-muted-foreground">Selected technician has no active jobs to optimize.</p>
          )}

          <div>
            <Label htmlFor="trafficData">Traffic Data (Optional JSON)</Label>
            <Textarea id="trafficData" name="trafficData" value={trafficData} onChange={(e) => setTrafficData(e.target.value)} placeholder='e.g., {"M5_congestion": "high"}' />
          </div>
          <div>
            <Label htmlFor="unexpectedEvents">Unexpected Events (Optional JSON)</Label>
            <Textarea id="unexpectedEvents" name="unexpectedEvents" value={unexpectedEvents} onChange={(e) => setUnexpectedEvents(e.target.value)} placeholder='e.g., {"road_closure": "Main St"}' />
          </div>

          <Button type="submit" disabled={isLoading || !selectedTechnicianId || selectedJobIds.length === 0} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Optimize Technician&apos;s Route
          </Button>
        </form>
        
        {optimizedRoute && (
          <div className="mt-6 p-4 bg-secondary rounded-md">
            <h3 className="text-lg font-semibold font-headline flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary" /> Optimized Route:</h3>
            <p><strong>Total Travel Time:</strong> {optimizedRoute.totalTravelTime}</p>
            <p className="mt-1"><strong>Order:</strong></p>
            <ul className="list-disc list-inside ml-4 text-sm">
              {optimizedRoute.optimizedRoute.map(step => (
                <li key={step.taskId}>
                  {jobs.find(j => j.id === step.taskId)?.title || step.taskId} (ETA: {step.estimatedArrivalTime})
                </li>
              ))}
            </ul>
            <p className="mt-2"><strong>Reasoning:</strong> {optimizedRoute.reasoning}</p>
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

export default OptimizeRouteDialog;

