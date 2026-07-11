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
        .select("id, email, role, is_active")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.warn("[Admin Auth] Access denied. User is not registered in the admins table:", email, error);
        setAdmin(null);
        return null;
      }

      if (!data.is_active) {
        console.warn("[Admin Auth] Access denied. Admin account is inactive:", email);
        setAdmin(null);
        return null;
      }

      const authorizedRoles = ["SUPER_ADMIN", "ADMIN", "TRIP_MANAGER", "ACCOUNTANT", "SUPPORT"];
      if (!authorizedRoles.includes(data.role)) {
        console.warn("[Admin Auth] Access denied. Role is not authorized:", data.role);
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
    } catch (e) {
      console.error("[Admin Auth] fetchAdminRole query exception:", e);
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

    // Setup unload handler for non-persistent sessions (Remember Me option)
    const handleUnload = () => {
      const rememberMe = localStorage.getItem("admin_remember_me") !== "false";
      if (!rememberMe) {
        supabase.auth.signOut();
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAdminRole(session.user.id, session.user.email ?? "")
          .then((adminResult) => {
            if (!adminResult) {
              // Sign out immediately if not authorized admin
              supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setAdmin(null);
            }
          })
          .finally(resolve);
      } else {
        resolve();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const adminResult = await fetchAdminRole(newSession.user.id, newSession.user.email ?? "");
          if (!adminResult) {
            // Sign out immediately if not authorized admin
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setAdmin(null);
          }
        } else {
          setAdmin(null);
        }
        resolve();
      }
    );

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", handleUnload);
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
        return { error: "Access denied. You are not authorized or your admin account is inactive." };
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("admin_remember_me");
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
