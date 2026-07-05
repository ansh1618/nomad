import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url?: string;
  gender?: string;
  dob?: string;
  city?: string;
  emergency_contact?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  useEffect(() => {
    let didResolve = false;

    const resolveLoading = () => {
      if (!didResolve) {
        didResolve = true;
        setLoading(false);
        console.log("[Nomadik Auth] Loading resolved");
      }
    };

    // Safety timeout: always exit loading after 5 seconds
    const safetyTimer = setTimeout(() => {
      if (!didResolve) {
        console.warn("[Nomadik Auth] Safety timeout hit (5s). Forcing loading=false.");
        resolveLoading();
      }
    }, 5000);

    // 1. Get initial session
    console.log("[Nomadik Auth] Initializing session...");
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log("[Nomadik Auth] getSession() succeeded. User:", session?.user?.email ?? "none");
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => resolveLoading());
        } else {
          resolveLoading();
        }
      })
      .catch((err) => {
        console.error("[Nomadik Auth] getSession() failed:", err);
        resolveLoading();
      });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[Nomadik Auth] Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        resolveLoading();

        if (event === "SIGNED_IN") {
          toast.success("Welcome back to Nomadik!");
        } else if (event === "SIGNED_OUT") {
          toast.info("Logged out successfully.");
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const isEmailVerified = user ? !!user.email_confirmed_at : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isEmailVerified,
        refreshProfile,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
