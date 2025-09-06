
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/common/logo";
import { Loader2, Bot, Globe } from "lucide-react";
import { useTranslation } from "@/hooks/use-language";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t, setLanguage, language } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setIsLoading(true);
    const success = await signup(data.email, data.password);
    if (!success) {
      setIsLoading(false);
    }
    // On success, the auth context will handle routing
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
       <header className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>
                <div className="flex items-center justify-end">
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
                </div>
            </div>
        </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{t('create_account')}</CardTitle>
            <CardDescription>
              Get started with your AI-powered fleet management.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('signup_button')}
                </Button>
              </div>
            </CardContent>
          </form>
           <CardFooter className="flex flex-col items-center">
             <p className="text-sm text-muted-foreground">
              {t('already_have_account')}{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('login_link')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
