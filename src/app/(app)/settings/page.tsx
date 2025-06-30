
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Company } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building, CreditCard } from 'lucide-react';
import CompanySettingsForm from './components/CompanySettingsForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionManagement from './components/SubscriptionManagement';

export default function SettingsPage() {
    const { company, loading } = useAuth();
    
    return (
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="general"><Building className="mr-2 h-4 w-4"/>General Settings</TabsTrigger>
                <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4"/>Billing & Subscription</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Building/> Company Settings</CardTitle>
                        <CardDescription>
                            Manage your company profile, business hours, and other settings. These will affect future scheduling suggestions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading && (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {!loading && company && (
                            <CompanySettingsForm company={company} />
                        )}
                        {!loading && !company && (
                            <p className="text-muted-foreground text-center py-10">Company data could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="billing">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><CreditCard/> Billing & Subscription</CardTitle>
                        <CardDescription>
                           Manage your subscription plan, view invoices, and update payment details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading && (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {!loading && company && (
                            <SubscriptionManagement company={company} />
                        )}
                        {!loading && !company && (
                            <p className="text-muted-foreground text-center py-10">Subscription data could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
