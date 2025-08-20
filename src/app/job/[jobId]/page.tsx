
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Job, Technician, Customer, Contract, Skill } from '@/types';
import { Loader2, ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { mockJobs, mockTechnicians, mockCustomers, mockContracts } from '@/lib/mock-data';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import AddEditJobDialog from '@/app/(app)/dashboard/components/AddEditJobDialog';
import JobDetailsDisplay from './components/JobDetailsDisplay';
import CustomerHistoryCard from './components/CustomerHistoryCard';
import ChatCard from './components/ChatCard';

export default function DispatcherJobDetailPage() {
  const { userProfile, loading, isMockMode } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // In a real app, we'd fetch all these from context or dedicated hooks
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
    
    if (isMockMode) {
      const mockJob = mockJobs.find(j => j.id === jobId) || null;
      setJob(mockJob);
      setIsLoading(false);
      return;
    }

    const jobDocRef = doc(db, `artifacts/${appId}/public/data/jobs`, jobId);
    const unsubscribe = onSnapshot(jobDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
            }
        }
        setJob({ id: docSnap.id, ...data } as Job);
      } else {
        setJob(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [jobId, appId, isMockMode]);

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

  return (
    <div className="space-y-6">
       <AddEditJobDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            job={job}
            jobs={allJobs}
            technicians={technicians}
            customers={customers}
            contracts={contracts}
            allSkills={allSkills}
            onManageSkills={() => {}}
        />
        <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Back to Dashboard
            </Button>
            <Button onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4"/>
                Edit Job Details
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
                <JobDetailsDisplay job={job} />
                <CustomerHistoryCard jobs={[]} />
            </div>
            <div className="lg:col-span-1 space-y-6">
                {assignedTechnician && appId && (
                    <ChatCard job={job} technician={assignedTechnician} appId={appId} />
                )}
            </div>
        </div>
    </div>
  );
}
