
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, Repeat, CalendarPlus } from 'lucide-react';
import type { Contract } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import AddEditContractDialog from './components/AddEditContractDialog';
import ContractListItem from './components/ContractListItem';
import GenerateJobsDialog from './components/GenerateJobsDialog';
import SuggestAppointmentDialog from './components/SuggestAppointmentDialog';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { mockContracts } from '@/lib/mock-data';
import { addDays, isBefore } from 'date-fns';
import { getNextDueDate } from '@/lib/utils';

export default function ContractsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [contracts, setContracts] = useState<(Contract & { isDue?: boolean })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    const [isGenerateJobsOpen, setIsGenerateJobsOpen] = useState(false);
    const [isSuggestAppointmentOpen, setIsSuggestAppointmentOpen] = useState(false);
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const fetchContracts = useCallback(() => {
        if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
            const contractsData = mockContracts.map(contract => {
                const nextDueDate = getNextDueDate(contract);
                const oneWeekFromNow = addDays(new Date(), 7);
                const isDue = contract.isActive && isBefore(nextDueDate, oneWeekFromNow);
                return { ...contract, isDue };
            });
            contractsData.sort((a, b) => {
                if (a.isDue && !b.isDue) return -1;
                if (!a.isDue && b.isDue) return 1;
                return a.customerName.localeCompare(b.customerName);
            });
            setContracts(contractsData);
            setIsLoading(false);
            return;
        }

        if (!db || !userProfile?.companyId || !appId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const contractsQuery = query(
            collection(db, `artifacts/${appId}/public/data/contracts`), 
            where("companyId", "==", userProfile.companyId)
        );
        const unsubscribe = onSnapshot(contractsQuery, (snapshot) => {
            const oneWeekFromNow = addDays(new Date(), 7);
            const contractsData = snapshot.docs.map(doc => {
                const data = doc.data();
                 for (const key in data) {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        data[key] = data[key].toDate().toISOString();
                    }
                }
                const contract = { id: doc.id, ...data } as Contract;
                const nextDueDate = getNextDueDate(contract);
                const isDue = contract.isActive && isBefore(nextDueDate, oneWeekFromNow);

                return { ...contract, isDue };
            });

            contractsData.sort((a, b) => {
                if (a.isDue && !b.isDue) return -1;
                if (!a.isDue && b.isDue) return 1;
                return a.customerName.localeCompare(b.customerName);
            });

            setContracts(contractsData as (Contract & { isDue: boolean })[]);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching contracts:", error);
            setIsLoading(false);
        });

        return unsubscribe;
    }, [userProfile, appId]);

    useEffect(() => {
        if (authLoading) {
            return;
        }
        const unsubscribe = fetchContracts();
        return () => unsubscribe?.();
    }, [authLoading, fetchContracts]);

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
            {userProfile?.companyId && (
                <AddEditContractDialog
                    isOpen={isAddEditDialogOpen}
                    onClose={onDialogClose}
                    contract={selectedContract}
                    onContractUpdated={fetchContracts}
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
            />

            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2"><Repeat/> Recurring Service Contracts</CardTitle>
                        <CardDescription>
                            Create contract templates for recurring services. After a template is created, a dispatcher can use the 'Generate Jobs' button to create all the necessary work orders for a specific time period.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {userProfile?.role === 'admin' && (
                            <Button variant="outline" onClick={() => setIsGenerateJobsOpen(true)}>
                                <CalendarPlus className="mr-2 h-4 w-4" /> Generate Jobs
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
                              Create your first recurring service contract to start generating jobs automatically.
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
