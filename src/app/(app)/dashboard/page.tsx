
"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Users, Briefcase, Zap, SlidersHorizontal, Loader2, UserPlus, MapIcon, Bot, Settings, FileSpreadsheet, UserCheck, AlertTriangle, X, CalendarDays, UserCog, ShieldQuestion, MessageSquare, Share2, Shuffle, ArrowDownUp, Search, Edit, UserX, Star, HelpCircle, RefreshCw, Wrench, ImageIcon, ListFilter, Eye, Lock, Repeat, DollarSign, Package, Grid, List, ChevronDown, Rocket, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job, Technician, JobStatus, JobPriority, ProfileChangeRequest, Location, Customer, SortOrder, AITechnician, Skill, Contract, OptimizationSuggestion, Part } from '@/types';
import JobListItem from './components/JobListItem';
import TechnicianCard from './components/technician-card';
import MapView from './components/map-view';
import ScheduleCalendarView from './components/ScheduleCalendarView';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, writeBatch, getDocs, where, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Label } from '@/components/ui/label';
import AddEditJobDialog from './components/AddEditJobDialog';
import AddEditTechnicianDialog from './components/AddEditTechnicianDialog';
import BatchAssignmentReviewDialog, { type AssignmentSuggestion, type FinalAssignment } from './components/BatchAssignmentReviewDialog';
import { handleTechnicianUnavailabilityAction } from '@/actions/fleet-actions';
import { allocateJobAction, checkScheduleHealthAction, runFleetOptimizationAction, type CheckScheduleHealthResult } from '@/actions/ai-actions';
import { seedSampleDataAction } from '@/actions/onboarding-actions';
import { toggleOnCallStatusAction } from '@/actions/technician-actions';
import { useToast } from '@/hooks/use-toast';
import ManageSkillsDialog from './components/ManageSkillsDialog';
import ManagePartsDialog from './components/ManagePartsDialog';
import ImportJobsDialog from './components/ImportJobsDialog';
import ProfileChangeRequests from './components/ProfileChangeRequests';
import { Badge } from '@/components/ui/badge';
import ScheduleHealthDialog from './components/ScheduleHealthDialog';
import { ScheduleRiskAlert } from './components/ScheduleRiskAlert';
import ChatSheet from './components/ChatSheet';
import { isSameDay, startOfDay, endOfDay, addMinutes } from 'date-fns';
import AddressAutocompleteInput from './components/AddressAutocompleteInput';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSkillsAction } from '@/actions/skill-actions';
import { getPartsAction } from '@/actions/part-actions';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { serverTimestamp } from 'firebase/firestore'; 
import { Copy } from 'lucide-react';
import { useTranslation } from '@/hooks/use-language';
import GettingStartedChecklist from './components/GettingStartedChecklist';
import HelpAssistant from './components/HelpAssistant';
import { mockJobs, mockTechnicians, mockProfileChangeRequests, mockCustomers, mockContracts, mockParts } from '@/lib/mock-data';
import { MultiSelectFilter } from './components/MultiSelectFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AllocateJobActionInput } from '@/types';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import ShareTrackingDialog from './components/ShareTrackingDialog';
import { Switch } from '@/components/ui/switch';
import FleetOptimizationReviewDialog from './components/FleetOptimizationReviewDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { reassignJobAction } from '@/actions/fleet-actions';
import { Progress } from '@/components/ui/progress';
import isEqual from 'lodash.isequal';

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
  
  const statusOptions = useMemo(() => [
    { value: "Draft", label: "Draft" },
    { value: "Unassigned", label: "Unassigned" },
    { value: "Assigned", label: "Assigned" },
    { value: "En Route", label: "En Route" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ], []);

  const priorityOptions = useMemo(() => [
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ], []);
  
  const [statusFilter, setStatusFilter] = useState<string[]>(statusOptions.map(o => o.value));
  const [priorityFilter, setPriorityFilter] = useState<string[]>(priorityOptions.map(o => o.value));

  const [showOpenTasksOnly, setShowOpenTasksOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('status');
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  
  const [isBatchReviewDialogOpen, setIsBatchReviewDialogOpen] = useState(false);
  const [assignmentSuggestionsForReview, setAssignmentSuggestionsForReview] = useState<AssignmentSuggestion[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isLoadingBatchConfirmation, setIsLoadingBatchConfirmation] = useState(false);
  
  const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  
  const [isManagePartsOpen, setIsManagePartsOpen] = useState(false);
  const [allParts, setAllParts] = useState<Part[]>([]);

  const [isImportJobsOpen, setIsImportJobsOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);

  const [isHandlingUnavailability, setIsHandlingUnavailability] = useState(false);

  const [proactiveSuggestion, setProactiveSuggestion] = useState<AssignmentSuggestion | null>(null);
  const [isFetchingProactiveSuggestion, setIsFetchingProactiveSuggestion] = useState(false);
  const [isProcessingProactive, setIsProcessingProactive] = useState(false);
  
  const [isUpdatingOnCall, setIsUpdatingOnCall] = useState(false);

  const [riskAlerts, setRiskAlerts] = useState<CheckScheduleHealthResult[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatJob, setSelectedChatJob] = useState<Job | null>(null);
  
  const [searchedLocation, setSearchedLocation] = useState<Location | null>(null);
  const [searchAddressText, setSearchAddressText] = useState('');
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');

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
  const [proactiveOptimizationAlert, setProactiveOptimizationAlert] = useState<{ suggestedChanges: OptimizationSuggestion[]; overallReasoning: string } | null>(null);


  const [technicianViewMode, setTechnicianViewMode] = useState&lt;'grid' | 'list'&gt;('grid');
  
  const [proposedJobs, setProposedJobs] = useState&lt;Job[]&gt;([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const [activeDragItem, setActiveDragItem] = useState&lt;Job | null&gt;(null);

  const jobFilterId = searchParams.get('jobFilter');
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
  const canEditJobs = isAdmin || userProfile?.role === 'csr';
  const [activeTab, setActiveTab] = useState('job-list');
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const UNCOMPLETED_STATUSES_LIST: JobStatus[] = ['Unassigned', 'Assigned', 'En Route', 'In Progress', 'Draft'];
  
  const openTasksFilter: JobStatus[] = useMemo(() =&gt; ['Unassigned', 'Draft'], []);

  const handleOpenTasksToggle = (checked: boolean) =&gt; {
    setShowOpenTasksOnly(checked);
    if (checked) {
      setStatusFilter(openTasksFilter);
    } else {
      setStatusFilter(statusOptions.map(o =&gt; o.value));
    }
  };

  const handleStatusFilterChange = (newStatusFilter: string[]) =&gt; {
    setStatusFilter(newStatusFilter);
    const openTasksSet = new Set(openTasksFilter.sort());
    const newStatusSet = new Set(newStatusFilter.sort());
    
    if (!isEqual(openTasksSet, newStatusSet)) {
        setShowOpenTasksOnly(false);
    }
  };


  const fetchSkills = useCallback(async (companyId: string) =&gt; {
    if (isMockMode) {
      setAllSkills(PREDEFINED_SKILLS.map((name, index) =&gt; ({ id: `mock_skill_${index}`, name })));
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

  const fetchParts = useCallback(async (companyId: string) =&gt; {
    if (isMockMode) {
      setAllParts(mockParts.map((p, i) =&gt; ({ id: `part_${i}`, name: p })));
      return;
    }
    if (!appId) return;
    const result = await getPartsAction({ companyId, appId });
    if (result.data) {
      setAllParts(result.data || []);
    } else {
      console.error("Could not fetch parts library:", result.error);
    }
  }, [appId, isMockMode]);


  useEffect(() =&gt; {
    if (authLoading) return;
    
    if (isMockMode) {
        setJobs(mockJobs);
        setTechnicians(mockTechnicians);
        setContracts(mockContracts);
        setProfileChangeRequests(mockProfileChangeRequests);
        setAllSkills(PREDEFINED_SKILLS.map((name, index) =&gt; ({ id: `mock_skill_${index}`, name })));
        setAllParts(mockParts.map((name, index) =&gt; ({ id: `mock_part_${index}`, name })));
        setIsLoadingData(false);
        return;
    }

    if (!db || !userProfile?.companyId || !appId) {
        setIsLoadingData(false);
        return;
    }

    const companyId = userProfile.companyId;
    let collectionsLoaded = 0;
    const totalCollections = 4; // Jobs, Techs, Contracts, Requests

    const checkLoadingComplete = () =&gt; {
        collectionsLoaded++;
        if (collectionsLoaded === totalCollections) {
            setIsLoadingData(false);
        }
    };
    
    fetchSkills(companyId);
    fetchParts(companyId);

    const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId));
    const techniciansQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", companyId));
    const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", companyId));
    const requestsQuery = query(collection(db, `artifacts/${appId}/public/data/profileChangeRequests`), where("companyId", "==", companyId));

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) =&gt; {
        const jobsData = snapshot.docs.map(doc =&gt; {
            const data = doc.data();
            for (const key in data) {
                if (data[key] &amp;&amp; typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as Job;
        }).sort((a, b) =&gt; new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(jobsData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) =&gt; {
        console.error("Error fetching jobs:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve jobs.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    const unsubscribeTechnicians = onSnapshot(techniciansQuery, (snapshot) =&gt; {
        const techniciansData = snapshot.docs.map(doc =&gt; ({ id: doc.id, ...doc.data() } as Technician))
            .sort((a, b) =&gt; a.name.localeCompare(b.name));
        setTechnicians(techniciansData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) =&gt; {
        console.error("Error fetching technicians:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve technicians.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    const unsubscribeContracts = onSnapshot(contractsQuery, (snapshot) =&gt; {
        const contractsData = snapshot.docs.map(doc =&gt; {
            const data = doc.data();
             for (const key in data) {
                if (data[key] &amp;&amp; typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as Contract;
        });
        setContracts(contractsData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) =&gt; {
        console.error("Error fetching contracts:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve contracts.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) =&gt; {
        const requestsData = snapshot.docs.map(doc =&gt; {
            const data = doc.data();
             for (const key in data) {
                if (data[key] &amp;&amp; typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as ProfileChangeRequest;
        }).filter(r =&gt; r.status === 'pending').sort((a, b) =&gt; new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProfileChangeRequests(requestsData);
        if (isLoadingData) checkLoadingComplete();
    }, (error) =&gt; {
        console.error("Error fetching change requests:", error);
        toast({ title: "Data Fetch Error", description: "Could not retrieve change requests.", variant: "destructive" });
        if (isLoadingData) checkLoadingComplete();
    });

    return () =&gt; {
        unsubscribeJobs();
        unsubscribeTechnicians();
        unsubscribeContracts();
        unsubscribeRequests();
    };
}, [authLoading, userProfile, appId, fetchSkills, fetchParts, toast, isLoadingData, isMockMode]);


  const handleSeedData = async () =&gt; {
    if (!userProfile?.companyId || !appId) return;
    setIsLoadingData(true);
    const result = await seedSampleDataAction({ companyId: userProfile.companyId, appId });
    if (result.error) {
      toast({ title: "Error", description: `Could not seed data: ${result.error}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Sample data has been added." });
    }
    setIsLoadingData(false);
  };

  useEffect(() =&gt; {
    if (jobFilterId) {
        setActiveTab('job-list');
    }
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');
    if (lat &amp;&amp; lng) {
        setSearchedLocation({ latitude: parseFloat(lat), longitude: parseFloat(lng), address: address || '' });
        setActiveTab('overview-map');
    }
  }, [jobFilterId, searchParams]);
  
  const handleOpenEditTechnician = (technician: Technician) =&gt; {
    setSelectedTechnicianForEdit(technician);
    setIsAddEditTechnicianDialogOpen(true);
  };

  const customers = useMemo(() =&gt; {
    const data = isMockMode ? mockCustomers : [];
    const customerMap = new Map&lt;string, Customer&gt;();
    jobs.forEach(job =&gt; {
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

    data.forEach(c =&gt; {
        const key = (c.email || c.phone || c.name).toLowerCase().trim();
        if(!customerMap.has(key)){
            customerMap.set(key, {id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address});
        }
    })

    return Array.from(customerMap.values()).sort((a, b) =&gt; a.name.localeCompare(b.name));
  }, [jobs, isMockMode]);
  
  useEffect(() =&gt; {
    if (!isLoadingData &amp;&amp; company) {
        const isNewCompany = technicians.length === 0 &amp;&amp; jobs.length === 0 &amp;&amp; !localStorage.getItem('getting_started_dismissed');
        setShowGettingStarted(isNewCompany);
    }
  }, [isLoadingData, company, technicians, jobs]);

  const prevTechCount = useRef&lt;number | null&gt;(null);
  
  useEffect(() =&gt; {
    if (isLoadingData || isMockMode) {
      prevTechCount.current = technicians.length;
      return;
    }
  
    if (company?.subscriptionStatus !== 'active' || !company.id) {
      return;
    }
    
    if (technicians.length !== prevTechCount.current &amp;&amp; prevTechCount.current !== null) {
    }
      
    prevTechCount.current = technicians.length;
    
  }, [technicians, company, isLoadingData, toast, isMockMode]);
  
  useEffect(() =&gt; {
    if (isLoadingData || technicians.length === 0 || !userProfile?.companyId || isMockMode || !(company?.settings?.featureFlags?.autoDispatchEnabled ?? true)) {
      return;
    }

    const prevJobIdsRefCurrent = prevJobIdsRef.current;
    const currentJobIds = new Set(jobs.map(j =&gt; j.id));
    const newJobs = jobs.filter(j =&gt; !prevJobIdsRefCurrent.has(j.id) &amp;&amp; j.companyId === userProfile.companyId);
    prevJobIdsRef.current = currentJobIds;
    
    if (newJobs.length === 0) {
      return;
    }

    const highPriorityPendingJob = newJobs.find(
      j =&gt; j.priority === 'High' &amp;&amp; j.status === 'Unassigned'
    );
    
    if (highPriorityPendingJob &amp;&amp; !proactiveSuggestion &amp;&amp; !isFetchingProactiveSuggestion) {
      fetchProactiveSuggestion(highPriorityPendingJob);
    }
  }, [jobs, isLoadingData, technicians, proactiveSuggestion, isFetchingProactiveSuggestion, userProfile, isMockMode, company]);

  const fetchProactiveSuggestion = useCallback(async (job: Job) =&gt; {
    if (!appId) return;
    setIsFetchingProactiveSuggestion(true);

    const aiTechnicians: AITechnician[] = technicians.map(t =&gt; ({
      technicianId: t.id,
      technicianName: t.name,
      isAvailable: t.isAvailable,
      skills: t.skills || [],
      liveLocation: t.location,
      homeBaseLocation: company?.settings?.address ? { address: company.settings.address, latitude: 0, longitude: 0 } : t.location,
      currentJobs: jobs.filter(j =&gt; j.assignedTechnicianId === t.id &amp;&amp; UNCOMPLETED_STATUSES_LIST.includes(j.status))
        .map(j =&gt; ({
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
      const techDetails = result.data.suggestions.length &gt; 0 &amp;&amp; result.data.suggestions[0].suggestedTechnicianId 
        ? technicians.find(t =&gt; t.id === result.data.suggestions[0].suggestedTechnicianId) 
        : null;
      setProactiveSuggestion({
        job: job,
        suggestion: result.data,
        suggestedTechnicianDetails: techDetails,
        error: !techDetails ? result.data.overallReasoning : null,
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
  
  useEffect(() =&gt; {
    if (isLoadingData || technicians.length === 0 || jobs.length === 0 || isMockMode || !(company?.settings?.featureFlags?.rescheduleCustomerJobsEnabled ?? true)) {
      return;
    }

    const checkHealth = async () =&gt; {
      const result = await checkScheduleHealthAction({ technicians, jobs });
      if (result.error) {
        console.warn("Auto schedule health check failed:", result.error);
      } else if (result.data) {
        const highRiskAlerts = result.data.filter(r =&gt; r.risk &amp;&amp; r.risk.predictedDelayMinutes &gt; 10);
        
        setRiskAlerts(currentAlerts =&gt; {
          const currentAlertIds = new Set(currentAlerts.map(a =&gt; a.technician.id));
          const newAlertsToAdd = highRiskAlerts.filter(newAlert =&gt; !currentAlertIds.has(newAlert.technician.id));
          const stillValidAlerts = currentAlerts.filter(oldAlert =&gt; 
            highRiskAlerts.some(newAlert =&gt; newAlert.technician.id === oldAlert.technician.id)
          );
          if (newAlertsToAdd.length &gt; 0 || stillValidAlerts.length !== currentAlerts.length) {
            return [...stillValidAlerts, ...newAlertsToAdd];
          }
          return currentAlerts;
        });
      }
    };
    
    const initialCheckTimer = setTimeout(checkHealth, 2000);
    const intervalId = setInterval(checkHealth, 600000);

    return () =&gt; {
      clearTimeout(initialCheckTimer);
      clearInterval(intervalId);
    };
  }, [jobs, technicians, isLoadingData, isMockMode, company]);

  useEffect(() =&gt; {
    if (isLoadingData || isMockMode || !(company?.settings?.featureFlags?.autoDispatchEnabled ?? true) || !userProfile?.companyId || !appId || jobs.length === 0) {
      return;
    }

    const checkForOptimization = async () =&gt; {
      if (proactiveOptimizationAlert) return; // Don't check if an alert is already showing

      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      const jobsForToday = jobs.filter(job =&gt; job.scheduledTime &amp;&amp; new Date(job.scheduledTime) &gt;= start &amp;&amp; new Date(job.scheduledTime) &lt;= end);
      const unassignedJobsForToday = jobsForToday.filter(j =&gt; j.status === 'Unassigned');
      const assignedJobsForToday = jobsForToday.filter(j =&gt; j.status === 'Assigned' || j.status === 'In Progress');

      const result = await runFleetOptimizationAction({
        companyId: userProfile.companyId!,
        appId: appId!,
        currentTime: new Date().toISOString(),
        pendingJobs: unassignedJobsForToday,
        technicians: technicians.map(t =&gt; ({
          ...t,
          jobs: assignedJobsForToday.filter(j =&gt; j.assignedTechnicianId === t.id)
        })),
      });

      if (result.data?.suggestedChanges &amp;&amp; result.data.suggestedChanges.length &gt; 0) {
        const totalProfitGain = result.data.suggestedChanges.reduce((acc, change) =&gt; acc + (change.profitChange || 0), 0);
        if (totalProfitGain &gt; 50) { // Only show alert for significant gains
            setProactiveOptimizationAlert(result.data);
        }
      }
    };

    const optimizationInterval = setInterval(checkForOptimization, 900000); // Check every 15 minutes
    return () =&gt; clearInterval(optimizationInterval);

  }, [jobs, technicians, isLoadingData, isMockMode, company, userProfile, appId, proactiveOptimizationAlert]);
  
  const handleProactiveAssign = async (suggestion: AssignmentSuggestion) =&gt; {
    if (!suggestion.job || !suggestion.suggestedTechnicianDetails || !suggestion.suggestion || !db || !userProfile?.companyId || !appId) return;
    
    setProactiveSuggestion(null);
    setJobForAIAssign(suggestion.job);
    setIsAIAssignDialogOpen(true);
  };

  const handleAIAssign = useCallback((job: Job) =&gt; {
    if (technicians.length === 0) {
      toast({ title: "Cannot Assign", description: "There are no technicians available.", variant: "default" });
      return;
    }
    setJobForAIAssign(job);
    setIsAIAssignDialogOpen(true);
  }, [technicians, toast]);

  const handleOpenChat = (job: Job) =&gt; {
    setSelectedChatJob(job);
    setIsChatOpen(true);
  };
  
  const kpiData = useMemo(() =&gt; {
    const unassignedJobs = jobs.filter(j =&gt; j.status === 'Unassigned');
    const today = new Date();
    const jobsForToday = jobs.filter(j =&gt; j.scheduledTime &amp;&amp; isSameDay(new Date(j.scheduledTime), today));
    const completedToday = jobsForToday.filter(j =&gt; j.status === 'Completed' || j.status === 'Finished');
    const scheduledUnfinished = jobsForToday.filter(j =&gt; j.status !== 'Completed' &amp;&amp; j.status !== 'Finished' &amp;&amp; j.status !== 'Cancelled');
    
    const totalProfitToday = completedToday.reduce((acc, job) =&gt; acc + (job.actualProfit || 0), 0);
    const potentialProfitToday = scheduledUnfinished.reduce((acc, job) =&gt; acc + (job.quotedValue || 0), 0);
    
    return {
        highPriorityCount: unassignedJobs.filter(j =&gt; j.priority === 'High').length,
        pendingCount: unassignedJobs.length,
        availableTechnicians: technicians.filter(t =&gt; t.isAvailable).length,
        jobsScheduledToday: jobsForToday.length,
        totalProfitToday,
        potentialProfitToday,
    };
  }, [jobs, technicians]);

  const filteredJobs = useMemo(() =&gt; {
    let tempJobs = jobs;

    if (jobSearchTerm) {
        const lowercasedTerm = jobSearchTerm.toLowerCase();
        tempJobs = tempJobs.filter(job =&gt; {
            return (
                job.title.toLowerCase().includes(lowercasedTerm) ||
                job.description?.toLowerCase().includes(lowercasedTerm) ||
                job.customerName.toLowerCase().includes(lowercasedTerm) ||
                (job.location.address &amp;&amp; job.location.address.toLowerCase().includes(lowercasedTerm)) ||
                (job.requiredSkills &amp;&amp; job.requiredSkills.some(skill =&gt; skill.toLowerCase().includes(lowercasedTerm)))
            );
        });
    }

    if (jobFilterId) {
        return tempJobs.filter(job =&gt; job.id === jobFilterId);
    }
    
    if (statusFilter.length &gt; 0 || priorityFilter.length &gt; 0) {
        return tempJobs.filter(job =&gt; {
            const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(job.priority);
            const statusMatch = statusFilter.length === 0 || statusFilter.includes(job.status);
            return priorityMatch &amp;&amp; statusMatch;
        });
    }

    return tempJobs;
  }, [jobs, statusFilter, priorityFilter, jobFilterId, jobSearchTerm]);

  const sortedJobs = useMemo(() =&gt; {
    const technicianMap = new Map(technicians.map(t =&gt; [t.id, t.name]));
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 } as Record&lt;JobPriority, number&gt;;
    const statusOrder = { 'Draft': 0, 'Unassigned': 1, 'Assigned': 2, 'En Route': 3, 'In Progress': 4, 'Completed': 5, 'Pending Invoice': 6, 'Finished': 7, 'Cancelled': 8 } as Record&lt;JobStatus, number&gt;;

    return [...filteredJobs].sort((a, b) =&gt; {
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
            case 'profit':
                const profitA = a.profitScore ?? -Infinity;
                const profitB = b.profitScore ?? -Infinity;
                return profitB - profitA;
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });
  }, [filteredJobs, sortOrder, technicians]);

  const filteredTechnicians = useMemo(() =&gt; {
    const sorted = [...technicians].sort((a, b) =&gt; {
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
    return sorted.filter(tech =&gt; {
      const isAvailableMatch = lowercasedTerm === 'available' &amp;&amp; tech.isAvailable;
      const isUnavailableMatch = (lowercasedTerm === 'unavailable' || lowercasedTerm === 'busy') &amp;&amp; !tech.isAvailable;
      const nameMatch = tech.name.toLowerCase().includes(lowercasedTerm);
      const skillMatch = tech.skills?.some(skill =&gt; skill.toLowerCase().includes(lowercasedTerm));
      return isAvailableMatch || isUnavailableMatch || nameMatch || skillMatch;
    });
  }, [technicians, technicianSearchTerm]);

  const unassignedJobsForBatchAssign = useMemo(() =&gt; jobs.filter(job =&gt; job.status === 'Unassigned'), [jobs]);
  const unassignedJobsCount = unassignedJobsForBatchAssign.length;
  
  const defaultMapCenter = technicians.length &gt; 0 &amp;&amp; technicians[0].location
    ? { lat: technicians[0].location.latitude, lng: technicians[0].location.longitude }
    : { lat: 39.8283, lng: -98.5795 }; 

  const handleBatchAIAssign = useCallback(async () =&gt; {
    if (isMockMode) {
      const currentUnassignedJobs = jobs.filter(job =&gt; job.status === 'Unassigned');
      if (currentUnassignedJobs.length === 0 || technicians.length === 0) {
        toast({ title: "AI Batch Assign", description: "No unassigned jobs or technicians available.", variant: "default" });
        return;
      }
      setIsBatchLoading(true);
      
      const tempTechnicianSchedules: Record&lt;string, { start: Date, end: Date }[]&gt; = 
        Object.fromEntries(technicians.map(t =&gt; [t.id, []]));

      const suggestions: AssignmentSuggestion[] = currentUnassignedJobs.map(job =&gt; {
        const { requiredSkills = [], estimatedDurationMinutes = 60 } = job;
        
        let bestTech: Technician | null = null;
        let earliestTime: Date | null = null;
        
        for (const tech of technicians) {
            const hasSkills = requiredSkills.length === 0 || requiredSkills.every(skill =&gt; tech.skills.includes(skill));
            if (!hasSkills) continue;
            
            const techSchedule = tempTechnicianSchedules[tech.id];
            
            // Simplified check: find first available slot today, assuming 9-5 work day
            let proposedStartTime = new Date();
            proposedStartTime.setHours(9, 0, 0, 0);

            let slotFound = false;
            while(proposedStartTime.getHours() &lt; 17) {
                const proposedEndTime = addMinutes(proposedStartTime, estimatedDurationMinutes);
                const isOverlapping = techSchedule.some(slot =&gt; 
                    (proposedStartTime &lt; slot.end &amp;&amp; proposedEndTime &gt; slot.start)
                );
                
                if (!isOverlapping) {
                    slotFound = true;
                    break;
                }
                
                proposedStartTime = addMinutes(proposedStartTime, 15);
            }

            if (slotFound &amp;&amp; (!earliestTime || proposedStartTime &lt; earliestTime)) {
                bestTech = tech;
                earliestTime = proposedStartTime;
            }
        }

        if (bestTech &amp;&amp; earliestTime) {
            tempTechnicianSchedules[bestTech.id].push({
                start: earliestTime,
                end: addMinutes(earliestTime, estimatedDurationMinutes)
            });
            return {
                job,
                suggestion: {
                  suggestions: [{
                      suggestedTechnicianId: bestTech.id,
                      reasoning: `Mock Mode: Assigned to ${bestTech.name} at ${format(earliestTime, 'p')} based on availability and skills.`,
                      profitScore: Math.random() * 200 + 50,
                  }],
                  overallReasoning: ''
                },
                suggestedTechnicianDetails: bestTech,
                error: null
            };
        } else {
            return {
                job,
                suggestion: null,
                suggestedTechnicianDetails: null,
                error: "Mock Mode: No available technician with required skills or open time slot found."
            };
        }
      });
      
      setAssignmentSuggestionsForReview(suggestions);
      setIsBatchReviewDialogOpen(true);
      setIsBatchLoading(false);
      return;
    }

    if (!appId) return;
    const currentUnassignedJobs = jobs.filter(job =&gt; job.status === 'Unassigned');
    if (currentUnassignedJobs.length === 0 || technicians.length === 0) {
      toast({ title: "AI Batch Assign", description: "No unassigned jobs or no technicians available for assignment.", variant: "default" });
      return;
    }
    setIsBatchLoading(true);
    setAssignmentSuggestionsForReview([]);
    
    let tempTechnicianPool = JSON.parse(JSON.stringify(technicians));

    const suggestions = await Promise.all(currentUnassignedJobs.map(async (job) =&gt; {
        const aiTechnicians: AITechnician[] = tempTechnicianPool.map((t: Technician) =&gt; ({
            technicianId: t.id,
            technicianName: t.name,
            isAvailable: t.isAvailable,
            skills: t.skills || [],
            liveLocation: t.location,
            homeBaseLocation: company?.settings?.address ? { address: company.settings.address, latitude: 0, longitude: 0 } : t.location,
            currentJobs: jobs.filter(j =&gt; j.assignedTechnicianId === t.id &amp;&amp; UNCOMPLETED_STATUSES_LIST.includes(j.status)).map(j =&gt; ({ jobId: j.id, scheduledTime: j.scheduledTime, priority: j.priority, location: j.location })),
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
        if (result.data?.suggestions &amp;&amp; result.data.suggestions.length &gt; 0) {
            techDetails = tempTechnicianPool.find((t: Technician) =&gt; t.id === result.data!.suggestions[0].suggestedTechnicianId) || null;
            if (techDetails &amp;&amp; techDetails.isAvailable) {
                tempTechnicianPool = tempTechnicianPool.map((t: Technician) =&gt; t.id === techDetails!.id ? { ...t, isAvailable: false, currentJobId: job.id } : t);
            }
        }
        return { job, suggestion: result.data, suggestedTechnicianDetails: techDetails, error: result.error };
    }));

    setAssignmentSuggestionsForReview(suggestions);
    setIsBatchReviewDialogOpen(true);
    setIsBatchLoading(false);
  }, [jobs, technicians, toast, appId, company, UNCOMPLETED_STATUSES_LIST, isMockMode]);

  const handleConfirmBatchAssignments = async (assignmentsToConfirm: FinalAssignment[]) =&gt; {
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
        if (assignmentsMade &gt; 0) {
          toast({ title: "AI Batch Assignment Success", description: `${assignmentsMade} jobs have been assigned.` });
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
  
  const handleMarkTechnicianUnavailable = async (technicianId: string, reason?: string, unavailableFrom?: string, unavailableUntil?: string) =&gt; {
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
    
    setTimeout(() =&gt; {
        handleBatchAIAssign();
        setIsHandlingUnavailability(false);
    }, 1500);
  };
  
  const handleDismissRiskAlert = (technicianId: string) =&gt; {
    setRiskAlerts(prev =&gt; prev.filter(alert =&gt; alert.technician.id !== technicianId));
  };
  
  const handleLocationSearch = (location: { address: string; lat: number; lng: number }) =&gt; {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'overview-map');
    params.set('lat', location.lat.toString());
    params.set('lng', location.lng.toString());
    params.set('address', location.address);
    router.push(`?${params.toString()}`);
  };
  
  const handleViewOnMap = (location: Location) =&gt; {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'overview-map');
    params.set('lat', location.latitude.toString());
    params.set('lng', location.longitude.toString());
    params.set('address', location.address || '');
    router.push(`?${params.toString()}`);
  };

  const handleToggleOnCall = async (technicianId: string, isOnCall: boolean) =&gt; {
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
  
  const handleAIAssignSuccess = () =&gt; {};

  const handleShareTracking = (job: Job) =&gt; {
    setJobToShare(job);
    setIsShareTrackingOpen(true);
  };

  const handleSkillsUpdated = () =&gt; {
      if(userProfile?.companyId) {
        fetchSkills(userProfile.companyId);
      }
  };

  const handlePartsUpdated = () =&gt; {
    if(userProfile?.companyId) {
      fetchParts(userProfile.companyId);
    }
  }
  
  const handleFleetOptimize = async () =&gt; {
    if (!userProfile?.companyId || !appId) return;

    setIsFleetOptimizing(true);
    setFleetOptimizationResult(null);

    const start = startOfDay(new Date());
    const end = endOfDay(new Date());

    const jobsForToday = jobs.filter(job =&gt; {
        if (!job.scheduledTime) return false;
        const jobDate = new Date(job.scheduledTime);
        return jobDate &gt;= start &amp;&amp; jobDate &lt;= end;
    });
    
    const unassignedJobsForToday = jobsForToday.filter(j =&gt; j.status === 'Unassigned');
    const assignedJobsForToday = jobsForToday.filter(j =&gt; j.status === 'Assigned' || j.status === 'In Progress');

    const result = await runFleetOptimizationAction({
      companyId: userProfile.companyId,
      appId,
      currentTime: new Date().toISOString(),
      pendingJobs: unassignedJobsForToday,
      technicians: technicians.map(t =&gt; ({
        ...t,
        jobs: assignedJobsForToday
          .filter(j =&gt; j.assignedTechnicianId === t.id)
      })),
    });

    setIsFleetOptimizing(false);
    if (result.error) {
      toast({ title: 'Optimization Failed', description: result.error, variant: 'destructive' });
    } else if (result.data) {
      setFleetOptimizationResult(result.data);
      if(result.data.suggestedChanges) {
        setSelectedFleetChanges(result.data.suggestedChanges);
      }
      setIsFleetOptimizationDialogOpen(true);
    } else {
      toast({ title: 'Optimization Complete', description: 'No significant improvements could be found at this time.', variant: 'default' });
    }
  };
  
  const handleScheduleChange = useCallback((jobId: string, newTechnicianId: string, newScheduledTime: string) =&gt; {
      setProposedJobs(prev =&gt; {
          const existingIndex = prev.findIndex(p =&gt; p.id === jobId);
          const originalJob = jobs.find(j =&gt; j.id === jobId);
          if (!originalJob) return prev;

          const newJob = { ...originalJob, assignedTechnicianId: newTechnicianId, scheduledTime: newScheduledTime };
          if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = newJob;
              return updated;
          }
          return [...prev, newJob];
      });
  }, [jobs]);
  
  const handleSaveSchedule = async () =&gt; {
    if (isMockMode) {
        toast({ title: "Schedule Saved (Mock)" });
        setJobs(prevJobs =&gt; {
            const proposedMap = new Map(proposedJobs.map(p =&gt; [p.id, p]));
            return prevJobs.map(job =&gt; proposedMap.has(job.id) ? proposedMap.get(job.id)! : job);
        });
        setProposedJobs([]);
        return;
    }
    
    if (!appId || !userProfile?.companyId) return;
    setIsSavingSchedule(true);
    const batch = writeBatch(db);
    
    proposedJobs.forEach(job =&gt; {
        const jobRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
        batch.update(jobRef, {
            assignedTechnicianId: job.assignedTechnicianId,
            scheduledTime: job.scheduledTime,
            updatedAt: serverTimestamp(),
            notes: arrayUnion(`(Manually rescheduled by dispatcher on ${new Date().toLocaleDateString()})`),
        });
    });

    try {
        await batch.commit();
        toast({ title: "Schedule Saved", description: `${proposedJobs.length} job(s) have been updated.` });
        setProposedJobs([]);
    } catch (e) {
        console.error("Failed to save schedule changes", e);
        toast({ title: "Error Saving Schedule", description: "Could not save changes.", variant: "destructive" });
    } finally {
        setIsSavingSchedule(false);
    }
  };


  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }));

  const handleDragStart = (event: DragStartEvent) =&gt; {
    const { active } = event;
    const item = jobs.find(j =&gt; j.id === active.id) || technicians.find(t =&gt; t.id === active.id);
    if(item &amp;&amp; 'title' in item) { // It's a job
        setActiveDragItem(item);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) =&gt; {
    setActiveDragItem(null);
    const { active, over } = event;
    
    if (active.data.current?.type === 'schedule-job') {
        return;
    }
    
    if (over &amp;&amp; active.data.current?.type === 'job' &amp;&amp; over.data.current?.type === 'technician') {
        const jobId = active.id as string;
        const techId = over.id as string;
        
        if (isMockMode) {
            setJobs(prevJobs =&gt; prevJobs.map(j =&gt; j.id === jobId ? { ...j, assignedTechnicianId: techId, status: 'Assigned' } : j));
            toast({ title: "Job Assigned (Mock)", description: `Job assigned to new technician.` });
            return;
        }

        const job = active.data.current.job as Job;
        const technician = over.data.current.technician as Technician;

        if (job.assignedTechnicianId === technician.id) return;
        
        setIsLoadingData(true);
        const result = await reassignJobAction({
            companyId: job.companyId,
            appId: appId!,
            jobId: job.id,
            newTechnicianId: technician.id,
            reason: 'Manual drag-and-drop assignment'
        });
        setIsLoadingData(false);

        if (result.error) {
            toast({ title: "Assignment Failed", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Job Reassigned", description: `${job.title} assigned to ${technician.name}.` });
        }
    }
  };


  if (authLoading || isLoadingData) { 
    return (
      &lt;div className="flex h-full items-center justify-center"&gt;
        &lt;Loader2 className="h-12 w-12 animate-spin text-primary" /&gt;
      &lt;/div&gt;
    );
  }

  return (
    &lt;DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() =&gt; setActiveDragItem(null)}
    &gt;
      &lt;div className="space-y-6"&gt;
        {!isMockMode &amp;&amp; showGettingStarted &amp;&amp; technicians.length === 0 &amp;&amp; userProfile?.role === 'admin' &amp;&amp; (
          &lt;GettingStartedChecklist
            onOpenAddJobDialog={() =&gt; setIsAddEditDialogOpen(true)}
            onSeedData={handleSeedData}
            onSwitchToScheduleTab={() =&gt; setActiveTab('schedule')}
            onDismiss={() =&gt; {
              setShowGettingStarted(false);
              localStorage.setItem('getting_started_dismissed', 'true');
            }}
            isLoading={isLoadingData}
          /&gt;
        )}
        &lt;SmartJobAllocationDialog
          jobToAssign={jobForAIAssign}
          technicians={technicians}
          jobs={jobs}
          isOpen={isAIAssignDialogOpen}
          setIsOpen={setIsAIAssignDialogOpen}
          onJobAssigned={handleAIAssignSuccess}
        /&gt;
        {isAdmin &amp;&amp; (
            &lt;AddEditTechnicianDialog
                isOpen={isAddEditTechnicianDialogOpen}
                onClose={() =&gt; setIsAddEditTechnicianDialogOpen(false)}
                technician={selectedTechnicianForEdit}
                allSkills={allSkills.map(s =&gt; s.name)}
                allParts={allParts}
            /&gt;
        )}
        {canEditJobs &amp;&amp; (
          &lt;AddEditJobDialog
              isOpen={isAddEditDialogOpen}
              onClose={() =&gt; setIsAddEditDialogOpen(false)}
              job={null}
              jobs={jobs}
              technicians={technicians}
              customers={customers}
              contracts={contracts}
              allSkills={allSkills.map(s =&gt; s.name)}
              allParts={allParts}
              onManageSkills={() =&gt; setIsManageSkillsOpen(true)}
              onManageParts={() =&gt; setIsManagePartsOpen(true)}
          /&gt;
        )}
      {appId &amp;&amp; &lt;ChatSheet 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
          job={selectedChatJob} 
          technician={technicians.find(t =&gt; t.id === selectedChatJob?.assignedTechnicianId) || null}
          appId={appId}
      /&gt;}
      {appId &amp;&amp; &lt;ShareTrackingDialog 
          isOpen={isShareTrackingOpen}
          setIsOpen={setIsShareTrackingOpen}
          job={jobToShare}
          technicians={technicians}
      /&gt;}
      
       {riskAlerts.map(alert =&gt; (
          &lt;ScheduleRiskAlert 
            key={alert.technician.id} 
            riskAlert={alert}
            onDismiss={handleDismissRiskAlert}
            technicians={technicians}
            jobs={jobs}
          /&gt;
        ))}

        {proactiveSuggestion &amp;&amp; (
            &lt;Alert variant="default" className="border-amber-400 bg-amber-50 text-amber-900"&gt;
                &lt;Bot className="h-4 w-4 text-amber-600" /&gt;
                &lt;AlertTitle className="font-headline text-amber-900 flex justify-between items-center"&gt;
                    &lt;span&gt;AI Proactive Suggestion&lt;/span&gt;
                    &lt;Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() =&gt; setProactiveSuggestion(null)}&gt;&lt;X className="h-4 w-4" /&gt;&lt;/Button&gt;
                &lt;/AlertTitle&gt;
                &lt;AlertDescription className="text-amber-800"&gt;
                    A new high-priority job "&lt;strong&gt;{proactiveSuggestion.job.title}&lt;/strong&gt;" was just created.
                    &lt;p className="text-xs italic mt-1"&gt;"{proactiveSuggestion.suggestion?.overallReasoning}"&lt;/p&gt;
                &lt;/AlertDescription&gt;
                &lt;div className="mt-4 flex gap-2"&gt;
                    &lt;Button 
                        size="sm" 
                        variant="default"
                        className="bg-amber-500 hover:bg-amber-600"
                        onClick={() =&gt; handleProactiveAssign(proactiveSuggestion)}
                        disabled={isProcessingProactive || !proactiveSuggestion.suggestedTechnicianDetails}
                    &gt;
                        {isProcessingProactive ? &lt;Loader2 className="mr-2 h-4 w-4 animate-spin"/&gt; : &lt;UserCheck className="mr-2 h-4 w-4" /&gt;}
                        Review &amp; Assign to {proactiveSuggestion.suggestedTechnicianDetails?.name || 'Suggested'}
                    &lt;/Button&gt;
                     &lt;Button size="sm" variant="outline" onClick={() =&gt; router.push(`/job/${proactiveSuggestion.job.id}`)}&gt;
                        &lt;Edit className="mr-2 h-4 w-4"/&gt;
                        View Details
                    &lt;/Button&gt;
                &lt;/div&gt;
            &lt;/Alert&gt;
        )}
        
         {proactiveOptimizationAlert &amp;&amp; (
            &lt;Alert variant="default" className="border-sky-400 bg-sky-50 text-sky-900"&gt;
                &lt;Bot className="h-4 w-4 text-sky-600" /&gt;
                &lt;AlertTitle className="font-headline text-sky-900 flex justify-between items-center"&gt;
                    &lt;span&gt;AI Optimization Opportunity&lt;/span&gt;
                    &lt;Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() =&gt; setProactiveOptimizationAlert(null)}&gt;&lt;X className="h-4 w-4" /&gt;&lt;/Button&gt;
                &lt;/AlertTitle&gt;
                &lt;AlertDescription className="text-sky-800"&gt;
                    The AI has found a way to optimize today's schedule to increase overall profit.
                    &lt;p className="text-xs italic mt-1"&gt;"{proactiveOptimizationAlert.overallReasoning}"&lt;/p&gt;
                &lt;/AlertDescription&gt;
                &lt;div className="mt-4"&gt;
                    &lt;Button 
                        size="sm" 
                        variant="default"
                        className="bg-sky-500 hover:bg-sky-600"
                        onClick={() =&gt; {
                          setFleetOptimizationResult(proactiveOptimizationAlert);
                          setIsFleetOptimizationDialogOpen(true);
                          setProactiveOptimizationAlert(null);
                        }}
                    &gt;
                        &lt;Shuffle className="mr-2 h-4 w-4" /&gt;
                        Review Changes
                    &lt;/Button&gt;
                &lt;/div&gt;
            &lt;/Alert&gt;
        )}

      &lt;div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"&gt;
        &lt;h1 className="text-3xl font-bold tracking-tight font-headline"&gt;
          {t('dashboard')}
        &lt;/h1&gt;
        &lt;div className="flex flex-wrap gap-2 w-full sm:w-auto"&gt;
           {isAdmin &amp;&amp; (
            &lt;Button variant="outline" className="w-full sm:w-auto" onClick={() =&gt; setIsImportJobsOpen(true)}&gt;
                &lt;FileSpreadsheet className="mr-2 h-4 w-4" /&gt; {t('import_jobs')}
            &lt;/Button&gt;
           )}
           {canEditJobs &amp;&amp; (
            &lt;Button onClick={() =&gt; setIsAddEditDialogOpen(true)} className="w-full sm:w-auto"&gt;
                &lt;PlusCircle className="mr-2 h-4 w-4" /&gt; {t('add_new_job')}
            &lt;/Button&gt;
           )}
        &lt;/div&gt;
      &lt;/div&gt;
      
       &lt;div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"&gt;
            &lt;Card&gt;
                &lt;CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"&gt;
                    &lt;CardTitle className="text-sm font-medium"&gt;{t('high_priority_queue')}&lt;/CardTitle&gt;
                    &lt;AlertTriangle className="h-4 w-4 text-destructive" /&gt;
                &lt;/CardHeader&gt;
                &lt;CardContent&gt;
                    &lt;div className="text-2xl font-bold"&gt;{kpiData.highPriorityCount}&lt;/div&gt;
                    &lt;p className="text-xs text-muted-foreground"&gt;{t('high_priority_desc')}&lt;/p&gt;
                &lt;/CardContent&gt;
            &lt;/Card&gt;
            &lt;Card&gt;
                &lt;CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"&gt;
                    &lt;CardTitle className="text-sm font-medium"&gt;Jobs Scheduled Today&lt;/CardTitle&gt;
                    &lt;CalendarDays className="h-4 w-4 text-muted-foreground" /&gt;
                &lt;/CardHeader&gt;
                &lt;CardContent&gt;
                    &lt;div className="text-2xl font-bold"&gt;{kpiData.jobsScheduledToday}&lt;/div&gt;
                    &lt;p className="text-xs text-muted-foreground"&gt;Total appointments for today&lt;/p&gt;
                &lt;/CardContent&gt;
            &lt;/Card&gt;
            &lt;Card&gt;
                &lt;CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"&gt;
                    &lt;CardTitle className="text-sm font-medium"&gt;{t('available_technicians')}&lt;/CardTitle&gt;
                    &lt;Users className="h-4 w-4 text-muted-foreground" /&gt;
                &lt;/CardHeader&gt;
                &lt;CardContent&gt;
                    &lt;div className="text-2xl font-bold"&gt;{kpiData.availableTechnicians}&lt;/div&gt;
                    &lt;p className="text-xs text-muted-foreground"&gt;{t('available_technicians_desc')}&lt;/p&gt;
                &lt;/CardContent&gt;
            &lt;/Card&gt;
            &lt;Card&gt;
                &lt;CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"&gt;
                    &lt;CardTitle className="text-sm font-medium text-green-800"&gt;{t('total_profit_today')}&lt;/CardTitle&gt;
                    &lt;TrendingUp className="h-4 w-4 text-green-600" /&gt;
                &lt;/CardHeader&gt;
                &lt;CardContent&gt;
                    &lt;div className="text-2xl font-bold text-green-700"&gt;${kpiData.totalProfitToday.toFixed(2)}&lt;/div&gt;
                    &lt;p className="text-xs text-muted-foreground"&gt;
                        of ${kpiData.potentialProfitToday.toFixed(2)} potential
                    &lt;/p&gt;
                    {kpiData.potentialProfitToday &gt; 0 &amp;&amp; (
                        &lt;Progress value={(kpiData.totalProfitToday / kpiData.potentialProfitToday) * 100} className="mt-2 h-2" /&gt;
                    )}
                &lt;/CardContent&gt;
            &lt;/Card&gt;
        &lt;/div&gt;
      
      &lt;Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"&gt;
        &lt;TabsList className="h-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"&gt;
          &lt;TabsTrigger value="job-list" className="hover:bg-secondary"&gt;
            &lt;div className="flex items-center gap-2"&gt;
                {t('job_list')}
                {unassignedJobsCount &gt; 0 &amp;&amp; &lt;Badge variant="default" className="h-5"&gt;{unassignedJobsCount}&lt;/Badge&gt;}
            &lt;/div&gt;
          &lt;/TabsTrigger&gt;
          &lt;TabsTrigger value="schedule" className="hover:bg-secondary"&gt;{t('schedule')}&lt;/TabsTrigger&gt;
          &lt;TabsTrigger value="technicians" className="hover:bg-secondary"&gt;
            &lt;div className="flex items-center gap-2"&gt;
                {t('technicians')}
                {profileChangeRequests.length &gt; 0 &amp;&amp; &lt;Badge variant="default" className="h-5"&gt;{profileChangeRequests.length}&lt;/Badge&gt;}
            &lt;/div&gt;
          &lt;/TabsTrigger&gt;
          &lt;TabsTrigger value="overview-map" className="hover:bg-secondary"&gt;{t('overview_map')}&lt;/TabsTrigger&gt;
        &lt;/TabsList&gt;

        &lt;TabsContent value="job-list" className="mt-4"&gt;
          &lt;Card&gt;
            &lt;CardHeader&gt;
                &lt;div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"&gt;
                    &lt;div&gt;
                        &lt;CardTitle&gt;{t('current_jobs')}&lt;/CardTitle&gt;
                        &lt;CardDescription&gt;{t('current_jobs_desc')}&lt;/CardDescription&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/CardHeader&gt;
            &lt;CardContent&gt;
                &lt;div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"&gt;
                    &lt;div className="space-y-1 lg:col-span-2"&gt;
                        &lt;Label htmlFor="job-search"&gt;Search&lt;/Label&gt;
                        &lt;div className="relative"&gt;
                            &lt;Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /&gt;
                            &lt;Input
                                id="job-search"
                                placeholder="Search jobs, customers, skills..."
                                value={jobSearchTerm}
                                onChange={(e) =&gt; setJobSearchTerm(e.target.value)}
                                className="pl-8"
                            /&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                    &lt;div className="space-y-1"&gt;
                        &lt;Label htmlFor="status-filter"&gt;{t('status')}&lt;/Label&gt;
                        &lt;MultiSelectFilter
                            options={statusOptions}
                            selected={statusFilter}
                            onChange={handleStatusFilterChange}
                            placeholder="Filter by Status"
                        /&gt;
                    &lt;/div&gt;
                    &lt;div className="space-y-1"&gt;
                        &lt;Label htmlFor="priority-filter"&gt;{t('priority')}&lt;/Label&gt;
                        &lt;MultiSelectFilter
                            options={priorityOptions}
                            selected={priorityFilter}
                            onChange={setPriorityFilter}
                            placeholder="Filter by Priority"
                        /&gt;
                    &lt;/div&gt;
                    &lt;div className="space-y-1"&gt;
                        &lt;Label htmlFor="sort-order"&gt;{t('sort_by')}&lt;/Label&gt;
                        &lt;Select value={sortOrder} onValueChange={(value: SortOrder) =&gt; setSortOrder(value)}&gt;
                            &lt;SelectTrigger id="sort-order"&gt;&lt;div className="flex items-center gap-1.5"&gt;&lt;ArrowDownUp className="h-3 w-3"/&gt; &lt;SelectValue placeholder="Sort Order" /&gt;&lt;/div&gt;&lt;/SelectTrigger&gt;
                            &lt;SelectContent&gt;
                            &lt;SelectItem value="status"&gt;{t('sort_by_status')}&lt;/SelectItem&gt;
                            &lt;SelectItem value="priority"&gt;{t('sort_by_priority')}&lt;/SelectItem&gt;
                            &lt;SelectItem value="technician"&gt;{t('sort_by_technician')}&lt;/SelectItem&gt;
                            &lt;SelectItem value="customer"&gt;{t('sort_by_customer')}&lt;/SelectItem&gt;
                            &lt;SelectItem value="scheduledTime"&gt;{t('sort_by_scheduled_time')}&lt;/SelectItem&gt;
                             &lt;SelectItem value="profit"&gt;Profit&lt;/SelectItem&gt;
                            &lt;/SelectContent&gt;
                        &lt;/Select&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
              &lt;div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4"&gt;
                &lt;div className="flex items-center space-x-2"&gt;
                    &lt;Switch
                        id="open-tasks-toggle"
                        checked={showOpenTasksOnly}
                        onCheckedChange={handleOpenTasksToggle}
                    /&gt;
                    &lt;Label htmlFor="open-tasks-toggle" className="flex items-center gap-1.5 whitespace-nowrap"&gt;&lt;ListFilter className="h-4 w-4"/&gt;Show Open Tasks Only&lt;/Label&gt;
                &lt;/div&gt;
                 &lt;TooltipProvider&gt;
                    &lt;Tooltip&gt;
                        &lt;TooltipTrigger asChild&gt;
                            &lt;Button 
                                variant="default" 
                                onClick={handleBatchAIAssign} 
                                disabled={unassignedJobsCount === 0 || isBatchLoading || !(company?.settings?.featureFlags?.autoDispatchEnabled ?? true)}
                                className="w-full sm:w-auto"
                                &gt;
                                {isBatchLoading ? &lt;Loader2 className="mr-2 h-4 w-4 animate-spin" /&gt; : &lt;Bot className="mr-2 h-4 w-4" /&gt;}
                                AI Batch Assign ({unassignedJobsCount})
                            &lt;/Button&gt;
                        &lt;/TooltipTrigger&gt;
                        {!(company?.settings?.featureFlags?.autoDispatchEnabled ?? true) &amp;&amp; (
                            &lt;TooltipContent&gt;
                                &lt;p&gt;This feature is disabled in company settings.&lt;/p&gt;
                            &lt;/TooltipContent&gt;
                        )}
                    &lt;/Tooltip&gt;
                 &lt;/TooltipProvider&gt;
              &lt;/div&gt;
              &lt;div className="space-y-4 mt-4"&gt;
                {sortedJobs.length &gt; 0 ? (
                  sortedJobs.map(job =&gt; (
                    &lt;JobListItem 
                      key={job.id} 
                      job={job} 
                      technicians={technicians}
                      onOpenChat={handleOpenChat}
                      onAIAssign={handleAIAssign}
                      onViewOnMap={handleViewOnMap}
                      onShareTracking={handleShareTracking}
                    /&gt;
                  ))
                ) : (
                  &lt;Alert&gt;
                    &lt;AlertTriangle className="h-4 w-4" /&gt;
                    &lt;AlertTitle&gt;{t('no_jobs_found')}&lt;/AlertTitle&gt;
                    &lt;AlertDescription&gt;{t('no_jobs_found_desc')}&lt;/AlertDescription&gt;
                  &lt;/Alert&gt;
                )}
              &lt;/div&gt;
            &lt;/CardContent&gt;
          &lt;/Card&gt;
        &lt;/TabsContent&gt;

        &lt;TabsContent value="schedule" className="mt-4"&gt;
          &lt;ScheduleCalendarView
            jobs={jobs}
            technicians={technicians}
            unassignedJobs={unassignedJobsForBatchAssign}
            onJobClick={(job) =&gt; router.push(`/job/${job.id}`)}
            onFleetOptimize={handleFleetOptimize}
            isFleetOptimizing={isFleetOptimizing}
            optimizationResult={fleetOptimizationResult}
            isFleetOptimizationDialogOpen={isFleetOptimizationDialogOpen}
            setIsFleetOptimizationDialogOpen={setIsFleetOptimizationDialogOpen}
            selectedFleetChanges={selectedFleetChanges}
            setSelectedFleetChanges={setSelectedFleetChanges}
            onScheduleChange={handleScheduleChange}
            proposedJobs={proposedJobs}
            isSaving={isSavingSchedule}
            onSave={handleSaveSchedule}
            onCancel={() =&gt; setProposedJobs([])}
          /&gt;
        &lt;/TabsContent&gt;

        &lt;TabsContent value="technicians" className="mt-4"&gt;
            &lt;Card&gt;
                &lt;CardHeader&gt;
                    &lt;div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"&gt;
                        &lt;div&gt;
                            &lt;CardTitle&gt;Technician Roster&lt;/CardTitle&gt;
                            &lt;CardDescription&gt;Manage your team of field technicians. Drag jobs from the Job List onto a technician to assign.&lt;/CardDescription&gt;
                        &lt;/div&gt;
                        &lt;div className="flex items-center gap-2"&gt;
                             &lt;div className="flex items-center gap-1 p-1 bg-muted rounded-md"&gt;
                                &lt;Button size="icon" variant={technicianViewMode === 'grid' ? 'default' : 'ghost'} onClick={() =&gt; setTechnicianViewMode('grid')}&gt;&lt;Grid className="h-4 w-4" /&gt;&lt;/Button&gt;
                                &lt;Button size="icon" variant={technicianViewMode === 'list' ? 'default' : 'ghost'} onClick={() =&gt; setTechnicianViewMode('list')}&gt;&lt;List className="h-4 w-4" /&gt;&lt;/Button&gt;
                            &lt;/div&gt;
                             &lt;Button variant="outline" onClick={() =&gt; setIsManagePartsOpen(true)}&gt;
                                &lt;Package className="mr-2 h-4 w-4" /&gt; Manage Parts
                            &lt;/Button&gt;
                             &lt;Button variant="outline" onClick={() =&gt; setIsManageSkillsOpen(true)}&gt;
                                &lt;Settings className="mr-2 h-4 w-4" /&gt; Manage Skills
                            &lt;/Button&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/CardHeader&gt;
                &lt;CardContent&gt;
                    &lt;div className="mb-4"&gt;
                        &lt;div className="relative"&gt;
                            &lt;Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /&gt;
                            &lt;Input
                                id="technician-search"
                                placeholder="Search by name, skill, or availability..."
                                value={technicianSearchTerm}
                                onChange={(e) =&gt; setTechnicianSearchTerm(e.target.value)}
                                className="pl-8"
                            /&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                    {profileChangeRequests.length &gt; 0 &amp;&amp; &lt;ProfileChangeRequests requests={profileChangeRequests} onAction={() =&gt; {}} /&gt;}
                    
                    {technicianViewMode === 'grid' ? (
                        &lt;div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"&gt;
                            {filteredTechnicians.length &gt; 0 ? (
                            filteredTechnicians.map(technician =&gt; (
                                &lt;TechnicianCard 
                                key={technician.id} 
                                technician={technician} 
                                jobs={jobs}
                                onEdit={handleOpenEditTechnician}
                                onMarkUnavailable={handleMarkTechnicianUnavailable}
                                onViewOnMap={handleViewOnMap}
                                onToggleOnCall={handleToggleOnCall}
                                isUpdatingOnCall={isUpdatingOnCall}
                                /&gt;
                            ))
                            ) : (
                            &lt;Alert className="md:col-span-2 lg:col-span-3"&gt;
                                &lt;AlertTriangle className="h-4 w-4" /&gt;
                                &lt;AlertTitle&gt;No Technicians Found&lt;/AlertTitle&gt;
                                &lt;AlertDescription&gt;
                                Your search returned no results.
                                &lt;/AlertDescription&gt;
                            &lt;/Alert&gt;
                            )}
                        &lt;/div&gt;
                    ) : (
                         &lt;div className="border rounded-lg"&gt;
                            &lt;Table&gt;
                                &lt;TableHeader&gt;
                                    &lt;TableRow&gt;
                                        &lt;TableHead&gt;Technician&lt;/TableHead&gt;
                                        &lt;TableHead&gt;Status&lt;/TableHead&gt;
                                        &lt;TableHead&gt;Current Job&lt;/TableHead&gt;
                                        &lt;TableHead className="text-right"&gt;Actions&lt;/TableHead&gt;
                                    &lt;/TableRow&gt;
                                &lt;/TableHeader&gt;
                                &lt;TableBody&gt;
                                    {filteredTechnicians.map(tech =&gt; {
                                        const currentJob = jobs.find(j =&gt; j.id === tech.currentJobId);
                                        const avatarUrl = tech.avatarUrl || `https://picsum.photos/seed/${tech.id}/100/100`;
                                        return (
                                            &lt;TableRow key={tech.id}&gt;
                                                &lt;TableCell className="font-medium"&gt;
                                                    &lt;div className="flex items-center gap-3"&gt;
                                                        &lt;Avatar className="h-9 w-9"&gt;
                                                            &lt;AvatarImage src={avatarUrl} alt={tech.name} /&gt;
                                                            &lt;AvatarFallback&gt;{tech.name.split(' ').map(n=&gt;n[0]).join('')}&lt;/AvatarFallback&gt;
                                                        &lt;/Avatar&gt;
                                                        &lt;div className="truncate"&gt;
                                                          &lt;span className="font-medium text-sm truncate block"&gt;{tech.name}&lt;/span&gt;
                                                          &lt;span className="text-xs text-muted-foreground"&gt;{tech.email}&lt;/span&gt;
                                                        &lt;/div&gt;
                                                    &lt;/div&gt;
                                                &lt;/TableCell&gt;
                                                &lt;TableCell&gt;
                                                    &lt;div className="flex flex-col gap-1"&gt;
                                                        &lt;Badge variant={tech.isAvailable ? 'secondary' : 'default'} className={cn(tech.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}/&gt;
                                                        {tech.isOnCall &amp;&amp; &lt;Badge variant="accent"&gt;On Call&lt;/Badge&gt;}
                                                    &lt;/div&gt;
                                                &lt;/TableCell&gt;
                                                &lt;TableCell&gt;
                                                    {currentJob ? (
                                                        &lt;Link href={`/job/${currentJob.id}`} className="hover:underline text-xs"&gt;
                                                            {currentJob.title}
                                                        &lt;/Link&gt;
                                                    ) : (
                                                        &lt;span className="text-xs text-muted-foreground"&gt;{tech.isAvailable ? 'Awaiting assignment' : 'Idle'}&lt;/span&gt;
                                                    )}
                                                &lt;/TableCell&gt;
                                                &lt;TableCell className="text-right"&gt;
                                                    &lt;Button variant="ghost" size="sm" onClick={() =&gt; handleOpenEditTechnician(tech)}&gt;Edit&lt;/Button&gt;
                                                &lt;/TableCell&gt;
                                            &lt;/TableRow&gt;
                                        )
                                    })}
                                &lt;/TableBody&gt;
                            &lt;/Table&gt;
                         &lt;/div&gt;
                    )}

                &lt;/CardContent&gt;
            &lt;/Card&gt;
        &lt;/TabsContent&gt;
        
         &lt;TabsContent value="overview-map" className="mt-4"&gt;
            &lt;MapView 
                jobs={jobs} 
                technicians={technicians} 
                defaultCenter={defaultMapCenter} 
                defaultZoom={5}
                searchedLocation={searchedLocation}
            /&gt;
        &lt;/TabsContent&gt;
      &lt;/Tabs&gt;
      &lt;DragOverlay&gt;
        {activeDragItem &amp;&amp; (
            &lt;div className="rounded-md bg-background p-2 shadow-lg border border-primary"&gt;
                &lt;p className="text-sm font-semibold"&gt;{activeDragItem.title}&lt;/p&gt;
            &lt;/div&gt;
        )}
      &lt;/DragOverlay&gt;

      &lt;ManageSkillsDialog 
        isOpen={isManageSkillsOpen} 
        setIsOpen={setIsManageSkillsOpen} 
        initialSkills={allSkills}
        onSkillsUpdated={handleSkillsUpdated}
      /&gt;
      &lt;ManagePartsDialog
        isOpen={isManagePartsOpen}
        setIsOpen={setIsManagePartsOpen}
        initialParts={allParts}
        onPartsUpdated={handlePartsUpdated}
      /&gt;
      &lt;ImportJobsDialog 
        isOpen={isImportJobsOpen} 
        setIsOpen={setIsImportJobsOpen} 
        onJobsImported={() =&gt; {}}
      /&gt;
      &lt;BatchAssignmentReviewDialog 
        isOpen={isBatchReviewDialogOpen} 
        setIsOpen={setIsBatchReviewDialogOpen} 
        assignmentSuggestions={assignmentSuggestionsForReview}
        technicians={technicians}
        onConfirmAssignments={handleConfirmBatchAssignments}
        isLoadingConfirmation={isLoadingBatchConfirmation}
      /&gt;
      &lt;HelpAssistant /&gt;
    &lt;/div&gt;
    &lt;/DndContext&gt;
  );
}

    