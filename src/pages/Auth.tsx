import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Mail, KeyRound, User, Sparkles, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AuthView = "login" | "signup" | "forgot";

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully");
        navigate("/dashboard");
      } else if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success("Password reset link sent to your email");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-[#0a0a0a]"
      style={{ backgroundImage: "url('/background.jpeg')" }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Decorative gradient meshes */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-white/20 blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-white/10 blur-[120px]"
        />
      </div>

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 p-2 rounded-xl backdrop-blur-md bg-black/20 border border-white/10 text-white/80 hover:text-white hover:bg-black/40 transition-all z-20 flex items-center gap-1.5 text-sm font-medium shadow-2xl"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-20"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: view === "forgot" ? 20 : 0, y: view === "forgot" ? 0 : 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: view === "forgot" ? -20 : 0, y: view === "forgot" ? 0 : -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-white/20 shadow-2xl relative overflow-hidden border-t-white/40"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 20px 80px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.05)"
              }}
            >
              {view !== "forgot" && (
                <CardHeader className="pb-4 pt-6 px-6">
                  {/* Logo block */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-2 text-white">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, #ef4444, #dc2626)",
                          boxShadow: "0 4px 14px rgba(239,68,68,0.4)"
                        }}
                      >
                        <span className="font-bold text-sm">W</span>
                      </div>
                      <span className="text-xl font-bold tracking-tight">WorkSync</span>
                    </div>
                    <p className="text-sm text-white/70 font-medium">
                      {view === "login" ? "Welcome back — sign in" : "Create your account to get started"}
                    </p>
                  </div>

                  {/* Tabs toggle */}
                  <div className="flex p-1 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                        view === "login"
                          ? "bg-white text-black shadow-lg"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("signup")}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                        view === "signup"
                          ? "bg-white text-black shadow-lg"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </CardHeader>
              )}

              <CardContent className={view === "forgot" ? "p-8" : "px-6 pb-8"}>
                {view === "forgot" && resetSent ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                      <CheckCircle className="h-8 w-8 text-[#22c55e]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Check Your Email</h3>
                    <p className="text-sm text-white/70 mb-6">
                      We sent a password reset link to <br/><span className="font-semibold text-white">{email}</span>
                    </p>
                    <Button
                      variant="outline"
                      className="w-full h-11 bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 backdrop-blur-sm"
                      onClick={() => { setView("login"); setResetSent(false); }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {view === "forgot" && (
                      <div className="text-center mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-xl">
                          <Mail className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Forgot Password?</h3>
                        <p className="text-sm text-white/70">Enter your email and we'll send a reset link</p>
                      </div>
                    )}

                    {view === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs font-semibold text-white flex items-center gap-1.5 px-0.5">
                          <User className="h-3.5 w-3.5 text-white/60" /> Full Name
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your name"
                          required
                          className="h-11 bg-transparent border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-white flex items-center gap-1.5 px-0.5">
                        <Mail className="h-3.5 w-3.5 text-white/60" /> Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="h-11 bg-transparent border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                      />
                    </div>

                    {view !== "forgot" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-semibold text-white flex items-center gap-1.5 px-0.5">
                          <KeyRound className="h-3.5 w-3.5 text-white/60" /> Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="h-11 bg-transparent border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                        />
                      </div>
                    )}

                    {view === "login" && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setView("forgot")}
                          className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full h-11 text-white font-bold tracking-wide shadow-lg border-none"
                        style={{
                          background: "linear-gradient(135deg, #ef4444, #dc2626)",
                          boxShadow: "0 8px 30px rgba(239,68,68,0.4)"
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {view === "login" && "Sign In"}
                            {view === "signup" && "Create Account"}
                            {view === "forgot" && "Send Reset Link"}
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                          </>
                        )}
                      </Button>
                    </div>

                    {view === "forgot" && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setView("login")}
                          className="text-sm font-semibold text-white/80 hover:text-white transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArrowLeft className="h-4 w-4" /> Back to Sign In
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 flex items-center justify-center gap-2 text-xs font-medium text-white/60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Sequential workflow management for teams
        </motion.div>
      </motion.div>
    </div>
  );
}
