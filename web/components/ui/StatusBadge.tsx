import React from "react";

export type OrderState =
  | "PENDING"
  | "DRAFT"
  | "RUNNING"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "COMPLETED"
  | "FAILED"
  | "NEEDS_ATTENTION"
  | "COMPENSATING"
  | "COMPENSATED"
  | "CANCELLED";

interface StatusBadgeProps {
  status: OrderState | string;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = "md", pulse = false, className = "" }: StatusBadgeProps) {
  const norm = status.toUpperCase().replace(/\s+/g, "_");

  let content: React.ReactNode = norm;
  let style = "bg-white text-[#0A1B2E] border-[#CBD5E1]";

  switch (norm) {
    case "PENDING":
    case "DRAFT":
    case "DRAFT_/_PENDING":
      style = "bg-[#FEFCE8] text-[#EEB930] border-[#EEB930]";
      content = (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EEB930]"></span>
          <span>{status}</span>
        </>
      );
      break;

    case "RUNNING":
    case "IN_PROGRESS":
      style = "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]";
      content = (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
          </span>
          <span className="font-semibold tracking-wide">RUNNING</span>
        </>
      );
      break;

    case "SUCCEEDED":
    case "COMPLETED":
    case "ACTIVE":
      style = "bg-[#F0FDF4] text-[#22C55E] border-[#22C55E]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#22C55E]">check_circle</span>
          <span className="font-semibold">SUCCEEDED</span>
        </>
      );
      break;

    case "RETRYING":
      style = "bg-[#FEFCE8] text-[#EEB930] border-[#EEB930]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#EEB930] animate-spin">refresh</span>
          <span className="font-semibold">RETRYING</span>
        </>
      );
      break;

    case "FAILED":
      style = "bg-[#FEF2F2] text-[#ED2C2C] border-[#ED2C2C]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#ED2C2C]">cancel</span>
          <span className="font-semibold text-[#ED2C2C]">FAILED</span>
        </>
      );
      break;

    case "NEEDS_ATTENTION":
      style = "bg-[#FEF2F2] text-[#ED2C2C] border-[#ED2C2C] font-bold";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#ED2C2C]">priority_high</span>
          <span className="font-semibold text-[#ED2C2C]">NEEDS ATTENTION</span>
        </>
      );
      break;

    case "COMPENSATING":
    case "ROLLING_BACK":
      style = "bg-[#FEF2F2] text-[#ED2C2C] border-[#ED2C2C]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#ED2C2C] animate-spin">sync</span>
          <span className="font-semibold">ROLLING BACK</span>
        </>
      );
      break;

    case "COMPENSATED":
    case "ROLLED_BACK":
      style = "bg-[#F5F5F4] text-[#8B7B65] border-[#8B7B65]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#8B7B65]">undo</span>
          <span className="font-semibold">COMPENSATED</span>
        </>
      );
      break;

    case "CANCELLED":
      style = "bg-[#F5F5F4] text-[#8B7B65] border-[#E2E8F0]";
      content = <span className="line-through">{status}</span>;
      break;

    default:
      content = status;
      break;
  }

  const sizeCls = size === "sm" ? "h-5 px-2 text-[10px]" : "h-6 px-2.5 text-label-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono border shadow-2xs select-none ${sizeCls} ${style} ${pulse ? "animate-pulse" : ""} ${className}`}
    >
      {content}
    </span>
  );
}
