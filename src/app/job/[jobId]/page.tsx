
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, JobStatus, Technician, ChecklistResult, CustomerData } from '@/types';
import { ArrowLeft, Edit3, Camera, ListChecks, AlertTriangle, Loader2, Navigation, Star, Smile, ThumbsUp, Timer, Pause, Play, BookOpen, Eye, History, User, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import JobDetailsDisplay from '@/app/(app)/technician/[jobId]/components/job-details-display';
import StatusUpdateActions from '@/app/(app)/technician/[jobId]/components/status-update-actions';
import WorkDocumentationForm from '@/app/(app)/technician/[jobId]/components/work-documentation-form';
import ChecklistCard from '@/app/(app)/technician/[jobId]/components/ChecklistCard';
import TroubleshootingCard from '@/app/(app)/technician/[jobId]/components/TroubleshootingCard';
import CustomerHistoryCard from '@/app/(app)/technician/[jobId]/components/CustomerHistoryCard';
import ChatCard from '@/app/(app)/technician/[jobId]/components/ChatCard';
import AddEditJobDialog from '@/app/(app)/dashboard/components/AddEditJobDialog';

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { calculateTravelMetricsAction, notifyCustomerAction } from '@/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import Link from 'next/link';

export default function UnifiedJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const { user, userProfile, company, loading: authLoading, isMockMode } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [historyJobs, setHistoryJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);

  const isBreakActive = job?.status === 'In Progress' && job?.breaks?.some(b => !b.end);
  const backUrl = userProfile?.role === 'technician' ? `/technician/jobs/${userProfile.uid}` : '/dashboard';

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (!jobId || authLoading || !user) return;

    const fetchJobAndRelatedData = async () => {
      setIsLoading(true);
      
      let fetchedJob: Job | null = null;
      let fetchedTechnician: Technician | null = null;
      let pastJobs: Job[] = [];

      if (isMockMode) {
          fetchedJob = mockJobs.find(j => j.id === jobId) || null;
          if (fetchedJob?.assignedTechnicianId) {
            fetchedTechnician = mockTechnicians.find(t => t.id === fetchedJob!.assignedTechnicianId) || null;
          }
          if (fetchedJob?.customerName) {
            pastJobs = mockJobs.filter(j => 
                j.customerName === fetchedJob!.customerName && 
                j.status === 'Completed' && 
                j.id !== jobId
            );
          }
      } else {
        if (!db || !appId) {
            setIsLoading(false);
            return;
        }
        const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobId);
        const jobDocSnap = await getDoc(jobDocRef);
        
        if (jobDocSnap.exists()) {
            const data = jobDocSnap.data();
            for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            fetchedJob = { id: jobDocSnap.id, ...data } as Job;

            if (fetchedJob.assignedTechnicianId) {
                const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, fetchedJob.assignedTechnicianId);
                const techDocSnap = await getDoc(techDocRef);
                if (techDocSnap.exists()) {
                    fetchedTechnician = { id: techDocSnap.id, ...techDocSnap.data() } as Technician;
                }
            }
            
            // Fetch history using customer ID if available, otherwise fallback
            if (fetchedJob.customerId) {
                const historyQuery = query(
                    collection(db, `artifacts/${appId}/public/data/jobs`),
                    where("customerId", "==", fetchedJob.customerId),
                    where("status", "==", "Completed"),
                    where("createdAt", "<", fetchedJob.createdAt),
                    orderBy("createdAt", "desc"),
                    limit(3)
                );
                const historySnapshot = await getDocs(historyQuery);
                pastJobs = historySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
            } else if (fetchedJob.customerEmail) { // Fallback to email
                 const historyQuery = query(
                    collection(db, `artifacts/${appId}/public/data/jobs`),
                    where("customerEmail", "==", fetchedJob.customerEmail),
                    where("status", "==", "Completed"),
                    where("createdAt", "<", fetchedJob.createdAt),
                    orderBy("createdAt", "desc"),
                    limit(3)
                );
                const historySnapshot = await getDocs(historyQuery);
                pastJobs = historySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
            }
        }
      }
      
      setJob(fetchedJob);
      setTechnician(fetchedTechnician);
      setHistoryJobs(pastJobs);
      setIsLoading(false);
    };

    fetchJobAndRelatedData();
  }, [jobId, authLoading, isMockMode, appId, user]);
  
  const handleStatusUpdate = async (newStatus: JobStatus) => {
    if (!job || !db || isUpdating || !technician || !appId) return;
    
    if (isBreakActive) {
      toast({ title: "Cannot Change Status", description: "Please end your current break before changing the job status.", variant: "destructive" });
      return;
    }
    
    if (newStatus === 'In Progress' && (!job.checklistResults || job.checklistResults.length === 0)) {
        toast({ title: "Checklist Required", description: "Please complete the pre-work safety checklist before starting the job.", variant: "destructive" });
        return;
    }

    setIsUpdating(true);
    
    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
    try {
      const updatePayload: any = { status: newStatus, updatedAt: serverTimestamp() };
      const newTimestamp = new Date().toISOString();
      let updatedJobState: Partial<Job> = { status: newStatus, updatedAt: newTimestamp };

      if (newStatus === 'En Route') {
        updatePayload.enRouteAt = serverTimestamp();
        updatedJobState.enRouteAt = newTimestamp;
        notifyCustomerAction({
            jobId: job.id, customerName: job.customerName, technicianName: technician.name,
            reasonForChange: `Your technician, ${technician.name}, is on their way.`,
            companyName: company?.name || 'our team'
        }).catch(err => console.error("Failed to send 'On My Way' notification:", err));
      }
      if (newStatus === 'In Progress') {
        updatePayload.inProgressAt = serverTimestamp();
        updatedJobState.inProgressAt = newTimestamp;
      }
      if (newStatus === 'Completed') {
        updatePayload.completedAt = serverTimestamp();
        updatedJobState.completedAt = newTimestamp;
      }

      await updateDoc(jobDocRef, updatePayload);
      
      if ((newStatus === 'Completed' || newStatus === 'Cancelled') && job.assignedTechnicianId) {
        const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
        await updateDoc(techDocRef, { isAvailable: true, currentJobId: null });
      }
      
      setJob(prevJob => prevJob ? { ...prevJob, ...updatedJobState } : null);
      toast({ title: "Status Updated", description: `Job status set to ${newStatus}.`});

      if (newStatus === 'Completed' && job.assignedTechnicianId && userProfile) {
        calculateTravelMetricsAction({ 
            companyId: userProfile.companyId!, jobId: job.id, technicianId: job.assignedTechnicianId, appId,
        }).catch(err => console.error("Failed to trigger travel metrics calculation:", err));
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      toast({ title: "Error", description: "Could not update job status.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWorkDocumented = async (notes: string, photos: File[], signatureDataUrl: string | null, satisfactionScore: number) => {
    if (!job || !db || !storage || isUpdating || !appId) return;
    setIsUpdating(true);
    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
    let newPhotoUrls: string[] = [];
    let newSignatureUrl: string | null = null;
    try {
      if (photos.length > 0) {
        newPhotoUrls = await Promise.all(photos.map(async (photo) => {
          const photoRef = ref(storage, `job-photos/${job.id}/${Date.now()}-${photo.name}`);
          await uploadBytes(photoRef, photo);
          return getDownloadURL(photoRef);
        }));
      }
      if (signatureDataUrl) {
        const signatureRef = ref(storage, `signatures/${job.id}.png`);
        await uploadString(signatureRef, signatureDataUrl, 'data_url');
        newSignatureUrl = await getDownloadURL(signatureRef);
      }
      const updateData: any = { updatedAt: serverTimestamp() };
      if (notes.trim()) updateData.notes = `${job.notes ? job.notes + '\n\n' : ''}Technician Notes:\n${notes.trim()}`;
      if (newPhotoUrls.length > 0) updateData.photos = arrayUnion(...newPhotoUrls);
      if (newSignatureUrl) {
        updateData.customerSignatureUrl = newSignatureUrl;
        updateData.customerSignatureTimestamp = new Date().toISOString();
      }
      if (satisfactionScore > 0) updateData.customerSatisfactionScore = satisfactionScore;
      await updateDoc(jobDocRef, updateData);
      setJob(prevJob => prevJob ? { ...prevJob, ...updateData, photos: [...(prevJob.photos || []), ...newPhotoUrls] } : null);
      toast({ title: "Success", description: "Work documentation saved." });
    } catch (error) {
      console.error("Error documenting work:", error);
      toast({ title: "Error", description: "Could not save work documentation.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleToggleBreak = async () => {
    if (!job || !db || isUpdating || !appId) return;
    setIsUpdating(true);
    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
    const now = new Date().toISOString();
    const currentBreaks = job.breaks || [];
    let updatedBreaks;
    if (isBreakActive) {
      toast({ title: "Resuming Work" });
      updatedBreaks = currentBreaks.map((b, i) => i === currentBreaks.length - 1 ? { ...b, end: now } : b);
    } else {
      toast({ title: "Break Started" });
      updatedBreaks = [...currentBreaks, { start: now }];
    }
    await updateDoc(jobDocRef, { breaks: updatedBreaks, updatedAt: serverTimestamp() });
    setJob(prev => prev ? { ...prev, breaks: updatedBreaks, updatedAt: now } : null);
    setIsUpdating(false);
  };
  
  const handleNavigate = () => {
    if (job?.location?.address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location.address)}`, '_blank');
    else if (job?.location) window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`, '_blank');
    else toast({ title: "Navigation Error", description: "No address or coordinates available.", variant: "destructive"});
  };
  
  const handleChecklistSubmit = async (results: ChecklistResult[]) => {
      if (!job || !db || isUpdating || !appId) return;
      setIsUpdating(true);
      const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
      await updateDoc(jobDocRef, { checklistResults: results, updatedAt: serverTimestamp() });
      setJob(prev => prev ? { ...prev, checklistResults: results, updatedAt: new Date().toISOString() } : null);
      toast({ title: "Checklist Saved", description: "You are cleared to start the job." });
      setIsUpdating(false);
  };

  const isAssignedToCurrentUser = user?.uid === job?.assignedTechnicianId;
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
  const canPerformActions = isAssignedToCurrentUser || (isMockMode && userProfile?.role === 'technician');
  const isJobConcluded = job?.status === 'Completed' || job?.status === 'Cancelled';

  if (isLoading || authLoading) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading job details...</p></div>;
  }
  if (!job) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center"><AlertTriangle className="h-12 w-12 text-destructive mb-4" /><h2 className="text-xl font-semibold">Job Not Found</h2><p className="text-muted-foreground mt-2">The job you are looking for does not exist or could not be loaded.</p><Button variant="outline" onClick={() => router.push(backUrl)} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <AddEditJobDialog isOpen={isAddJobDialogOpen} onClose={() => setIsAddJobDialogOpen(false)} job={job} jobs={[job]} technicians={technician ? [technician] : []} allSkills={PREDEFINED_SKILLS} customers={[]} contracts={[]} />
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
        <div className="flex items-center gap-2">
            {isAdmin && <Button variant="secondary" size="sm" onClick={() => setIsAddJobDialogOpen(true)}><Edit3 className="mr-2 h-4 w-4" /> Edit Job</Button>}
            {job.customerId && isAdmin && (
                <Link href={`/customers?search=${encodeURIComponent(job.customerName)}`}>
                    <Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4"/> Customer History</Button>
                </Link>
            )}
            <Button variant="default" size="sm" onClick={handleNavigate}><Navigation className="mr-2 h-4 w-4" /> Navigate</Button>
        </div>
      </div>
      
      {isUpdating && <div className="fixed top-4 right-4 z-50"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}

      <JobDetailsDisplay job={job} />
      <CustomerHistoryCard jobs={historyJobs} />
      
      {technician && !isJobConcluded && appId && (
        <ChatCard job={job} technician={technician} appId={appId} />
      )}
      
      {(job.status === 'In Progress' || job.status === 'Completed') && (
        <TroubleshootingCard jobTitle={job.title} />
      )}

      {canPerformActions && !isJobConcluded && (
        <>
          <ChecklistCard job={job} onSubmit={handleChecklistSubmit} isUpdating={isUpdating} />
          <Card>
            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><ListChecks /> Update Status</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center">
              <StatusUpdateActions currentStatus={job.status} onUpdateStatus={handleStatusUpdate} />
              {job.status === 'In Progress' && <Button variant={isBreakActive ? "destructive" : "outline"} onClick={handleToggleBreak} disabled={isUpdating}>{isBreakActive ? <Play className="mr-2 h-4 w-4"/> : <Pause className="mr-2 h-4 w-4"/>}{isBreakActive ? 'End Break' : 'Start Break'}</Button>}
            </CardContent>
          </Card>
        </>
      )}

      {canPerformActions && (job.status === 'In Progress' || job.status === 'Completed') && (
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Edit3 /> Document Work & Get Signature</CardTitle><CardDescription>Add notes, photos, and capture customer rating and signature before completing the job.</CardDescription></CardHeader>
          <CardContent><WorkDocumentationForm onSubmit={handleWorkDocumented} isSubmitting={isUpdating} initialSatisfactionScore={job.customerSatisfactionScore} /></CardContent>
        </Card>
      )}
    </div>
  );
}
