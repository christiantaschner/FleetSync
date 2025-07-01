
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
import { differenceInDays } from 'date-fns';

const adminNavItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/contracts", label: "Contracts", icon: Repeat },
  { href: "/app/customers", label: "Customers", icon: ClipboardList },
  { href: "/app/reports", label: "Reports", icon: PieChart },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const getTechnicianNavItems = (uid: string) => [
  { href: `/app/technician/jobs/${uid}`, label: "My Active Jobs", icon: Smartphone },
];

const csrNavItems = [
  { href: "/app/dashboard", label: "Create Job", icon: PlusCircle },
  { href: "/app/contracts", label: "Manage Contracts", icon: Repeat },
];

const superAdminNavItems = [
  { href: "/app/roadmap", label: "Roadmap", icon: ListChecks },
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
        if (pathname !== '/app/onboarding') {
          router.replace('/app/onboarding');
        }
        return;
      }

      if (userProfile.onboardingStatus === 'completed' && userProfile.companyId) {
        if (pathname === '/app/onboarding') {
          router.replace('/app/dashboard');
        }
        // Redirect technician to their specific jobs page if they land somewhere else
        // but allow them to visit their profile.
        if (userProfile.role === 'technician' && !pathname.startsWith('/app/technician')) {
            router.replace(`/app/technician/jobs/${user.uid}`);
        }
        return;
      }
    }
  }, [user, userProfile, loading, router, pathname]);

  let trialDaysLeft: number | null = null;
  if (company?.subscriptionStatus === 'trialing' && company.trialEndsAt) {
      const days = differenceInDays(new Date(company.trialEndsAt), new Date());
      // Ensure we don't show a negative number if the trial just ended.
      trialDaysLeft = Math.max(0, days);
  }

  const isTrialActive = company?.subscriptionStatus === 'trialing' && trialDaysLeft !== null && trialDaysLeft >= 0;

  const isSubscriptionExpired = 
    company &&
    !pathname.startsWith('/app/settings') && 
    company.subscriptionStatus !== 'active' &&
    !isTrialActive;


  if (loading || !userProfile || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userProfile.onboardingStatus === 'pending_onboarding' && pathname !== '/app/onboarding') {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }
  
  if (pathname === '/app/onboarding') {
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
            return getTechnicianNavItems(user.uid);
        case 'csr':
            return csrNavItems;
        case 'superAdmin':
            return [...adminNavItems, ...superAdminNavItems];
        case 'admin':
        default:
            return adminNavItems;
    }
  };
  
  const navItems = getNavItemsForRole();
  const canSeeAdminViews = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="peer">
        <SidebarHeader className="bg-primary text-primary-foreground border-b-primary-foreground/20">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="md:hidden">
              <SidebarTrigger className="text-primary-foreground hover:bg-primary/80" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href))}
                    className="w-full justify-start"
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            {canSeeAdminViews && (
              <>
                <SidebarSeparator />
                 <SidebarMenuItem>
                    <Link href="/app/technician">
                    <SidebarMenuButton
                        isActive={pathname.startsWith("/app/technician")}
                        className="w-full justify-start"
                        tooltip="Technician View"
                    >
                        <Smartphone className="h-4 w-4" />
                        <span>Technician View</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/app/dashboard">
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
                 <Link href="/app/technician/profile">
                    <DropdownMenuItem>
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>My Technician Profile</span>
                    </DropdownMenuItem>
                </Link>
               )}
                {userProfile?.role === 'technician' && (
                    <Link href="/app/technician/profile">
                        <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </DropdownMenuItem>
                    </Link>
                )}
              <Link href="/app/settings">
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
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-primary-foreground/20 bg-primary px-4 text-primary-foreground md:hidden">
           <SidebarTrigger className="text-primary-foreground hover:bg-primary/80" />
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
                        <Link href="/app/settings?tab=billing" className="font-bold underline">
                            go to your billing settings
                        </Link>
                        {' '} to choose a plan and continue using all features.
                    </AlertDescription>
                </Alert>
            ) : isTrialActive ? (
                <Alert className="mb-6 border-primary/50 bg-primary/5 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle className="font-headline text-primary">Welcome to your free trial!</AlertTitle>
                    <AlertDescription className="text-primary/90">
                        You have <strong>{trialDaysLeft} days left</strong>. {' '}
                        <Link href="/app/settings?tab=billing" className="font-semibold underline">
                            Choose a plan
                        </Link>
                        {' '} to keep your service active after the trial.
                    </AlertDescription>
                </Alert>
            ) : null}
            
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
