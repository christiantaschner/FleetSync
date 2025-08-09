

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  Bot,
  AlertTriangle,
  BarChart,
  CreditCard,
  MapPin,
  Map as MapIcon,
  Briefcase,
  CalendarDays,
  HelpCircle,
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
  SidebarFooter,
  SidebarMenuBadge,
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
import { useTranslation } from '@/hooks/use-language';
import { LanguageSwitcher } from "@/components/language-switcher";
import { MockModeBanner } from "@/components/common/MockModeBanner";

function MainAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, userProfile, company, loading, logout, setHelpOpen, contractsDueCount, isMockMode } = useAuth();
  
  const adminNavItems = [
    { href: "/dashboard", label: t('dashboard'), icon: LayoutDashboard },
    { href: "/customers", label: t('customers'), icon: ClipboardList },
    { href: "/contracts", label: t('contracts'), icon: Repeat, badge: contractsDueCount > 0 ? contractsDueCount : undefined },
    { href: "/reports", label: t('reports'), icon: BarChart },
    { isSeparator: true },
    { href: "/technician", label: t('technician_view'), icon: Smartphone },
  ];
  
  const getTechnicianNavItems = (uid: string) => [
    { href: `/technician/jobs/${uid}`, label: t('my_active_jobs'), icon: Smartphone },
  ];
  
  const superAdminNavItems = [
    { href: "/roadmap", label: "Roadmap", icon: ListChecks },
  ];

  React.useEffect(() => {
    if (loading || isMockMode) return;

    if (!user) {
        router.replace("/login");
        return;
    }

    if (userProfile) {
        // Priority 1: If onboarding is pending, they MUST go to onboarding.
        if (userProfile.onboardingStatus === 'pending_onboarding') {
            if (pathname !== '/onboarding') {
                router.replace('/onboarding');
            }
            return;
        }

        // Priority 2: If onboarding is complete, check their role and route accordingly.
        if (userProfile.onboardingStatus === 'completed' && userProfile.companyId) {
            if (pathname === '/onboarding') { // Don't let them go back to onboarding
                router.replace('/dashboard');
            }
            // If user is a technician but not on a technician page, redirect them.
            if (userProfile.role === 'technician' && !pathname.startsWith('/technician')) {
                router.replace(`/technician/jobs/${user.uid}`);
            }
            return;
        }

        // Priority 3: If their profile is created but they have no company/role yet.
        if (userProfile.onboardingStatus === 'pending_creation' && !userProfile.companyId) {
            // This is the "waiting for invite" state. The UI for this is handled below.
            // No redirect needed if they are on a valid app page (which will show the message).
            return;
        }
    }
}, [user, userProfile, loading, router, pathname, isMockMode]);

  let trialDaysLeft: number | null = null;
  if (company?.subscriptionStatus === 'trialing' && company.trialEndsAt) {
      const days = differenceInDays(new Date(company.trialEndsAt), new Date());
      trialDaysLeft = Math.max(0, days);
  }

  const isTrialActive = company?.subscriptionStatus === 'trialing' && trialDaysLeft !== null && trialDaysLeft >= 0;

  const isSubscriptionExpired = 
    company &&
    pathname !== '/settings' && 
    company.subscriptionStatus !== 'active' &&
    !isTrialActive;


  if (loading || (!isMockMode && !userProfile) || (!isMockMode && userProfile?.onboardingStatus === 'pending_onboarding' && pathname !== '/onboarding')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (pathname === '/onboarding') {
      return <>{children}</>;
  }
  
  if (!isMockMode && userProfile?.onboardingStatus === 'pending_creation' && !userProfile.companyId) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-muted p-4">
            <Logo />
            <div className="mt-8 text-center max-w-md">
                <h1 className="text-2xl font-semibold">Account Created</h1>
                <p className="mt-2 text-muted-foreground">
                    Your account is active, but you are not yet a member of a company.
                </p>
                <p className="text-muted-foreground mt-1">
                    Please contact your company's administrator and ask them to invite you using your email address.
                </p>
                 <p className="text-muted-foreground mt-4 text-xs">
                    (If you are an administrator trying to create a new company, please contact support.)
                </p>
                <Button onClick={logout} variant="outline" className="mt-6">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Log Out
                </Button>
            </div>
        </div>
    );
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";
  const userDisplayName = user?.email || "User";
  const canSeeAdminViews = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';

  const getNavItemsForRole = () => {
    switch (userProfile?.role) {
        case 'technician':
            return getTechnicianNavItems(user!.uid);
        case 'superAdmin':
            return [...adminNavItems, ...superAdminNavItems];
        case 'admin':
        default:
            return adminNavItems;
    }
  };
  
  const navItems = getNavItemsForRole();

  return (
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="peer">
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item, index) => {
                 if (item.isSeparator) {
                    return <SidebarSeparator key={`sep-${index}`} className="my-1" />;
                 }
                 const isActive = item.href === '/dashboard' 
                    ? pathname === '/dashboard' && !searchParams.get('view')
                    : pathname.startsWith(item.href);
                 
                 return (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={isActive}
                        className="w-full justify-start"
                        tooltip={item.label}
                        >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             {canSeeAdminViews && (
                <SidebarMenu>
                  <SidebarSeparator />
                  <SidebarMenuItem>
                    <Link href="/settings">
                      <SidebarMenuButton
                        isActive={pathname.startsWith('/settings')}
                        className="w-full justify-start"
                        tooltip={t('settings')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>{t('settings')}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
             )}
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
                <DropdownMenuLabel>{t('my_account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                  {userProfile?.role === 'technician' ? (
                      <Link href="/technician/profile">
                          <DropdownMenuItem>
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>{t('my_profile')}</span>
                          </DropdownMenuItem>
                      </Link>
                  ) : (
                      <Link href="/settings">
                          <DropdownMenuItem>
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>{t('my_admin_profile')}</span>
                          </DropdownMenuItem>
                      </Link>
                  )}
                <DropdownMenuItem onClick={() => setHelpOpen(true)} className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help Assistant</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LanguageSwitcher />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('log_out')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-primary text-primary-foreground px-4 text-card-foreground md:hidden">
            <SidebarTrigger className="text-primary-foreground hover:bg-primary/80" />
            <Logo />
            <div className="w-7"/>
          </header>
          <main className="flex-1 overflow-x-hidden">
            {isMockMode && <MockModeBanner />}
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
              {isSubscriptionExpired ? (
                  <Alert variant="destructive" className="mb-6">
                      <CreditCard className="h-4 w-4" />
                      <AlertTitle>
                          {company?.subscriptionStatus === 'trialing' ? 'Your Trial Has Ended' : 'Subscription Inactive'}
                      </AlertTitle>
                      <AlertDescription>
                          Please{' '}
                          <Link href="/settings?tab=billing" className="font-bold underline">
                              go to your billing settings
                          </Link>
                          {' '} to choose a plan and continue using all features.
                      </AlertDescription>
                  </Alert>
              ) : isTrialActive ? (
                  <Alert className="mb-6 border-primary/50 bg-primary/5 text-primary">
                      <Bot className="h-4 w-4" />
                      <AlertTitle className="font-headline text-primary">Welcome to your free trial!</AlertTitle>
                      <AlertDescription className="text-primary/90">
                          You have <strong>{trialDaysLeft} days left</strong>. {' '}
                          <Link href="/settings?tab=billing" className="font-semibold underline">
                              Choose a plan
                          </Link>
                          {' '} to keep your service active after the trial.
                      </AlertDescription>
                  </Alert>
              ) : null}
              
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MainAppLayout>{children}</MainAppLayout>;
}
