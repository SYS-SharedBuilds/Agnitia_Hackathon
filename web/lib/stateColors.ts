import { OrderState, TaskState } from "./types";

export function getOrderStateBadgeClass(state: OrderState): string {
  switch (state) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "IN_PROGRESS":
    case "VALIDATED":
    case "RECEIVED":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse";
    case "ROLLING_BACK":
    case "ROLLED_BACK":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "NEEDS_ATTENTION":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case "CANCELLED":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
}

export function getTaskStateColor(state: TaskState): { bg: string; border: string; text: string } {
  switch (state) {
    case "SUCCEEDED":
      return { bg: "bg-emerald-950/40", border: "border-emerald-500", text: "text-emerald-400" };
    case "RUNNING":
      return { bg: "bg-blue-950/40", border: "border-blue-500", text: "text-blue-400" };
    case "RETRYING":
      return { bg: "bg-amber-950/40", border: "border-amber-500", text: "text-amber-400" };
    case "FAILED":
      return { bg: "bg-rose-950/40", border: "border-rose-500", text: "text-rose-400" };
    case "COMPENSATING":
      return { bg: "bg-purple-950/40", border: "border-purple-500", text: "text-purple-400" };
    case "COMPENSATED":
      return { bg: "bg-slate-900", border: "border-slate-600", text: "text-slate-400" };
    case "COMPENSATION_FAILED":
      return { bg: "bg-red-950/60", border: "border-red-600", text: "text-red-400" };
    case "PENDING":
    default:
      return { bg: "bg-slate-950", border: "border-slate-800", text: "text-slate-500" };
  }
}
