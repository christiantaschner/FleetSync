"use client";

import React, { useState, useMemo } from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, Briefcase } from 'lucide-react';

interface CustomerViewProps {
    jobs: Job[];
}

interface Customer {
    name: string;
    phone: string;
    address: string;
    jobCount: number;
    lastActivity: string;
}

export default function CustomerView({ jobs }: CustomerViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const customers = useMemo(() => {
        const customerMap = new Map<string, Customer & { jobs: Job[] }>();
        
        jobs.forEach(job => {
            const key = `${job.customerName.toLowerCase()}|${job.customerPhone}`;
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    name: job.customerName,
                    phone: job.customerPhone,
                    address: job.location.address || 'N/A', // Use last known address
                    jobCount: 0,
                    lastActivity: '1970-01-01T00:00:00.000Z',
                    jobs: []
                });
            }
            const customer = customerMap.get(key)!;
            customer.jobCount++;
            if (new Date(job.createdAt) > new Date(customer.lastActivity)) {
                customer.lastActivity = job.createdAt;
                customer.address = job.location.address || customer.address;
            }
            customer.jobs.push(job);
        });

        const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => 
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );
        
        return sortedCustomers;

    }, [jobs]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const selectedCustomerJobs = useMemo(() => {
        if (!selectedCustomer) return [];
        const customerData = customers.find(c => c.name === selectedCustomer.name && c.phone === selectedCustomer.phone);
        return customerData ? customerData.jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
    }, [selectedCustomer, customers]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                    <CardDescription>Select a customer to view their job history.</CardDescription>
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
                                    <p className="text-xs opacity-70 mt-1">{customer.jobCount} job(s) - Last active: {new Date(customer.lastActivity).toLocaleDateString()}</p>
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
                            <CardTitle className="flex items-center gap-2"><User />{selectedCustomer.name}</CardTitle>
                            <CardDescription>
                                <p className="flex items-center gap-1"><Phone size={14}/>{selectedCustomer.phone}</p>
                                <p className="flex items-center gap-1 mt-1"><MapPin size={14}/>Last Address: {selectedCustomer.address}</p>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Briefcase/>Job History</h3>
                           <ScrollArea className="h-[55vh] border rounded-md p-2">
                                <div className="space-y-4 p-2">
                                {selectedCustomerJobs.map(job => (
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
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="h-full flex items-center justify-center">
                        <CardContent className="text-center pt-6">
                            <User size={48} className="mx-auto text-muted-foreground" />
                            <p className="mt-4 text-lg font-medium">Select a customer</p>
                            <p className="text-muted-foreground">Their job history will be displayed here.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
