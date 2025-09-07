
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CustomerData, Skill, Part } from '@/types';
import { Loader2 } from 'lucide-react';
import CustomerView from './components/CustomerView';
import { useAuth } from '@/contexts/auth-context';
import { mockCustomers } from '@/lib/mock-data';
import { getSkillsAction } from '@/actions/skill-actions';
import { getPartsAction } from '@/actions/part-actions';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { PREDEFINED_PARTS } from '@/lib/parts';
import { useSearchParams } from 'next/navigation';
import { MockModeBanner } from '@/components/common/MockModeBanner';

export default function CustomersPage() {
    const { user, userProfile, loading: authLoading, isMockMode } = useAuth();
    const searchParams = useSearchParams();
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [allParts, setAllParts] = useState<Part[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const urlSearchTerm = searchParams.get('search');
        if(urlSearchTerm) {
            setSearchTerm(urlSearchTerm);
        }
    }, [searchParams]);

    const fetchData = useCallback(() => {
        if (authLoading) {
            return;
        }

        if (isMockMode) {
            setCustomers(mockCustomers);
            setAllSkills(PREDEFINED_SKILLS.map((name, index) => ({ id: `mock_skill_${index}`, name })));
            setAllParts(PREDEFINED_PARTS.map((name, index) => ({ id: `mock_part_${index}`, name })));
            setIsLoading(false);
            return () => {};
        }

        if (!db || !userProfile?.companyId) {
            setIsLoading(false);
            return () => {};
        }
        
        const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!appId) {
            setError("Configuration Error: Cannot fetch customer data.");
            setIsLoading(false);
            return () => {};
        }

        let loadedCount = 0;
        const totalCollections = 3; // Customers, Skills, Parts
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
          updateLoadingState();
        });
        
        getPartsAction({ companyId, appId }).then(result => {
          if (result.data) {
            setAllParts(result.data);
          }
          updateLoadingState();
        });


        const customersQuery = query(
            collection(db, `artifacts/${appId}/public/data/customers`), 
            where("companyId", "==", companyId), 
            orderBy("name", "asc")
        );
        const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
            const customersData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 for (const key in data) {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        (data[key] as any) = data[key].toDate().toISOString();
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
            unsubscribeCustomers();
        };
    }, [authLoading, userProfile, isLoading, isMockMode]);

     useEffect(() => {
        const unsubscribe = fetchData();
        return () => {
            if (unsubscribe) unsubscribe();
        }
    }, [fetchData]);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div>
            <MockModeBanner />
            <CustomerView 
                initialCustomers={customers} 
                allSkills={allSkills.map(s => s.name)} 
                allParts={allParts}
                onCustomerAdded={fetchData} 
                initialSearchTerm={searchTerm} />
        </div>
    );
}
