import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";

export default function Dashboard() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20">Securing Session...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {role === "admin" && <AdminDashboard />}
      {role === "manager" && <ManagerDashboard />}
      {role === "employee" && <EmployeeDashboard />}
      {!role && (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <span className="text-red-500 text-4xl">!</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Access Denied</h2>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-widest">Your account has no assigned role. Contact Admin.</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
