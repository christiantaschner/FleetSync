

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, Repeat, CalendarPlus } from 'lucide-react';
import type { Contract, Job, Customer, Technician } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import AddEditContractDialog from './components/AddEditContractDialog';
import ContractListItem from './components/ContractListItem';
import GenerateJobsDialog from './components/GenerateJobsDialog';
import SuggestAppointmentDialog from './components/SuggestAppointmentDialog';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { mockContracts, mockJobs, mockCustomers, mockTechnicians } from '@/lib/mock-data';
import { addDays, isBefore } from 'date-fns';
import { getNextDueDate } from '@/lib/utils';
import { MockModeBanner } from '@/components/common/MockModeBanner';

export default function ContractsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [contracts, setContracts] = useState<(Contract & { isDue?: boolean })[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    const [isGenerateJobsOpen, setIsGenerateJobsOpen] = useState(false);
    const [isSuggestAppointmentOpen, setIsSuggestAppointmentOpen] = useState(false);
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const fetchContractsAndJobs = useCallback(() => {
        if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
            const contractsData = mockContracts.map(contract => {
                const nextDueDate = getNextDueDate(contract);
                const oneWeekFromNow = addDays(new Date(), 7);
                const isTheoreticallyDue = isBefore(nextDueDate, oneWeekFromNow);
                let isDue = false;
                if (isTheoreticallyDue) {
                    const hasOpenJob = mockJobs.some(job => 
                        job.sourceContractId === contract.id &&
                        new Date(job.createdAt) > new Date(contract.lastGeneratedUntil || 0) &&
                        job.status !== 'Cancelled'
                    );
                    if (!hasOpenJob) {
                        isDue = true;
                    }
                }
                return { ...contract, isDue };
            });
            contractsData.sort((a, b) => {
                if (a.isDue && !b.isDue) return -1;
                if (!a.isDue && b.isDue) return 1;
                return a.customerName.localeCompare(b.customerName);
            });
            setContracts(contractsData);
            setJobs(mockJobs);
            setCustomers(mockCustomers);
            setTechnicians(mockTechnicians);
            setIsLoading(false);
            return () => {};
        }

        if (!db || !userProfile?.companyId || !appId) {
            setIsLoading(false);
            return () => {};
        }

        setIsLoading(true);
        let jobsUnsubscribe: (() => void) | null = null;
        let customersUnsubscribe: (() => void) | null = null;
        let techniciansUnsubscribe: (() => void) | null = null;
        
        const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", userProfile.companyId));
        const unsubscribeContracts = onSnapshot(contractsQuery, async (contractsSnapshot) => {
            
            if (jobsUnsubscribe) jobsUnsubscribe();
            if (customersUnsubscribe) customersUnsubscribe();
            if (techniciansUnsubscribe) techniciansUnsubscribe();

            const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", userProfile.companyId));
            const customersQuery = query(collection(db, `artifacts/${appId}/public/data/customers`), where("companyId", "==", userProfile.companyId));
            const techniciansQuery = query(collection(db, `artifacts/${appId}/public/data/technicians`), where("companyId", "==", userProfile.companyId));
            
            customersUnsubscribe = onSnapshot(customersQuery, (customersSnapshot) => {
                 const allCustomers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
                 setCustomers(allCustomers);
            });

            techniciansUnsubscribe = onSnapshot(techniciansQuery, (snapshot) => {
                const techs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
                setTechnicians(techs);
            });
            
            jobsUnsubscribe = onSnapshot(jobsQuery, (jobsSnapshot) => {
                const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
                setJobs(allJobs);

                const oneWeekFromNow = addDays(new Date(), 7);
                const contractsData = contractsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    for (const key in data) {
                        if (data[key] && typeof data[key].toDate === 'function') {
                            data[key] = data[key].toDate().toISOString();
                        }
                    }
                    const contract = { id: doc.id, ...data } as Contract;
                    const nextDueDate = getNextDueDate(contract);
                    const isTheoreticallyDue = isBefore(nextDueDate, oneWeekFromNow);
                    let isDue = false;

                    if (contract.isActive && isTheoreticallyDue) {
                         const hasOpenJob = allJobs.some(job => 
                            job.sourceContractId === contract.id &&
                            new Date(job.createdAt) > new Date(contract.lastGeneratedUntil || 0) &&
                            job.status !== 'Cancelled'
                        );
                        if (!hasOpenJob) {
                            isDue = true;
                        }
                    }
                    return { ...contract, isDue };
                });

                contractsData.sort((a, b) => {
                    if (a.isDue && !b.isDue) return -1;
                    if (!a.isDue && b.isDue) return 1;
                    return a.customerName.localeCompare(b.customerName);
                });

                setContracts(contractsData as (Contract & { isDue: boolean })[]);
                setIsLoading(false);
            });
        }, (error) => {
            console.error("Error fetching contracts:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribeContracts();
            if (jobsUnsubscribe) jobsUnsubscribe();
            if (customersUnsubscribe) customersUnsubscribe();
            if (techniciansUnsubscribe) techniciansUnsubscribe();
        };
    }, [userProfile, appId]);

    useEffect(() => {
        if (authLoading) return;
        const unsubscribe = fetchContractsAndJobs();
        return () => unsubscribe();
    }, [authLoading, fetchContractsAndJobs]);

    const handleEditContract = (contract: Contract) => {
        setSelectedContract(contract);
        setIsAddEditDialogOpen(true);
    };
    
    const handleSuggestAppointment = (contract: Contract) => {
        setSelectedContract(contract);
        setIsSuggestAppointmentOpen(true);
    };

    const handleAddNewContract = () => {
        setSelectedContract(null);
        setIsAddEditDialogOpen(true);
    };

    const onDialogClose = () => {
        setIsAddEditDialogOpen(false);
        setSelectedContract(null);
    }
    
    const onSuggestDialogClose = () => {
        setIsSuggestAppointmentOpen(false);
        setSelectedContract(null);
    }
    
    if (authLoading || isLoading) {
      return (
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )
    }

    return (
        <div className="space-y-6">
            <MockModeBanner />
            {userProfile?.companyId && (
                <AddEditContractDialog
                    isOpen={isAddEditDialogOpen}
                    onClose={onDialogClose}
                    contract={selectedContract}
                    customers={customers}
                    onContractUpdated={fetchContractsAndJobs}
                />
            )}
             {userProfile?.companyId && userProfile.role === 'admin' && appId && (
                <GenerateJobsDialog
                    isOpen={isGenerateJobsOpen}
                    setIsOpen={setIsGenerateJobsOpen}
                />
             )}
            <SuggestAppointmentDialog
                isOpen={isSuggestAppointmentOpen}
                onClose={onSuggestDialogClose}
                contract={selectedContract}
                technicians={technicians}
                jobs={jobs}
                onJobCreated={fetchContractsAndJobs}
            />

            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2"><Repeat/> Service Contracts</CardTitle>
                        <CardDescription className="mt-1">
                            Manage recurring service agreements that automatically generate jobs.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {userProfile?.role === 'admin' && (
                            <Button variant="outline" onClick={() => setIsGenerateJobsOpen(true)}>
                                <CalendarPlus className="mr-2 h-4 w-4" /> Generate Recurring Jobs
                            </Button>
                        )}
                        <Button onClick={handleAddNewContract}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Contract
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {contracts.length > 0 ? (
                        <div className="space-y-4">
                            {contracts.map(contract => (
                                <ContractListItem 
                                    key={contract.id} 
                                    contract={contract} 
                                    onEdit={handleEditContract} 
                                    onSuggestAppointment={handleSuggestAppointment} 
                                />
                            ))}
                        </div>
                    ) : (
                        <Alert className="border-primary/30 bg-primary/5">
                            <Repeat className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary">No Contracts Yet</AlertTitle>
                            <AlertDescription>
                              Create your first recurring service contract to start generating unassigned jobs automatically.
                            </AlertDescription>
                            <div className="mt-4">
                                <Button onClick={handleAddNewContract}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Contract
                                </Button>
                            </div>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
