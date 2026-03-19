"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Tenant } from "@/lib/types";

interface AuthContextType {
  user: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    dealershipName: string;
    dealershipNameAr?: string;
    phone?: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  /** Fetch profile + tenant for a given auth user id */
  const loadUserData = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      setUser(profile as Profile);
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single();
      if (tenantData) setTenant(tenantData as Tenant);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          await loadUserData(authUser.id);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        setTenant(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithEmail = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    router.push("/dashboard");
    return { error: null };
  };

  const signUp = async (params: {
    email: string;
    password: string;
    fullName: string;
    dealershipName: string;
    dealershipNameAr?: string;
    phone?: string;
  }): Promise<{ error: string | null }> => {
    // Generate a URL-safe slug from the dealership name
    const slug = params.dealershipName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Pass ALL dealership info in metadata so the DB trigger
    // atomically creates both tenant + profile in a single transaction.
    // This avoids the circular dependency between profiles ↔ tenants.
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          role: "admin",
          dealership_name: params.dealershipName,
          dealership_name_ar: params.dealershipNameAr || "",
          slug: `${slug}-${Date.now().toString(36)}`,
          phone: params.phone || "",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) return { error: signUpError.message };
    if (!authData.user) return { error: "Signup failed" };

    // If email confirmation is disabled, user is already signed in.
    // The trigger has already created tenant + profile.
    if (authData.session) {
      await loadUserData(authData.user.id);
      router.push("/dashboard");
    }
    // If email confirmation is enabled, user needs to verify email first.
    // We return success and the UI will show a confirmation message.
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTenant(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        loading,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
