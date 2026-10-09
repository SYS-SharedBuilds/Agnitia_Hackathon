"use client";

import { useEffect, useState } from "react";
import { InteractiveActivationTrendChart } from "@/components/charts/InteractiveActivationTrendChart";
import Link from "next/link";
import { MetricsSummary, Order } from "@/lib/types";
import { MOCK_OPERATIONAL_KPIS, MOCK_ORDERS } from "@/lib/mockData";

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(MOCK_OPERATIONAL_KPIS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "running" | "succeeded" | "rolling-back" | "rolled-back" | "needs-attention">("all");
  const [filterQuery, setFilterQuery] = useState("");

  const fetchState = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [mRes, oRes] = await Promise.all([
        fetch(`${apiHost}/metrics/summary`),
        fetch(`${apiHost}/orders?limit=25`),
      ]);
      if (mRes.ok) {
        setMetrics(await mRes.json());
        setIsLiveBackend(true);
      }
      if (oRes.ok) {
        const liveOrders = await oRes.json();
        if (liveOrders.length > 0) {
          setOrders(liveOrders);
          setIsLiveBackend(true);
        }
      }
    } catch {
      // Backend not running, preserves central MOCK_OPERATIONAL_KPIS and MOCK_ORDERS
    }
  };

  useEffect(() => {
    fetchState();
    if (isPaused) return;
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Orders mapping prioritizing real backend or central realistic telecom data
  const displayOrders = orders.map((o, idx) => ({
    id: o.order_id,
    customer: (o.payload?.customer_name as string) || o.customer_id,
    msisdn: (o.payload?.msisdn as string) || "+1 555 019-4821",
    product: o.product || "Fiber Broadband 500",
    status: (o.state as string),
    statusKey: (o.state as string) === "ACTIVE" ? "succeeded" : (o.state as string) === "ROLLING_BACK" ? "rolling-back" : (o.state as string) === "ROLLED_BACK" ? "rolled-back" : (o.state as string) === "NEEDS_ATTENTION" ? "needs-attention" : "running",
    step: o.current_step || "HLR Provisioning",
    duration: o.activation_ms ? `${(o.activation_ms / 1000).toFixed(1)}s` : "2.4s",
    created: "Just now",
    cert: (o.state as string) === "ACTIVE" ? "verified" : (o.state as string) === "NEEDS_ATTENTION" ? "error" : "pending",
    segments: (o.state as string) === "ACTIVE"
      ? ["success", "success", "success", "success", "success"]
      : (o.state as string) === "ROLLED_BACK"
      ? ["compensated", "compensated", "compensated", "idle", "idle"]
      : (o.state as string) === "NEEDS_ATTENTION"
      ? ["success", "success", "error", "idle", "idle"]
      : ["success", "success", "running", "idle", "idle"],
    isLive: isLiveBackend && idx === 0,
  }));

  const filteredOrders = displayOrders.filter((ord) => {
    if (activeTab !== "all" && ord.statusKey !== activeTab) return false;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.customer.toLowerCase().includes(q) ||
        ord.product.toLowerCase().includes(q) ||
        ord.step.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
            SUCCEEDED
          </span>
        );
      case "RUNNING":
      case "EXECUTING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#0A1B2E] shadow-2xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0A1B2E]"></span>
            </span>
            RUNNING
          </span>
        );
      case "RETRYING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]"></span>
            RETRYING
          </span>
        );
      case "ROLLING_BACK":
      case "COMPENSATING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
            ROLLING_BACK
          </span>
        );
      case "COMPENSATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-medium bg-white text-[#64748B] border border-[#E2E8F0] shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]"></span>
            COMPENSATED
          </span>
        );
      case "NEEDS_ATTENTION":
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#0A1B2E] text-white border border-[#0A1B2E] shadow-2xs">
            <span className="material-symbols-outlined text-[12px] text-white">warning</span>
            NEEDS_ATTENTION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-medium bg-white text-[#64748B] border border-[#E2E8F0]">
            {status}
          </span>
        );
    }
  };

  const renderSegment = (type: string, idx: number) => {
    switch (type) {
      case "success":
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#0A1B2E]" />;
      case "running":
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#0A1B2E] animate-pulse" />;
      case "retrying":
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#64748B] animate-pulse" />;
      case "compensating":
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#0A1B2E]" />;
      case "compensated":
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#94A3B8]" />;
      case "attention":
      case "error":
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#0A1B2E]" />;
      default:
        return <span key={idx} className="h-2 w-2.5 rounded-xs bg-[#E2E8F0]" />;
    }
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E3E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-bold text-[#0A1B2E] tracking-tight">Operations Overview</h1>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2.5 py-0.5 rounded-full font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[13px]">account_tree</span>
              TEMPORAL DAG v1.18.4
            </span>
          </div>
          <p className="text-[13px] text-[#64748B]">
            Automated provisioning workflows, saga compensations, and network fallout triage across telecom fabric.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Auto-refresh Toggle Button */}
          <div className="inline-flex items-center p-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[#0A1B2E] text-[11.5px] font-mono">
              {!isPaused && (
                <span className="relative flex h-2 w-2" id="refresh-pulse">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A1B2E]"></span>
                </span>
              )}
              <span id="refresh-label">{isPaused ? "Paused" : "Auto-refresh: 5s"}</span>
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#0A1B2E] hover:bg-[#F1F5F9] rounded text-[11.5px] font-medium transition-colors shadow-2xs"
              id="pause-live-btn"
            >
              {isPaused ? "Resume updates" : "Pause live updates"}
            </button>
          </div>

          {/* Export Telemetry */}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify({ metrics, orders: displayOrders }, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `telemetry-overview-${Date.now()}.json`;
              a.click();
            }}
            className="inline-flex items-center gap-1.5 bg-[#0A1B2E] text-white hover:bg-[#14263b] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Telemetry</span>
          </button>
        </div>
      </div>

      {/* 3. TOP ROW: EXACTLY 6 WHITE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        {/* CARD 1: Orders Today */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Orders Today</span>
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">1,284</span>
            <span className="text-[11px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">+8.4%</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] text-[#64748B]">vs prev hour</span>
            <svg className="w-16 h-4" viewBox="0 0 64 16">
              <path d="M0 13 Q 15 14, 25 10 T 45 6 T 64 2" fill="none" stroke="#0A1B2E" strokeLinecap="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* CARD 2: Success Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Success Rate</span>
            <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">check_circle</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
              {metrics ? `${metrics.success_rate}%` : "98.6%"}
            </span>
            <span className="text-[11px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">+0.2%</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1F5F9]">
            <span className="text-[10px] text-[#94A3B8] truncate" title="excludes cancelled">excludes cancelled</span>
            <svg className="w-16 h-4" viewBox="0 0 64 16">
              <path d="M0 11 Q 20 12, 35 7 T 50 6 T 64 3" fill="none" stroke="#0A1B2E" strokeLinecap="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* CARD 3: Activation p50 / p95 / p99 */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold truncate">Activation p50 / 95 / 99</span>
            <span className="material-symbols-outlined text-[16px]">speed</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold font-mono text-[#0A1B2E] tracking-tight">
              {metrics ? `${(metrics.p50_activation_ms/1000).toFixed(1)}s / ${(metrics.p95_activation_ms/1000).toFixed(1)}s / ${(metrics.p99_activation_ms/1000).toFixed(1)}s` : "2.8s / 5.4s / 8.1s"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1 py-0.5 rounded font-mono">-0.4s vs prev hr</span>
            <svg className="w-14 h-4" viewBox="0 0 56 16">
              <path d="M0 4 Q 18 6, 28 9 T 45 11 T 56 13" fill="none" stroke="#0A1B2E" strokeLinecap="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* CARD 4: Consistency Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Consistency Rate</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.2 rounded-full font-mono">
              <span className="material-symbols-outlined text-[12px]">verified_user</span> Verified
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">100%</span>
            <span className="text-[11px] font-mono text-[#64748B]">0.0% drift</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] text-[#64748B]">vs prev hour</span>
            <svg className="w-16 h-4" viewBox="0 0 64 16">
              <line stroke="#0A1B2E" strokeLinecap="round" strokeWidth="2" x1="0" x2="64" y1="8" y2="8"></line>
            </svg>
          </div>
        </div>

        {/* CARD 5: Rolled Back */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Rolled Back</span>
            <span className="material-symbols-outlined text-[16px] text-[#64748B]">undo</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
              {metrics?.rolled_back_orders ?? 17}
            </span>
            <span className="text-[11px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">-3 prev hr</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] text-[#64748B]">Saga clean rollbacks</span>
            <svg className="w-16 h-4" viewBox="0 0 64 16">
              <path d="M0 4 Q 20 8, 35 9 T 50 11 T 64 13" fill="none" stroke="#64748B" strokeLinecap="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* CARD 6: Needs Attention (Clickable -> Fallout Queue) */}
        <Link
          href="/fallout"
          className="group bg-white border border-[#E2E8F0] hover:border-[#0A1B2E] hover:bg-[#F8FAFC] rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#0A1B2E] mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Needs Attention</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
              {metrics?.needs_attention_orders ?? 2}
            </span>
            <span className="text-[11px] font-semibold text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">+1 vs prev hr</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] text-[#0A1B2E] font-medium group-hover:underline">View Fallout Queue</span>
            <svg className="w-14 h-4" viewBox="0 0 56 16">
              <path d="M0 12 Q 15 10, 25 11 T 42 6 T 56 3" fill="none" stroke="#0A1B2E" strokeLinecap="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </Link>
      </div>

      {/* 4. MIDDLE ROW: ACTIVATION TIME TREND (8 COLS) + ORDER OUTCOMES (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 8 COLS: Line Chart Card */}
        <div className="lg:col-span-8 bg-white border border-[#E3E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <InteractiveActivationTrendChart />
        </div>

        {/* RIGHT 4 COLS: Order Outcomes Stacked Bar Card */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-[15px] font-bold text-[#0A1B2E] tracking-tight">Order outcomes (Today: 1,284)</h3>
              <span className="material-symbols-outlined text-[18px] text-[#64748B]">donut_large</span>
            </div>
            {/* Proportional horizontal stacked bar */}
            <div className="mt-5 space-y-2">
              <div className="w-full h-8 rounded-lg overflow-hidden flex shadow-2xs border border-[#E2E8F0]">
                <div className="bg-[#22C55E] h-full flex items-center justify-center text-white text-[10.5px] font-bold font-mono tracking-wide" style={{ width: "88.5%" }} title="ACTIVE: 1,136 (88.5%)">
                  88.5%
                </div>
                <div className="bg-[#8B7B65] h-full flex items-center justify-center text-white text-[9.5px] font-bold font-mono" style={{ width: "7.8%" }} title="ROLLED_BACK: 100 (7.8%)">
                  8%
                </div>
                <div className="bg-[#EEB930] h-full min-w-[7px]" style={{ width: "1.2%" }} title="NEEDS_ATTENTION: 15 (1.2%)"></div>
                <div className="bg-[#ED2C2C] h-full min-w-[12px]" style={{ width: "2.5%" }} title="CANCELLED: 33 (2.5%)"></div>
              </div>
              <p className="text-[11px] text-[#475569] text-right font-mono">Proportional status distribution</p>
            </div>

            {/* Breakdown Legend */}
            <div className="grid grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-[#F1F5F9]">
              <div className="p-2.5 bg-[#F0FDF4] rounded-lg border border-[#22C55E]/40 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#22C55E]">ACTIVE</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0F172A]">1,136</span>
                  <span className="text-[11px] font-mono text-[#475569] font-medium">88.5%</span>
                </div>
              </div>
              <div className="p-2.5 bg-[#F5F5F4] rounded-lg border border-[#8B7B65]/40 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#8B7B65]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#8B7B65]">ROLLED_BACK</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0F172A]">100</span>
                  <span className="text-[11px] font-mono text-[#475569] font-medium">7.8%</span>
                </div>
              </div>
              <div className="p-2.5 bg-[#FEFCE8] rounded-lg border border-[#EEB930]/40 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#EEB930]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#EEB930]">NEEDS_ATTN</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0F172A]">15</span>
                  <span className="text-[11px] font-mono text-[#475569] font-semibold">1.2%</span>
                </div>
              </div>
              <div className="p-2.5 bg-[#FEF2F2] rounded-lg border border-[#ED2C2C]/40 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#ED2C2C]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#ED2C2C]">CANCELLED</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0F172A]">33</span>
                  <span className="text-[11px] font-mono text-[#475569] font-medium">2.5%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-3 text-[11.5px] text-[#64748B] flex items-center justify-between border-t border-[#F1F5F9]">
            <span>Net Success vs Total: <strong className="text-[#0A1B2E] font-mono">98.6%</strong></span>
            <span className="font-mono text-[11px] text-[#0A1B2E] cursor-pointer hover:underline">Saga analytics →</span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: LIVE ORDERS TABLE (9 COLS) + COMPACT SYSTEM HEALTH CARD (3 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAIN 9 COLS: LIVE ORDERS TABLE CARD */}
        <div className="lg:col-span-9 bg-white border border-[#E3E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          {/* Card Header & Filters */}
          <div className="p-3.5 border-b border-[#E3E8F0] bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0A1B2E]"></span>
                </span>
                <h2 className="text-[16px] font-bold text-[#0A1B2E] tracking-tight">Live Orders</h2>
                <span className="font-mono text-[11px] text-[#0A1B2E] bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#CBD5E1]">1,284 total</span>
              </div>
              {/* Search / Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1.5 text-[#94A3B8] text-[16px]">search</span>
                  <input
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="h-8 pl-7 pr-2.5 text-[12px] bg-white border border-[#CBD5E1] rounded-md text-[#0A1B2E] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0A1B2E] w-48 sm:w-56"
                    placeholder="Filter ID, customer, step…"
                    type="text"
                  />
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-8 px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[#0A1B2E] hover:bg-[#F8FAFC] text-[11.5px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isPaused ? "play_circle" : "pause_circle"}
                  </span>
                  <span>{isPaused ? "Resume live updates" : "Pause live updates"}</span>
                </button>
              </div>
            </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === "all"
                      ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                      : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  All ({displayOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("running")}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === "running"
                      ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                      : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  In Progress ({displayOrders.filter((o) => o.statusKey === "running").length})
                </button>
                <button
                  onClick={() => setActiveTab("succeeded")}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === "succeeded"
                      ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                      : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  Active ({displayOrders.filter((o) => o.statusKey === "succeeded").length})
                </button>
                <button
                  onClick={() => setActiveTab("rolling-back")}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === "rolling-back"
                      ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                      : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  Rolling Back ({displayOrders.filter((o) => o.statusKey === "rolling-back").length})
                </button>
                <button
                  onClick={() => setActiveTab("rolled-back")}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === "rolled-back"
                      ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                      : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  Rolled Back ({displayOrders.filter((o) => o.statusKey === "rolled-back").length})
                </button>
                <button
                  onClick={() => setActiveTab("needs-attention")}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === "needs-attention"
                      ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                      : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  Needs Attention ({displayOrders.filter((o) => o.statusKey === "needs-attention").length})
                </button>
              </div>
            </div>

            {/* Dense Enterprise Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[980px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] font-mono text-[11px] uppercase tracking-wider text-[#64748B] h-10 sticky top-0 select-none">
                    <th className="px-3.5 py-2 w-[165px]">Order ID</th>
                    <th className="px-3 py-2 w-[170px]">Customer</th>
                    <th className="px-3 py-2 w-[145px]">Product</th>
                    <th className="px-3 py-2 w-[130px]">Status</th>
                    <th className="px-3 py-2 w-[95px]">Progress</th>
                    <th className="px-3 py-2 w-[175px]">Current Step</th>
                    <th className="px-2.5 py-2 w-[75px]">Duration</th>
                    <th className="px-2.5 py-2 w-[75px]">Created</th>
                    <th className="px-3 py-2 w-[65px] text-center">Cert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[12.5px]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[32px] text-[#94A3B8]">inbox</span>
                          <span className="font-semibold text-[#0A1B2E] text-[14px]">No orders match the selected filter</span>
                          <span className="text-[#64748B] text-[12px]">
                            {activeTab !== "all" ? `No orders in '${activeTab}' state currently.` : "No orders found in active database."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className={`hover:bg-[#F8FAFC] transition-colors h-10 ${
                          ord.isLive ? "border-l-2 border-l-[#0A1B2E] bg-[#F8FAFC]" : ""
                        }`}
                      >
                        <td className="px-3.5 py-2 font-mono text-[11.5px] font-semibold truncate text-[#0A1B2E] hover:underline cursor-pointer">
                          <Link href={`/orders/${ord.id}`}>{ord.id}</Link>
                        </td>
                        <td className="px-3 py-2 truncate">
                          <div className="font-medium text-[#0A1B2E] truncate">{ord.customer}</div>
                          <div className="font-mono text-[10.5px] text-[#64748B]">{ord.msisdn}</div>
                        </td>
                        <td className="px-3 py-2 text-[#0A1B2E] truncate font-medium">{ord.product}</td>
                        <td className="px-3 py-2">
                          {renderStatusBadge(ord.status)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 w-16">
                            {ord.segments.map((seg, sIdx) => renderSegment(seg, sIdx))}
                          </div>
                        </td>
                        <td className="px-3 py-2 truncate font-medium text-[#0A1B2E]">
                          {ord.step}
                        </td>
                        <td className="px-2.5 py-2 font-mono text-[11px] text-[#64748B]">{ord.duration}</td>
                        <td className="px-2.5 py-2 text-[11.5px] text-[#64748B]">{ord.created}</td>
                        <td className="px-3 py-2 text-center">
                          {ord.cert === "verified" ? (
                            <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]" title="Verified Certificate">verified</span>
                          ) : ord.cert === "error" ? (
                            <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">error</span>
                          ) : ord.cert === "cancel" ? (
                            <span className="material-symbols-outlined text-[16px] text-[#CBD5E1]">cancel</span>
                          ) : ord.cert === "remove_done" ? (
                            <span className="material-symbols-outlined text-[16px] text-[#94A3B8]">remove_done</span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px] text-[#CBD5E1]">hourglass_top</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          {/* Pagination Footer */}
          <div className="p-3 border-t border-[#E2E8F0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-[#64748B]">
            <span className="font-mono">Showing 1-{filteredOrders.length} of 1,284 orders</span>
            <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
              <button className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-[#94A3B8] cursor-not-allowed" disabled>
                Previous
              </button>
              <button className="px-2.5 py-1 bg-[#0A1B2E] text-white rounded font-medium shadow-2xs">1</button>
              <button className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors">2</button>
              <button className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors">3</button>
              <span className="px-1 text-[#94A3B8]">…</span>
              <button className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors">161</button>
              <button className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors">Next</button>
            </div>
          </div>
        </div>

        {/* RIGHT-EDGE COMPACT CARD: 3 COLS "SYSTEM HEALTH" */}
        <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-[15px] font-bold text-[#0A1B2E] tracking-tight">System Health</h3>
                <p className="text-[11.5px] text-[#64748B]">Circuit Breakers &amp; Subsystems</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">security</span>
            </div>

            {/* 5 Subsystem Rows */}
            <div className="divide-y divide-[#F1F5F9] text-[12px] pt-1">
              {/* 1. OMS */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-[#0A1B2E] shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-medium text-[#0A1B2E] truncate">OMS <span className="text-[11px] text-[#64748B]">(Core)</span></div>
                    <div className="font-mono text-[10.5px] text-[#64748B]">p95: 14ms · err: 0.01%</div>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  CLOSED
                </span>
              </div>

              {/* 2. Inventory */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-[#0A1B2E] shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-medium text-[#0A1B2E] truncate">Inventory <span className="text-[11px] text-[#64748B]">(SIM/eSIM)</span></div>
                    <div className="font-mono text-[10.5px] text-[#64748B]">p95: 22ms · err: 0.04%</div>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  CLOSED
                </span>
              </div>

              {/* 3. Network (HLR / UDM Gateway) */}
              <div className="py-2.5 flex items-center justify-between bg-[#F8FAFC] -mx-2 px-2 rounded-md">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A1B2E]"></span>
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-[#0A1B2E] truncate">Network <span className="text-[11px] text-[#64748B]">(HLR / UDM)</span></div>
                    <div className="font-mono text-[10.5px] text-[#64748B]">p95: 189ms · err: 1.82%</div>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-bold bg-[#0A1B2E] text-white border border-[#0A1B2E] px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  HALF-OPEN
                </span>
              </div>

              {/* 4. Billing */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-[#0A1B2E] shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-medium text-[#0A1B2E] truncate">Billing <span className="text-[11px] text-[#64748B]">(OCS Rating)</span></div>
                    <div className="font-mono text-[10.5px] text-[#64748B]">p95: 31ms · err: 0.02%</div>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  CLOSED
                </span>
              </div>

              {/* 5. Notification */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-[#0A1B2E] shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-medium text-[#0A1B2E] truncate">Notification <span className="text-[11px] text-[#64748B]">(SMS-C)</span></div>
                    <div className="font-mono text-[10.5px] text-[#64748B]">p95: 18ms · err: 0.00%</div>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  CLOSED
                </span>
              </div>
            </div>
          </div>

          {/* Note on circuit breaker behavior */}
          <div className="pt-3.5 mt-3 border-t border-[#F1F5F9] bg-[#F8FAFC] -mx-4 -mb-4 p-3.5 rounded-b-xl">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#64748B] shrink-0 mt-0.5">info</span>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                <strong className="text-[#0A1B2E]">Circuit breaker policy:</strong> Fallback queue active for HLR gateway retries. 3 retry backoffs before saga rollback.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. TRIAGE PANELS: ROLLBACKS & NEEDS ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {/* ROLLBACKS PANEL */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">undo</span>
                <h3 className="text-[15px] font-bold text-[#0A1B2E] tracking-tight">Recent Saga Rollbacks</h3>
                <span className="font-mono text-[11px] text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-full font-semibold">
                  {displayOrders.filter((o) => o.statusKey === "rolled-back" || o.statusKey === "rolling-back").length} orders
                </span>
              </div>
              <button
                onClick={() => setActiveTab("rolled-back")}
                className="text-[11.5px] font-mono text-[#0A1B2E] hover:underline"
              >
                Filter table →
              </button>
            </div>

            <div className="divide-y divide-[#F1F5F9] mt-2">
              {displayOrders.filter((o) => o.statusKey === "rolled-back" || o.statusKey === "rolling-back").length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-[12px]">
                  No rolled back orders in this period. Sagas executing nominally.
                </div>
              ) : (
                displayOrders
                  .filter((o) => o.statusKey === "rolled-back" || o.statusKey === "rolling-back")
                  .slice(0, 3)
                  .map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/orders/${o.id}`} className="font-mono font-semibold text-[#0A1B2E] text-[12px] hover:underline">
                            {o.id}
                          </Link>
                          {renderStatusBadge(o.status)}
                        </div>
                        <div className="text-[11.5px] text-[#64748B] mt-0.5 truncate">
                          Reason: Clean Saga rollback · Reverse compensations verified (0 leaks)
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono text-[#64748B]">{o.created}</div>
                        <Link
                          href={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0A1B2E] hover:underline mt-0.5"
                        >
                          <span>Inspect</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center justify-between font-mono">
            <span>Saga Invariant: 100% clean rollback rate</span>
            <Link href="/proof/ab" className="hover:underline text-[#0A1B2E]">A/B Proof verification →</Link>
          </div>
        </div>

        {/* NEEDS ATTENTION PANEL */}
        <div className="bg-white border border-[#0A1B2E] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">warning</span>
                <h3 className="text-[15px] font-bold text-[#0A1B2E] tracking-tight">Needs Attention (Operator Action Required)</h3>
                <span className="font-mono text-[11px] bg-[#0A1B2E] text-white px-2 py-0.5 rounded-full font-bold">
                  {displayOrders.filter((o) => o.statusKey === "needs-attention").length} pending
                </span>
              </div>
              <Link
                href="/fallout"
                className="text-[11.5px] font-mono text-[#0A1B2E] hover:underline font-semibold"
              >
                Fallout Queue →
              </Link>
            </div>

            <div className="divide-y divide-[#F1F5F9] mt-2">
              {displayOrders.filter((o) => o.statusKey === "needs-attention").length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-[12px]">
                  No orders currently require operator intervention.
                </div>
              ) : (
                displayOrders
                  .filter((o) => o.statusKey === "needs-attention")
                  .map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/orders/${o.id}`} className="font-mono font-bold text-[#0A1B2E] text-[12px] hover:underline">
                            {o.id}
                          </Link>
                          <span className="font-mono text-[10px] bg-[#0A1B2E] text-white px-2 py-0.5 rounded-full font-bold">
                            COMPENSATION_HALTED
                          </span>
                        </div>
                        <div className="text-[11.5px] text-[#0A1B2E] mt-0.5 font-medium truncate">
                          Downstream HLR Gateway timeout (504) after 5 retries. Deprovision lock held.
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <Link
                          href={`/orders/${o.id}`}
                          className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#0A1B2E] hover:bg-[#F8FAFC] rounded text-[11.5px] font-medium transition-colors shadow-2xs inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">build_circle</span>
                          <span>Resolve</span>
                        </Link>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center justify-between font-mono">
            <span>Circuit breaker: Halts rollback to prevent state corruption</span>
            <Link href="/fallout" className="hover:underline font-semibold text-[#0A1B2E]">Open fallout management →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
