
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import type { Job, Contract, CustomerData, Customer } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, Briefcase, Repeat, Circle, UserPlus, Mail, Edit, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AddCustomerDialog from './AddCustomerDialog';
import { mockCustomers } from '@/lib/mock-data';
import AddEditJobDialog from '../../dashboard/components/AddEditJobDialog';
import AddEditContractDialog from '../../contracts/components/AddEditContractDialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface CustomerViewProps {
    customers: CustomerData[];
    jobs: Job[];
    contracts: Contract[];
    allSkills: string[];
    onCustomerAdded: () => void;
}

interface DisplayCustomer {
    id: string; // Will be real doc ID or derived key
    name: string;
    email: string;
    phone: string;
    address: string;
    jobCount: number;
    lastActivity: string;
    contractCount: number;
    isReal: boolean; // Flag to identify if it's from customers collection
}

export default function CustomerView({ customers: initialCustomers, jobs, contracts, allSkills, onCustomerAdded }: CustomerViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<DisplayCustomer | null>(null);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<CustomerData | null>(null);
    const { userProfile } = useAuth();
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';

    const [isAddJobOpen, setIsAddJobOpen] = useState(false);
    const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);

    const [isAddContractOpen, setIsAddContractOpen] = useState(false);
    const [prefilledContract, setPrefilledContract] = useState<Partial<Contract> | null>(null);
    const router = useRouter();

    const customers = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ? mockCustomers : initialCustomers;

    const processedCustomers = useMemo(() => {
        const customerMap = new Map<string, DisplayCustomer>();

        const getKey = (name: string, phone?: string | null, email?: string | null) => (email || phone || name).toLowerCase().trim();

        // 1. Add "real" customers from the new collection first.
        customers.forEach(customer => {
            const key = getKey(customer.name, customer.phone, customer.email);
            if (!key) return;

            customerMap.set(key, {
                id: customer.id, // Use the real document ID
                name: customer.name,
                email: customer.email || 'N/A',
                phone: customer.phone || 'N/A',
                address: customer.address || 'N/A',
                jobCount: 0,
                contractCount: 0,
                lastActivity: customer.createdAt,
                isReal: true,
            });
        });

        // 2. Process jobs and either augment existing customers or add derived ones
        jobs.forEach(job => {
            const key = getKey(job.customerName, job.customerPhone, job.customerEmail);
            if (!key) return;
            
            let customer = customerMap.get(key);
            
            if (!customer) {
                customer = {
                    id: key,
                    name: job.customerName,
                    email: job.customerEmail || 'N/A',
                    phone: job.customerPhone || "N/A",
                    address: job.location.address || "N/A",
                    jobCount: 0,
                    contractCount: 0,
                    lastActivity: job.createdAt,
                    isReal: false,
                };
                customerMap.set(key, customer);
            }
            
            customer.jobCount++;
            if (new Date(job.createdAt) > new Date(customer.lastActivity)) {
                customer.lastActivity = job.createdAt;
            }
        });
        
        // 3. Process contracts similarly
        contracts.forEach(contract => {
            const key = getKey(contract.customerName, contract.customerPhone);
            if (!key) return;
            
            let customer = customerMap.get(key);
            
             if (!customer) {
                customer = {
                    id: key,
                    name: contract.customerName,
                    email: "N/A",
                    phone: contract.customerPhone || "N/A",
                    address: contract.customerAddress || "N/A",
                    jobCount: 0,
                    contractCount: 0,
                    lastActivity: contract.createdAt || '1970-01-01T00:00:00.000Z',
                    isReal: false,
                };
                customerMap.set(key, customer);
            }
            
            customer.contractCount++;
             if (new Date(contract.createdAt || 0) > new Date(customer.lastActivity)) {
                customer.lastActivity = contract.createdAt!;
            }
        });

        return Array.from(customerMap.values()).sort((a, b) => 
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );

    }, [customers, jobs, contracts]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return processedCustomers;
        return processedCustomers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [processedCustomers, searchTerm]);

    const selectedCustomerData = useMemo(() => {
        if (!selectedCustomer) return null;
        
        const customerJobs = jobs.filter(j => 
            j.customerName.toLowerCase() === selectedCustomer.name.toLowerCase() &&
            (j.customerPhone === selectedCustomer.phone || j.customerEmail === selectedCustomer.email)
        );
        
        const customerContracts = contracts.filter(c => 
            c.customerName.toLowerCase() === selectedCustomer.name.toLowerCase() &&
            (c.customerPhone && selectedCustomer.phone && c.customerPhone === selectedCustomer.phone)
        );
        
        return {
            jobs: customerJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            contracts: customerContracts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
        };
    }, [selectedCustomer, jobs, contracts]);
    
    
    const handleEditCustomer = () => {
        if (!selectedCustomer?.isReal) {
            alert("Cannot edit a customer profile that was derived from a job. Please create a formal customer profile for them first.");
            return;
        }
        const foundCustomer = customers.find(c => c.id === selectedCustomer.id);
        if (foundCustomer) {
            setCustomerToEdit(foundCustomer);
            setIsAddCustomerOpen(true);
        }
    };
    
    const handleAddCustomer = () => {
        setCustomerToEdit(null);
        setIsAddCustomerOpen(true);
    };

    const handleOpenEditJob = (job: Job) => {
      setSelectedJobForEdit(job);
      setIsAddJobOpen(true);
    };

    const handleAddNewJob = () => {
      if (!selectedCustomer) return;
      const prefilledJob = {
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone === 'N/A' ? '' : selectedCustomer.phone,
        customerEmail: selectedCustomer.email === 'N/A' ? '' : selectedCustomer.email,
        location: {
          address: selectedCustomer.address === 'N/A' ? '' : selectedCustomer.address,
          latitude: 0,
          longitude: 0,
        },
      } as Partial<Job>;
      setSelectedJobForEdit(prefilledJob as Job);
      setIsAddJobOpen(true);
    };
    
    const handleAddNewContract = () => {
      if (!selectedCustomer) return;
      setPrefilledContract({
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone === 'N/A' ? '' : selectedCustomer.phone,
        customerAddress: selectedCustomer.address === 'N/A' ? '' : selectedCustomer.address,
      });
      setIsAddContractOpen(true);
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <AddCustomerDialog
                isOpen={isAddCustomerOpen}
                setIsOpen={setIsAddCustomerOpen}
                onCustomerAdded={onCustomerAdded}
                customerToEdit={customerToEdit}
            />
             <AddEditJobDialog
                isOpen={isAddJobOpen}
                onClose={() => setIsAddJobOpen(false)}
                job={selectedJobForEdit}
                jobs={jobs}
                technicians={[]}
                customers={customers as Customer[]}
                contracts={contracts}
                allSkills={allSkills}
                onManageSkills={() => {}}
            />
            <AddEditContractDialog
                isOpen={isAddContractOpen}
                onClose={() => setIsAddContractOpen(false)}
                contract={prefilledContract as Contract | null}
                onContractUpdated={onCustomerAdded}
            />
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
                                    className={`w-full p-3 rounded-lg text-left transition-colors ${selectedCustomer?.id === customer.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                                >
                                    <p className="font-semibold">{customer.name}</p>
                                    <p className="text-sm opacity-80 flex items-center gap-1"><Mail size={12}/>{customer.email || 'No email'}</p>
                                    <div className="flex justify-between items-center text-xs opacity-70 mt-1">
                                       <span>{customer.jobCount} job(s) / {customer.contractCount} contract(s)</span>
                                       <span>Last active: {new Date(customer.lastActivity).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="lg:col-span-2">
                {selectedCustomer && selectedCustomerData ? (
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2"><User />{selectedCustomer.name}</CardTitle>
                                    <CardDescription className="space-y-1 mt-1">
                                        <p className="flex items-center gap-1"><Mail size={14}/>{selectedCustomer.email || 'No email'}</p>
                                        <p className="flex items-center gap-1"><Phone size={14}/>{selectedCustomer.phone || 'No phone'}</p>
                                        <p className="flex items-center gap-1"><MapPin size={14}/>Last Address: {selectedCustomer.address}</p>
                                    </CardDescription>
                                </div>
                                {isAdmin && (
                                    <Button variant="outline" size="sm" onClick={handleEditCustomer} disabled={!selectedCustomer.isReal}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Customer
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                               <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Repeat/>Service Contracts ({selectedCustomerData.contracts.length})</h3>
                                {isAdmin && (
                                <Button variant="outline" size="sm" onClick={handleAddNewContract}><PlusCircle className="mr-2 h-4 w-4" /> Add Contract</Button>
                                )}
                               </div>
                                <ScrollArea className="h-40 border rounded-md p-2">
                                    <div className="space-y-3 p-2">
                                    {selectedCustomerData.contracts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active contracts.</p>}
                                    {selectedCustomerData.contracts.map(contract => (
                                        <button onClick={() => router.push(`/contracts?contract=${contract.id}`)} key={contract.id} className="w-full text-left block p-3 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors">
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
                            </div>
                           <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><Briefcase/>Job History ({selectedCustomerData.jobs.length})</h3>
                                    {isAdmin && (
                                        <Button variant="outline" size="sm" onClick={handleAddNewJob}><PlusCircle className="mr-2 h-4 w-4" /> Add Job</Button>
                                    )}
                               </div>
                               <ScrollArea className="h-[40vh] border rounded-md p-2">
                                    <div className="space-y-3 p-2">
                                    {selectedCustomerData.jobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No job history.</p>}
                                    {selectedCustomerData.jobs.map(job => (
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
                           </div>
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
