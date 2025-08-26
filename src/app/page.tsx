
"use client";

import { Check, Bot, Zap, Shuffle, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Briefcase, TrendingUp, DollarSign, Menu, Workflow, UserCheck, Star, Repeat, ClipboardList, Target, X, Users, Lightbulb, CloudRain, List, Info, Globe, Droplets, Bug, Computer, Wrench, Building2, BarChart, Package } from 'lucide-react';
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
  const [numTechs, setNumTechs] = useState(5);
  const [jobsPerDay, setJobsPerDay] = useState(4);
  const [avgJobValue, setAvgJobValue] = useState(450);
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
    const monthlyRevenue = numTechs * jobsPerDay * avgJobValue * 21; // ~21 working days/month
    const profitGain = monthlyRevenue * 0.15; // Assume a 15% improvement
    setRoi(profitGain);
  };
  
  const navLinks = [
    { href: "#problem", text: "The Problem" },
    { href: "#solution", text: "The Solution" },
    { href: "#features", text: "Features" },
    { href: "#pricing", text: "Pricing" }
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
              The AI Dispatcher That Thinks Like Your CFO
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Assign jobs based on profit per hour, not just proximity. Make every job a winning job.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700">
                        <Link href="/signup">Start Maximizing Profit Today</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full">
                        <Link href="#solution">See How It Works</Link>
                    </Button>
                </div>
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

        {/* 2. The Problem Section */}
        <section id="problem" className="py-16 sm:py-24">
            <div className="container">
                 <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why Traditional Dispatch Fails</h2>
                     <p className="mt-4 text-lg text-muted-foreground">
                        Traditional dispatch focuses on one thing: assigning the "nearest tech." This ignores the factors that actually make you money, leaving an average of 10-20% of your potential profit on the table.
                     </p>
                </div>
            </div>
        </section>
        
        {/* 3. Introducing Profit-First Dispatching */}
        <section id="solution" className="py-16 sm:py-24 bg-muted">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline text-primary">Introducing: Profit-First Dispatching</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        MarginMax's AI analyzes the complete financial profile of every job, then assigns it to the technician who will deliver the maximum profit per hour for your entire fleet.
                    </p>
                </div>
                 <div className="mt-12">
                    <Image
                        src="https://storage.googleapis.com/static.fleetsync.site/profit-first-dispatch-flow.png"
                        width={1200}
                        height={400}
                        alt="An animated flow showing a job coming in, the AI calculating its profit potential, and assigning it to the optimal technician."
                        className="w-full h-auto object-contain"
                        data-ai-hint="AI process diagram"
                    />
                </div>
            </div>
        </section>

        {/* 4. How It Works */}
        <section className="py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">A Simple, Four-Step Process</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        We made complex decisions incredibly simple. No complicated setup required.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto font-bold text-2xl">1</div>
                        <h3 className="mt-4 text-lg font-semibold">Input Jobs</h3>
                        <p className="mt-1 text-muted-foreground">Enter jobs as they come in with their basic revenue and cost info.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto font-bold text-2xl">2</div>
                        <h3 className="mt-4 text-lg font-semibold">Define Constraints</h3>
                        <p className="mt-1 text-muted-foreground">Set technician skills, SLAs, and customer needs.</p>
                    </div>
                    <div className="text-center">
                         <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto font-bold text-2xl">3</div>
                        <h3 className="mt-4 text-lg font-semibold">AI Optimizes</h3>
                        <p className="mt-1 text-muted-foreground">Our AI analyzes every possibility to maximize profit per hour.</p>
                    </div>
                    <div className="text-center">
                         <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto font-bold text-2xl">4</div>
                        <h3 className="mt-4 text-lg font-semibold">Approve & Dispatch</h3>
                        <p className="mt-1 text-muted-foreground">Review the AI's suggestions and dispatch with one click.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 5 & 6. Revenue & Cost Drivers */}
        <section id="features" className="bg-muted py-16 sm:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Our AI Sees the Full Financial Picture</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        MarginMax goes beyond simple scheduling by analyzing every factor that impacts your bottom line.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><TrendingUp className="text-green-500"/> Revenue Drivers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Quoted Job Value:</strong> The baseline income from the job.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Upsell Potential:</strong> AI learns which techs are best at generating add-on sales.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>SLA Premiums:</strong> Prioritizes high-value contracts with strict Service Level Agreements.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>After-Hours Surcharges:</strong> Maximizes profit from emergency or after-hours calls.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign className="text-red-500"/> Cost Drivers</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-3">
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Labor Cost:</strong> Considers the hourly cost of each technician.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Drive Time:</strong> Factors in fuel and paid travel time to reduce waste.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Parts Required:</strong> Accounts for the cost of necessary parts for a job.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Risk of Return Visit:</strong> AI learns which techs are most likely to fix a job right the first time.</p>
                        </CardContent>
                    </Card>
                    {/* 7. Constraints */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Workflow className="text-blue-500"/> Real-World Constraints</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-3">
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>SLA Windows:</strong> Ensures service level agreements are met.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Technician Skills:</strong> Matches the right expertise to the job's requirements.</p>
                            <p className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-1 shrink-0" /> <strong>Customer Preferences:</strong> Can factor in customer requests for specific technicians.</p>
                             <p className="mt-4 font-semibold text-primary">Maximum profit without ever breaking a promise.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
        
        {/* 8. Industry-Specific Benefits */}
        <section className="container py-16 sm:py-24">
             <div className="mx-auto max-w-2xl text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Built for HVAC, Electrical, Plumbing & More</h2>
                 <p className="mt-6 text-lg text-muted-foreground">No matter your trade, the system learns where your margins live — and helps you capture them.</p>
             </div>
             <div className="mt-12 flex flex-wrap justify-center gap-6">
                <Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                    <Wrench className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="mt-4 font-semibold text-lg">HVAC</h3>
                    <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                    <p className="mt-1 text-sm font-medium">Prioritizing maintenance contract upsells and after-hours surcharges.</p>
                </Card>
                <Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                    <Zap className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="mt-4 font-semibold text-lg">Electrical</h3>
                    <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                    <p className="mt-1 text-sm font-medium">Balancing high SLA penalties with premium emergency job values.</p>
                </Card>
                <Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                    <Droplets className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="mt-4 font-semibold text-lg">Plumbing</h3>
                    <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                    <p className="mt-1 text-sm font-medium">Factoring in parts availability and the cost risk of repeat visits.</p>
                </Card>
                <Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                    <Bug className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="mt-4 font-semibold text-lg">Pest Control</h3>
                    <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                    <p className="mt-1 text-sm font-medium">Learning customer preferences and maximizing recurring contract values.</p>
                </Card>
                <Card className="text-center p-6 h-full max-w-sm lg:max-w-xs flex-grow">
                    <Computer className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="mt-4 font-semibold text-lg">IT Services</h3>
                    <p className="mt-2 text-sm text-muted-foreground">The AI weighs factors like:</p>
                    <p className="mt-1 text-sm font-medium">Understanding skill-matching for complex, high-value tickets.</p>
                </Card>
            </div>
        </section>

        {/* 9. The Results */}
        <section className="bg-muted py-16 sm:py-24">
            <div className="container text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">The Results: What Profit-First Dispatching Delivers</h2>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="text-center">
                        <p className="text-5xl font-bold text-primary">15-25%</p>
                        <p className="mt-2 font-semibold">Increased Profit Margin</p>
                        <p className="mt-1 text-sm text-muted-foreground">By assigning the most profitable tech, not just the closest.</p>
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-bold text-primary">30%</p>
                        <p className="mt-2 font-semibold">Reduced Drive Costs</p>
                        <p className="mt-1 text-sm text-muted-foreground">Less fuel and more billable hours per day.</p>
                    </div>
                    <div className="text-center">
                         <p className="text-5xl font-bold text-primary">98%</p>
                        <p className="mt-2 font-semibold">SLA Compliance</p>
                        <p className="mt-1 text-sm text-muted-foreground">Avoid costly penalties by prioritizing high-value contracts.</p>
                    </div>
                     <div className="text-center">
                        <p className="text-5xl font-bold text-primary">80%</p>
                        <p className="mt-2 font-semibold">Reduction in Unprofitable Jobs</p>
                        <p className="mt-1 text-sm text-muted-foreground">Stop sending your best resources to low-margin tasks.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 10. Competitive Comparison */}
        <section className="py-16 sm:py-24">
             <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Other Dispatchers Focus on Speed. We Focus on Profit.</h2>
                </div>
                <div className="mt-12 max-w-4xl mx-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Feature</TableHead>
                                <TableHead className="text-center">Standard Dispatcher</TableHead>
                                <TableHead className="text-center text-primary font-bold">Profit-First AI</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Job Assignment</TableCell>
                                <TableCell className="text-center">Nearest Tech</TableCell>
                                <TableCell className="text-center font-bold">Maximizes Profit</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Cost Analysis</TableCell>
                                <TableCell className="text-center"><X className="mx-auto text-destructive" /></TableCell>
                                <TableCell className="text-center"><Check className="mx-auto text-green-500" /></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Revenue Optimization</TableCell>
                                <TableCell className="text-center"><X className="mx-auto text-destructive" /></TableCell>
                                <TableCell className="text-center"><Check className="mx-auto text-green-500" /></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">SLA & Skills</TableCell>
                                <TableCell className="text-center">Partial</TableCell>
                                <TableCell className="text-center"><Check className="mx-auto text-green-500" /></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Route Efficiency</TableCell>
                                <TableCell className="text-center"><Check className="mx-auto text-green-500" /></TableCell>
                                <TableCell className="text-center"><Check className="mx-auto text-green-500" /> + Profit Optimization</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
             </div>
        </section>
        
        {/* 11. Call-to-Action Section */}
        <section id="pricing" className="bg-primary/5 py-20 sm:py-24 lg:py-32">
            <div className="container px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Start Optimizing Your Profit Today</h2>
                <div className="mt-8 flex justify-center">
                    <Button asChild size="lg">
                        <Link href="/signup">Start Your Free Trial</Link>
                    </Button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">No credit card required. Easy setup. Works for any service business.</p>
            </div>
        </section>

        {/* 12. FAQ Section */}
        <section className="py-16 sm:py-24">
             <div className="container max-w-4xl">
                 <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Frequently Asked Questions</h2>
                </div>
                <Accordion type="single" collapsible className="w-full mt-12">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Do I need to input every cost manually?</AccordionTrigger>
                        <AccordionContent>
                        No. You can start with averages for labor and parts. Over time, the AI learns from your actual job data to refine its cost and profit predictions, making them more accurate automatically.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Is it hard for my dispatchers to adopt?</AccordionTrigger>
                        <AccordionContent>
                        Not at all. MarginMax is designed to feel familiar, with tools like a drag-and-drop schedule and a simple job list. The AI provides suggestions that dispatchers can approve in one click, making their job easier, not harder.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Can it handle multiple niches?</AccordionTrigger>
                        <AccordionContent>
                        Yes. The system is built on a flexible skills and constraints engine. You define the skills for your industry (HVAC, plumbing, etc.), and the AI uses that data to make intelligent decisions tailored to your specific business needs.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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
