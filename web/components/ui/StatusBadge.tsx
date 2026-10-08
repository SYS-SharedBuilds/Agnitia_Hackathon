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
      style = "bg-white text-[#64748B] border-[#E2E8F0]";
      content = (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
          <span>{status}</span>
        </>
      );
      break;

    case "RUNNING":
    case "IN_PROGRESS":
      style = "bg-white text-[#0A1B2E] border-[#2563EB]";
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
      style = "bg-white text-[#0A1B2E] border-[#CBD5E1]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#0A1B2E]">check_circle</span>
          <span className="font-semibold">SUCCEEDED</span>
        </>
      );
      break;

    case "FAILED":
      style = "bg-[#0A1B2E] text-white border-[#0A1B2E]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-white">cancel</span>
          <span className="font-semibold text-white">FAILED</span>
        </>
      );
      break;

    case "NEEDS_ATTENTION":
      style = "bg-white text-[#0A1B2E] border-[#0A1B2E] font-bold";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#0A1B2E]">priority_high</span>
          <span className="font-semibold text-[#0A1B2E]">NEEDS ATTENTION</span>
        </>
      );
      break;

    case "COMPENSATING":
      style = "bg-white text-[#0A1B2E] border-[#CBD5E1]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#0A1B2E] animate-spin">sync</span>
          <span className="font-semibold">COMPENSATING</span>
        </>
      );
      break;

    case "COMPENSATED":
      style = "bg-white text-[#64748B] border-[#CBD5E1]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#64748B]">undo</span>
          <span className="font-semibold">COMPENSATED</span>
        </>
      );
      break;

    case "CANCELLED":
      style = "bg-white text-[#94A3B8] border-[#E2E8F0]";
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
