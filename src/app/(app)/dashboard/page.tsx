
"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Users, Briefcase, Zap, SlidersHorizontal, Loader2, UserPlus, MapIcon, Sparkles, Settings, FileSpreadsheet, UserCheck, AlertTriangle, X, CalendarDays, UserCog, ShieldQuestion, MessageSquare, Share2, Shuffle, ArrowDownUp, Search, Edit, UserX, Star, HelpCircle, RefreshCw } from 'lucide-react';
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
import { handleTechnicianUnavailabilityAction } from '@/actions/fleet-actions';
import { allocateJobAction, checkScheduleHealthAction, notifyCustomerAction, type CheckScheduleHealthResult } from "@/actions/ai-actions";
import { updateSubscriptionQuantityAction, seedSampleDataAction } from '@/actions/onboarding-actions';
import { useToast } from '@/hooks/use-toast';
import ManageSkillsDialog from './components/ManageSkillsDialog';
import ImportJobsDialog from './components/ImportJobsDialog';
import ProfileChangeRequests from './components/ProfileChangeRequests';
import { Badge } from '@/components/ui/badge';
import ScheduleHealthDialog from './components/ScheduleHealthDialog';
import { ScheduleRiskAlert } from './components/ScheduleRiskAlert';
import ChatSheet from './components/ChatSheet';
import { isToday } from 'date-fns';
import AddressAutocompleteInput from './components/AddressAutocompleteInput';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSkillsAction } from '@/actions/skill-actions';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { serverTimestamp } from 'firebase/firestore'; 
import { Copy } from 'lucide-react';
import OptimizeRouteDialog from './components/optimize-route-dialog';
import { useTranslation } from '@/hooks/use-language';
import GettingStartedChecklist from './components/GettingStartedChecklist';
import HelpAssistant from './components/HelpAssistant';

const ALL_STATUSES = "all_statuses";
const ALL_PRIORITIES = "all_priorities";
const UNCOMPLETED_JOBS_FILTER = "uncompleted_jobs";
const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress', 'Draft'];

