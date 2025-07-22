
"use client";

import { Check, Bot, Zap, Shuffle, ShieldQuestion, BarChart, Users, ArrowRight, UserCog, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Brain, Eye, Building2, Mailbox, WifiOff, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, CloudRain, Repeat } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-language';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import Image from 'next/image';

export default function MarketingPage() {
  const { t, language, setLanguage } = useTranslation();

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: t('feature_ai_dispatch_title'),
      description: t('feature_ai_dispatch_desc'),
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: t('feature_mobile_app_title'),
      description: t('feature_mobile_app_desc'),
    },
    {
      icon: <Repeat className="h-8 w-8 text-primary" />,
      title: "Automated Contract Jobs",
      description: "Manage recurring service contracts. Let AI suggest the next appointment date and draft customer notifications automatically.",
    },
    {
      icon: <CalendarDays className="h-8 w-8 text-primary" />,
      title: t('feature_schedule_overview_title'),
      description: t('feature_schedule_overview_desc'),
    },
    {
      icon: <Shuffle className="h-8 w-8 text-primary" />,
      title: t('feature_dynamic_optimization_title'),
      description: t('feature_dynamic_optimization_desc'),
    },
    {
      icon: <ShieldQuestion className="h-8 w-8 text-primary" />,
      title: t('feature_risk_alerts_title'),
      description: t('feature_risk_alerts_desc'),
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: t('feature_customer_comms_title'),
      description: t('feature_customer_comms_desc'),
    },
    {
      icon: <Cog className="h-8 w-8 text-primary" />,
      title: t('feature_skill_library_title'),
      description: t('feature_skill_library_desc'),
    },
  ];

  const benefits = [
      {
        icon: <Zap className="h-6 w-6 text-primary" />,
        title: t('benefit_efficiency_title'),
        description: t('benefit_efficiency_desc')
      },
       {
        icon: <DollarSign className="h-6 w-6 text-primary" />,
        title: t('benefit_costs_title'),
        description: t('benefit_costs_desc')
      },
      {
        icon: <Users className="h-6 w-6 text-primary" />,
        title: t('benefit_satisfaction_title'),
        description: t('benefit_satisfaction_desc')
      },
      {
        icon: <TrendingUp className="h-6 w-6 text-primary" />,
        title: 'Scalable Growth',
        description: 'Our per-technician pricing and robust features support your business as it grows, from a few vans to a large fleet.'
      }
  ];

   const scenarios = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      problem: t('scenario_sick_technician_problem'),
      solution: t('scenario_sick_technician_solution'),
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      problem: t('scenario_emergency_job_problem'),
      solution: t('scenario_emergency_job_solution'),
    },
    {
      icon: <UserCog className="h-8 w-8 text-blue-500" />,
      problem: t('scenario_cancellation_problem'),
      solution: t('scenario_cancellation_solution'),
    },
  ];

  const howItWorksSteps = [
    {
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      title: t('how_it_works_1_title'),
      description: t('how_it_works_1_desc'),
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: t('how_it_works_2_title'),
      description: t('how_it_works_2_desc'),
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      title: t('how_it_works_3_title'),
      description: t('how_it_works_3_desc'),
    },
  ];
  
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    const targetId = href.replace(/.*#/, "");
    const elem = document.getElementById(targetId);
    elem?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
             <Link href="#benefits" onClick={handleScroll} className="text-foreground/60 transition-colors hover:text-foreground/80">
                {t('nav_benefits')}
              </Link>
              <Link href="#features" onClick={handleScroll} className="text-foreground/60 transition-colors hover:text-foreground/80">
                {t('nav_features')}
              </Link>
             <Link href="#pricing" onClick={handleScroll} className="text-foreground/60 transition-colors hover:text-foreground/80">
                {t('pricing_title')}
              </Link>
          </nav>
          
          <div className="flex flex-1 items-center justify-end space-x-2">
            <div className="hidden md:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-foreground/80 hover:bg-secondary hover:text-foreground px-2 font-semibold mr-2">
                        {language.toUpperCase()}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild variant="ghost">
                  <Link href="/login">{t('login_button')}</Link>
              </Button>
              <Button asChild>
                  <Link href="/signup">{t('start_free_trial')}</Link>
              </Button>
            </div>
            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col gap-4 mt-8">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-center text-lg">
                                    {language === 'en' ? 'English' : 'Deutsch'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-[280px] sm:w-[380px]">
                                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                       <SheetClose asChild>
                         <Link href="#benefits" onClick={handleScroll} className="block px-2 py-1 text-lg font-medium text-foreground/80 hover:text-foreground">
                           {t('nav_benefits')}
                         </Link>
                       </SheetClose>
                       <SheetClose asChild>
                         <Link href="#features" onClick={handleScroll} className="block px-2 py-1 text-lg font-medium text-foreground/80 hover:text-foreground">
                            {t('nav_features')}
                         </Link>
                       </SheetClose>
                       <SheetClose asChild>
                          <Link href="#pricing" onClick={handleScroll} className="block px-2 py-1 text-lg font-medium text-foreground/80 hover:text-foreground">
                            {t('pricing_title')}
                          </Link>
                       </SheetClose>
                       <div className="mt-8 space-y-4">
                            <SheetClose asChild>
                               <Link href="/login" className="w-full">
                                    <Button variant="outline" className="w-full">{t('login_button')}</Button>
                                </Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="/signup" className="w-full">
                                    <Button className="w-full">{t('start_free_trial')}</Button>
                                </Link>
                             </SheetClose>
                       </div>
                    </nav>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              {t('homepage_title')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('homepage_subtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">{t('get_started_free')}</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t('no_setup_fee')}</p>
          </div>
        </section>
        
        {/* Screenshot placeholder */}
        <section className="container -mt-16 sm:-mt-20 lg:-mt-24">
            <div className="relative flex justify-center">
                <Image 
                    src="https://placehold.co/1200x750.png"
                    width={1200}
                    height={750}
                    alt="FleetSync AI Dashboard Screenshot"
                    className="rounded-xl border shadow-2xl"
                    data-ai-hint="dashboard interface"
                />
            </div>
        </section>

        {/* Industries Section */}
        <section className="bg-secondary py-12 mt-16 sm:mt-24">
            <div className="container text-center">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">{t('developed_for_you')}</h2>
                <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-lg font-medium text-foreground">
                    <Badge variant="outline" className="text-base px-4 py-2 border-border shadow-sm bg-background">{t('hvac_services')}</Badge>
                    <Badge variant="outline" className="text-base px-4 py-2 border-border shadow-sm bg-background">{t('plumbing_services')}</Badge>
                    <Badge variant="outline" className="text-base px-4 py-2 border-border shadow-sm bg-background">{t('electrical_services')}</Badge>
                    <Badge variant="outline" className="text-base px-4 py-2 border-border shadow-sm bg-background">{t('appliance_repair_services')}</Badge>
                    <Badge variant="outline" className="text-base px-4 py-2 border-border shadow-sm bg-background">{t('and_more')}</Badge>
                </div>
            </div>
        </section>
        
        {/* Benefits Section */}
        <section id="benefits" className="py-16 sm:py-24 bg-primary/5">
            <div className="container">
                 <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('benefits_title')}</h2>
                    <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
                        {t('benefits_subtitle')}
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="flex items-start gap-4">
                           <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                               {benefit.icon}
                           </div>
                           <div>
                                <h3 className="font-headline text-xl font-semibold">{benefit.title}</h3>
                                <p className="mt-1 text-muted-foreground">{benefit.description}</p>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Scenarios Section */}
        <section className="container py-16 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('from_nightmare_to_excellence')}</h2>
              <p className="mt-6 text-lg text-muted-foreground">
                {t('from_nightmare_to_excellence_desc')}
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {scenarios.map((scenario, index) => (
                <Card key={index} className="flex flex-col text-center bg-secondary/50">
                  <CardHeader>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm">
                        {scenario.icon}
                      </div>
                      <CardTitle className="font-headline pt-2">{scenario.problem}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                      <p className="text-muted-foreground">{scenario.solution}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="default">{t('our_solution')}</Badge>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('meet_your_ai_codispatcher')}</h2>
              <p className="mt-6 text-lg text-muted-foreground">
                {t('everything_you_need')}
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                 <div key={feature.title} className="text-center p-4 rounded-lg transition-colors hover:bg-background/50">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      {feature.icon}
                    </div>
                    <h3 className="mt-4 font-headline text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
             <div className="mt-12 text-center">
                 <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                    <Bot className="h-5 w-5 text-accent"/>
                    {t('fleety_title')}
                </h3>
                <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">{t('fleety_desc')}</p>
             </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 sm:py-24">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('how_it_works_title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t('how_it_works_subtitle')}</p>
            <div className="relative mt-12 grid grid-cols-1 items-start gap-12 md:grid-cols-3">
              <div className="absolute top-8 left-1/4 hidden h-0.5 w-1/2 -translate-y-1/2 border-t-2 border-dashed border-border md:block" />
              {howItWorksSteps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center">
                   <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-lg font-bold text-primary shadow-lg z-10">{index + 1}</div>
                  <h3 className="mt-4 text-xl font-semibold font-headline">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Growth Section */}
        <section className="bg-primary/5 py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('growth_title')}</h2>
                    <p className="mt-6 text-lg text-muted-foreground">{t('growth_desc')}</p>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-secondary py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('testimonials_title')}</h2>
              <p className="mt-6 text-lg text-muted-foreground">{t('testimonials_subtitle')}</p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-lg font-medium">"{t('testimonial_1_quote')}"</p>
                </CardContent>
                <CardHeader className="flex-row items-center gap-4">
                  <Image src="https://placehold.co/40x40.png" alt="Testimonial author" data-ai-hint="person face" width={40} height={40} className="h-10 w-10 rounded-full" />
                  <div>
                    <CardTitle className="text-base">{t('testimonial_1_author')}</CardTitle>
                    <CardDescription>{t('testimonial_1_role')}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-lg font-medium">"{t('testimonial_2_quote')}"</p>
                </CardContent>
                <CardHeader className="flex-row items-center gap-4">
                  <Image src="https://placehold.co/40x40.png" alt="Testimonial author" data-ai-hint="person face" width={40} height={40} className="h-10 w-10 rounded-full" />
                  <div>
                    <CardTitle className="text-base">{t('testimonial_2_author')}</CardTitle>
                    <CardDescription>{t('testimonial_2_role')}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
        
         {/* Pricing Section */}
        <section id="pricing" className="bg-primary/5 py-20 sm:py-24 lg:py-32">
          <div className="container px-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('pricing_roi_title')}</h2>
                    <p className="mt-6 text-lg text-muted-foreground">
                        {t('pricing_roi_desc')}
                    </p>
                     <div className="mt-8 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
                                <TrendingUp className="h-6 w-6"/>
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('pricing_benefit_1_title')}</h3>
                                <p className="text-sm text-muted-foreground">{t('pricing_benefit_1_desc')}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
                                <DollarSign className="h-6 w-6"/>
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('pricing_benefit_2_title')}</h3>
                                <p className="text-sm text-muted-foreground">{t('pricing_benefit_2_desc')}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
                                <Users className="h-6 w-6"/>
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('pricing_benefit_3_title')}</h3>
                                <p className="text-sm text-muted-foreground">{t('pricing_benefit_3_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-center">
                    <Card className="max-w-md w-full border-primary ring-2 ring-primary shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{t('pricing_plan_title')}</CardTitle>
                            <CardDescription>{t('pricing_plan_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-5xl font-bold">$69</span>
                                <span className="text-lg text-muted-foreground">/ {t('pricing_per_tech')} / {t('pricing_per_month')}</span>
                            </div>
                            <Button asChild size="lg" className="w-full">
                                <Link href="/signup">{t('get_started_free')}</Link>
                            </Button>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing_feature_all_inclusive')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing_feature_all_ai')}</span>
                                </li>
                                 <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing_feature_no_hidden_fees')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing_feature_cancel_anytime')}</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary py-16">
          <div className="container px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('ready_to_transform')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t('ready_to_transform_desc')}
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/signup">{t('start_free_trial_now')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
          <p className="text-sm text-muted-foreground text-center md:text-left">&copy; {new Date().getFullYear()} FleetSync AI. {t('all_rights_reserved')}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <Link href="#" className="hover:text-primary">{t('privacy_policy')}</Link>
             <Link href="#" className="hover:text-primary">{t('terms_of_service')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
