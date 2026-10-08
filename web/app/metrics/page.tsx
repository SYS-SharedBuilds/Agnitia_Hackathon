"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "24h" | "7d">("24h");
  const [exportOpen, setExportOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* TOP CONTROLS & TELEMETRY HEADER */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
              Telemetry &amp; SLO Metrics
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-secondary shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
                Live Streaming (SSE)
              </span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Real-time orchestration throughput, tail latency percentiles, saga rollback fidelity, and subsystem bulkhead saturation
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
          {/* Time Range Segmented Pill */}
          <div className="flex items-center p-0.5 rounded-xl bg-surface-container shadow-sm border border-outline-variant/30">
            {(["15m", "1h", "24h", "7d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                  timeRange === range
                    ? "font-semibold bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Auto-refresh button */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/30 font-label-sm text-label-sm shadow-sm transition-colors ${
              autoRefresh
                ? "bg-surface-container-lowest text-on-surface"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[15px] text-primary ${
                autoRefresh ? "animate-spin" : ""
              }`}
              style={{ animationDuration: "9s" }}
            >
              sync
            </span>
            <span>{autoRefresh ? "Auto-refresh 30s" : "Paused"}</span>
          </button>

          {/* Export Metrics Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm shadow-sm hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Metrics</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-xl bg-surface-container-lowest shadow-lg border border-outline-variant/40 py-1 z-30">
                <a
                  className="flex items-center gap-2 px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  href="/api/metrics/prometheus"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">terminal</span>
                  Prometheus Metrics
                </a>
                <a
                  className="flex items-center gap-2 px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  href="/api/metrics/export?format=csv"
                  download
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary">table_view</span>
                  Aggregated CSV
                </a>
                <a
                  className="flex items-center gap-2 px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  href="/api/metrics/slo-audit.pdf"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[16px] text-error">picture_as_pdf</span>
                  SLO Audit PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ROW 1: 6 KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Success Rate */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Success Rate
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              +0.18%
            </span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              98.42%
            </span>
          </div>
          <div className="pt-2 bg-surface-container-low/40 rounded-lg p-1.5 border border-outline-variant/20">
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>1,264 / 1,284 sagas</span>
              <span className="text-secondary font-semibold">PASS</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-1 overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "98.42%" }}></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Clean-Rollback Rate */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Clean Rollback
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
              Consistent
            </span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              99.85%
            </span>
          </div>
          <div className="pt-2 bg-surface-container-low/40 rounded-lg p-1.5 border border-outline-variant/20">
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              14 / 14 failed sagas reached terminal consistency
            </p>
          </div>
        </div>

        {/* KPI 3: Consistency Rate */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Consistency Rate
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              0 Leaks
            </span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              100.0%
            </span>
          </div>
          <div className="pt-2 bg-surface-container-low/40 rounded-lg p-1.5 border border-outline-variant/20">
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Cross-system ledger verification verified
            </p>
          </div>
        </div>

        {/* KPI 4: Needs Attention */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Needs Attention
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-bold border border-error/20">
              <span className="material-symbols-outlined text-[12px]">warning</span>
              SLA Warning
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-error tracking-tight font-bold">2</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">orders blocked</span>
          </div>
          <div className="pt-2 bg-error-container/30 rounded-lg p-1.5 border border-error/20">
            <p className="font-body-sm text-body-sm text-error font-medium line-clamp-2">
              Manual intervention pending in Fallout Queue
            </p>
          </div>
        </div>

        {/* KPI 5: Total Retries */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Retries
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
              -12% vs avg
            </span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">142</span>
          </div>
          <div className="pt-2 bg-surface-container-low/40 rounded-lg p-1.5 border border-outline-variant/20">
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Exponential backoffs across all sagas
            </p>
          </div>
        </div>

        {/* KPI 6: Avg Retries / Order */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Retries / Order
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-medium border border-outline-variant/20">
              &lt; 0.25 SLO
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">0.11</span>
            <span className="font-label-sm text-label-sm text-secondary font-mono">optimal</span>
          </div>
          <div className="pt-2 bg-surface-container-low/40 rounded-lg p-1.5 border border-outline-variant/20">
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Median retries per provisioned order
            </p>
          </div>
        </div>
      </section>

      {/* ROW 2: DUAL CHART SECTION (8 cols + 4 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Activation Time Percentiles (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 bg-surface-container-low/50 px-3 py-2 rounded-lg border border-outline-variant/20">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Activation Time Percentiles
                </h2>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-primary font-medium border border-outline-variant/30">
                  SLA Target: 6.00s
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                End-to-end orchestration duration (Order Submitted → Active in HLR/OCS)
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Legend Items */}
              <div className="flex flex-wrap items-center gap-3 font-label-sm text-label-sm">
                <span className="inline-flex items-center gap-1.5 text-on-surface">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary"></span>
                  <span>p50: 1.4s</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-on-surface">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  <span>p95: 4.2s</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-on-surface">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary-container"></span>
                  <span>p99: 5.8s</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-error font-medium">
                  <span className="h-0.5 w-3 bg-error inline-block"></span>
                  <span>SLO: 6.0s</span>
                </span>
              </div>
            </div>
          </div>

          {/* Rich SVG Telemetry Chart Container */}
          <div className="relative w-full h-[290px] pt-4 select-none">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
              <defs>
                <linearGradient id="p50Grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0051d5" stopOpacity="0.25"></stop>
                  <stop offset="100%" stopColor="#0051d5" stopOpacity="0.0"></stop>
                </linearGradient>
                <linearGradient id="p95Grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3525cd" stopOpacity="0.20"></stop>
                  <stop offset="100%" stopColor="#3525cd" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>

              {/* Horizontal Reference Gridlines & Y-Axis Labels */}
              {/* 6s (SLO) */}
              <line stroke="#ba1a1a" strokeDasharray="4 4" strokeWidth="1.5" x1="40" x2="780" y1="36"></line>
              <text className="font-mono text-[10px]" fill="#ba1a1a" fontWeight="600" textAnchor="end" x="34" y="40">
                6.0s (SLO)
              </text>
              {/* 4.5s */}
              <line stroke="#eaedff" strokeWidth="1" x1="40" x2="780" y1="80"></line>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="end" x="34" y="84">
                4.5s
              </text>
              {/* 3.0s */}
              <line stroke="#eaedff" strokeWidth="1" x1="40" x2="780" y1="125"></line>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="end" x="34" y="129">
                3.0s
              </text>
              {/* 1.5s */}
              <line stroke="#eaedff" strokeWidth="1" x1="40" x2="780" y1="170"></line>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="end" x="34" y="174">
                1.5s
              </text>
              {/* 0.0s */}
              <line stroke="#dae2fd" strokeWidth="1" x1="40" x2="780" y1="215"></line>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="end" x="34" y="219">
                0.0s
              </text>

              {/* Vertical Time Guides */}
              <line stroke="#f2f3ff" strokeWidth="1" x1="163" x2="163" y1="36" y2="215"></line>
              <line stroke="#f2f3ff" strokeWidth="1" x1="286" x2="286" y1="36" y2="215"></line>
              <line stroke="#f2f3ff" strokeWidth="1" x1="410" x2="410" y1="36" y2="215"></line>
              <line stroke="#f2f3ff" strokeWidth="1" x1="533" x2="533" y1="36" y2="215"></line>
              <line stroke="#f2f3ff" strokeWidth="1" x1="656" x2="656" y1="36" y2="215"></line>

              {/* Area Fills */}
              <path
                d="M 40,172 Q 100,174 163,169 T 286,173 T 410,165 T 533,168 T 656,170 T 780,168 L 780,215 L 40,215 Z"
                fill="url(#p50Grad)"
              ></path>

              {/* Curve: p99 */}
              <path
                d="M 40,65 C 100,62 163,60 220,68 C 286,74 340,56 410,50 C 470,44 520,58 580,52 C 640,46 700,56 780,50"
                fill="none"
                stroke="#316bf3"
                strokeWidth="2.2"
              ></path>
              {/* Curve: p95 */}
              <path
                d="M 40,94 C 100,90 163,98 220,92 C 286,88 340,82 410,88 C 470,95 520,84 580,82 C 640,80 700,85 780,84"
                fill="none"
                stroke="#3525cd"
                strokeWidth="2.5"
              ></path>
              {/* Curve: p50 */}
              <path
                d="M 40,172 C 100,174 163,169 220,170 C 286,173 340,166 410,165 C 470,167 520,169 580,168 C 640,171 700,169 780,168"
                fill="none"
                stroke="#0051d5"
                strokeWidth="2.2"
              ></path>

              {/* Highlighted Point Indicator at 14:00 (X=460) */}
              <line stroke="#3525cd" strokeDasharray="2 2" strokeWidth="1.2" x1="460" x2="460" y1="36" y2="215"></line>
              <circle cx="460" cy="51" fill="#316bf3" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx="460" cy="89" fill="#3525cd" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx="460" cy="166" fill="#0051d5" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>

              {/* X-Axis Labels */}
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="middle" x="40" y="232">
                00:00
              </text>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="middle" x="163" y="232">
                04:00
              </text>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="middle" x="286" y="232">
                08:00
              </text>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="middle" x="410" y="232">
                12:00
              </text>
              <text className="font-mono text-[10px]" fill="#3525cd" fontWeight="600" textAnchor="middle" x="533" y="232">
                16:00 (Peak)
              </text>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="middle" x="656" y="232">
                20:00
              </text>
              <text className="font-mono text-[10px]" fill="#777587" textAnchor="middle" x="780" y="232">
                24:00
              </text>
            </svg>

            {/* Floating Inspection Tooltip for 14:00 Point */}
            <div className="absolute top-4 left-[53%] -translate-x-1/2 rounded-xl bg-on-surface text-surface px-3 py-2 shadow-xl pointer-events-none z-10 w-60 border border-outline/30">
              <div className="flex items-center justify-between pb-1 bg-surface/10 px-1 rounded mb-1">
                <span className="font-label-sm text-label-sm font-semibold text-secondary-fixed">14:00 UTC Sampling</span>
                <span className="font-label-sm text-label-sm text-surface-variant">482 tx</span>
              </div>
              <div className="space-y-0.5 font-label-sm text-label-sm">
                <div className="flex justify-between items-center text-secondary-fixed">
                  <span>p50 (Median):</span>
                  <span className="font-bold">1.38s</span>
                </div>
                <div className="flex justify-between items-center text-primary-fixed">
                  <span>p95 (Tail):</span>
                  <span className="font-bold">4.12s</span>
                </div>
                <div className="flex justify-between items-center text-secondary-container">
                  <span>p99 (Outlier):</span>
                  <span className="font-bold">5.65s</span>
                </div>
                <div className="pt-1 flex items-center justify-between text-secondary">
                  <span>SLO Status:</span>
                  <span className="font-semibold">Compliant (-0.35s headroom)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 mt-2">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Measured via 100% trace sampling across distributed Temporal workers.
            </span>
            <Link
              href="http://localhost:8233"
              target="_blank"
              className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary hover:text-primary-container"
            >
              <span>View temporal trace tree</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Right Chart: Activation Time Distribution Histogram (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 bg-surface-container-low/50 px-3 py-2 rounded-lg border border-outline-variant/20">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Latency Distribution</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Binned frequency of complete activations</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
                99.2% in SLA
              </span>
            </div>

            {/* Vertical Histogram Bars */}
            <div className="mt-4 space-y-2">
              {/* 0-1s */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">0 - 1.0s</span>
                  <span className="text-on-surface font-semibold">248 (19.3%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-secondary h-full rounded" style={{ width: "32%" }}></div>
                </div>
              </div>
              {/* 1-2s */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">1.0 - 2.0s</span>
                  <span className="text-on-surface font-semibold">512 (39.8%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-secondary h-full rounded" style={{ width: "78%" }}></div>
                </div>
              </div>
              {/* 2-3s */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">2.0 - 3.0s</span>
                  <span className="text-on-surface font-semibold">310 (24.1%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-primary h-full rounded" style={{ width: "52%" }}></div>
                </div>
              </div>
              {/* 3-4s */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">3.0 - 4.0s</span>
                  <span className="text-on-surface font-semibold">124 (9.6%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-primary h-full rounded" style={{ width: "25%" }}></div>
                </div>
              </div>
              {/* 4-5s */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">4.0 - 5.0s</span>
                  <span className="text-on-surface font-semibold">58 (4.5%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-secondary-container h-full rounded" style={{ width: "14%" }}></div>
                </div>
              </div>
              {/* 5-6s */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">5.0 - 6.0s (SLA Edge)</span>
                  <span className="text-on-surface font-semibold">22 (1.7%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-secondary-container h-full rounded" style={{ width: "7%" }}></div>
                </div>
              </div>
              {/* >6.0s SLA Breach Line & Bar */}
              <div className="pt-1 bg-error-container/20 p-2 rounded-lg border border-error/20">
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1 text-error font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    &gt; 6.0s (SLO Breach)
                  </span>
                  <span>10 (0.8%)</span>
                </div>
                <div className="h-5 w-full bg-surface-container rounded overflow-hidden flex">
                  <div className="bg-error h-full rounded" style={{ width: "3.5%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Histogram Summary Pill */}
          <div className="mt-4 p-2.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-on-surface flex items-center justify-between border border-outline-variant/20">
            <div>
              <span className="text-on-surface-variant">Mean:</span> <span className="font-bold">2.18s</span>
            </div>
            <div>
              <span className="text-on-surface-variant">StdDev:</span> <span className="font-bold">0.84s</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Breaches:</span> <span className="font-bold text-error">10</span>
            </div>
          </div>
        </div>
      </section>

      {/* ROW 3: PER-SUBSYSTEM PERFORMANCE & BULKHEADS */}
      <section className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Subsystem Health &amp; Resource Pools (Bulkhead Isolation)
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Partitioned worker threads, outbound gRPC concurrency caps, and live circuit breaker triggers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container text-tertiary border border-outline-variant/30 font-medium">
              5 Downstream Providers
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* 1. OMS Core */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">OMS Core</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Order Management Engine</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
                  CLOSED
                </span>
              </div>
              <div className="mt-3.5 space-y-1.5 font-label-sm text-label-sm">
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Req Rate:</span>
                  <span className="font-semibold text-on-surface">42.4 req/s</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">p95 Latency:</span>
                  <span className="font-semibold text-on-surface">220ms</span>
                </div>
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Error Rate:</span>
                  <span className="font-semibold text-secondary">0.01%</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">Retries (24h):</span>
                  <span className="font-semibold text-on-surface">2</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-surface-container-low/60 rounded-lg p-2 border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                <span className="text-on-surface-variant">Bulkhead Slots:</span>
                <span className="font-semibold text-on-surface">3 / 20 (15%)</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "15%" }}></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Protocol:</span>
                <span className="font-mono text-tertiary">gRPC / HTTP2</span>
              </div>
            </div>
          </div>

          {/* 2. SIM / eSIM Inventory */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">SIM/eSIM Pool</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Inventory &amp; SM-DP+ Profile</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
                  CLOSED
                </span>
              </div>
              <div className="mt-3.5 space-y-1.5 font-label-sm text-label-sm">
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Req Rate:</span>
                  <span className="font-semibold text-on-surface">18.2 req/s</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">p95 Latency:</span>
                  <span className="font-semibold text-on-surface">340ms</span>
                </div>
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Error Rate:</span>
                  <span className="font-semibold text-on-surface">0.12%</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">Retries (24h):</span>
                  <span className="font-semibold text-on-surface">14</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-surface-container-low/60 rounded-lg p-2 border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                <span className="text-on-surface-variant">Bulkhead Slots:</span>
                <span className="font-semibold text-on-surface">6 / 15 (40%)</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "40%" }}></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Protocol:</span>
                <span className="font-mono text-tertiary">REST / SM-DP+</span>
              </div>
            </div>
          </div>

          {/* 3. HLR/HSS Network Gateway (Warning State) */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary-container"></div>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">HLR/HSS Gateway</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Home Subscriber Server</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary-container font-label-sm text-label-sm font-bold border border-secondary-container/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-container animate-pulse"></span>
                  HALF-OPEN
                </span>
              </div>
              <div className="mt-3.5 space-y-1.5 font-label-sm text-label-sm">
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Req Rate:</span>
                  <span className="font-semibold text-on-surface">16.8 req/s</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">p95 Latency:</span>
                  <span className="font-semibold text-secondary-container">1,420ms</span>
                </div>
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Error Rate:</span>
                  <span className="font-semibold text-secondary-container">2.45%</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">Retries (24h):</span>
                  <span className="font-semibold text-secondary-container">58</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-surface-container-low/60 rounded-lg p-2 border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                <span className="text-secondary-container font-semibold">Bulkhead Slots:</span>
                <span className="font-bold text-secondary-container">9 / 10 (90%)</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary-container h-full rounded-full" style={{ width: "90%" }}></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Protocol:</span>
                <span className="font-mono text-tertiary">Diameter / gRPC</span>
              </div>
            </div>
          </div>

          {/* 4. OCS Billing & Rating */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">OCS Billing</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Online Charging System</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
                  CLOSED
                </span>
              </div>
              <div className="mt-3.5 space-y-1.5 font-label-sm text-label-sm">
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Req Rate:</span>
                  <span className="font-semibold text-on-surface">24.1 req/s</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">p95 Latency:</span>
                  <span className="font-semibold text-on-surface">420ms</span>
                </div>
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Error Rate:</span>
                  <span className="font-semibold text-on-surface">0.84%</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">Retries (24h):</span>
                  <span className="font-semibold text-on-surface">42</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-surface-container-low/60 rounded-lg p-2 border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                <span className="text-on-surface-variant">Bulkhead Slots:</span>
                <span className="font-semibold text-on-surface">7 / 16 (44%)</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "44%" }}></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Protocol:</span>
                <span className="font-mono text-tertiary">Ro / REST</span>
              </div>
            </div>
          </div>

          {/* 5. Customer Notification (SMS-C/Push) */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Notification Hub</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">SMS-C &amp; Device Push</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
                  CLOSED
                </span>
              </div>
              <div className="mt-3.5 space-y-1.5 font-label-sm text-label-sm">
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Req Rate:</span>
                  <span className="font-semibold text-on-surface">12.0 req/s</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">p95 Latency:</span>
                  <span className="font-semibold text-on-surface">180ms</span>
                </div>
                <div className="flex justify-between py-0.5 bg-surface-container-low/50 px-1.5 rounded">
                  <span className="text-on-surface-variant">Error Rate:</span>
                  <span className="font-semibold text-secondary">0.05%</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5">
                  <span className="text-on-surface-variant">Retries (24h):</span>
                  <span className="font-semibold text-on-surface">4</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-surface-container-low/60 rounded-lg p-2 border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                <span className="text-on-surface-variant">Bulkhead Slots:</span>
                <span className="font-semibold text-on-surface">2 / 10 (20%)</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "20%" }}></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Protocol:</span>
                <span className="font-mono text-tertiary">SMPP / Webhook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROW 4: ROOT-CAUSE & ROLLBACK ANALYTICS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Card Left: Failure Causes Breakdown */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 bg-surface-container-low/50 px-3 py-2 rounded-lg border border-outline-variant/20">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Failure Causes Breakdown (Last 24h)
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Root categorizations for 25 total failed sub-operations
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold border border-outline-variant/30">
                <span>MTTR: 1.8s</span>
              </div>
            </div>

            {/* Segmented Stack Bar */}
            <div className="mt-4">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-surface-container">
                <div className="bg-secondary-container h-full" style={{ width: "48%" }} title="HLR 504 Timeout: 48%"></div>
                <div className="bg-error h-full" style={{ width: "32%" }} title="OCS HTTP 500: 32%"></div>
                <div className="bg-primary h-full" style={{ width: "12%" }} title="SIM Pool Exhaustion: 12%"></div>
                <div className="bg-tertiary h-full" style={{ width: "8%" }} title="Geocoding: 8%"></div>
              </div>
            </div>

            {/* List Breakdown Details */}
            <div className="mt-4 space-y-2.5">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-3 w-3 rounded bg-secondary-container shrink-0"></span>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-medium text-on-surface truncate">
                      HLR Gateway 504 Gateway Timeout
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Diameter peer failover transient timeout
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface">12 occurrences</span>
                  <span className="font-label-sm text-label-sm text-secondary-container block">48.0%</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-3 w-3 rounded bg-error shrink-0"></span>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-medium text-on-surface truncate">
                      OCS Rating HTTP 500 Subsystem Error
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Quota balance concurrency lock contention
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface">8 occurrences</span>
                  <span className="font-label-sm text-label-sm text-error block">32.0%</span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-3 w-3 rounded bg-primary shrink-0"></span>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-medium text-on-surface truncate">
                      SIM Pool Partition Exhaustion
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      EUICC profile reservation depleted in Region 4
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface">3 occurrences</span>
                  <span className="font-label-sm text-label-sm text-primary block">12.0%</span>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-3 w-3 rounded bg-tertiary shrink-0"></span>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-medium text-on-surface truncate">
                      Address Geocoding / Tax Jurisdiction
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Postcode boundary mismatch in upstream CRM
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface">2 occurrences</span>
                  <span className="font-label-sm text-label-sm text-tertiary block">8.0%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-2 border-t border-outline-variant/20">
            <span>Automatic remediation active: Exponential backoff + Jitter</span>
            <span className="text-secondary font-semibold">100% resolved or rollbacked</span>
          </div>
        </div>

        {/* Card Right: Saga Rollbacks by Failing Task */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 bg-surface-container-low/50 px-3 py-2 rounded-lg border border-outline-variant/20">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Saga Rollbacks by Failing Task
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Compensation workflows triggered per pipeline step
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/20">
                Clean Abort: 100%
              </span>
            </div>

            {/* Task Compensation Stack Bars */}
            <div className="mt-4 space-y-4">
              {/* Step: Start Charging */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">Task 4: Start Charging (OCS)</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">• 3 compensations dispatched</span>
                  </div>
                  <span className="font-bold text-on-surface">8 rollbacks</span>
                </div>
                <div className="w-full bg-surface-container h-4 rounded overflow-hidden flex">
                  <div className="bg-primary h-full rounded" style={{ width: "57%" }}></div>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px] text-secondary">undo</span>
                  <span>Undid: Deprovision Network + Release SIM + Close Billing Ledger</span>
                </div>
              </div>

              {/* Step: Provision Network */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">Task 3: Provision Network (HLR/HSS)</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">• 1 compensation dispatched</span>
                  </div>
                  <span className="font-bold text-on-surface">6 rollbacks</span>
                </div>
                <div className="w-full bg-surface-container h-4 rounded overflow-hidden flex">
                  <div className="bg-primary-container h-full rounded" style={{ width: "42%" }}></div>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px] text-secondary">undo</span>
                  <span>Undid: Release SIM / eSIM Reservation</span>
                </div>
              </div>

              {/* Step: Reserve Inventory */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">Task 2: Reserve Inventory (SIM Pool)</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">• Clean early abort</span>
                  </div>
                  <span className="font-bold text-on-surface">2 rollbacks</span>
                </div>
                <div className="w-full bg-surface-container h-4 rounded overflow-hidden flex">
                  <div className="bg-secondary h-full rounded" style={{ width: "14%" }}></div>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px] text-secondary">check_circle</span>
                  <span>Undid: None required (clean cancel before state commit)</span>
                </div>
              </div>

              {/* Step: Validate Order */}
              <div>
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">Task 1: Validate Order Schema</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">• Pre-saga check</span>
                  </div>
                  <span className="font-bold text-on-surface">0 rollbacks</span>
                </div>
                <div className="w-full bg-surface-container h-4 rounded overflow-hidden flex">
                  <div className="bg-surface-variant h-full rounded" style={{ width: "0%" }}></div>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px] text-secondary">check</span>
                  <span>Rejected before saga orchestration instantiated</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-on-surface flex items-center justify-between border border-outline-variant/20">
            <span className="text-on-surface-variant">Distributed Ledger Guarantee:</span>
            <span className="font-semibold text-secondary">100% Cryptographic Tombstone Verification</span>
          </div>
        </div>
      </section>

      {/* ROW 5: OPERATIONAL FOOTNOTE / METHODOLOGY BAR */}
      <footer className="mt-2 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-on-surface-variant">
        <div className="flex items-start md:items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5 md:mt-0">info</span>
          <p className="font-body-sm text-body-sm leading-relaxed">
            <strong>Telemetry Methodology:</strong> Activation time calculated as{" "}
            <code className="font-mono text-primary font-medium">created_at → ACTIVE status</code>. Success rate excludes
            orders intentionally <code className="font-mono">CANCELLED</code> by operator action. Clean-Rollback
            confirms zero orphaned resources across OMS, HSS, and OCS within configured SLA. Cryptographic proof emitted
            via Merkle tree audit log.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto font-label-sm text-label-sm font-mono text-tertiary">
          <span>Cluster: us-east-core-prod-02</span>
          <span>•</span>
          <span>Epoch: 1714521600</span>
        </div>
      </footer>
    </div>
  );
}