const ToastWithCopy = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => {
  const { toast } = useToast();
  return (
    <div className="w-full space-y-3">
      <p className="text-sm">{message}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            navigator.clipboard.writeText(message);
            toast({ title: "Copied to clipboard!", duration: 2000 });
          }}
        >
          <Copy className="mr-2 h-4 w-4" /> Copy Text
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Close
        </Button>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const { user, userProfile, company, loading: authLoading } = useAuth();
  const { t } = useTranslation();
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

  const [healthResults, setHealthResults] = useState<CheckScheduleHealthResult[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<CheckScheduleHealthResult[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatJob, setSelectedChatJob] = useState<Job | null>(null);
  
  const [searchedLocation, setSearchedLocation] = useState<Location | null>(null);
  const [searchAddressText, setSearchAddressText] = useState('');
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');

  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);

  const [isAddEditTechnicianDialogOpen, setIsAddEditTechnicianDialogOpen] = useState(false);
  const [selectedTechnicianForEdit, setSelectedTechnicianForEdit] = useState<Technician | null>(null);

  const [isOptimizeRouteOpen, setIsOptimizeRouteOpen] = useState(false);
  const [technicianToOptimize, setTechnicianToOptimize] = useState<string | undefined>(undefined);
  
  const [showGettingStarted, setShowGettingStarted] = useState(false);

  const jobFilterId = searchParams.get('jobFilter');
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
  const [activeTab, setActiveTab] = useState('job-list');
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  const fetchSkills = useCallback(async () => {
    if (!userProfile?.companyId || !appId) return;
    const result = await getSkillsAction({ companyId: userProfile.companyId, appId });
    if (result.data) {
        setAllSkills(result.data?.map(s => s.name) || []);
    } else {
        console.error("Could not fetch skills library:", result.error);
    }
  }, [userProfile, appId]);

  useEffect(() => {
    if (authLoading) return;

    if (!db || !userProfile?.companyId || !appId) {
        setIsLoadingData(false);
        return;
    }

    const companyId = userProfile.companyId;
    let collectionsLoaded = 0;
    const totalCollections = 3;

    const checkLoadingComplete = () => {
        collectionsLoaded++;
        if (collectionsLoaded === totalCollections) {
            setIsLoadingData(false);
        }
    };
    
    fetchSkills();

    const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId));
    const techniciansQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", companyId));
    const requestsQuery = query(collection(db, `artifacts/${appId}/public/data/profileChangeRequests`), where("companyId", "==", companyId));

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        const jobsData = snapshot.docs.map(doc => {
            const data = doc.data();
            for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as Job;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(jobsData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) => {
        console.error("Error fetching jobs:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve jobs.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    const unsubscribeTechnicians = onSnapshot(techniciansQuery, (snapshot) => {
        const techniciansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician))
            .sort((a, b) => a.name.localeCompare(b.name));
        setTechnicians(techniciansData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) => {
        console.error("Error fetching technicians:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve technicians.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => {
            const data = doc.data();
             for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as ProfileChangeRequest;
        }).filter(r => r.status === 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProfileChangeRequests(requestsData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) => {
        console.error("Error fetching change requests:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve change requests.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    return () => {
        unsubscribeJobs();
        unsubscribeTechnicians();
        unsubscribeRequests();
    };
}, [authLoading, userProfile, appId, fetchSkills, toast, isLoadingData]);


  const handleSeedData = async () => {
    if (!userProfile?.companyId || !appId) return;
    setIsLoadingData(true);
    const result = await seedSampleDataAction({ companyId: userProfile.companyId, appId });
    if (result.error) {
      toast({ title: "Error", description: `Could not seed data: ${result.error}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Sample data has been added." });
    }
    // Data will refresh via onSnapshot, just set loading to false.
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (jobFilterId) {
        setActiveTab('job-list');
    }
  }, [jobFilterId]);
  
  const handleOpenAddJob = () => {
    setSelectedJobForEdit(null);
    setIsAddJobDialogOpen(true);
  };
  
  const handleOpenEditJob = (job: Job) => {
    setSelectedJobForEdit(job);
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
  
  useEffect(() => {
    if (!isLoadingData && company) {
        const isNewCompany = technicians.length === 0 && jobs.length === 0 && !localStorage.getItem('getting_started_dismissed');
        setShowGettingStarted(isNewCompany);
    }
  }, [isLoadingData, company, technicians, jobs]);

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
    
    const input = {
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
  
  // Effect for automatic schedule health checks
  useEffect(() => {
    if (isLoadingData || technicians.length === 0 || jobs.length === 0) {
      return;
    }

    const checkHealth = async () => {
      const result = await checkScheduleHealthAction({ technicians, jobs });
      if (result.error) {
        // Silently fail or show a subtle error, not a toast
        console.warn("Auto schedule health check failed:", result.error);
      } else if (result.data) {
        const highRiskAlerts = result.data.filter(r => r.risk && r.risk.predictedDelayMinutes > 10); // 10 minute buffer
        
        setRiskAlerts(currentAlerts => {
          const currentAlertIds = new Set(currentAlerts.map(a => a.technician.id));
          const newAlertsToAdd = highRiskAlerts.filter(newAlert => !currentAlertIds.has(newAlert.technician.id));
          
          const stillValidAlerts = currentAlerts.filter(oldAlert => 
            highRiskAlerts.some(newAlert => newAlert.technician.id === oldAlert.technician.id)
          );

          if (newAlertsToAdd.length > 0 || stillValidAlerts.length !== currentAlerts.length) {
            return [...stillValidAlerts, ...newAlertsToAdd];
          }
          return currentAlerts;
        });
      }
    };
    
    // Run once on load, then set an interval
    const initialCheckTimer = setTimeout(checkHealth, 2000); // Initial check after 2 seconds
    const intervalId = setInterval(checkHealth, 600000); // 10 minutes

    return () => {
      clearTimeout(initialCheckTimer);
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

  const handleAIAssign = useCallback(async (job: Job) => {
    if (!appId) return;

    if (technicians.length === 0) {
      toast({ title: "Cannot Assign", description: "There are no technicians available.", variant: "default" });
      return;
    }
    
    setIsBatchLoading(true);

    const suggestions = await Promise.all([job].map(async (job) => {
        const aiTechnicians: AITechnician[] = technicians.map((t: Technician) => ({
            technicianId: t.id,
            technicianName: t.name,
            isAvailable: t.isAvailable,
            skills: t.skills || [],
            location: t.location,
            currentJobs: jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status)).map(j => ({ jobId: j.id, scheduledTime: j.scheduledTime, priority: j.priority })),
        }));

        const input = {
            jobDescription: job.description,
            jobPriority: job.priority,
            requiredSkills: job.requiredSkills || [],
            scheduledTime: job.scheduledTime,
            technicianAvailability: aiTechnicians,
        };

        const result = await allocateJobAction(input);
        const techDetails = result.data ? technicians.find((t: Technician) => t.id === result.data!.suggestedTechnicianId) || null : null;
        return { job, suggestion: result.data, suggestedTechnicianDetails: techDetails, error: result.error };
    }));

    setAssignmentSuggestionsForReview(suggestions);
    setIsBatchReviewDialogOpen(true);
    setIsBatchLoading(false);
  }, [jobs, technicians, toast, appId]);

  const handleOpenChat = (job: Job) => {
    setSelectedChatJob(job);
    setIsChatOpen(true);
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
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;

                const assignmentA = a.assignedTechnicianId ? 1 : 0;
                const assignmentB = b.assignedTechnicianId ? 1 : 0;
                if (assignmentA !== assignmentB) return assignmentA - assignmentB;
                
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'status':
                return statusOrder[a.status] - statusOrder[b.status] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'technician':
                const techA = a.assignedTechnicianId ? technicianMap.get(a.assignedTechnicianId) || 'Zz' : 'Zz';
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
    const sorted = [...technicians].sort((a, b) => {
        const aIsOnCall = a.isOnCall ? 0 : 1;
        const bIsOnCall = b.isOnCall ? 0 : 1;
        if (aIsOnCall !== bIsOnCall) {
            return aIsOnCall - bIsOnCall;
        }
        return a.name.localeCompare(b.name);
    });

    if (!technicianSearchTerm) {
      return sorted;
    }
    
    const lowercasedTerm = technicianSearchTerm.toLowerCase();
    return sorted.filter(tech => {
      const isAvailableMatch = lowercasedTerm === 'available' && tech.isAvailable;
      const isUnavailableMatch = (lowercasedTerm === 'unavailable' || lowercasedTerm === 'busy') && !tech.isAvailable;
      const nameMatch = tech.name.toLowerCase().includes(lowercasedTerm);
      const skillMatch = tech.skills?.some(skill => skill.toLowerCase().includes(lowercasedTerm));
      return isAvailableMatch || isUnavailableMatch || nameMatch || skillMatch;
    });
  }, [technicians, technicianSearchTerm]);

  const pendingJobsForBatchAssign = useMemo(() => jobs.filter(job => job.status === 'Pending'), [jobs]);
  const pendingJobsCount = pendingJobsForBatchAssign.length;
  
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

        const input = {
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
        toast({ title: "Assignment Error", description: "Could not assign jobs.", variant: "destructive" });
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
  
  const handleDismissRiskAlert = (technicianId: string) => {
    setRiskAlerts(prev => prev.filter(alert => alert.technician.id !== technicianId));
  };
  
  const highPriorityPendingCount = useMemo(() => 
    jobs.filter(j => j.status === 'Pending' && j.priority === 'High').length, 
    [jobs]
  );
  const unassignedJobsCount = useMemo(() => 
    jobs.filter(j => j.status === 'Pending').length, 
    [jobs]
  );

  const jobsTodayCount = useMemo(() => 
    jobs.filter(j => j.scheduledTime && isToday(new Date(j.scheduledTime))).length,
    [jobs]
  );
  
  const handleLocationSearch = (location: { address: string; lat: number; lng: number }) => {
    setActiveTab('overview-map');
    setSearchedLocation({
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
    });
  };

  const handleDraftNotificationForJob = async (job: Job) => {
    if (!job.assignedTechnicianId) {
        toast({ title: "Cannot Notify", description: "Job is not assigned to a technician.", variant: "destructive" });
        return;
    }
    const tech = technicians.find(t => t.id === job.assignedTechnicianId);
    if (!tech) {
        toast({ title: "Cannot Notify", description: "Assigned technician not found.", variant: "destructive" });
        return;
    }

    const result = await notifyCustomerAction({
      jobId: job.id,
      customerName: job.customerName,
      technicianName: tech.name,
      jobTitle: job.title,
      // You can add logic here to pass delay if known, or let AI be more generic
      reasonForChange: `Regarding your upcoming appointment.`
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data?.message) {
      const { dismiss } = toast({
        title: "AI Message Draft",
        description: <ToastWithCopy message={result.data.message} onDismiss={() => dismiss()} />,
        duration: Infinity,
      });
    }
  };

  const handleOpenOptimizeRoute = (technicianId: string) => {
    setTechnicianToOptimize(technicianId);
    setIsOptimizeRouteOpen(true);
  };
  
  const handleViewOnMap = (location: Location) => {
    setActiveTab('overview-map');
    setSearchedLocation(location);
  };

  if (authLoading || isLoadingData) { 
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {showGettingStarted && technicians.length === 0 && userProfile?.role === 'admin' && (
          <GettingStartedChecklist
            onOpenAddJobDialog={handleOpenAddJob}
            onSeedData={handleSeedData}
            onSwitchToScheduleTab={() => setActiveTab('schedule')}
            onDismiss={() => {
              setShowGettingStarted(false);
              localStorage.setItem('getting_started_dismissed', 'true');
            }}
            isLoading={isLoadingData}
          />
        )}
        <AddEditJobDialog
            isOpen={isAddJobDialogOpen}
            onClose={() => {
              setIsAddJobDialogOpen(false);
              setSelectedJobForEdit(null);
            }}
            job={selectedJobForEdit}
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
      {appId && <ChatSheet 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
          job={selectedChatJob} 
          technician={technicians.find(t => t.id === selectedChatJob?.assignedTechnicianId) || null}
          appId={appId}
      />}
       {riskAlerts.map(alert => (
          <ScheduleRiskAlert 
            key={alert.technician.id} 
            riskAlert={alert}
            onDismiss={handleDismissRiskAlert}
            technicians={technicians}
            jobs={jobs}
          />
        ))}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('dashboard')}
        </h1>
        <div className="flex flex-wrap gap-2">
           {isAdmin && (
            <Button variant="outline" className="hover:bg-secondary" onClick={() => setIsImportJobsOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('import_jobs')}
            </Button>
           )}
           <Button onClick={handleOpenAddJob}>
             <PlusCircle className="mr-2 h-4 w-4" /> {t('add_new_job')}
           </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('high_priority_queue')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="h-[4.5rem]">
            <div className="text-2xl font-bold">{highPriorityPendingCount}</div>
            <p className="text-xs text-muted-foreground">{t('high_priority_desc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pending_jobs')}</CardTitle>
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[4.5rem]">
            <div className="text-2xl font-bold">{unassignedJobsCount}</div>
            <p className="text-xs text-muted-foreground">{t('pending_jobs_desc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('available_technicians')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[4.5rem]">
            <div className="text-2xl font-bold">{technicians.filter(t => t.isAvailable).length} / {technicians.length}</div>
            <p className="text-xs text-muted-foreground">{t('available_technicians_desc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jobs_scheduled_today')}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[4.5rem]">
            <div className="text-2xl font-bold">{jobsTodayCount}</div>
            <p className="text-xs text-muted-foreground">{t('jobs_scheduled_today_desc')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="job-list" className="hover:bg-secondary">
            <div className="flex items-center gap-2">
                {t('job_list')}
                {unassignedJobsCount > 0 && <Badge variant="default" className="h-5">{unassignedJobsCount}</Badge>}
            </div>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="hover:bg-secondary">{t('schedule')}</TabsTrigger>
          <TabsTrigger value="technicians" className="hover:bg-secondary">
            <div className="flex items-center gap-2">
                {t('technicians')}
                {profileChangeRequests.length > 0 && <Badge variant="default" className="h-5">{profileChangeRequests.length}</Badge>}
            </div>
          </TabsTrigger>
          <TabsTrigger value="overview-map" className="hover:bg-secondary">{t('overview_map')}</TabsTrigger>
        </TabsList>

        <TabsContent value="job-list" className="mt-4">
          <Card>
            <CardHeader>
                <CardTitle>{t('current_jobs')}</CardTitle>
                <CardDescription>{t('current_jobs_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="status-filter">{t('status')}</Label>
                  <Select value={statusFilter} onValueChange={(value: JobStatus | typeof ALL_STATUSES | typeof UNCOMPLETED_JOBS_FILTER) => setStatusFilter(value)}>
                    <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNCOMPLETED_JOBS_FILTER}>Uncompleted</SelectItem>
                      <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="En Route">En Route</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="priority-filter">{t('priority')}</Label>
                  <Select value={priorityFilter} onValueChange={(value: JobPriority | typeof ALL_PRIORITIES) => setPriorityFilter(value)}>
                    <SelectTrigger id="priority-filter"><SelectValue placeholder="Filter by Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_PRIORITIES}>All Priorities</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="sort-order">{t('sort_by')}</Label>
                  <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                    <SelectTrigger id="sort-order"><div className="flex items-center gap-1.5"><ArrowDownUp className="h-3 w-3"/> <SelectValue placeholder="Sort Order" /></div></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">{t('sort_by_priority')}</SelectItem>
                      <SelectItem value="status">{t('sort_by_status')}</SelectItem>
                      <SelectItem value="technician">{t('sort_by_technician')}</SelectItem>
                      <SelectItem value="customer">{t('sort_by_customer')}</SelectItem>
                      <SelectItem value="scheduledTime">{t('sort_by_scheduled_time')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="accent" 
                  onClick={handleBatchAIAssign} 
                  disabled={pendingJobsCount === 0 || isBatchLoading}
                  className="w-full sm:w-auto"
                >
                  {isBatchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Fleetie's Batch Assign
                </Button>
              </div>
              <div className="space-y-4">
                {sortedJobs.length > 0 ? (
                  sortedJobs.map(job => (
                    <JobListItem 
                      key={job.id} 
                      job={job} 
                      technicians={technicians}
                      onOpenChat={handleOpenChat}
                      onAIAssign={handleAIAssign}
                      onOpenDetails={handleOpenEditJob}
                      onReOptimize={handleOpenOptimizeRoute}
                      onDraftNotification={handleDraftNotificationForJob}
                      onViewOnMap={handleViewOnMap}
                    />
                  ))
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('no_jobs_found')}</AlertTitle>
                    <AlertDescription>{t('no_jobs_found_desc')}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <ScheduleCalendarView
            jobs={jobs}
            technicians={technicians}
          />
        </TabsContent>

        <TabsContent value="technicians" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Technician Roster</CardTitle>
                    <CardDescription>Manage your team of field technicians.</CardDescription>
                </CardHeader>
                <CardContent>
                    {profileChangeRequests.length > 0 && <ProfileChangeRequests requests={profileChangeRequests} onAction={() => {}} />}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTechnicians.length > 0 ? (
                        filteredTechnicians.map(technician => (
                            <TechnicianCard 
                            key={technician.id} 
                            technician={technician} 
                            jobs={jobs}
                            onEdit={handleOpenEditTechnician}
                            onMarkUnavailable={handleMarkTechnicianUnavailable}
                            onViewOnMap={handleViewOnMap}
                            />
                        ))
                        ) : (
                        <Alert className="md:col-span-2 lg:col-span-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>No Technicians Found</AlertTitle>
                            <AlertDescription>
                            Your technician roster is empty.
                            </AlertDescription>
                        </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
         <TabsContent value="overview-map" className="mt-4">
            <MapView 
                jobs={jobs} 
                technicians={technicians} 
                defaultCenter={defaultMapCenter} 
                defaultZoom={5}
                searchedLocation={searchedLocation}
            />
        </TabsContent>
      </Tabs>

      <ManageSkillsDialog 
        isOpen={isManageSkillsOpen} 
        setIsOpen={setIsManageSkillsOpen} 
        onSkillsUpdated={() => {}}
      />
      <ImportJobsDialog 
        isOpen={isImportJobsOpen} 
        setIsOpen={setIsImportJobsOpen} 
        onJobsImported={() => {}}
      />
      <BatchAssignmentReviewDialog 
        isOpen={isBatchReviewDialogOpen} 
        setIsOpen={setIsBatchReviewDialogOpen} 
        assignmentSuggestions={assignmentSuggestionsForReview} 
        onConfirmAssignments={handleConfirmBatchAssignments}
        isLoadingConfirmation={isLoadingBatchConfirmation}
      />
      <OptimizeRouteDialog 
        isOpen={isOptimizeRouteOpen}
        onOpenChange={setIsOptimizeRouteOpen}
        technicians={technicians} 
        jobs={jobs}
        defaultTechnicianId={technicianToOptimize}
      >
        {/* This is a controlled dialog, so the trigger is handled programmatically */}
        <div />
      </OptimizeRouteDialog>
      <HelpAssistant />
    </div>
  );
}
