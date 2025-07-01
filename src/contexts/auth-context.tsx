
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
      
      setCompany(null); // Reset company on auth change

      if (currentUser) {
        await ensureUserDocumentAction({ 
            uid: currentUser.uid, 
            email: currentUser.email! 
        });

        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);

        unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
          if (unsubscribeCompany) unsubscribeCompany(); // Unsub from old company listener if profile changes

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile;
            setUserProfile(profileData);

            if (profileData.companyId) {
              const companyDocRef = doc(db, "companies", profileData.companyId);
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
              }, (error) => {
                console.error("Error fetching company data:", error);
                setCompany(null);
              });
            } else {
              setCompany(null);
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false); // Set loading to false after profile is processed
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            setCompany(null);
            setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setUserProfile(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCompany) unsubscribeCompany();
    };
  }, []);

  const login = async (email_address: string, pass_word: string) => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    try {
      await signInWithEmailAndPassword(auth, email_address, pass_word);
      // Redirection is now handled by the useEffect in the AppLayout
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
      return false;
    }
  };

  const signup = async (email_address: string, pass_word: string) => {
     if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return false;
    }
    try {
      await createUserWithEmailAndPassword(auth, email_address, pass_word);
      // Redirection is now handled by the useEffect in the AppLayout
      // The client-side action will create the user document in Firestore.
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      return false;
    }
  };

  const logout = async () => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    try {
      await signOut(auth);
      setCompany(null);
      router.push("/login");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
    }
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
