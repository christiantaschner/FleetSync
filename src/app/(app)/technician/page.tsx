
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Job, Technician } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, MapPin, AlertTriangle, Clock, UserCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db, auth } from '@/lib/firebase'; // Import Firestore instance and auth
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useAuth } from '@/contexts/auth-context'; // Using Auth context to get user

// Simulate a logged-in technician based on Firebase Auth user
// This page will show jobs for the currently logged-in Firebase user,
// assuming their Firebase UID matches a technician ID in your Firestore 'technicians' collection.
// For this demo, we'll still use a MOCK_LOGGED_IN_TECHNICIAN_ID if no auth user or mapping,
// but ideally, this should be driven by the authenticated user.

const MOCK_LOGGED_IN_TECHNICIAN_ID = 'tech_001'; // Fallback if no auth user / mapping

export default function TechnicianJobsPage() {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    // Determine technician ID: use Firebase UID if available, else fallback
    // In a real app, you might have a mapping from Firebase UID to your technician ID,
    // or your technician documents in Firestore might be keyed by Firebase UID.
    // For simplicity, we'll try to fetch technician by Firebase UID if it matches one of the mock IDs.
    // Otherwise, we use the fallback.
    let currentTechnicianId = MOCK_LOGGED_IN_TECHNICIAN_ID; 
    // This logic needs to be adapted if your technician IDs are Firebase UIDs or mapped differently.
    // For now, we'll assume MOCK_LOGGED_IN_TECHNICIAN_ID is the one we're interested in.


    if (!db) {
        setIsLoading(false);
        return;
    }

    // Fetch Technician details
    const fetchTechnicianDetails = async (techId: string) => {
        const techDocRef = doc(db, "technicians", techId);
        const techDocSnap = await getDoc(techDocRef);
        if (techDocSnap.exists()) {
            setTechnician({ id: techDocSnap.id, ...techDocSnap.data() } as Technician);
        } else {
            console.warn(`Technician with ID ${techId} not found in Firestore.`);
            // Fallback or handle error - for now, try with mock tech if needed
            // setTechnician(mockTechnicians.find(t => t.id === techId) || null);
        }
    };
    
    fetchTechnicianDetails(currentTechnicianId); // Fetch details for the determined technician ID

    // Subscribe to jobs assigned to this technician
    const jobsQuery = query(
      collection(db, "jobs"),
      where("assignedTechnicianId", "==", currentTechnicianId),
      where("status", "not-in", ["Completed", "Cancelled"])
    );

    const unsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsForTech = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      jobsForTech.sort((a, b) => {
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 } as Record<JobPriority, number>;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return (a.scheduledTime && b.scheduledTime) ? new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime() : 0;
      });
      setAssignedJobs(jobsForTech);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching assigned jobs: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription

  }, [firebaseUser, authLoading]);


  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading technician data...</p>
      </div>
    );
  }
  
  if (!technician) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Technician Not Found</h2>
        <p className="text-muted-foreground mt-2">
          Could not load technician data. Ensure a technician document exists in Firestore with ID: {MOCK_LOGGED_IN_TECHNICIAN_ID} (or logged in user's ID if configured).
        </p>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="mb-6 shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={technician.avatarUrl || `https://placehold.co/100x100.png?text=${technician.name[0]}`} alt={technician.name} data-ai-hint="person portrait" />
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
