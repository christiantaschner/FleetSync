
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, Lightbulb, CloudRain, List, Info, Globe, Droplets, Bug, Computer, Wrench, Building2 } from 'lucide-react';
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

export default function MarketingPage() {
  const { t, language, setLanguage } = useTranslation();
  const [numTechs, setNumTechs] = useState(5);
  const [jobsPerDay, setJobsPerDay] = useState(4);
  const [avgJobValue, setAvgJobValue] = useState(450);
  const [roi, setRoi] = useState<number | null>(null);

  const benefits = [
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: "Higher Margins, Automatically",
      description: "AI routes jobs where they deliver the most profit, boosting margins by 15-25% in 90 days.",
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Smarter Tech Utilization",
      description: "AI ensures your best techs are always assigned to your highest-value jobs.",
    },
    {
      icon: <Map className="h-8 w-8 text-primary" />,
      title: "Less Drive Time = More Jobs",
      description: "AI slashes wasted miles by up to 30%, opening room for 1-2 more profitable calls per day.",
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Fewer Callbacks, Happier Customers",
      description: "AI matches the right skills to the right job so work is done right the first time, every time.",
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

  const handleCalculateRoi = () => {
    // Relatable but simplified calculation:
    // Assume a 15% efficiency gain, which translates to profit.
    // Operating days per month: ~21
    const monthlyRevenue = numTechs * jobsPerDay * avgJobValue * 21;
    const profitGain = monthlyRevenue * 0.15; // 15% improvement
    setRoi(profitGain);
  };

  const otherGuysPoints = [
    { title: '$200+ lost when high-value jobs go to the wrong tech'},
    { title: '1 hour/day wasted in drive time per technician' },
    { title: '$300 SLA penalties per missed window' },
    { title: 'Upsells lost to under-skilled techs' }
  ];

  const industryNiches = [
      { name: 'HVAC', icon: Wrench, profitLever: 'Prioritizes maintenance contract upsells and after-hours surcharges.' },
      { name: 'Electrical', icon: Zap, profitLever: 'Weighs high SLA penalties and premium emergency job values.' },
      { name: 'Plumbing', icon: Droplets, profitLever: 'Factors in parts availability and the cost risk of repeat visits.' },
      { name: 'Pest Control', icon: Bug, profitLever: 'Learns customer preferences and recurring contract values.' },
      { name: 'IT Services', icon: Computer, profitLever: 'Understands skill-matching for complex, high-value tickets.' }
  ]

  const testimonials = [
    {
        quote: "This is exactly what I need with my morning coffee. The Job List and the 'Fleety Batch Assign' button could genuinely save me an hour every morning. The AI suggestions for new jobs remove the guesswork. It feels like it was designed by someone who actually understands my job.",
        author: "Alex Carter",
        role: "Dispatcher, Summit Mechanical",
        avatar: "https://placehold.co/40x40.png"
    },
    {
        quote: "Finally, an app that doesn't get in my way. I see my jobs for the day, in order. Tapping to update my status is simple, and seeing customer-uploaded photos before I arrive is a massive help. The digital signature capture beats paperwork any day.",
        author: "Maria Garcia",
        role: "Lead Technician, Reliance Electrical",
        avatar: "https://placehold.co/40x40.png"
    }
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
             <Link href="#why" onClick={handleScroll} className="text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                Why MarginMax?
              </Link>
              <Link href="#features" onClick={handleScroll} className="text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                {t('nav_features')}
              </Link>
             <Link href="#pricing" onClick={handleScroll} className="text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                {t('pricing_title')}
              </Link>
          </nav>
          
          <div className="flex items-center justify-end space-x-2">
            <div className="hidden md:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground px-2 font-semibold mr-2">
                        <Globe className="h-4 w-4 mr-1.5" />
                        {language.toUpperCase()}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <SheetHeader>
                      <SheetTitle className="sr-only">Main Menu</SheetTitle>
                      <SheetDescription className="sr-only">Navigation links for the marketing page.</SheetDescription>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 mt-8">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-center text-lg">
                                    <Globe className="h-4 w-4 mr-2"/>
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
                           Why MarginMax?
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
             The Only AI Dispatcher That Puts Profit First — Not Proximity.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              <span className="font-bold">Old Way:</span> Dispatchers assign the nearest tech. <br />
              <span className="font-bold text-primary">New Way:</span> Our AI assigns the most profitable tech — factoring revenue, costs, and constraints in real time.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">On average, businesses boost margins 15–25% in 90 days.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700">
                        <Link href="#pricing">Calculate Your Lost Profit</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full">
                        <Link href="/signup">Book a Demo</Link>
                    </Button>
                </div>
            </div>
          </div>
        </section>
        
        {/* Screenshot placeholder */}
         <section className="container mt-8 md:-mt-16 lg:-mt-24">
            <div className="relative mx-auto flex flex-col items-center">
                <div className="bg-muted/50 p-4 sm:p-8 rounded-2xl border shadow-2xl">
                     <Image 
                        src="https://storage.googleapis.com/static.fleetsync.site/profit-first-dispatch.png"
                        width={1200}
                        height={750}
                        alt="A visual comparison showing how profit-first dispatching results in a higher profit margin than simply assigning the nearest technician."
                        className="w-full h-auto object-contain rounded-lg border-2 border-primary/20"
                        priority
                        data-ai-hint="dispatch optimization profit"
                    />
                </div>
            </div>
        </section>

        {/* Problem vs. Solution Section */}
         <section id="why" className="py-16 sm:py-24">
            <div className="container">
                <div className="grid md:grid-cols-2 gap-12 items-stretch">
                    <div className="bg-red-500/5 p-8 rounded-lg border border-destructive/20 flex flex-col">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline text-destructive">💸 Standard Dispatch = Lost Profit</h2>
                        <p className="mt-4 text-lg text-muted-foreground">Every wrong assignment costs you money.</p>
                        <ul className="mt-6 space-y-4">
                            <li className="flex items-start gap-3">
                                <X className="h-5 w-5 text-destructive shrink-0 mt-1" />
                                <p className="text-lg text-muted-foreground">$200+ lost when high-value jobs go to the wrong tech</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <X className="h-5 w-5 text-destructive shrink-0 mt-1" />
                                <p className="text-lg text-muted-foreground">1 hour/day wasted in drive time per technician</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <X className="h-5 w-5 text-destructive shrink-0 mt-1" />
                                <p className="text-lg text-muted-foreground">$300 SLA penalties per missed window</p>
                            </li>
                             <li className="flex items-start gap-3">
                                <X className="h-5 w-5 text-destructive shrink-0 mt-1" />
                                <p className="text-lg text-muted-foreground">Upsells lost to under-skilled techs</p>
                            </li>
                        </ul>
                         <p className="mt-auto pt-6 text-lg font-semibold text-destructive/80">Busy all day. No profit growth.</p>
                    </div>
                    <div className="bg-primary/5 p-8 rounded-lg border flex flex-col">
                         <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">🤖 Profit-First AI Dispatching</h2>
                         <p className="mt-4 text-lg text-muted-foreground">Instead of “nearest tech,” our AI asks:
                         “Which assignment makes this job the most profitable?”</p>
                         <p className="mt-4 text-lg text-muted-foreground">Every job gets a Profit Profile:</p>
                         <div className="mt-6 grid grid-cols-1 gap-6 flex-grow">
                            <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="text-green-500" /> Revenue Drivers</CardTitle>
                                    <CardDescription>Job value, upsell potential, surcharges</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="text-red-500" /> Cost Drivers</CardTitle>
                                    <CardDescription>Labor cost, fuel/time, parts, rework risk</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Check className="text-blue-500"/> Constraints</CardTitle>
                                    <CardDescription>SLA windows, skills, customer preferences</CardDescription>
                                </CardHeader>
                            </Card>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="bg-muted py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">📈 Why Businesses Switch to Profit-First AI Dispatching</h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 rounded-lg transition-colors hover:bg-background/50">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 font-headline text-lg font-semibold">Higher Margins, Automatically</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Boost profit per tech by 15–25% in the first 90 days.</p>
                </div>
                <div className="text-center p-4 rounded-lg transition-colors hover:bg-background/50">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 font-headline text-lg font-semibold">Smarter Tech Utilization</h3>
                    <p className="mt-2 text-sm text-muted-foreground">AI keeps your best techs on your highest-value jobs.</p>
                </div>
                <div className="text-center p-4 rounded-lg transition-colors hover:bg-background/50">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Map className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 font-headline text-lg font-semibold">Less Drive Time = More Jobs</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Cut wasted miles by 30% and fit 1–2 more calls into every day.</p>
                </div>
                <div className="text-center p-4 rounded-lg transition-colors hover:bg-background/50">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 font-headline text-lg font-semibold">Fewer Callbacks, Happier Customers</h3>
                    <p className="mt-2 text-sm text-muted-foreground">AI matches skills to jobs so work is done right the first time.</p>
                </div>
            </div>
          </div>
        </section>
        
        {/* Industry Niches Section */}
        <section className="container py-16 sm:py-24">
             <div className="mx-auto max-w-2xl text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">🔧 Built for HVAC, Electrical, Plumbing & More</h2>
                 <p className="mt-6 text-lg text-muted-foreground">No matter your trade, the system learns where your margins live — and helps you capture them.</p>
             </div>
             <div className="mt-12 flex flex-wrap justify-center gap-6">
                <Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                        <Wrench className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="mt-4 font-semibold text-lg">HVAC</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                        <p className="mt-1 text-sm font-medium">Prioritizes maintenance contract upsells and after-hours surcharges.</p>
                    </Card><Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                        <Zap className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="mt-4 font-semibold text-lg">Electrical</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                        <p className="mt-1 text-sm font-medium">Weighs high SLA penalties and premium emergency job values.</p>
                    </Card><Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                        <Droplets className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="mt-4 font-semibold text-lg">Plumbing</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                        <p className="mt-1 text-sm font-medium">Factors in parts availability and the cost risk of repeat visits.</p>
                    </Card><Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                        <Bug className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="mt-4 font-semibold text-lg">Pest Control</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                        <p className="mt-1 text-sm font-medium">Learns customer preferences and recurring contract values.</p>
                    </Card><Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                        <Computer className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="mt-4 font-semibold text-lg">IT Services</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                        <p className="mt-1 text-sm font-medium">Understands skill-matching for complex, high-value tickets.</p>
                    </Card>
            </div>
        </section>


        {/* ROI Calculator Section */}
        <section id="pricing" className="bg-primary/5 py-20 sm:py-24 lg:py-32">
            <div className="container px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">💵 See Your Profit Gap in Seconds</h2>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Businesses using profit-first dispatching see 15–25% higher margins within 90 days. Find out how much you could be making.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center">
                    <Card className="w-full max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Quick ROI Calculator</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="techs" className="flex items-center gap-1.5"><Users className="h-4 w-4"/># of Technicians</Label>
                                    <Input id="techs" type="number" value={numTechs} onChange={(e) => setNumTechs(Number(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="jobs-per-day" className="flex items-center gap-1.5"><Briefcase className="h-4 w-4"/>Jobs/Day/Tech</Label>
                                    <Input id="jobs-per-day" type="number" value={jobsPerDay} onChange={(e) => setJobsPerDay(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="avg-job-value" className="flex items-center gap-1.5"><DollarSign className="h-4 w-4"/>Avg. Job Value ($)</Label>
                                <Input id="avg-job-value" type="number" step="50" value={avgJobValue} onChange={(e) => setAvgJobValue(Number(e.target.value))} />
                            </div>
                            <Button size="lg" onClick={handleCalculateRoi} className="w-full bg-green-600 hover:bg-green-700">Calculate My ROI</Button>
                            {roi !== null && (
                                <div className="text-center pt-4">
                                    <p className="text-muted-foreground">Estimated Additional Monthly Profit:</p>
                                    <p className="text-4xl font-bold text-green-600">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(roi)}
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground pt-2 text-center">ROI Calculator is for demonstration purposes. Contact us for a personalized analysis.</p>
                        </CardContent>
                    </Card>
                    <div className="flex justify-center">
                        <Card className="max-w-md w-full bg-background border-primary ring-2 ring-primary/50 shadow-xl">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">{t('pricing_plan_title')}</CardTitle>
                                <CardDescription>One plan. All features. No compromises.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-5xl font-bold">$99</span>
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
        <section className="bg-foreground py-16">
            <div className="container px-4 text-center">
                 <h2 className="text-3xl font-bold tracking-tight font-headline text-background">🚀 Stop Dispatching. Start Operating.</h2>
                 <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-background/80">
                  Your fleet isn’t just a cost center — it’s a profit engine waiting to be optimized.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/signup">Try It Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-transparent text-background border-background hover:bg-background hover:text-foreground">
                    <Link href="/signup">Book a Demo</Link>
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
