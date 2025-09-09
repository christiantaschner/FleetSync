
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, Lightbulb, CloudRain, List, Info, Globe, Droplets, Bug, Computer, Wrench, Building2, BarChart, Package, Search, Eye, ListChecks, Brain, Rocket } from 'lucide-react';
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
    const softwareCost = numTechs * 99;
    const netGain = profitGain - softwareCost;
    setRoi(netGain);
  };
  
  const navLinks = [
    { href: "#problem", text: "The Problem" },
    { href: "#ai-knows-business", text: "The Solution" },
    { href: "#features", text: "Features" },
    { href: "#pricing", text: "Pricing" }
  ];
  
  const featureList = [
    {
      icon: Lightbulb,
      title: "Profit-Driven Upsell Intelligence",
      description: "Our AI doesn't just find upsells—it integrates them into your dispatching strategy. High-potential jobs are flagged and can be automatically assigned to your best closers, turning service calls into major sales.",
      example: "'High upsell potential detected for AC replacement. Assigning to senior tech Sarah for maximum conversion probability.' The system doesn't just inform, it acts."
    },
    {
      icon: Package,
      title: "Turn Service History into Sales",
      description: "Log every piece of customer equipment. The AI uses this history to flag high-value replacement jobs before the customer even thinks of calling a competitor.",
      example: "'Alert: This is the 3rd repair on this 7-year-old AC unit. It's out of warranty. Suggest replacement options.' The AI turns a simple repair call into a major sale."
    },
    {
      icon: Smartphone,
      title: "Technician Command Center",
      description: "Empower your field team with a mobile-first interface. Technicians can view schedules, access AI troubleshooting guides, see upsell opportunities, and document work with photos and signatures.",
      example: "A technician is stuck. They open the app, describe the problem, and the AI provides step-by-step diagnostic advice based on the equipment's service history."
    },
    {
      icon: Shuffle,
      title: "Dynamic Route Optimization",
      description: "Re-optimize technician routes in one click when schedules change.",
      example: "A cancellation opens a 2-hour gap. In one click, the AI pulls forward a nearby maintenance job, turning idle time into a billable hour."
    },
    {
      icon: AlertTriangle,
      title: "Proactive Risk Alerts",
      description: "AI constantly monitors schedules and warns you of potential delays before they happen.",
      example: "'Alert: Tech B is 30 mins behind schedule. Reassign their next job to Tech C to meet the SLA window?'"
    },
    {
      icon: CalendarDays,
      title: "Drag-and-Drop Schedule",
      description: "A visual timeline to easily see and manage your whole team's day.",
      example: "See an overlap? Just drag the job from one technician's timeline to another's open slot. It's that simple."
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
        quote: "We get 1–2 extra jobs done per day with the same team.",
        author: "Mark Hayes",
        role: "Owner, Apex Climate Solutions",
        avatarHint: "man construction"
    },
    {
        quote: "Upsell prompts helped us win $20k in additional revenue last quarter.",
        author: "Sarah Rodriguez",
        role: "Operations Manager, Reliant Electrical",
        avatarHint: "woman business"
    },
    {
        quote: "Return trips kill our profitability. Now, when a job comes in, the AI tells me which parts are probably needed. I can check if the tech has them in the van *before* they roll out. Our first-time fix rate has shot up.",
        author: "David Chen",
        role: "Lead Technician, Blue Ribbon Plumbing",
        avatarHint: "man worker"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <section className="bg-muted py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              Stop Dispatching. Start Profiting.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
              Assign jobs based on profit per hour, not just proximity. MarginMax makes every job a winning job.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/signup">{t('start_free_trial')}</Link>
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
        <section id="problem" className="bg-background py-16 sm:py-24">
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <Card className="border-destructive/30 bg-red-50/50 flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-red-800 flex items-center gap-3">
                    <span className="text-4xl">💸</span>
                    Standard Dispatch = Lost Profit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                 <p className="text-muted-foreground">Traditional dispatch focuses on one thing: who's closest. This "nearest tech" logic ignores the factors that actually make you money and costs you dearly.</p>
                 <div className="space-y-3 pt-2 flex-grow flex flex-col justify-around">
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                      <h4 className="font-semibold flex items-center gap-2"><span className="text-2xl">⛽</span> Wasted Fuel & Labor</h4>
                      <p className="text-sm text-muted-foreground mt-1">Sending techs across town for low-value jobs burns fuel and payroll.</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="font-semibold flex items-center gap-2"><span className="text-2xl">💰</span> Missed High-Value Work</h4>
                        <p className="text-sm text-muted-foreground mt-1">Your best tech gets stuck on a minor fix while a high-margin installation goes to someone less qualified.</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="font-semibold flex items-center gap-2"><span className="text-2xl">⏳</span> Costly SLA Penalties</h4>
                        <p className="text-sm text-muted-foreground mt-1">Ignoring Service Level Agreement windows results in financial penalties and unhappy clients.</p>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-sky-50/50 flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-4xl">🚀</span> New Way = Profit-First Dispatching
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <p className="text-muted-foreground">MarginMax's AI asks a better question: "Which assignment makes this job the most profitable?" It analyzes every job's unique profit profile by weighing all the critical factors.</p>
                <div className="space-y-3 flex-grow flex flex-col justify-around">
                  <div className="p-4 rounded-lg border bg-white shadow-sm">
                      <h4 className="font-semibold flex items-center gap-2"><span className="text-2xl">📈</span> Revenue Drivers</h4>
                      <p className="text-sm text-muted-foreground mt-1">Quoted value, upsell potential, SLA premiums, after-hours surcharges.</p>
                  </div>
                   <div className="p-4 rounded-lg border bg-white shadow-sm">
                      <h4 className="font-semibold flex items-center gap-2"><span className="text-2xl">💵</span> Cost Drivers</h4>
                      <p className="text-sm text-muted-foreground mt-1">Labor cost per tech, drive time, parts required, and even the risk of a return visit.</p>
                  </div>
                   <div className="p-4 rounded-lg border bg-white shadow-sm">
                      <h4 className="font-semibold flex items-center gap-2"><span className="text-2xl">🔧</span> Real-World Constraints</h4>
                      <p className="text-sm text-muted-foreground mt-1">Technician skills, SLA windows, and specific customer preferences are always respected.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Industry Niches Section */}
        <section id="ai-knows-business" className="bg-muted py-16 sm:py-24">
             <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">An AI That Knows Your Business</h2>
                    <p className="mt-4 text-lg text-muted-foreground">MarginMax understands the unique profit levers of your trade, making smarter decisions than any generic dispatcher could.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {industryNiches.map((niche) => (
                    <Card key={niche.title} className="w-full flex-grow">
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
        <section id="features" className="bg-background py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Run Your Entire Operation From a Single Screen</h2>
                     <p className="mt-4 text-lg text-muted-foreground">MarginMax is packed with powerful features designed to streamline every aspect of your field service business.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featureList.map((feature) => (
                      <Card key={feature.title} className="flex flex-col">
                          <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                <feature.icon className="h-6 w-6" />
                              </div>
                              <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow space-y-3">
                              <p className="text-muted-foreground text-sm">{feature.description}</p>
                              <Separator/>
                              <p className="text-xs text-muted-foreground italic"><span className="font-semibold not-italic text-primary">Use Case:</span> {feature.example}</p>
                          </CardContent>
                      </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* How It Works Section */}
        <section id="solution" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Your Automated Profit Command Center</h2>
                    <p className="mt-4 text-lg text-muted-foreground">MarginMax turns your most complex decisions into the easiest part of your day.</p>
                </div>
                 <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">1</span></div>
                        <h3 className="mt-4 text-lg font-semibold">Input Jobs</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Input a job's quoted value and select any required parts. Our AI instantly calculates material costs, drive time, and labor to assess its true profit profile.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">2</span></div>
                        <h3 className="mt-4 text-lg font-semibold">Analyze Constraints</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The AI considers everything: technician skills, current location, drive time, and service level agreements.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">3</span></div>
                        <h3 className="mt-4 text-lg font-semibold">Optimize for Profit</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The algorithm assigns every job to maximize profit-per-hour across your entire fleet for the day.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"><span className="text-lg font-bold">4</span></div>
                        <h3 className="mt-4 text-lg font-semibold">Dispatch with Confidence</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Your dispatcher gets a perfectly optimized schedule. They simply review and approve in one click.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-background py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Trusted by Businesses Like Yours</h2>
                    <p className="mt-4 text-lg text-muted-foreground">See how field service companies are transforming their operations and boosting their bottom line with MarginMax.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="flex flex-col">
                            <CardContent className="pt-6 flex-grow">
                                <p className="text-muted-foreground">"{testimonial.quote}"</p>
                            </CardContent>
                            <CardHeader className="flex-row items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={`https://placehold.co/100x100?text=${testimonial.author.split(' ').map(n=>n[0]).join('')}`} alt={testimonial.author} data-ai-hint={testimonial.avatarHint} />
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
        <section id="pricing" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Stop Guessing. See Your Profit Gap.</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                       Businesses using profit-first dispatching see a 5% increase in net margins on average. Use our calculator to see the money you're leaving on the table.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <Card className="shadow-lg bg-background">
                        <CardHeader>
                            <CardTitle>Quick ROI Calculator</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <Button onClick={handleCalculateRoi} className="w-full">Calculate My Additional Profit</Button>
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
                                <Link href="/signup">{t('start_free_trial')}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
        
        {/* Final CTA */}
        <section className="bg-primary text-primary-foreground py-20 sm:py-24">
            <div className="container text-center">
                <Rocket className="h-10 w-10 mx-auto mb-4" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                   Stop Dispatching. Start Operating Like a Business.
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/80">Unlock the hidden profit in your daily schedule. MarginMax isn't just another scheduling tool—it's a profit engine.</p>
                <div className="mt-8 flex justify-center">
                    <Button asChild size="lg" variant="secondary" className="text-primary hover:bg-secondary/90">
                        <Link href="/signup">{t('start_free_trial')}</Link>
                    </Button>
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
