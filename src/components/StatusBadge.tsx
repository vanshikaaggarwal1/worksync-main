import { cn } from "@/lib/utils";
import { Circle, Clock, Send, CheckCircle, XCircle, Trophy } from "lucide-react";

const statusConfig: Record<string, { style: string; icon: any; label: string }> = {
  pending: { style: "status-pending", icon: Circle, label: "Pending" },
  in_progress: { style: "status-in-progress", icon: Clock, label: "In Progress" },
  submitted: { style: "status-submitted", icon: Send, label: "Submitted" },
  approved: { style: "status-approved", icon: CheckCircle, label: "Approved" },
  rejected: { style: "status-rejected", icon: XCircle, label: "Rejected" },
  completed: { style: "status-completed", icon: Trophy, label: "Completed" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  const IconComponent = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border",
        config.style
      )}
    >
      <IconComponent className="h-3 w-3" />
      {config.label}
    </span>
  );
}
