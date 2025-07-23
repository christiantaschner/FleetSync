
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, CloudRain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-language';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function MarketingPage() {
  const { t, language, setLanguage } = useTranslation();

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: t('feature_ai_dispatch_title'),
      description: "One click is all it takes. Our AI analyzes skills, availability, and live location to suggest the perfect technician, eliminating hours of guesswork.",
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: t('feature_mobile_app_title'),
      description: "An app so simple, your team will actually want to use it. Clear schedules, easy status updates, and direct communication with dispatch.",
    },
    {
      icon: <Repeat className="h-8 w-8 text-primary" />,
      title: "Automated Contract Jobs",
      description: "Manage recurring service contracts effortlessly. Let AI suggest the next appointment date and draft customer notifications automatically.",
    },
     {
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      title: "Customer Management",
      description: "Access a complete history of past jobs and installed equipment for every customer, empowering your technicians with crucial context before they arrive on-site.",
    },
    {
      icon: <CalendarDays className="h-8 w-8 text-primary" />,
      title: t('feature_schedule_overview_title'),
      description: "Visualize your entire operation on a clear, drag-and-drop timeline. See who's busy, who's free, and make schedule changes in seconds.",
    },
    {
      icon: <Shuffle className="h-8 w-8 text-primary" />,
      title: t('feature_dynamic_optimization_title'),
      description: "Plans change. When a job is cancelled or finishes early, one click re-optimizes your technician's route to fill gaps and maximize their day.",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: t('feature_customer_comms_title'),
      description: "Keep customers happy and informed. The AI can draft professional notifications for delays, and in-app chat keeps everyone connected.",
    },
    {
      icon: <Cog className="h-8 w-8 text-primary" />,
      title: t('feature_skill_library_title'),
      description: "Define the skills your business needs. The AI uses this library to make intelligent assignment decisions, ensuring the right person is sent every time.",
    },
  ];

  const benefits = [
      {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: t('benefit_efficiency_title'),
        description: t('benefit_efficiency_desc')
      },
       {
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        title: t('benefit_costs_title'),
        description: t('benefit_costs_desc')
      },
      {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: t('benefit_satisfaction_title'),
        description: t('benefit_satisfaction_desc')
      },
      {
        icon: <TrendingUp className="h-8 w-8 text-primary" />,
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
      icon: <Workflow className="h-8 w-8 text-blue-500" />,
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

  const otherGuysPoints = [
    { title: 'Bloated & Overwhelming:', description: 'Dozens of features you\'ll never use, buried in confusing menus.' },
    { title: 'Punishing Pricing:', description: 'Complicated tiers and long-term contracts designed to lock you in.' },
    { title: 'Poor Technician Adoption:', description: 'Clunky mobile apps that your team hates using, leading to inconsistent data.' }
  ];

  const fleetSyncPoints = [
    { title: 'Simple & Powerful:', description: 'All the essential tools you need, with one-click AI to handle the complexity for you.' },
    { title: 'Fair & Scalable Pricing:', description: 'Simple per-technician pricing that grows with you. No hidden fees. No long-term commitments.' },
    { title: 'Loved by Technicians:', description: 'An intuitive mobile app designed for speed and simplicity, ensuring your whole team is on board.' }
  ];


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
             <Link href="#why" onClick={handleScroll} className="text-foreground/60 transition-colors hover:text-foreground/80">
                Why FleetSync?
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
                    <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild variant="ghost">
                  <Link href="/login">{t('login_button')}</Link>
              </Button>
              <Button asChild>
                  <a href="https://buy.stripe.com/5kQfZjbZy8Ubbi22WXeME01" target="_blank" rel="noopener noreferrer">{t('start_free_trial')}</a>
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
                                    {language === 'en' ? 'English' : language === 'de' ? 'Deutsch' : 'Français'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-[280px] sm:w-[380px]">
                                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                       <SheetClose asChild>
                         <Link href="#why" onClick={handleScroll} className="block px-2 py-1 text-lg font-medium text-foreground/80 hover:text-foreground">
                           Why FleetSync?
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
                                <a href="https://buy.stripe.com/5kQfZjbZy8Ubbi22WXeME01" target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button className="w-full">{t('start_free_trial')}</Button>
                                </a>
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
              The AI Dispatch Software for Growing Service Businesses
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Stop juggling spreadsheets and complex software. FleetSync AI gives you the power of enterprise-level dispatch in a simple, intuitive platform designed for your team.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <a href="https://buy.stripe.com/5kQfZjbZy8Ubbi22WXeME01" target="_blank" rel="noopener noreferrer">{t('get_started_free')}</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t('no_setup_fee')}</p>
          </div>
        </section>
        
        {/* Screenshot placeholder */}
         <section className="container -mt-16 sm:-mt-20 lg:-mt-24">
            <div className="relative mx-auto flex flex-col items-center">
                {/* Laptop Mockup */}
                <div className="relative w-full max-w-3xl lg:max-w-4xl z-10">
                    {/* Laptop screen */}
                    <div className="relative aspect-[16/10] bg-gray-800 rounded-t-xl border-x-4 border-t-4 border-gray-900 pt-8 shadow-lg">
                        {/* Top bar with camera */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        </div>
                        <Image 
                            src="/dashboard-screenshot.png"
                            width={1200}
                            height={750}
                            alt="FleetSync AI Dashboard Screenshot"
                            className="w-full h-full object-cover object-top rounded-t-md"
                            priority
                        />
                    </div>
                    {/* Laptop base */}
                    <div className="relative h-4 w-full bg-gray-900 rounded-b-xl shadow-lg"></div>
                     <div className="relative mx-auto h-2 w-[55%] bg-gray-800/50 rounded-b-md"></div>
                     <div className="relative mx-auto h-1 w-[45%] bg-gray-700/50 rounded-b-md"></div>
                </div>

                {/* iPhone Mockup */}
                 <div className="relative w-40 sm:w-48 md:absolute md:bottom-0 md:right-0 md:mr-[-20px] lg:mr-[-40px] md:mb-6 -mt-16 md:mt-0 z-20">
                    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[1.8rem] h-auto w-full shadow-xl">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-gray-800 rounded-b-lg z-10"></div>
                        <div className="w-full h-full bg-white dark:bg-black rounded-[1.4rem] overflow-hidden">
                           <Image
                                src="/dashboard-screenshot-mobile.png"
                                width={375}
                                height={812}
                                alt="FleetSync AI Technician App Screenshot"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
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
        
        {/* Why Choose Us Section */}
        <section id="why" className="bg-primary/5 py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Built for Your Business, Not for Enterprises</h2>
                    <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
                        Tired of field service software that's too complex, too expensive, and built for mega-corporations? We are too. Here's how we're different.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Card className="bg-background/80">
                        <CardHeader>
                            <CardTitle className="font-headline text-destructive flex items-center gap-2"><Target className="h-5 w-5"/>The Other Guys</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {otherGuysPoints.map((point, index) => (
                                <div key={index} className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1">
                                    <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="font-semibold text-foreground">{point.title}</strong>
                                        <p className="text-muted-foreground">{point.description}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card className="bg-background/80 border-primary ring-2 ring-primary/50">
                        <CardHeader>
                            <CardTitle className="font-headline text-primary flex items-center gap-2">
                                <Logo />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {fleetSyncPoints.map((point, index) => (
                                <div key={index} className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1">
                                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="font-semibold text-foreground">{point.title}</strong>
                                        <p className="text-muted-foreground">{point.description}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
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
        
        {/* Pricing Section */}
        <section id="pricing" className="bg-primary/5 py-20 sm:py-24 lg:py-32">
          <div className="container px-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('pricing_roi_title')}</h2>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Stop guessing and start growing. Our simple, transparent pricing is designed to deliver a clear return on investment by boosting efficiency, not your overheads.
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
                            <CardDescription>One plan. All features. No compromises.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-5xl font-bold">$69</span>
                                <span className="text-lg text-muted-foreground">/ {t('pricing_per_tech')} / {t('pricing_per_month')}</span>
                            </div>
                            <Button asChild size="lg" className="w-full">
                                <a href="https://buy.stripe.com/5kQfZjbZy8Ubbi22WXeME01" target="_blank" rel="noopener noreferrer">{t('get_started_free')}</a>
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
                <a href="https://buy.stripe.com/5kQfZjbZy8Ubbi22WXeME01" target="_blank" rel="noopener noreferrer">{t('start_free_trial_now')}</a>
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
