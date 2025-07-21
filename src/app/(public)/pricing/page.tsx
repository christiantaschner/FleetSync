
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { useTranslation } from '@/hooks/use-language';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Bot, Zap, Shuffle, ShieldQuestion, BarChart, Users, ArrowRight, UserCog, Heart, AlertTriangle, Smartphone, Map, MessageSquare, CalendarDays, Cog, Brain, Eye, Building2, Mailbox, WifiOff, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PricingPage() {
  const { t, language, setLanguage } = useTranslation();

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
           <nav className="flex items-center space-x-6 text-sm font-medium">
             <Link href="/pricing" className="text-foreground transition-colors">
                {t('pricing_title')}
              </Link>
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-2">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2 font-semibold text-foreground/80 hover:bg-secondary hover:text-foreground">
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
        </div>
      </header>

      <main className="flex-1">
        {/* Pricing Section */}
        <section className="bg-primary/5 py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              {t('pricing_title')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('pricing_subtitle')}
            </p>
          </div>
        </section>

        <section className="container py-16 sm:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="flex justify-center">
                    <Card className="max-w-md w-full border-primary ring-2 ring-primary shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{t('pricing_plan_title')}</CardTitle>
                            <CardDescription>{t('pricing_plan_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-5xl font-bold">$49</span>
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
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold font-headline">{t('pricing_why_simple_title')}</h2>
                    <p className="text-muted-foreground">{t('pricing_why_simple_desc')}</p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
                                <Zap className="h-6 w-6"/>
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('pricing_benefit_1_title')}</h3>
                                <p className="text-sm text-muted-foreground">{t('pricing_benefit_1_desc')}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
                                <BarChart className="h-6 w-6"/>
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
            </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary py-16">
          <div className="container text-center">
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
        <div className="container flex h-16 items-center justify-between">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} FleetSync AI. {t('all_rights_reserved')}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <Link href="#" className="hover:text-primary">{t('privacy_policy')}</Link>
             <Link href="#" className="hover:text-primary">{t('terms_of_service')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
