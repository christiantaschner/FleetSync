
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, Lightbulb, CloudRain, List, Info, Globe, Droplets, Bug, Computer, Wrench, Building2, BarChart, Package, Search, Eye, ListChecks, Brain, Rocket, MapPin } from 'lucide-react';
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
      description: "Empower your field team with a mobile-first interface. Technicians can view schedules, access AI troubleshooting guides, see upsell opportunities, and document work with photos and signatures.",
    },
    {
      icon: Shuffle,
      title: "Dynamic Route Optimization",
      description: "Re-optimize technician routes in one click when schedules change.",
    },
    {
      icon: AlertTriangle,
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
      title: "Recurring Job & Contract Management",
      description: "Create and manage recurring service agreements, with AI assistance for scheduling future appointments.",
    },
    {
      icon: Cog,
      title: "Dynamic Skill & Parts Library",
      description: "Manage a central library of technician skills and van inventory. The AI uses this data to make smarter job assignments.",
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
        quote: "We get 1–2 extra jobs done per day with the same team. The AI doesn't just save us minutes, it saves us money.",
        author: "Mark Hayes",
        role: "Owner, Apex Climate Solutions",
        avatarHint: "man construction"
    },
    {
        quote: "The AI upsell prompts are a game-changer. They helped us secure an additional $20,000 in revenue last quarter without any new sales training.",
        author: "Sarah Rodriguez",
        role: "Operations Manager, Reliant Electrical",
        avatarHint: "woman business"
    },
    {
        quote: "Within weeks, we saw a noticeable increase in our profit per job and fewer callbacks. MarginMax makes our company richer, not just our dispatchers faster.",
        author: "David Chen",
        role: "Lead Technician, Blue Ribbon Plumbing",
        avatarHint: "man worker"
    }
  ];
  
  const [activeNiche, setActiveNiche] = useState(industryNiches[0].title);

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
        <section className="bg-slate-900 text-white py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              Stop Dispatching. Start Profiting.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
             Most dispatch software saves you minutes. MarginMax saves you money. Assign every job based on its net profit, not just proximity.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/signup">{t('start_free_trial')}</Link>
                    </Button>
                </div>
                 <p className="mt-2 text-sm text-slate-400">30-day free trial. No credit card required.</p>
            </div>
          </div>
        </section>
        
        <section className="container mt-8 md:-mt-16 lg:-mt-24">
            <div className="relative mx-auto flex flex-col items-center">
                <div className="bg-slate-200 p-2 sm:p-3 rounded-2xl border border-slate-300 shadow-2xl">
                     <Image 
                        src="https://storage.googleapis.com/static.fleetsync.site/dashboard-profit.png"
                        width={1200}
                        height={750}
                        alt="A dashboard showing a profit-optimized schedule with clear profit scores on each job."
                        className="w-full h-auto object-contain rounded-lg border-2 border-slate-400"
                        priority
                        data-ai-hint="dispatch optimization profit"
                    />
                </div>
            </div>
        </section>

        {/* The Solution Section */}
        <section id="solution" className="bg-background py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Traditional dispatch is about efficiency. <br/> Profit-first dispatch is about efficiency + profit.</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Standard dispatch software minimizes drive time. MarginMax is the first platform designed to maximize your net profit on every single job.
                    </p>
                </div>
            </div>
        </section>

        {/* How It Works (New Version) */}
        <section id="how-it-works" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <Badge variant="secondary">The MarginMax Difference</Badge>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl font-headline">The AI That Makes Companies Richer, Not Just Dispatchers Faster</h2>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Profit-First Dispatching */}
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Brain className="h-6 w-6"/>
                        </div>
                        <h3 className="text-xl font-bold">1. Profit-First Dispatching</h3>
                        <p className="text-muted-foreground">Standard apps minimize travel or balance workloads. MarginMax ranks every job by its expected net profit (revenue – cost – travel), putting the right tech on the right job, every time — for maximum margin, not just a full calendar.</p>
                    </div>
                    {/* AI-Driven Upsells */}
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Lightbulb className="h-6 w-6"/>
                        </div>
                        <h3 className="text-xl font-bold">2. AI-Driven Upsells</h3>
                        <p className="text-muted-foreground">Standard apps rely on techs or sales training for upsells. MarginMax proactively suggests context-aware upsell opportunities during jobs (maintenance plans, replacements, upgrades). Technicians don’t need to be salespeople — the app highlights the right upsell at the right time.</p>
                    </div>
                    {/* Visible Margin Impact */}
                    <div className="space-y-4">
                         <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <TrendingUp className="h-6 w-6"/>
                        </div>
                        <h3 className="text-xl font-bold">3. Visible Margin Impact</h3>
                        <p className="text-muted-foreground">Standard dashboards show jobs completed and revenue. MarginMax shows margin impact in real time (“This week: +2.5% net profit from AI dispatching & upsells”). Finally see how dispatching decisions affect profit — in numbers you can trust.</p>
                    </div>
                </div>
                 <div className="mt-12 text-center">
                    <p className="text-xl font-semibold">Not just saving time — adding profit. Our customers see 2–5% higher net margins without adding staff.</p>
                </div>
            </div>
        </section>


        {/* Testimonials Section */}
        <section className="bg-background py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Designed for Owner ROI</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Hear from business owners who transformed their operations and boosted their bottom line with MarginMax.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="flex flex-col">
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
                                <span className="text-4xl font-bold">$69</span>
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

        {/* Features Section */}
        <section id="features" className="bg-background py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">More Than Just AI—It's a Complete Platform</h2>
                     <p className="mt-4 text-lg text-muted-foreground">MarginMax is packed with powerful operational features designed to streamline every aspect of your field service business.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featureList.map((feature) => (
                      <Card key={feature.title} className="flex flex-col">
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
                   Stop Dispatching. Start Operating Like a Business.
                </h2>
                <p className="mt-4 text-lg text-slate-300">Unlock the hidden profit in your daily schedule. MarginMax isn't just another scheduling tool—it's a profit engine.</p>
                <div className="mt-8 flex justify-center">
                    <Button asChild size="lg" variant="default">
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
