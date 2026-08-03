import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { GoNomadikLoadingScreen } from "@/components/site/GoNomadikLoadingScreen";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  return (
    <AdminAuthProvider>
      <AdminLayoutGate />
    </AdminAuthProvider>
  );
}


function AdminLayoutGate() {
  const { admin, loading, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Protect routes from unauthenticated access
  useEffect(() => {
    if (!loading) {
      if (!isAdmin && currentPath !== "/admin/login") {
        console.warn("[Auth] Unauthenticated user accessing admin path -> Redirecting to /admin/login");
        navigate({ to: "/admin/login" });
      } else if (isAdmin && currentPath === "/admin/login") {
        console.log("[Auth] Admin verified -> Redirecting to /admin");
        navigate({ to: "/admin" });
      }
    }
  }, [loading, isAdmin, currentPath, navigate]);

  // Show loading screen while checking auth
  if (loading) {
    return <GoNomadikLoadingScreen fullPage={true} statusText="Loading admin panel" />;
  }

  // Not authenticated or not an admin → show login page outlet
  if (!isAdmin) {
    return <Outlet />;
  }

  // Authenticated admin → show full layout
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <AdminHeader />
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
