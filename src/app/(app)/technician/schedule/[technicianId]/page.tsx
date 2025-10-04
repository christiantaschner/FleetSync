
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, JobStatus } from '@/types';
import { Loader2, ArrowLeft, Briefcase, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { mockJobs } from '@/lib/mock-data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, startOfToday } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Function to group jobs by date string
const groupJobsByDay = (jobs: Job[]) => {
  return jobs.reduce((acc, job) => {
    if (!job.scheduledTime) return acc;
    const date = format(new Date(job.scheduledTime), 'PPPP');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(job);
    return acc;
  }, {} as Record<string, Job[]>);
};


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
    const today = startOfToday();
    
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
                  data[key] = (data[key] as any).toDate().toISOString();
              }
          }
          return { id: doc.id, ...data } as Job;
      }).filter(job => job.scheduledTime && new Date(job.scheduledTime) >= today);
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
  
  const groupedJobs = groupJobsByDay(assignedJobs);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-headline">Full Schedule</h1>
        </div>
        {Object.keys(groupedJobs).length === 0 ? (
             <div className="text-center py-12">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  All Clear!
                </h3>
                <p className="text-muted-foreground mt-1">You have no upcoming jobs scheduled.</p>
            </div>
        ) : (
             <Accordion type="single" collapsible defaultValue={Object.keys(groupedJobs)[0]}>
                {Object.entries(groupedJobs).map(([date, jobsForDay]) => (
                    <AccordionItem value={date} key={date}>
                        <AccordionTrigger className="font-bold text-lg">{date}</AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-4 pt-2">
                                {jobsForDay.map(job => (
                                    <Link href={`/technician/${job.id}`} key={job.id} className="block">
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-primary">{format(new Date(job.scheduledTime!), 'p')}</p>
                                                    <Badge variant={job.priority === 'High' ? 'destructive' : 'default'} className="shrink-0">{job.priority}</Badge>
                                                </div>
                                                <h4 className="font-semibold">{job.title}</h4>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4" /> {job.customerName}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Clock className="h-4 w-4" /> Est. {job.estimatedDurationMinutes} mins
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
        )}
    </div>
  );
}

