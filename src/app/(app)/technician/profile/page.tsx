
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Technician } from '@/types';
import { ArrowLeft, Mail, Phone, ListChecks, User, Loader2, UserX, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import SuggestChangeDialog from './components/SuggestChangeDialog';

export default function TechnicianProfilePage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestChangeOpen, setIsSuggestChangeOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!firebaseUser) {
      setIsLoading(false);
      setError("User not authenticated.");
      router.push('/login');
      return;
    }

    if (!db) {
      setIsLoading(false);
      setError("Database service not available.");
      return;
    }

    const fetchTechnicianProfile = async () => {
      setIsLoading(true);
      setError(null);
      const techDocRef = doc(db, "technicians", firebaseUser.uid);
      try {
        const docSnap = await getDoc(techDocRef);
        if (docSnap.exists()) {
          setTechnician({ id: docSnap.id, ...docSnap.data() } as Technician);
        } else {
          setError("No technician profile found for your account.");
        }
      } catch (e) {
        console.error("Error fetching technician profile:", e);
        setError("Could not load your profile.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicianProfile();
  }, [firebaseUser, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
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

  if (!technician) {
    // This case should be covered by the error state, but as a fallback.
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
            <p className="text-muted-foreground mt-2">Technician profile not found.</p>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
        {technician && (
             <SuggestChangeDialog
                isOpen={isSuggestChangeOpen}
                setIsOpen={setIsSuggestChangeOpen}
                technician={technician}
            />
        )}
        <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
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
    </div>
  );
}
