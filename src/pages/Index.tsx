import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  CheckSquare,
  Users,
  Moon,
  Sun,
  Shield,
  Clock,
  BarChart3,
  Zap,
  ChevronRight,
  Sparkles,
  Play,
  TrendingUp,
  Lock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── Animation Variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: "easeOut" as const }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const }
  })
};

/* ── 3D Tilt Card Component ── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    rotX.set(-y * 14);
    rotY.set(x * 14);
  };

  const onMouseLeave = () => {
    animate(rotX, 0, { duration: 0.5 });
    animate(rotY, 0, { duration: 0.5 });
  };

  const rotateX = useTransform(rotX, (v) => `${v}deg`);
  const rotateY = useTransform(rotY, (v) => `${v}deg`);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated Counter ── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = to / 60;
          const t = setInterval(() => {
            start += step;
            if (start >= to) { setVal(to); clearInterval(t); }
            else setVal(Math.floor(start));
          }, 16);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Main Landing Page Component ── */
export default function Index() {
  const { user } = useAuth();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const features = [
    { icon: GitBranch, title: "Structured Workflows", desc: "Define sequential steps with role assignments. Tasks flow through a strict, predefined path ensuring nothing gets skipped.", accent: "#ef4444" },
    { icon: CheckSquare, title: "Immutable Activity Log", desc: "Every status change is an immutable record. Full accountability from assignment to completion with timestamped logs.", accent: "#f97316" },
    { icon: Users, title: "Role-Based Access", desc: "Admin, Manager, and Employee roles with distinct permissions, dashboards, and operational boundaries.", accent: "#eab308" },
    { icon: Shield, title: "Audit Trail", desc: "Complete history of every action. Know who did what, when, and why — perfect for compliance and reviews.", accent: "#22c55e" },
    { icon: Clock, title: "Deadline Tracking", desc: "Set deadlines on tasks and get automatic notifications. Never miss a critical handover again.", accent: "#3b82f6" },
    { icon: BarChart3, title: "Real-time Reports", desc: "Visual analytics on task distribution, completion rates, and team performance at a glance.", accent: "#a855f7" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30 overflow-x-hidden font-sans">
      
      {/* ── GLOBAL FIXED BACKGROUND ── */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{ backgroundImage: "url('/background.jpeg')" }}
      />
      {/* Dark overlay & fade-to-bottom so scrolling content remains highly readable */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/50 via-[#050505]/80 to-[#050505] pointer-events-none" />

      {/* ── FOREGROUND SCROLLING CONTENT ── */}
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {/* ── HERO SECTION (MASSIVE LIQUID GLASS PORTAL) ── */}
        <section className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8 shrink-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-7xl min-h-[calc(100vh-4rem)] rounded-[2rem] border relative overflow-hidden flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.15)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
          >
            {/* Liquid glow effects inside portal */}
            <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen">
              <motion.div
                animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-white/10 blur-[150px]"
              />
              <motion.div
                animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]"
              />
            </div>

            {/* Inner Nav */}
            <header className="w-full px-4 md:px-10 py-6 flex items-center justify-between shrink-0 relative z-20">
              <div className="flex items-center gap-1.5 sm:gap-2.5 text-white">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 10px rgba(239,68,68,0.4)" }}
                >
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight drop-shadow-sm">WorkSync</span>
              </div>
              <div className="flex items-center gap-2 md:gap-6">
                <button onClick={() => navigate("/auth")} className="text-sm font-semibold text-white/70 hover:text-white transition-colors whitespace-nowrap">
                  Sign In
                </button>
                <button onClick={() => navigate("/auth")} className="bg-white text-black px-5 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:bg-white/90 hover:scale-105 transition-all whitespace-nowrap">
                  Get Started
                </button>
              </div>
            </header>

            {/* Inner Hero Content */}
            <div className="flex flex-col items-center justify-center shrink-0 px-6 pt-10 pb-4 relative z-20 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.05] font-black tracking-tight mb-6 text-white"
                style={{ textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
              >
                Sequential workflow
                <br />
                <span style={{ color: "#ef4444", textShadow: "0 4px 30px rgba(239,68,68,0.6)" }}>
                  management
                </span>{" "}
                for teams
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
              >
                Eliminate "Where is this at?" — force tasks through predefined, role-gated workflow steps with full accountability and real-time tracking.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
              >
                <button onClick={() => navigate("/auth")} className="px-8 py-3.5 rounded-full text-base font-bold text-white shadow-xl transition-transform hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "1px solid rgba(255,100,100,0.5)",
                    boxShadow: "0 8px 30px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
                  }}
                >
                  Start Free <ArrowRight className="inline h-4 w-4 ml-1.5" />
                </button>
                <button onClick={() => navigate("/auth")} className="px-8 py-3.5 rounded-full text-base font-bold text-white border border-foreground/20 bg-foreground/5 hover:bg-white/10 transition-colors backdrop-blur-md shadow-xl flex items-center gap-2">
                  <Play className="h-4 w-4 fill-white" /> Watch Demo
                </button>
              </motion.div>
            </div>

            {/* Custom SVG Node Graphic (From Reference) */}
            <div className="flex-1 w-full relative z-10 flex flex-col items-center justify-center py-10 perspective-1000">
              <motion.div
                initial={{ opacity: 0, rotateX: 60, y: 50 }} animate={{ opacity: 1, rotateX: 60, y: 0 }} transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className="relative w-[280px] h-[180px] sm:w-[500px] sm:h-[280px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full text-white/30 pointer-events-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }}>
                  <path d="M 20 110 L 140 50 L 280 50 L 420 110" stroke="currentColor" strokeWidth={3} fill="none" strokeLinejoin="round" />
                  <path d="M 140 50 L 200 140 L 340 140 L 420 110" stroke="currentColor" strokeWidth={3} fill="none" strokeLinejoin="round" />
                  <path d="M 20 110 L 200 200 L 340 200" stroke="currentColor" strokeWidth={3} fill="none" strokeLinejoin="round" />
                </svg>

                {/* Nodes (Floating Glass Cubes w/ Red Spheres) */}
                <div className="absolute left-[20px] top-[110px] -ml-8 -mt-8 w-16 h-16 rounded-2xl bg-white/10 border border-white/40 backdrop-blur-xl flex items-center justify-center shadow-2xl" style={{ transform: "translateZ(30px) rotateX(-50deg)" }}>
                  <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 rounded-full bg-white shadow-[0_0_20px_white]" />
                </div>
                <div className="absolute left-[140px] top-[50px] -ml-8 -mt-8 w-16 h-16 rounded-2xl bg-white/10 border border-white/40 backdrop-blur-xl flex items-center justify-center shadow-2xl" style={{ transform: "translateZ(20px) rotateX(-50deg)" }}>
                  <div className="w-6 h-6 rounded-full bg-[#ef4444] shadow-[0_0_20px_#ef4444]" />
                </div>
                <div className="absolute left-[200px] top-[140px] -ml-8 -mt-8 w-16 h-16 rounded-2xl bg-foreground/5 border border-foreground/20 backdrop-blur-md flex items-center justify-center shadow-2xl" style={{ transform: "translateZ(40px) rotateX(-50deg)" }} />
                <div className="absolute left-[340px] top-[140px] -ml-8 -mt-8 w-16 h-16 rounded-2xl bg-white/10 border border-white/40 backdrop-blur-xl flex items-center justify-center shadow-2xl" style={{ transform: "translateZ(40px) rotateX(-50deg)" }}>
                  <div className="w-5 h-5 rounded-full bg-[#ef4444] shadow-[0_0_15px_#ef4444]" />
                </div>
                <div className="absolute left-[280px] top-[50px] -ml-4 -mt-4 w-8 h-8 rounded-full border border-white/50 bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg" style={{ transform: "translateZ(20px) rotateX(-50deg)" }}>
                  <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                </div>
                <div className="absolute left-[420px] top-[110px] -ml-10 -mt-10 w-20 h-20 rounded-[2rem] border-[3px] border-white/50 bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_2px_10px_rgba(255,255,255,0.3)]" style={{ transform: "translateZ(30px) rotateX(-50deg)" }}>
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-10 h-10 rounded-full bg-[#ef4444] shadow-[0_0_40px_#ef4444]" />
                </div>
              </motion.div>
            </div>

            {/* Bottom Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
              className="w-full px-8 pb-8 shrink-0 relative z-20 flex flex-wrap lg:flex-nowrap justify-center gap-4 lg:gap-6 mt-auto"
            >
              {[
                { value: "99.9%", label: "Uptime SLA" },
                { value: "50k+", label: "Tasks" },
                { value: "3x", label: "Faster Handovers" },
                { value: "100%", label: "Audit Trail" }
              ].map((stat, i) => (
                <div key={i} className="flex-1 min-w-[120px] max-w-[240px] rounded-2xl border text-center py-4 sm:py-6 px-3 sm:px-4 shadow-2xl transition-transform hover:scale-105"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)",
                    backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.15)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)"
                  }}
                >
                  <div className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">{stat.value}</div>
                  <div className="text-xs md:text-sm font-semibold mt-1 text-white/60">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── INTERACTIVE WORKFLOW DASHBOARD SHOWCASE ── */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 bg-foreground/5 font-bold text-xs text-foreground/80 mb-6 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-red-500" /> INTERACTIVE DASHBOARD
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white drop-shadow-md">
              Full visibility into <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">every step</span>
            </h2>
          </motion.div>

          {/* The Dashboard 3D Tilt Card Component Restored & Upgraded */}
          <div className="flex justify-center perspective-1200 w-full max-w-4xl mx-auto relative">
            
            {/* Ambient Background Glow for Dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-red-500/10 blur-[100px] rounded-full z-0" />
            
            <TiltCard className="w-full relative z-10 mx-auto">
              <div
                className="rounded-2xl overflow-hidden border border-foreground/20 shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
                style={{
                  background: "linear-gradient(135deg, rgba(20,20,20,0.6) 0%, rgba(10,10,10,0.8) 100%)",
                  backdropFilter: "blur(32px)",
                }}
              >
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-foreground/10 bg-foreground/5">
                  <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-foreground/50 font-mono font-bold tracking-wider">WorkSync — Active Workflows</span>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Dashboard Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Active", value: <Counter to={24} />, color: "#ef4444", icon: TrendingUp },
                      { label: "Completed", value: <Counter to={189} />, color: "#22c55e", icon: CheckSquare },
                      { label: "Pending", value: <Counter to={7} />, color: "#f97316", icon: Clock },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        custom={i}
                        variants={fadeUp}
                        className="rounded-xl p-4 md:p-5 border border-foreground/10 bg-foreground/5 shadow-inner"
                      >
                        <div className="text-3xl lg:text-5xl font-black" style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}40` }}>
                          {stat.value}
                        </div>
                        <div className="text-xs md:text-sm font-bold text-white/60 mt-1 uppercase tracking-wide">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Workflow steps inside dashboard */}
                  <div className="space-y-3">
                    {[
                      { name: "Design Review", user: "Alice", status: "Completed", pct: 100, color: "#22c55e" },
                      { name: "Dev Implementation", user: "Bob", status: "In Progress", pct: 65, color: "#ef4444" },
                      { name: "QA Testing", user: "Carol", status: "Pending", pct: 0, color: "rgba(255,255,255,0.3)" },
                      { name: "Deployment", user: "Dave", status: "Blocked", pct: 0, color: "#f97316" },
                    ].map((step, i) => (
                      <motion.div
                        key={step.name}
                        custom={i + 3}
                        variants={fadeUp}
                        className="flex items-center gap-4 rounded-xl p-3 md:p-4 border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.06] transition-colors"
                      >
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                          style={{ background: step.status === "Pending" ? "rgba(255,255,255,0.1)" : step.color }}
                        >
                          {step.user[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm md:text-base font-bold text-white truncate">{step.name}</div>
                          <div className="text-xs font-medium text-foreground/50">{step.user} · {step.status}</div>
                          {step.pct > 0 && (
                            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${step.pct}%` }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${step.color}, #dc2626)` }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-inner"
                          style={{ background: step.status === "Pending" ? "rgba(255,255,255,0.1)" : `${step.color}20`, color: step.status === "Pending" ? "rgba(255,255,255,0.5)" : step.color }}
                        >
                          {step.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements on TiltCard */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-8 rounded-2xl border border-foreground/20 bg-black/60 backdrop-blur-xl px-5 py-3 text-sm font-bold shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3"
              >
                <div className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_15px_#4ade80]" />
                <span className="text-white">3 Tasks Completed Today</span>
              </motion.div>

              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-6 -right-6 md:-top-8 md:-right-8 rounded-2xl border border-white/30 p-4 shadow-[0_10px_40px_rgba(239,68,68,0.4)]"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                <Lock className="h-6 w-6 text-white" />
              </motion.div>
            </TiltCard>
          </div>
        </section>

        {/* ── FEATURES GRID (Dark Glass Aesthetic) ── */}
        <section id="features" className="w-full py-24 border-t border-foreground/10 relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 bg-foreground/5 font-bold text-xs text-foreground/80 mb-6 backdrop-blur-md">
                <Zap className="h-3.5 w-3.5 text-red-500" /> POWERFUL FEATURES
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 drop-shadow-md">
                Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">manage workflows</span>
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto font-medium">
                From task assignment to completion — every step is tracked, every handover is logged.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title} custom={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -8 }}
                  className="group relative rounded-3xl border border-foreground/10 p-8 cursor-default transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
                >
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${feature.accent}20 0%, transparent 60%)` }}
                  />
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${feature.accent}20, ${feature.accent}40)`, border: `1px solid ${feature.accent}40` }}
                  >
                    <feature.icon className="h-7 w-7" style={{ color: feature.accent, filter: `drop-shadow(0 0 10px ${feature.accent})` }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-sm font-medium text-foreground/50 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="w-full py-28 border-t border-foreground/10 relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 bg-foreground/5 font-bold text-xs text-foreground/80 mb-6 backdrop-blur-md">
                <GitBranch className="h-3.5 w-3.5 text-red-500" /> HOW IT WORKS
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Three steps to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">streamlined</span> management
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
              <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)" }}
              />

              {[
                { step: "01", title: "Define Workflow", desc: "Create sequential steps with role assignments. Each step gates who can act.", icon: GitBranch },
                { step: "02", title: "Assign & Track", desc: "Managers assign tasks. Every action is logged. Notifications keep things moving.", icon: Users },
                { step: "03", title: "Review & Complete", desc: "Tasks flow through approval steps. Admins get full visibility. Nothing slips.", icon: CheckSquare },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative text-center">
                  <div className="rounded-3xl border border-foreground/10 p-10 bg-white/[0.03] backdrop-blur-xl shadow-2xl relative z-10">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_10px_30px_rgba(239,68,68,0.4)]"
                      style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                    >
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">{item.step}</div>
                    <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                    <p className="text-sm font-medium text-foreground/50 leading-relaxed">{item.desc}</p>
                  </div>
                  {i < 2 && <ChevronRight className="hidden md:block absolute -right-6 top-[40%] h-12 w-12 z-20 text-red-500/50" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="pricing" className="w-full py-32 border-t border-foreground/10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)" }}
            />
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 drop-shadow-lg">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">streamline</span><br />your workflows?
            </h2>
            <p className="text-white/60 font-medium text-xl mb-14 max-w-2xl mx-auto">
              Join thousands of teams that have eliminated task ambiguity and improved accountability across their entire organization.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button onClick={() => navigate("/auth")} className="px-12 py-5 rounded-full text-lg font-bold text-white shadow-[0_20px_50px_rgba(239,68,68,0.5)] transition-transform hover:scale-105 hover:-translate-y-1"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                Get Started for Free <ArrowRight className="inline h-5 w-5 ml-2" />
              </button>
              <button onClick={() => navigate("/auth")} className="px-12 py-5 rounded-full text-lg font-bold text-white border border-foreground/20 bg-foreground/5 hover:bg-white/10 transition-all backdrop-blur-md">
                Sign In to Account
              </button>
            </div>
            <p className="text-sm font-semibold text-white/40 mt-8 uppercase tracking-widest">
              No credit card required · Free plan available · Set up in 2 minutes
            </p>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="w-full border-t border-foreground/10 py-12 relative z-10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-[0_2px_10px_rgba(239,68,68,0.4)]"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">WorkSync</span>
            </div>
            <p className="text-sm font-medium text-white/40">
              © {new Date().getFullYear()} WorkSync. Sequential workflow management.
            </p>
            <div className="flex items-center gap-8 text-sm font-bold text-foreground/50">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
