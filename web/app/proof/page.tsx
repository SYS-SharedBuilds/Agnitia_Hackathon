"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Scenario {
  id: string;
  num: string;
  title: string;
  desc: string;
  expect: string;
  subsystems: string[];
  lastRun: string;
  duration: string;
  status: "PASS" | "RUNNING" | "QUEUED";
  isLive?: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    num: "S1",
    title: "S1 Happy Path",
    desc: "Nominal fiber broadband activation with all upstream subsystems responding within SLO.",
    expect: "Expect: 200 OK · ACTIVE in <3.5s",
    subsystems: ["OMS", "SIM", "HLR", "OCS"],
    lastRun: "4m ago",
    duration: "2.14s",
    status: "PASS",
  },
  {
    id: "s2",
    num: "S2",
    title: "S2 Transient Retries",
    desc: "HLR gateway returns 503 twice; saga retries with exponential jitter and succeeds.",
    expect: "Expect: 2 Retries · Eventual ACTIVE",
    subsystems: ["HLR/HSS"],
    lastRun: "3m ago",
    duration: "4.81s",
    status: "PASS",
  },
  {
    id: "s3",
    num: "S3",
    title: "S3 Business Rejection",
    desc: "Customer address fails terminal port availability; early pre-saga rejection without side-effects.",
    expect: "Expect: 422 RFC-7807 · 0 Sagas Initiated",
    subsystems: ["GIS", "OMS"],
    lastRun: "3m ago",
    duration: "180ms",
    status: "PASS",
  },
  {
    id: "s4",
    num: "S4",
    title: "S4 Provisioning Failure",
    desc: "SIM reservation succeeds, HLR provisioning crashes; SIM reservation is cleanly undone.",
    expect: "Expect: Clean Saga Rollback · 0 Leaks",
    subsystems: ["SIM", "HLR"],
    lastRun: "2m ago",
    duration: "1.92s",
    status: "PASS",
  },
  {
    id: "s5",
    num: "S5",
    title: "S5 Post-Verification Failure",
    desc: "Network live but OCS rating rejects rate-plan; automated reverse saga teardown executed.",
    expect: "Expect: Full Teardown · Tombstone Emitted",
    subsystems: ["OCS", "HLR"],
    lastRun: "1m ago",
    duration: "3.40s",
    status: "PASS",
  },
  {
    id: "s6",
    num: "S6",
    title: "S6 Compensation Failure",
    desc: "Downstream HLR deprovision times out during rollback; triggers Fallout Queue circuit-breaker.",
    expect: "Expect: Halts at NEEDS_ATTENTION",
    subsystems: ["Fallout", "NOC", "HLR"],
    lastRun: "Running now",
    duration: "4.82s",
    status: "RUNNING",
    isLive: true,
  },
  {
    id: "s7",
    num: "S7",
    title: "S7 Worker Crash Recovery",
    desc: "Temporal activity worker SIGKILL during HSS slice lock; heartbeat lease times out and resumes.",
    expect: "Expect: Zero Duplicate Provisioning",
    subsystems: ["Temporal", "Worker"],
    lastRun: "5m ago",
    duration: "6.12s",
    status: "PASS",
  },
  {
    id: "s8",
    num: "S8",
    title: "S8 Idempotent Submission",
    desc: "Duplicate client order reference submitted simultaneously with 100ms jitter.",
    expect: "Expect: Exact Same Order ID (202 Dedup)",
    subsystems: ["OMS", "Redis"],
    lastRun: "5m ago",
    duration: "320ms",
    status: "PASS",
  },
  {
    id: "s9",
    num: "S9",
    title: "S9 Operator Cancellation",
    desc: "Manual cancel event injected midway through provisioning wave; immediate saga halt.",
    expect: "Expect: CANCELLED · Clean Teardown",
    subsystems: ["Operator", "NOC"],
    lastRun: "6m ago",
    duration: "1.85s",
    status: "PASS",
  },
  {
    id: "s10",
    num: "S10",
    title: "S10 Chaos Load",
    desc: "50 concurrent activations under 20% random latency injection across all 5 telecom providers.",
    expect: "Expect: 100% Terminal Consistency",
    subsystems: ["Chaos", "Bulkhead"],
    lastRun: "8m ago",
    duration: "8.40s",
    status: "PASS",
  },
  {
    id: "s11",
    num: "S11",
    title: "S11 Late-Arrival Race",
    desc: "Asynchronous notification ACK arrives after saga completed; tombstone prevents zombie state.",
    expect: "Expect: Tombstone Drops Late Event",
    subsystems: ["Kafka", "SMS-C"],
    lastRun: "10m ago",
    duration: "890ms",
    status: "PASS",
  },
  {
    id: "s12",
    num: "S12",
    title: "S12 A/B Proof",
    desc: "Parallel shadow run comparing legacy synchronous orchestrator vs Temporal saga engine.",
    expect: "Expect: 0 Inconsistent States vs Legacy 3",
    subsystems: ["A/B", "Ledger"],
    lastRun: "12m ago",
    duration: "11.2s",
    status: "PASS",
  },
];

