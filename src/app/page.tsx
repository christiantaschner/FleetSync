"use client";

import { Check, Bot, Zap, Shuffle, ShieldQuestion, BarChart, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Dispatch',
    description: 'Instantly assign the best technician to any job based on skill, availability, and location. For emergencies, our AI can even suggest interrupting a lower-priority job.',
  },
  {
    icon: <Shuffle className="h-8 w-8 text-primary" />,
    title: 'Dynamic Route Optimization',
    description: 'When plans change, re-optimize any technician\'s route with a single click. The AI finds the most efficient path, respecting fixed appointments while minimizing travel time.',
  },
  {
    icon: <ShieldQuestion className="h-8 w-8 text-primary" />,
    title: 'Proactive Schedule Risk Alerts',
    description: 'Our AI constantly monitors active jobs and predicts potential delays before they happen, giving you time to notify customers or reassign work.',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Intelligent Reporting',
    description: 'Go beyond simple numbers. Get AI-summarized insights into your fleet\'s performance, identifying key trends and areas for improvement.',
  },
];

const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-accent" />,
      title: 'Increase Efficiency',
      description: 'Slash idle time and complete more jobs per day with smarter assignments and optimized routes.'
    },
    {
      icon: <Users className="h-6 w-6 text-accent" />,
      title: 'Improve Customer Satisfaction',
      description: 'Proactively communicate delays and provide customers with live tracking links for a modern service experience.'
    },
    {
      icon: <Check className="h-6 w-6 text-accent" />,
      title: 'Reduce Operational Costs',
      description: 'Minimize fuel consumption, reduce unnecessary travel, and make data-driven decisions to boost your bottom line.'
    }
];

export default function MarketingPage() {
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
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-20 sm:py-24 lg:py-32">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              Stop Guessing. Start Optimizing.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              FleetSync AI is the intelligent dispatch software that automates your most complex decisions. Reduce fuel costs, eliminate downtime, and keep your customers happy.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Image Feature Section */}
         <section className="container py-16 sm:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
                <div className="space-y-4">
                    <Badge variant="secondary">The Problem</Badge>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Your Dispatch is Leaking Money</h2>
                    <p className="text-muted-foreground">
                        Every minute a technician spends idle, every gallon of gas wasted on an inefficient route, and every customer left waiting is a direct hit to your bottom line. Manual dispatching is slow, prone to error, and can't adapt to the chaos of a typical service day.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary"/><span>High fuel costs from inefficient routes.</span></li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary"/><span>Wasted technician time between jobs.</span></li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary"/><span>Poor customer communication about delays.</span></li>
                    </ul>
                </div>
                <div className="aspect-video overflow-hidden rounded-lg border shadow-lg">
                    <Image
                        src="https://placehold.co/600x400.png"
                        alt="A fleet of service vans"
                        width={600}
                        height={400}
                        className="h-full w-full object-cover"
                        data-ai-hint="fleet vans"
                    />
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="default">Our Solution</Badge>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl font-headline">Meet Your AI Co-Dispatcher</h2>
              <p className="mt-6 text-lg text-muted-foreground">
                FleetSync AI uses cutting-edge artificial intelligence to solve your toughest dispatch challenges, turning chaos into predictable efficiency.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16 sm:py-24">
            <div className="container">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="flex flex-col items-center text-center">
                            {benefit.icon}
                            <h3 className="mt-4 text-xl font-semibold font-headline">{benefit.title}</h3>
                            <p className="mt-2 text-muted-foreground">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 py-16">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Ready to Transform Your Fleet?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Sign up today for a 30-day free trial. No credit card required. Experience the power of AI dispatch firsthand.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/signup">Start Your Free Trial Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex h-16 items-center justify-between">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} FleetSync AI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <Link href="#" className="hover:text-primary">Privacy Policy</Link>
             <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
