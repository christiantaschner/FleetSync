
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, JobStatus, Technician, ChecklistResult } from '@/types';
import { ArrowLeft, Edit3, Camera, ListChecks, AlertTriangle, Loader2, Navigation, Star, Smile, ThumbsUp, Timer, Pause, Play, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import JobDetailsDisplay from './components/JobDetailsDisplay';
import WorkDocumentationForm from './components/WorkDocumentationForm';
import ChecklistCard from './components/ChecklistCard';
import TroubleshootingCard from './components/TroubleshootingCard';
import CustomerHistoryCard from './components/CustomerHistoryCard';

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { calculateTravelMetricsAction, notifyCustomerAction } from '@/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ChatSheet from '@/app/(app)/dashboard/components/ChatSheet';

const JobActionsCard = ({ job, onToggleBreak, onNavigate, isBreakActive, isUpdating }: { job: Job, onToggleBreak: () => void, onNavigate: () => void, isBreakActive: boolean, isUpdating: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Job Actions</CardTitle>
            <CardDescription>Tools for your active job.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex flex-wrap gap-2 items-center">
                <Button variant={isBreakActive ? "destructive" : "outline"} onClick={onToggleBreak} disabled={isUpdating}>
                    {isBreakActive ? <Play className="mr-2 h-4 w-4"/> : <Pause className="mr-2 h-4 w-4"/>}
                    {isBreakActive ? 'End Break' : 'Start Break'}
                </Button>
                 <Button variant="outline" onClick={onNavigate}>
                    <Navigation className="mr-2 h-4 w-4" /> Navigate
                </Button>
            </div>
            <div className="border-t pt-4">
                <TroubleshootingCard jobTitle={job.title} />
            </div>
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

  const isBreakActive = job?.status === 'In Progress' && job?.breaks?.some(b => !b.end);
  const backUrl = userProfile?.role === 'technician' ? `/technician/jobs/${userProfile.uid}` : '/dashboard';

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (!jobId || authLoading || !user) return;

    const fetchJobAndRelatedData = async () => {
      setIsLoading(true);
      if (!db || !appId) return;
      const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobId);
      const jobDocSnap = await getDoc(jobDocRef);
      
      if (jobDocSnap.exists()) {
        const data = jobDocSnap.data();
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
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

      }
      setIsLoading(false);
    };

    fetchJobAndRelatedData();
  }, [jobId, authLoading, user, appId]);
  
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
      if (notes.trim()) updateData.notes = `${job.notes ? job.notes + '\\n\\n' : ''}Technician Notes:\\n${notes.trim()}`;
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
  const isJobConcluded = job?.status === 'Completed' || job?.status === 'Cancelled';
  
  if (isLoading || authLoading) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading job details...</p></div>;
  }
  if (!job) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center"><AlertTriangle className="h-12 w-12 text-destructive mb-4" /><h2 className="text-xl font-semibold">Job Not Found</h2><p className="text-muted-foreground mt-2">The job you are looking for does not exist or could not be loaded.</p><Button variant="outline" onClick={() => router.push(backUrl)} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></div>;
  }
  if (!technician) {
      return <div className="p-4 text-center text-destructive">Could not load technician details for this job.</div>
  }

  return (
    <div className="p-4 space-y-6">
      {appId && <ChatSheet 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
          job={job} 
          technician={technician}
          appId={appId}
      />}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs</Button>
         <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)}>
          <MessageSquare className="mr-2 h-4 w-4" /> Chat with Dispatch
        </Button>
      </div>
      
      {isUpdating && <div className="fixed top-4 right-4 z-50"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}

      <JobDetailsDisplay job={job} />
      
      {historyJobs.length > 0 && <CustomerHistoryCard jobs={historyJobs} />}

      {!isJobConcluded && job.status === 'Assigned' && <ChecklistCard job={job} onSubmit={handleChecklistSubmit} isUpdating={isUpdating} />}

      {job.status === 'In Progress' && (
        <>
            <JobActionsCard 
                job={job}
                onToggleBreak={handleToggleBreak}
                onNavigate={handleNavigate}
                isBreakActive={isBreakActive ?? false}
                isUpdating={isUpdating}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Edit3 /> Document Work</CardTitle>
                    <CardDescription>Add notes and photos before completing the job.</CardDescription>
                </CardHeader>
                <CardContent><WorkDocumentationForm onSubmit={handleWorkDocumented} isSubmitting={isUpdating} initialSatisfactionScore={job.customerSatisfactionScore} /></CardContent>
            </Card>
        </>
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
