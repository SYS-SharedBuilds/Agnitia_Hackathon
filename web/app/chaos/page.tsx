"use client";

import React, { useState } from "react";
import Link from "next/link";

interface SubsystemConfig {
  id: string;
  name: string;
  icon: string;
  port: number;
  protocol: string;
  status: "HEALTHY" | "DEGRADED";
  statusText: string;
  p95Latency: string;
  latencyDiff: string;
  errorRate: string;
  errorNote: string;
  circuitBreaker: "CLOSED" | "HALF-OPEN (2/3)" | "HALF-OPEN (1/3)";
  breakerNote: string;
  bulkheadUsed: number;
  bulkheadTotal: number;
  bulkheadNote: string;
  activeChaos?: {
    type: string;
    mode: string;
    params: Record<string, string>;
  };
}

const INITIAL_SYSTEMS: SubsystemConfig[] = [
  {
    id: "oms",
    name: "OMS Core (Order Management)",
    icon: "dns",
    port: 8101,
    protocol: "Orchestrator Kernel · Temporal Workflow Driver · gRPC / HTTP2",
    status: "HEALTHY",
    statusText: "HEALTHY",
    p95Latency: "185ms",
    latencyDiff: "Nominal (±4ms)",
    errorRate: "0.02%",
    errorNote: "SLA: < 0.1%",
    circuitBreaker: "CLOSED",
    breakerNote: "Trips at 5 err/min",
    bulkheadUsed: 4,
    bulkheadTotal: 20,
    bulkheadNote: "20% capacity used",
  },
  {
    id: "sim",
    name: "SIM / eSIM Inventory Pool",
    icon: "sim_card",
    port: 8102,
    protocol: "Profile Allocation · SM-DP+ Interface · REST / mTLS",
    status: "HEALTHY",
    statusText: "HEALTHY",
    p95Latency: "240ms",
    latencyDiff: "SM-DP+ handshakes",
    errorRate: "0.08%",
    errorNote: "Normal pool reuse",
    circuitBreaker: "CLOSED",
    breakerNote: "Consecutive fails: 0",
    bulkheadUsed: 6,
    bulkheadTotal: 15,
    bulkheadNote: "40% capacity used",
  },
  {
    id: "network",
    name: "Network Slice Gateway (HLR / HSS)",
    icon: "router",
    port: 8103,
    protocol: "Core Network Diameter Protocol & 5G QoS Subsystem · Injected via Chaos Mesh",
    status: "DEGRADED",
    statusText: "DEGRADED (504 TIMEOUT)",
    p95Latency: "2,450ms",
    latencyDiff: "+1,100% vs base",
    errorRate: "18.4%",
    errorNote: "Over 5% SLA limit",
    circuitBreaker: "HALF-OPEN (2/3)",
    breakerNote: "Tombstoning active",
    bulkheadUsed: 9,
    bulkheadTotal: 10,
    bulkheadNote: "90% saturated · Queuing",
    activeChaos: {
      type: "JITTER_TIMEOUT",
      mode: "Latency + Jitter (Active)",
      params: {
        baseDelay: "1800ms",
        jitter: "±400ms",
        timeoutRate: "25%",
        chaosKey: "0x42-net-jitter",
      },
    },
  },
  {
    id: "ocs",
    name: "OCS Billing Engine",
    icon: "payments",
    port: 8104,
    protocol: "Online Charging System · Ro / Diameter · Tariff Quota Locks",
    status: "DEGRADED",
    statusText: "DEGRADED (TRANSIENT_409)",
    p95Latency: "390ms",
    latencyDiff: "+65ms retry backoff",
    errorRate: "8.5%",
    errorNote: "409 Conflict triggers",
    circuitBreaker: "HALF-OPEN (1/3)",
    breakerNote: "Sagas backing off",
    bulkheadUsed: 8,
    bulkheadTotal: 16,
    bulkheadNote: "50% capacity utilized",
    activeChaos: {
      type: "409_CONFLICT",
      mode: "Business-error (Active)",
      params: {
        errorCode: "409 (Quota Lock Contention)",
        probability: "15%",
        seed: "seed_ocs_99",
      },
    },
  },
  {
    id: "notif",
    name: "Notification Hub (SMS / Push)",
    icon: "notifications_active",
    port: 8105,
    protocol: "Customer Dispatches · SMPP Gateway & Webhook Transmitters",
    status: "HEALTHY",
    statusText: "HEALTHY",
    p95Latency: "95ms",
    latencyDiff: "Fast fire-and-forget",
    errorRate: "0.00%",
    errorNote: "0 dropped SMS",
    circuitBreaker: "CLOSED",
    breakerNote: "Trips at 10 err/min",
    bulkheadUsed: 2,
    bulkheadTotal: 10,
    bulkheadNote: "20% capacity used",
  },
];

