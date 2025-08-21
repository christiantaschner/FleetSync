"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, JobStatus, Technician } from '@/types';
import { ArrowLeft, Edit3, Camera, ListChecks, AlertTriangle, Loader2, Navigation, Star, Smile, ThumbsUp, ThumbsDown, Timer, Pause, Play, BookOpen, MessageSquare, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import JobDetailsDisplay from './components/JobDetailsDisplay';
import WorkDocumentationForm from './components/WorkDocumentationForm';
import TroubleshootingCard from './components/TroubleshootingCard';
import CustomerHistoryCard from './components/CustomerHistoryCard';
import StatusUpdateActions from './components/StatusUpdateActions';

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { calculateTravelMetricsAction, notifyCustomerAction } from '@/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ChatSheet from '@/app/(app)/dashboard/components/ChatSheet';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import SignatureCanvas from 'react-signature-canvas';


const JobActionsCard = ({ job, onToggleBreak, onNavigate, onOpenChat, isBreakActive, isUpdating }: { job: Job, onToggleBreak: () => void, onNavigate: () => void, onOpenChat: () => void, isBreakActive: boolean, isUpdating: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Job Actions</CardTitle>
            <CardDescription>Tools for your active job.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2">
             <Button variant="outline" onClick={onNavigate} className="w-full">
                <Navigation className="mr-2 h-4 w-4" /> Navigate
            </Button>
            <Button variant="outline" onClick={onOpenChat} className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" /> Chat with Dispatch
            </Button>
            <Button variant={isBreakActive ? "destructive" : "outline"} onClick={onToggleBreak} disabled={isUpdating || job.status !== 'In Progress'} className="w-full">
                {isBreakActive ? <Play className="mr-2 h-4 w-4"/> : <Pause className="mr-2 h-4 w-4"/>}
                {isBreakActive ? 'End Break' : 'Start Break'}
            </Button>
        </CardContent>
    </Card>
);


export default function TechnicianJobDetailPage() {
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [isDocumentationSaved, setIsDocumentationSaved] = useState(false);

  const isBreakActive = job?.status === 'In Progress' && job?.breaks?.some(b => !b.end);
  const backUrl = `/technician/jobs/${userProfile?.uid}`;

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (!jobId || authLoading || !user) return;
    
     if (isMockMode) {
      const mockJob = mockJobs.find(j => j.id === jobId) || null;
      setJob(mockJob);
      if (mockJob?.assignedTechnicianId) {
        setTechnician(mockTechnicians.find(t => t.id === mockJob.assignedTechnicianId) || null);
      }
      if (mockJob?.customerId) {
        setHistoryJobs(mockJobs.filter(j => j.customerId === mockJob.customerId && j.id !== mockJob.id && j.status === 'Completed'));
      }
      setIsLoading(false);
      return;
    }

    const fetchJobAndRelatedData = async () => {
      setIsLoading(true);
      if (!db || !appId) return;
      const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobId);
      const jobDocSnap = await getDoc(jobDocRef);
      
      if (jobDocSnap.exists()) {
        const data = jobDocSnap.data();
        for (const key in data) {
            if ((data[key] as any) && typeof (data[key] as any).toDate === 'function') {
                (data[key] as any) = (data[key] as any).toDate().toISOString();
            }
        }
        const fetchedJob = { id: jobDocSnap.id, ...data } as Job;
        setJob(fetchedJob);

        if (fetchedJob.assignedTechnicianId) {
          const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, fetchedJob.assignedTechnicianId);
          const techDocSnap = await getDoc(techDocRef);
          if (techDocSnap.exists()) {
            setTechnician({ id: techDocSnap.id, ...techDocSnap.data() } as Technician);
          }
        }

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
            setHistoryJobs(historySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
        }

      } else {
        setJob(null);
      }
      setIsLoading(false);
    };

    fetchJobAndRelatedData();
  }, [jobId, authLoading, user, appId, isMockMode]);
  
  const handleWorkDocumented = async (notes: string, photos: File[], signatureDataUrl: string | null, satisfactionScore: number) => {
    if (!job || !db || !storage || isUpdating || !appId) return;
    setIsUpdating(true);

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
      
      const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
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
      setIsDocumentationSaved(true);
    } catch (error) {
      console.error("Error documenting work:", error);
      toast({ title: "Error", description: "Could not save work documentation.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleToggleBreak = async () => {
    if (!job || !db || isUpdating || !appId) return;
    const currentJob = job;
    if (!currentJob) return;

    setIsUpdating(true);
    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, currentJob.id);
    const now = new Date().toISOString();
    const currentBreaks = currentJob.breaks || [];
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

  const handleStatusUpdate = async (newStatus: JobStatus) => {
    if (!job || !db || isUpdating || !technician || !appId) return;

    if (job.status === 'In Progress' && job.breaks?.some(b => !b.end)) {
        toast({ title: "Cannot Change Status", description: "Please end your current break before changing the job status.", variant: "destructive" });
        return;
    }
    
    // Logic for saving signature/satisfaction when completing
    if (newStatus === 'Completed' && !isDocumentationSaved) {
        toast({ title: "Please Save Documentation", description: "You must save documentation before completing the job.", variant: "destructive" });
        return;
    }
    
    setIsUpdating(true);
    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, job.id);
    try {
        const updatePayload: any = { status: newStatus, updatedAt: serverTimestamp() };

        if (newStatus === 'En Route') {
            updatePayload.enRouteAt = serverTimestamp();
            notifyCustomerAction({
                jobId: job.id, customerName: job.customerName, technicianName: technician.name,
                reasonForChange: `Your technician, ${technician.name}, is on their way.`,
                companyName: company?.name || 'our team'
            }).catch(err => console.error("Failed to send 'On My Way' notification:", err));
        }
        if (newStatus === 'In Progress') {
            updatePayload.inProgressAt = serverTimestamp();
        }
        if (newStatus === 'Completed') {
            updatePayload.completedAt = serverTimestamp();
        }
        
        await updateDoc(jobDocRef, updatePayload);

        if ((newStatus === 'Completed' || newStatus === 'Cancelled') && job.assignedTechnicianId) {
            const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
            await updateDoc(techDocRef, { isAvailable: true, currentJobId: null });
        } else if (newStatus !== 'Completed' && newStatus !== 'Cancelled' && job.assignedTechnicianId) {
             const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, job.assignedTechnicianId);
            await updateDoc(techDocRef, { isAvailable: false, currentJobId: job.id });
        }
        
        setJob(prev => prev ? {...prev, ...updatePayload, status: newStatus, updatedAt: new Date().toISOString() } : null);
        toast({ title: "Status Updated", description: `Job status set to ${newStatus}.` });

        if (newStatus === 'Completed' && job.assignedTechnicianId && userProfile) {
            calculateTravelMetricsAction({
                companyId: userProfile.companyId!, jobId: job.id, technicianId: job.assignedTechnicianId, appId,
            }).catch(err => console.error("Failed to trigger travel metrics calculation:", err));
        }
    } catch(e) {
        console.error("Error updating job status from detail view:", e);
        toast({ title: "Error", description: "Could not update job status.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };


  if (isLoading || authLoading) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading job details...</p></div>;
  }
  if (!job) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center"><AlertTriangle className="h-12 w-12 text-destructive mb-4" /><h2 className="text-xl font-semibold">Job Not Found</h2><p className="text-muted-foreground mt-2">The requested job could not be found.</p><Button variant="outline" onClick={() => router.push(backUrl)} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></div>;
  }
  if (!technician) {
      return <div className="p-4 text-center text-destructive">Could not load technician details for this job.</div>
  }

  return (
    <div className="space-y-4">
      {appId && <ChatSheet 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
          job={job} 
          technician={technician}
          appId={appId}
      />}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs</Button>
      </div>
      
      {isUpdating && <div className="fixed top-4 right-4 z-50"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
      
      {job.status !== 'In Progress' && (
        <div className="flex flex-wrap gap-2">
            <StatusUpdateActions 
                currentStatus={job.status} 
                onUpdateStatus={handleStatusUpdate}
                isUpdating={isUpdating}
            />
        </div>
      )}

      <JobDetailsDisplay job={job} />
      
      {historyJobs.length > 0 && <CustomerHistoryCard jobs={historyJobs} />}

      {['Assigned', 'En Route', 'In Progress'].includes(job.status) && (
        <JobActionsCard 
            job={job}
            onToggleBreak={handleToggleBreak}
            onNavigate={handleNavigate}
            onOpenChat={() => setIsChatOpen(true)}
            isBreakActive={isBreakActive ?? false}
            isUpdating={isUpdating}
        />
      )}

      {job.status === 'In Progress' && (
        <div className="space-y-4">
          <WorkDocumentationForm onSubmit={handleWorkDocumented} isSubmitting={isUpdating} initialSatisfactionScore={job.customerSatisfactionScore} />
          <div className="pt-2">
            <StatusUpdateActions 
                currentStatus={job.status} 
                onUpdateStatus={handleStatusUpdate}
                isUpdating={isUpdating}
            />
          </div>
        </div>
      )}

      {job.status === 'Completed' && (
        <Card className="bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="font-headline text-green-800">Job Complete</CardTitle>
                <CardDescription className="text-green-700">This job has been marked as completed.</CardDescription>
            </CardHeader>
        </Card>
      )}
      
       {job.status === 'Cancelled' && (
        <Card className="bg-red-50 border-red-200">
            <CardHeader>
                <CardTitle className="font-headline text-red-800">Job Cancelled</CardTitle>
                 <CardDescription className="text-red-700">This job was cancelled.</CardDescription>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}
