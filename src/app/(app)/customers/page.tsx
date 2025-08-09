
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Contract, Equipment, CustomerData, Skill } from '@/types';
import { Loader2 } from 'lucide-react';
import CustomerView from './components/CustomerView';
import { useAuth } from '@/contexts/auth-context';
import { mockJobs, mockContracts, mockEquipment, mockCustomers } from '@/lib/mock-data';
import { getSkillsAction } from '@/actions/skill-actions';
import { PREDEFINED_SKILLS } from '@/lib/skills';

export default function CustomersPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (authLoading) {
            return;
        }

        if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
            setJobs(mockJobs);
            setContracts(mockContracts);
            setEquipment(mockEquipment);
            setCustomers(mockCustomers);
            setAllSkills(PREDEFINED_SKILLS.map((name, index) => ({ id: `mock_skill_${index}`, name })));
            setIsLoading(false);
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
        const totalCollections = 5;
        const companyId = userProfile.companyId;

        const updateLoadingState = () => {
            loadedCount++;
            if (loadedCount === totalCollections) {
                setIsLoading(false);
            }
        }
        
        getSkillsAction({ companyId, appId }).then(result => {
          if (result.data) {
            setAllSkills(result.data);
          }
          if(isLoading) updateLoadingState();
        });

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
            if(isLoading) updateLoadingState();
        }, (err) => {
            console.error("Error fetching jobs for customer view:", err);
            if(isLoading) updateLoadingState();
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
            if(isLoading) updateLoadingState();
        }, (err) => {
            console.error("Error fetching contracts for customer view:", err);
            if(isLoading) updateLoadingState();
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
            if(isLoading) updateLoadingState();
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
            if(isLoading) updateLoadingState();
        }, (err) => {
            console.error("Error fetching customers:", err);
            if(isLoading) updateLoadingState();
        });


        return () => {
            unsubscribeJobs();
            unsubscribeContracts();
            unsubscribeEquipment();
            unsubscribeCustomers();
        };
    }, [authLoading, userProfile, isLoading]);

     useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return <CustomerView customers={customers} jobs={jobs} contracts={contracts} equipment={equipment} allSkills={allSkills.map(s => s.name)} companyId={userProfile?.companyId} onCustomerAdded={fetchData} />;
}
