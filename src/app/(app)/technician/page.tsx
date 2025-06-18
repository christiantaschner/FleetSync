
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import type { Job, Technician } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, MapPin, AlertTriangle, Clock, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Simulate a logged-in technician
const MOCK_LOGGED_IN_TECHNICIAN_ID = 'tech_001'; // Alice Smith

export default function TechnicianJobsPage() {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);

  useEffect(() => {
    const currentTech = mockTechnicians.find(t => t.id === MOCK_LOGGED_IN_TECHNICIAN_ID);
    if (currentTech) {
      setTechnician(currentTech);
      const jobsForTech = mockJobs.filter(job => job.assignedTechnicianId === currentTech.id && job.status !== 'Completed' && job.status !== 'Cancelled');
      setAssignedJobs(jobsForTech.sort((a, b) => {
        // Sort by priority, then by scheduled time
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return (a.scheduledTime && b.scheduledTime) ? new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime() : 0;
      }));
    }
  }, []);

  if (!technician) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading technician data...</p>
      </div>
    );
  }
  
  const Loader2 = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );


  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="mb-6 shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={technician.avatarUrl} alt={technician.name} data-ai-hint="person portrait" />
            <AvatarFallback>{technician.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-headline">{technician.name}</CardTitle>
            <CardDescription>Your assigned jobs for today.</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 font-headline">
        <ListChecks className="text-primary" /> My Active Jobs ({assignedJobs.length})
      </h2>

      {assignedJobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You have no active jobs assigned.</p>
            <Button variant="link" className="mt-2">Refresh</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignedJobs.map(job => (
            <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-headline">{job.title}</CardTitle>
                  <Badge variant={job.priority === 'High' ? 'destructive' : job.priority === 'Medium' ? 'default' : 'secondary'}>
                    {job.priority}
                  </Badge>
                </div>
                <CardDescription className="flex items-center text-sm">
                  <MapPin size={14} className="mr-1 text-muted-foreground" /> {job.location.address || `Lat: ${job.location.latitude}, Lon: ${job.location.longitude}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground mb-2 line-clamp-2">{job.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="flex items-center">
                    <UserCircle size={14} className="mr-1" /> {job.customerName}
                  </span>
                  <span className="flex items-center">
                    <Clock size={14} className="mr-1" /> Status: {job.status}
                  </span>
                </div>
                 {job.scheduledTime && (
                  <p className="text-xs text-muted-foreground">
                    Scheduled: {new Date(job.scheduledTime).toLocaleString()}
                  </p>
                )}
              </CardContent>
              <CardFooter className="bg-secondary/50 p-3">
                <Link href={`/technician/${job.id}`} className="w-full">
                  <Button className="w-full" variant="default">
                    View Details &amp; Update Status
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
