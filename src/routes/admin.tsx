import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  return (
    <AdminAuthProvider>
      <AdminLayoutGate />
      <Toaster position="top-right" richColors />
    </AdminAuthProvider>
  );
}

function AdminLayoutGate() {
  const { admin, loading, isAdmin } = useAdminAuth();
  const navigate = useNavigate();

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

  // Not authenticated or not an admin → show login
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
