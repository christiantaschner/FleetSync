

"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Users, Briefcase, Zap, SlidersHorizontal, Loader2, UserPlus, MapIcon, Bot, Settings, FileSpreadsheet, UserCheck, AlertTriangle, X, CalendarDays, UserCog, ShieldQuestion, MessageSquare, Share2, Shuffle, ArrowDownUp, Search, Edit, UserX, Star, HelpCircle, RefreshCw, Wrench, Image as ImageIcon, ListFilter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job, Technician, JobStatus, JobPriority, ProfileChangeRequest, Location, Customer, SortOrder, AITechnician, Skill, Contract, OptimizationSuggestion } from '@/types';
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
import BatchAssignmentReviewDialog, { type AssignmentSuggestion, type FinalAssignment } from './components/BatchAssignmentReviewDialog';
import { handleTechnicianUnavailabilityAction } from '@/actions/fleet-actions';
import { allocateJobAction, checkScheduleHealthAction, notifyCustomerAction, runFleetOptimizationAction, type CheckScheduleHealthResult } from '@/actions/ai-actions';
import { seedSampleDataAction } from '@/actions/onboarding-actions';
import { toggleOnCallStatusAction } from '@/actions/technician-actions';
import { useToast } from '@/hooks/use-toast';
import ManageSkillsDialog from './components/ManageSkillsDialog';
import ImportJobsDialog from './components/ImportJobsDialog';
import ProfileChangeRequests from './components/ProfileChangeRequests';
import { Badge } from '@/components/ui/badge';
import ScheduleHealthDialog from './components/ScheduleHealthDialog';
import { ScheduleRiskAlert } from './components/ScheduleRiskAlert';
import ChatSheet from './components/ChatSheet';
import { isToday, startOfDay, endOfDay } from 'date-fns';
import AddressAutocompleteInput from './components/AddressAutocompleteInput';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSkillsAction } from '@/actions/skill-actions';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { serverTimestamp } from 'firebase/firestore'; 
import { Copy } from 'lucide-react';
import { useTranslation } from '@/hooks/use-language';
import GettingStartedChecklist from './components/GettingStartedChecklist';
import HelpAssistant from './components/HelpAssistant';
import { mockJobs, mockTechnicians, mockProfileChangeRequests, mockCustomers, mockContracts } from '@/lib/mock-data';
import { MultiSelectFilter } from './components/MultiSelectFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AllocateJobActionInput } from '@/types';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import ShareTrackingDialog from './components/ShareTrackingDialog';
import { Switch } from '@/components/ui/switch';
import FleetOptimizationReviewDialog from './components/FleetOptimizationReviewDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const ToastWithCopy = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => {
  const { toast } = useToast();
  return (
    <div className="w-full space-y-3">
      <p className="text-sm">{message}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="accent"
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
  const { user, userProfile, company, loading: authLoading, isMockMode } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const prevJobIdsRef = useRef(new Set());

  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [showOpenTasksOnly, setShowOpenTasksOnly] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('status');
  const [jobSearchTerm, setJobSearchTerm] = useState('');

  const [isBatchReviewDialogOpen, setIsBatchReviewDialogOpen] = useState(false);
  const [assignmentSuggestionsForReview, setAssignmentSuggestionsForReview] = useState<AssignmentSuggestion[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isLoadingBatchConfirmation, setIsLoadingBatchConfirmation] = useState(false);
  
  const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  const [isImportJobsOpen, setIsImportJobsOpen] = useState(false);

  const [isHandlingUnavailability, setIsHandlingUnavailability] = useState(false);

  const [proactiveSuggestion, setProactiveSuggestion] = useState<AssignmentSuggestion | null>(null);
  const [isFetchingProactiveSuggestion, setIsFetchingProactiveSuggestion] = useState(false);
  const [isProcessingProactive, setIsProcessingProactive] = useState(false);
  
  const [isUpdatingOnCall, setIsUpdatingOnCall] = useState(false);

  const [healthResults, setHealthResults] = useState<CheckScheduleHealthResult[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<CheckScheduleHealthResult[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatJob, setSelectedChatJob] = useState<Job | null>(null);
  
  const [searchedLocation, setSearchedLocation] = useState<Location | null>(null);
  const [searchAddressText, setSearchAddressText] = useState('');
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');

  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  
  const [jobForAIAssign, setJobForAIAssign] = useState<Job | null>(null);
  const [isAIAssignDialogOpen, setIsAIAssignDialogOpen] = useState(false);


  const [isAddEditTechnicianDialogOpen, setIsAddEditTechnicianDialogOpen] = useState(false);
  const [selectedTechnicianForEdit, setSelectedTechnicianForEdit] = useState<Technician | null>(null);
  
  const [showGettingStarted, setShowGettingStarted] = useState(false);

  const [isShareTrackingOpen, setIsShareTrackingOpen] = useState(false);
  const [jobToShare, setJobToShare] = useState<Job | null>(null);

  const [isFleetOptimizationDialogOpen, setIsFleetOptimizationDialogOpen] = useState(false);
  const [fleetOptimizationResult, setFleetOptimizationResult] = useState<{ suggestedChanges: OptimizationSuggestion[]; overallReasoning: string } | null>(null);
  const [isFleetOptimizing, setIsFleetOptimizing] = useState(false);
  const [selectedFleetChanges, setSelectedFleetChanges] = useState<OptimizationSuggestion[]>([]);

  const jobFilterId = searchParams.get('jobFilter');
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
  const canEditJobs = isAdmin || userProfile?.role === 'csr';
  const [activeTab, setActiveTab] = useState('job-list');
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Draft'];
  
  const fetchSkills = useCallback(async (companyId: string) => {
    if (isMockMode) {
      setAllSkills(PREDEFINED_SKILLS.map((name, index) => ({ id: `mock_skill_${index}`, name })));
      return;
    }
    if (!appId) return;
    const result = await getSkillsAction({ companyId, appId });
    if (result.data) {
        setAllSkills(result.data || []);
    } else {
        console.error("Could not fetch skills library:", result.error);
    }
  }, [appId, isMockMode]);

  useEffect(() => {
    if (authLoading) return;
    
    if (isMockMode) {
        setJobs(mockJobs);
        setTechnicians(mockTechnicians);
        setContracts(mockContracts);
        setProfileChangeRequests(mockProfileChangeRequests);
        setAllSkills(PREDEFINED_SKILLS.map((name, index) => ({ id: `mock_skill_${index}`, name })));
        setIsLoadingData(false);
        return;
    }

    if (!db || !userProfile?.companyId || !appId) {
        setIsLoadingData(false);
        return;
    }

    const companyId = userProfile.companyId;
    let collectionsLoaded = 0;
    const totalCollections = 4;

    const checkLoadingComplete = () => {
        collectionsLoaded++;
        if (collectionsLoaded === totalCollections) {
            setIsLoadingData(false);
        }
    };
    
    fetchSkills(companyId);

    const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId));
    const techniciansQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", companyId));
    const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", companyId));
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

    const unsubscribeContracts = onSnapshot(contractsQuery, (snapshot) => {
        const contractsData = snapshot.docs.map(doc => {
            const data = doc.data();
             for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as Contract;
        });
        setContracts(contractsData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) => {
        console.error("Error fetching contracts:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve contracts.", variant: "destructive" });
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
        unsubscribeContracts();
        unsubscribeRequests();
    };
}, [authLoading, userProfile, appId, fetchSkills, toast, isLoadingData, isMockMode]);


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

  const customers = useMemo(() => {
    const data = isMockMode ? mockCustomers : []; // Need to derive from jobs if not mock
    
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

    data.forEach(c => {
        const key = (c.email || c.phone || c.name).toLowerCase().trim();
        if(!customerMap.has(key)){
            customerMap.set(key, {id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address});
        }
    })

    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs, isMockMode]);
  
  useEffect(() => {
    if (!isLoadingData && company) {
        const isNewCompany = technicians.length === 0 && jobs.length === 0 && !localStorage.getItem('getting_started_dismissed');
        setShowGettingStarted(isNewCompany);
    }
  }, [isLoadingData, company, technicians, jobs]);

  const prevTechCount = useRef<number | null>(null);
  
  useEffect(() => {
    if (isLoadingData || isMockMode) {
      prevTechCount.current = technicians.length;
      return;
    }
  
    if (company?.subscriptionStatus !== 'active' || !company.id) {
      return;
    }
    
    if (technicians.length !== prevTechCount.current && prevTechCount.current !== null) {
        // This is where auto-sync logic would go, but based on user request, this is disabled.
        // A manual sync or different flow would be needed if the user changes their plan.
    }
      
    prevTechCount.current = technicians.length;
    
  }, [technicians, company, isLoadingData, toast, isMockMode]);
  
  useEffect(() => {
    if (isLoadingData || technicians.length === 0 || !userProfile?.companyId || isMockMode) {
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
      j => j.priority === 'High' && j.status === 'Unassigned'
    );
    
    if (highPriorityPendingJob && !proactiveSuggestion && !isFetchingProactiveSuggestion) {
      fetchProactiveSuggestion(highPriorityPendingJob);
    }
  }, [jobs, isLoadingData, technicians, proactiveSuggestion, isFetchingProactiveSuggestion, userProfile, isMockMode]);

  const fetchProactiveSuggestion = useCallback(async (job: Job) => {
    if (!appId) return;
    setIsFetchingProactiveSuggestion(true);

    const aiTechnicians: AITechnician[] = technicians.map(t => ({
      technicianId: t.id,
      technicianName: t.name,
      isAvailable: t.isAvailable,
      skills: t.skills.map(s => s.name) || [],
      liveLocation: t.location,
      homeBaseLocation: company?.settings?.address ? { address: company.settings.address, latitude: 0, longitude: 0 } : t.location,
      currentJobs: jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status))
        .map(j => ({
          jobId: j.id,
          scheduledTime: j.scheduledTime,
          priority: j.priority,
          location: j.location,
        })),
      workingHours: t.workingHours,
      isOnCall: t.isOnCall,
    }));
    
    const input: AllocateJobActionInput = {
      appId,
      jobDescription: job.description,
      jobPriority: job.priority,
      requiredSkills: job.requiredSkills || [],
      scheduledTime: job.scheduledTime,
      technicianAvailability: aiTechnicians,
      currentTime: new Date().toISOString(),
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
  }, [technicians, jobs, company, appId, UNCOMPLETED_STATUSES_LIST]);
  
  // Effect for automatic schedule health checks
  useEffect(() => {
    if (isLoadingData || technicians.length === 0 || jobs.length === 0 || isMockMode) {
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
  }, [jobs, technicians, isLoadingData, isMockMode]);
  
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
            status: 'Unassigned',
            assignedTechnicianId: null,
            notes: arrayUnion(`(Auto-Reassigned: Technician interrupted for high-priority job ${job.title})`) as any,
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

  const handleAIAssign = useCallback((job: Job) => {
    if (technicians.length === 0) {
      toast({ title: "Cannot Assign", description: "There are no technicians available.", variant: "default" });
      return;
    }
    setJobForAIAssign(job);
    setIsAIAssignDialogOpen(true);
  }, [technicians, toast]);

  const handleOpenChat = (job: Job) => {
    setSelectedChatJob(job);
    setIsChatOpen(true);
  };
  
  const openTasksFilter: JobStatus[] = ['Unassigned', 'Draft'];
  
  const openTasksCount = useMemo(() => {
    return jobs.filter(job => openTasksFilter.includes(job.status)).length;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let tempJobs = jobs;

    // Filter by search term
    if (jobSearchTerm) {
        const lowercasedTerm = jobSearchTerm.toLowerCase();
        tempJobs = tempJobs.filter(job => {
            return (
                job.title.toLowerCase().includes(lowercasedTerm) ||
                job.description.toLowerCase().includes(lowercasedTerm) ||
                job.customerName.toLowerCase().includes(lowercasedTerm) ||
                (job.location.address && job.location.address.toLowerCase().includes(lowercasedTerm)) ||
                (job.requiredSkills && job.requiredSkills.some(skill => skill.toLowerCase().includes(lowercasedTerm)))
            );
        });
    }

    // Filter by ID if jobFilterId is present
    if (jobFilterId) {
        return tempJobs.filter(job => job.id === jobFilterId);
    }
    
    // Filter by open tasks if toggled
    if (showOpenTasksOnly) {
        return tempJobs.filter(job => 
            openTasksFilter.includes(job.status)
        );
    }

    // Filter by status and priority if not showing open tasks only
    if (statusFilter.length > 0 || priorityFilter.length > 0) {
        return tempJobs.filter(job => {
            const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(job.priority);
            const statusMatch = statusFilter.length === 0 || statusFilter.includes(job.status);
            return priorityMatch && statusMatch;
        });
    }

    return tempJobs;
}, [jobs, statusFilter, priorityFilter, jobFilterId, jobSearchTerm, showOpenTasksOnly]);

  const sortedJobs = useMemo(() => {
    const technicianMap = new Map(technicians.map(t => [t.id, t.name]));
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 } as Record<JobPriority, number>;
    const statusOrder = { 'Draft': 0, 'Unassigned': 1, 'Assigned': 2, 'En Route': 3, 'In Progress': 4, 'Completed': 5, 'Pending Invoice': 6, 'Finished': 7, 'Cancelled': 8 } as Record<JobStatus, number>;

    return [...filteredJobs].sort((a, b) => {
        switch (sortOrder) {
            case 'status':
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;
                const priorityDiffStatus = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiffStatus !== 0) return priorityDiffStatus;
                return new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'priority':
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                const assignmentA = a.assignedTechnicianId ? 1 : 0;
                const assignmentB = b.assignedTechnicianId ? 1 : 0;
                if (assignmentA !== assignmentB) return assignmentA - assignmentB;
                return new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'technician':
                const techA = a.assignedTechnicianId ? technicianMap.get(a.assignedTechnicianId) || 'Zz' : 'Zz';
                const techB = b.assignedTechnicianId ? technicianMap.get(b.assignedTechnicianId) || 'Zz' : 'Zz';
                return techA.localeCompare(techB) || new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'customer':
                return a.customerName.localeCompare(b.customerName) || new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'scheduledTime':
                const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : Infinity;
                const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : Infinity;
                return timeA - timeB || new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      const skillMatch = tech.skills?.some(skill => skill.name.toLowerCase().includes(lowercasedTerm));
      return isAvailableMatch || isUnavailableMatch || nameMatch || skillMatch;
    });
  }, [technicians, technicianSearchTerm]);

  const unassignedJobsForBatchAssign = useMemo(() => jobs.filter(job => job.status === 'Unassigned'), [jobs]);
  const unassignedJobsCount = unassignedJobsForBatchAssign.length;
  
  const defaultMapCenter = technicians.length > 0 && technicians[0].location
    ? { lat: technicians[0].location.latitude, lng: technicians[0].location.longitude }
    : { lat: 39.8283, lng: -98.5795 }; 

  const handleBatchAIAssign = useCallback(async () => {
    if (isMockMode) {
      // Mock logic
      const currentUnassignedJobs = jobs.filter(job => job.status === 'Unassigned');
      if (currentUnassignedJobs.length === 0 || technicians.length === 0) {
        toast({ title: "Fleety Batch Assign", description: "No unassigned jobs or technicians available.", variant: "default" });
        return;
      }
      setIsBatchLoading(true);
      
      let tempTechnicianPool = JSON.parse(JSON.stringify(technicians.filter(t => t.isAvailable)));
      
      const suggestions: AssignmentSuggestion[] = currentUnassignedJobs.map(job => {
        const { requiredSkills = [] } = job;
        const suitableTechIndex = tempTechnicianPool.findIndex((tech: Technician) => 
            requiredSkills.length === 0 || requiredSkills.every(skill => tech.skills.some(s => s.name === skill))
        );

        if (suitableTechIndex !== -1) {
            const assignedTech = tempTechnicianPool[suitableTechIndex];
            tempTechnicianPool.splice(suitableTechIndex, 1); // Remove tech from pool
            return {
                job,
                suggestion: {
                    suggestedTechnicianId: assignedTech.id,
                    reasoning: `Mock Mode: Assigned to ${assignedTech.name} based on availability and skills.`
                },
                suggestedTechnicianDetails: assignedTech,
                error: null
            };
        } else {
            return {
                job,
                suggestion: null,
                suggestedTechnicianDetails: null,
                error: "Mock Mode: No available technician with the required skills."
            };
        }
      });
      
      setAssignmentSuggestionsForReview(suggestions);
      setIsBatchReviewDialogOpen(true);
      setIsBatchLoading(false);
      return;
    }

    // Live logic
    if (!appId) return;
    const currentUnassignedJobs = jobs.filter(job => job.status === 'Unassigned');
    if (currentUnassignedJobs.length === 0 || technicians.length === 0) {
      toast({ title: "Fleety Batch Assign", description: "No unassigned jobs or no technicians available for assignment.", variant: "default" });
      return;
    }
    setIsBatchLoading(true);
    setAssignmentSuggestionsForReview([]);
    
    let tempTechnicianPool = JSON.parse(JSON.stringify(technicians));

    const suggestions = await Promise.all(currentUnassignedJobs.map(async (job) => {
        const aiTechnicians: AITechnician[] = tempTechnicianPool.map((t: Technician) => ({
            technicianId: t.id,
            technicianName: t.name,
            isAvailable: t.isAvailable,
            skills: t.skills.map(s => s.name) || [],
            liveLocation: t.location,
            homeBaseLocation: company?.settings?.address ? { address: company.settings.address, latitude: 0, longitude: 0 } : t.location,
            currentJobs: jobs.filter(j => j.assignedTechnicianId === t.id && UNCOMPLETED_STATUSES_LIST.includes(j.status)).map(j => ({ jobId: j.id, scheduledTime: j.scheduledTime, priority: j.priority, location: j.location })),
            workingHours: t.workingHours,
            isOnCall: t.isOnCall,
        }));

        const input: AllocateJobActionInput = {
            appId,
            jobDescription: job.description,
            jobPriority: job.priority,
            requiredSkills: job.requiredSkills || [],
            scheduledTime: job.scheduledTime,
            technicianAvailability: aiTechnicians,
            currentTime: new Date().toISOString(),
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
  }, [jobs, technicians, toast, appId, company, UNCOMPLETED_STATUSES_LIST, isMockMode]);

  const handleConfirmBatchAssignments = async (assignmentsToConfirm: FinalAssignment[]) => {
    if (isMockMode) {
        toast({ title: "Assignments Confirmed (Mock)", description: `${assignmentsToConfirm.length} jobs assigned.` });
        setIsBatchReviewDialogOpen(false);
        return;
    }
    
    if (!db || !userProfile?.companyId || !appId) {
        toast({ title: "Database Error", description: "Firestore instance not available.", variant: "destructive" });
        return;
    }

    setIsLoadingBatchConfirmation(true);
    const batch = writeBatch(db);
    let assignmentsMade = 0;

    for (const assignment of assignmentsToConfirm) {
        const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, assignment.jobId);
        batch.update(jobDocRef, {
            assignedTechnicianId: assignment.technicianId,
            status: 'Assigned' as JobStatus,
            updatedAt: serverTimestamp(),
            assignedAt: serverTimestamp(),
        });

        const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, assignment.technicianId);
        batch.update(techDocRef, {
            isAvailable: false,
            currentJobId: assignment.jobId,
        });
        assignmentsMade++;
    }

    try {
        await batch.commit();
        if (assignmentsMade > 0) {
          toast({ title: "Fleety Batch Assignment Success", description: `${assignmentsMade} jobs have been assigned.` });
        } else {
          toast({ title: "No Assignments Made", description: "No jobs were selected for assignment.", variant: "default" });
        }
    } catch (error: any) {
        console.error("Error committing batch assignments: ", error);
        toast({ title: "Assignment Error", description: "Could not assign jobs.", variant: "destructive" });
    } finally {
        setIsLoadingBatchConfirmation(false);
        setIsBatchReviewDialogOpen(false);
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
      description: "Their active jobs are now ready for reassignment.",
    });
    
    setTimeout(() => {
        handleBatchAIAssign();
        setIsHandlingUnavailability(false);
    }, 1500);
  };
  
  const handleDismissRiskAlert = (technicianId: string) => {
    setRiskAlerts(prev => prev.filter(alert => alert.technician.id !== technicianId));
  };
  
  const handleLocationSearch = (location: { address: string; lat: number; lng: number }) => {
    setActiveTab('overview-map');
    setSearchedLocation({
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
    });
  };
  
  const handleViewOnMap = (location: Location) => {
    setActiveTab('overview-map');
    setSearchedLocation(location);
  };

  const handleToggleOnCall = async (technicianId: string, isOnCall: boolean) => {
    if (!userProfile?.companyId || !appId) return;

    setIsUpdatingOnCall(true);
    const result = await toggleOnCallStatusAction({
      companyId: userProfile.companyId,
      appId,
      technicianId,
      isOnCall,
    });

    if (result.error) {
      toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: 'Status Updated',
        description: `Technician is now ${isOnCall ? 'On-Call' : 'Off-Call'}.`,
      });
    }
    setIsUpdatingOnCall(false);
  };
  
  const handleAIAssignSuccess = () => {
    // This function can be expanded if we need to do something after AI assignment,
    // like refreshing a specific part of the data. For now, onSnapshot handles it.
  };

  const handleShareTracking = (job: Job) => {
    setJobToShare(job);
    setIsShareTrackingOpen(true);
  };
  
  const statusOptions = [
    { value: "Draft", label: "Draft" },
    { value: "Unassigned", label: "Unassigned" },
    { value: "Assigned", label: "Assigned" },
    { value: "En Route", label: "En Route" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const priorityOptions = [
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const handleSkillsUpdated = (newSkills: Skill[]) => {
      if(userProfile?.companyId) {
        fetchSkills(userProfile.companyId);
      }
  };
  
  const handleFleetOptimize = async () => {
    if (!userProfile?.companyId || !appId) return;

    setIsFleetOptimizing(true);
    setFleetOptimizationResult(null);

    const start = startOfDay(new Date());
    const end = endOfDay(new Date());

    const jobsForToday = jobs.filter(job => {
        if (!job.scheduledTime) return false;
        const jobDate = new Date(job.scheduledTime);
        return jobDate >= start && jobDate <= end;
    });
    
    const unassignedJobsForToday = jobsForToday.filter(j => j.status === 'Unassigned');
    const assignedJobsForToday = jobsForToday.filter(j => j.status === 'Assigned' || j.status === 'In Progress');

    const result = await runFleetOptimizationAction({
      companyId: userProfile.companyId,
      appId,
      currentTime: new Date().toISOString(),
      pendingJobs: unassignedJobsForToday,
      technicians: technicians.map(t => ({
        ...t,
        jobs: assignedJobsForToday.filter(j => j.assignedTechnicianId === t.id)
      })),
    });

    setIsFleetOptimizing(false);
    if (result.error) {
      toast({ title: 'Optimization Failed', description: result.error, variant: 'destructive' });
    } else {
      setFleetOptimizationResult(result.data);
      if(result.data?.suggestedChanges) {
        setSelectedFleetChanges(result.data.suggestedChanges);
      }
      setIsFleetOptimizationDialogOpen(true);
    }
  };

  const handleConfirmFleetOptimization = async (changes: OptimizationSuggestion[]) => {
    if (!userProfile?.companyId || !appId || !db) return;
    setIsLoadingBatchConfirmation(true);
    
    const batch = writeBatch(db);
    changes.forEach(change => {
        const jobRef = doc(db, `artifacts/${appId}/public/data/jobs`, change.jobId);
        const payload: Partial<Job> = {
            assignedTechnicianId: change.newTechnicianId,
            status: 'Assigned',
            notes: arrayUnion(`(Reassigned via Fleet Optimizer: ${change.justification})`) as any,
        };
        if(change.newScheduledTime) {
            payload.scheduledTime = change.newScheduledTime;
        }
        batch.update(jobRef, payload);
    });

    try {
        await batch.commit();
        toast({ title: 'Fleet Schedule Updated', description: `${changes.length} change(s) have been applied successfully.` });
    } catch (e: any) {
        toast({ title: 'Error Applying Changes', description: e.message, variant: 'destructive' });
    } finally {
        setIsLoadingBatchConfirmation(false);
        setIsFleetOptimizationDialogOpen(false);
    }
  };


  if (authLoading || isLoadingData) { 
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {!isMockMode && showGettingStarted && technicians.length === 0 && userProfile?.role === 'admin' && (
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
            onClose={() => setIsAddJobDialogOpen(false)}
            job={selectedJobForEdit}
            technicians={technicians}
            allSkills={allSkills.map(s => s.name)}
            customers={customers}
            contracts={contracts}
            jobs={jobs}
            onManageSkills={() => setIsManageSkillsOpen(true)}
        />
        <SmartJobAllocationDialog
          jobToAssign={jobForAIAssign}
          technicians={technicians}
          jobs={jobs}
          isOpen={isAIAssignDialogOpen}
          setIsOpen={setIsAIAssignDialogOpen}
          onJobAssigned={handleAIAssignSuccess}
        />
        {isAdmin && (
            <AddEditTechnicianDialog
                isOpen={isAddEditTechnicianDialogOpen}
                onClose={() => setIsAddEditTechnicianDialogOpen(false)}
                technician={selectedTechnicianForEdit}
                allSkills={allSkills.map(s => s.name)}
            />
        )}
      {appId && <ChatSheet 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
          job={selectedChatJob} 
          technician={technicians.find(t => t.id === selectedChatJob?.assignedTechnicianId) || null}
          appId={appId}
      />}
      {appId && <ShareTrackingDialog 
          isOpen={isShareTrackingOpen}
          setIsOpen={setIsShareTrackingOpen}
          job={jobToShare}
      />}
      <FleetOptimizationReviewDialog
        isOpen={isFleetOptimizationDialogOpen}
        setIsOpen={setIsFleetOptimizationDialogOpen}
        optimizationResult={fleetOptimizationResult}
        technicians={technicians}
        jobs={jobs}
        onConfirmChanges={handleConfirmFleetOptimization}
        isLoadingConfirmation={isLoadingBatchConfirmation}
        selectedChanges={selectedFleetChanges}
        setSelectedChanges={setSelectedFleetChanges}
      />
       {riskAlerts.map(alert => (
          <ScheduleRiskAlert 
            key={alert.technician.id} 
            riskAlert={alert}
            onDismiss={handleDismissRiskAlert}
            technicians={technicians}
            jobs={jobs}
          />
        ))}

        {proactiveSuggestion && (
            <Alert variant="default" className="border-amber-400 bg-amber-50 text-amber-900">
                <Bot className="h-4 w-4 text-amber-600" />
                <AlertTitle className="font-headline text-amber-900 flex justify-between items-center">
                    <span>Fleety's Proactive Suggestion</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setProactiveSuggestion(null)}><X className="h-4 w-4" /></Button>
                </AlertTitle>
                <AlertDescription className="text-amber-800">
                    A new high-priority job "<strong>{proactiveSuggestion.job.title}</strong>" was just created.
                    <p className="text-xs italic mt-1">"{proactiveSuggestion.suggestion?.reasoning}"</p>
                </AlertDescription>
                <div className="mt-4 flex gap-2">
                    <Button 
                        size="sm" 
                        variant="default"
                        className="bg-amber-500 hover:bg-amber-600"
                        onClick={() => handleProactiveAssign(proactiveSuggestion)}
                        disabled={isProcessingProactive || !proactiveSuggestion.suggestedTechnicianDetails}
                    >
                        {isProcessingProactive ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCheck className="mr-2 h-4 w-4" />}
                        Assign to {proactiveSuggestion.suggestedTechnicianDetails?.name || 'Suggested'}
                    </Button>
                     <Button size="sm" variant="outline" onClick={() => handleOpenEditJob(proactiveSuggestion.job)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        View Details
                    </Button>
                </div>
            </Alert>
        )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('dashboard')}
        </h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
           {isAdmin && (
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImportJobsOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('import_jobs')}
            </Button>
           )}
           {canEditJobs && (
            <Button onClick={handleOpenAddJob} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('add_new_job')}
            </Button>
           )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="job-list" className="hover:bg-secondary">
            <div className="flex items-center gap-2">
                {t('job_list')}
                {openTasksCount > 0 && <Badge variant="default" className="h-5">{openTasksCount}</Badge>}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <CardTitle>{t('current_jobs')}</CardTitle>
                        <CardDescription>{t('current_jobs_desc')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor="job-search">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="job-search"
                                placeholder="Search jobs, customers, skills..."
                                value={jobSearchTerm}
                                onChange={(e) => setJobSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="status-filter">{t('status')}</Label>
                        <MultiSelectFilter
                            options={statusOptions}
                            selected={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Filter by Status"
                            disabled={showOpenTasksOnly}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="priority-filter">{t('priority')}</Label>
                        <MultiSelectFilter
                            options={priorityOptions}
                            selected={priorityFilter}
                            onChange={setPriorityFilter}
                            placeholder="Filter by Priority"
                            disabled={showOpenTasksOnly}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="sort-order">{t('sort_by')}</Label>
                        <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                            <SelectTrigger id="sort-order"><div className="flex items-center gap-1.5"><ArrowDownUp className="h-3 w-3"/> <SelectValue placeholder="Sort Order" /></div></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="status">{t('sort_by_status')}</SelectItem>
                            <SelectItem value="priority">{t('sort_by_priority')}</SelectItem>
                            <SelectItem value="technician">{t('sort_by_technician')}</SelectItem>
                            <SelectItem value="customer">{t('sort_by_customer')}</SelectItem>
                            <SelectItem value="scheduledTime">{t('sort_by_scheduled_time')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="open-tasks-toggle"
                        checked={showOpenTasksOnly}
                        onCheckedChange={setShowOpenTasksOnly}
                    />
                    <Label htmlFor="open-tasks-toggle" className="flex items-center gap-1.5 whitespace-nowrap"><ListFilter className="h-4 w-4"/>Show Open Tasks Only</Label>
                </div>
                 <Button 
                    variant="accent" 
                    onClick={handleBatchAIAssign} 
                    disabled={unassignedJobsCount === 0 || isBatchLoading}
                    className="w-full sm:w-auto"
                    >
                    {isBatchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Fleety Batch Assign ({unassignedJobsCount})
                </Button>
              </div>
              <div className="space-y-4 mt-4">
                {sortedJobs.length > 0 ? (
                  sortedJobs.map(job => (
                    <JobListItem 
                      key={job.id} 
                      job={job} 
                      technicians={technicians}
                      onOpenChat={handleOpenChat}
                      onAIAssign={handleAIAssign}
                      onViewOnMap={handleViewOnMap}
                      onShareTracking={handleShareTracking}
                      onEdit={handleOpenEditJob}
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
            onJobClick={(job) => handleOpenEditJob(job)}
            onFleetOptimize={handleFleetOptimize}
            isFleetOptimizing={isFleetOptimizing}
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
                            onToggleOnCall={handleToggleOnCall}
                            isUpdatingOnCall={isUpdatingOnCall}
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
        initialSkills={allSkills}
        onSkillsUpdated={handleSkillsUpdated}
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
        technicians={technicians}
        onConfirmAssignments={handleConfirmBatchAssignments}
        isLoadingConfirmation={isLoadingBatchConfirmation}
      />
      <HelpAssistant />
    </div>
  );
}
