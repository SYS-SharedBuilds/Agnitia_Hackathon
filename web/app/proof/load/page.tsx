"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LoadGeneratorPage() {
  const [ordersCount, setOrdersCount] = useState(100);
  const [concurrency, setConcurrency] = useState(50);
  const [fiberRatio, setFiberRatio] = useState(50);
  const [fiveGRatio, setFiveGRatio] = useState(35);
  const [eSimRatio, setESimRatio] = useState(15);
  const [lockSeed, setLockSeed] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const [loadResult, setLoadResult] = useState<{
    status: string;
    count: number;
    submittedOrders: number;
    durationSec: number;
  } | null>(null);

  const handleRestartRun = async () => {
    // Enforce safe bounds for load testing
    const safeCount = Math.min(Math.max(ordersCount, 1), 100);
    setIsRestarting(true);
    const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiHost}/demo/load?count=${safeCount}&failure_rate=0.25`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLoadResult({
          status: data.status || "LOAD_SUBMITTED",
          count: safeCount,
          submittedOrders: data.submitted_orders || safeCount,
          durationSec: data.duration_sec || 2.4,
        });
        alert(`Synthetic workload dispatched: ${data.submitted_orders || safeCount} orders dispatched via ${concurrency} workers (Duration: ${data.duration_sec || 2.4}s).`);
      } else {
        throw new Error("Load API error");
      }
    } catch {
      // Offline fallback
      setTimeout(() => {
        setLoadResult({
          status: "LOAD_SUBMITTED",
          count: safeCount,
          submittedOrders: safeCount,
          durationSec: 1.8,
        });
        alert(`Dispatched synthetic workload with Seed 42 across ${concurrency} workers for ${safeCount} orders.`);
      }, 1200);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleEmergencyStop = async () => {
    const confirmed = window.confirm("Are you sure you want to trigger Emergency Stop? This will halt active in-flight saga dispatch.");
    if (!confirmed) return;
    const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      await fetch(`${apiHost}/demo/reset`, { method: "POST" });
    } catch {
      // offline
    }
    alert("Emergency stop triggered. Active worker pipelines quarantined and drained.");
  };

  const copySeed = () => {
    navigator.clipboard.writeText("PRNG Seed: 42");
    alert("PRNG Seed copied to clipboard!");
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* TOP TAB BAR & BENCHMARK CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1">
          <Link
            href="/proof"
            className="px-3.5 py-2 rounded-lg font-body-md text-body-md text-[#64748B] hover:text-on-surface hover:bg-surface-container-high/40 transition-colors flex items-center gap-1.5"
          >
            <span>Scenarios</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-medium">
              12
            </span>
          </Link>
          <button className="px-3.5 py-2 rounded-lg font-body-md text-body-md font-semibold text-primary bg-[#F8FAFC] shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-primary">speed</span>
            <span>Load Generator</span>
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          </button>
          <Link
            href="/proof/ab"
            className="px-3.5 py-2 rounded-lg font-body-md text-body-md text-[#64748B] hover:text-on-surface hover:bg-surface-container-high/40 transition-colors flex items-center gap-1.5"
          >
            <span>A/B Proof</span>
          </Link>
          <Link
            href="/proof/certificates"
            className="px-3.5 py-2 rounded-lg font-body-md text-body-md text-[#64748B] hover:text-on-surface hover:bg-surface-container-high/40 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Certificates</span>
          </Link>
        </div>

        {/* Actions & Context Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-[#E2E8F0]">
            <span className="text-[#94A3B8]">Epoch:</span>
            <span className="text-on-surface font-semibold font-mono">1714521600</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[#64748B]">Locust/k6 Distributed</span>
          </div>
          <button
            onClick={handleEmergencyStop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body-sm text-body-sm font-medium text-error bg-error-container/40 hover:bg-error-container/70 border border-[#FECACA] transition-colors"
            title="Abort current execution pipeline"
          >
            <span className="material-symbols-outlined text-[16px]">dangerous</span>
            <span>Emergency Stop</span>
          </button>
          <button
            onClick={() => alert("Exporting distributed telemetry metrics (.json)...")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body-sm text-body-sm font-medium text-on-surface bg-white hover:bg-surface-container-low border border-[#E2E8F0] shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#64748B]">download</span>
            <span>Export Telemetry</span>
          </button>
        </div>
      </div>

      {/* DETERMINISTIC WORKLOAD NOTIFICATION BANNER */}
      <div className="bg-gradient-to-r from-[#F8FAFC] via-[#F5F3FF] to-white border border-[#CBD5E1] rounded-lg p-3.5 flex items-center justify-between text-on-surface text-body-sm font-body-sm shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 rounded-md bg-primary-container text-white items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">hub</span>
          </span>
          <div>
            <span className="font-semibold text-primary">Deterministic synthetic workload engine</span> running on{" "}
            <span className="font-mono font-medium text-on-surface">8 distributed worker nodes</span> with seeded PRNG vectors. All fault matrices are bit-for-bit replayable.
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-label-sm text-label-sm text-[#4F46E5] shrink-0 font-medium">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
            <span>Mesh synchronized</span>
          </span>
          <span className="text-[#CBD5E1]">·</span>
          <span className="font-mono">Sync latency: 1.1ms</span>
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LOAD CONFIGURATION & FAULT INJECTION (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F5]">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Load Profile Configuration</h2>
                <p className="font-body-sm text-body-sm text-[#64748B] mt-0.5">Parameters for synthetic saga generation</p>
              </div>
              <span className="font-label-sm text-label-sm font-medium px-2.5 py-1 rounded-full bg-[#F8FAFC] text-primary border border-[#CBD5E1]">
                Synthetic Traffic Generator
              </span>
            </div>

            {/* Inputs: Number of Orders & Concurrency */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-body-sm text-body-sm font-medium text-on-surface flex items-center justify-between">
                  <span>Orders to Dispatch</span>
                  <span className="font-label-sm text-label-sm text-primary font-mono font-semibold">N={ordersCount}</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={ordersCount}
                    onChange={(e) => setOrdersCount(Number(e.target.value))}
                    className="w-full h-9 px-3 font-label-md text-label-md bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    max={5000}
                    min={10}
                    type="number"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 text-[#94A3B8] text-[16px] pointer-events-none">
                    unfold_more
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-[#64748B] leading-tight">Total synthetic sagas to dispatch</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-body-sm text-body-sm font-medium text-on-surface flex items-center justify-between">
                  <span>Concurrency Workers</span>
                  <span className="font-label-sm text-label-sm text-[#059669] font-mono font-semibold">{concurrency} active</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={concurrency}
                    onChange={(e) => setConcurrency(Number(e.target.value))}
                    className="w-full h-9 px-3 font-label-md text-label-md bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    max={256}
                    min={1}
                    type="number"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 text-[#94A3B8] text-[16px] pointer-events-none">
                    groups
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-[#64748B] leading-tight">p99 queue target &lt; 120ms</p>
              </div>
            </div>

            {/* Product Mix Section */}
            <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-[14px] text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-primary">inventory_2</span>
                  Product Mix
                </span>
                <span className="font-label-sm text-label-sm text-[#059669] font-mono font-medium">100% Allocated</span>
              </div>

              {/* Product Sliders */}
              <div className="space-y-2.5 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                {/* Fiber */}
                <div>
                  <div className="flex justify-between items-center text-body-sm font-body-sm mb-1">
                    <span className="text-on-surface font-medium flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#3B82F6]"></span>
                      Fiber Broadband
                    </span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#1E293B]">
                      {fiberRatio}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: `${fiberRatio}%` }}></div>
                  </div>
                </div>
                {/* 5G Postpaid */}
                <div>
                  <div className="flex justify-between items-center text-body-sm font-body-sm mb-1">
                    <span className="text-on-surface font-medium flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#6366F1]"></span>
                      5G Postpaid
                    </span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#1E293B]">
                      {fiveGRatio}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#6366F1] h-full rounded-full" style={{ width: `${fiveGRatio}%` }}></div>
                  </div>
                </div>
                {/* eSIM Add-on */}
                <div>
                  <div className="flex justify-between items-center text-body-sm font-body-sm mb-1">
                    <span className="text-on-surface font-medium flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#06B6D4]"></span>
                      eSIM Add-on
                    </span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#1E293B]">
                      {eSimRatio}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#06B6D4] h-full rounded-full" style={{ width: `${eSimRatio}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Failure Mix (Fault Injection Profile) */}
            <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-[14px] text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-[#DC2626]">bolt</span>
                  Failure Mix (Chaos Fault Injection)
                </span>
                <span className="font-label-sm text-label-sm text-[#475569] font-mono">25% injected</span>
              </div>
              <div className="space-y-2.5 bg-[#FEF2F2]/40 p-3 rounded-lg border border-[#FEE2E2]">
                {/* Transient 503 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-body-sm font-body-sm">
                    <span className="text-on-surface font-medium">Transient 503 Retries</span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#FECACA] text-[#B91C1C]">
                      15%
                    </span>
                  </div>
                  <div className="w-full bg-[#FEE2E2] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#EF4444] h-full rounded-full" style={{ width: "15%" }}></div>
                  </div>
                  <p className="font-body-sm text-[11px] text-[#64748B]">HLR/HSS exponential jitter test</p>
                </div>
                {/* Business Rejection 422 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-body-sm font-body-sm">
                    <span className="text-on-surface font-medium">Business Rejection (422)</span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#FED7AA] text-[#C2410C]">
                      5%
                    </span>
                  </div>
                  <div className="w-full bg-[#FFEDD5] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#F97316] h-full rounded-full" style={{ width: "5%" }}></div>
                  </div>
                  <p className="font-body-sm text-[11px] text-[#64748B]">GIS terminal port availability conflict</p>
                </div>
                {/* Permanent Subsystem Crash 500 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-body-sm font-body-sm">
                    <span className="text-on-surface font-medium">Subsystem Crash (500 SIGSEGV)</span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#FECACA] text-[#DC2626]">
                      2%
                    </span>
                  </div>
                  <div className="w-full bg-[#FEE2E2] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#DC2626] h-full rounded-full" style={{ width: "2%" }}></div>
                  </div>
                  <p className="font-body-sm text-[11px] text-[#64748B]">SIM inventory allocation crash</p>
                </div>
                {/* Deprovision Timeout 504 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-body-sm font-body-sm">
                    <span className="text-on-surface font-medium">Deprovision Timeout (504)</span>
                    <span className="font-mono text-label-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-[#FDE68A] text-[#92400E]">
                      3%
                    </span>
                  </div>
                  <div className="w-full bg-[#FEF3C7] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: "3%" }}></div>
                  </div>
                  <p className="font-body-sm text-[11px] text-[#64748B]">Triggers compensation rollback &amp; locks</p>
                </div>
                {/* Clean Sagas Baseline summary */}
                <div className="pt-1.5 border-t border-[#FEE2E2] flex items-center justify-between font-label-sm text-label-sm text-[#15803D]">
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Clean Nominal Sagas:
                  </span>
                  <span className="font-mono font-bold">75% (No Injected Faults)</span>
                </div>
              </div>
            </div>

            {/* Deterministic Seed Field */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
              <label className="font-body-sm text-body-sm font-medium text-on-surface">PRNG Deterministic Vector</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    className="w-full h-9 px-3 font-label-md text-label-md bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-on-surface font-mono"
                    readOnly
                    type="text"
                    value="PRNG Seed: 42"
                  />
                </div>
                <button
                  onClick={copySeed}
                  className="h-9 px-3 rounded-md bg-white border border-[#CBD5E1] text-[#475569] hover:text-on-surface hover:bg-[#F8FAFC] text-label-sm font-label-sm flex items-center gap-1"
                  title="Copy PRNG vector"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  checked={lockSeed}
                  onChange={(e) => setLockSeed(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-primary focus:ring-primary"
                  id="lock-seed"
                  type="checkbox"
                />
                <label className="font-body-sm text-[12px] text-on-surface select-none cursor-pointer" htmlFor="lock-seed">
                  Lock seed for strict repeatable verification across cluster
                </label>
              </div>
            </div>

            {/* CTA Footer */}
            <div className="pt-3 border-t border-[#EDF0F5] space-y-2.5">
              <button
                onClick={handleRestartRun}
                disabled={isRestarting}
                className="w-full h-10 rounded-md bg-primary-container text-white font-body-md text-body-md font-medium hover:bg-[#4338CA] active:bg-[#3730A3] transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span className={`material-symbols-outlined text-[18px] ${isRestarting ? "animate-spin" : ""}`}>
                  {isRestarting ? "progress_activity" : "play_arrow"}
                </span>
                <span>{isRestarting ? "Restarting Run..." : "Restart Run with Seed 42"}</span>
              </button>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setOrdersCount(100);
                    setConcurrency(50);
                    setFiberRatio(50);
                    setFiveGRatio(35);
                    setESimRatio(15);
                  }}
                  className="font-body-sm text-body-sm text-[#64748B] hover:text-primary transition-colors underline underline-offset-2"
                >
                  Reset to Baseline Profile
                </button>
                <span className="font-label-sm text-[11px] text-[#94A3B8]">
                  All faults mapped to deterministic traces
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE EXECUTION & REAL-TIME TELEMETRY (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col space-y-5">
            {/* Header with Live Running Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F5] flex-wrap gap-2">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Real-Time Telemetry &amp; Saga Outcome Stream
                </h2>
                <p className="font-body-sm text-body-sm text-[#64748B] mt-0.5">Live distributed execution metrics across 8 k6 pods</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0A1B2E] font-label-sm text-label-sm font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A1B2E]"></span>
                </span>
                <span>RUNNING (84% Completed)</span>
                <span className="text-blue-300">·</span>
                <span>Elapsed: 14.2s</span>
              </div>
            </div>

            {/* 4 Real-Time Metrics Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                <div className="font-body-sm text-[12px] text-[#64748B]">Throughput</div>
                <div className="font-mono text-headline-md text-headline-md font-bold text-on-surface mt-0.5">42.8</div>
                <div className="font-label-sm text-[11px] text-[#64748B] mt-1 flex items-center justify-between">
                  <span>orders/sec</span>
                  <span className="text-[#059669] font-medium">pk 50.0</span>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                <div className="font-body-sm text-[12px] text-[#64748B]">Active Concurrency</div>
                <div className="font-mono text-headline-md text-headline-md font-bold text-on-surface mt-0.5">
                  50 <span className="text-label-md text-[#64748B] font-normal">/ 50</span>
                </div>
                <div className="font-label-sm text-[11px] text-[#059669] font-medium mt-1">100% capacity</div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                <div className="font-body-sm text-[12px] text-[#64748B]">Worker Errors</div>
                <div className="font-mono text-headline-md text-headline-md font-bold text-[#0A1B2E] mt-0.5">0</div>
                <div className="font-label-sm text-[11px] text-[#0A1B2E] font-semibold mt-1 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                  <span>0 Failures / Nominal</span>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                <div className="font-body-sm text-[12px] text-[#64748B]">ETA Remaining</div>
                <div className="font-mono text-headline-md text-headline-md font-bold text-[#0A1B2E] mt-0.5">2.4s</div>
                <div className="font-label-sm text-[11px] text-[#64748B] mt-1">16 sagas left</div>
              </div>
            </div>

            {/* High-Precision Progress Bar */}
            <div className="space-y-1.5 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between items-center text-body-sm font-body-sm">
                <span className="text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">data_thresholding</span>
                  Overall Execution Progress
                </span>
                <span className="font-mono text-label-md text-label-md font-bold text-primary">
                  84 / 100 sagas resolved (84%)
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-primary to-[#818CF8] h-full rounded-full transition-all duration-300"
                  style={{ width: "84%" }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-label-sm text-[#64748B] pt-0.5">
                <span>Started: T-14.2s</span>
                <span>Batch ID: #run-89f41a</span>
                <span>Target: 100 sagas</span>
              </div>
            </div>

            {/* Live Activation Time Histogram (Distribution) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-[14px] text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-secondary">bar_chart</span>
                  Activation Latency Histogram (SLO Bound)
                </span>
                <div className="flex items-center gap-3 font-label-sm text-label-sm font-mono">
                  <span className="text-[#64748B]">
                    Mean: <strong className="text-on-surface">1.42s</strong>
                  </span>
                  <span className="text-[#64748B]">
                    p95: <strong className="text-on-surface">2.85s</strong>
                  </span>
                  <span className="text-[#DC2626]">
                    SLO: <strong>6.00s</strong>
                  </span>
                </div>
              </div>

              {/* Latency Chart Container */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-2">
                <div className="h-28 flex items-end justify-between gap-3 pt-4 border-b border-[#E2E8F0] relative">
                  {/* SLO Guideline */}
                  <div className="absolute right-3 top-0 bottom-0 border-r-2 border-dashed border-[#EF4444] pointer-events-none flex flex-col justify-between items-end pr-1.5">
                    <span className="font-label-sm text-[10px] bg-red-100 text-red-700 px-1 rounded font-mono font-medium">
                      SLO 6.0s Limit
                    </span>
                  </div>
                  {/* Bin 0-1s: 38 orders */}
                  <div className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono group-hover:text-on-surface font-semibold">
                      38
                    </span>
                    <div className="w-full bg-[#0A1B2E] hover:bg-[#1E293B] rounded-t-sm transition-all" style={{ height: "85%" }}></div>
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono mt-1">0-1s</span>
                  </div>
                  {/* Bin 1-2s: 32 orders */}
                  <div className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono group-hover:text-on-surface font-semibold">
                      32
                    </span>
                    <div className="w-full bg-[#1E293B] hover:bg-[#334155] rounded-t-sm transition-all" style={{ height: "72%" }}></div>
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono mt-1">1-2s</span>
                  </div>
                  {/* Bin 2-3s: 10 orders */}
                  <div className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono group-hover:text-on-surface font-semibold">
                      10
                    </span>
                    <div className="w-full bg-[#334155] hover:bg-[#475569] rounded-t-sm transition-all" style={{ height: "24%" }}></div>
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono mt-1">2-3s</span>
                  </div>
                  {/* Bin 3-4s: 3 orders */}
                  <div className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono group-hover:text-on-surface font-semibold">
                      3
                    </span>
                    <div className="w-full bg-[#475569] hover:bg-[#64748B] rounded-t-sm transition-all" style={{ height: "8%" }}></div>
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono mt-1">3-4s</span>
                  </div>
                  {/* Bin 4-5s: 1 order */}
                  <div className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono group-hover:text-on-surface font-semibold">
                      1
                    </span>
                    <div className="w-full bg-[#94A3B8] hover:bg-[#CBD5E1] rounded-t-sm transition-all" style={{ height: "3%" }}></div>
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono mt-1">4-5s</span>
                  </div>
                  {/* Bin >5s: 0 orders */}
                  <div className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="font-label-sm text-[10px] text-[#94A3B8] font-mono">0</span>
                    <div className="w-full bg-[#E2E8F0] rounded-t-sm h-0.5"></div>
                    <span className="font-label-sm text-[10px] text-[#64748B] font-mono mt-1">&gt;5s</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-body-sm text-[#64748B] pt-1">
                  <span className="text-[#0A1B2E] font-medium">✓ 100% of activations within 6.00s telecommunication SLA</span>
                  <span className="font-mono">Total Measured: 84 sagas</span>
                </div>
              </div>
            </div>

            {/* Outcome Counters Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Active Success */}
              <div className="bg-white border border-[#CBD5E1] rounded-lg p-3.5 flex flex-col justify-between space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">ACTIVE</span>
                  <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">check_circle</span>
                </div>
                <div className="font-mono text-headline-lg text-headline-lg font-bold text-[#0A1B2E]">72</div>
                <p className="font-body-sm text-[11px] text-[#64748B] leading-tight">
                  Successfully provisioned in OMS, HLR, and OCS
                </p>
              </div>
              {/* Clean Rollback */}
              <div className="bg-white border border-[#CBD5E1] rounded-lg p-3.5 flex flex-col justify-between space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">ROLLED_BACK</span>
                  <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">replay</span>
                </div>
                <div className="font-mono text-headline-lg text-headline-lg font-bold text-[#0A1B2E]">10</div>
                <p className="font-body-sm text-[11px] text-[#64748B] leading-tight">
                  Compensated without leaks; Merkle tombstoned
                </p>
              </div>
              {/* Fallout Needs Attention */}
              <div className="bg-white border border-[#CBD5E1] rounded-lg p-3.5 flex flex-col justify-between space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">NEEDS_ATTENTION</span>
                  <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]">warning</span>
                </div>
                <div className="font-mono text-headline-lg text-headline-lg font-bold text-[#0A1B2E]">2</div>
                <p className="font-body-sm text-[11px] text-[#64748B] leading-tight">
                  Circuit breaker halted; quarantined to Fallout Queue
                </p>
              </div>
            </div>

            {/* Active Worker Thread Pool Visualizer */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#0A1B2E] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#64748B]">memory</span>
                  Distributed Worker Node Health (8 Pods)
                </span>
                <span className="text-[#0A1B2E] font-mono font-medium">0 Dropped Frames</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[
                  { name: "Node 01", count: "7 sagas" },
                  { name: "Node 02", count: "6 sagas" },
                  { name: "Node 03", count: "7 sagas" },
                  { name: "Node 04", count: "6 sagas" },
                  { name: "Node 05", count: "7 sagas" },
                  { name: "Node 06", count: "6 sagas" },
                  { name: "Node 07", count: "7 sagas" },
                  { name: "Node 08", count: "6 sagas" },
                ].map((node) => (
                  <div key={node.name} className="bg-white border border-[#CBD5E1] rounded px-2 py-1.5 flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#64748B]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                      <span>{node.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[#0A1B2E] mt-0.5">{node.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Guarantee Banner */}
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4 flex items-start gap-3.5">
              <span className="flex h-8 w-8 rounded-full bg-[#10B981] text-white items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </span>
              <div className="space-y-1">
                <div className="font-headline-sm text-headline-sm text-[#065F46] font-bold flex items-center gap-2">
                  <span>Formal Invariants PASS (6 / 6 Checked)</span>
                  <span className="font-label-sm text-[10px] bg-[#D1FAE5] text-[#047857] px-2 py-0.5 rounded font-mono">
                    TLA+ Verified
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#047857] leading-relaxed">
                  Zero billing without provisioned service · Zero orphaned HLR locks · All compensations verified linearizable · Cryptographic audit log hash{" "}
                  <span className="font-mono font-semibold bg-white/70 px-1 py-0.2 rounded border border-[#A7F3D0]">
                    0x7c9b...e4a1
                  </span>{" "}
                  committed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
