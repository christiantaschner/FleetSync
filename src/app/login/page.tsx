
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
import { Loader2, Globe } from "lucide-react";
import { useTranslation } from "@/hooks/use-language";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t, setLanguage, language } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    const success = await login(data.email, data.password);
    if (!success) {
      setIsLoading(false);
    }
    // On success, the auth context will handle routing.
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="w-full bg-primary p-4 text-primary-foreground shadow-md">
        <div className="mx-auto flex items-center justify-between max-w-lg">
            <div className="w-24"></div>
            <Link href="/" className="flex justify-center">
                <Logo />
            </Link>
            <div className="flex items-center justify-end w-24">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80 px-2 font-semibold">
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
            </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">{t('login_title')}</CardTitle>
              <CardDescription>{t('login_desc')}</CardDescription>
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('login_button')}
                  </Button>
                </div>
              </CardContent>
            </form>
            <CardFooter className="flex flex-col items-center gap-2 pt-4">
               <p className="text-sm text-muted-foreground">
                {t('no_account')}{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  {t('sign_up_link')}
                </Link>
              </p>
               <Link href="#" className="text-sm text-primary hover:underline">
                    {t('forgot_password')}
                </Link>
            </CardFooter>
          </Card>
      </main>
    </div>
  );
}
