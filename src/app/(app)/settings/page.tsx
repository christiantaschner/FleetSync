
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Company } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building, CreditCard, Users } from 'lucide-react';
import CompanySettingsForm from './components/CompanySettingsForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionManagement from './components/SubscriptionManagement';
import UserManagement from './components/UserManagement';

export default function SettingsPage() {
    const { userProfile, company, loading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'billing' || tab === 'users') {
            setActiveTab(tab);
        } else {
            setActiveTab('general');
        }
    }, [searchParams]);

    const canManageUsers = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
    
    // Route protection logic is now primarily in the main layout,
    // but we can keep a fallback here for direct navigation attempts.
    useEffect(() => {
        if (!loading && (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superAdmin'))) {
            router.replace('/dashboard');
        }
    }, [userProfile, loading, router]);


    // Loading state for the whole page until role is confirmed
    if (loading || !userProfile) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    // This check prevents non-admins from seeing the page content flash before redirect.
    if (userProfile.role !== 'admin' && userProfile.role !== 'superAdmin') {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 max-w-xl">
                <TabsTrigger value="general"><Building className="mr-2 h-4 w-4"/>General</TabsTrigger>
                <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4"/>Billing</TabsTrigger>
                {canManageUsers && (
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Users</TabsTrigger>
                )}
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
            {canManageUsers && (
                 <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Users/> User Management</CardTitle>
                            <CardDescription>
                                Invite new users and manage roles for your company.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loading && (
                                <div className="flex justify-center items-center py-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            {!loading && userProfile?.companyId && company && (
                                <UserManagement companyId={userProfile.companyId} ownerId={company.ownerId} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            )}
        </Tabs>
    );
}
