
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
  BookOpen,
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
import { MockModeBanner } from '@/components/common/MockModeBanner';
import { UserProfile } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType; 
  divider?: boolean;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: 'dashboard', icon: LayoutDashboard },
  { href: "/customers", label: 'customers', icon: ClipboardList },
  { href: "/contracts", label: 'contracts', icon: Repeat },
  { href: "/reports", label: 'reports', icon: BarChart },
  { href: "/roadmap", label: 'roadmap', icon: BookOpen },
  { href: "/technician", label: 'technician_view', icon: Smartphone, divider: true },
];

function MainAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, userProfile, company, loading, logout, setHelpOpen, isMockMode, contractsDueCount } = useAuth();
  
  if (pathname === '/onboarding') {
      return <>{children}</>;
  }
  
  if (!isMockMode && !user) {
    router.replace('/login');
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isMockMode && userProfile?.onboardingStatus === 'pending_onboarding') {
    router.replace('/onboarding');
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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


  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";
  const userDisplayName = user?.email || "User";
  
  return (
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="peer">
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {ALL_NAV_ITEMS.map((item) => {
                 const isActive = (item.href === '/dashboard' && pathname === '/dashboard') || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                 
                 const finalHref = item.href === '/technician' && userProfile?.role === 'technician' ? `/technician/jobs/${userProfile.uid}` : item.href;
                 
                 const badgeCount = item.label === 'contracts' ? contractsDueCount : 0;

                 return (
                    <React.Fragment key={item.label}>
                        {item.divider && <SidebarSeparator className="my-2"/>}
                        <SidebarMenuItem isActive={isActive}>
                        <Link href={finalHref || '#'}>
                            <SidebarMenuButton
                            isActive={isActive}
                            tooltip={t(item.label)}
                            >
                            <item.icon className="h-4 w-4" />
                            <span>{t(item.label)}</span>
                            {badgeCount > 0 && <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>}
                            </SidebarMenuButton>
                        </Link>
                        </SidebarMenuItem>
                    </React.Fragment>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
                 {userProfile?.role !== 'technician' && (
                    <SidebarMenuItem isActive={pathname.startsWith('/settings')}>
                        <Link href="/settings">
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/settings')}
                                tooltip={t('settings')}
                            >
                                <Settings className="h-4 w-4" />
                                <span>{t('settings')}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-12 md:group-data-[collapsible=icon]:justify-center md:group-data-[collapsible=icon]:p-0 md:group-data-[collapsible=icon]:h-10 md:group-data-[collapsible=icon]:w-10">
                  <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                    <AvatarImage src={userProfile?.avatarUrl} alt={userDisplayName} />
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
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
            <Logo />
            <div className="w-7 h-7" />
          </header>
           <main className="flex-1 overflow-x-hidden">
                <div className="p-4 sm:p-6 lg:p-8">
                <MockModeBanner />
              {isSubscriptionExpired ? (
                  <Alert variant="destructive" className="mb-6 mx-4 sm:mx-0">
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
                  <Alert className="mb-6 border-primary/50 bg-primary/5 text-primary mx-4 sm:mx-0">
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
        </div>
      </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, logout, isMockMode } = useAuth();
  const [showStuckMessage, setShowStuckMessage] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
        timer = setTimeout(() => {
            setShowStuckMessage(true);
        }, 7000); // Show message after 7 seconds of loading
    } else {
        setShowStuckMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !isMockMode) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-center">
        <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            {showStuckMessage && (
                <div className="mt-8 animate-in fade-in-50">
                    <p className="text-muted-foreground mb-4">Taking longer than usual to load...</p>
                    <Button onClick={logout} variant="outline">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Log Out & Try Again
                    </Button>
                </div>
            )}
        </div>
      </div>
    );
  }
  return <MainAppLayout>{children}</MainAppLayout>;
}
