"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderReplayPage() {
  const { id } = useParams();
  const orderId = (typeof id === "string" ? id : Array.isArray(id) ? id[0] : "") || "ORD-20260712-004217";

  const [currentSeq, setCurrentSeq] = useState(27);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<"0.5×" | "1.0×" | "2.0×" | "4.0×">("1.0×");
  const [activeInspectorTab, setActiveRightTab] = useState<"timeline" | "task" | "variables">("timeline");
  const [copiedId, setCopiedId] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleExportReplay = () => {
    const replaySlice = {
      orderId,
      workflowId: "wf-fiber-saga-991024-aa7b",
      sequenceHead: currentSeq,
      totalSequences: 42,
      capturedAt: "2026-07-12T14:22:07.820Z",
      state: "COMPENSATING (HISTORICAL SLICE)",
      activeTask: "Deprovision Network",
      activeWorker: "hlr-east-01-pod-7b",
      payloadSnapshot: {
        imsi: "310410•••••••••",
        action: "TEARDOWN_SLICE",
        profile_id: "MSISDN-4821",
        rollback_nonce: "991024-aa7b-c1",
      },
    };
    const blob = new Blob([JSON.stringify(replaySlice, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orderId}-replay-seq${currentSeq}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* Replay Breadcrumb & Workflow Identifiers */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-body-sm">
        <div className="flex items-center gap-2">
          <Link href="/orders" className="hover:text-primary cursor-pointer transition-colors">
            Orders
          </Link>
          <span className="text-outline-variant font-label-sm">/</span>
          <span className="font-label-md font-semibold text-on-surface bg-surface-container px-2 py-0.5 rounded">
            {orderId}
          </span>
          <span className="text-outline-variant">·</span>
          <span className="text-on-surface font-medium">Fiber Activation Saga</span>
          <span className="font-label-sm text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 rounded font-mono">
            v1.18.4
          </span>
        </div>
        <div className="flex items-center gap-2 font-label-sm font-mono text-tertiary">
          <span>Workflow ID:</span>
          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface select-all">
            wf-fiber-saga-991024-aa7b
          </span>
          <button
            onClick={() => handleCopy("wf-fiber-saga-991024-aa7b")}
            className="hover:text-primary transition-colors cursor-pointer"
            title="Copy Workflow ID"
          >
            <span className="material-symbols-outlined text-[15px] align-middle">content_copy</span>
          </button>
        </div>
      </div>

      {/* Primary Header Band with Replay Status */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-4 border border-[#E3E8F0]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface font-semibold">
                {orderId}
              </h1>
              <button
                onClick={() => handleCopy(orderId)}
                className="p-1 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container-low transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copiedId ? "check" : "content_copy"}
                </span>
              </button>
            </div>
            {/* Replay Status Badge with Amber Pulsing Pill */}
            <span className="inline-flex items-center gap-2 font-label-sm text-label-sm font-semibold bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full border border-[#FDE68A]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706]"></span>
              </span>
              REPLAY MODE ACTIVE
            </span>
            {/* Saga Compensation Badge */}
            <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm font-medium bg-[#FEE2E2] text-[#991B1B] px-3 py-1 rounded-full border border-[#FECACA]">
              <span className="material-symbols-outlined text-[14px]">replay_circle_filled</span>
              COMPENSATING (HISTORICAL SLICE)
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-on-primary font-body-md font-medium rounded-lg hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-[#86EFAC] animate-pulse"></span>
              <span>Return to Live</span>
            </Link>
            <Link
              href="/proof/certificates"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-surface-container-lowest text-on-surface border border-[#E2E8F0] font-body-md font-medium rounded-lg hover:bg-surface-container-low transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
              <span>View Certificate</span>
            </Link>
            <button
              onClick={handleExportReplay}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-surface-container-lowest text-on-surface border border-[#E2E8F0] font-body-md font-medium rounded-lg hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#64748B]">file_download</span>
              <span>Export Replay Slice</span>
            </button>
            <a
              className="inline-flex items-center gap-1.5 h-9 px-3 bg-surface-container text-primary font-body-md font-medium rounded-lg hover:bg-primary-fixed transition-colors"
              href="http://localhost:8233"
              target="_blank"
              rel="noreferrer"
            >
              <span>Temporal UI</span>
              <span className="material-symbols-outlined text-[15px]">north_east</span>
            </a>
          </div>
        </div>

        {/* Metadata Grid Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 bg-surface-container-low/70 p-3 rounded-lg font-body-sm text-on-surface-variant">
          <div>
            <div className="text-tertiary font-label-sm uppercase font-mono">PRODUCT</div>
            <div className="font-medium text-on-surface mt-0.5 truncate">Fiber Broadband 500</div>
          </div>
          <div>
            <div className="text-tertiary font-label-sm uppercase font-mono">CUSTOMER</div>
            <div className="font-medium text-on-surface mt-0.5 truncate">Marcus Vance</div>
            <div className="font-label-sm font-mono text-tertiary truncate">+1 555 019-4821</div>
          </div>
          <div>
            <div className="text-tertiary font-label-sm uppercase font-mono">CLIENT REF</div>
            <div className="font-label-sm font-mono text-on-surface mt-0.5 truncate">EXT-CRM-991024</div>
          </div>
          <div>
            <div className="text-tertiary font-label-sm uppercase font-mono">CREATED (UTC)</div>
            <div className="font-label-sm font-mono text-on-surface mt-0.5">2026-07-12 14:22:04</div>
          </div>
          <div>
            <div className="text-tertiary font-label-sm uppercase font-mono">SNAPSHOT AT SEQ 27</div>
            <div className="font-label-sm font-mono text-primary font-medium mt-0.5">14:22:07.820 UTC</div>
          </div>
          <div>
            <div className="text-tertiary font-label-sm uppercase font-mono">ELAPSED AT SLICE</div>
            <div className="font-label-sm font-mono text-secondary font-medium mt-0.5">+3.820s (42 Total)</div>
          </div>
        </div>
      </section>

      {/* Interactive Replay Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Center DAG / Saga Canvas (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col space-y-3">
          {/* Amber Notice Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-lg bg-[#FEF3C7] text-[#78350F] shadow-sm font-body-sm border border-[#FDE68A]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#B45309] text-[20px] shrink-0">fast_rewind</span>
              <div className="leading-snug">
                <span className="font-semibold">REPLAY — viewing history at seq {currentSeq} of 42</span>
                <span className="font-label-sm font-mono text-[#92400E] ml-1">(Captured 14:22:07.820 UTC)</span>
                <p className="text-[11px] text-[#92400E]/90 mt-0.5">
                  Task states, variable bindings, and subsystem payloads reflect historical snapshot prior to compensation cascade completion.
                </p>
              </div>
            </div>
            <Link
              href={`/orders/${orderId}`}
              className="shrink-0 inline-flex items-center gap-1 font-label-sm font-semibold text-[#92400E] hover:text-[#451A03] bg-white/70 px-2.5 py-1 rounded transition-colors"
            >
              <span>Return to Live (Seq 42)</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </Link>
          </div>

          {/* DAG Diagram Workspace Container */}
          <div className="relative bg-surface-container-lowest rounded-xl shadow-sm p-6 overflow-hidden min-h-[580px] flex flex-col justify-between border border-[#E3E8F0]">
            {/* SVG Grid Dot Background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 text-outline-variant" height="100%" width="100%">
              <defs>
                <pattern height="20" id="dot-grid-pattern-replay" patternUnits="userSpaceOnUse" width="20">
                  <circle cx="2" cy="2" fill="currentColor" r="1.2"></circle>
                </pattern>
              </defs>
              <rect fill="url(#dot-grid-pattern-replay)" height="100%" width="100%"></rect>
            </svg>

            {/* DAG Control HUD */}
            <div className="relative z-10 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm font-label-sm border border-[#E2E8F0]">
                <span className="text-tertiary">EXECUTION GRAPH</span>
                <span className="text-outline-variant">·</span>
                <span className="text-primary font-mono font-medium">SAGA COMPENSATION RUNNER</span>
              </div>
              <div className="pointer-events-auto flex items-center gap-1 bg-surface-container-lowest/95 backdrop-blur p-1 rounded-lg shadow-sm text-on-surface-variant font-label-sm border border-[#E2E8F0]">
                <button className="p-1 hover:text-primary hover:bg-surface-container-low rounded" title="Zoom in">
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <button className="p-1 hover:text-primary hover:bg-surface-container-low rounded" title="Zoom out">
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <button className="p-1 hover:text-primary hover:bg-surface-container-low rounded" title="Fit to screen">
                  <span className="material-symbols-outlined text-[18px]">crop_free</span>
                </button>
                <div className="w-px h-3.5 bg-outline-variant mx-1"></div>
                <button className="px-1.5 py-0.5 hover:bg-surface-container-low rounded text-[11px] font-mono">100%</button>
                <button className="p-1 hover:text-primary hover:bg-surface-container-low rounded" title="Toggle Minimap">
                  <span className="material-symbols-outlined text-[18px]">map</span>
                </button>
              </div>
            </div>

            {/* DAG Interactive Node Canvas Visualizer */}
            <div className="relative z-10 py-6 overflow-x-auto select-none">
              <div className="min-w-[700px] flex flex-col space-y-10">
                {/* Level 1: Normal Forward Path (Seq 1 to 24) */}
                <div className="grid grid-cols-4 gap-4 relative">
                  {/* Connector line */}
                  <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-surface-container -translate-y-1/2 z-0"></div>

                  {/* Node 1: Validate Order */}
                  <div className="relative z-10 bg-surface-container-lowest rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-on-tertiary-fixed font-label-sm">
                      <span className="bg-[#DCFCE7] text-[#15803D] font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span> SUCCEEDED
                      </span>
                      <span className="text-tertiary font-mono">220ms</span>
                    </div>
                    <div className="font-headline-sm text-sm text-on-surface mt-2 font-medium">Validate Order</div>
                    <div className="font-label-sm text-tertiary text-[11px] mt-0.5">oms-validator-east</div>
                  </div>

                  {/* Node 2: Reserve Inventory */}
                  <div className="relative z-10 bg-surface-container-lowest rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-on-tertiary-fixed font-label-sm">
                      <span className="bg-[#DCFCE7] text-[#15803D] font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span> SUCCEEDED
                      </span>
                      <span className="text-tertiary font-mono">340ms</span>
                    </div>
                    <div className="font-headline-sm text-sm text-on-surface mt-2 font-medium">Reserve Inventory</div>
                    <div className="font-label-sm text-tertiary text-[11px] mt-0.5">sim-inventory-pool</div>
                  </div>

                  {/* Node 3: Create Billing Acct */}
                  <div className="relative z-10 bg-surface-container-lowest rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-on-tertiary-fixed font-label-sm">
                      <span className="bg-[#DCFCE7] text-[#15803D] font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span> SUCCEEDED
                      </span>
                      <span className="text-tertiary font-mono">420ms</span>
                    </div>
                    <div className="font-headline-sm text-sm text-on-surface mt-2 font-medium">Create Billing Acct</div>
                    <div className="font-label-sm text-tertiary text-[11px] mt-0.5">ocs-gateway-v2</div>
                  </div>

                  {/* Node 4: Provision Network */}
                  <div className="relative z-10 bg-surface-container-lowest rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-on-tertiary-fixed font-label-sm">
                      <span className="bg-[#DCFCE7] text-[#15803D] font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span> SUCCEEDED
                      </span>
                      <span className="text-tertiary font-mono">1.42s</span>
                    </div>
                    <div className="font-headline-sm text-sm text-on-surface mt-2 font-medium">Provision Network</div>
                    <div className="font-label-sm text-tertiary text-[11px] mt-0.5">hlr-hss-worker</div>
                  </div>
                </div>

                {/* Failure Junction Point */}
                <div className="flex items-center justify-center relative">
                  <div className="max-w-md w-full bg-[#FEF2F2] rounded-lg p-3.5 shadow-sm relative border border-[#FECACA]">
                    <div className="flex items-center justify-between font-label-sm">
                      <span className="bg-[#FEE2E2] text-[#B91C1C] font-mono px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span> FAILED (Seq 25)
                      </span>
                      <span className="font-mono text-[#991B1B]">HTTP 500 · Rating Timeout</span>
                    </div>
                    <div className="font-headline-sm text-sm text-on-surface font-semibold mt-2">Start Charging Session</div>
                    <div className="font-body-sm text-on-surface-variant text-xs mt-1">
                      ocs.rating.service unreachable after 3 backoff attempts
                    </div>
                  </div>
                  {/* SVG Curving Red Compensation Arrow Downwards */}
                  <svg className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-8 h-10 overflow-visible text-[#EF4444]" fill="none">
                    <path d="M 16 0 L 16 26" stroke="currentColor" strokeDasharray="4 3" strokeWidth="2"></path>
                    <polygon fill="currentColor" points="12,26 20,26 16,34"></polygon>
                  </svg>
                </div>

                {/* Level 2: Saga Compensation Row (Active Historical Replay State) */}
                <div className="bg-surface-container-low/60 p-4 rounded-xl space-y-3 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between font-label-sm">
                    <span className="text-[#B91C1C] font-semibold tracking-wide flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">undo</span>
                      SAGA COMPENSATION CASCADE (ROLLBACK SEQUENCE)
                    </span>
                    <span className="text-tertiary font-mono">Replay Head Active: Seq {currentSeq}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {/* Compensation Node 1: Deprovision Network (ACTIVE PLAYHEAD AT SEQ 27) */}
                    <div className="bg-surface-container-lowest rounded-lg p-3 shadow-md bg-gradient-to-b from-primary-fixed/20 to-transparent relative border-2 border-primary">
                      <div className="absolute -top-2.5 right-2 bg-primary text-on-primary font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                        REPLAY HEAD
                      </div>
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="bg-secondary/10 text-secondary font-mono px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <span className="animate-spin material-symbols-outlined text-[11px]">sync</span> EXECUTING
                        </span>
                        <span className="font-mono text-secondary text-[11px]">820ms in-flight</span>
                      </div>
                      <div className="font-headline-sm text-sm text-on-surface font-semibold mt-2">Deprovision Network</div>
                      <div className="font-label-sm text-on-surface-variant text-[11px] mt-0.5 truncate">
                        hlr-worker-east · Seq 27
                      </div>
                    </div>

                    {/* Compensation Node 2: Release Inventory (QUEUED) */}
                    <div className="bg-surface-container-lowest/80 rounded-lg p-3 shadow-xs opacity-75 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="bg-surface-container text-tertiary font-mono px-1.5 py-0.5 rounded text-[10px]">
                          PENDING SAGA
                        </span>
                        <span className="font-mono text-tertiary text-[11px]">est. 180ms</span>
                      </div>
                      <div className="font-headline-sm text-sm text-on-surface font-medium mt-2">Release Inventory</div>
                      <div className="font-label-sm text-tertiary text-[11px] mt-0.5">sim-pool-compensator</div>
                    </div>

                    {/* Compensation Node 3: Void Billing Account (QUEUED) */}
                    <div className="bg-surface-container-lowest/80 rounded-lg p-3 shadow-xs opacity-75 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="bg-surface-container text-tertiary font-mono px-1.5 py-0.5 rounded text-[10px]">
                          PENDING SAGA
                        </span>
                        <span className="font-mono text-tertiary text-[11px]">est. 210ms</span>
                      </div>
                      <div className="font-headline-sm text-sm text-on-surface font-medium mt-2">Void Billing Account</div>
                      <div className="font-label-sm text-tertiary text-[11px] mt-0.5">ocs-billing-rollback</div>
                    </div>

                    {/* Compensation Node 4: Notify Customer (SKIPPED) */}
                    <div className="bg-surface-container-lowest/50 rounded-lg p-3 shadow-xs opacity-50 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="bg-surface-container text-tertiary font-mono px-1.5 py-0.5 rounded text-[10px]">
                          SKIPPED
                        </span>
                        <span className="font-mono text-tertiary text-[11px]">Policy bypass</span>
                      </div>
                      <div className="font-headline-sm text-sm text-on-surface font-medium mt-2">Notify Customer</div>
                      <div className="font-label-sm text-tertiary text-[11px] mt-0.5">notification-svc</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Footer Status Details */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 text-tertiary font-label-sm bg-surface-container-lowest border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-secondary"></span>
                <span>
                  Subsystem Worker Context: <strong className="text-on-surface font-mono">hlr-east-01-pod-7b</strong>
                </span>
              </div>
              <div className="font-mono">
                Transaction Boundary: <span className="text-on-surface font-semibold">ACID-SAGA-ISOLATION-LEVEL-3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Inspector (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-4 border border-[#E3E8F0]">
            {/* Inspector Tab Headers */}
            <div className="flex items-center justify-between pb-3 bg-surface-container-low/50 p-1 rounded-lg">
              <button
                onClick={() => setActiveRightTab("timeline")}
                className={`flex-1 py-1.5 px-3 rounded-md font-body-sm font-semibold text-center transition-colors cursor-pointer ${
                  activeInspectorTab === "timeline"
                    ? "text-primary bg-surface-container-lowest shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Timeline (Seq 27/42)
              </button>
              <button
                onClick={() => setActiveRightTab("task")}
                className={`flex-1 py-1.5 px-3 rounded-md font-body-sm font-medium text-center transition-colors cursor-pointer ${
                  activeInspectorTab === "task"
                    ? "text-primary bg-surface-container-lowest shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Task Detail
              </button>
              <button
                onClick={() => setActiveRightTab("variables")}
                className={`flex-1 py-1.5 px-3 rounded-md font-body-sm font-medium text-center transition-colors cursor-pointer ${
                  activeInspectorTab === "variables"
                    ? "text-primary bg-surface-container-lowest shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Variables
              </button>
            </div>

            {/* Historical Stream Content */}
            {activeInspectorTab === "timeline" && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-tertiary uppercase tracking-wider font-label-sm">
                  Temporal Event Stream
                </div>
                <div className="space-y-2 relative pl-4">
                  {/* Timeline vertical connector */}
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-surface-container"></div>

                  {/* Event 25: Failure */}
                  <div className="relative pl-3">
                    <span className="absolute -left-3.5 top-1.5 h-2 w-2 rounded-full bg-[#EF4444]"></span>
                    <div className="bg-surface-container-low/70 rounded-md p-2.5 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="font-mono text-[#B91C1C] font-semibold">Seq 25 · 14:22:06.912</span>
                        <span className="text-[#DC2626] font-mono text-[10px]">FAILED</span>
                      </div>
                      <div className="font-body-sm font-medium text-on-surface text-xs mt-1">StartCharging.Attempt3</div>
                      <div className="font-label-sm text-[11px] text-tertiary font-mono">
                        Response: 500 Internal OCS Timeout
                      </div>
                    </div>
                  </div>

                  {/* Event 26: Compensation Trigger */}
                  <div className="relative pl-3">
                    <span className="absolute -left-3.5 top-1.5 h-2 w-2 rounded-full bg-[#F59E0B]"></span>
                    <div className="bg-surface-container-low/70 rounded-md p-2.5 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="font-mono text-[#92400E] font-semibold">Seq 26 · 14:22:07.100</span>
                        <span className="text-[#D97706] font-mono text-[10px]">TRIGGERED</span>
                      </div>
                      <div className="font-body-sm font-medium text-on-surface text-xs mt-1">TriggerSagaCompensation</div>
                      <div className="font-label-sm text-[11px] text-tertiary font-mono">Cascade reverse order [4, 3, 2, 1]</div>
                    </div>
                  </div>

                  {/* Event 27: Current Replay Head PINNED */}
                  <div className="relative pl-3">
                    <span className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary-fixed"></span>
                    <div className="bg-[#EEF2FF] rounded-md p-3 shadow-xs border border-[#C7D2FE]">
                      <div className="flex items-center justify-between font-label-sm">
                        <span className="font-mono text-primary font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">push_pin</span>
                          Seq 27 · 14:22:07.820
                        </span>
                        <span className="bg-primary text-on-primary font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold">
                          HEAD
                        </span>
                      </div>
                      <div className="font-body-sm font-semibold text-primary text-xs mt-1.5">DeprovisionNetwork.Execute</div>
                      <div className="font-label-sm text-[11px] text-tertiary font-mono mt-0.5">
                        Worker: hlr-east-01-pod-7b (in-flight)
                      </div>
                    </div>
                  </div>

                  {/* Future Muted Replay Events (Seq 28-42) */}
                  <div className="relative pl-3 opacity-45">
                    <span className="absolute -left-3.5 top-1.5 h-2 w-2 rounded-full bg-outline-variant"></span>
                    <div className="bg-surface-container-low/40 rounded-md p-2.5 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between font-label-sm text-tertiary">
                        <span className="font-mono">Seq 28–42 · Historical Future</span>
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                      </div>
                      <div className="font-body-sm text-on-surface-variant text-xs mt-1 italic">
                        ReleaseInventory, VoidBillingAccount, SagaCompleted…
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Task Detail Tab */}
            {activeInspectorTab === "task" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between font-label-sm text-xs font-semibold text-tertiary uppercase tracking-wider">
                  <span>Inspector: Active Task</span>
                  <span className="font-mono text-secondary">hlr-worker-east</span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-on-surface-variant">
                    <span className="text-tertiary">Action ID:</span>
                    <span className="text-on-surface font-semibold">TEARDOWN_SLICE</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span className="text-tertiary">Slice Latency:</span>
                    <span className="text-on-surface font-semibold">~820ms in-flight</span>
                  </div>
                  <div className="pt-1.5">
                    <div className="text-tertiary mb-1">Payload Snapshot (Seq 27):</div>
                    <pre className="bg-surface-container-lowest p-2 rounded text-[11px] text-on-surface overflow-x-auto leading-relaxed border border-[#E2E8F0]">{JSON.stringify(
                      {
                        imsi: "310410•••••••••",
                        action: "TEARDOWN_SLICE",
                        profile_id: "MSISDN-4821",
                        rollback_nonce: "991024-aa7b-c1",
                      },
                      null,
                      2
                    )}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Variables Tab */}
            {activeInspectorTab === "variables" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between font-label-sm text-xs font-semibold text-tertiary uppercase tracking-wider">
                  <span>Workflow State Variables</span>
                  <span className="font-mono text-primary font-bold">Seq 27 Scope</span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg space-y-2 text-xs font-mono">
                  <pre className="bg-surface-container-lowest p-2 rounded text-[11px] text-on-surface overflow-x-auto leading-relaxed border border-[#E2E8F0]">{JSON.stringify(
                    {
                      order_status: "COMPENSATING",
                      error_code: "OCS_TIMEOUT_500",
                      retry_count: 3,
                      rollback_steps_remaining: 3,
                      allocated_sim_iccid: "890141032111409",
                      hlr_slice_status: "TEARDOWN_TRIGGERED",
                      tombstone_hash: "0x7c9be309f44ea1d9",
                    },
                    null,
                    2
                  )}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Large Playback Scrubber Deck (Full Width Card) */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-4 border border-[#E3E8F0]">
        {/* Playback Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Media Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSeq((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors cursor-pointer"
              title="Step Back to Seq 26"
            >
              <span className="material-symbols-outlined text-[18px]">skip_previous</span>
            </button>
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="w-9 h-9 rounded bg-primary hover:bg-on-primary-fixed-variant text-on-primary flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="Play Replay Simulation"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              onClick={() => setCurrentSeq((prev) => Math.min(42, prev + 1))}
              className="w-8 h-8 rounded bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors cursor-pointer"
              title="Step Forward to Seq 28"
            >
              <span className="material-symbols-outlined text-[18px]">skip_next</span>
            </button>
            <div className="w-px h-5 bg-outline-variant mx-1"></div>

            {/* Jump to Failure Button */}
            <button
              onClick={() => setCurrentSeq(25)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] rounded-md font-label-sm font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">report_problem</span>
              <span>Jump to Failure (Seq 25)</span>
            </button>

            {/* Return to Live Fast Button */}
            <button
              onClick={() => setCurrentSeq(42)}
              className="inline-flex items-center gap-1 h-8 px-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-md font-label-sm font-medium transition-colors cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-[#16A34A]"></span>
              <span>Live Tail (Seq 42)</span>
            </button>
          </div>

          {/* Playback Speed Segments */}
          <div className="flex items-center gap-3">
            <span className="font-label-sm text-tertiary">SPEED</span>
            <div className="inline-flex bg-surface-container-low p-0.5 rounded-lg font-label-sm border border-[#E2E8F0]">
              {(["0.5×", "1.0×", "2.0×", "4.0×"] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? "font-semibold text-primary bg-surface-container-lowest shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {/* Timestamp Position Display */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="font-headline-sm text-sm font-bold text-on-surface font-mono">
                Seq {currentSeq} / 42
              </div>
              <div className="font-label-sm text-tertiary font-mono">T+3.820s · 14:22:07.820 UTC</div>
            </div>
            <div className="h-7 w-px bg-outline-variant"></div>
            <div className="text-left font-body-sm hidden lg:block">
              <div className="text-primary font-semibold text-xs truncate max-w-[240px]">Deprovision Network</div>
              <div className="text-tertiary text-[11px] font-mono truncate max-w-[240px]">
                saga.compensating · hlr-worker-east
              </div>
            </div>
          </div>
        </div>

        {/* Scrubber Interactive Track */}
        <div className="space-y-2 py-2">
          {/* High Precision Tick Bar */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const seq = Math.max(1, Math.min(42, Math.round(pct * 42)));
              setCurrentSeq(seq);
            }}
            className="relative h-7 bg-surface-container-low rounded-lg p-1 flex items-center select-none cursor-pointer border border-[#E2E8F0]"
          >
            {/* Colored Event Ranges */}
            <div className="absolute inset-y-1.5 left-1 w-[55%] bg-[#DCFCE7]/70 rounded-l" title="Forward Execution (Seq 1-24)"></div>
            <div className="absolute inset-y-1.5 left-[55%] w-[4%] bg-[#FEE2E2]" title="OCS Failure (Seq 25)"></div>
            <div className="absolute inset-y-1.5 left-[59%] w-[32%] bg-[#EEF2FF]" title="Saga Compensation (Seq 26-38)"></div>
            <div className="absolute inset-y-1.5 left-[91%] right-1 bg-surface-container/80 rounded-r" title="Audit & Complete (Seq 39-42)"></div>

            {/* Tick marks (SVG) */}
            <div className="absolute inset-x-2 inset-y-0 flex items-center justify-between pointer-events-none opacity-40">
              <span className="w-0.5 h-3 bg-[#15803D]"></span>
              <span className="w-0.5 h-2 bg-[#15803D]"></span>
              <span className="w-0.5 h-3 bg-[#15803D]"></span>
              <span className="w-0.5 h-2 bg-[#15803D]"></span>
              <span className="w-0.5 h-3 bg-[#15803D]"></span>
              <span className="w-0.5 h-2 bg-[#15803D]"></span>
              <span className="w-0.5 h-3 bg-[#15803D]"></span>
              <span className="w-0.5 h-2 bg-[#15803D]"></span>
              <span className="w-0.5 h-3 bg-[#15803D]"></span>
              <span className="w-0.5 h-2 bg-[#15803D]"></span>
              <span className="w-0.5 h-4 bg-[#B91C1C]"></span>
              <span className="w-0.5 h-2 bg-primary"></span>
              <span className="w-0.5 h-3 bg-primary"></span>
              <span className="w-0.5 h-2 bg-primary"></span>
              <span className="w-0.5 h-3 bg-primary"></span>
              <span className="w-0.5 h-2 bg-tertiary"></span>
              <span className="w-0.5 h-3 bg-tertiary"></span>
            </div>

            {/* Playhead at currentSeq */}
            <div
              style={{ left: `${(currentSeq / 42) * 100}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
            >
              <div className="w-5 h-8 bg-primary rounded shadow-md flex items-center justify-center text-on-primary cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-[14px]">drag_handle</span>
              </div>
              {/* Tooltip Callout */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-mono text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                Seq {currentSeq} · hlr-worker-east
              </div>
            </div>
          </div>

          {/* Duration Scale Markers */}
          <div className="flex items-center justify-between font-label-sm text-[11px] text-tertiary font-mono pt-0.5">
            <span>0.00s (Validate)</span>
            <span>1.20s (Parallel Fork)</span>
            <span>2.98s (Verify Service)</span>
            <span className="text-[#B91C1C] font-semibold">3.62s (OCS Fail)</span>
            <span className="text-primary font-bold">3.82s [HEAD]</span>
            <span>4.82s (Compensated)</span>
          </div>
        </div>

        {/* Scrubber Footer Sync Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-tertiary font-label-sm">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#16A34A]">sync_saved_locally</span>
            <span>
              Replay buffer synchronized from Temporal event history log (42 events). Memory snapshot:{" "}
              <strong className="text-on-surface">100% deterministic</strong>.
            </span>
          </div>
          <div className="font-mono text-[11px]">
            Engine: Temporal Replayer v1.24 · Local Time: 14:22:07 UTC
          </div>
        </div>
      </section>
    </div>
  );
}
