
"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { PlusCircle, MapPin, Users, Briefcase, Zap, SlidersHorizontal, Loader2, UserPlus, MapIcon, Sparkles, Settings, FileSpreadsheet, UserCheck, AlertTriangle, X, CalendarDays, UserCog, ShieldQuestion, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Job, Technician, JobStatus, JobPriority, AITechnician, ProfileChangeRequest } from '@/types';
import AddEditJobDialog from './components/AddEditJobDialog';
import OptimizeRouteDialog from './components/optimize-route-dialog'; 
import JobListItem from './components/JobListItem';
import TechnicianCard from './components/technician-card';
import MapView from './components/map-view';
import ScheduleCalendarView from './components/ScheduleCalendarView';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, writeBatch, getDocs, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import { APIProvider as GoogleMapsAPIProvider } from '@vis.gl/react-google-maps'; // Renamed import
import { Label } from '@/components/ui/label';
import AddEditTechnicianDialog from './components/AddEditTechnicianDialog';
import BatchAssignmentReviewDialog, { type AssignmentSuggestion } from './components/BatchAssignmentReviewDialog';
import { allocateJobAction, AllocateJobActionInput, predictNextAvailableTechniciansAction, type PredictNextAvailableTechniciansActionInput, handleTechnicianUnavailabilityAction, checkScheduleHealthAction, type CheckScheduleHealthResult } from "@/actions/fleet-actions";
import type { PredictNextAvailableTechniciansOutput } from '@/types';
import { useToast } from '@/hooks/use-toast';
import ManageSkillsDialog from './components/ManageSkillsDialog';
import ManagePartsDialog from './components/ManagePartsDialog';
import ImportJobsDialog from './components/ImportJobsDialog';
import ProfileChangeRequests from './components/ProfileChangeRequests';
import { Badge } from '@/components/ui/badge';
import ScheduleHealthDialog from './components/ScheduleHealthDialog';
import { ScheduleRiskAlert } from './components/ScheduleRiskAlert';


