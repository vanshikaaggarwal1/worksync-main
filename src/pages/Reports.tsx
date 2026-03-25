import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { CheckSquare, Clock, AlertTriangle, TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  in_progress: "#3b82f6",
  submitted: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
  completed: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export default function ReportsPage() {
  const { data: taskStats } = useQuery({
    queryKey: ["report-task-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("status");
      const tasks = data || [];
      const statusCounts = tasks.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(statusCounts).map(([name, value]) => ({
        name: STATUS_LABELS[name] || name,
        value,
        color: STATUS_COLORS[name] || "#94a3b8",
      }));
    },
  });

  const { data: workflowStats } = useQuery({
    queryKey: ["report-workflow-stats"],
    queryFn: async () => {
      const { data: workflows } = await supabase.from("workflows").select("id, name");
      const { data: tasks } = await supabase.from("tasks").select("workflow_id, status");

      return (workflows || []).map((wf) => {
        const wfTasks = (tasks || []).filter((t) => t.workflow_id === wf.id);
        return {
          name: wf.name.length > 12 ? wf.name.slice(0, 12) + "…" : wf.name,
          total: wfTasks.length,
          completed: wfTasks.filter((t) => t.status === "completed").length,
          pending: wfTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
        };
      });
    },
  });

  const { data: summaryStats } = useQuery({
    queryKey: ["report-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("status, created_at");
      const tasks = data || [];
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "completed").length;
      const overdue = tasks.filter((t) => t.status === "rejected").length;
      const active = tasks.filter((t) => ["in_progress", "submitted"].includes(t.status)).length;
      return { total, completed, overdue, active, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
    },
  });

  const summaryCards = [
    { label: "Total Tasks", value: summaryStats?.total || 0, icon: CheckSquare, accent: "text-primary" },
    { label: "Completion Rate", value: `${summaryStats?.rate || 0}%`, icon: TrendingUp, accent: "text-success" },
    { label: "Active Now", value: summaryStats?.active || 0, icon: Clock, accent: "text-warning" },
    { label: "Rejected", value: summaryStats?.overdue || 0, icon: AlertTriangle, accent: "text-destructive" },
  ];  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">Analytics & Intelligence</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">Operational performance metrics</p>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-card card-3d p-6 rounded-3xl border border-foreground/5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 truncate">{card.label}</p>
                    <p className="text-3xl font-black text-foreground mt-1 tabular-nums group-hover:text-red-500 transition-colors">{card.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-foreground/5 transition-all group-hover:scale-110 group-hover:border-red-500/20 shadow-lg`}>
                    <card.icon className={`h-6 w-6 ${card.accent === 'text-primary' ? 'text-red-500' : card.accent === 'text-success' ? 'text-green-500' : card.accent === 'text-warning' ? 'text-orange-500' : 'text-red-600'}`} />
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-red-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-card-dark rounded-3xl border border-foreground/10 p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 mb-8">Task Allocation status</h3>
              {taskStats && taskStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStats.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        backdropFilter: "blur(20px)",
                        color: "var(--foreground)",
                        fontSize: "12px",
                        fontWeight: "900"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-foreground/10">No operational data</div>
              )}
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="glass-card-dark rounded-3xl border border-foreground/10 p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 mb-8">System Output Efficiency</h3>
              {workflowStats && workflowStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowStats} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground-muted)" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: "900" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: "900" }} />
                    <Tooltip
                      cursor={{ fill: 'var(--foreground-muted)', opacity: 0.05 }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        backdropFilter: "blur(20px)",
                        color: "var(--foreground)",
                        fontSize: "12px",
                        fontWeight: "900"
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }} />
                    <Bar dataKey="total" fill="#64748b" radius={[4, 4, 0, 0]} name="Volume" />
                    <Bar dataKey="completed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Done" />
                    <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Active" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-foreground/10">No execution data</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
