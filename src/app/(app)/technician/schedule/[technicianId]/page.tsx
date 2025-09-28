
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, Technician, JobStatus } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import { startOfToday } from 'date-fns';
import DailyTimeline from '../../jobs/[technicianId]/components/DailyTimeline';

export default function TechnicianSchedulePage() {
  const { userProfile, loading: authLoading, isMockMode } = useAuth();
  const params = useParams();
  const router = useRouter();
  const technicianId = params.technicianId as string;

  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (authLoading || !technicianId) return;

    if (isMockMode) {
      const jobsForTech = mockJobs
        .filter(j => j.assignedTechnicianId === technicianId)
        .sort((a,b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
      setAssignedJobs(jobsForTech);
      setIsLoading(false);
      return;
    }
    
    if (!db || !appId) return;

    const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
    
    const jobsQuery = query(
      collection(db, `artifacts/${appId}/public/data/jobs`),
      where("assignedTechnicianId", "==", technicianId),
      where("status", "in", activeJobStatuses),
      orderBy("scheduledTime")
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsForTech = querySnapshot.docs.map(doc => {
          const data = doc.data();
          for (const key in data) {
              if (data[key] && typeof data[key].toDate === 'function') {
                  data[key] = data[key].toDate().toISOString();
              }
          }
          return { id: doc.id, ...data } as Job;
      });
      setAssignedJobs(jobsForTech);
      setIsLoading(false);
    });

    return () => unsubscribeJobs();
  }, [authLoading, technicianId, isMockMode, appId]);


  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading full schedule...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-headline">Full Schedule</h1>
        </div>
        {assignedJobs.length === 0 ? (
             <div className="text-center py-12">
                <h3 className="text-lg font-semibold">All Clear!</h3>
                <p className="text-muted-foreground mt-1">You have no jobs scheduled.</p>
            </div>
        ) : (
            <DailyTimeline jobs={assignedJobs} />
        )}
    </div>
  );
}
