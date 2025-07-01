
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCompanyUsersAction, inviteUserAction, removeUserFromCompanyAction, updateUserRoleAction } from '@/actions/user-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, PlusCircle, Trash2, ShieldCheck, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const InviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(['admin', 'technician', 'csr']),
});
type InviteUserFormValues = z.infer<typeof InviteUserSchema>;

interface UserManagementProps {
    companyId: string;
    ownerId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ companyId, ownerId }) => {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteUserFormValues>({
        resolver: zodResolver(InviteUserSchema),
        defaultValues: { role: 'technician' }
    });

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        const result = await getCompanyUsersAction(companyId);
        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            setUsers(result.data || []);
        }
        setIsLoading(false);
    }, [companyId, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const onInviteSubmit = async (data: InviteUserFormValues) => {
        setIsSubmitting(true);
        const result = await inviteUserAction({ ...data, companyId });
        if (result.error) {
            toast({ title: 'Invite Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Invite Sent!', description: `An invitation has been associated with ${data.email}. They can now log in.` });
            reset();
            fetchUsers();
        }
        setIsSubmitting(false);
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'technician' | 'csr') => {
        setIsUpdatingRole(userId);
        const result = await updateUserRoleAction({ userId, newRole });
         if (result.error) {
            toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}.` });
            fetchUsers();
        }
        setIsUpdatingRole(null);
    };
    
    const handleRemoveUser = async (userId: string) => {
        const result = await removeUserFromCompanyAction(userId);
        if (result.error) {
            toast({ title: 'Removal Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'User Removed', description: `The user has been removed from the company.` });
            fetchUsers();
        }
    };

    const getRoleIcon = (role: UserProfile['role']) => {
        switch (role) {
            case 'admin': return <ShieldCheck className="h-4 w-4 text-green-600" />;
            case 'technician': return <Wrench className="h-4 w-4 text-blue-600" />;
            case 'csr': return <User className="h-4 w-4 text-purple-600" />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4 p-4 border rounded-lg bg-secondary/50">
                 <h4 className="font-semibold text-lg">Invite New User</h4>
                 <Alert>
                    <Mail className="h-4 w-4"/>
                    <AlertTitle>How Invites Work</AlertTitle>
                    <AlertDescription>
                        The user must first <a href="/signup" target="_blank" className="font-semibold underline">create a free account</a>. Once their account exists, you can invite them to your company using their email address here.
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
                        <Select onValueChange={(value) => reset({ ...InviteUserSchema.parse({ email: '', role: value as any }), email: (document.getElementById('email') as HTMLInputElement).value })} defaultValue="technician">
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="technician">Technician</SelectItem>
                                <SelectItem value="csr">CSR</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
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
                                                    <SelectItem value="csr"><div className="flex items-center gap-1"><User className="h-4 w-4"/>CSR</div></SelectItem>
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
                                                                This will remove <strong>{user.email}</strong> from your company. They will lose all access. This action cannot be undone.
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
        </div>
    )
}

export default UserManagement;
