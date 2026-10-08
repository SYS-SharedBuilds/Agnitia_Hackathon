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
  let style = "bg-[#eef3f9] text-[#0A1B2E] border-[#557392]/30";

  switch (norm) {
    case "PENDING":
    case "DRAFT":
    case "DRAFT_/_PENDING":
      style = "bg-[#eef3f9] text-[#557392] border-[#557392]/30";
      content = (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-[#557392]"></span>
          <span>{status}</span>
        </>
      );
      break;

    case "RUNNING":
    case "IN_PROGRESS":
      style = "bg-[#eef3f9] text-[#0A1B2E] border-[#557392]";
      content = (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#557392] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#557392]"></span>
          </span>
          <span className="font-semibold tracking-wide">RUNNING</span>
        </>
      );
      break;

    case "SUCCEEDED":
    case "COMPLETED":
      style = "bg-[#eef3f9] text-[#0A1B2E] border-[#557392]/40";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#0A1B2E]">check_circle</span>
          <span className="font-semibold">SUCCEEDED</span>
        </>
      );
      break;

    case "FAILED":
      style = "bg-[#0A1B2E] text-[#ffffff] border-[#0A1B2E]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#ffffff]">cancel</span>
          <span className="font-semibold text-white">FAILED</span>
        </>
      );
      break;

    case "NEEDS_ATTENTION":
      style = "bg-[#0A1B2E] text-[#ffffff] border-[#0A1B2E]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#ffffff]">priority_high</span>
          <span className="font-semibold text-white">NEEDS ATTENTION</span>
        </>
      );
      break;

    case "COMPENSATING":
      style = "bg-[#eef3f9] text-[#0A1B2E] border-[#557392]/40";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#557392] animate-spin">sync</span>
          <span className="font-semibold">COMPENSATING</span>
        </>
      );
      break;

    case "COMPENSATED":
      style = "bg-[#eef3f9] text-[#557392] border-[#557392]/30";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-[#557392]">undo</span>
          <span className="font-semibold">COMPENSATED</span>
        </>
      );
      break;

    case "CANCELLED":
      style = "bg-[#F2F6FB] text-[#557392]/70 border-[#557392]/20";
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
