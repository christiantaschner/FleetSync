
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, Lightbulb, CloudRain, List, Info, Globe, Droplets, Bug, Computer, Wrench, Building2, BarChart, Package, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-language';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function MarketingPage() {
  const { t, language, setLanguage } = useTranslation();
  const [numTechs, setNumTechs] = useState(1);
  const [jobsPerDay, setJobsPerDay] = useState(1);
  const [avgJobValue, setAvgJobValue] = useState(100);
  const [roi, setRoi] = useState<number | null>(null);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    const targetId = href.replace(/.*#/, "");
    const elem = document.getElementById(targetId);
    elem?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleCalculateRoi = () => {
    // Simplified ROI Calculation:
    // (Number of Techs * Jobs/Day * Avg Job Value * Working Days * Profit Uplift) - Software Cost
    const monthlyRevenue = numTechs * jobsPerDay * avgJobValue * 21; // ~21 working days/month
    const profitGain = monthlyRevenue * 0.15; // Assume a 15% margin improvement
    const softwareCost = numTechs * 99;
    const netGain = profitGain - softwareCost;
    setRoi(netGain);
  };
  
  const navLinks = [
    { href: "#problem", text: "The Problem" },
    { href: "#solution", text: "The Solution" },
    { href: "#features", text: "Features" },
    { href: "#pricing", text: "Pricing" }
  ];
  
  const featureList = [
    {
      icon: Bot,
      title: "Profit-First Dispatching",
      description: "Our core AI engine that assigns jobs based on maximum profitability, not just proximity.",
    },
    {
      icon: Shuffle,
      title: "Dynamic Route Optimization",
      description: "Re-optimize technician routes in one click when schedules change.",
    },
    {
      icon: ShieldQuestion,
      title: "Proactive Risk Alerts",
      description: "AI constantly monitors schedules and warns you of potential delays before they happen.",
    },
    {
      icon: CalendarDays,
      title: "Drag-and-Drop Schedule",
      description: "A visual timeline to easily see and manage your whole team's day.",
    },
    {
      icon: Repeat,
      title: "Contract & Recurring Jobs",
      description: "Automate your recurring maintenance jobs and manage service contracts.",
    },
    {
      icon: MessageSquare,
      title: "Customer Communication Tools",
      description: "Live tracking links, in-app chat, and AI-drafted notifications to keep customers happy.",
    },
  ];

  const industryNiches = [
    { icon: Wrench, title: "HVAC", description: "Optimize for after-hours emergency rates and upsell maintenance contracts." },
    { icon: Zap, title: "Electrical", description: "Balance high-margin installations with quick fixes for efficiency." },
    { icon: Droplets, title: "Plumbing", description: "Minimize return visits with proper skill matching and part suggestions." },
    { icon: Bug, title: "Pest Control", description: "Maximize route efficiency for high-value recurring contracts." },
    { icon: Computer, title: "IT Services", description: "Prioritize high-value SLA clients while fitting in profitable one-off service calls." },
    { icon: Building2, title: "Property Mgmt", description: "Efficiently manage maintenance schedules across multiple properties and tenants." },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
             {navLinks.map(link => (
                 <Link key={link.href} href={link.href} onClick={handleScroll} className="text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                    {link.text}
                 </Link>
             ))}
          </nav>
          
          <div className="flex items-center justify-end space-x-2">
            <div className="hidden md:flex items-center space-x-2">
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
                  <Link href="/login">{t('login_button')}</Link>
              </Button>
              <Button asChild variant="outline" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Link href="/signup">{t('start_free_trial')}</Link>
              </Button>
            </div>
            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col gap-4 mt-8">
                       {navLinks.map(link => (
                          <SheetClose asChild key={link.href}>
                             <Link href={link.href} onClick={handleScroll} className="block px-2 py-1 text-lg font-medium text-foreground/80 hover:text-foreground">
                               {link.text}
                             </Link>
                          </SheetClose>
                       ))}
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
        {/* 1. Hero Section */}
        <section className="bg-primary/5 py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              Maximize Profit, Not Just Efficiency – The AI Dispatcher That Thinks Like Your CFO
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Assign jobs based on profit per hour, not just proximity. Make every job a winning job.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/signup">Start Maximizing Profit Today</Link>
                    </Button>
                </div>
                 <p className="mt-2 text-sm text-muted-foreground">30-day free trial. No credit card required.</p>
            </div>
          </div>
        </section>
        
        <section className="container mt-8 md:-mt-16 lg:-mt-24">
            <div className="relative mx-auto flex flex-col items-center">
                <div className="bg-muted/50 p-4 sm:p-8 rounded-2xl border shadow-2xl">
                     <Image 
                        src="https://storage.googleapis.com/static.fleetsync.site/dashboard-profit.png"
                        width={1200}
                        height={750}
                        alt="A dashboard showing a profit-optimized schedule with clear profit scores on each job."
                        className="w-full h-auto object-contain rounded-lg border-2 border-primary/20"
                        priority
                        data-ai-hint="dispatch optimization profit"
                    />
                </div>
            </div>
        </section>

        {/* 2 & 3. The Problem vs. Solution Section */}
        <section id="problem" className="py-16 sm:py-24">
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <Card className="border-destructive/30 bg-destructive/5 flex flex-col">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-destructive flex items-center justify-center gap-2">
                💸 Standard Dispatch = Lost Profit
                </CardTitle>
                <CardDescription>
                  Every wrong assignment costs you money.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                <p className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span>
                    <strong>$200+ lost</strong> when high-value jobs go to the
                    wrong tech
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span>
                    <strong>1 hour/day</strong> wasted in drive time per
                    technician
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span>
                    <strong>$300 SLA penalties</strong> per missed window
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span>
                    <strong>Upsells lost</strong> to under-skilled techs
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span>Busy all day. <strong>No profit growth.</strong></span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5 flex flex-col">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                  <Bot className="h-7 w-7" /> Profit-First AI Dispatching
                </CardTitle>
                <CardDescription>
                  Instead of "nearest tech," our AI asks: "Which assignment makes
                  this job the most profitable?"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <p className="text-center font-medium">Every job gets a Profit Profile:</p>
                <div className="space-y-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp />Revenue Drivers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Job value, upsell potential, SLA premiums, surcharges</p>
                    </CardContent>
                  </Card>
                  <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign />Cost Drivers</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-muted-foreground">Labor cost, drive time, parts, rework risk</p>
                    </CardContent>
                  </Card>
                  <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2"><Check />Constraints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">SLA windows, tech skills, customer preferences</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. How it works Section */}
        <section id="solution" className="py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Your Automated Profit Command Center</h2>
                    <p className="mt-4 text-lg text-muted-foreground">MarginMax turns complex decisions into a simple, 3-step process powered by AI.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">1</span></div>
                        <h3 className="mt-4 text-lg font-semibold">Input Jobs</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Add jobs manually or via CSV import. The AI immediately analyzes their profit potential.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">2</span></div>
                        <h3 className="mt-4 text-lg font-semibold">One-Click Dispatch</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Click "AI Batch Assign." Our AI assigns every job to the optimal technician in seconds.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">3</span></div>
                        <h3 className="mt-4 text-lg font-semibold">Monitor & Manage</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Oversee your fleet from the live map and schedule. The AI will alert you to any potential delays.</p>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Industry Niches Section */}
        <section className="bg-muted/50 py-16 sm:py-24">
             <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Smarter Dispatch for Your Specific Trade</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Our AI understands that not all jobs are created equal. It optimizes for what makes your business profitable.</p>
                </div>
                <div className="mt-12 flex flex-wrap justify-center gap-8">
                  {industryNiches.map((niche) => (
                    <Card key={niche.title} className="w-full max-w-sm flex-grow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <niche.icon className="h-6 w-6 text-primary" />
                          {niche.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{niche.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Everything You Need to Run a More Profitable Fleet</h2>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featureList.map((feature) => (
                      <div key={feature.title} className="space-y-1">
                        <feature.icon className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ROI Calculator & Pricing Section */}
        <section id="pricing" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">See Your Profit Gap in Seconds</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Businesses using profit-first dispatching see 15-25% higher margins within 90 days. Find out how much you could be making.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Quick ROI Calculator</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="num-techs" className="flex items-center gap-1.5 text-xs"><Users className="h-4 w-4"/># of Technicians</Label>
                                    <Input id="num-techs" type="number" value={numTechs} onChange={(e) => setNumTechs(parseInt(e.target.value))} min="1" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="jobs-day" className="flex items-center gap-1.5 text-xs"><Briefcase className="h-4 w-4"/>Jobs/Day/Tech</Label>
                                    <Input id="jobs-day" type="number" value={jobsPerDay} onChange={(e) => setJobsPerDay(parseInt(e.target.value))} min="1" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="avg-job-value" className="flex items-center gap-1.5 text-xs"><DollarSign className="h-4 w-4"/>Avg. Job Value ($)</Label>
                                <Input id="avg-job-value" type="number" value={avgJobValue} onChange={(e) => setAvgJobValue(parseInt(e.target.value))} min="50" step="50" />
                            </div>
                            <Button onClick={handleCalculateRoi} className="w-full bg-green-600 hover:bg-green-700">Calculate My ROI</Button>
                            {roi !== null && (
                                <div className="text-center pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Estimated Additional Monthly Profit:</p>
                                    <p className="text-4xl font-bold text-green-600 mt-1">
                                        {roi.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground text-center pt-2">ROI Calculator is for demonstration purposes. Contact us for a personalized analysis.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-primary ring-2 ring-primary/20 shadow-lg">
                         <CardHeader>
                            <CardTitle>All-Inclusive Plan</CardTitle>
                            <CardDescription>One plan. All features. No compromises.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">$99</span>
                                <span className="text-sm text-muted-foreground">/ per technician / month</span>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Jobs & Customers</li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> All AI Features Included</li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> No Hidden Fees</li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Cancel Anytime</li>
                            </ul>
                            <Button asChild size="lg" className="w-full">
                                <Link href="/signup">Get Started for Free</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
        
        {/* Final CTA */}
        <section className="bg-gray-900 text-white py-20 sm:py-24">
            <div className="container text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Stop Guessing and Start Profiting</h2>
                <p className="mt-4 text-lg text-gray-300">Unlock the hidden profit in your daily schedule.</p>
                <div className="mt-8 flex justify-center">
                    <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-200">
                        <Link href="/signup">Start Your 30-Day Free Trial</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
          <p className="text-sm text-muted-foreground text-center md:text-left">&copy; {new Date().getFullYear()} MarginMax. {t('all_rights_reserved')}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <Link href="#" className="hover:text-primary">{t('privacy_policy')}</Link>
             <Link href="#" className="hover:text-primary">{t('terms_of_service')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
