
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  Users,
  Settings,
  LogOut,
  Loader2,
  ListChecks,
  Repeat,
  ClipboardList,
  UserCog,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  PieChart,
  CreditCard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays } from 'date-fns';

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: Repeat },
  { href: "/customers", label: "Customers", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const getTechnicianNavItems = (uid: string) => [
  { href: `/technician/jobs/${uid}`, label: "My Active Jobs", icon: Smartphone },
];

const csrNavItems = [
  { href: "/dashboard", label: "Create Job", icon: PlusCircle },
  { href: "/contracts", label: "Manage Contracts", icon: Repeat },
];

const sharedNavItems = [
  { href: "/roadmap", label: "Roadmap", icon: ListChecks },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, company, loading, logout } = useAuth();
  
  React.useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (userProfile) {
      if (userProfile.onboardingStatus === 'pending_onboarding') {
        if (pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
        return;
      }

      if (userProfile.onboardingStatus === 'completed' && userProfile.companyId) {
        if (pathname === '/onboarding') {
          router.replace('/dashboard');
        }
        // Redirect technician to their specific jobs page if they land somewhere else
        // but allow them to visit their profile.
        if (userProfile.role === 'technician' && !pathname.startsWith('/technician')) {
            router.replace(`/technician/jobs/${user.uid}`);
        }
        return;
      }
    }
  }, [user, userProfile, loading, router, pathname]);

  let trialDaysLeft: number | null = null;
  if (company?.subscriptionStatus === 'trialing' && company.trialEndsAt) {
      trialDaysLeft = differenceInDays(new Date(company.trialEndsAt), new Date());
  }

  const isTrialActive = company?.subscriptionStatus === 'trialing' && trialDaysLeft !== null && trialDaysLeft >= 0;

  const isSubscriptionExpired = 
    company &&
    pathname !== '/settings' && 
    company.subscriptionStatus !== 'active' &&
    !isTrialActive;


  if (loading || !userProfile || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userProfile.onboardingStatus === 'pending_onboarding' && pathname !== '/onboarding') {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }
  
  if (pathname === '/onboarding') {
      return <>{children}</>;
  }
  
  if (userProfile.onboardingStatus === 'completed' && !userProfile.companyId) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-muted p-4">
            <Logo />
            <div className="mt-8 text-center">
                <h1 className="text-2xl font-semibold">Account Pending</h1>
                <p className="mt-2 text-muted-foreground">
                    Your account is created but not yet linked to a company.
                </p>
                <p className="text-muted-foreground">
                    Please contact your company's administrator to be added.
                </p>
                <Button onClick={logout} variant="outline" className="mt-6">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Log Out
                </Button>
            </div>
        </div>
    );
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";
  const userDisplayName = user.email || "User";

  const getNavItemsForRole = () => {
    switch (userProfile?.role) {
        case 'technician':
            return [...getTechnicianNavItems(user.uid), ...sharedNavItems];
        case 'csr':
            return [...csrNavItems];
        case 'admin':
        default:
            return [...adminNavItems, ...sharedNavItems];
    }
  };
  
  const navItems = getNavItemsForRole();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="peer">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Logo />
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    className="w-full justify-start"
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            {userProfile?.role === 'admin' && (
              <>
                <SidebarSeparator />
                 <SidebarMenuItem>
                    <Link href="/technician">
                    <SidebarMenuButton
                        isActive={pathname.startsWith("/technician")}
                        className="w-full justify-start"
                        tooltip="Technician View"
                    >
                        <Smartphone className="h-4 w-4" />
                        <span>Technician View</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard">
                    <SidebarMenuButton
                        className="w-full justify-start"
                        tooltip="CSR View (Job Creation)"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>CSR View</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-start gap-2 w-full p-2 h-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
                <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate max-w-[120px]">{userDisplayName}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
               {userProfile?.role === 'admin' && (
                 <Link href="/technician/profile">
                    <DropdownMenuItem>
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>My Technician Profile</span>
                    </DropdownMenuItem>
                </Link>
               )}
                {userProfile?.role === 'technician' && (
                    <Link href="/technician/profile">
                        <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </DropdownMenuItem>
                    </Link>
                )}
              <Link href="/settings">
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-primary/20 bg-primary px-4 text-primary-foreground md:hidden">
           <SidebarTrigger/>
           <Logo />
           <div className="w-7"/>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {isSubscriptionExpired ? (
                 <Alert variant="destructive" className="mb-6">
                    <CreditCard className="h-4 w-4" />
                    <AlertTitle>
                        {company?.subscriptionStatus === 'trialing' ? 'Your Trial Has Ended' : 'Subscription Inactive'}
                    </AlertTitle>
                    <AlertDescription>
                        Please{' '}
                        <Link href="/settings" className="font-bold underline">
                            go to your billing settings
                        </Link>
                        {' '} to choose a plan and continue using all features.
                    </AlertDescription>
                </Alert>
            ) : isTrialActive && trialDaysLeft !== null ? (
                <Alert className="mb-6 border-primary/50 bg-primary/5 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle className="font-headline text-primary">Welcome to your free trial!</AlertTitle>
                    <AlertDescription className="text-primary/90">
                        You have {trialDaysLeft} days left. {' '}
                        <Link href="/settings" className="font-semibold underline">
                            Choose your plan
                        </Link>
                        {' '} to keep your service active.
                    </AlertDescription>
                </Alert>
            ) : null}
            
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
