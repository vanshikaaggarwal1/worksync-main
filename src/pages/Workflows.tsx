import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, GitBranch, Trash2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkflowsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([{ name: "", description: "" }]);

  const { data: workflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data } = await supabase
        .from("workflows")
        .select("*, workflow_steps(*)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: wf, error } = await supabase
        .from("workflows")
        .insert({ name, description, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      const stepsToInsert = steps
        .filter((s) => s.name.trim())
        .map((s, i) => ({ workflow_id: wf.id, step_order: i + 1, name: s.name, description: s.description }));
      if (stepsToInsert.length > 0) {
        const { error: stepsError } = await supabase.from("workflow_steps").insert(stepsToInsert);
        if (stepsError) throw stepsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created");
      setOpen(false);
      setName(""); setDescription(""); setSteps([{ name: "", description: "" }]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">Workflows</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">{workflows?.length || 0} active operations</p>
          </motion.div>
          {role === "admin" && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2 active:scale-95">
                  <Plus className="h-5 w-5" /> New Workflow
                </button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto bg-background/90 backdrop-blur-2xl border-l border-foreground/10 text-foreground sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Create Workflow</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-10 pb-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Workflow Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Code Review Pipeline" className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 h-14 rounded-2xl focus:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the workflow..." className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 min-h-[100px] rounded-2xl focus:ring-red-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Operation Steps</Label>
                      <button onClick={() => setSteps([...steps, { name: "", description: "" }])} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">
                        + Add Step
                      </button>
                    </div>
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-3 items-center group">
                        <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-black text-red-500 shrink-0">
                          {i + 1}
                        </div>
                        <Input
                          value={step.name}
                          onChange={(e) => {
                            const ns = [...steps]; ns[i].name = e.target.value; setSteps(ns);
                          }}
                          placeholder="Step objective"
                          className="flex-1 bg-foreground/5 border-foreground/10 text-foreground h-12 rounded-xl focus:ring-red-500"
                        />
                        {steps.length > 1 && (
                          <button className="h-10 w-10 rounded-xl hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name.trim()} className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 mt-4">
                    Initialize Workflow
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows?.map((wf, i) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-card card-3d p-6 rounded-3xl relative overflow-hidden group border border-foreground/5 hover:border-foreground/20 transition-all flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                      <GitBranch className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground uppercase tracking-tight group-hover:text-red-500 transition-colors leading-none">{wf.name}</h3>
                      <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em] mt-2">ID: {wf.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  {role === "admin" && (
                    <button className="h-10 w-10 rounded-xl hover:bg-red-500/10 text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20" onClick={() => deleteMutation.mutate(wf.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {wf.description && <p className="text-xs font-bold text-foreground/50 mb-6 leading-relaxed uppercase tracking-widest">{wf.description}</p>}
                
                <div className="space-y-3 mb-8 flex-1">
                  {(wf.workflow_steps as any[])
                    ?.sort((a: any, b: any) => a.step_order - b.step_order)
                    .map((step: any, si: number) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-6 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-3 w-3 text-red-500" />
                          </div>
                          {si < (wf.workflow_steps as any[]).length - 1 && (
                            <div className="w-0.5 h-4 bg-foreground/5" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">{step.name}</span>
                      </div>
                    ))}
                </div>
                
                <div className="pt-5 border-t border-foreground/5">
                  <p className="text-[9px] text-foreground/20 font-black uppercase tracking-[0.3em] font-mono tabular-nums">
                    Established {new Date(wf.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          {(!workflows || workflows.length === 0) && (
            <div className="col-span-full text-center py-32 bg-foreground/[0.02] rounded-3xl border border-dashed border-foreground/10">
              <div className="h-20 w-20 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6">
                <GitBranch className="h-10 w-10 text-foreground/10" />
              </div>
              <p className="text-sm font-black text-foreground/20 uppercase tracking-[0.4em]">No workflows defined</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
