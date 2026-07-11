import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
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
        navigate({ to: "/admin/login" });
      } else if (isAdmin && currentPath === "/admin/login") {
        navigate({ to: "/admin" });
      }
    }
  }, [loading, isAdmin, currentPath, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-poppins">Loading admin panel...</p>
        </div>
      </div>
    );
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
