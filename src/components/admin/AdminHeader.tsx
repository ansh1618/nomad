import { useAdminAuth } from "@/hooks/use-admin-auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Moon, Sun, Search, LogOut, User, Settings } from "lucide-react";
import { useState } from "react";

export function AdminHeader() {
  const { admin, signOut } = useAdminAuth();
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search destinations, bookings, customers..."
            className="w-full h-9 pl-9 pr-4 bg-muted/50 border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary/30 focus:bg-background transition placeholder:text-muted-foreground/60"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDarkMode}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Admin Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 hover:bg-muted/50 rounded-lg px-2 py-1.5 transition">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {admin?.email?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none">{admin?.email || "Admin"}</span>
                <Badge variant="secondary" className="mt-1 h-4 text-[9px] font-bold px-1.5 w-fit">
                  {admin?.role?.replace("_", " ") || "ADMIN"}
                </Badge>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
