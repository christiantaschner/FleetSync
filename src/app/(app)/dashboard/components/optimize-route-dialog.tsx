
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
import { optimizeRoutesAction } from "@/actions/ai-actions";
import { confirmOptimizedRouteAction } from '@/actions/fleet-actions';
import type { OptimizeRoutesOutput, Technician, Job, OptimizeRoutesInput } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapIcon, CheckCircle, Shuffle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';

interface OptimizeRouteDialogProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  technicians: Technician[];
  jobs: Job[];
  defaultTechnicianId?: string;
}

const OptimizeRouteDialog: React.FC<OptimizeRouteDialogProps> = ({ children, isOpen: controlledIsOpen, onOpenChange: setControlledIsOpen, technicians, jobs, defaultTechnicianId }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  // Internal state for uncontrolled dialog
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine if the dialog is controlled or uncontrolled
  const isControlled = controlledIsOpen !== undefined && setControlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? setControlledIsOpen : setInternalIsOpen;

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizeRoutesOutput | null>(null);

  const technicianOptions = technicians.filter(t => !t.isAvailable && t.currentJobId); 
  
  const availableJobsForTech = useMemo(() => {
    if (!selectedTechnicianId) return [];
    return jobs.filter(j => 
      j.assignedTechnicianId === selectedTechnicianId && 
      (j.status === 'Assigned' || j.status === 'En Route' || j.status === 'In Progress')
    ).sort((a,b) => (a.routeOrder ?? Infinity) - (b.routeOrder ?? Infinity));
  }, [selectedTechnicianId, jobs]);

  // If a default technician is provided, select them when the dialog opens.
  useEffect(() => {
    if (isOpen && defaultTechnicianId) {
        setSelectedTechnicianId(defaultTechnicianId);
    }
  }, [isOpen, defaultTechnicianId]);

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

    const tasksForOptimization = selectedJobIds.map(jobId => {
      const job = jobs.find(j => j.id === jobId);
      if (!job) throw new Error(`Job with ID ${jobId} not found`); 

      return {
        taskId: job.id,
        location: {
          latitude: job.location.latitude,
          longitude: job.location.longitude,
        },
        priority: job.priority,
        scheduledTime: job.scheduledTime,
      };
    });
    
    const input: OptimizeRoutesInput = {
      technicianId: selectedTechnicianId,
      currentLocation: technician.location,
      tasks: tasksForOptimization,
    };

    const result = await optimizeRoutesAction(input);
    setIsLoading(false);

    if (result.error) {
      toast({ title: "Route Optimization Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setOptimizedRoute(result.data);
      toast({ title: "Route Optimized", description: `Fleetie has generated a new route for ${technician.name}.` });
    }
  };
  
  const handleConfirmRoute = async () => {
    if (!optimizedRoute || !selectedTechnicianId || !userProfile?.companyId) return;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!appId) {
        toast({ title: "Configuration Error", description: "App ID is missing.", variant: "destructive" });
        return;
    }

    setIsConfirming(true);
    
    const allAssignedJobIds = availableJobsForTech.map(j => j.id);
    const jobsNotInRoute = allAssignedJobIds
      .filter(id => !selectedJobIds.includes(id));

    const result = await confirmOptimizedRouteAction({
      companyId: userProfile.companyId,
      appId,
      technicianId: selectedTechnicianId,
      optimizedRoute: optimizedRoute.optimizedRoute,
      jobsNotInRoute
    });
    
    setIsConfirming(false);

    if (result.error) {
      toast({ title: "Failed to Update Schedule", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Schedule Updated", description: "The technician's route has been successfully updated." });
      setIsOpen(false);
    }
  };


  const handleJobSelection = (jobId: string) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };
  
  const resetDialogState = () => {
    setSelectedTechnicianId(defaultTechnicianId || '');
    setSelectedJobIds([]);
    setOptimizedRoute(null);
    setIsLoading(false);
    setIsConfirming(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetDialogState();
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Fleetie's Route Optimizer</DialogTitle>
          <DialogDescription>
            Select a technician to have Fleetie find the most efficient order for their assigned jobs. This is useful if a job is cancelled or finishes early.
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
              <Label>Select Jobs to Optimize</Label>
              <ScrollArea className="space-y-2 mt-1 max-h-48 rounded-md border p-3">
                {availableJobsForTech.map(job => (
                  <div key={job.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`job-opt-${job.id}`}
                      checked={selectedJobIds.includes(job.id)}
                      onCheckedChange={() => handleJobSelection(job.id)}
                    />
                    <Label htmlFor={`job-opt-${job.id}`} className="font-normal cursor-pointer flex justify-between w-full">
                      <span>{job.title} ({job.priority})</span>
                      {job.routeOrder !== undefined && <Badge variant="secondary">Current: {job.routeOrder + 1}</Badge>}
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
          {selectedTechnicianId && availableJobsForTech.length === 0 && (
             <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md border text-center">Selected technician has no active jobs to optimize.</p>
          )}
          
          <Button type="submit" disabled={isLoading || !selectedTechnicianId || selectedJobIds.length === 0} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
            Generate Optimized Suggestion
          </Button>
        </form>
        
        {optimizedRoute && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-md">
            <h3 className="text-lg font-semibold font-headline flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary" /> Fleetie's Optimized Suggestion:</h3>
             <p className="text-xs text-muted-foreground mb-2">{optimizedRoute.reasoning}</p>
            <ul className="list-decimal list-inside ml-4 space-y-1 text-sm">
              {optimizedRoute.optimizedRoute.map(step => (
                <li key={step.taskId}>
                  <strong>{jobs.find(j => j.id === step.taskId)?.title || step.taskId}</strong> (ETA: {step.estimatedArrivalTime})
                </li>
              ))}
            </ul>
            
            <Button onClick={handleConfirmRoute} disabled={isConfirming} className="w-full mt-4">
              {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm & Update Schedule
            </Button>
          </div>
        )}
         <DialogFooter className="sm:justify-start mt-2 pt-4 border-t">
           <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OptimizeRouteDialog;
