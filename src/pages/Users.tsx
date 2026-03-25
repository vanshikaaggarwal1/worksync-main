import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Users, Shield, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  manager: "bg-warning/10 text-warning",
  employee: "bg-info/10 text-info",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("employee");

  const { data: users } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles || []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role || "employee",
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Role updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.user && role !== "employee") {
        await new Promise((r) => setTimeout(r, 1000));
        await supabase.from("user_roles").delete().eq("user_id", data.user.id);
        await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("User created");
      setOpen(false);
      setEmail(""); setPassword(""); setFullName(""); setRole("employee");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">User Management</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">{users?.length || 0} crew members</p>
          </motion.div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2 active:scale-95">
                <Plus className="h-5 w-5" /> Add User
              </button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto bg-background/90 backdrop-blur-2xl border-l border-foreground/10 text-foreground">
              <SheetHeader>
                <SheetTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Create New User</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-10">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 h-14 rounded-2xl focus:ring-red-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 h-14 rounded-2xl focus:ring-red-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 h-14 rounded-2xl focus:ring-red-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background/95 border-foreground/10 text-foreground">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button onClick={() => createUserMutation.mutate()} disabled={createUserMutation.isPending} className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 mt-4">
                  Create User
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-card card-3d p-6 rounded-3xl relative overflow-hidden group border border-foreground/5 hover:border-foreground/20 transition-all">
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-lg font-black shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-foreground group-hover:text-red-500 transition-colors uppercase tracking-tight">{u.full_name || "—"}</p>
                    <p className="text-[10px] font-bold text-foreground/30 truncate uppercase tracking-widest">{u.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/5 text-[9px] font-black uppercase tracking-widest text-foreground/60 border border-foreground/5 backdrop-blur-md">
                        <Shield className="h-3 w-3 text-red-500" /> {u.role}
                      </span>
                      {u.id === currentUser?.id && (
                        <span className="text-[9px] font-black text-foreground px-2 py-0.5 rounded bg-red-500/20 uppercase tracking-widest border border-red-500/10">You</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-foreground/5 flex items-center justify-between">
                  <p className="text-[9px] text-foreground/20 font-black uppercase tracking-[0.2em]">
                    Crew since {new Date(u.created_at).toLocaleDateString()}
                  </p>
                  <Select
                    value={u.role}
                    onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, newRole: v as AppRole })}
                    disabled={u.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-28 h-8 text-[9px] font-black uppercase tracking-widest bg-foreground/5 border-foreground/10 text-foreground rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 border-foreground/10 text-foreground">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {(!users || users.length === 0) && (
          <div className="text-center py-20 bg-foreground/[0.02] rounded-3xl border border-dashed border-foreground/10">
            <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-foreground/10" />
            </div>
            <p className="text-sm font-black text-foreground/20 uppercase tracking-[0.3em]">No crew records initialized</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
