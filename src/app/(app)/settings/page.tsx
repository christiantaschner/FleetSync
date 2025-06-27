
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Company } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building } from 'lucide-react';
import CompanySettingsForm from './components/CompanySettingsForm';

export default function SettingsPage() {
    const { userProfile } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userProfile?.companyId) {
            setIsLoading(false);
            setError("Company information not available.");
            return;
        }

        const companyDocRef = doc(db, 'companies', userProfile.companyId);
        const unsubscribe = onSnapshot(companyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Ensure timestamps are converted
                for (const key in data) {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        data[key] = data[key].toDate().toISOString();
                    }
                }
                setCompany({ id: docSnap.id, ...data } as Company);
            } else {
                setError("Could not find your company's data.");
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching company data:", err);
            setError("Failed to load company settings.");
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [userProfile?.companyId]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Building/> Company Settings</CardTitle>
                    <CardDescription>
                        Manage your company profile, business hours, and other settings. These will affect future scheduling suggestions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {error && !isLoading && (
                        <p className="text-destructive text-center py-10">{error}</p>
                    )}
                    {!isLoading && company && (
                        <CompanySettingsForm company={company} />
                    )}
                     {!isLoading && !company && !error && (
                         <p className="text-muted-foreground text-center py-10">Company data could not be loaded.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
