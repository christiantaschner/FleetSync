
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Job, Technician, JobStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, MapPin, AlertTriangle, Clock, UserCircle, Loader2, UserX, User, ArrowLeft, Eye, Navigation, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockJobs, mockTechnicians } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function TechnicianJobListPage() {
  const { user: firebaseUser, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const technicianId = params.technicianId as string;

  const [technician, setTechnician] = useState<Technician | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoad = useRef(true);
  const prevJobOrder = useRef<string>("");

  const hasPermission = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin' || userProfile?.uid === technicianId;
  const isViewingOwnPage = userProfile?.uid === technicianId;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (authLoading || !firebaseUser || !userProfile || !technicianId) return;

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const foundTechnician = mockTechnicians.find(t => t.id === technicianId) || null;
        setTechnician(foundTechnician);
        if (foundTechnician) {
            const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
            const jobsForTech = mockJobs.filter(j => j.assignedTechnicianId === technicianId && activeJobStatuses.includes(j.status));
            setAssignedJobs(jobsForTech);
        }
        setIsLoading(false);
        return;
    }

    if (!hasPermission) {
        setError("You don't have permission to view this page.");
        setIsLoading(false);
        return;
    }
    
    if (!appId) {
        setError("Application is not configured correctly.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, technicianId);
    const unsubscribeTech = onSnapshot(techDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const techData = { id: docSnap.id, ...docSnap.data() } as Technician;
        setTechnician(techData);

        const activeJobStatuses: JobStatus[] = ['Assigned', 'En Route', 'In Progress'];
        const jobsQuery = query(
          collection(db, `artifacts/${appId}/public/data/jobs`),
          where("companyId", "==", techData.companyId),
          where("assignedTechnicianId", "==", technicianId),
          where("status", "in", activeJobStatuses),
          orderBy("routeOrder"),
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
          
          const currentJobOrder = jobsForTech.map(j => j.id).join(',');

          if (isInitialLoad.current) {
            prevJobOrder.current = currentJobOrder;
            isInitialLoad.current = false;
          } else if (isViewingOwnPage) {
            if (prevJobOrder.current !== currentJobOrder) {
               toast({
                title: "Schedule Updated",
                description: "Your job list has been changed. Please review the new order."
              });
            }
            prevJobOrder.current = currentJobOrder;
          }

          setAssignedJobs(jobsForTech);
          setIsLoading(false);
        }, (err: any) => {
          console.error("Could not load assigned jobs:", err);
          setError("Could not load assigned jobs.");
          setIsLoading(false);
        });
        return () => unsubscribeJobs();
      } else {
        setError(`No technician profile found for this ID.`);
        setTechnician(null);
        setIsLoading(false);
      }
    }, (e) => {
      console.error("Could not load technician profile:", e);
      setError("Could not load your profile.");
      setTechnician(null);
      setIsLoading(false);
    });
    
    return () => unsubscribeTech();
  }, [firebaseUser, authLoading, userProfile, technicianId, hasPermission, toast, isViewingOwnPage, appId]);

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation Error", description: "Geolocation is not supported by your browser.", variant: "destructive"});
      return;
    }
    if (!isViewingOwnPage) {
        toast({ title: "Action Not Allowed", description: "You can only update your own location.", variant: "destructive"});
        return;
    }
     if (!appId) return;

    setIsUpdatingLocation(true);
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
        });

        const { latitude, longitude } = position.coords;
        if (technician && db) {
            const techDocRef = doc(db, `artifacts/${appId}/public/data/technicians`, technician.id);
            await updateDoc(techDocRef, {
            "location.latitude": latitude,
            "location.longitude": longitude,
            });
            toast({ title: "Location Updated", description: "Your current location has been updated." });
        }
    } catch (locationError: any) {
        let message = "An unknown error occurred.";
        if (locationError.code === 1) message = "Please allow location access to update your position.";
        if (locationError.code === 2) message = "Location information is unavailable.";
        toast({ title: "Geolocation Error", description: message, variant: "destructive" });
    } finally {
        setIsUpdatingLocation(false);
    }
  };
  
  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading technician jobs...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <UserX className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  if (!technician) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Technician Not Found</h2>
      </div>
    );
  }

  const currentOrNextJob = assignedJobs.find(job => job.status === 'In Progress' || job.status === 'En Route') || assignedJobs[0];
  const upcomingJobs = currentOrNextJob ? assignedJobs.filter(job => job.id !== currentOrNextJob.id) : [];

  const handleNavigate = (job: Job) => {
    if (job.location?.address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location.address)}`, '_blank');
    else if (job.location) window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`, '_blank');
    else toast({ title: "Navigation Error", description: "No address or coordinates available.", variant: "destructive"});
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {(userProfile?.role === 'admin' || userProfile?.role === 'superAdmin') && (
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=technicians')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Technician Roster
        </Button>
      )}

      {!isViewingOwnPage && (
        <Alert className="mb-6">
            <Eye className="h-4 w-4" />
            <AlertTitle className="font-semibold">Administrator View</AlertTitle>
            <AlertDescription>
                You are viewing this page as an administrator. Actions for this technician are disabled in this view.
            </AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={technician.avatarUrl} alt={technician.name} data-ai-hint="person portrait"/>
            <AvatarFallback>{technician.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-headline">{technician.name}</CardTitle>
            <CardDescription>Welcome to your daily command center.</CardDescription>
          </div>
        </CardHeader>
        {isViewingOwnPage && (
           <CardFooter className="bg-secondary/50 p-3 grid grid-cols-2 gap-2">
             <Button onClick={handleUpdateLocation} disabled={isUpdatingLocation} className="w-full">
              {isUpdatingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Update My Location
            </Button>
            <Link href="/technician/profile" className="w-full">
                <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" /> View My Profile
                </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
      
      {assignedJobs.length === 0 ? (
        <Card className="text-center py-12">
            <CardContent>
                <h3 className="text-lg font-semibold">All Clear!</h3>
                <p className="text-muted-foreground mt-1">You have no active jobs assigned for today.</p>
            </CardContent>
        </Card>
      ) : (
        <>
            {currentOrNextJob && (
                <div>
                     <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 font-headline">
                        <Briefcase className="text-primary" /> {currentOrNextJob.status === 'In Progress' ? 'Current Job' : 'Next Job'}
                    </h2>
                     <Card className="bg-primary/5 border-primary shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-bold">{currentOrNextJob.title}</CardTitle>
                                <Badge variant={currentOrNextJob.priority === 'High' ? 'destructive' : 'default'}>{currentOrNextJob.priority}</Badge>
                            </div>
                            <CardDescription className="pt-1">
                                <p className="font-semibold text-base">{currentOrNextJob.customerName}</p>
                                <p className="flex items-center gap-1.5"><MapPin size={14}/> {currentOrNextJob.location.address}</p>
                                {currentOrNextJob.scheduledTime && (
                                    <p className="flex items-center gap-1.5"><Clock size={14}/> {format(new Date(currentOrNextJob.scheduledTime), 'PPp')}</p>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="grid grid-cols-2 gap-2">
                             <Button onClick={() => handleNavigate(currentOrNextJob)}>
                                <Navigation className="mr-2 h-4 w-4"/> Navigate
                            </Button>
                             <Link href={`/technician/${currentOrNextJob.id}`} className="w-full">
                                <Button variant="outline" className="w-full">
                                    <ListChecks className="mr-2 h-4 w-4"/> View Details
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            )}
            {upcomingJobs.length > 0 && (
                 <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 font-headline mt-8">
                        <ListChecks className="text-primary" /> Upcoming Jobs
                    </h2>
                    <div className="space-y-3">
                    {upcomingJobs.map(job => (
                        <Card key={job.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{job.title}</p>
                                    <p className="text-sm text-muted-foreground">{job.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{job.scheduledTime ? format(new Date(job.scheduledTime), 'p') : 'Unscheduled'}</p>
                                </div>
                                <Link href={`/technician/${job.id}`}>
                                    <Button variant="ghost" size="sm">Details</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                </div>
            )}
        </>
      )}

    </div>
  );
}

    