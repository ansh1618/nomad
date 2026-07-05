import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { AdminRole } from "@/types/supabase";

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  admin: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminRole = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, email, role")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.warn("[Admin Auth] User is not an admin:", email);
        setAdmin(null);
        return null;
      }

      const adminData: AdminUser = {
        id: data.id,
        email: data.email,
        role: data.role as AdminRole,
      };
      setAdmin(adminData);
      return adminData;
    } catch {
      setAdmin(null);
      return null;
    }
  };

  useEffect(() => {
    let resolved = false;
    const resolve = () => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    };

    const timer = setTimeout(resolve, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAdminRole(session.user.id, session.user.email ?? "").finally(resolve);
      } else {
        resolve();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchAdminRole(newSession.user.id, newSession.user.email ?? "");
        } else {
          setAdmin(null);
        }
        resolve();
      }
    );

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const adminResult = await fetchAdminRole(data.user.id, data.user.email ?? "");
      if (!adminResult) {
        await supabase.auth.signOut();
        return { error: "Access denied. You are not an admin." };
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        admin,
        loading,
        isAdmin: !!admin,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
