import { Moon, Sun, Bell, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "User Management",
  "/workflows": "Workflows",
  "/tasks": "Tasks",
  "/reports": "Reports",
  "/history": "History",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/documents": "Documents",
};

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const location = useLocation();

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const currentRoute = routeNames[location.pathname] || "WorkSync";

  return (
    <header className="h-16 flex items-center justify-between border-b border-foreground/10 px-4 sm:px-6 backdrop-blur-xl bg-glass shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground/50 hover:text-foreground transition-colors" />
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors font-bold uppercase tracking-wider">
            Home
          </Link>
          <span className="text-foreground/30 font-bold">/</span>
          <span className="font-black text-foreground uppercase tracking-tight truncate max-w-[100px] sm:max-w-none">{currentRoute}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all"
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          ) : null}
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="ml-3 h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-black shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}

