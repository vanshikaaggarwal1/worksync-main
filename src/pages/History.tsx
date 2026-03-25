import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { History, ArrowRight } from "lucide-react";

export default function HistoryPage() {
  const { data: history } = useQuery({
    queryKey: ["all-history"],
    queryFn: async () => {
      const { data: historyData } = await supabase
        .from("task_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!historyData || historyData.length === 0) return [];
      const taskIds = [...new Set(historyData.map((h) => h.task_id))];
      const { data: tasks } = await supabase.from("tasks").select("id, title").in("id", taskIds);
      const taskMap = Object.fromEntries((tasks || []).map((t) => [t.id, t]));
      const userIds = [...new Set(historyData.map((h) => h.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return historyData.map((h) => ({ ...h, task: taskMap[h.task_id] || null, profile: profileMap[h.user_id] || null }));
    },
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">Audit Log</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">Immutable record of operations</p>
          </motion.div>
        </div>

        <div className="space-y-3 pb-10">
          {history?.map((h: any, i: number) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <div className="glass-card p-5 rounded-3xl flex items-center gap-5 border border-foreground/5 hover:border-foreground/10 transition-all group">
                <div className="h-14 w-14 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0 border border-foreground/5 group-hover:border-foreground/20 transition-all">
                  <History className="h-6 w-6 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-lg font-black text-foreground uppercase tracking-tight group-hover:text-red-500 transition-colors">{h.task?.title || "SYSTEM EVENT"}</p>
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-500">
                      {h.action.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      {h.old_value && <StatusBadge status={h.old_value} />}
                      {h.old_value && h.new_value && <ArrowRight className="h-3 w-3 text-foreground/20" />}
                      {h.new_value && <StatusBadge status={h.new_value} />}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-foreground uppercase tracking-widest">{h.profile?.full_name || h.profile?.email || "AUTO-BOT"}</p>
                  <p className="text-[10px] text-foreground/20 font-black uppercase tracking-[0.2em] font-mono mt-1">
                    {new Date(h.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          {(!history || history.length === 0) && (
            <div className="text-center py-32 bg-foreground/[0.02] rounded-3xl border border-dashed border-foreground/10">
              <div className="h-20 w-20 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6">
                <History className="h-10 w-10 text-foreground/10" />
              </div>
              <p className="text-sm font-black text-white/20 uppercase tracking-[0.4em]">Audit database empty</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
