
"use client";

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Contract, Equipment } from '@/types';
import { Loader2 } from 'lucide-react';
import CustomerView from './components/CustomerView';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!db || !userProfile?.companyId) {
            setIsLoading(false);
            return;
        }
        
        const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!appId) {
            toast({ title: "Configuration Error", description: "Cannot fetch customer data.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        let loadedCount = 0;
        const totalCollections = 3;
        const companyId = userProfile.companyId;

        const updateLoadingState = () => {
            loadedCount++;
            if (loadedCount === totalCollections) {
                setIsLoading(false);
            }
        }

        const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId));
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
            setJobs(jobsData);
            updateLoadingState();
        }, (err) => {
            console.error("Error fetching jobs for customer view:", err);
            setError("Could not fetch job data.");
            updateLoadingState();
        });

        const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", companyId));
        const unsubscribeContracts = onSnapshot(contractsQuery, (snapshot) => {
            const contractsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 for (const key in data) {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        data[key] = data[key].toDate().toISOString();
                    }
                }
                return { id: doc.id, ...data } as Contract;
            });
            setContracts(contractsData);
            updateLoadingState();
        }, (err) => {
            console.error("Error fetching contracts for customer view:", err);
            setError("Could not fetch contract data.");
            updateLoadingState();
        });
        
        const equipmentQuery = query(collection(db, `artifacts/${appId}/public/data/equipment`), where("companyId", "==", companyId));
        const unsubscribeEquipment = onSnapshot(equipmentQuery, (snapshot) => {
            const equipmentData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 for (const key in data) {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        data[key] = data[key].toDate().toISOString();
                    }
                }
                return { id: doc.id, ...data } as Equipment;
            });
            setEquipment(equipmentData);
            updateLoadingState();
        }, (err) => {
            console.error("Error fetching equipment for customer view:", err);
            setError("Could not fetch equipment data.");
            updateLoadingState();
        });


        return () => {
            unsubscribeJobs();
            unsubscribeContracts();
            unsubscribeEquipment();
        };
    }, [authLoading, userProfile, toast]);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return <CustomerView jobs={jobs} contracts={contracts} equipment={equipment} companyId={userProfile?.companyId} />;
}