const ALL_STATUSES = "all_statuses";
const ALL_PRIORITIES = "all_priorities";
const UNCOMPLETED_JOBS_FILTER = "uncompleted_jobs";
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [selectedJobForAIAssign, setSelectedJobForAIAssign] = useState<Job | null>(null);
  const [isAIAssignDialogOpen, setIsAIAssignDialogOpen] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<JobStatus | typeof ALL_STATUSES | typeof UNCOMPLETED_JOBS_FILTER>(UNCOMPLETED_JOBS_FILTER);
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | typeof ALL_PRIORITIES>(ALL_PRIORITIES);

  const [isBatchReviewDialogOpen, setIsBatchReviewDialogOpen] = useState(false);
  const [assignmentSuggestionsForReview, setAssignmentSuggestionsForReview] = useState<AssignmentSuggestion[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isLoadingBatchConfirmation, setIsLoadingBatchConfirmation] = useState(false);
  
  const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);

  const [isManagePartsOpen, setIsManagePartsOpen] = useState(false);
  const [allParts, setAllParts] = useState<string[]>([]);

  const [isImportJobsOpen, setIsImportJobsOpen] = useState(false);

  const [nextUpPredictions, setNextUpPredictions] = useState<PredictNextAvailableTechniciansOutput['predictions']>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isHandlingUnavailability, setIsHandlingUnavailability] = useState(false);

  // For proactive AI suggestions
  const prevJobIdsRef = useRef<Set<string>>(new Set());
  const [proactiveSuggestion, setProactiveSuggestion] = useState<AssignmentSuggestion | null>(null);
  const [isFetchingProactiveSuggestion, setIsFetchingProactiveSuggestion] = useState(false);
  const [isProcessingProactive, setIsProcessingProactive] = useState(false);

  // For Schedule Health Check
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthResults, setHealthResults] = useState<CheckScheduleHealthResult[]>([]);
  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState<CheckScheduleHealthResult[]>([]);


  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const fetchAllData = useCallback(() => {
    // This function can be called to refresh all data, e.g., after an import
    fetchSkills();
    fetchParts();
    // The onSnapshot listeners for jobs/technicians/requests will update automatically
  }, []);

  const fetchSkills = useCallback(async () => {
    if (!db) return;
    try {
      const skillsQuery = query(collection(db, "skills"), orderBy("name"));
      const querySnapshot = await getDocs(skillsQuery);
      const skillsData = querySnapshot.docs.map(doc => doc.data().name as string);
      setAllSkills(skillsData);
    } catch (error) {
      console.error("Error fetching skills: ", error);
      toast({ title: "Error", description: "Could not fetch skills library.", variant: "destructive" });
    }
  }, [toast]);

  const fetchParts = useCallback(async () => {
    if (!db) return;
    try {
      const partsQuery = query(collection(db, "parts"), orderBy("name"));
      const querySnapshot = await getDocs(partsQuery);
      const partsData = querySnapshot.docs.map(doc => doc.data().name as string);
      setAllParts(partsData);
    } catch (error) {
      console.error("Error fetching parts: ", error);
      toast({ title: "Error", description: "Could not fetch parts library.", variant: "destructive" });
    }
  }, [toast]);
  
  // Data fetching
  useEffect(() => {
    if (!db || !user) {
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    let activeListeners = 0;
    const requiredListeners = 3;

    const onListenerLoaded = () => {
        activeListeners++;
        if (activeListeners === requiredListeners) {
            setIsLoadingData(false);
        }
    }

    fetchSkills();
    fetchParts();

    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const jobsUnsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert any Firebase Timestamp fields to ISO strings to make them serializable
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
            }
        }
        return { id: doc.id, ...data } as Job;
      });
      setJobs(jobsData);
      onListenerLoaded();
    }, (error) => {
      console.error("Error fetching jobs: ", error);
      toast({ title: "Error fetching jobs", description: error.message, variant: "destructive"});
      onListenerLoaded();
    });

    const techniciansQuery = query(collection(db, "technicians"), orderBy("name", "asc"));
    const techniciansUnsubscribe = onSnapshot(techniciansQuery, (querySnapshot) => {
      const techniciansData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert any Firebase Timestamp fields to ISO strings to make them serializable
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
            }
        }
        return { id: doc.id, ...data } as Technician;
      });
      setTechnicians(techniciansData);
      onListenerLoaded();
    }, (error) => {
      console.error("Error fetching technicians: ", error);
      toast({ title: "Error fetching technicians", description: error.message, variant: "destructive"});
      onListenerLoaded();
    });
    
    const requestsQuery = query(collection(db, "profileChangeRequests"), where("status", "==", "pending"));
    const requestsUnsubscribe = onSnapshot(requestsQuery, (querySnapshot) => {
        const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileChangeRequest));
        requestsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProfileChangeRequests(requestsData);
        onListenerLoaded();
    }, (error) => {
        console.error("Error fetching profile change requests: ", error);
        toast({ title: "Error fetching requests", description: error.message, variant: "destructive"});
        onListenerLoaded();
    });
    
    return () => {
      jobsUnsubscribe();
      techniciansUnsubscribe();
      requestsUnsubscribe();
    };
  }, [user, toast, fetchSkills, fetchParts]);
  
  // Next Up Technician Prediction
  useEffect(() => {
    const predict = async () => {
        const busyTechnicians = technicians.filter(t => !t.isAvailable && t.currentJobId);
        if (busyTechnicians.length === 0) {
            setNextUpPredictions([]);
            return;
        }

        setIsPredicting(true);
        const activeJobsForPrediction = jobs.filter(j => busyTechnicians.some(t => t.currentJobId === j.id));

        const input: PredictNextAvailableTechniciansActionInput = {
            activeJobs: activeJobsForPrediction.map(job => ({
                jobId: job.id,
                title: job.title,
                assignedTechnicianId: job.assignedTechnicianId!,
                estimatedDurationMinutes: job.estimatedDurationMinutes,
                startedAt: job.status === 'In Progress' ? job.updatedAt : undefined, 
            })),
            busyTechnicians: busyTechnicians.map(tech => ({
                technicianId: tech.id,
                technicianName: tech.name,
                currentLocation: tech.location,
                currentJobId: tech.currentJobId!,
            })),
            currentTime: new Date().toISOString(),
        };

        const result = await predictNextAvailableTechniciansAction(input);
        if (result.data) {
            setNextUpPredictions(result.data.predictions);
        } else if (result.error) {
            console.error("Prediction error:", result.error);
            setNextUpPredictions([]);
        }
        setIsPredicting(false);
    };

    if (!isLoadingData && jobs.length > 0 && technicians.length > 0) {
        predict();
    }

  }, [jobs, technicians, isLoadingData]);
  
  // Proactive High-Priority Job Suggestion
  useEffect(() => {
    if (isLoadingData || technicians.length === 0 || proactiveSuggestion || isFetchingProactiveSuggestion) {
      return;
    }

    const currentJobIds = new Set(jobs.map(j => j.id));
    const newJobs = jobs.filter(j => !prevJobIdsRef.current.has(j.id));
    prevJobIdsRef.current = currentJobIds;
    
    if (newJobs.length === 0) {
      return;
    }

    const highPriorityPendingJob = newJobs.find(
      j => j.priority === 'High' && j.status === 'Pending'
    );
    
    if (highPriorityPendingJob) {
      fetchProactiveSuggestion(highPriorityPendingJob);
    }
  }, [jobs, isLoadingData, technicians, proactiveSuggestion, isFetchingProactiveSuggestion]);

  const fetchProactiveSuggestion = useCallback(async (job: Job) => {
    setIsFetchingProactiveSuggestion(true);

    const aiTechnicians: AITechnician[] = technicians.map(t => ({
      technicianId: t.id,
      technicianName: t.name,
      isAvailable: t.isAvailable,
      skills: t.skills as string[],
      location: t.location,
      currentJobs: jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
        .map(j => ({
          jobId: j.id,
          scheduledTime: j.scheduledTime,
          priority: j.priority,
        }))
    }));
    
    const input: AllocateJobActionInput = {
      jobDescription: job.description,
      jobPriority: job.priority,
      requiredSkills: job.requiredSkills || [],
      scheduledTime: job.scheduledTime,
      technicianAvailability: aiTechnicians,
    };
    
    const result = await allocateJobAction(input);
    
    if (result.data) {
      const techDetails = technicians.find(t => t.id === result.data!.suggestedTechnicianId) || null;
      setProactiveSuggestion({
        job: job,
        suggestion: result.data,
        suggestedTechnicianDetails: techDetails,
        error: null,
      });
    } else {
      toast({ title: "Proactive AI", description: `Could not find a suggestion for ${job.title}. ${result.error || ''}`, variant: "destructive" });
    }
    
    setIsFetchingProactiveSuggestion(false);
  }, [technicians, jobs, toast]);
  
  // Proactive Health Check (Interval-based)
  useEffect(() => {
    const checkHealth = async () => {
      // Avoid running if data is not ready
      if (isLoadingData || technicians.length === 0 || jobs.length === 0) {
        return;
      }
      
      const result = await checkScheduleHealthAction({ technicians, jobs });
      if (result.data) {
        // Filter for high-risk alerts to display proactively
        const highRiskAlerts = result.data.filter(r => r.risk && r.risk.predictedDelayMinutes > 15);
        
        // This logic ensures we don't re-add alerts the user has dismissed
        setRiskAlerts(currentAlerts => {
          const currentAlertIds = new Set(currentAlerts.map(a => a.technician.id));
          const newAlertsToAdd = highRiskAlerts.filter(newAlert => !currentAlertIds.has(newAlert.technician.id));
          
          // Also, remove alerts that are no longer high-risk by find-ing which of the current alerts are NOT in the new high risk list
          const stillValidAlerts = currentAlerts.filter(oldAlert => highRiskAlerts.some(newAlert => newAlert.technician.id === oldAlert.technician.id));

          if (newAlertsToAdd.length > 0 || stillValidAlerts.length !== currentAlerts.length) {
            return [...stillValidAlerts, ...newAlertsToAdd];
          }
          return currentAlerts; // No change
        });
      }
    };
    
    // Run the check immediately on data change (debounced)
    const timer = setTimeout(checkHealth, 2000); 
    
    // And also run it periodically
    const intervalId = setInterval(checkHealth, 600000); // Check every 10 minutes

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [jobs, technicians, isLoadingData]);
  
  const handleProactiveAssign = async (suggestion: AssignmentSuggestion) => {
    if (!suggestion.job || !suggestion.suggestedTechnicianDetails || !suggestion.suggestion || !db) return;
    
    setIsProcessingProactive(true);
    
    const { job, suggestedTechnicianDetails } = suggestion;
    const isInterruption = !suggestedTechnicianDetails.isAvailable && suggestedTechnicianDetails.currentJobId;

    const batch = writeBatch(db);
    
    // 1. Assign the new job
    const newJobRef = doc(db, "jobs", job.id);
    batch.update(newJobRef, { 
        status: 'Assigned', 
        assignedTechnicianId: suggestedTechnicianDetails.id,
        updatedAt: serverTimestamp(),
        assignedAt: serverTimestamp(),
    });

    // 2. Update the technician
    const techDocRef = doc(db, "technicians", suggestedTechnicianDetails.id);
    batch.update(techDocRef, {
        isAvailable: false,
        currentJobId: job.id,
    });
    
    // 3. Handle interruption
    if (isInterruption) {
        const oldJobRef = doc(db, "jobs", suggestedTechnicianDetails.currentJobId!);
        batch.update(oldJobRef, {
            status: 'Pending',
            assignedTechnicianId: null,
            notes: `This job was unassigned due to a higher priority interruption for job: ${job.title}.`,
            updatedAt: serverTimestamp(),
        });
    }

    try {
        await batch.commit();
        toast({ title: "Job Assigned!", description: `${job.title} assigned to ${suggestedTechnicianDetails.name}.` });
        setProactiveSuggestion(null);
    } catch (error: any) {
        console.error("Error processing proactive assignment:", error);
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessingProactive(false);
    }
  };
  

  const handleJobAddedOrUpdated = (updatedJob: Job, assignedTechnicianId?: string | null) => {
    // onSnapshot handles state updates
  };

  const handleTechnicianAddedOrUpdated = (updatedTechnician: Technician) => {
     // onSnapshot handles state updates
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

  const handleBatchAIAssign = useCallback(async () => {
    const currentPendingJobs = jobs.filter(job => job.status === 'Pending');
    if (currentPendingJobs.length === 0 || technicians.length === 0) {
      toast({ title: "Batch Assignment", description: "No pending jobs or no technicians available for assignment.", variant: "default" });
      return;
    }
    setIsBatchLoading(true);
    setAssignmentSuggestionsForReview([]);
    
    let tempTechnicianPool = JSON.parse(JSON.stringify(technicians));

    const suggestions = await Promise.all(currentPendingJobs.map(async (job) => {
        const aiTechnicians: AITechnician[] = tempTechnicianPool.map((t: Technician) => ({
            technicianId: t.id,
            technicianName: t.name,
            isAvailable: t.isAvailable,
            skills: t.skills as string[],
            location: t.location,
            currentJobs: jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status)).map(j => ({ jobId: j.id, scheduledTime: j.scheduledTime, priority: j.priority })),
        }));

        const input: AllocateJobActionInput = {
            jobDescription: job.description,
            jobPriority: job.priority,
            requiredSkills: job.requiredSkills || [],
            scheduledTime: job.scheduledTime,
            technicianAvailability: aiTechnicians,
        };

        const result = await allocateJobAction(input);
        let techDetails: Technician | null = null;
        if (result.data) {
            techDetails = tempTechnicianPool.find((t: Technician) => t.id === result.data!.suggestedTechnicianId) || null;
            if (techDetails && techDetails.isAvailable) {
                tempTechnicianPool = tempTechnicianPool.map((t: Technician) => t.id === techDetails!.id ? { ...t, isAvailable: false, currentJobId: job.id } : t);
            }
        }
        return { job, suggestion: result.data, suggestedTechnicianDetails: techDetails, error: result.error };
    }));

    setAssignmentSuggestionsForReview(suggestions);
    setIsBatchReviewDialogOpen(true);
    setIsBatchLoading(false);
  }, [jobs, technicians, toast]);

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
                assignedAt: serverTimestamp(),
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
  
  const handleMarkTechnicianUnavailable = async (technicianId: string) => {
    setIsHandlingUnavailability(true);
    const result = await handleTechnicianUnavailabilityAction({ technicianId });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setIsHandlingUnavailability(false);
      return;
    }
    
    toast({
      title: "Technician Marked Unavailable",
      description: "Their active jobs are now pending and ready for reassignment.",
    });
    
    setTimeout(() => {
        handleBatchAIAssign();
        setIsHandlingUnavailability(false);
    }, 1500);
  };

  const handleCheckScheduleHealth = async () => {
    setIsCheckingHealth(true);
    setHealthResults([]);
    const result = await checkScheduleHealthAction({ technicians, jobs });
    if (result.error) {
        toast({ title: "Health Check Failed", description: result.error, variant: "destructive" });
    } else if (result.data) {
        setHealthResults(result.data);
        setIsHealthDialogOpen(true);
    }
    setIsCheckingHealth(false);
  };

  const handleDismissRiskAlert = (technicianId: string) => {
    setRiskAlerts(prev => prev.filter(alert => alert.technician.id !== technicianId));
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
    <GoogleMapsAPIProvider apiKey={googleMapsApiKey} libraries={['places']}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            Dispatcher Dashboard
            {(isHandlingUnavailability || isFetchingProactiveSuggestion || isCheckingHealth) && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCheckScheduleHealth} disabled={busyTechnicians.length === 0 || isCheckingHealth}>
                <ShieldQuestion className="mr-2 h-4 w-4" /> Check Schedule Health
            </Button>
            <AddEditJobDialog technicians={technicians} allSkills={allSkills} allParts={allParts} onJobAddedOrUpdated={handleJobAddedOrUpdated} jobs={jobs}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Job
              </Button>
            </AddEditJobDialog>
          </div>
        </div>

        {riskAlerts.length > 0 && (
          <div className="space-y-2">
            {riskAlerts.map(alert => (
              <ScheduleRiskAlert 
                key={alert.technician.id}
                riskAlert={alert}
                onDismiss={handleDismissRiskAlert}
                technicians={technicians}
                jobs={jobs}
              />
            ))}
          </div>
        )}

        <ScheduleHealthDialog 
            isOpen={isHealthDialogOpen}
            setIsOpen={setIsHealthDialogOpen}
            healthResults={healthResults}
        />

        {selectedJobForAIAssign && (
          <SmartJobAllocationDialog
            isOpen={isAIAssignDialogOpen}
            setIsOpen={setIsAIAssignDialogOpen}
            jobToAssign={selectedJobForAIAssign}
            technicians={technicians}
            onJobAssigned={(assignedJob, updatedTechnician) => {
              // onSnapshot handles state updates
              setSelectedJobForAIAssign(null); 
            }}
          />
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
        
        <ManageSkillsDialog 
            isOpen={isManageSkillsOpen}
            setIsOpen={setIsManageSkillsOpen}
            onSkillsUpdated={fetchSkills}
        />
        
        <ManagePartsDialog
            isOpen={isManagePartsOpen}
            setIsOpen={setIsManagePartsOpen}
            onPartsUpdated={fetchParts}
        />

        <ImportJobsDialog
            isOpen={isImportJobsOpen}
            setIsOpen={setIsImportJobsOpen}
            onJobsImported={fetchAllData}
        />
        
        {proactiveSuggestion && proactiveSuggestion.job && proactiveSuggestion.suggestedTechnicianDetails && (
            <Alert variant="default" className="border-primary/50 bg-primary/5">
                 <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="font-headline text-primary flex justify-between items-center">
                  <span>Proactive AI Dispatch Suggestion</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProactiveSuggestion(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </AlertTitle>
                <AlertDescription>
                   For new high-priority job "<strong>{proactiveSuggestion.job.title}</strong>", the AI suggests assigning to <strong>{proactiveSuggestion.suggestedTechnicianDetails.name}</strong>.
                   <p className="text-xs text-muted-foreground mt-1">{proactiveSuggestion.suggestion?.reasoning}</p>
                </AlertDescription>
                <div className="mt-4 flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => handleProactiveAssign(proactiveSuggestion)}
                        disabled={isProcessingProactive}
                        variant={!proactiveSuggestion.suggestedTechnicianDetails.isAvailable ? "destructive" : "default"}
                    >
                        {isProcessingProactive 
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            : !proactiveSuggestion.suggestedTechnicianDetails.isAvailable 
                                ? <AlertTriangle className="mr-2 h-4 w-4" /> 
                                : <UserCheck className="mr-2 h-4 w-4" />}
                        {isProcessingProactive ? 'Assigning...' : !proactiveSuggestion.suggestedTechnicianDetails.isAvailable ? 'Interrupt & Assign' : 'Confirm Assignment'}
                    </Button>
                     <Button size="sm" variant="outline" onClick={() => setProactiveSuggestion(null)}>
                        Dismiss
                    </Button>
                </div>
            </Alert>
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
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isPredicting ? (
                    <div className="flex items-center space-x-2 pt-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <p className="text-xs text-muted-foreground">AI is predicting...</p>
                    </div>
                ) : nextUpPredictions.length > 0 ? (
                    <div className="space-y-2 pt-1">
                        {nextUpPredictions.slice(0, 2).map(p => (
                            <div key={p.technicianId} className="text-sm">
                                <p className="font-bold truncate">{p.technicianName}</p>
                                <p className="text-xs text-muted-foreground">
                                    ~{new Date(p.estimatedAvailabilityTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">No busy technicians to predict.</p>
                    </>
                )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <div className="w-full overflow-x-auto sm:overflow-visible">
              <TabsList className="mb-4 sm:grid sm:w-full sm:grid-cols-4">
                  <TabsTrigger value="overview">Overview Map</TabsTrigger>
                  <TabsTrigger value="jobs">Job List</TabsTrigger>
                  <TabsTrigger value="technicians" className="relative">
                    Technicians
                    {profileChangeRequests.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{profileChangeRequests.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
          </div>
          <TabsContent value="overview">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <CardTitle className="font-headline">Technician &amp; Job Locations</CardTitle>
                    <CardDescription>Real-time overview of ongoing operations.</CardDescription>
                </div>
                 <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setIsImportJobsOpen(true)}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Jobs
                    </Button>
                    <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
                        <Button variant="accent" disabled={busyTechnicians.length === 0}>
                            <MapIcon className="mr-2 h-4 w-4" /> AI Schedule Optimizer
                        </Button>
                    </OptimizeRouteDialog>
                </div>
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
                            AI Batch Assign
                        </Button>
                    </div>
                </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingData && jobs.length === 0 ? ( 
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredJobs.length > 0 ? filteredJobs.map(job => (
                  <JobListItem 
                    key={job.id} 
                    job={job} 
                    jobs={jobs}
                    technicians={technicians} 
                    allSkills={allSkills}
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
                 <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setIsManageSkillsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Manage Skills
                  </Button>
                   <Button variant="outline" onClick={() => setIsManagePartsOpen(true)}>
                    <Package className="mr-2 h-4 w-4" /> Manage Parts
                  </Button>
                  <AddEditTechnicianDialog onTechnicianAddedOrUpdated={handleTechnicianAddedOrUpdated} allSkills={allSkills}>
                    <Button variant="default">
                      <UserPlus className="mr-2 h-4 w-4" /> Add Technician
                    </Button>
                  </AddEditTechnicianDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileChangeRequests requests={profileChangeRequests} onAction={fetchAllData} />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        allSkills={allSkills}
                        onMarkUnavailable={handleMarkTechnicianUnavailable}
                    />
                    ))}
                    {!isLoadingData && technicians.length === 0 && (
                    <p className="text-muted-foreground col-span-full text-center py-10">No technicians to display. Add some technicians to Firestore.</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="schedule">
            <ScheduleCalendarView jobs={jobs} technicians={technicians} onScheduleChange={fetchAllData} />
          </TabsContent>
        </Tabs>
      </div>
    </GoogleMapsAPIProvider>
  );
}
