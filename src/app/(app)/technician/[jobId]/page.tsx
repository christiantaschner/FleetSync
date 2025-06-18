
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Job, Technician, JobStatus } from '@/types'; // Added JobStatus
import { ArrowLeft, MapPin, UserCircle, Phone, Clock, Edit3, Camera, ListChecks, AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  // Technician details might not be strictly needed on this page if not displayed,
  // but could be fetched if, e.g., you need to verify the assigned tech.
  // const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      const jobDocRef = doc(db, "jobs", job.id);
      try {
        await updateDoc(jobDocRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
        
        // If job is completed or cancelled, update technician status
        if ((newStatus === 'Completed' || newStatus === 'Cancelled') && job.assignedTechnicianId) {
          const techDocRef = doc(db, "technicians", job.assignedTechnicianId);
          await updateDoc(techDocRef, {
            isAvailable: true,
            currentJobId: null, // Or use Firestore.FieldValue.delete()
          });
        }
        
        setJob(prevJob => prevJob ? { ...prevJob, status: newStatus, updatedAt: new Date().toISOString() } : null);
        // Success toast removed as per guidelines (only for errors)
      } catch (error) {
        console.error("Error updating job status:", error);
        toast({ title: "Error", description: "Could not update job status.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleWorkDocumented = async (notes: string, photos: File[]) => {
     if (job && db) {
      // In a real app, 'photos' would be uploaded to Firebase Storage, then store URLs.
      // For now, we're simulating by storing local blob URLs which won't persist across sessions/users.
      // This part needs Firebase Storage integration for real photo persistence.
      setIsLoading(true);
      const photoUrls = photos.map(p => URL.createObjectURL(p)); // MOCK URL creation for UI
      
      const jobDocRef = doc(db, "jobs", job.id);
      try {
        const updateData: any = {
            updatedAt: serverTimestamp(),
        };
        if (notes.trim()) {
            updateData.notes = `${job.notes ? job.notes + '\n\n' : ''}Technician Notes:\n${notes.trim()}`;
        }
        // For photos, if you were storing URLs from Firebase Storage, you'd add them here.
        // Using arrayUnion to add to existing photos, if any.
        // This assumes `job.photos` is an array of strings (URLs).
        if (photoUrls.length > 0) {
            updateData.photos = arrayUnion(...photoUrls);
        }

        await updateDoc(jobDocRef, updateData);

        setJob(prevJob => prevJob ? { 
          ...prevJob, 
          notes: updateData.notes !== undefined ? updateData.notes : prevJob.notes,
          photos: photoUrls.length > 0 ? [...(prevJob.photos || []), ...photoUrls] : prevJob.photos,
          updatedAt: new Date().toISOString() 
        } : null);
        // Success toast removed
      } catch (error) {
        console.error("Error documenting work:", error);
        toast({ title: "Error", description: "Could not save work documentation.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
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

  if (!job) {
    // This case should ideally be handled by the redirect in useEffect if job not found.
    // But as a fallback:
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
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs
      </Button>

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
          <CardDescription>Add notes and photos for this job. Photos are temporary for this demo.</CardDescription>
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
