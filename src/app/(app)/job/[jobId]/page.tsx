
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Job, Technician, Customer, Contract, Skill, Location, JobStatus, Part } from '@/types';
import { Loader2, ArrowLeft, Edit, MapIcon, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { mockJobs, mockTechnicians, mockCustomers, mockContracts, mockParts } from '@/lib/mock-data';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import AddEditJobDialog from '@/app/(app)/dashboard/components/AddEditJobDialog';
import JobDetailsDisplay from './components/JobDetailsDisplay';
import CustomerHistoryCard from './components/CustomerHistoryCard';
import ChatCard from './components/ChatCard';
import UpsellOpportunityCard from '../../technician/[jobId]/components/UpsellOpportunityCard';
import { updateJobStatusAction } from '@/actions/job-actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateInvoicePdf } from '@/lib/pdf-utils';
import WorkDocumentationForm from '../../technician/[jobId]/components/WorkDocumentationForm';
import { addDocumentationAction } from '@/actions/job-actions';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from '@/lib/firebase';

export default function DispatcherJobDetailPage() {
  const { userProfile, company, loading, isMockMode } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [historyJobs, setHistoryJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // In a real app, we'd fetch all these from context or dedicated hooks
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
   const handleViewOnMap = (location: Location) => {
    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lng: location.longitude.toString(),
      address: location.address || ''
    });
    router.push(`/dashboard?tab=overview-map&${params.toString()}`);
  };
  
  const handleUpdateStatus = async (newStatus: JobStatus) => {
    if (!job || !appId) return;
    setIsUpdatingStatus(true);
    const result = await updateJobStatusAction({ jobId: job.id, status: newStatus, appId });
    if (result.error) {
        toast({ title: 'Status Update Failed', description: result.error, variant: 'destructive'});
    } else {
        toast({ title: 'Status Updated', description: `Job status moved to ${newStatus}.`});
        setJob(prev => prev ? {...prev, status: newStatus} : null);
    }
    setIsUpdatingStatus(false);
  };
  
  const handleGenerateInvoice = async () => {
    if (!job || !company) {
        toast({ title: "Cannot Generate Invoice", description: "Job or company data is missing.", variant: "destructive" });
        return;
    }
    
    setIsUpdatingStatus(true);
    try {
        await generateInvoicePdf(job, company);
        toast({ title: "Invoice Generated", description: `Invoice for job "${job.title}" has been downloaded.` });
        await handleUpdateStatus('Finished');
    } catch(e) {
        console.error("Error generating PDF:", e);
        toast({ title: "PDF Error", description: "Failed to generate invoice PDF.", variant: "destructive" });
    } finally {
        setIsUpdatingStatus(false);
    }
  };
  
  const handleSaveDocumentation = async (notes: string, photos: File[], isFirstTimeFix: boolean, reasonForFollowUp?: string, signatureDataUrl?: string | null, satisfactionScore?: number) => {
    if (!job || !appId) return;
    setIsUpdatingStatus(true);

    let photoUrls: string[] = [];
    let signatureUrlToSave: string | null = null;
    
    try {
      if (photos.length > 0) {
          // This part would be handled by a different action in a real app
          // For simplicity, we assume an upload function exists
          toast({ title: "Note", description: "Photo upload from this screen is a demo feature."});
      }
      
      if (signatureDataUrl) {
        const signatureRef = ref(storage, `signatures/${job.id}.png`);
        await uploadString(signatureRef, signatureDataUrl, 'data_url');
        signatureUrlToSave = await getDownloadURL(signatureRef);
      }
      
      const result = await addDocumentationAction({
        jobId: job.id,
        appId,
        notes,
        photoUrls,
        isFirstTimeFix,
        reasonForFollowUp,
        signatureUrl: signatureUrlToSave,
        satisfactionScore,
      });
      
      if(result.error) throw new Error(result.error);
      
      toast({ title: "Success", description: "Documentation saved." });
      setJob(prevJob => {
        if (!prevJob) return null;
        return {
            ...prevJob,
            notes: prevJob.notes ? `${prevJob.notes}${notes ? `\n--- ${new Date().toLocaleString()} ---\n${notes.trim()}`: ''}` : notes,
            photos: [...(prevJob.photos || []), ...photoUrls],
            isFirstTimeFix,
            reasonForFollowUp: isFirstTimeFix ? '' : (reasonForFollowUp || ''),
            customerSignatureUrl: signatureUrlToSave || prevJob.customerSignatureUrl,
            customerSatisfactionScore: satisfactionScore || prevJob.customerSatisfactionScore,
            updatedAt: new Date().toISOString()
        };
      });

    } catch (error) {
      console.error("Error documenting work:", error);
      toast({ title: "Error", description: "Could not save work documentation.", variant: "destructive" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  useEffect(() => {
    if (!jobId || !appId) {
      setIsLoading(false);
      return;
    }
    
    if (isMockMode) {
      const mockJob = mockJobs.find(j => j.id === jobId) || null;
      setJob(mockJob);
      setTechnicians(mockTechnicians);
      setAllJobs(mockJobs);
      setCustomers(mockCustomers);
      setContracts(mockContracts);
      setAllSkills(PREDEFINED_SKILLS);
      setAllParts(mockParts.map((p, i) => ({ id: `part_${i}`, name: p })));
       if (mockJob?.customerId) {
        const history = mockJobs.filter(j => j.customerId === mockJob.customerId && j.status === 'Completed' && j.id !== mockJob.id);
        setHistoryJobs(history);
      }
      setIsLoading(false);
      return;
    }

    // This is a temporary solution for the demo. 
    // In a real app, this data would be fetched from a central store or context.
    const fetchTechnicians = async () => {
        if (!userProfile?.companyId) return;
        const techsQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", userProfile.companyId));
        const snapshot = await getDocs(techsQuery);
        setTechnicians(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician)));
    };
    fetchTechnicians();


    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobId);
    const unsubscribeJob = onSnapshot(jobDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const jobData = { id: docSnap.id, ...docSnap.data() } as Job;
        for (const key in jobData) {
            if ((jobData as any)[key] && typeof (jobData as any)[key].toDate === 'function') {
                (jobData as any)[key] = (jobData as any)[key].toDate().toISOString();
            }
        }
        setJob(jobData);
        
        if (jobData.customerId) {
            const historyQuery = query(
                collection(db, `artifacts/${appId}/public/data/jobs`),
                where("customerId", "==", jobData.customerId),
                where("status", "==", "Completed"),
                where("createdAt", "<", jobData.createdAt),
                orderBy("createdAt", "desc"),
                limit(3)
            );
            const historySnapshot = await getDocs(historyQuery);
            setHistoryJobs(historySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
        }

      } else {
        setJob(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribeJob();
  }, [jobId, appId, isMockMode, userProfile]);

  if (loading || isLoading) {
     return <div className="flex h-[50vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  // Basic role guard
  if (userProfile?.role === 'technician') {
      router.replace('/dashboard');
      return <div className="flex h-[50vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  
  if (!job) {
    return (
       <div className="p-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back
        </Button>
        <div className="mt-4 p-8 border rounded-lg text-center">
            <h1 className="text-xl font-semibold">Job not found</h1>
            <p className="text-muted-foreground mt-2">
                The requested job could not be found.
            </p>
        </div>
      </div>
    )
  }
  
  const assignedTechnician = technicians.find(t => t.id === job.assignedTechnicianId);
  
  const backUrl = job.assignedTechnicianId 
    ? `/dashboard` 
    : '/dashboard';

  return (
    <div className="space-y-6 max-w-full">
       <AddEditJobDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            job={job}
            jobs={allJobs}
            technicians={technicians}
            customers={customers}
            contracts={contracts}
            allSkills={allSkills}
            allParts={allParts}
            onManageSkills={() => {}}
            onManageParts={() => {}}
        />
        <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Back
            </Button>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => handleViewOnMap(job.location)}>
                    <MapIcon className="mr-2 h-4 w-4"/>
                    View on Map
                </Button>
                 {job.status === 'Completed' ? (
                     <Button onClick={() => handleUpdateStatus('Pending Invoice')} disabled={isUpdatingStatus}>
                        {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <DollarSign className="mr-2 h-4 w-4" />}
                        Set as Pending Invoice
                    </Button>
                 ) : job.status === 'Pending Invoice' ? (
                     <Button onClick={handleGenerateInvoice} disabled={isUpdatingStatus} className="bg-green-600 hover:bg-green-700">
                        {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Generate Invoice & Finish
                    </Button>
                 ) : job.status !== 'Finished' && job.status !== 'Cancelled' ? (
                    <Button onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        Edit Job Details
                    </Button>
                 ) : null}
            </div>
        </div>
        <div className="space-y-6">
            {job.status === 'Finished' && (
              <Alert variant="default" className="border-green-600/50 bg-green-50/50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="font-semibold text-green-800">Job Finished</AlertTitle>
                <AlertDescription className="text-green-700">
                    This job has been completed and invoiced. No further actions are required.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                  <JobDetailsDisplay job={job} technician={assignedTechnician} />
                  <WorkDocumentationForm onSubmit={handleSaveDocumentation} isSubmitting={isUpdatingStatus} />
                  {job.upsellReasoning && (
                    <UpsellOpportunityCard job={job} />
                  )}
              </div>
              <div className="space-y-6">
                  <CustomerHistoryCard jobs={historyJobs} />
                   {assignedTechnician && appId && (
                      <ChatCard job={job} technician={assignedTechnician} appId={appId} />
                  )}
              </div>
            </div>
        </div>
    </div>
  );
}
