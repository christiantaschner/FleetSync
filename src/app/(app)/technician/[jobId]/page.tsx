
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Job, JobStatus, Technician, ChecklistResult } from '@/types';
import { ArrowLeft, Edit3, Camera, ListChecks, AlertTriangle, Loader2, Navigation, Star, Smile, ThumbsUp, Timer, Pause, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import JobDetailsDisplay from './components/job-details-display';
import StatusUpdateActions from './components/status-update-actions';
import WorkDocumentationForm from './components/work-documentation-form';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ChatCard from './components/ChatCard';
import { useAuth } from '@/contexts/auth-context';
import TroubleshootingCard from './components/TroubleshootingCard';
import ChecklistCard from './components/ChecklistCard';

export default function TechnicianJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [isFirstTimeFix, setIsFirstTimeFix] = useState<boolean | null>(null);
  const [reasonForFollowUp, setReasonForFollowUp] = useState('');

  const isBreakActive = job?.status === 'In Progress' && job.breaks?.some(b => !b.end);

  useEffect(() => {
    if (!jobId || !db || !user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    
    const fetchJobAndTechnician = async () => {
      try {
        const jobDocRef = doc(db, "jobs", jobId);
        const jobDocSnap = await getDoc(jobDocRef);

        if (jobDocSnap.exists()) {
          const jobData = jobDocSnap.data();
          for (const key in jobData) {
              if (jobData[key] && typeof jobData[key].toDate === 'function') {
                  jobData[key] = jobData[key].toDate().toISOString();
              }
          }
          const fetchedJob = { id: jobDocSnap.id, ...jobData } as Job;
          setJob(fetchedJob);
          
          if (typeof fetchedJob.isFirstTimeFix === 'boolean') {
            setIsFirstTimeFix(fetchedJob.isFirstTimeFix);
          }

          // Fetch the technician details using the current user's UID
          const techDocRef = doc(db, "technicians", user.uid);
          const techDocSnap = await getDoc(techDocRef);
          if (techDocSnap.exists()) {
              setTechnician({ id: techDocSnap.id, ...techDocSnap.data() } as Technician);
          } else {
              toast({ title: "Error", description: "Technician profile not found.", variant: "destructive" });
          }

        } else {
          toast({ title: "Error", description: "Job not found.", variant: "destructive" });
          router.push('/technician');
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
        toast({ title: "Error", description: "Could not fetch job details.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobAndTechnician();
  }, [jobId, router, toast, user]);

  const handleStatusUpdate = async (newStatus: JobStatus) => {
    if (!job || !db || isUpdating) return;
    
    if (isBreakActive) {
      toast({ title: "Cannot Change Status", description: "Please end your current break before changing the job status.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    const jobDocRef = doc(db, "jobs", job.id);
    try {
      const updatePayload: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      const newTimestamp = new Date().toISOString();
      let updatedJobState: Partial<Job> = { status: newStatus, updatedAt: newTimestamp };

      if (newStatus === 'En Route') {
        updatePayload.enRouteAt = serverTimestamp();
        updatedJobState.enRouteAt = newTimestamp;
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
        const techDocRef = doc(db, "technicians", job.assignedTechnicianId);
        await updateDoc(techDocRef, {
          isAvailable: true,
          currentJobId: null,
        });
      }
      
      setJob(prevJob => prevJob ? { ...prevJob, ...updatedJobState } : null);
      toast({ title: "Status Updated", description: `Job status set to ${newStatus}.`});
    } catch (error) {
      console.error("Error updating job status:", error);
      toast({ title: "Error", description: "Could not update job status.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWorkDocumented = async (notes: string, photos: File[], signatureDataUrl: string | null, satisfactionScore: number) => {
    if (!job || !db || !storage || isUpdating) return;

    setIsUpdating(true);
    const jobDocRef = doc(db, "jobs", job.id);
    let newPhotoUrls: string[] = [];
    let newSignatureUrl: string | null = null;

    try {
      // 1. Upload Photos
      if (photos.length > 0) {
        const photoUploadPromises = photos.map(async (photo) => {
          const photoRef = ref(storage, `job-photos/${job.id}/${Date.now()}-${photo.name}`);
          await uploadBytes(photoRef, photo);
          return getDownloadURL(photoRef);
        });
        newPhotoUrls = await Promise.all(photoUploadPromises);
      }

      // 2. Upload Signature
      if (signatureDataUrl) {
        const signatureRef = ref(storage, `signatures/${job.id}.png`);
        await uploadString(signatureRef, signatureDataUrl, 'data_url');
        newSignatureUrl = await getDownloadURL(signatureRef);
      }

      // 3. Update Firestore Document
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };
      if (notes.trim()) {
        updateData.notes = `${job.notes ? job.notes + '\n\n' : ''}Technician Notes:\n${notes.trim()}`;
      }
      if (newPhotoUrls.length > 0) {
        updateData.photos = arrayUnion(...newPhotoUrls);
      }
      if (newSignatureUrl) {
        updateData.customerSignatureUrl = newSignatureUrl;
        updateData.customerSignatureTimestamp = new Date().toISOString();
      }
      if (satisfactionScore > 0) {
        updateData.customerSatisfactionScore = satisfactionScore;
      }

      await updateDoc(jobDocRef, updateData);
      
      // 4. Update local state
      setJob(prevJob => {
        if (!prevJob) return null;
        return {
          ...prevJob,
          notes: updateData.notes !== undefined ? updateData.notes : prevJob.notes,
          photos: newPhotoUrls.length > 0 ? [...(prevJob.photos || []), ...newPhotoUrls] : prevJob.photos,
          customerSignatureUrl: newSignatureUrl || prevJob.customerSignatureUrl,
          customerSignatureTimestamp: newSignatureUrl ? updateData.customerSignatureTimestamp : prevJob.customerSignatureTimestamp,
          customerSatisfactionScore: satisfactionScore > 0 ? satisfactionScore : prevJob.customerSatisfactionScore,
          updatedAt: new Date().toISOString(),
        };
      });
      toast({ title: "Success", description: "Work documentation saved."});

    } catch (error) {
      console.error("Error documenting work:", error);
      toast({ title: "Error", description: "Could not save work documentation.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };
  
   const handleFtfrSubmit = async () => {
    if (!job || !db || isUpdating || isFirstTimeFix === null) return;
    if (isFirstTimeFix === false && !reasonForFollowUp.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for the follow-up.", variant: "destructive"});
      return;
    }

    setIsUpdating(true);
    const jobDocRef = doc(db, "jobs", job.id);
    try {
      await updateDoc(jobDocRef, {
        isFirstTimeFix: isFirstTimeFix,
        reasonForFollowUp: isFirstTimeFix ? '' : reasonForFollowUp,
        updatedAt: serverTimestamp(),
      });
      setJob(prevJob => prevJob ? { ...prevJob, isFirstTimeFix, reasonForFollowUp: isFirstTimeFix ? '' : reasonForFollowUp } : null);
      toast({ title: "FTFR Data Saved", description: "First-Time-Fix information has been recorded." });
    } catch (error) {
      console.error("Error submitting FTFR data:", error);
      toast({ title: "Error", description: "Could not save FTFR data.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBreak = async () => {
    if (!job || !db || isUpdating) return;

    setIsUpdating(true);
    const jobDocRef = doc(db, "jobs", job.id);
    const now = new Date().toISOString();
    const currentBreaks = job.breaks || [];

    try {
      let updatedBreaks;
      if (isBreakActive) {
        // Ending a break
        toast({ title: "Resuming Work" });
        updatedBreaks = currentBreaks.map((b, index) => {
          if (index === currentBreaks.length - 1 && !b.end) {
            return { ...b, end: now };
          }
          return b;
        });
      } else {
        // Starting a new break
        toast({ title: "Break Started" });
        updatedBreaks = [...currentBreaks, { start: now }];
      }
      
      await updateDoc(jobDocRef, {
        breaks: updatedBreaks,
        updatedAt: serverTimestamp(),
      });
      
      setJob(prev => prev ? { ...prev, breaks: updatedBreaks, updatedAt: now } : null);
      
    } catch(error) {
       console.error("Error updating break status:", error);
      toast({ title: "Error", description: "Could not update break status.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChecklistSubmit = async (results: ChecklistResult[]) => {
    if (!job || !db || isUpdating) return;
    setIsUpdating(true);
    const jobDocRef = doc(db, "jobs", job.id);
    try {
      await updateDoc(jobDocRef, {
        checklistResults: results,
        updatedAt: serverTimestamp(),
      });
      setJob(prev => prev ? { ...prev, checklistResults: results, updatedAt: new Date().toISOString() } : null);
      toast({ title: "Checklist Saved", description: "Pre-work safety checks are complete."});
    } catch (error) {
      console.error("Error submitting checklist:", error);
      toast({ title: "Error", description: "Could not save checklist.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNavigate = () => {
    if (job?.location?.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location.address)}`;
      window.open(mapsUrl, '_blank');
    } else if (job?.location) {
        const mapsUrl = `https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`;
        window.open(mapsUrl, '_blank');
    } else {
        toast({ title: "Navigation Error", description: "No address or coordinates available for this job.", variant: "destructive"});
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (!job || !technician) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Job Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The job you are looking for does not exist or could not be loaded.
        </p>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const isJobConcluded = job.status === 'Completed' || job.status === 'Cancelled';
  const isChecklistComplete = !!job.checklistResults && job.checklistResults.length > 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs
        </Button>
        <Button variant="default" size="sm" onClick={handleNavigate}>
          <Navigation className="mr-2 h-4 w-4" /> Navigate to Job
        </Button>
      </div>
      
      { isUpdating && <div className="fixed top-4 right-4 z-50"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> }

      <JobDetailsDisplay job={job} />

      {!isJobConcluded && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><ListChecks /> Update Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-center">
            <StatusUpdateActions 
                currentStatus={job.status} 
                onUpdateStatus={handleStatusUpdate} 
                isChecklistComplete={isChecklistComplete} 
            />
            {job.status === 'In Progress' && (
              <Button
                variant={isBreakActive ? "destructive" : "outline"}
                onClick={handleToggleBreak}
                disabled={isUpdating}
              >
                {isBreakActive ? <Play className="mr-2 h-4 w-4"/> : <Pause className="mr-2 h-4 w-4"/>}
                {isBreakActive ? 'End Break' : 'Start Break'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {job && (job.status === 'Assigned' || job.status === 'En Route') && (
        <ChecklistCard 
            job={job}
            onSubmit={handleChecklistSubmit}
            isUpdating={isUpdating}
        />
      )}

      {job && technician && !isJobConcluded && (
        <ChatCard job={job} technician={technician} />
      )}

      {job.status === 'In Progress' && (
        <TroubleshootingCard jobTitle={job.title} />
      )}
      
      {job.status === 'In Progress' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Edit3 /> Document Work &amp; Get Signature</CardTitle>
            <CardDescription>Add notes, photos, and capture customer rating and signature before completing the job.</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkDocumentationForm 
              onSubmit={handleWorkDocumented} 
              isSubmitting={isUpdating} 
              initialSatisfactionScore={job.customerSatisfactionScore}
            />
          </CardContent>
        </Card>
      )}

      {job.status === 'Completed' && (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><ThumbsUp /> First-Time-Fix Rate</CardTitle>
            <CardDescription>Help us improve by providing details on this job's outcome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <RadioGroup
                value={isFirstTimeFix === null ? '' : isFirstTimeFix.toString()}
                onValueChange={(value) => setIsFirstTimeFix(value === 'true')}
                disabled={typeof job.isFirstTimeFix === 'boolean' || isUpdating}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="ftfr-yes" />
                  <Label htmlFor="ftfr-yes">Yes, the issue was resolved in one visit.</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="ftfr-no" />
                  <Label htmlFor="ftfr-no">No, a follow-up visit is required.</Label>
                </div>
              </RadioGroup>

              {isFirstTimeFix === false && (
                <div className="space-y-2 pl-2">
                  <Label htmlFor="follow-up-reason">Reason for follow-up</Label>
                  <Textarea
                    id="follow-up-reason"
                    value={reasonForFollowUp}
                    onChange={(e) => setReasonForFollowUp(e.target.value)}
                    placeholder="e.g., Missing part, requires senior technician, etc."
                    disabled={typeof job.isFirstTimeFix === 'boolean' || isUpdating}
                  />
                </div>
              )}

              <Button
                onClick={handleFtfrSubmit}
                disabled={isFirstTimeFix === null || typeof job.isFirstTimeFix === 'boolean' || isUpdating}
              >
                {isUpdating && typeof job.isFirstTimeFix !== 'boolean' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {typeof job.isFirstTimeFix === 'boolean' ? 'Data Saved' : 'Save Fix Status'}
              </Button>
          </CardContent>
        </Card>
        </>
      )}

      {job.photos && job.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Camera /> Uploaded Photos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {job.photos.map((photoUrl, index) => (
              <a href={photoUrl} target="_blank" rel="noopener noreferrer" key={index} className="relative aspect-square rounded-md overflow-hidden border group">
                <Image src={photoUrl} alt={`Job photo ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="work site service" onError={(e) => e.currentTarget.src = 'https://placehold.co/300x300.png?text=Preview'} />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <p className="text-xs">View Full</p>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
