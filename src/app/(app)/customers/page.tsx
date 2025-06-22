
"use client";

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Contract } from '@/types';
import { Loader2 } from 'lucide-react';
import CustomerView from './components/CustomerView';

export default function CustomersPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }

        let jobsLoaded = false;
        let contractsLoaded = false;

        const updateLoadingState = () => {
            if (jobsLoaded && contractsLoaded) {
                setIsLoading(false);
            }
        }

        const jobsQuery = query(collection(db, "jobs"));
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
            jobsLoaded = true;
            updateLoadingState();
        }, (error) => {
            console.error("Error fetching jobs for customer view:", error);
            setError("Could not fetch job data.");
            jobsLoaded = true;
            updateLoadingState();
        });

        const contractsQuery = query(collection(db, "contracts"));
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
            contractsLoaded = true;
            updateLoadingState();
        }, (error) => {
            console.error("Error fetching contracts for customer view:", error);
            setError("Could not fetch contract data.");
            contractsLoaded = true;
            updateLoadingState();
        });


        return () => {
            unsubscribeJobs();
            unsubscribeContracts();
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return <CustomerView jobs={jobs} contracts={contracts} />;
}
