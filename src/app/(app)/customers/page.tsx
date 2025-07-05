
"use client";

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Contract, Equipment, CustomerData } from '@/types';
import { Loader2 } from 'lucide-react';
import CustomerView from './components/CustomerView';
import { useAuth } from '@/contexts/auth-context';

export default function CustomersPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [customers, setCustomers] = useState<CustomerData[]>([]);
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
            setError("Configuration Error: Cannot fetch customer data.");
            setIsLoading(false);
            return;
        }

        let loadedCount = 0;
        const totalCollections = 4;
        const companyId = userProfile.companyId;

        const updateLoadingState = () => {
            loadedCount++;
            if (loadedCount === totalCollections) {
                setIsLoading(false);
            }
        }

        const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
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
            updateLoadingState();
        });

        const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
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
            updateLoadingState();
        });
        
        const equipmentQuery = query(collection(db, `artifacts/${appId}/public/data/equipment`), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
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
        });

        const customersQuery = query(collection(db, `artifacts/${appId}/public/data/customers`), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
        const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
            const customersData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 for (const key in data) {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        data[key] = data[key].toDate().toISOString();
                    }
                }
                return { id: doc.id, ...data } as CustomerData;
            });
            setCustomers(customersData);
            updateLoadingState();
        }, (err) => {
            console.error("Error fetching customers:", err);
            updateLoadingState();
        });


        return () => {
            unsubscribeJobs();
            unsubscribeContracts();
            unsubscribeEquipment();
            unsubscribeCustomers();
        };
    }, [authLoading, userProfile]);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return <CustomerView customers={customers} jobs={jobs} contracts={contracts} equipment={equipment} companyId={userProfile?.companyId} />;
}

    