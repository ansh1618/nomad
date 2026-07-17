import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  dob?: string | null;
  city?: string | null;
  emergency_contact?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  city?: string;
  emergency_contact?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;

  // Methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ needsVerification: boolean }>;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Helper — fetch profile from `profiles` table (with users fallback)
// ─────────────────────────────────────────────────────────────

async function fetchProfileFromDB(userId: string): Promise<UserProfile | null> {
  // Primary: profiles table (v17 migration)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!error && profile) return profile as UserProfile;

  // Fallback: legacy users table
  const { data: legacyUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return (legacyUser as UserProfile) ?? null;
}

// ─────────────────────────────────────────────────────────────
// Guest booking merge — runs after SIGNED_IN
// ─────────────────────────────────────────────────────────────

async function mergeGuestBookings(email: string, userId: string): Promise<void> {
  try {
    const { data, error } = await supabase.rpc("merge_guest_bookings", {
      p_email: email,
      p_user_id: userId,
    });
    if (!error && data && data > 0) {
      console.log(`[Auth] Merged ${data} guest booking(s) for ${email}`);
      toast.success(`${data} previous booking${data > 1 ? "s" : ""} linked to your account!`);
    }
  } catch (err) {
    console.warn("[Auth] Guest merge failed (non-fatal):", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch profile ──────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfileFromDB(user.id);
    if (p) setProfile(p);
  }, [user]);

  // ── Bootstrap session ──────────────────────────────────────
  useEffect(() => {
    let didResolve = false;

    const resolve = () => {
      if (!didResolve) {
        didResolve = true;
        setLoading(false);
      }
    };

    // Safety valve: never stay loading forever
    const safety = setTimeout(() => {
      console.warn("[Auth] Safety timeout — forcing loading=false");
      resolve();
    }, 6000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileFromDB(session.user.id)
          .then((p) => { if (p) setProfile(p); })
          .finally(resolve);
      } else {
        resolve();
      }
    }).catch(() => resolve());

    // ── Auth state listener ──────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[Auth] Event:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const p = await fetchProfileFromDB(newSession.user.id);
          if (p) setProfile(p);
        } else {
          setProfile(null);
        }

        resolve(); // in case initial getSession didn't

        // Handle specific events
        if (event === "SIGNED_IN" && newSession?.user) {
          const u = newSession.user;
          const email = u.email ?? "";
          // Merge any guest bookings made before login
          if (email) await mergeGuestBookings(email, u.id);
        }

        if (event === "SIGNED_OUT") {
          toast.info("Logged out successfully.");
        }

        if (event === "PASSWORD_RECOVERY") {
          // handled in /auth/callback route
        }

        if (event === "TOKEN_REFRESHED") {
          console.log("[Auth] Token refreshed silently");
        }

        if (event === "USER_UPDATED" && newSession?.user) {
          // Re-sync avatar from OAuth provider if available
          const meta = newSession.user.user_metadata;
          const avatarFromOAuth = meta?.avatar_url || meta?.picture;
          if (avatarFromOAuth) {
            await supabase
              .from("profiles")
              .update({ avatar_url: avatarFromOAuth, updated_at: new Date().toISOString() })
              .eq("id", newSession.user.id);
          }
        }
      }
    );

    return () => {
      clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, []);

  // ── Sign In ────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Please verify your email before logging in. Check your inbox.");
      }
      throw new Error(error.message);
    }
    // SIGNED_IN event handles toast + profile fetch
  }, []);

  // ── Sign Up ────────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ): Promise<{ needsVerification: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("An account with this email already exists. Please log in.");
      }
      throw new Error(error.message);
    }

    // If user exists but email not confirmed, Supabase returns user with no session
    const needsVerification = !data.session;

    // Sync profile manually in case trigger hasn't run yet
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        phone,
        email,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      // Also sync legacy users table
      await supabase.from("users").upsert({
        id: data.user.id,
        full_name: fullName,
        phone,
        email,
      }, { onConflict: "id" });
    }

    return { needsVerification };
  }, []);

  // ── Google OAuth ───────────────────────────────────────────
  const signInWithGoogle = useCallback(async (returnTo?: string) => {
    const redirectTo = returnTo
      ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) throw new Error(error.message);
    // Browser redirects — no code after this
  }, []);

  // ── Sign Out ───────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  // ── Reset Password (send email) ────────────────────────────
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) throw new Error(error.message);
  }, []);

  // ── Update Password (after reset link clicked) ─────────────
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  // ── Update Profile ─────────────────────────────────────────
  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("profiles")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    // Also sync to legacy users table
    const legacyPayload: Record<string, unknown> = {};
    if (payload.full_name !== undefined) legacyPayload.full_name = payload.full_name;
    if (payload.phone !== undefined) legacyPayload.phone = payload.phone;
    if (payload.gender !== undefined) legacyPayload.gender = payload.gender;
    if (payload.dob !== undefined) legacyPayload.dob = payload.dob;
    if (payload.city !== undefined) legacyPayload.city = payload.city;
    if (payload.emergency_contact !== undefined) legacyPayload.emergency_contact = payload.emergency_contact;

    if (Object.keys(legacyPayload).length > 0) {
      await supabase
        .from("users")
        .update({ ...legacyPayload, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    await refreshProfile();
  }, [user, refreshProfile]);

  // ── Computed ───────────────────────────────────────────────
  const isAuthenticated = !!user;
  const isEmailVerified = user ? !!user.email_confirmed_at : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAuthenticated,
        isEmailVerified,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
