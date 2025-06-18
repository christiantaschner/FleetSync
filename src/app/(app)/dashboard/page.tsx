
"use client";
import React from 'react';
import Image from 'next/image';
import { PlusCircle, MapPin, Users, Briefcase, Zap, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import type { Job, Technician } from '@/types';
import SmartJobAllocationDialog from './components/smart-job-allocation-dialog';
import OptimizeRouteDialog from './components/optimize-route-dialog';
import JobListItem from './components/job-list-item';
import TechnicianCard from './components/technician-card';

export default function DashboardPage() {
  const [jobs, setJobs] = React.useState<Job[]>(mockJobs);
  const [technicians, setTechnicians] = React.useState<Technician[]>(mockTechnicians);

  // Example: filter active jobs
  const activeJobs = jobs.filter(job => job.status === 'Assigned' || job.status === 'In Progress' || job.status === 'En Route');
  const pendingJobs = jobs.filter(job => job.status === 'Pending');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dispatcher Dashboard</h1>
        <div className="flex gap-2">
          <SmartJobAllocationDialog technicians={technicians} jobs={jobs} setJobs={setJobs}>
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
              <div className="aspect-[16/9] bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                <Image 
                  src="https://placehold.co/800x450.png" 
                  alt="Map placeholder" 
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="map city"
                />
                <MapPin className="h-16 w-16 text-primary opacity-50 absolute" />
                <p className="absolute bottom-4 text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded">Map View Placeholder</p>
              </div>
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
                <p className="text-muted-foreground">No jobs to display.</p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

