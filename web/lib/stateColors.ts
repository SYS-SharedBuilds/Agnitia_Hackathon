import { OrderState, TaskState } from "./types";

export function getOrderStateBadgeClass(state: OrderState): string {
  switch (state) {
    case "ACTIVE":
      return "bg-white text-[#0A1B2E] border-[#0A1B2E] font-semibold";
    case "IN_PROGRESS":
    case "VALIDATED":
    case "RECEIVED":
      return "bg-white text-[#0A1B2E] border-[#0A1B2E] animate-pulse font-medium";
    case "ROLLING_BACK":
    case "ROLLED_BACK":
      return "bg-white text-[#0A1B2E] border-[#CBD5E1] font-medium";
    case "NEEDS_ATTENTION":
      return "bg-[#0A1B2E] text-white border-[#0A1B2E] font-semibold shadow-xs";
    case "CANCELLED":
      return "bg-white text-[#64748B] border-[#CBD5E1] line-through";
    default:
      return "bg-white text-[#0A1B2E] border-[#CBD5E1]";
  }
}

export function getTaskStateColor(state: TaskState): { bg: string; border: string; text: string } {
  switch (state) {
    case "SUCCEEDED":
      return { bg: "bg-white", border: "border-[#0A1B2E]", text: "text-[#0A1B2E]" };
    case "RUNNING":
      return { bg: "bg-white", border: "border-[#0A1B2E]", text: "text-[#0A1B2E]" };
    case "RETRYING":
      return { bg: "bg-white", border: "border-[#0A1B2E]", text: "text-[#0A1B2E]" };
    case "FAILED":
      return { bg: "bg-[#0A1B2E]", border: "border-[#0A1B2E]", text: "text-white" };
    case "COMPENSATING":
      return { bg: "bg-white", border: "border-[#0A1B2E]", text: "text-[#0A1B2E]" };
    case "COMPENSATED":
      return { bg: "bg-white", border: "border-[#CBD5E1]", text: "text-[#0A1B2E]" };
    case "COMPENSATION_FAILED":
      return { bg: "bg-[#0A1B2E]", border: "border-[#0A1B2E]", text: "text-white" };
    case "PENDING":
    default:
      return { bg: "bg-white", border: "border-[#CBD5E1]", text: "text-[#64748B]" };
  }
}
