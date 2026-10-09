import { OrderState, TaskState } from "./types";

export function getOrderStateBadgeClass(state: OrderState): string {
  switch (state) {
    case "ACTIVE":
      return "bg-[#F0FDF4] text-[#22C55E] border-[#22C55E] font-semibold";
    case "IN_PROGRESS":
    case "VALIDATED":
    case "RECEIVED":
      return "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] animate-pulse font-medium";
    case "ROLLING_BACK":
      return "bg-[#FEF2F2] text-[#ED2C2C] border-[#ED2C2C] font-medium";
    case "ROLLED_BACK":
      return "bg-[#F5F5F4] text-[#8B7B65] border-[#8B7B65] font-medium";
    case "NEEDS_ATTENTION":
      return "bg-[#FEF2F2] text-[#ED2C2C] border-[#ED2C2C] font-semibold shadow-xs";
    case "CANCELLED":
      return "bg-[#F5F5F4] text-[#8B7B65] border-[#E2E8F0] line-through";
    default:
      return "bg-[#FEFCE8] text-[#EEB930] border-[#EEB930]";
  }
}

export function getTaskStateColor(state: TaskState): { bg: string; border: string; text: string } {
  switch (state) {
    case "SUCCEEDED":
      return { bg: "bg-[#F0FDF4]", border: "border-[#22C55E]", text: "text-[#22C55E]" };
    case "RUNNING":
      return { bg: "bg-[#EFF6FF]", border: "border-[#2563EB]", text: "text-[#2563EB]" };
    case "RETRYING":
      return { bg: "bg-[#FEFCE8]", border: "border-[#EEB930]", text: "text-[#EEB930]" };
    case "FAILED":
      return { bg: "bg-[#FEF2F2]", border: "border-[#ED2C2C]", text: "text-[#ED2C2C]" };
    case "COMPENSATING":
      return { bg: "bg-[#FEF2F2]", border: "border-[#ED2C2C]", text: "text-[#ED2C2C]" };
    case "COMPENSATED":
      return { bg: "bg-[#F5F5F4]", border: "border-[#8B7B65]", text: "text-[#8B7B65]" };
    case "COMPENSATION_FAILED":
      return { bg: "bg-[#FEF2F2]", border: "border-[#ED2C2C]", text: "text-[#ED2C2C]" };
    case "PENDING":
    default:
      return { bg: "bg-[#FEFCE8]", border: "border-[#EEB930]", text: "text-[#EEB930]" };
  }
}
