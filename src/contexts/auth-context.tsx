
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

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  login: (email_address: string, pass_word: string) => Promise<boolean>;
  signup: (email_address: string, pass_word: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
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
      // Clean up previous listeners
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
      
      setUserProfile(null);
      setCompany(null);

      if (currentUser) {
        // Set user immediately
        setUser(currentUser);

        try {
            // First, ensure a document for this user exists in Firestore.
            // This is crucial for storing non-claim data like onboardingStatus.
            await ensureUserDocumentAction({ 
                uid: currentUser.uid, 
                email: currentUser.email! 
            });

            // Force a token refresh to get the latest custom claims from the backend.
            const idTokenResult = await currentUser.getIdTokenResult(true);
            const claims = idTokenResult.claims;

            // The user's role and companyId are now authoritatively sourced from claims.
            const roleFromClaims = (claims.role as UserProfile['role']) || null;
            const companyIdFromClaims = (claims.companyId as string) || null;
            
            // We still need to listen to the user's Firestore document for reactive
            // UI changes, like their onboarding status.
            const userDocRef = doc(db, "users", currentUser.uid);

            unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
                const firestoreData = userDocSnap.exists() ? userDocSnap.data() : {};
                
                // Combine claims and Firestore data to create the complete user profile.
                // Claims are the source of truth for role and companyId.
                const finalProfile: UserProfile = {
                    uid: currentUser.uid,
                    email: currentUser.email!,
                    role: roleFromClaims,
                    companyId: companyIdFromClaims,
                    onboardingStatus: firestoreData.onboardingStatus || 'pending_onboarding',
                };
                setUserProfile(finalProfile);

                // Clean up previous company listener before creating a new one
                if (unsubscribeCompany) unsubscribeCompany();

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
                        setLoading(false); // Done loading once company data is resolved
                    }, (error) => {
                        console.error("Error fetching company data:", error);
                        setCompany(null);
                        setLoading(false);
                    });
                } else {
                    setCompany(null);
                    setLoading(false); // Done loading if there's no company
                }

            }, (error) => {
                console.error("Error fetching user profile:", error);
                setUserProfile(null);
                setCompany(null);
                setLoading(false);
            });
        } catch (err) {
            console.error("Error during auth state processing:", err);
            toast({ title: "Authentication Error", description: "Could not retrieve your user profile or permissions.", variant: "destructive" });
            setUser(null);
            setUserProfile(null);
            setCompany(null);
            setLoading(false);
        }
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
    };
  }, [toast]);

  const login = async (email_address: string, pass_word: string) => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    setLoading(true); // Set loading on login attempt
    try {
      await signInWithEmailAndPassword(auth, email_address, pass_word);
      // Redirection is now handled by the useEffect in the AppLayout
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
      setLoading(false); // Reset loading on failure
      return false;
    }
  };

  const signup = async (email_address: string, pass_word: string) => {
     if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    setLoading(true); // Set loading on signup attempt
    try {
      await createUserWithEmailAndPassword(auth, email_address, pass_word);
      // Redirection is now handled by the useEffect in the AppLayout
      // The client-side action will create the user document in Firestore.
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      setLoading(false); // Reset loading on failure
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
    <AuthContext.Provider value={{ user, userProfile, company, loading, login, signup, logout }}>
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
