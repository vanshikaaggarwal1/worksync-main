import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, MessageSquare, Upload, FileText, Download, Send, CheckSquare } from "lucide-react";

export default function TasksPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const empIds = (roles || []).filter((r) => r.role === "employee").map((r) => r.user_id);
      if (empIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("*").in("id", empIds);
      return data || [];
    },
    enabled: role === "admin" || role === "manager",
  });

  const { data: workflows } = useQuery({
    queryKey: ["workflows-list"],
    queryFn: async () => {
      const { data } = await supabase.from("workflows").select("id, name").eq("is_active", true);
      return data || [];
    },
    enabled: role === "admin" || role === "manager",
  });

  // Fetch comments without PostgREST join - get profiles separately
  const { data: taskComments } = useQuery({
    queryKey: ["task-comments", detailTask?.id],
    queryFn: async () => {
      if (!detailTask) return [];
      const { data: comments } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", detailTask.id)
        .order("created_at", { ascending: true });
      if (!comments || comments.length === 0) return [];
      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return comments.map((c) => ({ ...c, profile: profileMap[c.user_id] || null }));
    },
    enabled: !!detailTask,
  });

  // Fetch history without PostgREST join
  const { data: taskHistory } = useQuery({
    queryKey: ["task-history", detailTask?.id],
    queryFn: async () => {
      if (!detailTask) return [];
      const { data: history } = await supabase
        .from("task_history")
        .select("*")
        .eq("task_id", detailTask.id)
        .order("created_at", { ascending: false });
      if (!history || history.length === 0) return [];
      const userIds = [...new Set(history.map((h) => h.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return history.map((h) => ({ ...h, profile: profileMap[h.user_id] || null }));
    },
    enabled: !!detailTask,
  });

  // Fetch documents for the task
  const { data: taskDocuments } = useQuery({
    queryKey: ["task-documents", detailTask?.id],
    queryFn: async () => {
      if (!detailTask) return [];
      const { data } = await supabase
        .from("task_documents")
        .select("*")
        .eq("task_id", detailTask.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!detailTask,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        title,
        description,
        assigned_to: assignedTo || null,
        assigned_by: user!.id,
        workflow_id: workflowId || null,
        deadline: deadline || null,
      });
      if (error) throw error;

      if (assignedTo) {
        await supabase.from("notifications").insert({
          user_id: assignedTo,
          title: "New Task Assigned",
          message: `You have been assigned: ${title}`,
          type: "task_assigned",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      setOpen(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setWorkflowId("");
      setDeadline("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus, oldStatus, task }: { taskId: string; newStatus: string; oldStatus: string; task: any }) => {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      await supabase.from("task_history").insert({
        task_id: taskId,
        user_id: user!.id,
        action: "status_change",
        old_value: oldStatus,
        new_value: newStatus,
      });

      // Send notifications based on status change
      const notifications: { user_id: string; title: string; message: string; type: string; related_task_id: string }[] = [];

      if (newStatus === "submitted" && task.assigned_by) {
        // Notify manager/admin who assigned the task
        notifications.push({
          user_id: task.assigned_by,
          title: "Task Submitted for Review",
          message: `Task "${task.title}" has been submitted for review.`,
          type: "task_submitted",
          related_task_id: taskId,
        });
        // Also notify all admins
        const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
        (adminRoles || []).forEach((ar) => {
          if (ar.user_id !== task.assigned_by && ar.user_id !== user!.id) {
            notifications.push({
              user_id: ar.user_id,
              title: "Task Submitted for Review",
              message: `Task "${task.title}" has been submitted for review.`,
              type: "task_submitted",
              related_task_id: taskId,
            });
          }
        });
      } else if (newStatus === "approved" && task.assigned_to) {
        notifications.push({
          user_id: task.assigned_to,
          title: "Task Approved",
          message: `Your task "${task.title}" has been approved.`,
          type: "task_approved",
          related_task_id: taskId,
        });
      } else if (newStatus === "rejected" && task.assigned_to) {
        notifications.push({
          user_id: task.assigned_to,
          title: "Task Rejected",
          message: `Your task "${task.title}" has been rejected. Please review and resubmit.`,
          type: "task_rejected",
          related_task_id: taskId,
        });
      } else if (newStatus === "completed" && task.assigned_to) {
        notifications.push({
          user_id: task.assigned_to,
          title: "Task Completed",
          message: `Task "${task.title}" has been marked as completed.`,
          type: "task_completed",
          related_task_id: taskId,
        });
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-history"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      toast.success("Status updated");
      if (detailTask) {
        setDetailTask({ ...detailTask, status: variables.newStatus });
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!detailTask || !comment.trim()) return;
      const { error } = await supabase.from("task_comments").insert({
        task_id: detailTask.id,
        user_id: user!.id,
        content: comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments"] });
      setComment("");
      toast.success("Comment added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !detailTask) return;
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      for (const file of files) {
        const filePath = `${detailTask.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("task-documents")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("task_documents").insert({
          task_id: detailTask.id,
          uploaded_by: user!.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });
        if (dbError) throw dbError;
      }
      queryClient.invalidateQueries({ queryKey: ["task-documents"] });
      toast.success(`${files.length} file(s) uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage.from("task-documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Failed to generate download link");
    }
  };

  const canCreate = role === "admin" || role === "manager";
  const canApprove = role === "admin" || role === "manager";

  const getStatusActions = (task: any) => {
    const actions: { label: string; status: string }[] = [];
    if (task.status === "pending" && (task.assigned_to === user?.id || canApprove)) {
      actions.push({ label: "Start Work", status: "in_progress" });
    }
    if (task.status === "in_progress" && task.assigned_to === user?.id) {
      actions.push({ label: "Submit for Review", status: "submitted" });
    }
    if (task.status === "submitted" && canApprove) {
      actions.push({ label: "Approve", status: "approved" });
      actions.push({ label: "Reject", status: "rejected" });
    }
    if (task.status === "approved" && canApprove) {
      actions.push({ label: "Mark Complete", status: "completed" });
    }
    if (task.status === "rejected" && task.assigned_to === user?.id) {
      actions.push({ label: "Resume Work", status: "in_progress" });
    }
    return actions;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in relative z-10 p-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 bg-glass p-6 sm:p-8 rounded-3xl border border-foreground/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-md">Tasks</h1>
            <p className="text-sm font-bold text-foreground/40 mt-1 uppercase tracking-[0.2em]">{tasks?.length || 0} active records</p>
          </div>
          {canCreate && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2 active:scale-95">
                  <Plus className="h-5 w-5" /> Assign Task
                </button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto bg-background/90 backdrop-blur-2xl border-l border-foreground/10 text-foreground">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Create Task</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-10">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-foreground/40">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 h-12 rounded-xl focus:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-foreground/40">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 min-h-[120px] rounded-xl focus:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-foreground/40">Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground h-12 rounded-xl"><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent className="bg-background/95 border-foreground/10 text-foreground">
                        {employees?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-foreground/40">Workflow</Label>
                    <Select value={workflowId} onValueChange={setWorkflowId}>
                      <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground h-12 rounded-xl"><SelectValue placeholder="Select workflow (optional)" /></SelectTrigger>
                      <SelectContent className="bg-background/95 border-foreground/10 text-foreground">
                        {workflows?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-foreground/40">Deadline</Label>
                    <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground h-12 rounded-xl [color-scheme:dark] dark:[color-scheme:dark]" />
                  </div>
                  <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title.trim()} className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95">
                    Create Task
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Task Detail Sheet */}
        <Sheet open={!!detailTask} onOpenChange={(o) => !o && setDetailTask(null)}>
          <SheetContent className="overflow-y-auto sm:max-w-xl bg-background/90 backdrop-blur-3xl border-l border-foreground/10 text-foreground">
            {detailTask && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-3xl font-black text-foreground uppercase tracking-tight leading-none mb-1">{detailTask.title}</SheetTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={detailTask.status} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Task ID: {detailTask.id.slice(0, 8)}</span>
                  </div>
                </SheetHeader>
                
                <div className="space-y-8 mt-12 pb-20">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-4">Actions</p>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {getStatusActions(detailTask).map((action) => (
                        <button
                          key={action.status}
                          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                            action.status === "rejected" 
                              ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" 
                              : "bg-foreground text-background hover:bg-foreground/90"
                          }`}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              taskId: detailTask.id,
                              newStatus: action.status,
                              oldStatus: detailTask.status,
                              task: detailTask,
                            })
                          }
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {detailTask.description && (
                    <div className="glass-card-dark rounded-2xl p-6 border border-foreground/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-3">Description</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{detailTask.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card-dark rounded-2xl p-4 border border-foreground/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-1">Created</p>
                      <p className="text-sm font-bold text-foreground font-mono tabular-nums">{new Date(detailTask.created_at).toLocaleDateString()}</p>
                    </div>
                    {detailTask.deadline && (
                      <div className="glass-card-dark rounded-2xl p-4 border border-foreground/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-1">Deadline</p>
                        <p className="text-sm font-bold text-red-500 font-mono tabular-nums">{new Date(detailTask.deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">Documents</p>
                      <div>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                        <button
                          className="bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-foreground/5 transition-all flex items-center gap-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploading ? "Uploading..." : "Attach Files"}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {taskDocuments?.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer border border-foreground/5 group"
                          onClick={() => handleDownload(doc)}
                        >
                          <div className="h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0 border border-foreground/5 group-hover:border-foreground/20 transition-all">
                            <FileText className="h-5 w-5 text-foreground/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{doc.file_name}</p>
                            <p className="text-[10px] text-foreground/30 font-black uppercase tracking-widest mt-0.5">
                              {formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-foreground/20 group-hover:text-foreground transition-colors shrink-0" />
                        </div>
                      ))}
                      {(!taskDocuments || taskDocuments.length === 0) && (
                        <p className="text-xs font-bold text-foreground/20 uppercase tracking-widest py-8 text-center border border-dashed border-foreground/10 rounded-2xl">No assets attached</p>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-4">History Log</p>
                    <div className="space-y-4">
                      {taskHistory?.map((h: any) => (
                        <div key={h.id} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:bottom-0 before:w-0.5 before:bg-foreground/10">
                          <p className="text-xs font-bold text-foreground">{h.action}: <span className="text-red-500">{h.old_value}</span> → <span className="text-green-500">{h.new_value}</span></p>
                          <p className="text-[10px] text-foreground/30 font-black uppercase tracking-widest mt-1">
                            {h.profile?.full_name || "Unknown"} · {new Date(h.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="pt-4 border-t border-foreground/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-4">Collaborators</p>
                    <div className="space-y-4 mb-6">
                      {taskComments?.map((c: any) => (
                        <div key={c.id} className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg">
                            {c.profile?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1">
                            <div className="bg-foreground/5 border border-foreground/5 rounded-2xl p-4 shadow-sm">
                              <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                            </div>
                            <p className="text-[9px] text-foreground/20 font-black uppercase tracking-widest mt-2 px-1">
                              {c.profile?.full_name || "Unknown"} · {new Date(c.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 sticky bottom-4">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/20 h-12 rounded-2xl focus:ring-red-500 shadow-inner"
                        onKeyDown={(e) => e.key === "Enter" && addCommentMutation.mutate()}
                      />
                      <button 
                        onClick={() => addCommentMutation.mutate()} 
                        disabled={!comment.trim()}
                        className="bg-red-500 text-white px-5 rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Task List */}
        <div className="glass-card-dark rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-foreground/5 bg-foreground/[0.02]">
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Task Record</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Status</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 text-center">Deadline</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {tasks?.map((task) => (
                  <tr
                    key={task.id}
                    className="group hover:bg-white/[0.03] transition-all cursor-pointer"
                    onClick={() => setDetailTask(task)}
                  >
                    <td className="p-5">
                      <p className="text-sm font-black text-foreground group-hover:text-red-500 transition-colors">{task.title}</p>
                      {task.description && (
                        <p className="text-[10px] font-bold text-foreground/30 truncate max-sm mt-0.5 uppercase tracking-widest">{task.description}</p>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="flex scale-90 origin-left">
                        <StatusBadge status={task.status} />
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[11px] font-black font-mono tabular-nums uppercase ${task.deadline ? 'text-red-500' : 'text-foreground/20'}`}>
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Limit"}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="text-[11px] font-black text-foreground/30 font-mono tabular-nums uppercase">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!tasks || tasks.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-foreground/5">
                        <CheckSquare className="h-8 w-8 text-foreground/10" />
                      </div>
                      <p className="text-sm font-bold text-foreground/20 uppercase tracking-[0.3em]">No archive records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
