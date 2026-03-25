import {
  LayoutDashboard,
  GitBranch,
  CheckSquare,
  Users,
  Bell,
  FileText,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Workflows", url: "/workflows", icon: GitBranch },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

const managerItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Workflows", url: "/workflows", icon: GitBranch },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const employeeItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, profile, signOut } = useAuth();

  const items =
    role === "admin" ? adminItems : role === "manager" ? managerItems : employeeItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-foreground/5 bg-transparent">
      <SidebarContent className="glass-panel backdrop-blur-[40px]">
        <SidebarGroup>
          <div className="flex items-center gap-3 px-3 py-6">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-black tracking-tight text-foreground drop-shadow-sm">
                WorkSync
              </span>
            )}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 px-4 mb-2 font-inter">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {items.map((item, i) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 rounded-xl transition-all duration-300 text-foreground/60 hover:text-foreground hover:bg-foreground/5 group"
                      activeClassName="bg-foreground/10 text-foreground font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    >
                      <item.icon className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                      {!collapsed && <span className="text-sm tracking-tight">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="glass-panel backdrop-blur-[40px] border-t border-foreground/5">
        <div className="px-3 py-5">
          {!collapsed && (
            <div className="mb-4 flex items-center gap-3 bg-foreground/5 p-2 rounded-2xl border border-foreground/5 shadow-inner">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-black shadow-[0_0_15px_rgba(239,68,68,0.3)] shrink-0">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate drop-shadow-sm">
                  {profile?.full_name || profile?.email}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80">
                  {role}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 text-xs font-bold text-foreground/40 hover:text-red-500 transition-all w-full py-2.5 rounded-xl hover:bg-red-500/10 px-3 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>

  );
}
