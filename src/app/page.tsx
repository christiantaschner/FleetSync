
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, Lightbulb, CloudRain, List, Info, Globe, Droplets, Bug, Computer, Wrench, Building2, BarChart, Package, Search, Eye, ListChecks, Brain, Rocket, MapPin, LayoutDashboard } from 'lucide-react';
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
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

export default function MarketingPage() {
  const { t, language, setLanguage } = useTranslation();
  const [numTechs, setNumTechs] = useState(1);
  const [jobsPerDay, setJobsPerDay] = useState(1);
  const [avgJobValue, setAvgJobValue] = useState(250);
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
    const profitGain = monthlyRevenue * 0.05; // Assume a 5% margin improvement
    const softwareCost = numTechs * 69;
    const netGain = profitGain - softwareCost;
    setRoi(netGain);
  };
  
  const navLinks = [
    { href: "#solution", text: "The Solution" },
    { href: "#how-it-works", text: "How It Works"},
    { href: "#pricing", text: "Pricing" },
    { href: "#features", text: "Features" }
  ];
  
  const featureList = [
    {
      icon: Smartphone,
      title: "Technician Command Center",
      description: "Mobile-first access to schedules, troubleshooting, upsells, documentation.",
    },
    {
      icon: Shuffle,
      title: "Dynamic Route Optimization",
      description: "Recalculate optimal routes in one click.",
    },
    {
      icon: AlertTriangle,
      title: "Proactive Risk Alerts",
      description: "AI flags delays before they happen.",
    },
    {
      icon: CalendarDays,
      title: "Drag-and-Drop Scheduling",
      description: "Visual control over your team’s day.",
    },
    {
      icon: Repeat,
      title: "Recurring Job Management",
      description: "Automate service agreements with AI scheduling.",
    },
    {
      icon: Cog,
      title: "Skills & Parts Library",
      description: "Match jobs to tech skills and van inventory.",
    }
  ];

  const industryNiches = [
    { icon: Wrench, title: "HVAC", description: "The AI knows to prioritize high-margin emergency calls and factor in upsell potential for maintenance contracts." },
    { icon: Zap, title: "Electrical", description: "Intelligently balances quick, profitable fixes with longer, high-value installation projects." },
    { icon: Droplets, title: "Plumbing", description: "Reduces costly return visits by ensuring the right tech with the right skills is sent the first time." },
    { icon: Bug, title: "Pest Control", description: "Maximizes route density and efficiency, turning recurring contracts into a profit machine." },
    { icon: Computer, title: "IT Services", description: "Prioritizes high-value SLA clients while expertly weaving in profitable one-off service calls." },
    { icon: Building2, title: "Property Mgmt", description: "Effortlessly juggles maintenance schedules across dozens of properties and tenants, optimizing every dispatch." },
  ];

  const testimonials = [
    {
        quote: "We get 1–2 extra jobs done per day with the same team. MarginMax doesn’t just save us time—it makes us money.",
        author: "Mark Hayes",
        role: "Owner, Apex Climate Solutions",
        avatarHint: "man construction"
    },
    {
        quote: "The AI upsell prompts brought in $20,000 extra last quarter—without new sales training.",
        author: "Sarah Rodriguez",
        role: "Ops Manager, Reliant Electrical",
        avatarHint: "woman business"
    },
    {
        quote: "Within weeks, we saw higher profit per job and fewer callbacks. The app pays for itself.",
        author: "David Chen",
        role: "Lead Tech, Blue Ribbon Plumbing",
        avatarHint: "man worker"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
             {navLinks.map(link => (
                 <Link key={link.href} href={link.href} onClick={handleScroll} className="text-foreground/60 transition-colors hover:text-foreground/80">
                    {link.text}
                 </Link>
             ))}
          </nav>
          
          <div className="flex items-center justify-end space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:bg-muted/50 h-9 w-9">
                  <Globe className="h-4 w-4" />
                   <span className="sr-only">Change Language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden md:flex items-center space-x-2">
              <Button asChild variant="ghost">
                  <Link href="/login">{t('login_button')}</Link>
              </Button>
              <Button asChild variant="default">
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
                                    <Button className="w-full" variant="default">{t('start_free_trial')}</Button>
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
        <section className="bg-slate-900 text-white py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              Stop Dispatching. Start Profiting.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
              Most dispatch software saves you minutes. MarginMax saves you money.
              Every job assignment is optimized for net profit — not just proximity.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/signup">👉 Start Free Trial</Link>
                    </Button>
                </div>
                 <p className="mt-2 text-sm text-slate-400">30 Days Free. No Credit Card.</p>
                 <p className="mt-2 text-sm font-bold text-amber-400">Free trials available this month: 2 of 30</p>
            </div>
          </div>
        </section>
        
        {/* 2. Dual Platform Showcase */}
        <section id="solution" className="bg-background text-foreground py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-4xl text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">One Platform. Two Profit Engines.</h2>
                    <p className="mt-4 text-lg text-muted-foreground">MarginMax equips both sides of your business with AI that drives profits — not just efficiency.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* Dispatcher Dashboard */}
                    <Card className="flex flex-col shadow-lg">
                        <CardHeader>
                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                <LayoutDashboard className="h-6 w-6"/>
                            </div>
                            <CardTitle className="font-headline text-2xl">For Dispatchers: The Command Center</CardTitle>
                            <CardDescription>Your control hub for maximum margin.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                             <div className="relative rounded-lg overflow-hidden border">
                                <Image 
                                    src="https://storage.googleapis.com/static.fleetsync.site/dashboard-profit.png"
                                    width={600} height={375}
                                    alt="Dispatcher dashboard showing a list of jobs ranked by profit score."
                                    className="w-full h-auto"
                                />
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <div><strong className="text-foreground">Profit-First Job Board:</strong> Rank jobs by net profit, not just location or time.</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <div><strong className="text-foreground">One-Click Optimization:</strong> AI assigns the most profitable technician & route instantly.</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <div><strong className="text-foreground">Live Profit Dashboard:</strong> Watch daily & weekly margins grow as jobs close.</div>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                    
                    {/* Technician App */}
                     <Card className="flex flex-col shadow-lg">
                        <CardHeader>
                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                <Smartphone className="h-6 w-6"/>
                            </div>
                            <CardTitle className="font-headline text-2xl">For Technicians: The Profit Tool</CardTitle>
                            <CardDescription>Turn every tech into a revenue driver—without turning them into salespeople.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                             <div className="relative rounded-lg overflow-hidden border">
                                <Image 
                                    src="https://storage.googleapis.com/static.fleetsync.site/technician-upsell.png"
                                    width={600} height={375}
                                    alt="Mobile app view showing an AI upsell suggestion for a maintenance plan."
                                    className="w-full h-auto"
                                />
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <div><strong className="text-foreground">AI Upsell Prompts:</strong> Context-aware suggestions (e.g. “12-year-old unit: recommend replacement”).</div>
                                 </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <div><strong className="text-foreground">Live Job Assignments & Chat:</strong> View your daily schedule and communicate directly with dispatch in real-time.</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <div><strong className="text-foreground">AI Troubleshooting:</strong> Get instant diagnostic steps using equipment history + symptoms.</div>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* How It Works (New Version) */}
        <section id="how-it-works" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <Badge variant="secondary">Why Choose MarginMax?</Badge>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl font-headline">The AI That Makes Companies Richer — Not Just Faster</h2>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Profit-First Dispatching */}
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Brain className="h-6 w-6"/>
                        </div>
                        <h3 className="text-xl font-bold">1. Profit-First Dispatching</h3>
                        <p className="text-muted-foreground">Other apps cut drive time. MarginMax maximizes net margin (revenue – cost – travel).</p>
                    </div>
                    {/* AI-Driven Upsells */}
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Lightbulb className="h-6 w-6"/>
                        </div>
                        <h3 className="text-xl font-bold">2. AI-Driven Upsells</h3>
                        <p className="text-muted-foreground">Techs don’t need sales training. The app surfaces the right upsell, at the right moment.</p>
                    </div>
                    {/* Visible Margin Impact */}
                    <div className="space-y-4">
                         <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <TrendingUp className="h-6 w-6"/>
                        </div>
                        <h3 className="text-xl font-bold">3. Real-Time Margin Visibility</h3>
                        <p className="text-muted-foreground">Other dashboards show revenue. Ours shows profit impact you can trust.</p>
                    </div>
                </div>
                 <div className="mt-12 text-center">
                    <p className="text-xl font-semibold">💡 Customers typically see +2–5% higher net margins without hiring more staff.</p>
                </div>
            </div>
        </section>

        {/* Built for Your Industry */}
        <section className="py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Built For Your Industry</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        MarginMax adapts to the unique financial drivers of your trade, from high-margin emergency calls to high-volume contract work.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {industryNiches.map((niche) => (
                        <Card key={niche.title} className="text-center">
                             <CardHeader className="items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <niche.icon className="h-6 w-6"/>
                                </div>
                                <CardTitle>{niche.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">{niche.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Owner ROI, Proven.</h2>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="flex flex-col bg-background">
                            <CardContent className="pt-6 flex-grow">
                                <p className="text-muted-foreground">"{testimonial.quote}"</p>
                            </CardContent>
                            <CardHeader className="flex-row items-center gap-4">
                                 <Avatar className="h-12 w-12">
                                     <AvatarImage src={`https://placehold.co/100x100/${['A8D8EA', 'F4B393', 'B2E0B6'][index]}/4A4A4A?text=${testimonial.author.split(' ').map(n=>n[0]).join('')}`} alt={testimonial.author} data-ai-hint={testimonial.avatarHint} />
                                    <AvatarFallback>{testimonial.author.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{testimonial.author}</CardTitle>
                                    <CardDescription>{testimonial.role}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* ROI Calculator & Pricing Section */}
        <section id="pricing" className="bg-background py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">See Your Profit Gap.</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                       Businesses using MarginMax increase net margins by an average of 5%.
                       Use our calculator to see how much you’re leaving on the table.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <Card className="shadow-lg bg-muted">
                        <CardHeader>
                            <CardTitle>Quick ROI Calculator</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="num-techs" className="flex items-center gap-1.5 text-xs"><Users className="h-4 w-4"/># of Technicians</Label>
                                    <Input id="num-techs" type="number" value={numTechs} onChange={(e) => setNumTechs(parseInt(e.target.value) || 0)} min="1" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="jobs-day" className="flex items-center gap-1.5 text-xs"><Briefcase className="h-4 w-4"/>Jobs/Day/Tech</Label>
                                    <Input id="jobs-day" type="number" value={jobsPerDay} onChange={(e) => setJobsPerDay(parseInt(e.target.value) || 0)} min="1" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="avg-job-value" className="flex items-center gap-1.5 text-xs"><DollarSign className="h-4 w-4"/>Avg. Job Value ($)</Label>
                                <Input id="avg-job-value" type="number" value={avgJobValue} onChange={(e) => setAvgJobValue(parseInt(e.target.value) || 0)} min="50" step="50" />
                            </div>
                            <Button onClick={handleCalculateRoi} className="w-full">→ Calculate My Profit</Button>
                            {roi !== null && (
                                <div className="text-center pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Estimated Additional Monthly Profit with MarginMax:</p>
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
                            <CardTitle>Pricing Made Simple.</CardTitle>
                            <CardDescription>One plan. All features. Zero surprises.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">$69</span>
                                <span className="text-sm text-muted-foreground">/ per tech / per month</span>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Jobs & Customers</li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> All AI Features Included</li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> No Hidden Fees</li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Cancel Anytime</li>
                            </ul>
                             <Button asChild size="lg" className="w-full">
                                <Link href="/signup">👉 Start Free Trial</Link>
                            </Button>
                            <p className="mt-2 text-sm text-muted-foreground text-center">30 Days Free. No Credit Card.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">More Than Dispatching. A Complete Profit Platform.</h2>
                     <p className="mt-4 text-lg text-muted-foreground">MarginMax streamlines your entire operation:</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featureList.map((feature) => (
                      <Card key={feature.title} className="flex flex-col bg-background">
                          <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <feature.icon className="h-6 w-6" />
                              </div>
                              <CardTitle className="text-lg font-semibold leading-tight">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <p className="text-muted-foreground text-sm">{feature.description}</p>
                          </CardContent>
                      </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Final CTA */}
        <section className="bg-slate-900 text-white py-20 sm:py-24">
            <div className="container text-center">
                <Rocket className="h-10 w-10 mx-auto mb-4" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                   Stop Dispatching. Start Operating Like a CEO.
                </h2>
                <p className="mt-4 text-lg text-slate-300">MarginMax isn’t just scheduling software.
                It’s your profit engine.</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-2">
                    <Button asChild size="lg" variant="default">
                        <Link href="/signup">👉 Start Free Trial</Link>
                    </Button>
                     <p className="mt-2 text-sm text-slate-400">30 Days Free. No Credit Card.</p>
                     <p className="mt-2 text-sm font-bold text-amber-400">Free trials available this month: 2 of 30</p>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t bg-secondary/50">
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
