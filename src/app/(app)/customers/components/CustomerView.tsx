
"use client";

import React, { useState, useMemo } from 'react';
import type { Job, Contract } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, Briefcase, Repeat, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CustomerViewProps {
    jobs: Job[];
    contracts: Contract[];
}

interface Customer {
    name: string;
    phone: string;
    address: string;
    jobCount: number;
    lastActivity: string;
    contractCount: number;
}

export default function CustomerView({ jobs, contracts }: CustomerViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const customers = useMemo(() => {
        const customerMap = new Map<string, Customer & { jobs: Job[]; contracts: Contract[] }>();

        const processRecord = (key: string, record: { name: string; phone: string; address: string; date: string }) => {
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    name: record.name,
                    phone: record.phone,
                    address: record.address,
                    jobCount: 0,
                    contractCount: 0,
                    lastActivity: '1970-01-01T00:00:00.000Z',
                    jobs: [],
                    contracts: [],
                });
            }
            const customer = customerMap.get(key)!;
            if (new Date(record.date) > new Date(customer.lastActivity)) {
                customer.lastActivity = record.date;
                customer.address = record.address || customer.address;
            }
            return customer;
        }
        
        jobs.forEach(job => {
            const key = `${job.customerName.toLowerCase()}|${job.customerPhone}`;
            const customer = processRecord(key, {
                name: job.customerName,
                phone: job.customerPhone,
                address: job.location.address || 'N/A',
                date: job.createdAt
            });
            customer.jobCount++;
            customer.jobs.push(job);
        });

        contracts.forEach(contract => {
            const key = `${contract.customerName.toLowerCase()}|${contract.customerPhone}`;
             const customer = processRecord(key, {
                name: contract.customerName,
                phone: contract.customerPhone || 'N/A',
                address: contract.customerAddress,
                date: contract.createdAt || '1970-01-01T00:00:00.000Z'
            });
            customer.contractCount++;
            customer.contracts.push(contract);
        })

        const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => 
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );
        
        return sortedCustomers;

    }, [jobs, contracts]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const selectedCustomerData = useMemo(() => {
        if (!selectedCustomer) return null;
        const customerData = customers.find(c => c.name === selectedCustomer.name && c.phone === selectedCustomer.phone);
        if (!customerData) return null;

        return {
            jobs: customerData.jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            contracts: customerData.contracts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        };
    }, [selectedCustomer, customers]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                    <CardDescription>Select a customer to view their details.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                     <Input 
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-3 pr-4">
                            {filteredCustomers.map(customer => (
                                <button 
                                    key={`${customer.name}-${customer.phone}`} 
                                    onClick={() => setSelectedCustomer(customer)}
                                    className={`w-full p-3 rounded-lg text-left transition-colors ${selectedCustomer?.name === customer.name && selectedCustomer?.phone === customer.phone ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                                >
                                    <p className="font-semibold">{customer.name}</p>
                                    <p className="text-sm opacity-80 flex items-center gap-1"><Phone size={12}/>{customer.phone}</p>
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
                            <CardTitle className="flex items-center gap-2"><User />{selectedCustomer.name}</CardTitle>
                            <CardDescription>
                                <p className="flex items-center gap-1"><Phone size={14}/>{selectedCustomer.phone}</p>
                                <p className="flex items-center gap-1 mt-1"><MapPin size={14}/>Last Address: {selectedCustomer.address}</p>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                               <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Repeat/>Service Contracts ({selectedCustomerData.contracts.length})</h3>
                                <ScrollArea className="h-40 border rounded-md p-2">
                                    <div className="space-y-3 p-2">
                                    {selectedCustomerData.contracts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active contracts.</p>}
                                    {selectedCustomerData.contracts.map(contract => (
                                        <Link href="/contracts" key={contract.id} className="block p-3 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-sm">{contract.jobTemplate.title}</p>
                                                <Badge variant={contract.isActive ? "secondary" : "destructive"}>
                                                    <Circle className={cn("mr-1.5 h-2 w-2 fill-current", contract.isActive ? "text-green-500" : "text-red-500")} />
                                                    {contract.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{contract.frequency} - Starts {format(new Date(contract.startDate), "PPP")}</p>
                                        </Link>
                                    ))}
                                    </div>
                               </ScrollArea>
                            </div>
                           <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Briefcase/>Job History ({selectedCustomerData.jobs.length})</h3>
                               <ScrollArea className="h-[40vh] border rounded-md p-2">
                                    <div className="space-y-3 p-2">
                                    {selectedCustomerData.jobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No job history.</p>}
                                    {selectedCustomerData.jobs.map(job => (
                                        <div key={job.id} className="p-3 rounded-md bg-secondary/50">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold">{job.title}</p>
                                                <Badge variant={job.status === 'Completed' ? 'secondary' : job.status === 'Cancelled' ? 'destructive' : 'default'}>{job.status}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                                            <p className="text-sm mt-1">{job.description}</p>
                                        </div>
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
