"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MetricsSummary, Order } from "@/lib/types";

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
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
      if (mRes.ok) setMetrics(await mRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  useEffect(() => {
    fetchState();
    if (isPaused) return;
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Demo fallback items matching Screen 2 specifications
  const displayOrders = orders.length > 0 ? orders.map((o, idx) => ({
    id: o.order_id,
    customer: o.customer_id,
    msisdn: (o.payload?.msisdn as string) || "+1 555 019-4821",
    product: o.product || "Fiber Broadband 500",
    status: (o.state as string),
    statusKey: (o.state as string) === "ACTIVE" ? "succeeded" : (o.state as string) === "ROLLING_BACK" ? "rolling-back" : (o.state as string) === "ROLLED_BACK" ? "rolled-back" : (o.state as string) === "NEEDS_ATTENTION" ? "needs-attention" : "running",
    step: o.current_step || "HLR Provisioning",
    duration: "2.4s",
    created: "Just now",
    cert: (o.state as string) === "ACTIVE" ? "verified" : (o.state as string) === "NEEDS_ATTENTION" ? "error" : "pending",
    segments: ["success", "success", (o.state as string) === "IN_PROGRESS" ? "running" : "pending", "pending", "pending"],
    isLive: idx === 0,
  })) : [
    {
      id: "ORD-20260712-004217",
      customer: "Marcus Vance",
      msisdn: "+1 555 019-4821",
      product: "Fiber Broadband 500",
      status: "RUNNING",
      statusKey: "running",
      step: "HLR Provisioning",
      duration: "2.4s",
      created: "4s ago",
      cert: "hourglass_top",
      segments: ["success", "success", "running", "idle", "idle"],
      isLive: true,
    },
    {
      id: "ORD-20260712-004216",
      customer: "Aria Montgomery",
      msisdn: "+1 555 302-8812",
      product: "5G Postpaid Unlimited",
      status: "SUCCEEDED",
      statusKey: "succeeded",
      step: "Welcome SMS Dispatched",
      duration: "1.8s",
      created: "18s ago",
      cert: "verified",
      segments: ["success", "success", "success", "success", "success"],
      isLive: false,
    },
    {
      id: "ORD-20260712-004215",
      customer: "Kasper Thorne",
      msisdn: "+1 555 891-2311",
      product: "Enterprise SIP Trunk",
      status: "RETRYING",
      statusKey: "running",
      step: "Billing Account Sync",
      duration: "4.8s",
      created: "42s ago",
      cert: "pending",
      segments: ["success", "success", "success", "retrying", "idle"],
      isLive: false,
    },
    {
      id: "ORD-20260712-004214",
      customer: "Helix Labs Ltd",
      msisdn: "+1 555 762-9011",
      product: "Cloud Interconnect 10G",
      status: "ROLLING_BACK",
      statusKey: "rolling-back",
      step: "Compensating HLR",
      duration: "14.2s",
      created: "1m ago",
      cert: "cancel",
      segments: ["compensating", "compensating", "idle", "idle", "error"],
      isLive: false,
    },
    {
      id: "ORD-20260712-004213",
      customer: "Elena Rostova",
      msisdn: "+1 555 441-9988",
      product: "eSIM Roaming Global",
      status: "COMPENSATED",
      statusKey: "rolled-back",
      step: "eSIM Profile Download (Cleaned)",
      duration: "3.1s",
      created: "2m ago",
      cert: "remove_done",
      segments: ["compensated", "compensated", "compensated", "compensated", "compensated"],
      isLive: false,
    },
    {
      id: "ORD-20260712-004212",
      customer: "Jonah Sterling",
      msisdn: "+1 555 124-7744",
      product: "Fiber Broadband 1G",
      status: "SUCCEEDED",
      statusKey: "succeeded",
      step: "CPE Auto-Provisioned",
      duration: "2.9s",
      created: "3m ago",
      cert: "verified",
      segments: ["success", "success", "success", "success", "success"],
      isLive: false,
    },
    {
      id: "ORD-20260712-004211",
      customer: "Devon Miller",
      msisdn: "+1 555 609-1229",
      product: "eSIM Add-on Data",
      status: "SUCCEEDED",
      statusKey: "succeeded",
      step: "eSIM Profile Download",
      duration: "1.2s",
      created: "4m ago",
      cert: "verified",
      segments: ["success", "success", "success", "success", "success"],
      isLive: false,
    },
    {
      id: "ORD-20260712-004210",
      customer: "Northstar Freight",
      msisdn: "+1 555 238-9900",
      product: "IoT SIM Pool (500x)",
      status: "NEEDS_ATTENTION",
      statusKey: "needs-attention",
      step: "HLR Provisioning (Code 403)",
      duration: "28.4s",
      created: "5m ago",
      cert: "error",
      segments: ["success", "success", "attention", "idle", "idle"],
      isLive: false,
    },
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
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
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Activation time trend</h3>
                <p className="text-[12px] text-[#64748B]">p50, p95, p99 over the last 60 min</p>
              </div>
              {/* Legends */}
              <div className="flex items-center gap-3.5 flex-wrap text-[11.5px] font-medium font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0A1B2E]"></span>
                  <span className="text-[#0A1B2E]">p50 (2.8s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#475569]"></span>
                  <span className="text-[#0A1B2E]">p95 (5.4s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94A3B8]"></span>
                  <span className="text-[#0A1B2E]">p99 (8.1s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 border-b-2 border-dashed border-[#0A1B2E]"></span>
                  <span className="text-[#0A1B2E]">SLO 6.0s Target</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Area */}
            <div className="relative w-full h-[220px] mt-3">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 740 220">
                {/* Grid horizontal lines */}
                <line stroke="#E8ECF3" strokeWidth="1" x1="45" x2="730" y1="15" y2="15"></line>
                <line stroke="#E8ECF3" strokeWidth="1" x1="45" x2="730" y1="51" y2="51"></line>
                <line stroke="#E8ECF3" strokeWidth="1" x1="45" x2="730" y1="87" y2="87"></line>
                <line stroke="#E8ECF3" strokeWidth="1" x1="45" x2="730" y1="123" y2="123"></line>
                <line stroke="#E8ECF3" strokeWidth="1" x1="45" x2="730" y1="159" y2="159"></line>
                <line stroke="#CBD5E1" strokeWidth="1" x1="45" x2="730" y1="195" y2="195"></line>
                {/* Y-Axis Labels */}
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x="35" y="19">10s</text>
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x="35" y="55">8s</text>
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x="35" y="91">6s</text>
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x="35" y="127">4s</text>
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x="35" y="163">2s</text>
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x="35" y="198">0s</text>
                {/* SLO 6.0s Dashed Line */}
                <line stroke="#0A1B2E" strokeDasharray="5 4" strokeWidth="1.6" x1="45" x2="730" y1="87" y2="87"></line>
                <rect fill="#F1F5F9" height="18" rx="3" stroke="#CBD5E1" width="95" x="635" y="74"></rect>
                <text className="text-[9.5px] fill-[#0A1B2E] font-mono font-bold" textAnchor="middle" x="682" y="86">SLO 6.0s Target</text>
                {/* Curves */}
                <path d="M 45 152 Q 130 148, 215 150 T 385 142 T 555 145 T 725 144" fill="none" stroke="#0A1B2E" strokeLinecap="round" strokeWidth="2.4"></path>
                <path d="M 45 106 Q 130 94, 215 102 T 385 92 T 555 100 T 725 98" fill="none" stroke="#475569" strokeLinecap="round" strokeWidth="2.4"></path>
                <path d="M 45 58 Q 130 68, 215 48 T 385 52 T 555 46 T 725 49" fill="none" stroke="#94A3B8" strokeLinecap="round" strokeWidth="2.4"></path>
                {/* Interactive Highlight Dots at Now */}
                <circle cx="725" cy="144" fill="#0A1B2E" r="4.5" stroke="#FFFFFF" strokeWidth="2"></circle>
                <circle cx="725" cy="98" fill="#475569" r="4.5" stroke="#FFFFFF" strokeWidth="2"></circle>
                <circle cx="725" cy="49" fill="#94A3B8" r="4.5" stroke="#FFFFFF" strokeWidth="2"></circle>
                <line stroke="#CBD5E1" strokeDasharray="2 2" strokeWidth="1" x1="725" x2="725" y1="20" y2="195"></line>
              </svg>
            </div>
          </div>
          {/* X-Axis Labels */}
          <div className="flex justify-between items-center text-[10.5px] font-mono text-[#94A3B8] pt-2 pl-9 pr-2 border-t border-[#F8FAFC]">
            <span>-60m</span>
            <span>-45m</span>
            <span>-30m</span>
            <span>-15m</span>
            <span className="font-semibold text-[#0A1B2E]">Now</span>
          </div>
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
              <div className="w-full h-8 rounded-lg overflow-hidden flex shadow-2xs border border-[#CBD5E1]">
                <div className="bg-[#0A1B2E] h-full flex items-center justify-center text-white text-[10.5px] font-bold font-mono tracking-wide" style={{ width: "88.5%" }} title="ACTIVE: 1,136 (88.5%)">
                  88.5%
                </div>
                <div className="bg-[#475569] h-full flex items-center justify-center text-white text-[9.5px] font-bold font-mono" style={{ width: "7.8%" }} title="ROLLED_BACK: 100 (7.8%)">
                  8%
                </div>
                <div className="bg-[#94A3B8] h-full min-w-[7px]" style={{ width: "1.2%" }} title="NEEDS_ATTENTION: 15 (1.2%)"></div>
                <div className="bg-[#CBD5E1] h-full min-w-[12px]" style={{ width: "2.5%" }} title="CANCELLED: 33 (2.5%)"></div>
              </div>
              <p className="text-[11px] text-[#64748B] text-right font-mono">Proportional status distribution</p>
            </div>
            {/* Breakdown Legend */}
            <div className="grid grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-[#F1F5F9]">
              <div className="p-2.5 bg-white rounded-lg border border-[#CBD5E1] flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#0A1B2E]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#0A1B2E]">ACTIVE</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0A1B2E]">1,136</span>
                  <span className="text-[11px] font-mono text-[#64748B] font-medium">88.5%</span>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#CBD5E1] flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#475569]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#0A1B2E]">ROLLED_BACK</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0A1B2E]">100</span>
                  <span className="text-[11px] font-mono text-[#64748B] font-medium">7.8%</span>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#CBD5E1] flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#94A3B8]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#0A1B2E]">NEEDS_ATTN</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0A1B2E]">15</span>
                  <span className="text-[11px] font-mono text-[#64748B] font-semibold">1.2%</span>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#CBD5E1] flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#CBD5E1]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#0A1B2E]">CANCELLED</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-mono font-bold text-[#0A1B2E]">33</span>
                  <span className="text-[11px] font-mono text-[#64748B] font-medium">2.5%</span>
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
                All (1,284)
              </button>
              <button
                onClick={() => setActiveTab("running")}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === "running"
                    ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                    : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                }`}
              >
                In Progress (42)
              </button>
              <button
                onClick={() => setActiveTab("succeeded")}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === "succeeded"
                    ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                    : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                }`}
              >
                Active (1,136)
              </button>
              <button
                onClick={() => setActiveTab("rolling-back")}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === "rolling-back"
                    ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                    : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                }`}
              >
                Rolling Back (8)
              </button>
              <button
                onClick={() => setActiveTab("rolled-back")}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === "rolled-back"
                    ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                    : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                }`}
              >
                Rolled Back (75)
              </button>
              <button
                onClick={() => setActiveTab("needs-attention")}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === "needs-attention"
                    ? "bg-[#0A1B2E] text-white border border-[#0A1B2E] font-semibold shadow-2xs"
                    : "text-[#475569] bg-white hover:text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                }`}
              >
                Needs Attention (2)
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
                {filteredOrders.map((ord) => (
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
                ))}
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
    </div>
  );
}
