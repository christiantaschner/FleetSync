

"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Job, Technician, Customer, Contract, Skill } from '@/types';
import { Loader2, ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import AddEditJobDialog from '@/app/(app)/dashboard/components/AddEditJobDialog'; // Re-purposing this for a modal view
import { mockJobs, mockTechnicians, mockCustomers, mockContracts } from '@/lib/mock-data';
import { PREDEFINED_SKILLS } from '@/lib/skills';

// This is now the DISPATCHER's view of a job.
// The Technician's view is at /technician/jobs/[jobId]

export default function DispatcherJobDetailPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, we'd fetch all these from context or dedicated hooks
  // For now, we'll use mocks as placeholders for the dialog to work.
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [allJobs, setAllJobs] = useState<Job[]>(mockJobs);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [allSkills, setAllSkills] = useState<string[]>(PREDEFINED_SKILLS);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (!jobId || !appId) {
      setIsLoading(false);
      return;
    }
    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobId);
    const unsubscribe = onSnapshot(jobDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() } as Job);
      } else {
        setJob(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [jobId, appId]);

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
  
  return (
    <div className="p-4">
      {/* We are re-using the AddEditJobDialog to show the job details */}
      {/* For this to be a "view", we'd ideally have a separate component, */}
      {/* but for an MVP, re-using a complex dialog is a quick way to show details. */}
      {/* The dialog will be opened by default for this page. */}
       <AddEditJobDialog
            isOpen={true}
            onClose={() => router.push('/dashboard')}
            job={job}
            jobs={allJobs}
            technicians={technicians}
            customers={customers}
            contracts={contracts}
            allSkills={allSkills}
            onManageSkills={() => {}}
        />
    </div>
  );
}