interface ProofRow {
  scenarioNum: string;
  scenarioName: string;
  orderRef: string;
  fault: string;
  invariant: string;
  hash: string;
  duration: string;
  status: "RUNNING" | "VERIFIED PASS";
  isLive?: boolean;
}

const PROOF_ROWS: ProofRow[] = [
  {
    scenarioNum: "S6",
    scenarioName: "Compensation Failure",
    orderRef: "ORD-20260712-004217",
    fault: "HLR deprovision timeout (HTTP 504)",
    invariant: "Circuit-breaker halted; fallout queue bound",
    hash: "0x pending_commit…",
    duration: "4.82s",
    status: "RUNNING",
    isLive: true,
  },
  {
    scenarioNum: "S5",
    scenarioName: "Post-Verification Failure",
    orderRef: "ORD-20260712-004216",
    fault: "OCS rateplan mismatch (409)",
    invariant: "Saga reversed atomically; tombstone recorded",
    hash: "0x8fe2…a781",
    duration: "3.40s",
    status: "VERIFIED PASS",
  },
  {
    scenarioNum: "S4",
    scenarioName: "Provisioning Failure",
    orderRef: "ORD-20260712-004215",
    fault: "HLR provision SIGSEGV exception",
    invariant: "SIM reservation released; zero resource leak",
    hash: "0x3a4b…114d",
    duration: "1.92s",
    status: "VERIFIED PASS",
  },
  {
    scenarioNum: "S3",
    scenarioName: "Business Rejection",
    orderRef: "ORD-20260712-004214",
    fault: "ODF port exhaustion (GIS reject)",
    invariant: "Order declined at gateway; 0 saga traces initiated",
    hash: "0x992c…9912",
    duration: "180ms",
    status: "VERIFIED PASS",
  },
  {
    scenarioNum: "S2",
    scenarioName: "Transient Retries",
    orderRef: "ORD-20260712-004213",
    fault: "HLR Service Unavailable 503 (x2)",
    invariant: "Idempotency preserved; exactly-once provisioning",
    hash: "0x1174…8990",
    duration: "4.81s",
    status: "VERIFIED PASS",
  },
  {
    scenarioNum: "S1",
    scenarioName: "Happy Path Baseline",
    orderRef: "ORD-20260712-004212",
    fault: "None (Nominal run)",
    invariant: "State transitions conform strictly to ISO-20022",
    hash: "0x44ae…df77",
    duration: "2.14s",
    status: "VERIFIED PASS",
  },
];

