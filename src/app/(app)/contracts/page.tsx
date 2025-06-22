
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, Repeat, CalendarPlus } from 'lucide-react';
import type { Contract } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import AddEditContractDialog from './components/AddEditContractDialog';
import ContractListItem from './components/ContractListItem';
import GenerateJobsDialog from './components/GenerateJobsDialog';
import SuggestAppointmentDialog from './components/SuggestAppointmentDialog';
import { useAuth } from '@/contexts/auth-context';

export default function ContractsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    const [isGenerateJobsOpen, setIsGenerateJobsOpen] = useState(false);
    const [isSuggestAppointmentOpen, setIsSuggestAppointmentOpen] = useState(false);

    const fetchContracts = useCallback(() => {
        if (!db || !user) return;
        setIsLoading(true);
        const contractsQuery = query(collection(db, "contracts"), orderBy("customerName", "asc"));
        const unsubscribe = onSnapshot(contractsQuery, (snapshot) => {
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
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching contracts:", error);
            toast({ title: "Error", description: "Could not fetch contracts.", variant: "destructive" });
            setIsLoading(false);
        });

        return unsubscribe;
    }, [user, toast]);

    useEffect(() => {
        const unsubscribe = fetchContracts();
        return () => unsubscribe?.();
    }, [fetchContracts]);

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
    
    return (
        <div className="space-y-6">
            <AddEditContractDialog
                isOpen={isAddEditDialogOpen}
                onClose={onDialogClose}
                contract={selectedContract}
                onContractUpdated={fetchContracts}
            />
            <GenerateJobsDialog
                isOpen={isGenerateJobsOpen}
                setIsOpen={setIsGenerateJobsOpen}
            />
            <SuggestAppointmentDialog
                isOpen={isSuggestAppointmentOpen}
                onClose={onSuggestDialogClose}
                contract={selectedContract}
            />

            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2"><Repeat/> Recurring Service Contracts</CardTitle>
                        <CardDescription>Manage recurring maintenance jobs and generate work orders.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsGenerateJobsOpen(true)}>
                            <CalendarPlus className="mr-2 h-4 w-4" /> Generate Jobs
                        </Button>
                        <Button onClick={handleAddNewContract}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Contract
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : contracts.length > 0 ? (
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
                        <p className="text-muted-foreground text-center py-10">No contracts found. Add one to get started.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    