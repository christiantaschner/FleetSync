
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Job, Technician, JobStatus } from '@/types'; // Added JobStatus
import { ArrowLeft, MapPin, Edit3, Camera, ListChecks, AlertTriangle, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import JobDetailsDisplay from './components/job-details-display';
import StatusUpdateActions from './components/status-update-actions';
import WorkDocumentationForm from './components/work-documentation-form';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore'; // Import Firestore functions
import { useToast } from '@/hooks/use-toast';

export default function TechnicianJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // For specific actions

  useEffect(() => {
    if (!jobId || !db) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const jobDocRef = doc(db, "jobs", jobId);

    const fetchJob = async () => {
      try {
        const docSnap = await getDoc(jobDocRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
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

    fetchJob();
  }, [jobId, router, toast]);

  const handleStatusUpdate = async (newStatus: JobStatus) => {
    if (job && db) {
      setIsUpdating(true);
      const jobDocRef = doc(db, "jobs", job.id);
      try {
        await updateDoc(jobDocRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
        
        if ((newStatus === 'Completed' || newStatus === 'Cancelled') && job.assignedTechnicianId) {
          const techDocRef = doc(db, "technicians", job.assignedTechnicianId);
          await updateDoc(techDocRef, {
            isAvailable: true,
            currentJobId: null,
          });
        }
        
        setJob(prevJob => prevJob ? { ...prevJob, status: newStatus, updatedAt: new Date().toISOString() } : null);
      } catch (error) {
        console.error("Error updating job status:", error);
        toast({ title: "Error", description: "Could not update job status.", variant: "destructive" });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleWorkDocumented = async (notes: string) => {
     if (job && db) {
      setIsUpdating(true);
      const jobDocRef = doc(db, "jobs", job.id);
      try {
        const updateData: any = {
            updatedAt: serverTimestamp(),
        };
        if (notes.trim()) {
            updateData.notes = `${job.notes ? job.notes + '\n\n' : ''}Technician Notes:\n${notes.trim()}`;
        }
        
        await updateDoc(jobDocRef, updateData);

        setJob(prevJob => prevJob ? { 
          ...prevJob, 
          notes: updateData.notes !== undefined ? updateData.notes : prevJob.notes,
          updatedAt: new Date().toISOString() 
        } : null);
      } catch (error) {
        console.error("Error documenting work:", error);
        toast({ title: "Error", description: "Could not save work documentation.", variant: "destructive" });
      } finally {
        setIsUpdating(false);
      }
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
  }


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
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

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs
            </Button>
            <Button variant="default" size="sm" onClick={handleNavigate}>
                <Navigation className="mr-2 h-4 w-4" /> Navigate to Job
            </Button>
        </div>

      { isUpdating && <div className="fixed top-4 right-4 z-50"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> }

      <JobDetailsDisplay job={job} />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><ListChecks /> Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusUpdateActions currentStatus={job.status} onUpdateStatus={handleStatusUpdate} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Edit3 /> Document Work</CardTitle>
          <CardDescription>Add notes for this job. These notes will be visible to the dispatcher.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkDocumentationForm onSubmit={handleWorkDocumented} />
        </CardContent>
      </Card>

      {job.photos && job.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Camera /> Uploaded Photos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {job.photos.map((photoUrl, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                <Image src={photoUrl} alt={`Job photo ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="work site service" onError={(e) => e.currentTarget.src = 'https://placehold.co/300x300.png?text=Preview'} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
