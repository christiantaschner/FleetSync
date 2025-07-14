
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
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Company } from "@/types";
import { ensureUserDocumentAction } from "@/actions/user-actions";
import Link from "next/link";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHelpOpen, setHelpOpen] = useState(false);
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous listeners to prevent memory leaks on user change
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
      
      // Reset state
      setUserProfile(null);
      setCompany(null);
      setUser(currentUser); // Set the Firebase user object immediately

      if (currentUser) {
        try {
            // Ensure a user document exists in Firestore.
            await ensureUserDocumentAction({ 
                uid: currentUser.uid, 
                email: currentUser.email! 
            });

            // Force a token refresh to get the latest custom claims.
            const idTokenResult = await currentUser.getIdTokenResult(true);
            const claims = idTokenResult.claims;
            
            // Log claims for debugging, as requested.
            console.log("--- Firebase Auth Custom Claims ---");
            console.log("Gesamte Claims:", idTokenResult.claims);
            console.log("companyId aus Claims:", idTokenResult.claims.companyId); // Beachten Sie die Groß-/Kleinschreibung
            console.log("role aus Claims:", idTokenResult.claims.role);
            console.log("-----------------------------------");
            
            // Claims are the source of truth for role and companyId.
            const roleFromClaims = (claims.role as UserProfile['role']) || null;
            const companyIdFromClaims = (claims.companyId as string) || null;
            
            // Listen to the user's Firestore document for non-critical, reactive UI data.
            const userDocRef = doc(db, "users", currentUser.uid);

            unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
                const firestoreData = userDocSnap.exists() ? userDocSnap.data() : {};
                
                // Combine claims and Firestore data.
                const finalProfile: UserProfile = {
                    uid: currentUser.uid,
                    email: currentUser.email!,
                    role: roleFromClaims,
                    companyId: companyIdFromClaims,
                    onboardingStatus: firestoreData.onboardingStatus || 'pending_onboarding',
                };
                setUserProfile(finalProfile);

                // Clean up any old company listener before creating a new one
                if (unsubscribeCompany) unsubscribeCompany();

                if (finalProfile.companyId) {
                    const companyDocRef = doc(db, "companies", finalProfile.companyId);
                    unsubscribeCompany = onSnapshot(companyDocRef, (companyDocSnap) => {
                        if (companyDocSnap.exists()) {
                            const companyData = companyDocSnap.data();
                            // Ensure timestamps are serializable
                            for (const key in companyData) {
                                if (companyData[key] && typeof companyData[key].toDate === 'function') {
                                    companyData[key] = companyData[key].toDate().toISOString();
                                }
                            }
                            setCompany({ id: companyDocSnap.id, ...companyData } as Company);
                        } else {
                            setCompany(null);
                        }
                        setLoading(false); // Auth is ready only AFTER company data is fetched
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
        // User is logged out, clear all data and stop loading.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the main auth listener
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
    };
  }, []); // Removed toast dependency as it's stable

  const login = async (email_address: string, pass_word: string) => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email_address, pass_word);
      // Redirection is handled by layout component based on profile status
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
      // Redirect handled by layout
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
    // The onAuthStateChanged listener will handle state cleanup
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, company, loading, login, signup, logout, isHelpOpen, setHelpOpen }}>
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
