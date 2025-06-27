
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Technician } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, ChevronRight, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SelectTechnicianPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        
        if (!userProfile) {
            router.push('/login');
            return;
        }

        if (userProfile.role !== 'admin') {
            // A technician should be redirected to their jobs page by the layout,
            // but this is a failsafe.
            router.push(`/technician/jobs/${userProfile.uid}`); 
            return;
        }

        const techsQuery = query(collection(db, "technicians"), where("companyId", "==", userProfile.companyId));
        const unsubscribe = onSnapshot(techsQuery, (snapshot) => {
            const techsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
            techsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setTechnicians(techsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching technicians:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile, authLoading, router]);

    if (isLoading || authLoading) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // Add an explicit check here in case the redirect hasn't fired yet
    if (userProfile?.role !== 'admin') {
        return (
             <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">
                    This page is for administrators only.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Users /> Select a Technician
                    </CardTitle>
                    <CardDescription>
                        Choose a technician from the roster to view their currently assigned jobs and schedule.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {technicians.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">No technicians found in your company.</p>
                        )}
                        {technicians.map(tech => (
                            <Link href={`/technician/jobs/${tech.id}`} key={tech.id}>
                                <div className="flex items-center p-3 rounded-md border bg-card hover:bg-secondary transition-colors cursor-pointer">
                                    <Avatar className="h-10 w-10 mr-4">
                                        <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                                        <AvatarFallback>{tech.name ? tech.name.split(' ').map(n => n[0]).join('') : 'T'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{tech.name || 'Unnamed Technician'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(tech.skills && tech.skills.length > 0) ? tech.skills.join(', ') : 'No skills listed'}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
