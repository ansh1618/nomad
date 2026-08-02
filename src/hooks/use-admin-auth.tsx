import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
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
    try {
      const cleanEmail = (email || "").toLowerCase().trim();
      let adminObj: any = null;

      // 1. Try by ID
      const { data: byId } = await supabase
        .from("admins")
        .select("id, email, role, is_active")
        .eq("id", userId)
        .maybeSingle();

      if (byId) adminObj = byId;

      // 2. Try by email if ID query returned null
      if (!adminObj && cleanEmail) {
        const { data: byEmail } = await supabase
          .from("admins")
          .select("id, email, role, is_active")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (byEmail) adminObj = byEmail;
      }

      // 3. Fallback verification for verified admin accounts
      const knownAdminEmails = [
        "anshjee2024aspirant@gmail.com",
        "harshkumarjha563@gmail.com",
        "ansh.nomadik@gmail.com",
        "harsh.nomadik@gmail.com"
      ];

      if (!adminObj && cleanEmail && knownAdminEmails.includes(cleanEmail)) {
        console.log(`[Admin Auth] Verified admin email '${cleanEmail}' granted SUPER_ADMIN access`);
        adminObj = {
          id: userId,
          email: cleanEmail,
          role: "SUPER_ADMIN",
          is_active: true
        };
      }

      if (!adminObj || !adminObj.is_active) {
        console.warn("[Admin Auth] Access denied. User is not registered in admins table:", email);
        setAdmin(null);
        return null;
      }

      const authorizedRoles = ["SUPER_ADMIN", "ADMIN", "TRIP_MANAGER", "ACCOUNTANT", "SUPPORT"];
      if (!authorizedRoles.includes(adminObj.role)) {
        console.warn("[Admin Auth] Access denied. Role is not authorized:", adminObj.role);
        setAdmin(null);
        return null;
      }

      const adminData: AdminUser = {
        id: adminObj.id || userId,
        email: adminObj.email || cleanEmail,
        role: adminObj.role as AdminRole,
      };
      setAdmin(adminData);
      console.log("[Auth] Admin verified:", adminData.email);
      return adminData;
    } catch (e) {
      console.error("[Admin Auth] fetchAdminRole query exception:", e);
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
      async (event, newSession) => {
        if (!isMounted) return;
        console.log("[Auth] Auth state change event:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          console.log("[Auth] Login success for user:", newSession.user.email);
          console.log("[Auth] Checking admin");
          const adminResult = await fetchAdminRole(newSession.user.id, newSession.user.email ?? "");
          if (!adminResult) {
            console.warn("[Auth] Access denied — signing out unauthorized user");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setAdmin(null);
          } else {
            console.log("[Auth] Admin verified");
          }
        } else {
          setAdmin(null);
        }
        if (isMounted) setLoading(false);
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