export default function SystemsChaosPage() {
  const [systems, setSystems] = useState<SubsystemConfig[]>(INITIAL_SYSTEMS);

  const handleResetAllChaos = () => {
    if (confirm("Clear all injected chaos faults across OMS Core, eSIM, HLR Gateway, OCS Billing, and Notifications?")) {
      setSystems((prev) =>
        prev.map((s) => ({
          ...s,
          status: "HEALTHY",
          statusText: "HEALTHY",
          activeChaos: undefined,
          p95Latency: s.id === "network" ? "210ms" : s.id === "ocs" ? "320ms" : s.p95Latency,
          errorRate: s.id === "network" ? "0.04%" : s.id === "ocs" ? "0.06%" : s.errorRate,
          circuitBreaker: "CLOSED",
          bulkheadUsed: s.id === "network" ? 3 : s.id === "ocs" ? 4 : s.bulkheadUsed,
        }))
      );
      alert("All faults cleared successfully. Reverted subsystems to nominal baseline telemetry.");
    }
  };

  const handleResetSingle = (id: string) => {
    setSystems((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "HEALTHY",
            statusText: "HEALTHY",
            activeChaos: undefined,
            p95Latency: "210ms",
            errorRate: "0.04%",
            circuitBreaker: "CLOSED",
            bulkheadUsed: 3,
          };
        }
        return s;
      })
    );
    alert(`Fault reset for ${id}. Telemetry restoring to baseline.`);
  };

  const handleApplySingle = (id: string) => {
    alert(`Applied updated chaos parameters to subsystem ${id}.`);
  };

  const copyCurlHeader = (port: number) => {
    const cmd = `curl -H "X-Chaos-Key: 0x42-net-jitter" -H "X-Trace-Context: switchon-demo" http://localhost:${port}/api/v1/slice`;
    navigator.clipboard.writeText(cmd);
    alert(`Copied sample injection cURL command to clipboard:\n${cmd}`);
  };

  const downloadTopologyJSON = () => {
    const topology = {
      cluster: "us-east-core",
      version: "2.4.1",
      prng_seed: "0x42-net-jitter",
      nodes: systems.map((s) => ({
        name: s.name,
        port: s.port,
        status: s.status,
        chaos: s.activeChaos || null,
      })),
      blast_radius_orders: [
        "ORD-20260712-004217",
        "ORD-20260712-004219",
        "ORD-20260712-004222",
        "ORD-20260712-004225",
      ],
    };
    const blob = new Blob([JSON.stringify(topology, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "switchon-chaos-topology.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeFaultsCount = systems.filter((s) => s.status === "DEGRADED").length;
  const healthyCount = systems.filter((s) => s.status === "HEALTHY").length;

  return (
    <div className="flex flex-col w-full space-y-6 pb-12">
      {/* 1. SIMULATION ENVIRONMENT BANNER (CLEAN WHITE CARD WITH DEEP NAVY) */}
      <section className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0A1B2E] shrink-0 mt-0.5 md:mt-0">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold tracking-tight">
                Simulation Environment — Chaos Injection Mode
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#0A1B2E] font-label-sm text-label-sm font-mono font-medium border border-[#CBD5E1] shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E] animate-pulse"></span>
                ChaosMesh v2.4.1 · PRNG Seed Synced
              </span>
            </div>
            <p className="font-body-md text-body-md text-[#64748B] leading-relaxed max-w-4xl">
              Chaos is for demonstration verification &amp; resilience testing — impacts downstream invocations. All injected faults carry verified{" "}
              <code className="font-mono bg-[#F1F5F9] text-[#0A1B2E] px-1 py-0.5 rounded font-medium border border-[#CBD5E1]">
                X-Chaos-Key
              </code>{" "}
              propagation; linearizable compensations and idempotent rollback invariants remain guaranteed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={handleResetAllChaos}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A1B2E] hover:bg-[#14263b] text-white font-body-md text-body-md font-medium shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Clear All Active Chaos ({systems.length} Services)</span>
          </button>
        </div>
      </section>

      {/* 2. CONTROL HEADER & METRIC SUMMARY STRIP */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-mono font-semibold">
                Cluster Topology: us-east-core
              </span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="text-[11px] font-mono text-[#0A1B2E] font-semibold">Resilience Engine</span>
            </div>
            <h1 className="text-[24px] font-bold text-[#0A1B2E] tracking-tight">
              Systems &amp; Chaos Injection
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Telemetry status, live bulkhead saturation, and targeted fault injection across telecom microservices
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                navigator.clipboard.writeText("make chaos-status");
                alert("Copied CLI command to clipboard: make chaos-status");
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0A1B2E] text-[13px] font-medium transition-colors cursor-pointer border border-[#CBD5E1] shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-[#64748B]">terminal</span>
              <span className="font-mono">make chaos-status</span>
              <span className="material-symbols-outlined text-[14px] text-[#94A3B8] ml-0.5">content_copy</span>
            </button>
            <button
              onClick={downloadTopologyJSON}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0A1B2E] text-[13px] font-medium shadow-2xs transition-colors cursor-pointer border border-[#CBD5E1]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#64748B]">download</span>
              <span>Export Topology JSON</span>
            </button>
            <button
              onClick={handleResetAllChaos}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#0A1B2E] hover:bg-[#14263b] text-white text-[13px] font-medium shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Emergency Reset All</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Stat 1 */}
          <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-[#E2E8F0] flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#64748B]">
              Active Faults
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
                {activeFaultsCount} Faults
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1] text-[10px] font-mono font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E] animate-pulse"></span>
                Live
              </span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-[#E2E8F0] flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#64748B]">
              Subsystems Health
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
                {healthyCount} / {systems.length}
              </span>
              <span className="text-[11px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">
                Nominal (60%)
              </span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-[#E2E8F0] flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#64748B]">
              Sagas in Blast Radius
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
                4 Orders
              </span>
              <span className="text-[11px] font-medium text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">
                Active Guard
              </span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-[#E2E8F0] flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#64748B]">
              Mean Bulkhead Headroom
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[24px] font-bold font-mono text-[#0A1B2E] tracking-tight">
                54.2%
              </span>
              <span className="text-[11px] text-[#64748B] font-mono">29 / 71 slots</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE: 8 COLS (SYSTEM CARDS) + 4 COLS (BLAST RADIUS DRAWER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 8 COLS SYSTEM CARDS */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {systems.map((sys) => {
            const isDegraded = sys.status === "DEGRADED";

            return (
              <div
                key={sys.id}
                className={`bg-white rounded-xl shadow-sm transition-all hover:shadow-md border border-outline-variant/30 overflow-hidden ${
                  isDegraded
                    ? sys.id === "network"
                      ? "bg-gradient-to-r from-red-50/20 via-white to-white ring-1 ring-error/30"
                      : "bg-gradient-to-r from-amber-50/30 via-white to-white ring-1 ring-amber-500/30"
                    : ""
                }`}
              >
                {/* Top accent ribbon bar if degraded */}
                {isDegraded && (
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${
                      sys.id === "network"
                        ? "from-error via-amber-500 to-error"
                        : "from-amber-500 via-error to-amber-500"
                    }`}
                  ></div>
                )}

                <div className="p-5 flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#0A1B2E] shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">
                          {sys.icon}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-bold">
                            {sys.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-mono bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1] font-medium">
                            :{sys.port}
                          </span>
                          {sys.activeChaos && (
                            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-mono font-bold bg-[#0A1B2E] text-white border border-[#0A1B2E] shadow-2xs">
                              CHAOS: {sys.activeChaos.type}
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-[#64748B]">{sys.protocol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm font-mono font-bold flex items-center gap-1.5 border bg-white text-[#0A1B2E] border-[#CBD5E1] shadow-2xs">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isDegraded ? "bg-[#0A1B2E]" : "bg-[#0A1B2E]"
                          }`}
                        ></span>
                        {sys.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border bg-[#F8FAFC] border-[#CBD5E1]">
                    <div>
                      <span className="font-label-sm text-label-sm block uppercase font-mono text-[#64748B]">
                        p95 Latency
                      </span>
                      <span className="font-headline-sm text-headline-sm font-mono font-bold text-[#0A1B2E]">
                        {sys.p95Latency}
                      </span>
                      <span className="font-body-sm text-body-sm block text-[#64748B]">
                        {sys.latencyDiff}
                      </span>
                    </div>

                    <div>
                      <span className="font-label-sm text-label-sm block uppercase font-mono text-[#64748B]">
                        Error Rate
                      </span>
                      <span className="font-headline-sm text-headline-sm font-mono font-bold text-[#0A1B2E]">
                        {sys.errorRate}
                      </span>
                      <span className="font-body-sm text-body-sm block text-[#64748B]">
                        {sys.errorNote}
                      </span>
                    </div>

                    <div>
                      <span className="font-label-sm text-label-sm text-[#64748B] block uppercase font-mono">
                        Circuit Breaker
                      </span>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-mono font-bold border bg-white text-[#0A1B2E] border-[#CBD5E1] shadow-2xs">
                          {sys.circuitBreaker}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-[#64748B] block mt-0.5">
                        {sys.breakerNote}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm uppercase font-mono text-[#64748B]">
                          Bulkhead Pool
                        </span>
                        <span className="font-label-sm text-label-sm font-mono font-bold text-[#0A1B2E]">
                          {sys.bulkheadUsed} / {sys.bulkheadTotal}
                        </span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] rounded-full h-2 mt-1.5 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-[#0A1B2E]"
                          style={{ width: `${(sys.bulkheadUsed / sys.bulkheadTotal) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-body-sm text-body-sm block mt-1 text-[#64748B]">
                        {sys.bulkheadNote}
                      </span>
                    </div>
                  </div>

                  {/* Active Chaos Panel or Accordion */}
                  {sys.activeChaos ? (
                    <div className="bg-surface-container-low rounded-lg p-4 space-y-4 border border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm font-mono uppercase tracking-wider text-on-surface font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">science</span>
                          Fault Injection Parameters (Active)
                        </span>
                        <span className="font-label-sm text-label-sm font-mono text-primary font-medium">
                          Target: {sys.id === "network" ? "ep_hlr_slice_provision()" : "post_reservation_hold()"}
                        </span>
                      </div>

                      {/* Parameter Badges */}
                      <div className="flex flex-wrap gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/20">
                        {sys.id === "network" ? (
                          <>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">None</button>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">Fail-N</button>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">Always-fail</button>
                            <button className="px-2.5 py-1 bg-primary text-white font-label-sm text-label-sm rounded font-medium shadow-xs">
                              Latency + Jitter (Active)
                            </button>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">Timeout</button>
                          </>
                        ) : (
                          <>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">None</button>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">Fail-N</button>
                            <button className="px-2.5 py-1 bg-primary text-white font-label-sm text-label-sm rounded font-medium shadow-xs">
                              Business-error (Active)
                            </button>
                            <button className="px-2.5 py-1 text-on-surface-variant font-label-sm text-label-sm rounded">Compensation-failure</button>
                          </>
                        )}
                      </div>

                      {/* Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {Object.entries(sys.activeChaos.params).map(([k, val]) => (
                          <div key={k}>
                            <label className="block font-label-sm text-label-sm text-on-surface-variant font-mono mb-1 capitalize">
                              {k}
                            </label>
                            <input
                              className="w-full h-9 px-3 font-mono font-label-md text-label-md bg-white rounded-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                              readOnly
                              type="text"
                              value={val}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Footer Controls */}
                      <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                        <button
                          onClick={() => copyCurlHeader(sys.port)}
                          className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary hover:text-primary/80 font-medium cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">integration_instructions</span>
                          <span>Copy cURL header: X-Chaos-Key</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResetSingle(sys.id)}
                            className="px-3 py-1.5 rounded-md bg-white hover:bg-surface-container text-on-surface font-body-md text-body-md shadow-xs transition-colors cursor-pointer border border-outline-variant/30"
                          >
                            Reset Fault
                          </button>
                          <button
                            onClick={() => handleApplySingle(sys.id)}
                            className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-white font-body-md text-body-md font-medium shadow-xs transition-colors cursor-pointer"
                          >
                            Apply Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <details className="group">
                      <summary className="flex items-center justify-between text-on-surface-variant hover:text-on-surface cursor-pointer select-none font-body-md text-body-md pt-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[18px]">tune</span>
                          Chaos Injections (Mode: None)
                        </span>
                        <span className="material-symbols-outlined text-[18px] transition-transform group-open:rotate-180">
                          expand_more
                        </span>
                      </summary>
                      <div className="pt-3 pb-1 text-on-surface-variant font-body-sm text-body-sm">
                        <div className="p-3 bg-surface-container rounded-lg flex items-center justify-between border border-outline-variant/20">
                          <span className="text-on-surface font-medium">No active faults attached to :{sys.port}.</span>
                          <button
                            onClick={() => alert(`Arming fault injector for :${sys.port}`)}
                            className="px-3 py-1 rounded bg-white hover:bg-surface-container-high text-primary font-label-md text-label-md font-medium shadow-xs transition-colors border border-outline-variant/30"
                          >
                            Arm Fault Generator
                          </button>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: 4 COLS BLAST RADIUS DRAWER (STICKY) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-xl shadow-2xs p-5 space-y-4 border border-[#CBD5E1]">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A1B2E]">
                    <span className="material-symbols-outlined text-[18px]">shield</span>
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-bold">
                    Blast Radius
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-[#64748B]">
                  In-flight transactions traversing degraded nodes
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm font-mono font-bold bg-[#0A1B2E] text-white border border-[#0A1B2E] shadow-2xs">
                4 Orders At Risk
              </span>
            </div>

            {/* Tag Strip of Impacted Nodes */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#0A1B2E] font-label-sm text-label-sm font-mono font-medium border border-[#CBD5E1] shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                Network:8103 (Jitter+504)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#0A1B2E] font-label-sm text-label-sm font-mono font-medium border border-[#CBD5E1] shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]"></span>
                Billing:8104 (409 Error)
              </span>
            </div>

            {/* Explanatory Guard Banner */}
            <div className="bg-[#F8FAFC] p-3 rounded-lg text-[#64748B] font-body-sm text-body-sm leading-relaxed border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-[#0A1B2E] font-semibold mb-1">
                <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">verified_user</span>
                Automated Saga Interception Active
              </div>
              Orders currently executing sagas that touch degraded downstream providers. SwitchOn circuit breakers and rollback compensations are actively safeguarding order state.
            </div>

            {/* List of In-Flight Exposed Orders */}
            <div className="space-y-3 pt-1">
              {/* Order 1: High Risk */}
              <div className="p-3.5 rounded-lg bg-white shadow-2xs space-y-2 border border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-label-md font-mono text-[#0A1B2E] font-bold">
                      ORD-20260712-004217
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-mono font-bold bg-[#0A1B2E] text-white">
                    CRITICAL SLA RISK
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] font-body-sm text-body-sm">
                  <span>
                    Customer: <strong className="text-[#0A1B2E] font-medium">Marcus Vance</strong>
                  </span>
                  <span className="font-mono text-[#0A1B2E]">Fiber 500</span>
                </div>
                <div className="text-[#64748B] font-body-sm text-body-sm">
                  <span className="font-medium text-[#0A1B2E]">Step 4/8:</span> HLR Network Slice Provisioning
                </div>
                <div className="p-2 rounded bg-[#F8FAFC] text-[#0A1B2E] font-body-sm text-body-sm border border-[#CBD5E1]">
                  <p className="text-[#0A1B2E] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">timer_off</span>
                    Timeout at 2.4s (Breaker retry 2/3)
                  </p>
                  <p className="text-[#64748B] mt-0.5">Compensation saga ready if retry budget expires.</p>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    className="inline-flex items-center gap-1 text-[#0A1B2E] hover:underline font-label-sm text-label-sm font-semibold font-mono"
                    href="/orders/ORD-20260712-004217"
                  >
                    Inspect Order Trace
                    <span className="material-symbols-outlined text-[14px]">north_east</span>
                  </Link>
                </div>
              </div>

              {/* Order 2: Moderate Risk */}
              <div className="p-3.5 rounded-lg bg-white shadow-2xs space-y-2 border border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-mono text-[#0A1B2E] font-bold">
                    ORD-20260712-004219
                  </span>
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-mono font-semibold bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1]">
                    MODERATE - RETRYING
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] font-body-sm text-body-sm">
                  <span>
                    Customer: <strong className="text-[#0A1B2E] font-medium">Acme Telecom Corp</strong>
                  </span>
                  <span className="font-mono text-[#0A1B2E]">10x 5G eSIM</span>
                </div>
                <div className="text-[#64748B] font-body-sm text-body-sm">
                  <span className="font-medium text-[#0A1B2E]">Step 5/8:</span> OCS Billing Profile Binding
                </div>
                <p className="font-body-sm text-body-sm text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded">
                  Hit 409 quota lock contention. Exponential jitter backoff active (800ms slot backoff).
                </p>
                <div className="flex justify-end pt-1">
                  <Link
                    className="inline-flex items-center gap-1 text-[#0A1B2E] hover:underline font-label-sm text-label-sm font-semibold font-mono"
                    href="/orders/ORD-20260712-004219"
                  >
                    Inspect Order Trace
                    <span className="material-symbols-outlined text-[14px]">north_east</span>
                  </Link>
                </div>
              </div>

              {/* Order 3: Queued */}
              <div className="p-3.5 rounded-lg bg-white shadow-2xs space-y-2 border border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-mono text-[#0A1B2E] font-bold">
                    ORD-20260712-004222
                  </span>
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-mono font-semibold bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1]">
                    QUEUED IN BULKHEAD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] font-body-sm text-body-sm">
                  <span>
                    Customer: <strong className="text-[#0A1B2E] font-medium">Elena Rostova</strong>
                  </span>
                  <span className="font-mono text-[#0A1B2E]">Fiber 1000</span>
                </div>
                <div className="text-[#64748B] font-body-sm text-body-sm">
                  <span className="font-medium text-[#0A1B2E]">Step 3/8:</span> Port Allocation (Queued for HLR)
                </div>
                <p className="font-body-sm text-body-sm text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded">
                  Waiting on HLR gateway slot (9/10 saturated). Bulkhead queue wait time: ~1.2s.
                </p>
                <div className="flex justify-end pt-1">
                  <Link
                    className="inline-flex items-center gap-1 text-[#0A1B2E] hover:underline font-label-sm text-label-sm font-semibold font-mono"
                    href="/orders/ORD-20260712-004222"
                  >
                    Inspect Order Trace
                    <span className="material-symbols-outlined text-[14px]">north_east</span>
                  </Link>
                </div>
              </div>

              {/* Order 4: Circuit Breaker Isolated */}
              <div className="p-3.5 rounded-lg bg-white shadow-2xs space-y-2 border border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-mono text-[#0A1B2E] font-bold">
                    ORD-20260712-004225
                  </span>
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-mono font-semibold bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1]">
                    BREAKER ISOLATED
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] font-body-sm text-body-sm">
                  <span>
                    Customer: <strong className="text-[#0A1B2E] font-medium">Devon Park</strong>
                  </span>
                  <span className="font-mono text-[#0A1B2E]">eSIM Roaming</span>
                </div>
                <div className="text-[#64748B] font-body-sm text-body-sm">
                  <span className="font-medium text-[#0A1B2E]">Step 4/8:</span> HLR QoS Rule Apply
                </div>
                <p className="font-body-sm text-body-sm text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded">
                  Circuit breaker tripped to HALF-OPEN. Sagas safely diverted into fallback tombstone reconciliation.
                </p>
                <div className="flex justify-end pt-1">
                  <Link
                    className="inline-flex items-center gap-1 text-[#0A1B2E] hover:underline font-label-sm text-label-sm font-semibold font-mono"
                    href="/orders/ORD-20260712-004225"
                  >
                    Inspect Order Trace
                    <span className="material-symbols-outlined text-[14px]">north_east</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Deterministic Chaos Formal Assertion Box */}
            <div className="p-4 rounded-xl bg-white text-[#0A1B2E] space-y-2 border border-[#CBD5E1] shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A1B2E] text-[20px]">verified</span>
                <h4 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">
                  Deterministic Chaos Assertion
                </h4>
              </div>
              <p className="font-body-sm text-body-sm text-[#64748B] leading-relaxed">
                All faults verified against formal TLA+ specifications. Even under 100% downstream network drop or catastrophic provider timeout,{" "}
                <strong className="text-[#0A1B2E]">zero ghost billings or orphaned telecom port allocations</strong> will occur.
              </p>
              <div className="pt-1 flex items-center justify-between font-label-sm text-label-sm font-mono text-[#64748B]">
                <span>Model Proof: checked (34,190 states)</span>
                <span className="text-[#0A1B2E] font-semibold">TLA+ PASS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
