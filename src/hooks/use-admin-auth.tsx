import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/promise-timeout";
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'TRIP_MANAGER' | 'ACCOUNTANT' | 'SUPPORT';

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
    console.log("[Auth] Checking admin");
    console.log(`[Auth] User ID: ${userId} | Email: ${email}`);

    try {
      const cleanEmail = (email || "").toLowerCase().trim();
      let adminObj: any = null;

      const knownAdminEmails = [
        "anshjee2024aspirant@gmail.com",
        "harshkumarjha563@gmail.com",
        "ansh.nomadik@gmail.com",
        "harsh.nomadik@gmail.com"
      ];

      if (cleanEmail && knownAdminEmails.includes(cleanEmail)) {
        console.log(`[Auth] Admin query finished — Super Admin verified: '${cleanEmail}'`);
        adminObj = {
          id: userId,
          email: cleanEmail,
          role: "SUPER_ADMIN",
          is_active: true
        };
      } else {
        console.log("[Auth] Querying admins table in database...");
        try {
          const { data, error } = await withTimeout(
            supabase
              .from("admins")
              .select("id, email, role, is_active")
              .or(`id.eq.${userId},email.ilike.${cleanEmail}`)
              .maybeSingle(),
            2000,
            { data: null, error: null }
          );
          console.log("[Auth] Admin query finished");
          console.log("[Auth] Query Result:", data);
          if (error) console.log("[Auth] Query Error:", error);
          if (data) adminObj = data;
        } catch (dbErr) {
          console.warn("[Auth] Database admin query failed/timed out:", dbErr);
        }
      }

      if (!adminObj || !adminObj.is_active) {
        console.warn("[Auth] Access denied — Admin record does not exist or is inactive for:", email);
        setAdmin(null);
        return null;
      }

      const authorizedRoles = ["SUPER_ADMIN", "ADMIN", "TRIP_MANAGER", "ACCOUNTANT", "SUPPORT"];
      if (!authorizedRoles.includes(adminObj.role)) {
        console.warn("[Auth] Access denied — Role not authorized:", adminObj.role);
        setAdmin(null);
        return null;
      }

      const adminData: AdminUser = {
        id: adminObj.id || userId,
        email: adminObj.email || cleanEmail,
        role: adminObj.role as AdminRole,
      };
      setAdmin(adminData);
      console.log("[Auth] Admin verified:", adminData.email, `(${adminData.role})`);
      return adminData;
    } catch (e) {
      console.error("[Auth] fetchAdminRole exception:", e);
      setAdmin(null);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: max 3 seconds wait
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth] Safety timeout reached (3s) — forcing loading=false");
        setLoading(false);
      }
    }, 3000);

    // Setup unload handler for non-persistent sessions (Remember Me option)
    const handleUnload = () => {
      const rememberMe = localStorage.getItem("admin_remember_me") !== "false";
      if (!rememberMe) {
        supabase.auth.signOut();
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("[Auth] Session found for:", session.user.email);
        console.log("[Auth] Checking admin");
        fetchAdminRole(session.user.id, session.user.email ?? "")
          .then((adminResult) => {
            if (!adminResult) {
              console.warn("[Auth] User is not authorized admin — signing out");
              supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setAdmin(null);
            }
          })
          .finally(() => {
            if (isMounted) setLoading(false);
          });
      } else {
        if (isMounted) setLoading(false);
      }
    }).catch((err) => {
      console.warn("[Auth] getSession error:", err);
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        console.log("[Auth] Auth state change event:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          console.log("[Auth] Login success for user:", newSession.user.email);
          console.log("[Auth] Checking admin");
          setTimeout(async () => {
            const adminResult = await fetchAdminRole(newSession.user.id, newSession.user.email ?? "");
            if (!adminResult) {
              console.warn("[Auth] Access denied — signing out unauthorized user");
              await supabase.auth.signOut();
              if (isMounted) {
                setSession(null);
                setUser(null);
                setAdmin(null);
              }
            } else {
              console.log("[Auth] Admin verified");
            }
            if (isMounted) setLoading(false);
          }, 0);
        } else {
          setAdmin(null);
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener("beforeunload", handleUnload);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] Starting signIn process for:", email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn("[Auth] signInWithPassword error:", error.message);
        return { error: error.message };
      }

      if (data.user) {
        console.log("[Auth] Login success for user ID:", data.user.id);
        console.log("[Auth] Checking admin");
        const adminResult = await fetchAdminRole(data.user.id, data.user.email ?? "");
        if (!adminResult) {
          await supabase.auth.signOut();
          return { error: "Access denied. You are not authorized or your admin account is inactive." };
        }
        console.log("[Auth] Admin verified");
      }
      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Exception during signIn:", err);
      return { error: err?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
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
