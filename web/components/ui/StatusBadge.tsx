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
  let style = "bg-surface-container text-tertiary border-outline-variant";

  switch (norm) {
    case "PENDING":
    case "DRAFT":
    case "DRAFT_/_PENDING":
      style = "bg-surface-container text-tertiary border-[#CBD5E1]";
      content = (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          <span>{status}</span>
        </>
      );
      break;

    case "RUNNING":
    case "IN_PROGRESS":
      style = "bg-secondary-fixed text-secondary border-[#B4C5FF]";
      content = (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="font-semibold tracking-wide">RUNNING</span>
        </>
      );
      break;

    case "SUCCEEDED":
    case "COMPLETED":
      style = "bg-surface-container-high text-on-primary-fixed-variant border-[#C7D2FE]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-primary">check_circle</span>
          <span className="font-semibold">SUCCEEDED</span>
        </>
      );
      break;

    case "FAILED":
      style = "bg-error-container text-error border-[#FFDAD6]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-error">cancel</span>
          <span className="font-semibold">FAILED</span>
        </>
      );
      break;

    case "NEEDS_ATTENTION":
      style = "bg-amber-100 text-amber-900 border-amber-300";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-amber-700">warning</span>
          <span className="font-semibold">NEEDS ATTENTION</span>
        </>
      );
      break;

    case "COMPENSATING":
      style = "bg-tertiary-fixed text-tertiary border-[#B7C8E1]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px] text-tertiary animate-spin">sync</span>
          <span className="font-semibold">COMPENSATING</span>
        </>
      );
      break;

    case "COMPENSATED":
      style = "bg-primary-fixed text-on-primary-fixed-variant border-[#E2DFFF]";
      content = (
        <>
          <span className="material-symbols-outlined text-[13px]">undo</span>
          <span className="font-semibold">COMPENSATED</span>
        </>
      );
      break;

    case "CANCELLED":
      style = "bg-surface-container text-outline border-[#CBD5E1]";
      content = <span className="line-through">{status}</span>;
      break;

    default:
      content = status;
      break;
  }

  const sizeCls = size === "sm" ? "h-5 px-2 text-[10px]" : "h-6 px-2.5 text-label-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono border shadow-2xs select-none ${sizeCls} ${style} ${className}`}
    >
      {content}
    </span>
  );
}
