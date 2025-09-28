
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, JobStatus, Technician } from '@/types';
import { Loader2, ArrowLeft, Sun, Moon, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import { startOfToday } from 'date-fns';
import DailyTimeline from './components/DailyTimeline';
import { OfflineIndicator } from './components/OfflineIndicator';
import GeoFenceWatcher from './components/GeoFenceWatcher';
import { updateJobStatusAction } from '@/actions/job-actions';

export default function TechnicianJobsPage() {
    const { userProfile, loading: authLoading, isMockMode } = useAuth();
    const params = useParams();
    const router = useRouter();
    const technicianId = params.technicianId as string;

    const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
    const [technician, setTechnician] = useState<Technician | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // This page is for the logged-in tech if not admin, or the selected tech if admin.
    const isViewingOwnPage = userProfile?.uid === technicianId;

    useEffect(() => {
        if (authLoading || !technicianId) return;

        if (isMockMode) {
            const jobsForTech = mockJobs
                .filter(j => j.assignedTechnicianId === technicianId)
                .sort((a,b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
            setAssignedJobs(jobsForTech);
            setTechnician(mockTechnicians.find(t => t.id === technicianId) || null);
            setIsLoading(false);
            return;
        }

        if (!db || !appId) return;

        // Fetch technician details
        const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, technicianId);
        const unsubscribeTech = onSnapshot(techDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setTechnician({ id: docSnap.id, ...docSnap.data() } as Technician);
            }
        });

        const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
        
        const jobsQuery = query(
            collection(db, `artifacts/${appId}/public/data/jobs`),
            where("assignedTechnicianId", "==", technicianId),
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
            });
            const today = startOfToday();
            // Filter to show only today's and future jobs
            setAssignedJobs(jobsForTech.filter(j => j.scheduledTime && new Date(j.scheduledTime) >= today));
            setIsLoading(false);
        });

        return () => {
            unsubscribeJobs();
            unsubscribeTech();
        };
    }, [authLoading, technicianId, isMockMode, appId]);
    
    const handleStatusUpdate = async (jobId: string, newStatus: JobStatus) => {
        if (!appId) return;
        
        await updateJobStatusAction({ jobId, status: newStatus, appId });
        // The onSnapshot listener will automatically update the UI.
    };
    
    const jobsForToday = assignedJobs.filter(job => job.scheduledTime && isToday(new Date(job.scheduledTime)));
    const currentOrNextJob = jobsForToday.find(job => job.status === 'Assigned' || job.status === 'En Route');
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }

    if (isLoading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading your schedule...</p>
            </div>
        );
    }
    
    const backButtonUrl = userProfile?.role === 'admin' ? '/dashboard?tab=technicians' : '/';
    
    if (!technician) {
         return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold">Technician Not Found</h2>
                <p className="text-muted-foreground mt-2">The requested technician could not be found.</p>
                <Button variant="outline" onClick={() => router.push(backButtonUrl)} className="mt-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {appId && isViewingOwnPage && <OfflineIndicator />}
            {appId && isViewingOwnPage && <GeoFenceWatcher appId={appId} job={currentOrNextJob} onStatusChange={handleStatusUpdate} />}
            <div className="flex items-center justify-between">
                 <h1 className="text-2xl font-bold font-headline">{getGreeting()}, {technician?.name.split(' ')[0]}!</h1>
            </div>
             <p className="text-muted-foreground">Here’s your day at a glance. Select a job to view details or update its status.</p>
            {jobsForToday.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        No jobs scheduled for today.
                    </h3>
                    <p className="text-muted-foreground mt-1">Enjoy your day off or check your full schedule for upcoming work!</p>
                </div>
            ) : (
                <DailyTimeline jobs={jobsForToday} />
            )}
        </div>
    );
}
