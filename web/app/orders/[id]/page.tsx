"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Order, OrderEvent, TaskRecord } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams();
  const orderId = (typeof id === "string" ? id : Array.isArray(id) ? id[0] : "") || "ORD-20260712-004217";

  const [order, setOrder] = useState<Order | null>(null);
  const [, setTasks] = useState<TaskRecord[]>([]);
  const [, setEvents] = useState<OrderEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"timeline" | "task" | "cert">("task");
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeq, setCurrentSeq] = useState(31);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(
    "Verified HLR profile 310410••••••••• deprovisioned via manual HSS command hssctl-east purge-sub --imsi 31041000004821. Resource lock released. Ticket NOC-41908."
  );
  const [verifiedCheckbox, setVerifiedCheckbox] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [dRes, eRes] = await Promise.all([
        fetch(`${apiHost}/orders/${orderId}`),
        fetch(`${apiHost}/orders/${orderId}/events`),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setOrder(d.order);
        setTasks(d.tasks || []);
      }
      if (eRes.ok) {
        setEvents(await eRes.json());
      }
    } catch {
      // Backend not running, using mock state
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 3000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleManualResolve = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiHost}/orders/${orderId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: resolutionNotes, task: "Deprovision Network" }),
      });
    } catch (e) {
      console.error(e);
    }
    setIsModalOpen(false);
    fetchDetail();
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* STICKY NEEDS_ATTENTION INTERVENTION BANNER */}
      <div className="sticky top-14 z-30 bg-white border-2 border-[#0A1B2E] rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0A1B2E] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Manual intervention required</span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#0A1B2E] text-white font-mono font-semibold">
                5 RETRIES EXHAUSTED
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] mt-0.5">
              Network deprovision failed after 5 attempts (<code className="font-mono font-semibold text-[#0A1B2E]">HLR_GATEWAY_TIMEOUT_504</code>). Saga rollback halted; downstream compensation steps are stalled.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            className="inline-flex items-center gap-1 text-label-md text-label-md text-[#0A1B2E] hover:text-[#2563EB] px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] transition-colors font-medium shadow-2xs"
            href="#hlr-portal"
          >
            <span>Open Network System</span>
            <span className="material-symbols-outlined text-[14px]">north_east</span>
          </a>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-label-md text-label-md text-[#0A1B2E] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#2563EB] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">build_circle</span>
            <span>Resolve Manually…</span>
          </button>
          <button
            onClick={async () => {
              const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
              await fetch(`${apiHost}/orders/${orderId}/retry-compensation`, { method: "POST" });
              fetchDetail();
            }}
            className="inline-flex items-center gap-1.5 text-label-md text-label-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-1.5 rounded-lg font-semibold transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Retry Compensation</span>
          </button>
        </div>
      </div>

      {/* MODAL DIALOG: RESOLVE SAGA COMPENSATION MANUALLY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-[#E2E8F0] max-w-[580px] w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0A1B2E] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">assignment_late</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Resolve Saga Compensation Manually</h3>
                  <p className="font-label-sm text-label-sm text-[#64748B] font-mono">{orderId} · Task: Deprovision Network (hlr-worker-east)</p>
                </div>
              </div>
              <button
                className="text-[#64748B] hover:text-[#0A1B2E] p-1 rounded-md transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-body-sm text-[#0A1B2E] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold font-label-sm text-label-sm text-[#0A1B2E]">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Manual Compensation Override</span>
                </div>
                <p className="leading-relaxed text-[#475569]">
                  Bypassing the automated compensation flow records this step as manually purged. You must verify subscriber IMSI <span className="font-mono font-bold text-[#0A1B2E]">310410•••••••••</span> has been removed from HLR/HSS east cluster before completing.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] flex items-center justify-between">
                  <span>Resolution Notes / Ticket Reference <span className="text-[#0A1B2E]">*</span></span>
                  <span className="text-[#64748B] font-normal font-mono">INC-88910 / JIRA-HLR-552</span>
                </label>
                <textarea
                  className="w-full text-body-sm font-mono border border-[#CBD5E1] rounded-lg p-2.5 text-[#0A1B2E] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] bg-white"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] cursor-pointer">
                <input
                  checked={verifiedCheckbox}
                  onChange={(e) => setVerifiedCheckbox(e.target.checked)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] h-4 w-4"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm text-[#0A1B2E] leading-tight">
                  I verified the system state and confirmed network resources are released manually in HLR/HSS east-01.
                </span>
              </label>
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg font-body-md text-body-md text-[#475569] hover:text-[#0A1B2E] hover:bg-white border border-[#CBD5E1] transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleManualResolve}
                className="px-4 py-2 rounded-lg font-body-md text-body-md font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Confirm Manual Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB INTERNAL LINK TRACKER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <Link
            className="hover:text-primary-container font-medium flex items-center gap-1 transition-colors"
            href="/orders"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Orders
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="font-label-md text-label-md font-semibold text-on-surface bg-surface-container-high px-2 py-0.5 rounded">
            {orderId}
          </span>
          <span className="text-outline-variant">·</span>
          <span className="text-on-surface-variant">Fiber Activation Saga (v1.18.4)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary-container"></span>
            Workflow ID:{" "}
            <span className="font-mono text-on-surface font-semibold">
              {order ? `wf-${order.order_id.toLowerCase()}` : "wf-fiber-saga-991024-aa7b"}
            </span>
          </div>
          <button
            onClick={fetchDetail}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
            title="Refresh state"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>
      </div>

      {/* 1. HEADER BAND */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-4 border border-[#E3E8F0]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Order ID & Primary Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                {orderId}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 text-on-surface-variant hover:text-primary-container hover:bg-surface-container rounded-lg transition-colors"
                id="copy-btn"
                title="Copy Order ID"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
            {/* Prominent NEEDS_ATTENTION Semantic Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A1B2E] text-white border border-[#0A1B2E] shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span className="font-label-sm text-label-sm font-bold tracking-wide uppercase">NEEDS_ATTENTION</span>
            </div>
            <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-semibold font-mono">
              COMPENSATION FAILED (5/5)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md font-medium bg-white text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors border border-[#CBD5E1] shadow-2xs">
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Replay Mode</span>
            </button>
            {/* Certificate Pending Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-medium bg-white border border-[#CBD5E1] text-[#0A1B2E] shadow-2xs"
              title="Certificate pending — order not terminal-consistent"
            >
              <span className="material-symbols-outlined text-[16px] text-[#64748B]">warning</span>
              <span>Certificate pending — order not terminal-consistent</span>
            </div>
            <a
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md font-medium text-[#0A1B2E] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors shadow-2xs"
              href="http://localhost:8233"
              target="_blank"
              rel="noreferrer"
            >
              <span>Open in Temporal</span>
              <span className="material-symbols-outlined text-[14px]">north_east</span>
            </a>
            <button
              onClick={async () => {
                const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                await fetch(`${apiHost}/orders/${orderId}/cancel`, { method: "POST" });
                fetchDetail();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md font-medium text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Cancel Order</span>
            </button>
          </div>
        </div>

        {/* Metadata Badges Strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 bg-surface-container-low/40 rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant border border-[#EDF0F5]">
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Product:</span>
            <span className="font-semibold text-on-surface">{order?.product || "Fiber Broadband 500"}</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Customer:</span>
            <span className="font-semibold text-on-surface">{order?.customer_id || "Marcus Vance"}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">(+1 555 019-4821)</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Client Ref:</span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">EXT-CRM-991024</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Created:</span>
            <span className="font-label-sm text-label-sm text-on-surface">2026-07-12 14:22:04 UTC</span>
            <span className="text-on-surface-variant">(8m 14s ago)</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="material-symbols-outlined text-[16px] text-primary-container">timer</span>
            <span className="font-label-sm text-label-sm text-primary-container font-bold px-2 py-0.5 rounded bg-surface-container">
              Elapsed: 4.82s
            </span>
          </div>
        </div>
      </div>

      {/* 2. TIME-TRAVEL REPLAY SCRUBBER */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3 border border-[#E3E8F0]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-[#E2E8F0]">
              <button
                onClick={() => setCurrentSeq(Math.max(1, currentSeq - 1))}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded transition-colors"
                title="Step Back"
              >
                <span className="material-symbols-outlined text-[18px]">skip_previous</span>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 bg-[#0A1B2E] text-white rounded transition-colors shadow-xs"
                title="Halted"
              >
                <span className="material-symbols-outlined text-[18px]">pause</span>
              </button>
              <button
                onClick={() => setCurrentSeq(Math.min(42, currentSeq + 1))}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded transition-colors"
                title="Step Forward"
              >
                <span className="material-symbols-outlined text-[18px]">skip_next</span>
              </button>
            </div>
            {/* Speed Selector Pills */}
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 text-label-sm font-label-sm border border-[#E2E8F0]">
              <button
                onClick={() => setPlaybackSpeed(1)}
                className={`px-2 py-1 rounded transition-colors ${
                  playbackSpeed === 1 ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-on-surface-variant"
                }`}
              >
                1×
              </button>
              <button
                onClick={() => setPlaybackSpeed(2)}
                className={`px-2 py-1 rounded transition-colors ${
                  playbackSpeed === 2 ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-on-surface-variant"
                }`}
              >
                2×
              </button>
              <button
                onClick={() => setPlaybackSpeed(4)}
                className={`px-2 py-1 rounded transition-colors ${
                  playbackSpeed === 4 ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-on-surface-variant"
                }`}
              >
                4×
              </button>
            </div>
            <span className="text-outline-variant">|</span>
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              Seq {currentSeq} <span className="text-on-surface-variant font-normal">/ 42</span>
            </span>
          </div>

          {/* Scrubber Label / Status Alert */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1 rounded-full text-label-sm font-label-sm text-[#0A1B2E] shadow-2xs">
            <span className="material-symbols-outlined text-[15px] text-[#0A1B2E]">error</span>
            <span>
              Seq {currentSeq}: <span className="font-bold font-mono text-[#0A1B2E]">saga.compensation_failed</span> · Deprovision Network (HLR Gateway 504 Gateway Timeout)
            </span>
          </div>

          {/* Jump & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSeq(31)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-label-sm font-label-sm font-semibold bg-[#0A1B2E] text-white hover:bg-[#1E293B] transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px]">report_problem</span>
              <span>Jump to Compensation Halt</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-label-sm font-label-sm font-medium bg-white text-[#0A1B2E] border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E] animate-ping"></span>
              <span>Waiting on NOC</span>
            </button>
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        <div className="relative pt-2 pb-1">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPercent = (e.clientX - rect.left) / rect.width;
              setCurrentSeq(Math.max(1, Math.round(clickPercent * 42)));
            }}
            className="w-full h-2 bg-[#F1F5F9] rounded-full relative cursor-pointer overflow-hidden border border-[#CBD5E1]"
          >
            <div className="absolute left-0 top-0 bottom-0 bg-[#0A1B2E] rounded-l-full" style={{ width: "55%" }}></div>
            <div className="absolute top-0 bottom-0 bg-[#475569]" style={{ left: "55%", width: "3%" }}></div>
            <div className="absolute top-0 bottom-0 bg-[#0A1B2E]" style={{ left: "58%", width: "14%" }}></div>
            <div className="absolute top-0 bottom-0 bg-[#CBD5E1]" style={{ left: "72%", width: "28%" }}></div>
          </div>
          {/* Playhead Thumb Indicator placed exactly at halt point */}
          <div
            className="absolute top-1 -ml-2 flex flex-col items-center pointer-events-none transition-all"
            style={{ left: `${(currentSeq / 42) * 100}%` }}
          >
            <div className="w-4 h-4 bg-[#0A1B2E] border-2 border-white rounded-full shadow-md animate-pulse"></div>
          </div>
          {/* Timeline Tick Marks */}
          <div className="flex justify-between items-center px-1 pt-1.5 font-label-sm text-label-sm text-[#64748B] font-mono">
            <span>0.00s (Validate)</span>
            <span>1.20s (Parallel Fork)</span>
            <span className="text-[#0A1B2E] font-semibold">3.62s (OCS Fail)</span>
            <span className="text-[#0A1B2E] font-bold">5.94s (HLR Retry 5× Fail)</span>
            <span className="text-[#64748B]">Halted: Rollback Blocked</span>
            <span className="text-[#64748B]">Target: 42 (Unreachable)</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: REGION A & REGION B */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* REGION (A) - CENTER GRAPH CANVAS (8 cols) */}
        <div className="col-span-12 xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col h-[640px] relative overflow-hidden border border-[#E3E8F0]">
          {/* Canvas Header & Toolbar */}
          <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-surface-container-lowest border-b border-[#EDF0F5]">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-primary-container">account_tree</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Execution DAG &amp; Saga Compensation Graph
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono">
                Temporal v1.18.4
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 border border-[#E2E8F0]">
              <button className="p-1 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Zoom In">
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              <button className="p-1 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Zoom Out">
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <button className="p-1 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Fit to Screen">
                <span className="material-symbols-outlined text-[18px]">fit_screen</span>
              </button>
              <span className="text-outline-variant mx-1">|</span>
              <button className="p-1 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Toggle Grid">
                <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
              </button>
              <button className="p-1 bg-surface-container-lowest text-primary font-bold rounded shadow-xs" title="Minimap Toggle">
                <span className="material-symbols-outlined text-[18px]">map</span>
              </button>
            </div>
          </div>

          {/* Canvas Body with Dot Grid Pattern */}
          <div
            className="flex-1 relative overflow-auto p-6"
            style={{
              backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              backgroundColor: "#FFFFFF",
            }}
          >
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrow-green" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
                  <path d="M0,0 L0,6 L6,3 z" fill="#0A1B2E" />
                </marker>
                <marker id="arrow-red" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
                  <path d="M0,0 L0,6 L6,3 z" fill="#0A1B2E" />
                </marker>
                <marker id="arrow-orange" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
                  <path d="M0,0 L0,6 L6,3 z" fill="#0A1B2E" />
                </marker>
                <marker id="arrow-gray" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
                  <path d="M0,0 L0,6 L6,3 z" fill="#CBD5E1" />
                </marker>
              </defs>
              <path d="M 180 180 C 220 180, 220 100, 250 100" fill="none" markerEnd="url(#arrow-green)" stroke="#0A1B2E" strokeWidth="2" />
              <path d="M 180 180 C 220 180, 220 260, 250 260" fill="none" markerEnd="url(#arrow-green)" stroke="#0A1B2E" strokeWidth="2" />
              <path d="M 420 100 L 460 100" fill="none" markerEnd="url(#arrow-green)" stroke="#0A1B2E" strokeWidth="2" />
              <path d="M 630 100 L 670 100" fill="none" markerEnd="url(#arrow-green)" stroke="#0A1B2E" strokeWidth="2" />
              <path d="M 840 100 C 860 100, 860 180, 880 180" fill="none" markerEnd="url(#arrow-red)" stroke="#0A1B2E" strokeWidth="2" />
              <path d="M 420 260 C 650 260, 850 210, 880 180" fill="none" markerEnd="url(#arrow-red)" stroke="#0A1B2E" strokeWidth="2" />
              <path className="animate-pulse" d="M 965 220 C 965 370, 750 370, 630 370" fill="none" markerEnd="url(#arrow-orange)" stroke="#0A1B2E" strokeDasharray="4 4" strokeWidth="2.5" />
              <path d="M 460 370 L 420 370" fill="none" markerEnd="url(#arrow-gray)" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="2" />
              <path d="M 250 370 L 210 370" fill="none" markerEnd="url(#arrow-gray)" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="2" />
              <path d="M 125 410 C 125 480, 200 480, 250 480" fill="none" markerEnd="url(#arrow-gray)" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="2" />
            </svg>

            {/* GRAPH NODES CONTAINER */}
            <div className="relative w-[1100px] h-[540px]">
              {/* NODE 1: VALIDATE ORDER [OMS] */}
              <div className="absolute left-[10px] top-[145px] w-[170px] h-[74px] bg-white rounded-lg shadow-2xs p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-[#CBD5E1]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[#0A1B2E]">OMS</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#0A1B2E] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>SUCCEEDED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-semibold text-[#0A1B2E] truncate">Validate Order</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span>Task #1</span>
                  <span>220ms</span>
                </div>
              </div>

              {/* BRANCH A - NODE 2: RESERVE INVENTORY [SIM] */}
              <div className="absolute left-[250px] top-[65px] w-[170px] h-[74px] bg-white rounded-lg shadow-2xs p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-[#CBD5E1]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[#0A1B2E]">SIM/eSIM</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#0A1B2E] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>SUCCEEDED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-semibold text-[#0A1B2E] truncate">Reserve Inventory</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span>Branch A</span>
                  <span>340ms</span>
                </div>
              </div>

              {/* BRANCH A - NODE 3: PROVISION NETWORK [HLR/HSS] */}
              <div className="absolute left-[460px] top-[65px] w-[170px] h-[74px] bg-white rounded-lg shadow-2xs p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-[#CBD5E1]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[#0A1B2E]">HLR/HSS</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#0A1B2E] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>SUCCEEDED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-semibold text-[#0A1B2E] truncate">Provision Network</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span>hlr-east-01</span>
                  <span>1.42s</span>
                </div>
              </div>

              {/* BRANCH A - NODE 4: VERIFY SERVICE [NETWORK] */}
              <div className="absolute left-[670px] top-[65px] w-[170px] h-[74px] bg-white rounded-lg shadow-2xs p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-[#CBD5E1]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[#0A1B2E]">Network</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#0A1B2E] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>SUCCEEDED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-semibold text-[#0A1B2E] truncate">Verify Service</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span>Ping/Radius</span>
                  <span>610ms</span>
                </div>
              </div>

              {/* BRANCH B - NODE 5: CREATE BILLING ACCOUNT [OCS] */}
              <div className="absolute left-[250px] top-[225px] w-[170px] h-[74px] bg-white rounded-lg shadow-2xs p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-[#CBD5E1]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[#0A1B2E]">OCS</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#0A1B2E] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>SUCCEEDED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-semibold text-[#0A1B2E] truncate">Create Billing Acct</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span>Branch B</span>
                  <span>420ms</span>
                </div>
              </div>

              {/* CONVERGENCE NODE: START CHARGING [OCS RATING] - FAILED */}
              <div className="absolute left-[880px] top-[145px] w-[180px] h-[78px] bg-white rounded-lg shadow-md p-2.5 flex flex-col justify-between ring-1 ring-[#0A1B2E] cursor-pointer border border-[#CBD5E1]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[#0A1B2E] font-semibold">OCS Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="font-label-sm text-label-sm px-1 py-0.2 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-bold">×3</span>
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#0A1B2E] font-bold">FAILED</span>
                  </div>
                </div>
                <div className="font-body-md text-body-md font-bold text-[#0A1B2E] truncate">Start Charging</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span className="truncate max-w-[100px]">OCS 500: Timeout</span>
                  <span>3.00s</span>
                </div>
              </div>

              {/* SAGA COMPENSATION NODE 1: DEPROVISION NETWORK [HLR/HSS] - COMPENSATION_FAILED (Target) */}
              <div className="absolute left-[460px] top-[335px] w-[180px] h-[78px] bg-white rounded-lg shadow-md p-2.5 flex flex-col justify-between ring-2 ring-[#0A1B2E] cursor-pointer border border-[#0A1B2E]" style={{ borderLeft: "4px solid #0A1B2E" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-[#0A1B2E] font-mono text-white font-bold">HLR/HSS</span>
                  <div className="flex items-center gap-1">
                    <span className="font-label-sm text-label-sm px-1 py-0.2 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-bold">5× Fail</span>
                    <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm text-[#0A1B2E] font-bold">
                      <span className="material-symbols-outlined text-[13px]">warning</span>FAILED
                    </span>
                  </div>
                </div>
                <div className="font-body-md text-body-md font-bold text-[#0A1B2E] truncate flex items-center gap-1">
                  <span>Deprovision Network</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] font-mono">
                  <span className="font-semibold truncate max-w-[100px]">504 Gateway Timeout</span>
                  <span>5.94s</span>
                </div>
              </div>

              {/* INTERACTIVE HOVER TOOLTIP OVERLAY (Attached above Deprovision Network) */}
              <div className="absolute left-[400px] top-[245px] w-[360px] bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-3 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5 text-label-sm font-label-sm font-bold text-[#0A1B2E] mb-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>Rollback Stalled: Deprovision Network Failed</span>
                </div>
                <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
                  Compensation halted at <span className="font-mono font-bold text-[#0A1B2E]">Deprovision Network (5 retries exhausted)</span>. Subsequent rollbacks <span className="font-mono text-[#64748B]">Release Inventory (WAITING)</span> and <span className="font-mono text-[#64748B]">Void Billing (WAITING)</span> are paused until operator resolves.
                </p>
              </div>

              {/* SAGA COMPENSATION NODE 2: RELEASE INVENTORY [SIM/eSIM] - STALLED */}
              <div className="absolute left-[250px] top-[335px] w-[170px] h-[74px] bg-[#F8FAFC] opacity-75 rounded-lg shadow-xs p-2.5 flex flex-col justify-between cursor-not-allowed border border-[#CBD5E1]" style={{ borderLeft: "4px solid #CBD5E1" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface-variant">SIM/eSIM</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#64748B] font-semibold">
                    <span className="material-symbols-outlined text-[12px]">pause_circle</span>STALLED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-medium text-on-surface-variant truncate">Release Inventory</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-outline font-mono">
                  <span>Compensation #2</span>
                  <span>blocked</span>
                </div>
              </div>

              {/* SAGA COMPENSATION NODE 3: VOID BILLING ACCOUNT [OCS] - STALLED */}
              <div className="absolute left-[40px] top-[335px] w-[170px] h-[74px] bg-[#F8FAFC] opacity-75 rounded-lg shadow-xs p-2.5 flex flex-col justify-between cursor-not-allowed border border-[#CBD5E1]" style={{ borderLeft: "4px solid #CBD5E1" }}>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface-variant">OCS</span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#64748B] font-semibold">
                    <span className="material-symbols-outlined text-[12px]">pause_circle</span>STALLED
                  </span>
                </div>
                <div className="font-body-md text-body-md font-medium text-on-surface-variant truncate">Void Billing Account</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-outline font-mono">
                  <span>Compensation #3</span>
                  <span>blocked</span>
                </div>
              </div>

              {/* BEST-EFFORT NODE: NOTIFY CUSTOMER [SMS-C] */}
              <div className="absolute left-[250px] top-[445px] w-[170px] h-[74px] bg-white opacity-70 rounded-lg shadow-xs p-2.5 flex flex-col justify-between border-dashed border-2 border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface-variant">SMS-C</span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">best-effort</span>
                </div>
                <div className="font-body-md text-body-md font-semibold text-on-surface truncate">Notify Customer</div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
                  <span>PAUSED / WAITING</span>
                  <span>--</span>
                </div>
              </div>
            </div>

            {/* Mini-Map Preview Box (Bottom Right) */}
            <div className="absolute bottom-4 right-4 w-44 h-28 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xs border border-[#CBD5E1] p-1.5 flex flex-col justify-between pointer-events-none">
              <div className="flex items-center justify-between font-label-sm text-label-sm text-[#0A1B2E]">
                <span>Graph Minimap</span>
                <span className="text-[10px] text-[#0A1B2E] font-bold">HALT</span>
              </div>
              <div className="relative w-full h-20 bg-[#F8FAFC] rounded flex items-center justify-center overflow-hidden border border-[#E2E8F0]">
                <div className="absolute left-2 top-6 w-5 h-2 bg-[#0A1B2E] rounded-xs"></div>
                <div className="absolute left-9 top-3 w-5 h-2 bg-[#0A1B2E] rounded-xs"></div>
                <div className="absolute left-16 top-3 w-5 h-2 bg-[#0A1B2E] rounded-xs"></div>
                <div className="absolute left-23 top-3 w-5 h-2 bg-[#0A1B2E] rounded-xs"></div>
                <div className="absolute left-30 top-6 w-5 h-2 bg-[#475569] rounded-xs"></div>
                <div className="absolute left-16 top-11 w-5 h-2 bg-[#0A1B2E] rounded-xs animate-ping"></div>
                <div className="absolute left-9 top-11 w-5 h-2 bg-[#CBD5E1] rounded-xs"></div>
                <div className="absolute inset-1 rounded" style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.05)" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* REGION (B) - RIGHT INSPECTION PANEL (4 cols) */}
        <div className="col-span-12 xl:col-span-4 bg-white rounded-xl shadow-2xs flex flex-col h-[640px] overflow-hidden border border-[#CBD5E1]">
          {/* Tabs Navigation */}
          <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-white border-b border-[#E2E8F0]">
            <div className="flex items-center gap-6 h-full font-body-md text-body-md">
              <button
                onClick={() => setActiveRightTab("timeline")}
                className={`h-full flex items-center transition-colors ${
                  activeRightTab === "timeline" ? "text-[#2563EB] font-semibold relative" : "text-[#64748B] hover:text-[#0A1B2E] font-medium"
                }`}
              >
                Timeline (27)
                {activeRightTab === "timeline" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full"></span>}
              </button>
              <button
                onClick={() => setActiveRightTab("task")}
                className={`h-full flex items-center transition-colors ${
                  activeRightTab === "task" ? "text-[#2563EB] font-semibold relative" : "text-[#64748B] hover:text-[#0A1B2E] font-medium"
                }`}
              >
                Task Detail
                {activeRightTab === "task" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full"></span>}
              </button>
              <button
                onClick={() => setActiveRightTab("cert")}
                className={`h-full flex items-center transition-colors ${
                  activeRightTab === "cert" ? "text-[#2563EB] font-semibold relative" : "text-[#64748B] hover:text-[#0A1B2E] font-medium"
                }`}
              >
                Certificate
                {activeRightTab === "cert" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full"></span>}
              </button>
            </div>
            <button className="p-1 text-[#64748B] hover:text-[#0A1B2E] hover:bg-[#F8FAFC] rounded transition-colors" title="Expand panel">
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Certificate Pending Notice Banner */}
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg flex items-start gap-2.5 text-[#0A1B2E]">
              <span className="material-symbols-outlined text-[18px] text-[#0A1B2E] shrink-0 mt-0.5">report</span>
              <div className="space-y-0.5">
                <div className="font-label-sm text-label-sm font-bold">Certificate pending — order not terminal-consistent</div>
                <p className="font-body-sm text-body-sm text-[#475569]">Execution cryptographic proof cannot be sealed while saga compensation is incomplete.</p>
              </div>
            </div>

            {/* Selected Task Header Banner: Deprovision Network (HLR) */}
            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0A1B2E] font-mono border border-[#CBD5E1]">
                  Network / HLR/HSS East
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#0A1B2E] text-white font-bold">
                  <span className="material-symbols-outlined text-[13px]">warning</span>COMPENSATION_FAILED
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Deprovision Network</h3>
                <p className="font-label-sm text-label-sm text-[#64748B] font-mono mt-0.5">
                  Workflow: <span className="text-[#0A1B2E] select-all">hlr-deprovision-worker-east · #comp-01</span>
                </p>
              </div>
            </div>

            {/* Attempts Table (5/5 Exceeded) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Execution Attempts (5/5 Exceeded)</span>
                <span className="font-label-sm text-label-sm text-[#64748B] font-semibold">Exponential Backoff</span>
              </div>
              <div className="rounded-lg overflow-hidden font-body-sm text-body-sm border border-[#CBD5E1]">
                <div className="bg-[#F8FAFC] px-3 py-1.5 flex justify-between font-label-sm text-label-sm font-semibold text-[#64748B]">
                  <span>Attempt</span>
                  <span>Duration</span>
                  <span>Result &amp; Code</span>
                </div>
                <div className="bg-white px-3 py-1.5 flex items-center justify-between font-mono text-label-sm border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A1B2E]">#1</span>
                    <span className="text-[#0A1B2E] px-1 py-0.2 rounded bg-[#F1F5F9] border border-[#CBD5E1] font-sans text-xs">TIMEOUT</span>
                  </div>
                  <span className="text-[#64748B]">1,000ms</span>
                  <span className="text-[#0A1B2E]">HTTP 504 Timeout</span>
                </div>
                <div className="bg-[#F8FAFC]/50 px-3 py-1.5 flex items-center justify-between font-mono text-label-sm border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A1B2E]">#2</span>
                    <span className="text-[#0A1B2E] px-1 py-0.2 rounded bg-[#F1F5F9] border border-[#CBD5E1] font-sans text-xs">TIMEOUT</span>
                  </div>
                  <span className="text-[#64748B]">2,000ms</span>
                  <span className="text-[#0A1B2E]">HTTP 504 Timeout</span>
                </div>
                <div className="bg-white px-3 py-1.5 flex items-center justify-between font-mono text-label-sm border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A1B2E]">#3</span>
                    <span className="text-[#0A1B2E] px-1 py-0.2 rounded bg-[#F1F5F9] border border-[#CBD5E1] font-sans text-xs">TIMEOUT</span>
                  </div>
                  <span className="text-[#64748B]">4,000ms</span>
                  <span className="text-[#0A1B2E]">HTTP 504 Timeout</span>
                </div>
                <div className="bg-[#F8FAFC]/50 px-3 py-1.5 flex items-center justify-between font-mono text-label-sm border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A1B2E]">#4</span>
                    <span className="text-[#0A1B2E] px-1 py-0.2 rounded bg-[#F1F5F9] border border-[#CBD5E1] font-sans text-xs">TIMEOUT</span>
                  </div>
                  <span className="text-[#64748B]">8,000ms</span>
                  <span className="text-[#0A1B2E]">HTTP 504 Timeout</span>
                </div>
                <div className="bg-[#F1F5F9] px-3 py-1.5 flex items-center justify-between font-mono text-label-sm font-semibold text-[#0A1B2E]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A1B2E]">#5</span>
                    <span className="text-white px-1 py-0.2 rounded bg-[#0A1B2E] font-sans text-xs">EXHAUSTED</span>
                  </div>
                  <span>16,000ms</span>
                  <span>504 Gateway Timeout</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Payload (HLR Driver) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Diagnostic Payload (HLR Driver)</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(JSON.stringify({
                    action: "deprovision_network_profile",
                    imsi: "310410•••••••••",
                    hlr_node: "hlr-east-01.switchon.internal",
                    error_code: "HLR_UPSTREAM_UNRESPONSIVE",
                    circuit_breaker: "HALF_OPEN",
                    retries_attempted: 5
                  }, null, 2))}
                  className="font-label-sm text-label-sm text-[#2563EB] font-medium hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  Copy JSON
                </button>
              </div>
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-3 font-label-sm text-label-sm font-mono text-[#0A1B2E] overflow-x-auto leading-relaxed">
                <span className="text-[#64748B]">&#123;</span><br />
                &nbsp;&nbsp;<span className="text-[#0A1B2E]">&quot;action&quot;</span><span className="text-[#64748B]">:</span> <span className="text-[#475569]">&quot;deprovision_network_profile&quot;</span><span className="text-[#64748B]">,</span><br />
                &nbsp;&nbsp;<span className="text-[#0A1B2E]">&quot;imsi&quot;</span><span className="text-[#64748B]">:</span> <span className="text-[#475569]">&quot;310410•••••••••&quot;</span><span className="text-[#64748B]">,</span><br />
                &nbsp;&nbsp;<span className="text-[#0A1B2E]">&quot;hlr_node&quot;</span><span className="text-[#64748B]">:</span> <span className="text-[#475569]">&quot;hlr-east-01.switchon.internal&quot;</span><span className="text-[#64748B]">,</span><br />
                &nbsp;&nbsp;<span className="text-[#0A1B2E]">&quot;error_code&quot;</span><span className="text-[#64748B]">:</span> <span className="text-[#0A1B2E] font-bold">&quot;HLR_UPSTREAM_UNRESPONSIVE&quot;</span><span className="text-[#64748B]">,</span><br />
                &nbsp;&nbsp;<span className="text-[#0A1B2E]">&quot;circuit_breaker&quot;</span><span className="text-[#64748B]">:</span> <span className="text-[#0A1B2E]">&quot;HALF_OPEN&quot;</span><span className="text-[#64748B]">,</span><br />
                &nbsp;&nbsp;<span className="text-[#0A1B2E]">&quot;retries_attempted&quot;</span><span className="text-[#64748B]">:</span> <span className="text-[#0A1B2E]">5</span><br />
                <span className="text-[#64748B]">&#125;</span>
              </div>
            </div>

            {/* Timeline / Audit Events */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Timeline / Audit Events</span>
                <span className="font-label-sm text-label-sm text-[#64748B] font-mono">UTC Synchronized</span>
              </div>
              <div className="space-y-1.5 font-mono text-label-sm">
                <div className="p-2 rounded bg-white border border-[#CBD5E1] flex flex-col gap-1 text-[#0A1B2E] shadow-2xs">
                  <div className="flex items-center justify-between font-semibold text-[#0A1B2E]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0A1B2E]"></span>
                      <span>14:22:09.112 UTC</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-[#F1F5F9] border border-[#CBD5E1] text-[#0A1B2E]">saga.compensation_failed</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#475569] font-sans leading-tight">
                    Deprovision Network failed after 5 exponential backoff attempts (HLR_GATEWAY_TIMEOUT_504). Circuit breaker tripped to HALF-OPEN.
                  </p>
                </div>
                <div className="p-2 rounded bg-white border border-[#CBD5E1] flex items-center justify-between text-[#0A1B2E] shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0A1B2E]"></span>
                    <span>14:22:09.120</span>
                  </div>
                  <span className="font-sans font-semibold text-xs">alert.operator_intervention_required</span>
                  <span className="font-sans text-[11px] text-[#64748B]">(NOC Tier 2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REGION (C) - BOTTOM FULL-WIDTH CARD: ROOT-CAUSE EXPLAINER */}
      <div className="bg-white rounded-xl shadow-2xs p-5 space-y-4 border border-[#CBD5E1]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#0A1B2E]">psychology</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Root-Cause Explainer &amp; Automated Triage</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A1B2E] text-white font-label-sm text-label-sm font-bold shadow-2xs">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>Action Required</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-mono font-semibold">
              SLA Alert: +182s residual resource lock
            </span>
          </div>
        </div>

        {/* 3-Column Grid: Cause / Impact / Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. CAUSE */}
          <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#0A1B2E] font-semibold font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>1. CAUSE</span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
              HLR gateway timed out across 5 retry attempts during network deprovisioning saga rollback. Gateway node <code className="font-mono font-semibold text-[#0A1B2E]">hlr-east-01</code> stopped responding to gRPC health checks (<code className="font-mono text-[#0A1B2E]">HLR_UPSTREAM_UNRESPONSIVE</code>).
            </p>
          </div>

          {/* 2. IMPACT */}
          <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#0A1B2E] font-semibold font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">report</span>
              <span>2. IMPACT</span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
              <span className="font-semibold text-[#0A1B2E]">Critical:</span> Active SIM/HLR resource orphaned in network core. Subscriber disconnected but HLR profile not purged. <span className="font-mono font-bold text-[#0A1B2E]">1 residual HLR resource lock</span> preventing order termination.
            </p>
          </div>

          {/* 3. RECOMMENDED ACTION */}
          <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#0A1B2E] font-semibold font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">handyman</span>
              <span>3. RECOMMENDED ACTION</span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
              Manual intervention required. Verify HLR profile status via <span className="font-semibold text-[#0A1B2E]">Network Admin Portal</span>, purge subscriber record, and mark compensation resolved via <span className="font-semibold text-[#2563EB]">Resolve Manually…</span> above.
            </p>
          </div>
        </div>

        {/* Explainer Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 font-label-sm text-label-sm text-[#64748B] font-mono">
            <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">pending_actions</span>
            <span>Reconciliation state: Inconsistent (1 orphaned Core Network record)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors shadow-2xs">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>View Audit Log</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-body-md text-body-md font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">handyman</span>
              <span>Resolve Compensation Manually</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
