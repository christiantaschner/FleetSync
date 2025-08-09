
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
import Link from "next/link";
import { getNextDueDate } from "@/lib/utils";
import { isBefore } from "date-fns";
import { mockJobs, mockContracts, mockTechnicians } from "@/lib/mock-data";
import { PREDEFINED_SKILLS } from "@/lib/skills";
import { createUserProfileAction } from "@/actions/user-actions";

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
  isMockMode: boolean;
  setIsMockMode: (isMock: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Mock Data Setup ---
const MOCK_ADMIN_USER: User = { uid: 'mock_admin_id', email: 'admin@mock.com' } as User;
const MOCK_ADMIN_PROFILE: UserProfile = {
  uid: 'mock_admin_id',
  email: 'admin@mock.com',
  companyId: 'mock_company_123',
  role: 'superAdmin',
  onboardingStatus: 'completed',
};
const MOCK_ONBOARDING_PROFILE: UserProfile = {
  uid: 'mock_admin_id',
  email: 'admin@mock.com',
  companyId: null,
  role: null,
  onboardingStatus: 'pending_onboarding',
};
const MOCK_COMPANY: Company = {
  id: 'mock_company_123',
  name: 'Mock Service Company',
  ownerId: 'mock_admin_id',
  subscriptionStatus: 'active',
  settings: {
    companySpecialties: ["HVAC", "Plumbing"],
    hideHelpButton: false
  }
};

const getMockContractsDueCount = () => {
    return mockContracts.reduce((count, contract) => {
        if (!contract.isActive) return count;
        const nextDueDate = getNextDueDate(contract);
        const hasOpenJob = mockJobs.some(job => 
            job.sourceContractId === contract.id &&
            new Date(job.createdAt) > new Date(contract.lastGeneratedUntil || 0) &&
            job.status !== 'Cancelled'
        );
        if (isBefore(nextDueDate, new Date()) && !hasOpenJob) {
            return count + 1;
        }
        return count;
    }, 0);
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [contractsDueCount, setContractsDueCount] = useState(0);

  const [isMockMode, setMockModeState] = useState(process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true');
  const { toast } = useToast();
  const router = useRouter();

  const setIsMockMode = (isMock: boolean) => {
    localStorage.setItem('mockMode', JSON.stringify(isMock));
    sessionStorage.removeItem('mock_onboarding_complete'); // Clear onboarding state on mode switch
    setMockModeState(isMock);
    if (isMock) {
        toast({ title: "Mock Mode Activated", description: "You are now viewing sample data." });
    } else {
        toast({ title: "Live Mode Activated", description: "You are now viewing your real data." });
    }
    // Force a re-evaluation of data sources
    window.location.reload();
  };

  useEffect(() => {
    const storedMockMode = localStorage.getItem('mockMode');
    const mockModeActive = storedMockMode ? JSON.parse(storedMockMode) : process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    const mockOnboardingComplete = sessionStorage.getItem('mock_onboarding_complete') === 'true';

    if (mockModeActive) {
      console.log("Auth Context: Running in MOCK DATA mode.");
      setUser(MOCK_ADMIN_USER);
      
      if (mockOnboardingComplete) {
          setUserProfile(MOCK_ADMIN_PROFILE);
          setCompany(MOCK_COMPANY);
      } else {
          setUserProfile(MOCK_ONBOARDING_PROFILE);
          setCompany(null);
      }

      setContractsDueCount(getMockContractsDueCount());
      setLoading(false);
      setMockModeState(true);
      return;
    }

    // --- REAL FIREBASE MODE ---
    if (!auth || !db) {
      console.error("Firebase Auth or Firestore is not initialized.");
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeCompany: (() => void) | null = null;
    let unsubscribeContractsAndJobs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous listeners
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeContractsAndJobs) unsubscribeContractsAndJobs();
      
      setUser(currentUser);
      setUserProfile(null);
      setCompany(null);
      setContractsDueCount(0);
      setLoading(true);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
                const profile = { uid: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
                setUserProfile(profile);

                if (profile.companyId) {
                    const companyDocRef = doc(db, "companies", profile.companyId);
                    unsubscribeCompany = onSnapshot(companyDocRef, (companyDocSnap) => {
                        if (companyDocSnap.exists()) {
                            const companyData = { id: companyDocSnap.id, ...companyDocSnap.data() } as Company;
                            setCompany(companyData);
                            
                             const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                             if (appId) {
                                  let jobsUnsubscribe: (() => void) | null = null;
                                  const contractsQuery = query(collection(db, `artifacts/${appId}/public/data/contracts`), where("companyId", "==", profile.companyId), where("isActive", "==", true));
                                  
                                  unsubscribeContractsAndJobs = onSnapshot(contractsQuery, async (contractsSnapshot) => {
                                      if (jobsUnsubscribe) jobsUnsubscribe();
                                      
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
                    });
                } else {
                    setCompany(null);
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching user profile:", err);
            toast({ title: "Authentication Error", description: "Could not retrieve your profile. Please try logging in again.", variant: "destructive"});
            setUserProfile(null);
            setLoading(false);
        });

      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeContractsAndJobs) unsubscribeContractsAndJobs();
    };
  }, [toast, router, isMockMode]); // Added isMockMode to dependency array

  const login = async (email_address: string, pass_word: string) => {
    if (isMockMode) {
      toast({ title: "Login Successful (Mock Mode)", description: "Redirecting to the dashboard..." });
      sessionStorage.setItem('mock_onboarding_complete', 'true');
      window.location.reload();
      return true;
    }
    
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    
    try {
      await signInWithEmailAndPassword(auth, email_address, pass_word);
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast({
            title: "User Not Found",
            description: (
                <span>
                    No account found for this email. Would you like to{' '}
                    <Link href="/signup" className="font-bold underline">
                        Sign up?
                    </Link>
                </span>
            ),
            variant: "destructive",
            duration: 10000,
        });
      } else {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      }
      return false;
    }
  };

  const signup = async (email_address: string, pass_word: string) => {
    if (isMockMode) {
      toast({ title: "Signup Complete (Mock)", description: "Redirecting to mock onboarding..." });
      router.push('/onboarding');
      return true;
    }
    
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email_address, pass_word);
      const user = userCredential.user;

      // Step 2: Call server action to create user profile in Firestore
      const profileResult = await createUserProfileAction({ uid: user.uid, email: user.email! });

      if (profileResult.error) {
        throw new Error(`Failed to create user profile: ${profileResult.error}`);
      }
      
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      let message = error.message;

      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please login instead.';
      } else {
         message = "An unexpected error occurred during signup. Please contact support at info@fleet-sync.ai if the problem persists.";
      }
      
      toast({
        title: "Signup Failed",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('mockMode');
    sessionStorage.removeItem('mock_onboarding_complete');
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, company, loading, login, signup, logout, isHelpOpen, setHelpOpen, contractsDueCount, isMockMode, setIsMockMode }}>
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
