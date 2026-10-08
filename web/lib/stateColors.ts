import { OrderState, TaskState } from "./types";

export function getOrderStateBadgeClass(state: OrderState): string {
  switch (state) {
    case "ACTIVE":
      return "bg-[#eef3f9] text-black border-[#557392]/40 font-semibold";
    case "IN_PROGRESS":
    case "VALIDATED":
    case "RECEIVED":
      return "bg-[#eef3f9] text-black border-[#557392] animate-pulse font-medium";
    case "ROLLING_BACK":
    case "ROLLED_BACK":
      return "bg-[#eef3f9] text-[#557392] border-[#557392]/40 font-medium";
    case "NEEDS_ATTENTION":
      return "bg-[#0A1B2E] text-[#ffffff] border-[#0A1B2E] font-semibold shadow-xs";
    case "CANCELLED":
      return "bg-[#F2F6FB] text-[#557392]/60 border-[#557392]/20 line-through";
    default:
      return "bg-[#F2F6FB] text-[#557392] border-[#557392]/30";
  }
}

export function getTaskStateColor(state: TaskState): { bg: string; border: string; text: string } {
  switch (state) {
    case "SUCCEEDED":
      return { bg: "bg-[#eef3f9]", border: "border-[#557392]/40", text: "text-black" };
    case "RUNNING":
      return { bg: "bg-[#eef3f9]", border: "border-[#557392]", text: "text-black" };
    case "RETRYING":
      return { bg: "bg-[#eef3f9]", border: "border-[#557392]", text: "text-[#557392]" };
    case "FAILED":
      return { bg: "bg-[#0A1B2E]", border: "border-[#0A1B2E]", text: "text-[#ffffff]" };
    case "COMPENSATING":
      return { bg: "bg-[#eef3f9]", border: "border-[#557392]", text: "text-[#557392]" };
    case "COMPENSATED":
      return { bg: "bg-[#eef3f9]", border: "border-[#557392]/30", text: "text-[#557392]" };
    case "COMPENSATION_FAILED":
      return { bg: "bg-[#0A1B2E]", border: "border-[#0A1B2E]", text: "text-[#ffffff]" };
    case "PENDING":
    default:
      return { bg: "bg-[#F2F6FB]", border: "border-[#557392]/20", text: "text-[#557392]" };
  }
}
