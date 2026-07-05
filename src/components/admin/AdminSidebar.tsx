import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  MapPin,
  Package,
  CalendarDays,
  Hotel,
  Bus,
  Armchair,
  BedDouble,
  ClipboardList,
  MessageSquare,
  Users,
  TicketPercent,
  Star,
  FileText,
  Image,
  Bell,
  PanelTop,
  Settings,
  BarChart3,
  CreditCard,
  Activity,
  LogOut,
  Mountain,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Destinations", href: "/admin/destinations", icon: MapPin },
      { title: "Packages", href: "/admin/packages", icon: Package },
      { title: "Departures", href: "/admin/departures", icon: CalendarDays },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Hotels", href: "/admin/hotels", icon: Hotel },
      { title: "Buses", href: "/admin/buses", icon: Bus },
      { title: "Seats", href: "/admin/seats", icon: Armchair },
      { title: "Rooms", href: "/admin/rooms", icon: BedDouble },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Bookings", href: "/admin/bookings", icon: ClipboardList },
      { title: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
      { title: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Coupons", href: "/admin/coupons", icon: TicketPercent },
      { title: "Reviews", href: "/admin/reviews", icon: Star },
      { title: "Blog", href: "/admin/blog", icon: FileText },
      { title: "Banners", href: "/admin/banners", icon: PanelTop },
      { title: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Media Library", href: "/admin/media", icon: Image },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { title: "Payments", href: "/admin/payments", icon: CreditCard },
      { title: "Activity Log", href: "/admin/activity", icon: Activity },
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { admin, signOut } = useAdminAuth();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
            <Mountain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold font-poppins tracking-tight text-sidebar-foreground">Nomadik</span>
            <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest font-semibold">Admin</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-bold text-sidebar-foreground/40 px-3">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = currentPath === item.href || 
                    (item.href !== "/admin" && currentPath.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link to={item.href} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {admin?.email?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{admin?.email || "Admin"}</p>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase">{admin?.role?.replace("_", " ") || "Admin"}</p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-sidebar-foreground/50 hover:text-destructive transition group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
