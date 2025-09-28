
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
    { href: "#solution", text: "Solution" },
    { href: "#how-it-works", text: "Why MarginMax?"},
    { href: "#pricing", text: "Pricing" },
    { href: "#features", text: "Features" }
  ];
  
  const featureList = [
    {
      icon: Smartphone,
      title: "Technician Command Center",
      description: "Mobile-first access to schedules, troubleshooting, upsells, and documentation.",
      example: "A tech finishes a job and, with a few taps, uploads before/after photos, captures a signature, and logs a successful upsell—all before leaving the driveway."
    },
    {
      icon: Shuffle,
      title: "Dynamic Route Optimization",
      description: "Recalculates optimal routes in one click to adapt to last-minute changes or cancellations.",
      example: "A customer cancels. Instead of a 2-hour gap, you click 'Optimize' and the AI intelligently pulls a nearby, lower-priority job forward, saving the day's productivity."
    },
    {
      icon: AlertTriangle,
      title: "Proactive Risk Alerts",
      description: "The AI monitors active jobs and traffic, flagging potential delays before they happen.",
      example: "You get an alert: 'Alice is at risk of being 30 mins late to her next job.' You can then notify the customer or reassign the job with one click."
    },
    {
      icon: CalendarDays,
      title: "Drag-and-Drop Scheduling",
      description: "A visual timeline of your entire team's day. Drag jobs between technicians or time slots to manually fine-tune the schedule.",
      example: "You see Bob has a gap in his afternoon. You drag an unassigned job from the list and drop it right into his timeline. The job is instantly assigned and scheduled."
    },
    {
      icon: Repeat,
      title: "Recurring Job Management",
      description: "Set up service contracts for recurring maintenance, and let the AI automatically generate and suggest appointments when they're due.",
      example: "It's the start of the month. The system automatically creates 15 jobs for your quarterly service contracts and lists them as 'due for scheduling'."
    },
    {
      icon: Cog,
      title: "Skills & Parts Library",
      description: "The AI matches job requirements to technician skills and van inventory, ensuring the right person with the right tools is sent every time.",
      example: "A job requires 'Refrigerant Handling'. The AI automatically filters out junior techs and prioritizes those who have that certified skill and the part in their van."
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
                <DropdownMenuItem onClick={() => setLanguage('es')}>Español</DropdownMenuItem>
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
                    <SheetHeader className="sr-only">
                      <SheetTitle>Main Menu</SheetTitle>
                      <SheetDescription>Navigation links for the main site.</SheetDescription>
                    </SheetHeader>
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
              {t('homepage_title')}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
              {t('homepage_subtitle')}
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
              Perfect for small to medium-sized service businesses with 3-50 technicians who value simplicity and power.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-2">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/signup">{t('get_started_free')}</Link>
                    </Button>
                </div>
                 <p className="text-sm text-slate-400 mt-2">{t('no_setup_fee')}</p>
            </div>
          </div>
        </section>

        {/* 2. "Our Solution" Section */}
        <section id="solution" className="py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary">{t('our_solution')}</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('meet_your_ai_codispatcher')}</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('everything_you_need')}
              </p>
              <p className="mt-2 text-lg text-muted-foreground">
                Unlike complex corporate software, our AI is designed to run quietly in the background, making your processes simpler, not more complicated.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{t('feature_ai_dispatch_title')}</h3>
                <p className="text-muted-foreground">{t('feature_ai_dispatch_desc')}</p>
              </div>
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Shuffle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{t('feature_dynamic_optimization_title')}</h3>
                <p className="text-muted-foreground">{t('feature_dynamic_optimization_desc')}</p>
              </div>
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{t('feature_risk_alerts_title')}</h3>
                <p className="text-muted-foreground">{t('feature_risk_alerts_desc')}</p>
              </div>
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
                          <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <feature.icon className="h-6 w-6" />
                              </div>
                              <CardTitle className="text-lg font-semibold leading-tight">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <p className="text-muted-foreground text-sm">{feature.description}</p>
                              <p className="text-sm text-foreground/80 mt-2 pt-2 border-t border-dashed">
                                <strong className="text-primary">Example:</strong> {feature.example}
                              </p>
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
                    <p className="text-sm text-slate-400">Free trials available this month: 2/30.</p>
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
