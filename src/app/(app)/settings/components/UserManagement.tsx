
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile, Invite } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCompanyUsersAction, inviteUserAction, removeUserFromCompanyAction, updateUserRoleAction, getCompanyInvitesAction } from '@/actions/user-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, PlusCircle, Trash2, ShieldCheck, User, Wrench, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/auth-context';
import { Controller } from "react-hook-form";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const InviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(['admin', 'technician']),
});
type InviteUserFormValues = z.infer<typeof InviteUserSchema>;

interface UserManagementProps {
    companyId: string;
    ownerId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ companyId, ownerId }) => {
    const { toast } = useToast();
    const { user: currentUser, company } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
    
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    const technicianCount = users.filter(u => u.role === 'technician').length;
    const seatLimit = company?.technicianSeatCount || 1;
    const atOrOverLimit = technicianCount >= seatLimit;

    const { register, handleSubmit, reset, formState: { errors }, control, watch } = useForm<InviteUserFormValues>({
        resolver: zodResolver(InviteUserSchema),
        defaultValues: { role: 'technician' }
    });
    
    const selectedRole = watch('role');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        if (!companyId) {
            setIsLoading(false);
            return;
        }

        const [usersResult, invitesResult] = await Promise.all([
            getCompanyUsersAction(companyId),
            getCompanyInvitesAction(companyId),
        ]);

        if (usersResult.error) {
            toast({ title: 'Error fetching users', description: usersResult.error, variant: 'destructive' });
        } else {
            setUsers(usersResult.data || []);
        }
        
        if (invitesResult.error) {
            toast({ title: 'Error fetching invites', description: invitesResult.error, variant: 'destructive' });
        } else {
            setInvites(invitesResult.data || []);
        }

        setIsLoading(false);
    }, [companyId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const onInviteSubmit = async (data: InviteUserFormValues) => {
        if (!appId) {
            toast({ title: 'Configuration Error', description: 'App ID is missing.', variant: 'destructive'});
            return;
        }
        if (atOrOverLimit && data.role === 'technician') {
            toast({ title: 'Seat Limit Reached', description: 'Please upgrade your plan to add more technicians.', variant: 'destructive'});
            return;
        }

        setIsSubmitting(true);
        const result = await inviteUserAction({ ...data, companyId, appId });
        if (result.error) {
            toast({ title: 'Invite Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Invite Sent!', description: `An invitation has been created for ${data.email}. The user will be automatically added to your company upon signup.` });
            reset();
            fetchData();
        }
        setIsSubmitting(false);
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'technician') => {
        setIsUpdatingRole(userId);
        try {
            const result = await updateUserRoleAction({ userId, companyId, newRole });
            if (result.error) {
                toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}. The change will apply on their next login or page refresh.` });
                await fetchData();
            }
        } catch (e: any) {
             toast({ title: 'Update Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsUpdatingRole(null);
        }
    };
    
    const handleRemoveUser = async (userId: string) => {
        if (!appId) {
            toast({ title: 'Configuration Error', description: 'App ID is missing.', variant: 'destructive' });
            return;
        }

        const result = await removeUserFromCompanyAction({ userId, companyId, appId });
        if (result.error) {
            toast({ title: 'Removal Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'User Removed', description: `The user has been removed from the company.` });
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
             <Alert variant={atOrOverLimit ? "destructive" : "default"}>
                <Users className="h-4 w-4" />
                <AlertTitle>Technician Seats</AlertTitle>
                <AlertDescription>
                    You are currently using <strong>{technicianCount}</strong> of your <strong>{seatLimit}</strong> available technician seats.
                    {atOrOverLimit && (
                        <span className="block mt-1">
                            Please <Link href="/settings?tab=billing" className="font-semibold underline">upgrade your plan</Link> to add more technicians.
                        </span>
                    )}
                </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4 p-4 border rounded-lg bg-secondary/50">
                 <h4 className="font-semibold text-lg">Invite New User</h4>
                 <Alert>
                    <Mail className="h-4 w-4"/>
                    <AlertTitle>How Invites Work</AlertTitle>
                    <AlertDescription>
                        Enter an email address to invite someone. If they already have an account, they'll be added instantly. If not, they'll be automatically added to your company as soon as they sign up with that email.
                    </AlertDescription>
                 </Alert>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                        <Label htmlFor="email">User's Email</Label>
                        <Input id="email" {...register('email')} placeholder="name@example.com" />
                         {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="role">Assign Role</Label>
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technician">Technician</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting || (atOrOverLimit && selectedRole === 'technician')}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                        Invite User
                    </Button>
                </div>
            </form>

            <div className="space-y-2">
                 <h4 className="font-semibold text-lg">Current Users</h4>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                 <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                        This company has no users.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>
                                             <Select 
                                                value={user.role ?? ''} 
                                                onValueChange={(value) => handleRoleChange(user.uid, value as any)}
                                                disabled={isUpdatingRole === user.uid || user.uid === ownerId}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin"><div className="flex items-center gap-1"><ShieldCheck className="h-4 w-4"/>Admin</div></SelectItem>
                                                    <SelectItem value="technician"><div className="flex items-center gap-1"><Wrench className="h-4 w-4"/>Technician</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {user.uid !== ownerId && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will remove <strong>{user.email}</strong> from your company and also delete their associated Technician profile. They will lose all access. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveUser(user.uid)} className="bg-destructive hover:bg-destructive/90">
                                                                Confirm Removal
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="space-y-2">
                 <h4 className="font-semibold text-lg">Pending & Accepted Invitations</h4>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invited Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Invited</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : invites.length === 0 ? (
                                 <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        No invitations have been sent.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invites.map(invite => (
                                    <TableRow key={invite.id}>
                                        <TableCell className="font-medium">{invite.email}</TableCell>
                                        <TableCell className="capitalize">{invite.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={invite.status === 'pending' ? 'default' : 'secondary'}>
                                                {invite.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

export default UserManagement;
