
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Job, Technician, JobPriority, JobStatus } from '@/types'; // Added JobPriority
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, MapPin, AlertTriangle, Clock, UserCircle, Loader2, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';

export default function TechnicianJobsPage() {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    if (!firebaseUser) {
      setIsLoading(false);
      // Should be redirected by layout if not logged in, but good to handle
      setError("User not authenticated."); 
      return;
    }

    if (!db) {
      setIsLoading(false);
      setError("Database service not available.");
      return;
    }
    
    const currentTechnicianId = firebaseUser.uid;
    setIsLoading(true);
    setError(null);

    // Fetch Technician details
    const fetchTechnicianDetails = async () => {
      const techDocRef = doc(db, "technicians", currentTechnicianId);
      try {
        const techDocSnap = await getDoc(techDocRef);
        if (techDocSnap.exists()) {
          setTechnician({ id: techDocSnap.id, ...techDocSnap.data() } as Technician);
        } else {
          console.warn(`Technician document with ID ${currentTechnicianId} (Firebase UID) not found in Firestore.`);
          setError(`No technician profile found for your account. Please contact an administrator.`);
          setTechnician(null);
        }
      } catch (e) {
        console.error("Error fetching technician details:", e);
        setError("Could not load technician profile.");
        setTechnician(null);
      }
    };
    
    fetchTechnicianDetails();

    // Define active job statuses
    const activeJobStatuses: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];

    // Subscribe to jobs assigned to this technician (based on UID)
    const jobsQuery = query(
      collection(db, "jobs"),
      where("assignedTechnicianId", "==", currentTechnicianId),
      where("status", "in", activeJobStatuses)
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsForTech = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      jobsForTech.sort((a, b) => {
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 } as Record<JobPriority, number>;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return (a.scheduledTime && b.scheduledTime) ? new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime() : 0;
      });
      setAssignedJobs(jobsForTech);
      setIsLoading(false); // Set loading to false after jobs are fetched (or tech details fail)
    }, (err: any) => {
      console.error("Error fetching assigned jobs: ", err);
      if (err.code === 'failed-precondition' && err.message.includes('requires an index')) {
        setError("Data loading requires a database index. Please create it using the link logged in the Firebase Functions console or provided in the error message.");
        // You can also log the specific index creation link here if needed, though the user already has it
        console.error("Firestore index required. Create it here: ", err.message.substring(err.message.indexOf('https://')));
      } else {
        setError("Could not load assigned jobs.");
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeJobs();
    };

  }, [firebaseUser, authLoading]);


  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your jobs...</p>
      </div>
    );
  }
  
  if (error && !technician && !isLoading) { // Show error if technician profile failed and not loading jobs
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <UserX className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Access Denied or Profile Issue</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }
  
  if (!technician && !isLoading) { // Fallback if somehow technician is null after loading without specific error
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Technician Profile Not Available</h2>
        <p className="text-muted-foreground mt-2">
          Could not load your technician profile. If this persists, contact an administrator.
        </p>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto p-4">
      {technician && (
        <Card className="mb-6 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={technician.avatarUrl || `https://placehold.co/100x100.png?text=${technician.name[0]}`} alt={technician.name} data-ai-hint="person portrait"/>
              <AvatarFallback>{technician.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-headline">{technician.name}</CardTitle>
              <CardDescription>Your assigned jobs for today.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 font-headline">
        <ListChecks className="text-primary" /> My Active Jobs ({assignedJobs.length})
      </h2>

      {error && <p className="text-destructive mb-4 bg-destructive/10 p-3 rounded-md">{error}</p>}

      {assignedJobs.length === 0 && !isLoading && !error ? ( // Check isLoading and error here
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You have no active jobs assigned.</p>
          </CardContent>
        </Card>
      ) : null}
      
      {assignedJobs.length > 0 && (
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

