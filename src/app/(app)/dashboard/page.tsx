
"use client";
import React, { useEffect, useState } from 'react';
import { PlusCircle, MapPin, Users, Briefcase, Zap, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job, Technician } from '@/types';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import OptimizeRouteDialog from './components/optimize-route-dialog';
import JobListItem from './components/job-list-item';
import TechnicianCard from './components/technician-card';
import MapView from './components/map-view';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, getDocs, onSnapshot } from 'firebase/firestore'; // Import Firestore functions
import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) { // Ensure db is initialized and user is logged in
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const jobsUnsubscribe = onSnapshot(collection(db, "jobs"), (querySnapshot) => {
      const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching jobs: ", error);
      setIsLoading(false);
    });

    const techniciansUnsubscribe = onSnapshot(collection(db, "technicians"), (querySnapshot) => {
      const techniciansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
      setTechnicians(techniciansData);
      // setIsLoading to false is handled by jobs listener to avoid flicker, or consider separate loading states
    }, (error) => {
      console.error("Error fetching technicians: ", error);
      // setIsLoading(false);
    });
    
    return () => {
      jobsUnsubscribe();
      techniciansUnsubscribe();
    };
  }, [user]); // Re-run if user changes (e.g., on login)

  const activeJobs = jobs.filter(job => job.status === 'Assigned' || job.status === 'In Progress' || job.status === 'En Route');
  const pendingJobs = jobs.filter(job => job.status === 'Pending');

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const defaultMapCenter = technicians.length > 0 && technicians[0].location
    ? { lat: technicians[0].location.latitude, lng: technicians[0].location.longitude }
    : { lat: 39.8283, lng: -98.5795 };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dispatcher Dashboard</h1>
        <div className="flex gap-2">
          <SmartJobAllocationDialog technicians={technicians} setJobs={setJobs} setTechnicians={setTechnicians}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Assign Job (AI)
            </Button>
          </SmartJobAllocationDialog>
          <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
            <Button variant="outline">
              <Zap className="mr-2 h-4 w-4" /> Optimize Routes (AI)
            </Button>
          </OptimizeRouteDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently assigned or in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Technicians</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technicians.filter(t => t.isAvailable).length} / {technicians.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview Map</TabsTrigger>
          <TabsTrigger value="jobs">Job List</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Technician &amp; Job Locations</CardTitle>
              <CardDescription>Real-time overview of ongoing operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <MapView 
                technicians={technicians} 
                jobs={jobs} 
                apiKey={googleMapsApiKey}
                defaultCenter={defaultMapCenter}
                defaultZoom={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Current Jobs</CardTitle>
              <CardDescription>Manage and track all ongoing and pending jobs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.length > 0 ? jobs.map(job => (
                <JobListItem key={job.id} job={job} technicians={technicians} />
              )) : (
                <p className="text-muted-foreground">No jobs to display. Add some jobs or check Firestore.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Technician Roster</CardTitle>
              <CardDescription>View technician status, skills, and current assignments.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {technicians.map(technician => (
                 <TechnicianCard key={technician.id} technician={technician} jobs={jobs} />
              ))}
              {technicians.length === 0 && (
                <p className="text-muted-foreground col-span-full">No technicians to display. Add some technicians to Firestore.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
