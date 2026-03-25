import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons: Record<string, any> = {
  task_assigned: Send,
  task_submitted: Info,
  task_approved: CheckCircle,
  task_rejected: XCircle,
  task_completed: CheckCircle,
};

const typeColors: Record<string, string> = {
  task_assigned: "text-info bg-info/10",
  task_submitted: "text-warning bg-warning/10",
  task_approved: "text-success bg-success/10",
  task_rejected: "text-destructive bg-destructive/10",
  task_completed: "text-success bg-success/10",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">Intelligence</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">
              {unreadCount > 0 ? `${unreadCount} unread transmissions` : "System clear"}
            </p>
          </motion.div>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllReadMutation.mutate()} 
              className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all flex items-center gap-2 active:scale-95 shadow-lg"
            >
              <CheckCheck className="h-4 w-4" /> Acknowledge All
            </button>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {notifications?.map((n, i) => {
              const IconComponent = typeIcons[n.type] || Bell;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div
                    className={`glass-card p-5 rounded-3xl flex items-start gap-5 cursor-pointer transition-all border group ${
                      !n.is_read ? "border-red-500/30 bg-red-500/[0.03]" : "border-foreground/5 hover:border-foreground/20"
                    }`}
                    onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                  >
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-all ${
                      !n.is_read 
                        ? "bg-red-500 text-white border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                        : "bg-foreground/5 text-foreground/40 border-foreground/5 group-hover:bg-foreground/10 group-hover:text-foreground"
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className={`text-base tracking-tight uppercase ${!n.is_read ? "font-black text-foreground" : "font-bold text-foreground/60"}`}>{n.title}</p>
                        {!n.is_read && (
                          <span className="px-2 py-0.5 rounded bg-red-500 text-[8px] font-black text-white uppercase tracking-tighter shadow-[0_0_10px_rgba(239,68,68,0.5)]">New</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground/40 mt-1 leading-relaxed uppercase tracking-wide">{n.message}</p>
                      <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em] font-mono">
                        <span className="h-1 w-1 rounded-full bg-foreground/20" />
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {(!notifications || notifications.length === 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-foreground/[0.02] rounded-3xl border border-dashed border-foreground/10">
              <div className="h-20 w-20 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-foreground/10" />
              </div>
              <p className="text-sm font-black text-white/20 uppercase tracking-[0.4em]">Intelligence data empty</p>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
