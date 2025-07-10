"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Users, Briefcase, Zap, SlidersHorizontal, Loader2, UserPlus, MapIcon, Sparkles, Settings, FileSpreadsheet, UserCheck, AlertTriangle, X, CalendarDays, UserCog, ShieldQuestion, MessageSquare, Share2, Shuffle, ArrowDownUp, Search, Edit, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Job, Technician, JobStatus, JobPriority, ProfileChangeRequest, Location, Customer, SortOrder, AITechnician } from '@/types';
import AddEditJobDialog from './components/AddEditJobDialog';
import JobListItem from './components/JobListItem';
import TechnicianCard from './components/technician-card';
import MapView from './components/map-view';
import ScheduleCalendarView from './components/ScheduleCalendarView';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, writeBatch, getDocs, where, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Label } from '@/components/ui/label';
import AddEditTechnicianDialog from './components/AddEditTechnicianDialog';
import BatchAssignmentReviewDialog, { type AssignmentSuggestion } from './components/BatchAssignmentReviewDialog';
import { handleTechnicianUnavailabilityAction } from "@/actions/fleet-actions";
import { allocateJobAction, checkScheduleHealthAction, type CheckScheduleHealthResult } from "@/actions/ai-actions";
import { updateSubscriptionQuantityAction } from '@/actions/stripe-actions';
import { useToast } from '@/hooks/use-toast';
import ManageSkillsDialog from './components/ManageSkillsDialog';
import ImportJobsDialog from './components/ImportJobsDialog';
import ProfileChangeRequests from './components/ProfileChangeRequests';
import { Badge } from '@/components/ui/badge';
import ScheduleHealthDialog from './components/ScheduleHealthDialog';
import { ScheduleRiskAlert } from './components/ScheduleRiskAlert';
import ChatSheet from './components/ChatSheet';
import ShareTrackingDialog from './components/ShareTrackingDialog';
import { isToday } from 'date-fns';
import AddressAutocompleteInput from './components/AddressAutocompleteInput';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSkillsAction } from '@/actions/skill-actions';
import { mockJobs, mockTechnicians, mockProfileChangeRequests } from '@/lib/mock-data';
import { PREDEFINED_SKILLS } from '@/lib/skills';


const ALL_STATUSES = "all_statuses";
const ALL_PRIORITIES = "all_priorities";
const UNCOMPLETED_JOBS_FILTER = "uncompleted_jobs";
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress', 'Draft'];

