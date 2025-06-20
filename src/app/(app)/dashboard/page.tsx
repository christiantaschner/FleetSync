
"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, MapPin, Users, Briefcase, Zap, SlidersHorizontal, Loader2, UserPlus, MapIcon, Sparkles } from 'lucide-react'; // Added UserPlus, MapIcon, Sparkles
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Job, Technician, JobStatus, JobPriority, AITechnician } from '@/types';
import AddEditJobDialog from './components/AddEditJobDialog';
import OptimizeRouteDialog from './components/optimize-route-dialog'; 
import JobListItem from './components/JobListItem';
import TechnicianCard from './components/technician-card';
import MapView from './components/map-view';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Label } from '@/components/ui/label';
import AddEditTechnicianDialog from './components/AddEditTechnicianDialog';
import BatchAssignmentReviewDialog, { type AssignmentSuggestion } from './components/BatchAssignmentReviewDialog';
import { allocateJobAction, AllocateJobActionInput } from "@/actions/fleet-actions";
import { useToast } from '@/hooks/use-toast';


const ALL_STATUSES = "all_statuses";
const ALL_PRIORITIES = "all_priorities";
const UNCOMPLETED_JOBS_FILTER = "uncompleted_jobs";
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [selectedJobForAIAssign, setSelectedJobForAIAssign] = useState<Job | null>(null);
  const [isAIAssignDialogOpen, setIsAIAssignDialogOpen] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<JobStatus | typeof ALL_STATUSES | typeof UNCOMPLETED_JOBS_FILTER>(UNCOMPLETED_JOBS_FILTER);
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | typeof ALL_PRIORITIES>(ALL_PRIORITIES);

  const [isBatchReviewDialogOpen, setIsBatchReviewDialogOpen] = useState(false);
  const [assignmentSuggestionsForReview, setAssignmentSuggestionsForReview] = useState<AssignmentSuggestion[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isLoadingBatchConfirmation, setIsLoadingBatchConfirmation] = useState(false);


  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!db || !user) {
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);

    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const jobsUnsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
    }, (error) => {
      console.error("Error fetching jobs: ", error);
      toast({ title: "Error fetching jobs", description: error.message, variant: "destructive"});
      setIsLoadingData(false);
    });

    const techniciansQuery = query(collection(db, "technicians"), orderBy("name", "asc"));
    const techniciansUnsubscribe = onSnapshot(techniciansQuery, (querySnapshot) => {
      const techniciansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
      setTechnicians(techniciansData);
      setIsLoadingData(false); 
    }, (error) => {
      console.error("Error fetching technicians: ", error);
      toast({ title: "Error fetching technicians", description: error.message, variant: "destructive"});
      setIsLoadingData(false);
    });
    
    return () => {
      jobsUnsubscribe();
      techniciansUnsubscribe();
    };
  }, [user, toast]);

  const handleJobAddedOrUpdated = (updatedJob: Job, assignedTechnicianId?: string | null) => {
    setJobs(prevJobs => {
      const existingJobIndex = prevJobs.findIndex(j => j.id === updatedJob.id);
      if (existingJobIndex > -1) {
        const newJobs = [...prevJobs];
        newJobs[existingJobIndex] = updatedJob;
        return newJobs;
      } else {
        const jobWithTimestamps : Job = {
            ...updatedJob,
            createdAt: updatedJob.createdAt || new Date().toISOString(), 
            updatedAt: updatedJob.updatedAt || new Date().toISOString(), 
        };
        return [jobWithTimestamps, ...prevJobs];
      }
    });
    if (assignedTechnicianId) {
        setTechnicians(prevTechs => prevTechs.map(t => 
            t.id === assignedTechnicianId 
            ? { ...t, isAvailable: false, currentJobId: updatedJob.id } 
            : t
        ));
    }
  };

  const handleTechnicianAddedOrUpdated = (updatedTechnician: Technician) => {
    setTechnicians(prevTechs => {
      const existingTechIndex = prevTechs.findIndex(t => t.id === updatedTechnician.id);
      if (existingTechIndex > -1) {
        const newTechs = [...prevTechs];
        newTechs[existingTechIndex] = updatedTechnician;
        return newTechs;
      } else {
        return [updatedTechnician, ...prevTechs];
      }
    });
  };
  
  const openAIAssignDialogForJob = (job: Job) => {
    setSelectedJobForAIAssign(job);
    setIsAIAssignDialogOpen(true);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      let statusMatch = false;
      if (statusFilter === ALL_STATUSES) {
        statusMatch = true;
      } else if (statusFilter === UNCOMPLETED_JOBS_FILTER) {
        statusMatch = UNCOMPLETED_STATUSES_LIST.includes(job.status);
      } else {
        statusMatch = job.status === statusFilter;
      }
      
      const priorityMatch = priorityFilter === ALL_PRIORITIES || job.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [jobs, statusFilter, priorityFilter]);

  const pendingJobsForBatchAssign = useMemo(() => jobs.filter(job => job.status === 'Pending'), [jobs]);
  const activeJobs = jobs.filter(job => job.status === 'Assigned' || job.status === 'In Progress' || job.status === 'En Route');
  const pendingJobsCount = pendingJobsForBatchAssign.length;
  const busyTechnicians = technicians.filter(t => !t.isAvailable && t.currentJobId);
  
  const defaultMapCenter = technicians.length > 0 && technicians[0].location
    ? { lat: technicians[0].location.latitude, lng: technicians[0].location.longitude }
    : { lat: 39.8283, lng: -98.5795 }; 

  const handleBatchAIAssign = async () => {
    if (pendingJobsForBatchAssign.length === 0 || technicians.length === 0) {
      toast({ title: "Batch Assignment", description: "No pending jobs or no technicians available for assignment.", variant: "default" });
      return;
    }
    setIsBatchLoading(true);
    const suggestions: AssignmentSuggestion[] = [];
    
    let currentTechnicianPool = JSON.parse(JSON.stringify(technicians)) as Technician[];

    for (const job of pendingJobsForBatchAssign) {
      const availableAITechnicians: AITechnician[] = currentTechnicianPool.map(t => ({
        technicianId: t.id,
        technicianName: t.name,
        isAvailable: t.isAvailable, 
        skills: t.skills as string[],
        location: {
          latitude: t.location.latitude,
          longitude: t.location.longitude,
        },
      }));

      const input: AllocateJobActionInput = {
        jobDescription: job.description,
        jobPriority: job.priority,
        technicianAvailability: availableAITechnicians,
      };

      const result = await allocateJobAction(input);
      let techDetails: Technician | null = null;
      if (result.data) {
        techDetails = currentTechnicianPool.find(t => t.id === result.data!.suggestedTechnicianId) || null;
        if (techDetails && techDetails.isAvailable) {
           currentTechnicianPool = currentTechnicianPool.map(t => 
            t.id === techDetails!.id ? {...t, isAvailable: false, currentJobId: job.id } : t
           );
        }
      }
      suggestions.push({
        job,
        suggestion: result.data,
        suggestedTechnicianDetails: techDetails, 
        error: result.error
      });
    }
    setAssignmentSuggestionsForReview(suggestions);
    setIsBatchReviewDialogOpen(true);
    setIsBatchLoading(false);
  };

  const handleConfirmBatchAssignments = async (assignmentsToConfirm: AssignmentSuggestion[]) => {
    if (!db) {
        toast({ title: "Database Error", description: "Firestore instance not available.", variant: "destructive" });
        return;
    }
    setIsLoadingBatchConfirmation(true);
    const batch = writeBatch(db);
    let assignmentsMade = 0;

    const originalTechnicianStates = new Map(technicians.map(t => [t.id, t]));

    for (const { job, suggestion, suggestedTechnicianDetails } of assignmentsToConfirm) {
        const originalTech = originalTechnicianStates.get(suggestedTechnicianDetails!.id);
        if (job && suggestion && suggestedTechnicianDetails && originalTech && originalTech.isAvailable) {
            const jobDocRef = doc(db, "jobs", job.id);
            batch.update(jobDocRef, {
                assignedTechnicianId: suggestion.suggestedTechnicianId,
                status: 'Assigned' as JobStatus,
                updatedAt: serverTimestamp(),
            });

            const techDocRef = doc(db, "technicians", suggestion.suggestedTechnicianId);
            batch.update(techDocRef, {
                isAvailable: false,
                currentJobId: job.id,
            });
            originalTechnicianStates.set(originalTech.id, {...originalTech, isAvailable: false, currentJobId: job.id});
            assignmentsMade++;
        }
    }

    try {
        await batch.commit();
        if (assignmentsMade > 0) {
          toast({ title: "Batch Assignment Success", description: `${assignmentsMade} jobs have been assigned.` });
        } else {
          toast({ title: "No Assignments Made", description: "No valid jobs could be assigned in this batch.", variant: "default" });
        }
    } catch (error: any) {
        console.error("Error committing batch assignments: ", error);
        toast({ title: "Batch Assignment Error", description: error.message || "Could not assign jobs.", variant: "destructive" });
    } finally {
        setIsLoadingBatchConfirmation(false);
        setIsBatchReviewDialogOpen(false);
        setAssignmentSuggestionsForReview([]); 
    }
};


  if (isLoadingData && !googleMapsApiKey) { 
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!googleMapsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center border bg-card rounded-md shadow-lg">
        <MapPin className="h-16 w-16 text-destructive opacity-70 mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Google Maps API Key Missing</h2>
        <p className="text-muted-foreground mb-1">
          The <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is not configured.
        </p>
        <p className="text-muted-foreground">
          Please add it to your <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono">.env</code> file to enable map features.
        </p>
      </div>
    );
  }


  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={['places']}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dispatcher Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <AddEditJobDialog technicians={technicians} onJobAddedOrUpdated={handleJobAddedOrUpdated}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Job
              </Button>
            </AddEditJobDialog>
            <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
              <Button variant="accent" disabled={busyTechnicians.length === 0}>
                <MapIcon className="mr-2 h-4 w-4" /> AI Route Optimizer
              </Button>
            </OptimizeRouteDialog>
          </div>
        </div>

        {selectedJobForAIAssign && (
          <SmartJobAllocationDialog
            isOpen={isAIAssignDialogOpen}
            setIsOpen={setIsAIAssignDialogOpen}
            jobToAssign={selectedJobForAIAssign}
            technicians={technicians}
            onJobAssigned={(assignedJob, updatedTechnician) => {
              setJobs(prevJobs => prevJobs.map(j => j.id === assignedJob.id ? assignedJob : j));
              setTechnicians(prevTechs => prevTechs.map(t => t.id === updatedTechnician.id ? updatedTechnician : t));
              setSelectedJobForAIAssign(null); 
            }}
          >
            <></> 
          </SmartJobAllocationDialog>
        )}

        {isBatchReviewDialogOpen && (
            <BatchAssignmentReviewDialog
                isOpen={isBatchReviewDialogOpen}
                setIsOpen={setIsBatchReviewDialogOpen}
                assignmentSuggestions={assignmentSuggestionsForReview}
                onConfirmAssignments={handleConfirmBatchAssignments}
                isLoadingConfirmation={isLoadingBatchConfirmation}
            />
        )}


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently assigned or in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Technicians</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{technicians.filter(t => t.isAvailable).length} / {technicians.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready for assignments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingJobsCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting assignment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Up Technicians</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">-</div>
               <p className="text-xs text-muted-foreground">AI prediction coming soon</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview Map</TabsTrigger>
            <TabsTrigger value="jobs">Job List</TabsTrigger>
            <TabsTrigger value="technicians">Technicians</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Technician & Job Locations</CardTitle>
                <CardDescription>Real-time overview of ongoing operations.</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView 
                  technicians={technicians} 
                  jobs={jobs} 
                  defaultCenter={defaultMapCenter}
                  defaultZoom={4} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jobs">
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div>
                    <CardTitle className="font-headline">Current Jobs</CardTitle>
                    <CardDescription>Manage and track all ongoing and pending jobs. Use "Assign (AI)" for individual pending jobs or batch assign all.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-auto">
                            <Label htmlFor="status-filter" className="sr-only">Filter by Status</Label>
                            <Select 
                                value={statusFilter} 
                                onValueChange={(value) => setStatusFilter(value as JobStatus | typeof ALL_STATUSES | typeof UNCOMPLETED_JOBS_FILTER)}
                            >
                                <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UNCOMPLETED_JOBS_FILTER}>Uncompleted Jobs</SelectItem>
                                    <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                                    {(['Pending', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Cancelled'] as JobStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <Label htmlFor="priority-filter" className="sr-only">Filter by Priority</Label>
                            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as JobPriority | typeof ALL_PRIORITIES)}>
                                <SelectTrigger id="priority-filter" className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_PRIORITIES}>All Priorities</SelectItem>
                                    {(['High', 'Medium', 'Low'] as JobPriority[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button
                        onClick={handleBatchAIAssign}
                        disabled={pendingJobsForBatchAssign.length === 0 || isBatchLoading || technicians.length === 0}
                        variant="accent"
                        className="w-full sm:w-auto"
                    >
                        {isBatchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        AI Batch Assign ({pendingJobsForBatchAssign.length})
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingData && jobs.length === 0 && technicians.length === 0 ? ( 
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredJobs.length > 0 ? filteredJobs.map(job => (
                  <JobListItem 
                    key={job.id} 
                    job={job} 
                    technicians={technicians} 
                    onAssignWithAI={openAIAssignDialogForJob}
                    onJobUpdated={handleJobAddedOrUpdated}
                  />
                )) : (
                  <p className="text-muted-foreground text-center py-10">
                    {jobs.length === 0 ? "No jobs to display. Add some jobs." : "No jobs match the current filters."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="technicians">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="font-headline">Technician Roster</CardTitle>
                  <CardDescription>View technician status, skills, and current assignments. Click a card to edit.</CardDescription>
                </div>
                <AddEditTechnicianDialog onTechnicianAddedOrUpdated={handleTechnicianAddedOrUpdated}>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Technician
                  </Button>
                </AddEditTechnicianDialog>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoadingData && technicians.length === 0 ? (
                   <div className="col-span-full flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : technicians.map(technician => (
                  <TechnicianCard 
                    key={technician.id} 
                    technician={technician} 
                    jobs={jobs} 
                    onTechnicianUpdated={handleTechnicianAddedOrUpdated} 
                  />
                ))}
                {!isLoadingData && technicians.length === 0 && (
                  <p className="text-muted-foreground col-span-full text-center py-10">No technicians to display. Add some technicians to Firestore.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </APIProvider>
  );
}
    
