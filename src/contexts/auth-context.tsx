
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
      
      // Reset state
      setUserProfile(null);
      setCompany(null);
      setUser(currentUser); // Set the Firebase user object immediately
      setContractsDueCount(0);

      if (currentUser) {
        try {
            await ensureUserDocumentAction({ 
                uid: currentUser.uid, 
                email: currentUser.email! 
            });

            const idTokenResult = await currentUser.getIdTokenResult(true);
            const claims = idTokenResult.claims;
            
            const roleFromClaims = (claims.role as UserProfile['role']) || null;
            const companyIdFromClaims = (claims.companyId as string) || null;
            
            const userDocRef = doc(db, "users", currentUser.uid);

            unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
                const firestoreData = userDocSnap.exists() ? userDocSnap.data() : {};
                
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
                            for (const key in companyData) {
                                if (companyData[key] && typeof companyData[key].toDate === 'function') {
                                    companyData[key] = companyData[key].toDate().toISOString();
                                }
                            }
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

                    // Combined listener for Contracts and Jobs
                    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                    if (appId) {
                        const activeJobStatuses: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress'];
                        const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", finalProfile.companyId), where("isActive", "==", true));
                        
                        unsubscribeContractsAndJobs = onSnapshot(contractsQuery, async (contractsSnapshot) => {
                            const contracts = contractsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
                            
                            // Get all jobs for the company to cross-reference
                            const jobsQuery = query(collection(db, `artifacts/${appId}/public/data/jobs`), where("companyId", "==", finalProfile.companyId));
                            const jobsSnapshot = await getDocs(jobsQuery);
                            const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));

                            const oneWeekFromNow = addDays(new Date(), 7);
                            let dueCount = 0;

                            for (const contract of contracts) {
                                const nextDueDate = getNextDueDate(contract);
                                // A contract is due if its next service date is in the past or within the next 7 days.
                                const isTheoreticallyDue = isBefore(nextDueDate, oneWeekFromNow);

                                if (isTheoreticallyDue) {
                                    // Check if a job for this contract already exists and is not cancelled.
                                    const hasOpenJob = allJobs.some(job => 
                                        job.sourceContractId === contract.id &&
                                        new Date(job.createdAt) > new Date(contract.lastGeneratedUntil || 0) &&
                                        job.status !== 'Cancelled'
                                    );
                                    
                                    // If it's due AND there's no open job, it needs attention.
                                    if (!hasOpenJob) {
                                        dueCount++;
                                    }
                                }
                            }
                            setContractsDueCount(dueCount);
                        });
                    }

                } else {
                    setCompany(null);
                    setLoading(false);
                }

            }, (error) => {
                console.error("Error fetching user profile:", error);
                setUserProfile(null);
                setCompany(null);
                setLoading(false);
            });
        } catch (err) {
            console.error("Error during auth state processing:", err);
            setUser(null);
            setUserProfile(null);
            setCompany(null);
            setLoading(false);
        }
      } else {
        setUser(null);
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