export default function DashboardPage() {
  const { user, userProfile, company, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const prevJobIdsRef = useRef(new Set());

  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<JobStatus | typeof ALL_STATUSES | typeof UNCOMPLETED_JOBS_FILTER>(UNCOMPLETED_JOBS_FILTER);
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | typeof ALL_PRIORITIES>(ALL_PRIORITIES);
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority');

  const [isBatchReviewDialogOpen, setIsBatchReviewDialogOpen] = useState(false);
  const [assignmentSuggestionsForReview, setAssignmentSuggestionsForReview] = useState<AssignmentSuggestion[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isLoadingBatchConfirmation, setIsLoadingBatchConfirmation] = useState(false);
  
  const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);

  const [isImportJobsOpen, setIsImportJobsOpen] = useState(false);

  const [isHandlingUnavailability, setIsHandlingUnavailability] = useState(false);

  const [proactiveSuggestion, setProactiveSuggestion] = useState<AssignmentSuggestion | null>(null);
  const [isFetchingProactiveSuggestion, setIsFetchingProactiveSuggestion] = useState(false);
  const [isProcessingProactive, setIsProcessingProactive] = useState(false);

  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthResults, setHealthResults] = useState<CheckScheduleHealthResult[]>([]);
  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState<CheckScheduleHealthResult[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatJob, setSelectedChatJob] = useState<Job | null>(null);
  
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [selectedJobForTracking, setSelectedJobForTracking] = useState<Job | null>(null);

  const [searchedLocation, setSearchedLocation] = useState<Location | null>(null);
  const [searchAddressText, setSearchAddressText] = useState('');
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');

  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);

  const [isAddEditTechnicianDialogOpen, setIsAddEditTechnicianDialogOpen] = useState(false);
  const [selectedTechnicianForEdit, setSelectedTechnicianForEdit] = useState<Technician | null>(null);

  const jobFilterId = searchParams.get('jobFilter');
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
  const [activeTab, setActiveTab] = useState('jobs');
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (jobFilterId) {
        setActiveTab('jobs');
    }
  }, [jobFilterId]);
  
  const handleOpenAddJob = () => {
    setIsAddJobDialogOpen(true);
  };
  
  const handleOpenEditTechnician = (technician: Technician) => {
    setSelectedTechnicianForEdit(technician);
    setIsAddEditTechnicianDialogOpen(true);
  };
  const handleCloseAddEditTechnicianDialog = () => {
    setIsAddEditTechnicianDialogOpen(false);
    setSelectedTechnicianForEdit(null);
  };

  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    jobs.forEach(job => {
        const key = (job.customerEmail || job.customerPhone || job.customerName).toLowerCase().trim();
        if (!key || !job.customerName) return; 
        
        if (!customerMap.has(key)) {
            customerMap.set(key, {
                id: key,
                name: job.customerName,
                email: job.customerEmail || '',
                phone: job.customerPhone || '',
                address: job.location.address || '',
            });
        }
    });
    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs]);


  const fetchSkills = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        setAllSkills(PREDEFINED_SKILLS);
        return;
    }
    if (!userProfile?.companyId || !appId) return;
    const result = await getSkillsAction({ companyId: userProfile.companyId, appId });
    if (result.data) {
        setAllSkills(result.data?.map(s => s.name) || []);
    } else {
        console.error("Could not fetch skills library:", result.error);
    }
}, [userProfile, appId]);
  
  const fetchAllData = useCallback(() => {
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log("Using mock data for dashboard.");
        setJobs(mockJobs);
        setTechnicians(mockTechnicians);
        setProfileChangeRequests(mockProfileChangeRequests.filter(r => r.status === 'pending'));
        fetchSkills();
        setIsLoadingData(false);
        return;
    }

    if (!db || !userProfile?.companyId) {
      if (userProfile && userProfile.onboardingStatus === 'completed') {
          setIsLoadingData(false);
      }
      return;
    }
    
    if (!appId) {
        console.error("Firebase Project ID not found in environment variables.");
        setIsLoadingData(false);
        return;
    }
    
    setIsLoadingData(true);
    let activeListeners = 0;
    const requiredListeners = 3;
    const companyId = userProfile.companyId;

    const onListenerLoaded = () => {
        activeListeners++;
        if (activeListeners === requiredListeners) {
            setIsLoadingData(false);
        }
    }

    fetchSkills();

    const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId));
    const jobsUnsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
            }
        }
        return { id: doc.id, ...data } as Job;
      });
      jobsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobs(jobsData);
      onListenerLoaded();
    }, (error) => {
      console.error("Error fetching jobs: ", error);
      onListenerLoaded();
    });

    const techniciansQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", companyId));
    const techniciansUnsubscribe = onSnapshot(techniciansQuery, (querySnapshot) => {
      const techniciansData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
            }
        }
        return { id: doc.id, ...data } as Technician;
      });
      techniciansData.sort((a, b) => a.name.localeCompare(b.name));
      setTechnicians(techniciansData);
      onListenerLoaded();
    }, (error) => {
      console.error("Error fetching technicians: ", error);
      onListenerLoaded();
    });
    
    const requestsQuery = query(collection(db, `artifacts/${appId}/public/data/profileChangeRequests`), where("companyId", "==", companyId));
    const requestsUnsubscribe = onSnapshot(requestsQuery, (querySnapshot) => {
        const requestsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
             for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as ProfileChangeRequest
        });
        const pendingRequests = requestsData.filter(r => r.status === 'pending');
        pendingRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProfileChangeRequests(pendingRequests);
        onListenerLoaded();
    }, (error) => {
        console.error("Error fetching profile change requests: ", error);
        onListenerLoaded();
    });
    
    return () => {
      jobsUnsubscribe();
      techniciansUnsubscribe();
      requestsUnsubscribe();
    };
  }, [authLoading, userProfile, fetchSkills, appId]);

  const prevTechCount = useRef<number | null>(null);

  useEffect(() => {
    if (isLoadingData || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      prevTechCount.current = technicians.length;
      return;
    }
  
    if (company?.subscriptionStatus !== 'active' || !company.id) {
      return;
    }
    
    if (technicians.length !== prevTechCount.current && prevTechCount.current !== null) {
      console.log(`Technician count changed from ${prevTechCount.current} to ${technicians.length}. Updating Stripe.`);
      updateSubscriptionQuantityAction({ companyId: company.id, quantity: technicians.length })
        .then(result => {
          if (result.error) {
            toast({ title: "Stripe Sync Error", description: `Could not update subscription: ${result.error}`, variant: "destructive" });
          } else {
            toast({ title: "Subscription Updated", description: `Seat count is now ${technicians.length}.` });
          }
        });
    }
      
    prevTechCount.current = technicians.length;
    
  }, [technicians, company, isLoadingData, toast]);
  
  useEffect(() => {
    if (isLoadingData || technicians.length === 0 || !userProfile?.companyId) {
      return;
    }

    const prevJobIdsRefCurrent = prevJobIdsRef.current;
    const currentJobIds = new Set(jobs.map(j => j.id));
    const newJobs = jobs.filter(j => !prevJobIdsRefCurrent.has(j.id) && j.companyId === userProfile.companyId);
    prevJobIdsRef.current = currentJobIds;
    
    if (newJobs.length === 0) {
      return;
    }

    const highPriorityPendingJob = newJobs.find(
      j => j.priority === 'High' && j.status === 'Pending'
    );
    
    if (highPriorityPendingJob && !proactiveSuggestion && !isFetchingProactiveSuggestion) {
      fetchProactiveSuggestion(highPriorityPendingJob);
    }
  }, [jobs, isLoadingData, technicians, proactiveSuggestion, isFetchingProactiveSuggestion, userProfile]);

  const fetchProactiveSuggestion = useCallback(async (job: Job) => {
    setIsFetchingProactiveSuggestion(true);

    const aiTechnicians: AITechnician[] = technicians.map(t => ({
      technicianId: t.id,
      technicianName: t.name,
      isAvailable: t.isAvailable,
      skills: t.skills || [],
      location: {
        latitude: t.location.latitude,
        longitude: t.location.longitude,
      },
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
      const techDetails = result.data.suggestedTechnicianId 
        ? technicians.find(t => t.id === result.data.suggestedTechnicianId) 
        : null;
      setProactiveSuggestion({
        job: job,
        suggestion: result.data,
        suggestedTechnicianDetails: techDetails,
        error: !result.data.suggestedTechnicianId ? result.data.reasoning : null,
      });
    } else {
        setProactiveSuggestion({
            job: job,
            suggestion: null,
            suggestedTechnicianDetails: null,
            error: result.error || "An unknown error occurred while trying to find a suggestion.",
        });
    }
    
    setIsFetchingProactiveSuggestion(false);
  }, [technicians, jobs]);
  
  useEffect(() => {
    if (isLoadingData || technicians.length === 0 || jobs.length === 0) {
      return;
    }
    
    const checkHealth = async () => {
      const result = await checkScheduleHealthAction({ technicians, jobs });
      if (result.data) {
        const highRiskAlerts = result.data.filter(r => r.risk && r.risk.predictedDelayMinutes > 15);
        
        setRiskAlerts(currentAlerts => {
          const currentAlertIds = new Set(currentAlerts.map(a => a.technician.id));
          const newAlertsToAdd = highRiskAlerts.filter(newAlert => !currentAlertIds.has(newAlert.technician.id));
          
          const stillValidAlerts = currentAlerts.filter(oldAlert => highRiskAlerts.some(newAlert => newAlert.technician.id === oldAlert.technician.id));

          if (newAlertsToAdd.length > 0 || stillValidAlerts.length !== currentAlerts.length) {
            return [...stillValidAlerts, ...newAlertsToAdd];
          }
          return currentAlerts;
        });
      }
    };
    
    const timer = setTimeout(checkHealth, 2000); 
    const intervalId = setInterval(checkHealth, 600000);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [jobs, technicians, isLoadingData]);
  
  const handleProactiveAssign = async (suggestion: AssignmentSuggestion) => {
    if (!suggestion.job || !suggestion.suggestedTechnicianDetails || !suggestion.suggestion || !db || !userProfile?.companyId || !appId) return;
    
    setIsProcessingProactive(true);
    
    const { job, suggestedTechnicianDetails } = suggestion;
    const isInterruption = !suggestedTechnicianDetails.isAvailable && suggestedTechnicianDetails.currentJobId;

    const batch = writeBatch(db);
    
    const newJobRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
    batch.update(newJobRef, { 
        status: 'Assigned', 
        assignedTechnicianId: suggestedTechnicianDetails.id,
        updatedAt: serverTimestamp(),
        assignedAt: serverTimestamp(),
    });

    const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, suggestedTechnicianDetails.id);
    batch.update(techDocRef, {
        isAvailable: false,
        currentJobId: job.id,
    });
    
    if (isInterruption) {
        const oldJobRef = doc(db, `artifacts/${appId}/public/data/jobs`, suggestedTechnicianDetails.currentJobId!);
        batch.update(oldJobRef, {
            status: 'Pending',
            assignedTechnicianId: null,
            notes: arrayUnion(`(Auto-Reassigned: Technician interrupted for high-priority job ${job.title})`),
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
  
  const handleOpenChat = (job: Job) => {
    setSelectedChatJob(job);
    setIsChatOpen(true);
  };
  
  const handleShareTracking = (job: Job) => {
    setSelectedJobForTracking(job);
    setIsTrackingDialogOpen(true);
  };

  const filteredJobs = useMemo(() => {
    if (jobFilterId) {
        return jobs.filter(job => job.id === jobFilterId);
    }
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
  }, [jobs, statusFilter, priorityFilter, jobFilterId]);

  const sortedJobs = useMemo(() => {
    const technicianMap = new Map(technicians.map(t => [t.id, t.name]));
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 } as Record<JobPriority, number>;
    const statusOrder = { 'Draft': 0, 'Pending': 1, 'Assigned': 2, 'En Route': 3, 'In Progress': 4, 'Completed': 5, 'Cancelled': 6 } as Record<JobStatus, number>;

    return [...filteredJobs].sort((a, b) => {
        switch (sortOrder) {
            case 'priority':
                const assignmentA = a.assignedTechnicianId ? 1 : 0;
                const assignmentB = b.assignedTechnicianId ? 1 : 0;
                if (assignmentA !== assignmentB) return assignmentA - assignmentB;

                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'status':
                return statusOrder[a.status] - statusOrder[b.status] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'technician':
                const techA = a.assignedTechnicianId ? technicianMap.get(a.assignedTechnicianId) || 'Zz' : 'Zz'; // Unassigned at end
                const techB = b.assignedTechnicianId ? technicianMap.get(b.assignedTechnicianId) || 'Zz' : 'Zz';
                return techA.localeCompare(techB) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'customer':
                return a.customerName.localeCompare(b.customerName) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'scheduledTime':
                const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : Infinity;
                const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : Infinity;
                return timeA - timeB || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            default:
                return new Date(b.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
    });
  }, [filteredJobs, sortOrder, technicians]);

  const filteredTechnicians = useMemo(() => {
    if (!technicianSearchTerm) {
      return technicians;
    }
    const lowercasedTerm = technicianSearchTerm.toLowerCase();
    return technicians.filter(tech => {
      const isAvailableMatch = lowercasedTerm === 'available' && tech.isAvailable;
      const isUnavailableMatch = (lowercasedTerm === 'unavailable' || lowercasedTerm === 'busy') && !tech.isAvailable;
      const nameMatch = tech.name.toLowerCase().includes(lowercasedTerm);
      const skillMatch = tech.skills?.some(skill => skill.toLowerCase().includes(lowercasedTerm));
      return isAvailableMatch || isUnavailableMatch || nameMatch || skillMatch;
    });
  }, [technicians, technicianSearchTerm]);

  const pendingJobsForBatchAssign = useMemo(() => jobs.filter(job => job.status === 'Pending'), [jobs]);
  const unassignedJobsCount = pendingJobsForBatchAssign.length;
  const busyTechnicians = technicians.filter(t => !t.isAvailable && t.currentJobId);
  
  const defaultMapCenter = technicians.length > 0 && technicians[0].location
    ? { lat: technicians[0].location.latitude, lng: technicians[0].location.longitude }
    : { lat: 39.8283, lng: -98.5795 }; 

  const handleBatchAIAssign = useCallback(async () => {
    if (!appId) return;
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
            skills: t.skills || [],
            location: {
              latitude: t.location.latitude,
              longitude: t.location.longitude,
            },
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
  }, [jobs, technicians, toast, appId]);

  const handleConfirmBatchAssignments = async (assignmentsToConfirm: AssignmentSuggestion[]) => {
    if (!db || !userProfile?.companyId || !appId) {
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
            const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
            batch.update(jobDocRef, {
                assignedTechnicianId: suggestion.suggestedTechnicianId,
                status: 'Assigned' as JobStatus,
                updatedAt: serverTimestamp(),
                assignedAt: serverTimestamp(),
            });

            const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, suggestion.suggestedTechnicianId!);
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
  
  const handleMarkTechnicianUnavailable = async (technicianId: string, reason?: string, unavailableFrom?: string, unavailableUntil?: string) => {
    if (!userProfile?.companyId || !appId) return;

    setIsHandlingUnavailability(true);
    const result = await handleTechnicianUnavailabilityAction({ 
        companyId: userProfile.companyId, 
        technicianId, 
        reason, 
        unavailableFrom, 
        unavailableUntil, 
        appId 
    });

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
    } else if (result.data) {
        setHealthResults(result.data);
        setIsHealthDialogOpen(true);
    }
    setIsCheckingHealth(false);
  };

  const handleDismissRiskAlert = (technicianId: string) => {
    setRiskAlerts(prev => prev.filter(alert => alert.technician.id !== technicianId));
  };
  
  const highPriorityPendingCount = useMemo(() => 
    jobs.filter(j => j.status === 'Pending' && j.priority === 'High').length, 
    [jobs]
  );
  
  const jobsTodayCount = useMemo(() => 
    jobs.filter(j => j.scheduledTime && isToday(new Date(j.scheduledTime))).length,
    [jobs]
  );
  
  const handleLocationSearch = (location: { address: string; lat: number; lng: number }) => {
    setSearchAddressText(location.address);
    setSearchedLocation({
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
    });
  };

  if (authLoading || isLoadingData) { 
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-6">
       <AddEditJobDialog
            isOpen={isAddJobDialogOpen}
            onClose={() => setIsAddJobDialogOpen(false)}
            job={null}
            technicians={technicians}
            allSkills={allSkills}
            customers={customers}
            jobs={jobs}
            onManageSkills={() => setIsManageSkillsOpen(true)}
        />
        {isAdmin && (
            <AddEditTechnicianDialog
                isOpen={isAddEditTechnicianDialogOpen}
                onClose={handleCloseAddEditTechnicianDialog}
                technician={selectedTechnicianForEdit}
                allSkills={allSkills}
            />
        )}
      <ShareTrackingDialog 
          isOpen={isTrackingDialogOpen}
          setIsOpen={setIsTrackingDialogOpen}
          job={selectedJobForTracking}
      />
      {appId && <ChatSheet 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
          job={selectedChatJob} 
          technician={technicians.find(t => t.id === selectedChatJob?.assignedTechnicianId) || null}
          appId={appId}
      />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          Dashboard
          {(isHandlingUnavailability || isFetchingProactiveSuggestion) && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        </h1>
        <div className="flex flex-wrap gap-2">
           {isAdmin && (
            <Button variant="ghost" onClick={() => setIsImportJobsOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Jobs
            </Button>
           )}
           <Button onClick={handleOpenAddJob}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Job
            </Button>
        </div>
      </div>

      {riskAlerts.length > 0 && isAdmin && (
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
      
      {appId && (
        <ImportJobsDialog
            isOpen={isImportJobsOpen}
            setIsOpen={setIsImportJobsOpen}
            onJobsImported={fetchAllData}
        />
      )}
      
      {proactiveSuggestion && proactiveSuggestion.job && isAdmin && (
          <Alert variant={proactiveSuggestion.suggestedTechnicianDetails ? "default" : "destructive"} className={proactiveSuggestion.suggestedTechnicianDetails ? "border-primary/50 bg-primary/5" : ""}>
               {proactiveSuggestion.suggestedTechnicianDetails ? <Sparkles className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle className={cn("font-headline flex justify-between items-center", proactiveSuggestion.suggestedTechnicianDetails ? "text-primary" : "text-destructive")}>
                <span>Proactive AI Suggestion</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProactiveSuggestion(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertTitle>
              <AlertDescription>
                {proactiveSuggestion.suggestedTechnicianDetails ? (
                    <>
                    For new high-priority job "<strong>{proactiveSuggestion.job.title}</strong>", the AI suggests assigning to <strong>{proactiveSuggestion.suggestedTechnicianDetails.name}</strong>.
                    <p className="text-xs text-muted-foreground mt-1">{proactiveSuggestion.suggestion?.reasoning}</p>
                    </>
                ) : (
                    <>
                    Could not find a suggestion for "<strong>{proactiveSuggestion.job.title}</strong>".
                    <p className="text-xs text-muted-foreground mt-1">{proactiveSuggestion.suggestion?.reasoning || proactiveSuggestion.error}</p>
                    </>
                )}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                  {isAdmin && proactiveSuggestion.suggestedTechnicianDetails && (
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
                  )}
                   <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                        if (proactiveSuggestion?.job) {
                            router.push(`/dashboard?jobFilter=${proactiveSuggestion.job.id}`);
                        }
                        setProactiveSuggestion(null);
                    }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      View Job in List
                  </Button>
              </div>
          </Alert>
      )}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">High-Priority Queue</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{highPriorityPendingCount}</div><p className="text-xs text-muted-foreground h-8">Urgent jobs needing assignment</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Jobs</CardTitle><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{unassignedJobsCount}</div><p className="text-xs text-muted-foreground h-8">Total jobs awaiting assignment</p></CardContent></Card>
         <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Available Technicians</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{technicians.filter(t => t.isAvailable).length} / {technicians.length}</div><p className="text-xs text-muted-foreground h-8">Ready for assignments</p></CardContent></Card>
         <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Jobs Scheduled Today</CardTitle><CalendarDays className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{jobsTodayCount}</div><p className="text-xs text-muted-foreground h-8">Total appointments for the day</p></CardContent></Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full overflow-x-auto pb-1">
            <TabsList className={cn("mb-4", isAdmin ? "sm:grid sm:w-full sm:grid-cols-4" : "sm:grid sm:w-full sm:grid-cols-3")}>
                <TabsTrigger value="jobs" className="flex items-center gap-2">
                    Job List
                    <Badge variant="default">{unassignedJobsCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="technicians" className="flex items-center justify-center gap-2">
                    Technicians
                    <Badge variant="default">{profileChangeRequests.length}</Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger value="overview">Overview Map</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="jobs">
          <Card>
              <CardHeader className="flex flex-col gap-4">
                  <div>
                      <CardTitle className="font-headline">Current Jobs</CardTitle>
                      <CardDescription>{isAdmin ? "Manage and track all ongoing and pending jobs." : "View and manage all jobs."}</CardDescription>
                  </div>
                  {jobFilterId && (
                    <Alert variant="default" className="flex items-center justify-between">
                        <div>
                            <AlertTitle className="font-semibold">Filtered View</AlertTitle>
                            <AlertDescription>Showing a single job. Clear the filter to see all jobs.</AlertDescription>
                        </div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                            <X className="mr-2 h-4 w-4" /> Clear Filter
                        </Button>
                    </Alert>
                  )}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                          <div className="w-full sm:w-[160px]">
                              <Label htmlFor="status-filter" className="sr-only">Filter by Status</Label>
                              <Select 
                                  value={statusFilter} 
                                  onValueChange={(value) => setStatusFilter(value as JobStatus | typeof ALL_STATUSES | typeof UNCOMPLETED_JOBS_FILTER)}
                                  disabled={!!jobFilterId}
                              >
                                  <SelectTrigger id="status-filter">
                                      <SelectValue placeholder="Filter by Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value={UNCOMPLETED_JOBS_FILTER}>Uncompleted Jobs</SelectItem>
                                      <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                                      {(['Draft', 'Pending', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Cancelled'] as JobStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="w-full sm:w-[160px]">
                              <Label htmlFor="priority-filter" className="sr-only">Filter by Priority</Label>
                              <Select 
                                value={priorityFilter} 
                                onValueChange={(value) => setPriorityFilter(value as JobPriority | typeof ALL_PRIORITIES)}
                                disabled={!!jobFilterId}
                               >
                                  <SelectTrigger id="priority-filter">
                                      <SelectValue placeholder="Filter by Priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value={ALL_PRIORITIES}>All Priorities</SelectItem>
                                      {(['High', 'Medium', 'Low'] as JobPriority[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                           <div className="w-full sm:w-[160px]">
                              <Label htmlFor="sort-order" className="sr-only">Sort by</Label>
                              <Select 
                                value={sortOrder} 
                                onValueChange={(value) => setSortOrder(value as SortOrder)}
                                disabled={!!jobFilterId}
                              >
                                  <SelectTrigger id="sort-order">
                                      <ArrowDownUp className="mr-2 h-4 w-4 shrink-0" />
                                      <SelectValue placeholder="Sort by..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="status">Status</SelectItem>
                                      <SelectItem value="priority">Priority</SelectItem>
                                      <SelectItem value="scheduledTime">Scheduled Time</SelectItem>
                                      <SelectItem value="technician">Technician</SelectItem>
                                      <SelectItem value="customer">Customer Name</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                      {isAdmin && (
                        <Button
                            onClick={handleBatchAIAssign}
                            disabled={unassignedJobsCount === 0 || isBatchLoading || technicians.length === 0 || !!jobFilterId}
                            variant="accent"
                            className="w-full sm:w-auto"
                        >
                            {isBatchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            AI Batch Assign
                        </Button>
                      )}
                  </div>
              </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingData && jobs.length === 0 ? ( 
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedJobs.length > 0 ? sortedJobs.map(job => (
                <JobListItem 
                  key={job.id} 
                  job={job}
                  onOpenChat={handleOpenChat}
                  onShareTracking={handleShareTracking}
                />
              )) : (
                 <Alert className="border-primary/30 bg-primary/5">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">No Jobs Found</AlertTitle>
                    <AlertDescription>
                        {jobs.length === 0 ? "You haven't created any jobs yet." : "No jobs match your current filters."}
                    </AlertDescription>
                    {jobs.length === 0 && (
                        <div className="mt-4">
                            <Button onClick={handleOpenAddJob}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Job
                            </Button>
                        </div>
                    )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule" className="w-full overflow-x-auto">
          <ScheduleCalendarView
              jobs={jobs}
              technicians={technicians}
              onCheckScheduleHealth={handleCheckScheduleHealth}
              isCheckingHealth={isCheckingHealth}
              busyTechniciansCount={busyTechnicians.length}
          />
        </TabsContent>
        {isAdmin && (
            <TabsContent value="technicians">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <CardTitle className="font-headline">Technician Roster</CardTitle>
                      <CardDescription>View technician status, skills, and current assignments.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => setIsManageSkillsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> Manage Skills
                      </Button>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Label htmlFor="technician-search" className="sr-only">Search Technicians</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="technician-search"
                        placeholder="Search by name, skill, or 'available'..."
                        className="pl-8"
                        value={technicianSearchTerm}
                        onChange={e => setTechnicianSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProfileChangeRequests requests={profileChangeRequests} onAction={fetchAllData} />
                  {technicians.length === 0 ? (
                    <Alert className="border-primary/30 bg-primary/5">
                      <UserPlus className="h-4 w-4 text-primary" />
                      <AlertTitle className="font-semibold text-primary">No Technicians Added</AlertTitle>
                      <AlertDescription>
                        The technician roster is empty. New technicians can be added from the User Management section in your settings.
                      </AlertDescription>
                      <div className="mt-4">
                          <Link href="/settings?tab=users">
                              <Button variant="default">
                                  <Users className="mr-2 h-4 w-4" /> Go to User Management
                              </Button>
                          </Link>
                      </div>
                   </Alert>
                  ) : filteredTechnicians.length === 0 ? (
                    <Alert>
                        <UserX className="h-4 w-4" />
                        <AlertTitle>No Technicians Found</AlertTitle>
                        <AlertDescription>No technicians match your search criteria.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredTechnicians.map(technician => (
                        <TechnicianCard 
                            key={technician.id} 
                            technician={technician} 
                            jobs={jobs} 
                            onEdit={handleOpenEditTechnician}
                            onMarkUnavailable={handleMarkTechnicianUnavailable}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
        )}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
                  <CardTitle className="font-headline">Technician &amp; Job Locations</CardTitle>
                  <CardDescription>Real-time overview of ongoing operations. Use the search below to find a specific address on the map.</CardDescription>
                   <div className="pt-2">
                      <AddressAutocompleteInput
                          value={searchAddressText}
                          onValueChange={setSearchAddressText}
                          onLocationSelect={handleLocationSearch}
                          placeholder="Search for an address to view on map..."
                      />
                  </div>
            </CardHeader>
            <CardContent>
              <MapView 
                technicians={technicians} 
                jobs={jobs} 
                defaultCenter={defaultMapCenter}
                defaultZoom={4}
                searchedLocation={searchedLocation}
                onJobClick={(job) => router.push(`/job/${job.id}`)}
                onTechnicianClick={handleOpenEditTechnician}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}

