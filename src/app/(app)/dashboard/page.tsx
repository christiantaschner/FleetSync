
"use client";
import React, { useEffect, useState } from 'react';
import { PlusCircle, MapPin, Users, Briefcase, Zap, SlidersHorizontal, Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job, Technician } from '@/types';
import AddEditJobDialog from './components/AddEditJobDialog';
import OptimizeRouteDialog from './components/optimize-route-dialog';
import JobListItem from './components/JobListItem'; 
import TechnicianCard from './components/technician-card';
import MapView from './components/map-view';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import { APIProvider } from '@vis.gl/react-google-maps';


export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobForAIAssign, setSelectedJobForAIAssign] = useState<Job | null>(null);
  const [isAIAssignDialogOpen, setIsAIAssignDialogOpen] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!db || !user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const jobsUnsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
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
    }, (error) => {
      console.error("Error fetching technicians: ", error);
    });
    
    return () => {
      jobsUnsubscribe();
      techniciansUnsubscribe();
    };
  }, [user]);

  const handleJobAddedOrUpdated = (updatedJob: Job) => {
    setJobs(prevJobs => {
      const existingJobIndex = prevJobs.findIndex(j => j.id === updatedJob.id);
      if (existingJobIndex > -1) {
        const newJobs = [...prevJobs];
        newJobs[existingJobIndex] = updatedJob;
        return newJobs;
      } else {
        const jobWithTimestamps : Job = {
            ...updatedJob,
            createdAt: updatedJob.createdAt || new Date().toISOString(), 
            updatedAt: updatedJob.updatedAt || new Date().toISOString(), 
        };
        return [jobWithTimestamps, ...prevJobs];
      }
    });
  };
  
  const openAIAssignDialog = (job: Job) => {
    setSelectedJobForAIAssign(job);
    setIsAIAssignDialogOpen(true);
  };


  const activeJobs = jobs.filter(job => job.status === 'Assigned' || job.status === 'In Progress' || job.status === 'En Route');
  const pendingJobs = jobs.filter(job => job.status === 'Pending');
  
  const defaultMapCenter = technicians.length > 0 && technicians[0].location
    ? { lat: technicians[0].location.latitude, lng: technicians[0].location.longitude }
    : { lat: 39.8283, lng: -98.5795 };

  if (isLoading && jobs.length === 0 && !googleMapsApiKey) { 
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!googleMapsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center border bg-card rounded-md shadow-lg">
        <MapPin className="h-16 w-16 text-destructive opacity-70 mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Google Maps API Key Missing</h2>
        <p className="text-muted-foreground mb-1">
          The <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is not configured.
        </p>
        <p className="text-muted-foreground">
          Please add it to your <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono">.env</code> file to enable map features.
        </p>
      </div>
    );
  }


  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={['places']}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dispatcher Dashboard</h1>
          <div className="flex gap-2">
            <AddEditJobDialog onJobAddedOrUpdated={handleJobAddedOrUpdated}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Job
              </Button>
            </AddEditJobDialog>
            <OptimizeRouteDialog technicians={technicians} jobs={jobs}>
              <Button variant="outline">
                <Zap className="mr-2 h-4 w-4" /> Optimize Routes (AI)
              </Button>
            </OptimizeRouteDialog>
          </div>
        </div>

        {selectedJobForAIAssign && (
          <SmartJobAllocationDialog
            isOpen={isAIAssignDialogOpen}
            setIsOpen={setIsAIAssignDialogOpen}
            jobToAssign={selectedJobForAIAssign}
            technicians={technicians}
            onJobAssigned={(assignedJob, updatedTechnician) => {
              setJobs(prevJobs => prevJobs.map(j => j.id === assignedJob.id ? assignedJob : j));
              setTechnicians(prevTechs => prevTechs.map(t => t.id === updatedTechnician.id ? updatedTechnician : t));
              setSelectedJobForAIAssign(null); 
            }}
          >
            <></> 
          </SmartJobAllocationDialog>
        )}


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
                  defaultCenter={defaultMapCenter}
                  defaultZoom={4} 
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
                {isLoading && jobs.length === 0 ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : jobs.length > 0 ? jobs.map(job => (
                  <JobListItem 
                    key={job.id} 
                    job={job} 
                    technicians={technicians} 
                    onAssignWithAI={openAIAssignDialog}
                    onJobUpdated={handleJobAddedOrUpdated}
                  />
                )) : (
                  <p className="text-muted-foreground text-center py-10">No jobs to display. Add some jobs or check Firestore.</p>
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
                {isLoading && technicians.length === 0 ? (
                   <div className="col-span-full flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : technicians.map(technician => (
                  <TechnicianCard key={technician.id} technician={technician} jobs={jobs} />
                ))}
                {!isLoading && technicians.length === 0 && (
                  <p className="text-muted-foreground col-span-full text-center py-10">No technicians to display. Add some technicians to Firestore.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </APIProvider>
  );
}