export default function ScenariosProofPage() {
  const [activeTab, setActiveTab] = useState<"scenarios" | "load" | "ab" | "certs">("scenarios");
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleRunAll = () => {
    setIsRunningAll(true);
    setTimeout(() => {
      setIsRunningAll(false);
      alert("All 12 deterministic scenarios executed! Proof ledger updated (142/142 verified).");
    }, 2400);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Header & Primary Command Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
              Scenarios &amp; Proof
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold bg-surface-container-high text-primary border border-outline-variant/60">
              Determinism Test Harness
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant border border-outline-variant/40">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-container"></span>
              <span>Cluster Ready · Temporal v1.18.4</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Simulate distributed saga failure modes, verify cryptographic invariants, and prove zero-inconsistent state across all telecom microservices.
          </p>
        </div>

        {/* Global Actions & Telemetry */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] px-3 py-1.5 rounded-full font-label-sm text-label-sm font-mono shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#059669]">verified</span>
            <span className="font-semibold">Proof Ledger: 142/142 verified</span>
          </div>
          <button
            onClick={() => alert("Harness reset. Data stores cleared to snapshot.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium border border-outline-variant hover:bg-surface-container-low transition-colors shadow-xs active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">refresh</span>
            <span>Reset Harness</span>
          </button>
          <button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="relative group overflow-hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-body-md text-body-md font-medium shadow-sm hover:bg-primary transition-all active:scale-[0.98]"
          >
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out"></span>
            <span className={`material-symbols-outlined text-[18px] ${isRunningAll ? "animate-spin" : ""}`}>
              {isRunningAll ? "refresh" : "play_arrow"}
            </span>
            <span>{isRunningAll ? "Running Suite…" : "Run All (make demo)"}</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/30">
        <div className="inline-flex p-1 bg-surface-container-high/60 rounded-xl border border-outline-variant/40 overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveTab("scenarios")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-body-md text-body-md transition-colors ${
              activeTab === "scenarios"
                ? "font-semibold bg-surface-container-lowest text-primary shadow-xs"
                : "font-medium text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>Scenarios</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono">
              12
            </span>
          </button>
          <button
            onClick={() => setActiveTab("load")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-body-md text-body-md transition-colors ${
              activeTab === "load"
                ? "font-semibold bg-surface-container-lowest text-primary shadow-xs"
                : "font-medium text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>Load Generator</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-mono">
              100 TPS ready
            </span>
          </button>
          <button
            onClick={() => setActiveTab("ab")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-body-md text-body-md transition-colors ${
              activeTab === "ab"
                ? "font-semibold bg-surface-container-lowest text-primary shadow-xs"
                : "font-medium text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>A/B Proof</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-mono">
              v2.3 vs v2.4
            </span>
          </button>
          <button
            onClick={() => setActiveTab("certs")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-body-md text-body-md transition-colors ${
              activeTab === "certs"
                ? "font-semibold bg-surface-container-lowest text-primary shadow-xs"
                : "font-medium text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>Certificates</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-mono">
              Cryptographic Merkle Logs
            </span>
          </button>
        </div>

        {/* Secondary Meta Stat */}
        <div className="hidden lg:flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-on-surface font-semibold">12</span> Total Suites
          </div>
          <span className="text-outline-variant">·</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#0A1B2E]"></span>
            <span className="font-mono text-on-surface font-semibold">11</span> Clean
          </div>
          <span className="text-outline-variant">·</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary-container animate-pulse"></span>
            <span className="font-mono text-primary font-semibold">1</span> In-Flight
          </div>
        </div>
      </div>

      {/* Active Execution Status Banner */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs overflow-hidden">
        <div className="p-3.5 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 truncate font-body-md text-body-md">
              <span className="font-semibold text-on-surface">Demo Suite in Progress</span>
              <span className="hidden sm:inline text-outline-variant">·</span>
              <span className="text-on-surface-variant">7/12 completed</span>
              <span className="hidden sm:inline text-outline-variant">·</span>
              <span className="text-primary font-medium truncate">
                1 active running (S6 Compensation Failure →{" "}
                <code className="font-label-sm text-label-sm font-semibold bg-surface-container px-1 py-0.5 rounded text-on-surface font-mono">
                  ORD-20260712-004217
                </code>
                )
              </span>
              <span className="hidden sm:inline text-outline-variant">·</span>
              <span className="text-[#059669] font-medium shrink-0">0 consistency leaks</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-label-sm text-label-sm font-mono text-on-surface-variant">
            <span>ETA ~6.8s</span>
            <button
              onClick={() => alert("Simulation paused.")}
              className="px-2 py-1 rounded hover:bg-surface-container text-on-surface transition-colors font-sans font-medium text-body-sm"
            >
              Pause
            </button>
          </div>
        </div>
        {/* Indeterminate / active progress line */}
        <div className="h-1.5 w-full bg-surface-container-high overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary-container w-2/3 rounded-r-full transition-all duration-500 ease-out"></div>
        </div>
      </div>

      {/* 12 Scenarios Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
            Deterministic Test Matrix
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Sort: Pipeline Order</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {SCENARIOS.map((sc) => {
            if (sc.isLive) {
              return (
                <div
                  key={sc.id}
                  className="relative bg-surface-container-lowest border-2 border-primary rounded-xl p-4 flex flex-col justify-between shadow-md ring-4 ring-primary/10"
                >
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-mono tracking-wide uppercase">
                    Live Target
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        {sc.num}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-mono bg-primary/10 text-primary border border-primary/20 animate-pulse">
                        <span className="material-symbols-outlined text-[13px] animate-spin">refresh</span>
                        <span className="font-semibold">RUNNING · {sc.duration}</span>
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{sc.title}</h3>
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{sc.desc}</p>
                    {/* Special Active Callout */}
                    <div className="mt-3 p-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/40">
                      <div className="flex items-center gap-1.5 font-label-sm text-label-sm font-medium text-error">
                        <span className="material-symbols-outlined text-[15px]">report</span>
                        <span>Needs Attention Escalation</span>
                      </div>
                      <p className="mt-1 font-body-sm text-body-sm text-on-surface leading-tight">
                        Order{" "}
                        <code className="font-label-sm text-label-sm font-mono font-semibold text-primary">
                          ORD-20260712-004217
                        </code>{" "}
                        halted at Seq 27. Compensating step 5/5 retries.
                      </p>
                    </div>
                    <div className="mt-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {sc.expect}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sc.subsystems.map((sub) => (
                        <span
                          key={sub}
                          className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm ${
                            sub === "Fallout"
                              ? "bg-primary/10 text-primary font-medium"
                              : "bg-surface-container-high/60 text-on-surface-variant"
                          }`}
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm font-mono text-primary font-medium">
                      Step: Rollback_HLR_Sub
                    </span>
                    <Link
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md font-body-sm text-body-sm font-medium bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors shadow-xs"
                      href="/orders/ORD-20260712-004217"
                    >
                      <span>View Live Order</span>
                      <span className="material-symbols-outlined text-[14px]">north_east</span>
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sc.id}
                className="group bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 flex flex-col justify-between hover:border-outline-variant hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-sm text-label-sm font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold border border-outline-variant/40">
                      {sc.num}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-mono bg-white text-[#0A1B2E] border border-[#CBD5E1] shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                      <span>PASS · {sc.duration}</span>
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                    {sc.title}
                  </h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{sc.desc}</p>
                  <div className="mt-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-mono">
                      {sc.expect}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sc.subsystems.map((sub) => (
                      <span
                        key={sub}
                        className="px-1.5 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high/60 text-on-surface-variant"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Last run: {sc.lastRun}</span>
                  <button
                    onClick={() => alert(`Triggering run for ${sc.num}: ${sc.title}...`)}
                    className="px-3 py-1 rounded-md font-body-sm text-body-sm font-medium bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/50 transition-colors"
                  >
                    Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Verification Proof Ledger & Audit Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xs overflow-hidden">
        {/* Table Card Header */}
        <div className="p-5 border-b border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">policy</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Verification Proof Ledger &amp; Test Execution History
              </h2>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              Cryptographic hash verification confirming zero orphaned state records across test runs.
            </p>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
                filter_list
              </span>
              <select className="h-9 pl-8 pr-7 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary">
                <option>All Subsystems</option>
                <option>HLR / HSS</option>
                <option>OMS Gateway</option>
                <option>OCS Rating</option>
                <option>SIM Provisioner</option>
              </select>
            </div>
            <div className="relative">
              <select className="h-9 px-3 pr-7 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary">
                <option>Status: All (12)</option>
                <option>Passed Only (11)</option>
                <option>In Progress (1)</option>
              </select>
            </div>
            <button
              onClick={() => alert("Exporting Cryptographic Proof Bundle (.pem / .json)...")}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm font-medium border border-outline-variant/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export Bundle (.json / .pem)</span>
            </button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 font-headline-sm text-label-sm uppercase tracking-wider text-on-surface-variant select-none">
                <th className="py-3 px-4 font-semibold">Scenario</th>
                <th className="py-3 px-4 font-semibold">Order Reference</th>
                <th className="py-3 px-4 font-semibold">Fault Injected</th>
                <th className="py-3 px-4 font-semibold">Invariant Verified</th>
                <th className="py-3 px-4 font-semibold">Merkle Proof Hash</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-md text-body-md text-on-surface">
              {PROOF_ROWS.map((row) => {
                if (row.isLive) {
                  return (
                    <tr key={row.scenarioNum} className="bg-primary/5 hover:bg-primary/10 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                            {row.scenarioNum}
                          </span>
                          <span className="font-semibold text-on-surface">{row.scenarioName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Link
                          className="font-label-sm text-label-sm font-mono font-medium text-primary hover:underline flex items-center gap-1"
                          href={`/orders/${row.orderRef}`}
                        >
                          <span>{row.orderRef}</span>
                          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-body-sm text-body-sm">{row.fault}</td>
                      <td className="py-3 px-4 text-on-surface font-body-sm text-body-sm">
                        <div className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[15px] text-secondary-container animate-spin">
                            autorenew
                          </span>
                          <span>{row.invariant}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-label-sm text-label-sm font-mono text-outline italic">
                          {row.hash}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-label-sm text-label-sm font-mono text-primary font-semibold">
                        {row.duration}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-mono bg-primary/15 text-primary font-semibold animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          <span>RUNNING</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Link
                          className="font-label-sm text-label-sm font-medium text-primary hover:text-on-primary-fixed-variant transition-colors"
                          href={`/orders/${row.orderRef}`}
                        >
                          Inspect Trace ↗
                        </Link>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.scenarioNum} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-mono px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                          {row.scenarioNum}
                        </span>
                        <span className="font-medium text-on-surface">{row.scenarioName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link
                        className="font-label-sm text-label-sm font-mono text-on-surface-variant hover:text-primary"
                        href={`/orders/${row.orderRef}`}
                      >
                        {row.orderRef}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-body-sm text-body-sm">{row.fault}</td>
                    <td className="py-3 px-4 text-on-surface font-body-sm text-body-sm">{row.invariant}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div
                        className="flex items-center gap-1.5 group cursor-pointer"
                        onClick={() => copyHash(row.hash)}
                        title="Click to copy hash"
                      >
                        <code className="font-label-sm text-label-sm font-mono text-on-surface-variant group-hover:text-primary">
                          {row.hash}
                        </code>
                        <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedHash === row.hash ? "check" : "content_copy"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-label-sm text-label-sm font-mono text-on-surface-variant">
                      {row.duration}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-mono bg-white text-[#0A1B2E] border border-[#CBD5E1] shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                        <span>VERIFIED PASS</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <Link
                        className="font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                        href={`/orders/${row.orderRef}`}
                      >
                        Inspect Trace ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-3.5 px-4 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex items-center gap-2">
            <span>Showing 6 of 12 records in active session ledger</span>
            <span className="text-outline-variant">·</span>
            <span className="font-mono text-label-sm text-label-sm">Merkle Root: 0x9e1200…fec4</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded bg-surface-container text-outline hover:text-on-surface text-label-sm font-mono cursor-not-allowed">
              Previous
            </button>
            <button className="px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/60 text-on-surface hover:bg-surface-container text-label-sm font-mono">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
