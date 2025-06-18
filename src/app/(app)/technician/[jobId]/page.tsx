
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import type { Job, Technician } from '@/types';
import { ArrowLeft, MapPin, UserCircle, Phone, Clock, Edit3, Camera, ListChecks, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import JobDetailsDisplay from './components/job-details-display';
import StatusUpdateActions from './components/status-update-actions';
import WorkDocumentationForm from './components/work-documentation-form';

export default function TechnicianJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  // In a real app, job and technician would be fetched based on jobId and logged-in user

  useEffect(() => {
    const foundJob = mockJobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      if (foundJob.assignedTechnicianId) {
        const foundTech = mockTechnicians.find(t => t.id === foundJob.assignedTechnicianId);
        setTechnician(foundTech || null);
      }
    } else {
      // Handle job not found, e.g., redirect or show error
      router.push('/technician');
    }
  }, [jobId, router]);

  const handleStatusUpdate = (newStatus: Job['status']) => {
    if (job) {
      // In a real app, this would be an API call
      const updatedJob = { ...job, status: newStatus, updatedAt: new Date().toISOString() };
      setJob(updatedJob);
      // Update mockJobs for consistency if navigating back/forth
      const jobIndex = mockJobs.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        mockJobs[jobIndex] = updatedJob;
      }
      // toast({ title: "Status Updated", description: `Job status changed to ${newStatus}.` });
      // Note: Toasts should only be for errors per guidelines. For success, rely on UI feedback.
    }
  };

  const handleWorkDocumented = (notes: string, photos: File[]) => {
     if (job) {
      const photoUrls = photos.map(p => URL.createObjectURL(p)); // Mock URL creation
      const updatedJob = { 
        ...job, 
        notes: `${job.notes ? job.notes + '\n' : ''}Technician Notes: ${notes}`,
        photos: [...(job.photos || []), ...photoUrls],
        updatedAt: new Date().toISOString() 
      };
      setJob(updatedJob);
      const jobIndex = mockJobs.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        mockJobs[jobIndex] = updatedJob;
      }
      // toast({ title: "Work Documented", description: "Notes and photos added to job."});
    }
  };
  
  const Loader2 = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading job details...</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
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
          <CardDescription>Add notes and photos for this job.</CardDescription>
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
                <Image src={photoUrl} alt={`Job photo ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="work site" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
