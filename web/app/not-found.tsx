import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | SwitchOn Telecom Orchestrator",
  description: "The requested telecom route or order sequence does not exist in SwitchOn.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#0A1B2E] shadow-xs">
        <span className="material-symbols-outlined text-[36px]">radar</span>
      </div>

      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1] text-[11px] font-mono font-bold tracking-wide uppercase">
          HTTP 404 · Route Not Found
        </div>
        <h1 className="text-[28px] font-bold text-[#0A1B2E] tracking-tight">
          Resource or Endpoint Missing
        </h1>
        <p className="text-[14px] text-[#64748B] leading-relaxed">
          The requested service activation view, order sequence, or administrative console path cannot be resolved on this SwitchOn node.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A1B2E] text-white hover:bg-[#14263b] transition-colors font-medium text-[13px] shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          <span>Return to Operations Dashboard</span>
        </Link>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#CBD5E1] text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors font-medium text-[13px] shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>Browse Orders List</span>
        </Link>
      </div>
    </div>
  );
}
