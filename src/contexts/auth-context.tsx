
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
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Company, Contract, Job, JobStatus } from "@/types";
import { ensureUserDocumentAction } from "@/actions/user-actions";
import Link from "next/link";
import { getNextDueDate } from "@/lib/utils";
import { isBefore } from "date-fns";

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

    let unsubscribeCompany: (() => void) | null = null;
    let unsubscribeContractsAndJobs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous listeners
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeContractsAndJobs) unsubscribeContractsAndJobs();
      
      setUser(currentUser);
      setUserProfile(null);
      setCompany(null);
      setContractsDueCount(0);
      setLoading(true);

      if (currentUser) {
        try {
          // This server action now creates the user doc if it doesn't exist
          // and reliably returns the user's profile data from Firestore.
          const { data: profile, error } = await ensureUserDocumentAction({ 
              uid: currentUser.uid, 
              email: currentUser.email! 
          });

          if (error) {
            throw new Error(error);
          }

          if (profile) {
              setUserProfile(profile);

              if (profile.companyId) {
                  const companyDocRef = doc(db, "companies", profile.companyId);
                  unsubscribeCompany = onSnapshot(companyDocRef, (companyDocSnap) => {
                      if (companyDocSnap.exists()) {
                          const companyData = { id: companyDocSnap.id, ...companyDocSnap.data() } as Company;
                          setCompany(companyData);

                          // Set up listener for due contracts
                           const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                           if (appId) {
                                let jobsUnsubscribe: (() => void) | null = null;
                                const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", profile.companyId), where("isActive", "==", true));
                                
                                unsubscribeContractsAndJobs = onSnapshot(contractsQuery, async (contractsSnapshot) => {
                                    if (jobsUnsubscribe) jobsUnsubscribe(); // Unsubscribe from old jobs listener
                                    
                                    const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", profile.companyId));
                                    jobsUnsubscribe = onSnapshot(jobsQuery, (jobsSnapshot) => {
                                        const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
                                        const allContracts = contractsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));

                                        const dueCount = allContracts.reduce((count, contract) => {
                                            const nextDueDate = getNextDueDate(contract);
                                            const hasOpenJob = allJobs.some(job => 
                                                job.sourceContractId === contract.id &&
                                                new Date(job.createdAt) > new Date(contract.lastGeneratedUntil || 0) &&
                                                job.status !== 'Cancelled'
                                            );
                                            if (isBefore(nextDueDate, new Date()) && !hasOpenJob) {
                                                return count + 1;
                                            }
                                            return count;
                                        }, 0);
                                        setContractsDueCount(dueCount);
                                    });
                                });
                            }
                      } else {
                          setCompany(null);
                      }
                      setLoading(false);
                  }, (err) => {
                      console.error("Error fetching company data:", err);
                      setCompany(null);
                      setLoading(false);
                  });
              } else {
                  setCompany(null);
                  setLoading(false);
              }
          } else {
            // Failsafe if profile is null but no error was thrown
            throw new Error("User profile could not be retrieved.");
          }
        } catch (err) {
            console.error("Critical error during auth state processing:", err);
            toast({ title: "Authentication Error", description: "Could not retrieve your profile. Please try logging in again.", variant: "destructive"});
            await signOut(auth);
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
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
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
