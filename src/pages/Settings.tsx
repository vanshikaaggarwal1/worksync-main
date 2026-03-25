import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { User, Shield, Palette, Moon, Sun, Monitor, Save, KeyRound } from "lucide-react";

export default function SettingsPage() {
  const { profile, user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in max-w-4xl relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">Configuration</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">Manage your identity and environment</p>
          </motion.div>
        </div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass-card-dark p-8 rounded-3xl border border-foreground/5 space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-black shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black text-foreground uppercase tracking-tight">{profile?.full_name || "User"}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{profile?.email}</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/10 text-[9px] font-black uppercase tracking-widest text-foreground/70 border border-foreground/10">
                    <Shield className="h-3.5 w-3.5 text-red-500" /> {role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-foreground/5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Identity Handle</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-foreground/5 border-foreground/20 text-foreground h-14 rounded-2xl focus:ring-red-500" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Transmission Email</Label>
                <Input value={profile?.email || ""} disabled className="bg-foreground/5 border-foreground/10 text-foreground/40 h-14 rounded-2xl cursor-not-allowed" />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Apply Changes"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="glass-card-dark p-8 rounded-3xl border border-foreground/5 space-y-6">
            <div className="flex items-center gap-3 text-foreground">
              <KeyRound className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-black uppercase tracking-tight">Access Control</h2>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60">New Authentication Key</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Secure character string (min 6)"
                className="bg-foreground/5 border-foreground/20 text-foreground h-14 rounded-2xl focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={handlePasswordChange} 
                disabled={passwordLoading} 
                className="bg-foreground/5 hover:bg-foreground/10 text-foreground px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-foreground/10 transition-all active:scale-95 flex items-center gap-2"
              >
                <KeyRound className="h-4 w-4" /> {passwordLoading ? "Updating..." : "Recalibrate Key"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="glass-card-dark p-8 rounded-3xl border border-foreground/5 space-y-6">
            <div className="flex items-center gap-3 text-foreground">
              <Palette className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-black uppercase tracking-tight">Visual Interface</h2>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === "light" 
                    ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                    : "border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/5 text-foreground/40"
                }`}
              >
                <Sun className={`h-6 w-6 ${theme === "light" ? "text-red-500" : "text-foreground/20"}`} />
                <p className="text-[10px] font-black uppercase tracking-widest">Daylight</p>
              </button>
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === "dark" 
                    ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                    : "border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/5 text-foreground/40"
                }`}
              >
                <Moon className={`h-6 w-6 ${theme === "dark" ? "text-red-500" : "text-foreground/20"}`} />
                <p className="text-[10px] font-black uppercase tracking-widest">Nightfall</p>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
