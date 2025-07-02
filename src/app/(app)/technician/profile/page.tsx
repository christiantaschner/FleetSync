
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Technician, ProfileChangeRequest, Job } from '@/types';
import { ArrowLeft, Mail, Phone, ListChecks, User, Loader2, UserX, Edit, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import SuggestChangeDialog from './components/SuggestChangeDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { isEqual } from 'lodash';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const getStatusClass = (status: ProfileChangeRequest['status']) => {
    switch (status) {
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        case 'pending':
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
};

const formatDuration = (milliseconds: number): string => {
    if (milliseconds <= 0 || isNaN(milliseconds) || !isFinite(milliseconds)) return "0m";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;
    
    return result.trim() || '0m';
}

const calculateJobDurations = (job: Job) => {
    const travelTime = (job.inProgressAt && job.enRouteAt) ? new Date(job.inProgressAt).getTime() - new Date(job.enRouteAt).getTime() : 0;
    const onSiteTime = (job.completedAt && job.inProgressAt) ? new Date(job.completedAt).getTime() - new Date(job.inProgressAt).getTime() : 0;
    const breakTime = job.breaks?.reduce((acc, b) => {
        if (b.start && b.end) {
            return acc + (new Date(b.end).getTime() - new Date(b.start).getTime());
        }
        return acc;
    }, 0) || 0;
    
    const workTime = onSiteTime > breakTime ? onSiteTime - breakTime : onSiteTime;
    const totalTime = travelTime + workTime;
    
    return {
        travelTime: formatDuration(travelTime),
        workTime: formatDuration(workTime),
        breakTime: formatDuration(breakTime),
        totalTime: formatDuration(totalTime),
    };
};

export default function TechnicianProfilePage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [technician, setTechnician] = useState<Technician | null>(null);
  const [submittedRequests, setSubmittedRequests] = useState<ProfileChangeRequest[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestChangeOpen, setIsSuggestChangeOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;

    if (!db) {
      setIsLoading(false);
      setError("Database service not available.");
      return;
    }

    const techDocRef = doc(db, "technicians", firebaseUser.uid);
    const unsubscribeTech = onSnapshot(techDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const techData = { id: docSnap.id, ...docSnap.data() } as Technician;
          setTechnician(techData);
          setIsLoading(false); 
        } else {
          setError("No technician profile found for your account.");
          setTechnician(null);
          setIsLoading(false);
        }
    }, (e) => {
        console.error("Error fetching technician profile:", e);
        setError("Could not load your profile.");
        setIsLoading(false);
    });

    return () => {
        unsubscribeTech();
    };
  }, [firebaseUser, authLoading]);

  useEffect(() => {
    if (!technician) return;
    
    const companyId = technician.companyId;

    // Fetch Skills
    const skillsQuery = query(collection(db, "skills"), where("companyId", "==", companyId), orderBy("name"));
    const unsubscribeSkills = onSnapshot(skillsQuery, (snapshot) => {
        setAllSkills(snapshot.docs.map(doc => doc.data().name as string));
    });

    // Fetch Change Requests
    const requestsQuery = query(
        collection(db, "profileChangeRequests"),
        where("companyId", "==", companyId),
        where("technicianId", "==", technician.id),
        orderBy("createdAt", "desc")
    );
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => {
            const data = doc.data();
            for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as ProfileChangeRequest
        });
        setSubmittedRequests(requestsData);
    });
    
    // Fetch Completed Jobs
    const jobsQuery = query(
        collection(db, "jobs"),
        where("companyId", "==", companyId),
        where("assignedTechnicianId", "==", technician.id),
        where("status", "==", "Completed"),
        orderBy("completedAt", "desc"),
        limit(20)
    );
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        const jobsData = snapshot.docs.map(doc => {
            const data = doc.data();
            for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            return { id: doc.id, ...data } as Job;
        });
        setCompletedJobs(jobsData);
    });

    return () => {
        unsubscribeSkills();
        unsubscribeRequests();
        unsubscribeJobs();
    }
  }, [technician]);

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (error && !technician) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <UserX className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Profile Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!technician || !firebaseUser) {
    return null;
  }
  
  const backUrl = `/technician/jobs/${firebaseUser.uid}`;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
        <SuggestChangeDialog
            isOpen={isSuggestChangeOpen}
            setIsOpen={setIsSuggestChangeOpen}
            technician={technician}
            allSkills={allSkills}
        />
        <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsSuggestChangeOpen(true)}>
                <Edit className="mr-2 h-4 w-4"/>
                Suggest a Change
            </Button>
        </div>
        <Card className="shadow-lg">
            <CardHeader className="text-center">
                 <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
                  <AvatarImage src={technician.avatarUrl} alt={technician.name} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-3xl">{technician.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-bold pt-4 font-headline">{technician.name}</CardTitle>
                <CardDescription className="text-base">Technician Profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <Separator />
                <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{technician.email || 'No email provided'}</span>
                </div>
                 <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{technician.phone || 'No phone provided'}</span>
                </div>
                <Separator />
                 <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2"><ListChecks /> My Skills</h3>
                    {technician.skills && technician.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                        {technician.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-sm">{skill}</Badge>
                        ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No skills have been assigned to your profile.</p>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground text-center w-full">
                    To update your profile details, you can suggest a change for dispatcher review.
                </p>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Clock/>Time Log Summary</CardTitle>
                <CardDescription>A summary of your recently completed jobs. Contact dispatch if you see any discrepancies.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job</TableHead>
                                <TableHead className="text-right">Travel</TableHead>
                                <TableHead className="text-right">Work</TableHead>
                                <TableHead className="text-right">Break</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {completedJobs.length > 0 ? completedJobs.map(job => {
                                const durations = calculateJobDurations(job);
                                return (
                                    <TableRow key={job.id}>
                                        <TableCell>
                                            <p className="font-medium truncate max-w-xs">{job.title}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(job.completedAt!), 'PP')}</p>
                                        </TableCell>
                                        <TableCell className="text-right">{durations.travelTime}</TableCell>
                                        <TableCell className="text-right">{durations.workTime}</TableCell>
                                        <TableCell className="text-right">{durations.breakTime}</TableCell>
                                        <TableCell className="text-right font-bold">{durations.totalTime}</TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No completed jobs to display.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><History/>My Change Requests</CardTitle>
                <CardDescription>History of your submitted profile change requests.</CardDescription>
            </CardHeader>
            <CardContent>
                {submittedRequests.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                        {submittedRequests.map(request => (
                             <AccordionItem value={request.id} key={request.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <span className="font-semibold text-sm">
                                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                        <Badge className={cn("capitalize", getStatusClass(request.status))}>{request.status}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 bg-secondary/30 p-3 rounded-b-md">
                                    {Object.keys(request.requestedChanges).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold mb-1">Your Request:</p>
                                            <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                                {Object.entries(request.requestedChanges).map(([key, val]) => (
                                                  <li key={key}>
                                                      <span className="capitalize font-medium text-foreground">{key}:</span>{' '}
                                                      {key === 'skills' && Array.isArray(val) ? 
                                                        (<div className="inline-flex flex-wrap gap-1 mt-1">{val.map(s => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)}</div>)
                                                        : (String(val))
                                                      }
                                                  </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {request.status === 'approved' && request.approvedChanges && (
                                        <div>
                                            <p className="text-xs font-semibold mb-1">Final Approved Values:</p>
                                             <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                                {Object.entries(request.approvedChanges).map(([key, val]) => {
                                                    const requestedValue = request.requestedChanges[key];
                                                    const approvedValue = val;
                                                    let wasChanged = false;
                                                    if(Array.isArray(requestedValue) && Array.isArray(approvedValue)) {
                                                        wasChanged = !isEqual(requestedValue.sort(), approvedValue.sort());
                                                    } else {
                                                        wasChanged = requestedValue !== approvedValue;
                                                    }

                                                    return (
                                                        <li key={key} className={wasChanged ? 'text-green-600 font-bold' : ''}>
                                                            <span className="capitalize font-medium text-foreground">{key}:</span>{' '}
                                                            {key === 'skills' && Array.isArray(val) ? 
                                                              (<div className="inline-flex flex-wrap gap-1 mt-1">{val.map(s => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)}</div>)
                                                              : (String(val))
                                                            }
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                     )}
                                     {request.notes && (
                                        <div>
                                            <p className="text-xs font-semibold mb-1">Your Notes:</p>
                                            <p className="text-xs text-muted-foreground italic">"{request.notes}"</p>
                                        </div>
                                     )}
                                     {request.reviewNotes && (
                                        <div>
                                            <p className="text-xs font-semibold mb-1">Dispatcher's Notes:</p>
                                            <p className="text-xs text-muted-foreground italic bg-background p-2 rounded-md">"{request.reviewNotes}"</p>
                                        </div>
                                     )}
                                </AccordionContent>
                             </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">You have not submitted any change requests.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
