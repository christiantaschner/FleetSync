
"use client";

import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase"; 
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Company, Contract, Job, JobStatus } from "@/types";
import { ensureUserDocumentAction } from "@/actions/user-actions";
import Link from "next/link";
import { addDays, isBefore } from 'date-fns';
import { getNextDueDate } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  login: (email_address: string, pass_word: string) => Promise<boolean>;
  signup: (email_address: string, pass_word: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  contractsDueCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [contractsDueCount, setContractsDueCount] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      console.error("Firebase Auth or Firestore is not initialized.");
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeCompany: (() => void) | null = null;
    let unsubscribeContractsAndJobs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous listeners to prevent memory leaks on user change
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeContractsAndJobs) unsubscribeContractsAndJobs();
      
      setUser(currentUser);
      setUserProfile(null);
      setCompany(null);
      setContractsDueCount(0);

      if (currentUser) {
        try {
            // First, ensure the user document and claims are synchronized.
            await ensureUserDocumentAction({ 
                uid: currentUser.uid, 
                email: currentUser.email! 
            });
            
            // Force a refresh of the token to get the latest claims.
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const claims = idTokenResult.claims;
            const roleFromClaims = (claims.role as UserProfile['role']) || null;
            const companyIdFromClaims = (claims.companyId as string) || null;

            // Now that claims are fresh, set up listeners.
            const userDocRef = doc(db, "users", currentUser.uid);

            unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
                if (userDocSnap.exists()) {
                    const firestoreData = userDocSnap.data();
                    const finalProfile: UserProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email!,
                        role: roleFromClaims,
                        companyId: companyIdFromClaims,
                        onboardingStatus: firestoreData.onboardingStatus || 'pending_onboarding',
                    };
                    setUserProfile(finalProfile);

                    if (unsubscribeCompany) unsubscribeCompany();
                    if (unsubscribeContractsAndJobs) unsubscribeContractsAndJobs();

                    if (finalProfile.companyId) {
                        const companyDocRef = doc(db, "companies", finalProfile.companyId);
                        unsubscribeCompany = onSnapshot(companyDocRef, (companyDocSnap) => {
                            if (companyDocSnap.exists()) {
                                const companyData = companyDocSnap.data();
                                setCompany({ id: companyDocSnap.id, ...companyData } as Company);
                            } else {
                                setCompany(null);
                            }
                            setLoading(false);
                        }, (error) => {
                            console.error("Error fetching company data:", error);
                            setCompany(null);
                            setLoading(false);
                        });
                    } else {
                        // If no companyId, we are done loading.
                        setCompany(null);
                        setLoading(false);
                    }
                } else {
                    // User doc doesn't exist, which shouldn't happen after ensureUserDocumentAction.
                    // This is a fail-safe to prevent getting stuck.
                    console.error("User document not found after ensuring it exists.");
                    setUserProfile(null);
                    setCompany(null);
                    setLoading(false);
                }
            }, (error) => {
                console.error("Error listening to user profile:", error);
                setUserProfile(null);
                setCompany(null);
                setLoading(false);
            });
        } catch (err) {
            console.error("Critical error during auth state processing:", err);
            setUser(null);
            setUserProfile(null);
            setCompany(null);
            setLoading(false);
        }
      } else {
        // No user, we are done loading.
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeContractsAndJobs) unsubscribeContractsAndJobs();
    };
  }, []);

  const login = async (email_address: string, pass_word: string) => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email_address, pass_word);
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
      setLoading(false);
      return false;
    }
  };

  const signup = async (email_address: string, pass_word: string) => {
     if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email_address, pass_word);
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Signup Failed",
          description: (
            <span>
              An account with this email already exists. Please{' '}
              <Link href="/login" className="font-bold underline">
                login
              </Link>
              {' '}instead.
            </span>
          ),
          variant: "destructive",
        });
      } else {
        toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      }
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, company, loading, login, signup, logout, isHelpOpen, setHelpOpen, contractsDueCount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
