
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Job, Contract, CustomerData, Customer, Equipment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, Briefcase, Repeat, Circle, UserPlus, Mail, Edit, PlusCircle, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AddCustomerDialog from './AddCustomerDialog';
import { mockCustomers, mockJobs, mockContracts, mockEquipment } from '@/lib/mock-data';
import AddEditJobDialog from '../../dashboard/components/AddEditJobDialog';
import AddEditContractDialog from '../../contracts/components/AddEditContractDialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddEquipmentDialog from './AddEquipmentDialog';

interface CustomerViewProps {
    initialCustomers: CustomerData[];
    allSkills: string[];
    onCustomerAdded: () => void;
    initialSearchTerm?: string;
}

export default function CustomerView({ initialCustomers, allSkills, onCustomerAdded, initialSearchTerm = '' }: CustomerViewProps) {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
    const [selectedCustomerJobs, setSelectedCustomerJobs] = useState<Job[]>([]);
    const [selectedCustomerContracts, setSelectedCustomerContracts] = useState<Contract[]>([]);
    const [selectedCustomerEquipment, setSelectedCustomerEquipment] = useState<Equipment[]>([]);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<CustomerData | null>(null);
    const { userProfile, isMockMode } = useAuth();
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';

    const [isAddJobOpen, setIsAddJobOpen] = useState(false);
    const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
    const [prefilledJobData, setPrefilledJobData] = useState<Partial<Job> | null>(null);

    const [isAddContractOpen, setIsAddContractOpen] = useState(false);
    const [selectedContractForEdit, setSelectedContractForEdit] = useState<Contract | null>(null);
    const [prefilledContractData, setPrefilledContractData] = useState<Partial<Contract> | null>(null);
    
    const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);

    const router = useRouter();
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return initialCustomers;
        return initialCustomers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [initialCustomers, searchTerm]);

    useEffect(() => {
        if (initialSearchTerm && filteredCustomers.length > 0) {
            const match = filteredCustomers.find(c => c.name.toLowerCase() === initialSearchTerm.toLowerCase());
            setSelectedCustomer(match || filteredCustomers[0]);
        } else if (filteredCustomers.length > 0 && !selectedCustomer) {
            setSelectedCustomer(filteredCustomers[0]);
        } else if (filteredCustomers.length === 0) {
            setSelectedCustomer(null);
        }
    }, [initialSearchTerm, filteredCustomers, selectedCustomer]);

    const fetchRelatedData = useCallback(() => {
        if (!selectedCustomer) {
            setSelectedCustomerJobs([]);
            setSelectedCustomerContracts([]);
            setSelectedCustomerEquipment([]);
            return;
        }

        if (isMockMode) {
            const jobs = mockJobs.filter(j => j.customerId === selectedCustomer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const contracts = mockContracts.filter(c => c.customerName === selectedCustomer.name).sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            const equipment = mockEquipment.filter(e => e.customerId === selectedCustomer.id).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
            setSelectedCustomerJobs(jobs);
            setSelectedCustomerContracts(contracts);
            setSelectedCustomerEquipment(equipment);
            return;
        }

        if (!userProfile?.companyId || !appId) {
            setSelectedCustomerJobs([]);
            setSelectedCustomerContracts([]);
            setSelectedCustomerEquipment([]);
            return;
        }

        const jobsQuery = query(
            collection(db, `artifacts/${appId}/public/data/jobs`),
            where('companyId', '==', userProfile.companyId),
            where('customerId', '==', selectedCustomer.id)
        );
        const contractsQuery = query(
            collection(db, `artifacts/${appId}/public/data/contracts`),
            where('companyId', '==', userProfile.companyId),
            where('customerName', '==', selectedCustomer.name)
        );
        const equipmentQuery = query(
             collection(db, `artifacts/${appId}/public/data/equipment`),
            where('companyId', '==', userProfile.companyId),
            where('customerId', '==', selectedCustomer.id)
        );

        const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSelectedCustomerJobs(jobsData);
        });

        const unsubContracts = onSnapshot(contractsQuery, (snapshot) => {
            const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract)).sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setSelectedCustomerContracts(contractsData);
        });
        
        const unsubEquipment = onSnapshot(equipmentQuery, (snapshot) => {
            const equipmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment)).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
            setSelectedCustomerEquipment(equipmentData);
        });
        
        return () => {
            unsubJobs();
            unsubContracts();
            unsubEquipment();
        };

    }, [selectedCustomer, userProfile, appId, isMockMode]);

    useEffect(() => {
        const unsubscribe = fetchRelatedData();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchRelatedData]);
    
    const handleEditCustomer = () => {
        if (!selectedCustomer) return;
        setCustomerToEdit(selectedCustomer);
        setIsAddCustomerOpen(true);
    };
    
    const handleAddCustomer = () => {
        setCustomerToEdit(null);
        setIsAddCustomerOpen(true);
    };

    const handleOpenEditJob = (job: Job) => {
      router.push(`/job/${job.id}`);
    };

    const handleAddNewJob = () => {
      if (!selectedCustomer) return;
      setSelectedJobForEdit(null);
      setPrefilledJobData({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone || '',
        customerEmail: selectedCustomer.email || '',
        location: {
          address: selectedCustomer.address || '',
          latitude: 0,
          longitude: 0,
        },
      });
      setIsAddJobOpen(true);
    };
    
    const handleEditContract = (contract: Contract) => {
        setSelectedContractForEdit(contract);
        setPrefilledContractData(null);
        setIsAddContractOpen(true);
    };

    const handleAddNewContract = () => {
      if (!selectedCustomer) return;
      setSelectedContractForEdit(null);
      setPrefilledContractData({
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone || '',
        customerAddress: selectedCustomer.address || '',
      });
      setIsAddContractOpen(true);
    };
    
    const handleAddEquipment = () => {
        if (!selectedCustomer) return;
        setIsAddEquipmentOpen(true);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <AddCustomerDialog
                isOpen={isAddCustomerOpen}
                setIsOpen={setIsAddCustomerOpen}
                onCustomerUpserted={onCustomerAdded}
                customerToEdit={customerToEdit}
            />
             <AddEditJobDialog
                isOpen={isAddJobOpen}
                onClose={() => setIsAddJobOpen(false)}
                job={selectedJobForEdit}
                prefilledData={prefilledJobData}
                jobs={[]} 
                technicians={[]}
                customers={initialCustomers}
                contracts={[]}
                allSkills={allSkills}
                onManageSkills={() => {}}
            />
            <AddEditContractDialog
                isOpen={isAddContractOpen}
                onClose={() => setIsAddContractOpen(false)}
                contract={selectedContractForEdit}
                prefilledData={prefilledContractData}
                customers={initialCustomers}
                onContractUpdated={onCustomerAdded}
            />
            {selectedCustomer && userProfile?.companyId && (
                <AddEquipmentDialog
                    isOpen={isAddEquipmentOpen}
                    setIsOpen={setIsAddEquipmentOpen}
                    customerId={selectedCustomer.id}
                    customerName={selectedCustomer.name}
                    companyId={userProfile.companyId}
                    onEquipmentAdded={fetchRelatedData}
                />
            )}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>All Customers</CardTitle>
                            <CardDescription>Select a customer to view their details.</CardDescription>
                        </div>
                        {isAdmin && (
                            <Button variant="accent" size="sm" onClick={handleAddCustomer}>
                                <UserPlus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                     <Input 
                        placeholder="Search by name, email or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-3 pr-4">
                            {filteredCustomers.map(customer => (
                                <button 
                                    key={customer.id} 
                                    onClick={() => setSelectedCustomer(customer)}
                                    className={cn('w-full p-3 rounded-lg text-left transition-colors', selectedCustomer?.id === customer.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}
                                >
                                    <p className="font-semibold">{customer.name}</p>
                                    <p className="text-sm opacity-80 flex items-center gap-1"><Mail size={12}/>{customer.email || 'No email'}</p>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="lg:col-span-2">
                {selectedCustomer ? (
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2"><User />{selectedCustomer.name}</CardTitle>
                                    <CardDescription className="space-y-1 mt-1">
                                        <p className="flex items-center gap-1"><Mail size={14}/>{selectedCustomer.email || 'No email'}</p>
                                        <p className="flex items-center gap-1"><Phone size={14}/>{selectedCustomer.phone || 'No phone'}</p>
                                        <p className="flex items-center gap-1"><MapPin size={14}/>Address: {selectedCustomer.address}</p>
                                    </CardDescription>
                                </div>
                                {isAdmin && selectedCustomer.id && (
                                    <Button variant="outline" size="sm" onClick={handleEditCustomer}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Customer
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="jobs">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="jobs"><Briefcase className="w-4 h-4 mr-1.5"/>Job History</TabsTrigger>
                                    <TabsTrigger value="contracts"><Repeat className="w-4 h-4 mr-1.5"/>Contracts</TabsTrigger>
                                    <TabsTrigger value="equipment"><Package className="w-4 h-4 mr-1.5"/>Equipment</TabsTrigger>
                                </TabsList>
                                <TabsContent value="jobs" className="mt-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">Job History ({selectedCustomerJobs.length})</h3>
                                        {isAdmin && (
                                            <Button variant="outline" size="sm" onClick={handleAddNewJob}><PlusCircle className="mr-2 h-4 w-4" /> Add Job</Button>
                                        )}
                                   </div>
                                   <ScrollArea className="h-[50vh] border rounded-md p-2">
                                        <div className="space-y-3 p-2">
                                        {selectedCustomerJobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No job history.</p>}
                                        {selectedCustomerJobs.map(job => (
                                            <button key={job.id} onClick={() => handleOpenEditJob(job)} className="w-full text-left p-3 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold">{job.title}</p>
                                                    <Badge variant={job.status === 'Completed' ? 'secondary' : job.status === 'Cancelled' ? 'destructive' : 'default'}>{job.status}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                                                <p className="text-sm mt-1">{job.description}</p>
                                            </button>
                                        ))}
                                        </div>
                                   </ScrollArea>
                                </TabsContent>
                                <TabsContent value="contracts" className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">Service Contracts ({selectedCustomerContracts.length})</h3>
                                    {isAdmin && (
                                        <Button variant="outline" size="sm" onClick={handleAddNewContract}><PlusCircle className="mr-2 h-4 w-4" /> Add Contract</Button>
                                    )}
                                   </div>
                                    <ScrollArea className="h-[50vh] border rounded-md p-2">
                                        <div className="space-y-3 p-2">
                                        {selectedCustomerContracts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active contracts.</p>}
                                        {selectedCustomerContracts.map(contract => (
                                            <button onClick={() => handleEditContract(contract)} key={contract.id} className="w-full text-left block p-3 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-sm">{contract.jobTemplate.title}</p>
                                                    <Badge variant={contract.isActive ? "secondary" : "destructive"}>
                                                        <Circle className={cn("mr-1.5 h-2 w-2 fill-current", contract.isActive ? "text-green-500" : "text-red-500")} />
                                                        {contract.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{contract.frequency} - Starts {format(new Date(contract.startDate), "PPP")}</p>
                                            </button>
                                        ))}
                                        </div>
                                   </ScrollArea>
                                </TabsContent>
                                <TabsContent value="equipment" className="mt-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">Installed Equipment ({selectedCustomerEquipment.length})</h3>
                                        {isAdmin && (
                                            <Button variant="outline" size="sm" onClick={handleAddEquipment}><PlusCircle className="mr-2 h-4 w-4" /> Add Equipment</Button>
                                        )}
                                    </div>
                                    <ScrollArea className="h-[50vh] border rounded-md p-2">
                                         <div className="space-y-3 p-2">
                                            {selectedCustomerEquipment.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No equipment logged for this customer.</p>}
                                            {selectedCustomerEquipment.map(item => (
                                                <div key={item.id} className="w-full text-left block p-3 rounded-md bg-secondary/50">
                                                    <p className="font-semibold text-sm">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">Model: {item.model || 'N/A'}</p>
                                                    <p className="text-xs text-muted-foreground">S/N: {item.serialNumber || 'N/A'}</p>
                                                    {item.installDate && <p className="text-xs text-muted-foreground">Installed: {format(new Date(item.installDate), "PPP")}</p>}
                                                    {item.nextMaintenanceDate && (
                                                        <p className="text-xs font-medium text-primary flex items-center gap-1 mt-1"><Calendar size={12}/> Next Service Due: {format(new Date(item.nextMaintenanceDate), "PPP")}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="h-full flex items-center justify-center">
                        <CardContent className="text-center pt-6">
                            <User size={48} className="mx-auto text-muted-foreground" />
                            <p className="mt-4 text-lg font-medium">Select a customer</p>
                            <p className="text-muted-foreground">Their complete history will be displayed here.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
