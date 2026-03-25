import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, Clock, Send, Trophy, ArrowRight, Calendar, AlertTriangle, Activity } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

function getDaysLeft(deadline: string | null): { text: string; color: string; urgent: boolean } {
  if (!deadline) return { text: "No deadline", color: "text-foreground/40", urgent: false };
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: "text-red-500", urgent: true };
  if (diff === 0) return { text: "Due today", color: "text-red-500", urgent: true };
  if (diff <= 3) return { text: `${diff}d left`, color: "text-orange-500", urgent: true };
  if (diff <= 7) return { text: `${diff}d left`, color: "text-yellow-500", urgent: false };
  return { text: `${diff}d left`, color: "text-green-500", urgent: false };
}

const statusColors: Record<string, string> = {
  pending: "#94a3b8", in_progress: "#3b82f6", submitted: "#f97316",
  approved: "#22c55e", completed: "#22c55e", rejected: "#ef4444",
};

export function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["employee-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("status").eq("assigned_to", user!.id);
      const tasks = data || [];
      return {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        submitted: tasks.filter((t) => t.status === "submitted").length,
        completed: tasks.filter((t) => t.status === "completed" || t.status === "approved").length,
      };
    },
    enabled: !!user,
  });

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, deadline, created_at")
        .eq("assigned_to", user!.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: activeTasks } = useQuery({
    queryKey: ["employee-active-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, deadline, created_at")
        .eq("assigned_to", user!.id)
        .in("status", ["pending", "in_progress", "submitted"])
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: upcomingDeadlines } = useQuery({
    queryKey: ["employee-deadlines", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, deadline")
        .eq("assigned_to", user!.id)
        .not("deadline", "is", null)
        .in("status", ["pending", "in_progress", "submitted"])
        .order("deadline", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["employee-activity", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("task_history")
        .select("id, action, old_value, new_value, created_at, task_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  const statCards = [
    { label: "Assigned Tasks", value: stats?.total || 0, icon: CheckSquare, accent: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "In Progress", value: (stats?.pending || 0) + (stats?.inProgress || 0), icon: Clock, accent: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "Submitted", value: stats?.submitted || 0, icon: Send, accent: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Completed", value: stats?.completed || 0, icon: Trophy, accent: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  ];

  const totalTasks = stats?.total || 0;
  const statusSegments = totalTasks > 0 ? [
    { label: "Pending", count: stats?.pending || 0, color: "#94a3b8" },
    { label: "In Progress", count: stats?.inProgress || 0, color: "#3b82f6" },
    { label: "Submitted", count: stats?.submitted || 0, color: "#f97316" },
    { label: "Completed", count: stats?.completed || 0, color: "#22c55e" },
  ] : [];

  const getProgressPercent = (status: string) => {
    const map: Record<string, number> = { pending: 10, in_progress: 45, submitted: 75, approved: 90, completed: 100, rejected: 50 };
    return map[status] || 0;
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      {/* Hero Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground drop-shadow-md">Hey, {firstName} 👋</h1>
          <p className="text-sm font-bold text-foreground/50 mt-1 uppercase tracking-widest relative z-10">
            {(stats?.pending || 0) + (stats?.inProgress || 0)} tasks need your attention
          </p>
        </motion.div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} variants={cardVariant} initial="hidden" animate="visible" custom={i}>
            <div className="glass-card card-3d h-full p-4 sm:p-6 rounded-3xl flex flex-col items-center text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg border border-foreground/5" style={{ background: stat.bg }}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: stat.accent }} />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums">{stat.value}</p>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status Distribution */}
      {totalTasks > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="glass-card-dark rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-foreground/5 bg-glass">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">My Task Distribution</h2>
            </div>
            <div className="p-6">
              <div className="h-4 rounded-full overflow-hidden flex bg-foreground/5">
                {statusSegments.map((seg) => (
                  <div key={seg.label} className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full" style={{ width: `${(seg.count / totalTasks) * 100}%`, background: seg.color }} title={`${seg.label}: ${seg.count}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
                {statusSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      {seg.label} <span className="text-foreground/80">{seg.count}</span> <span className="text-foreground/30">({Math.round((seg.count / totalTasks) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Task Progress Cards */}
      {activeTasks && activeTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="glass-card-dark rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-foreground/5 bg-glass flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">My Active Tasks</h2>
              <button onClick={() => navigate("/tasks")} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors">View all →</button>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map((task, i) => {
                const progress = getProgressPercent(task.status);
                const dl = getDaysLeft(task.deadline);
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                    className="glass-card rounded-2xl p-5 border border-foreground/5 hover:border-foreground/10 transition-all cursor-pointer group" onClick={() => navigate("/tasks")}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-black text-foreground group-hover:text-red-500 transition-colors truncate flex-1 mr-2">{task.title}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Progress</span>
                        <span className="text-xs font-black text-foreground/60 tabular-nums">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-foreground/5 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: statusColors[task.status] || "#3b82f6" }}
                          initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-foreground/30" />
                        <span className="text-[10px] font-bold text-foreground/40">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${dl.color}`}>{dl.urgent && <AlertTriangle className="h-3 w-3 inline mr-1" />}{dl.text}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 3-Column Grid: My Tasks + Deadlines + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Tasks */}
        <motion.div className="lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="glass-card-dark rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl h-full">
            <div className="px-6 py-5 border-b border-foreground/5 bg-glass flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">All My Tasks</h2>
              <button onClick={() => navigate("/tasks")} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-2 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="p-4">
              {myTasks && myTasks.length > 0 ? (
                <div className="space-y-1">
                  {myTasks.map((task, i) => (
                    <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-foreground/5 transition-all cursor-pointer border border-transparent hover:border-foreground/5 group" onClick={() => navigate("/tasks")}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-red-500 transition-colors truncate">{task.title}</p>
                        <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mt-0.5">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-foreground/5"><Trophy className="h-8 w-8 text-foreground/10" /></div>
                  <p className="text-sm font-bold text-foreground/30 uppercase tracking-widest">No tasks assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div className="lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="glass-card-dark rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl h-full">
            <div className="px-6 py-5 border-b border-foreground/5 bg-glass flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">My Deadlines</h2>
              <Calendar className="h-4 w-4 text-foreground/30" />
            </div>
            <div className="p-4">
              {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                <div className="space-y-1">
                  {upcomingDeadlines.map((task, i) => {
                    const dl = getDaysLeft(task.deadline);
                    return (
                      <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-foreground/5 transition-all cursor-pointer border border-transparent hover:border-foreground/5 group" onClick={() => navigate("/tasks")}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground group-hover:text-red-500 transition-colors truncate">{task.title}</p>
                          <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">{task.deadline ? new Date(task.deadline).toLocaleDateString() : ""}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${dl.color}`}>{dl.urgent && "⚠ "}{dl.text}</span>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-foreground/5"><Calendar className="h-8 w-8 text-foreground/10" /></div>
                  <p className="text-sm font-bold text-foreground/30 uppercase tracking-widest">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div className="lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="glass-card-dark rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl h-full">
            <div className="px-6 py-5 border-b border-foreground/5 bg-glass flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">My Activity</h2>
              <button onClick={() => navigate("/history")} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors">Full log →</button>
            </div>
            <div className="p-4">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[19px] top-4 bottom-4 w-px bg-foreground/10" />
                  <div className="space-y-1">
                    {recentActivity.map((entry, i) => (
                      <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
                        className="flex items-start gap-4 py-3 px-4 rounded-2xl hover:bg-foreground/5 transition-all relative">
                        <div className="h-[10px] w-[10px] rounded-full bg-red-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.4)] relative z-10" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground">
                            {entry.action}
                            {entry.new_value && <span className="text-foreground/50"> → {entry.new_value}</span>}
                          </p>
                          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider mt-0.5">
                            {new Date(entry.created_at).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-foreground/5"><Activity className="h-8 w-8 text-foreground/10" /></div>
                  <p className="text-sm font-bold text-foreground/30 uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
