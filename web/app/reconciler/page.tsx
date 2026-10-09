"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DriftRecord {
  id: string;
  resourceId: string;
  subsystem: string;
  port: string;
  expectedState: string;
  actualState: string;
  driftType: "Orphan" | "Mismatch" | "Missing";
  linkedOrder: string;
  remediationAction: string;
  remediationStatus: "success" | "warning";
  timestamp: string;
  diffDetails: {
    msisdn?: string;
    imsi?: string;
    subsystemNode?: string;
    hypothesis: string;
    actualLines: string[];
    expectedLines: string[];
    traces: Array<{ time: string; text: string; status: "normal" | "error" | "info" | "success" }>;
  };
}

const DRIFT_RECORDS: DriftRecord[] = [
  {
    id: "drift-1",
    resourceId: "hlr-profile-500mbps-9182",
    subsystem: "HLR/HSS Gateway",
    port: ":8443",
    expectedState: "TERMINATED / DEPROVISIONED",
    actualState: "ACTIVE (Leaked HLR slice)",
    driftType: "Orphan",
    linkedOrder: "ORD-20260712-004217",
    remediationAction: "Inverse Saga #419",
    remediationStatus: "success",
    timestamp: "14:28:43 UTC",
    diffDetails: {
      subsystemNode: "us-east-hlr-node-04b",
      msisdn: "+14155552671",
      imsi: "310410091824701",
      hypothesis: "HLR deprovision gRPC call timed out at stage 4 of saga compensation",
      actualLines: [
        'status: "PROVISIONED_ACTIVE"',
        'slice_qos: "5QI-9_500M"',
        "locked: false",
        'active_tunnels: [ "tun_hlr_880", "tun_hlr_881" ]',
      ],
      expectedLines: [
        'status: "DECOMMISSIONED_TOMBSTONE"',
        "slice_qos: null",
        "locked: true",
        "active_tunnels: []",
        'deprovision_tx_hash: "0x7c9be309f44ea1d9"',
      ],
      traces: [
        { time: "14:28:43.012", text: "Subsystem state polled via HLR Gateway gRPC", status: "normal" },
        { time: "14:28:43.418", text: "Drift identified: Subsystem ACTIVE, OMS intent TERMINATED", status: "error" },
        { time: "14:28:43.890", text: "Invoked Compensating Saga #419 with Safe Invariant Guard", status: "info" },
        { time: "14:28:44.215", text: "HLR profile deprovision confirmed: ACK 200 OK", status: "success" },
      ],
    },
  },
  {
    id: "drift-2",
    resourceId: "sim-iccid-8901410321",
    subsystem: "SIM Inventory",
    port: ":9001",
    expectedState: "RESERVED (IMSI 310410091)",
    actualState: "UNALLOCATED (Missing lock)",
    driftType: "Mismatch",
    linkedOrder: "ORD-20260712-004212",
    remediationAction: "Saga Re-lock #420",
    remediationStatus: "success",
    timestamp: "14:28:39 UTC",
    diffDetails: {
      subsystemNode: "us-east-sim-db-01",
      msisdn: "+14155552199",
      imsi: "310410091",
      hypothesis: "Transient DB deadlock released optimistic lock during concurrent batch update",
      actualLines: [
        'lock_state: "UNLOCKED"',
        'allocated_to: null',
        'reservation_lease: 0',
      ],
      expectedLines: [
        'lock_state: "LOCKED_RESERVED"',
        'allocated_to: "ORD-20260712-004212"',
        'reservation_lease: 3600',
        'lease_signature: "0xa841b9c2"',
      ],
      traces: [
        { time: "14:28:39.102", text: "Polled SIM registry partition key 890141", status: "normal" },
        { time: "14:28:39.314", text: "Drift identified: Lock released prematurely", status: "error" },
        { time: "14:28:39.521", text: "Acquiring idempotent lock lease with 1hr TTL", status: "info" },
        { time: "14:28:39.802", text: "SIM lock restored and confirmed in SIM pool", status: "success" },
      ],
    },
  },
  {
    id: "drift-3",
    resourceId: "ocs-balance-acct-88201",
    subsystem: "OCS Billing",
    port: ":8082",
    expectedState: "PLAN: Fiber_500 (ACTIVE)",
    actualState: "SUSPENDED (Billing mismatch)",
    driftType: "Mismatch",
    linkedOrder: "ORD-20260712-003980",
    remediationAction: "Fallout #FL-1092",
    remediationStatus: "warning",
    timestamp: "14:28:31 UTC",
    diffDetails: {
      subsystemNode: "us-east-ocs-cluster-02",
      msisdn: "+14155558820",
      hypothesis: "Credit check hold conflict triggered circuit breaker, preventing auto-resume",
      actualLines: [
        'tariff_status: "SUSPENDED"',
        'quota_balance_mb: 0',
        'lock_cause: "CREDIT_COLLISION_409"',
      ],
      expectedLines: [
        'tariff_status: "ACTIVE"',
        'quota_balance_mb: 512000',
        'plan_code: "FIBER_500_UNLIMITED"',
      ],
      traces: [
        { time: "14:28:31.004", text: "Polled OCS Diameter credit control interface", status: "normal" },
        { time: "14:28:31.250", text: "State divergence: Expected ACTIVE, found SUSPENDED", status: "error" },
        { time: "14:28:31.600", text: "Safety invariant circuit breaker triggered (Manual review required)", status: "error" },
        { time: "14:28:31.810", text: "Dispatched to Fallout Queue as FL-1092", status: "info" },
      ],
    },
  },
  {
    id: "drift-4",
    resourceId: "gis-ont-port-14/b",
    subsystem: "Physical Inventory",
    port: ":7040",
    expectedState: "LOCKED_FOR_ROLLBACK",
    actualState: "AVAILABLE (Orphaned)",
    driftType: "Orphan",
    linkedOrder: "ORD-20260712-003975",
    remediationAction: "Inverse Saga #416",
    remediationStatus: "success",
    timestamp: "14:28:22 UTC",
    diffDetails: {
      subsystemNode: "us-east-gis-splitter-14",
      hypothesis: "Field ONT assignment reverted before rollback completed in OMS",
      actualLines: [
        'port_state: "AVAILABLE_POOLED"',
        'optical_path_id: null',
      ],
      expectedLines: [
        'port_state: "LOCKED_FOR_ROLLBACK"',
        'optical_path_id: "OPT-PORT-14B"',
        'rollback_token: "0x416-ont-drain"',
      ],
      traces: [
        { time: "14:28:22.019", text: "Polled GIS physical fiber inventory DB", status: "normal" },
        { time: "14:28:22.311", text: "Detected orphan port release", status: "error" },
        { time: "14:28:22.618", text: "Executing Inverse Saga #416 to acquire rollback quarantine", status: "info" },
        { time: "14:28:22.990", text: "Port successfully locked for rollback completion", status: "success" },
      ],
    },
  },
  {
    id: "drift-5",
    resourceId: "oms-order-intent-4217",
    subsystem: "OMS Core",
    port: ":8080",
    expectedState: "STATUS: COMPENSATED",
    actualState: "STATUS: RUNNING (Ghost lock)",
    driftType: "Missing",
    linkedOrder: "ORD-20260712-004217",
    remediationAction: "Temporal Sync #882",
    remediationStatus: "success",
    timestamp: "14:28:18 UTC",
    diffDetails: {
      subsystemNode: "us-east-oms-kernel-01",
      hypothesis: "Temporal workflow completed compensation but worker crash delayed DB status projection",
      actualLines: [
        'saga_status: "RUNNING"',
        'active_activities: [ "deprovision_hlr" ]',
        'db_version: 14',
      ],
      expectedLines: [
        'saga_status: "COMPENSATED"',
        'active_activities: []',
        'db_version: 15',
        'temporal_execution_status: "COMPLETED_REVERTED"',
      ],
      traces: [
        { time: "14:28:18.110", text: "Auditing OMS local ledger vs Temporal workflow history", status: "normal" },
        { time: "14:28:18.412", text: "Discrepancy: Temporal closed but DB reports RUNNING", status: "error" },
        { time: "14:28:18.700", text: "Replaying projection stream from Temporal history", status: "info" },
        { time: "14:28:19.015", text: "State synchronized to COMPENSATED (v15)", status: "success" },
      ],
    },
  },
  {
    id: "drift-6",
    resourceId: "hlr-profile-voice-qos-904",
    subsystem: "HLR/HSS Gateway",
    port: ":8443",
    expectedState: "QOS_5QI: 1 (VoLTE priority)",
    actualState: "QOS_5QI: 9 (Default Best-Effort)",
    driftType: "Mismatch",
    linkedOrder: "ORD-20260712-003890",
    remediationAction: "Fallout #FL-1089",
    remediationStatus: "warning",
    timestamp: "14:28:11 UTC",
    diffDetails: {
      subsystemNode: "us-east-hlr-node-02a",
      msisdn: "+14155553890",
      hypothesis: "HLR fallback provisioned default QoS template after 5G QoS parameter syntax reject",
      actualLines: [
        'qos_5qi: 9',
        'qos_label: "BEST_EFFORT_DEFAULT"',
        'override_reason: "SYNTAX_PARAM_REJECT"',
      ],
      expectedLines: [
        'qos_5qi: 1',
        'qos_label: "MISSION_CRITICAL_VOICE"',
        'gbr_dl_mbps: 100',
      ],
      traces: [
        { time: "14:28:11.002", text: "Queried HLR active slice QoS telemetry", status: "normal" },
        { time: "14:28:11.319", text: "QoS class mismatch: Expected 5QI 1, observed 5QI 9", status: "error" },
        { time: "14:28:11.644", text: "Syntax flag prevents auto-repair without plan schema patch", status: "error" },
        { time: "14:28:11.902", text: "Escalated to Fallout Queue as FL-1089", status: "info" },
      ],
    },
  },
  {
    id: "drift-7",
    resourceId: "imsi-binding-310410099",
    subsystem: "SIM Inventory",
    port: ":9001",
    expectedState: "ALLOCATED (MSISDN +14155552671)",
    actualState: "STALE_QUARANTINE",
    driftType: "Orphan",
    linkedOrder: "ORD-20260712-003844",
    remediationAction: "State Flush #384",
    remediationStatus: "success",
    timestamp: "14:28:02 UTC",
    diffDetails: {
      subsystemNode: "us-east-sim-db-02",
      msisdn: "+14155552671",
      hypothesis: "Quarantine cleanup cron missed tombstoned IMSI after rapid order swap",
      actualLines: [
        'status: "STALE_QUARANTINE"',
        'quarantine_entered: "2026-07-12T13:40:00Z"',
        'bound_msisdn: "+14155552671"',
      ],
      expectedLines: [
        'status: "ALLOCATED"',
        'active_binding: true',
        'quarantine_entered: null',
        'flush_digest: "0x9812af"',
      ],
      traces: [
        { time: "14:28:02.120", text: "Scanning SIM inventory quarantine partition", status: "normal" },
        { time: "14:28:02.404", text: "Found stale quarantine entry for active subscription", status: "error" },
        { time: "14:28:02.690", text: "Flushing stale quarantine flag via State Flush #384", status: "info" },
        { time: "14:28:03.012", text: "IMSI binding cleared and verified ALLOCATED", status: "success" },
      ],
    },
  },
];

export default function ReconcilerPage() {
  const [selectedDrift, setSelectedDrift] = useState<DriftRecord>(DRIFT_RECORDS[0]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState("all");
  const [driftTypeFilter, setDriftTypeFilter] = useState<"All" | "Orphan" | "Mismatch" | "Missing">("All");
  const [autoRepair, setAutoRepair] = useState(true);
  const [sweepInterval, setSweepInterval] = useState("5m");
  const [copiedId, setCopiedId] = useState(false);

  // Filtered records
  const filteredRecords = DRIFT_RECORDS.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.linkedOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subsystem.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubsystem =
      subsystemFilter === "all" ||
      (subsystemFilter === "hlr" && item.subsystem.includes("HLR")) ||
      (subsystemFilter === "sim" && item.subsystem.includes("SIM")) ||
      (subsystemFilter === "ocs" && item.subsystem.includes("OCS")) ||
      (subsystemFilter === "oms" && item.subsystem.includes("OMS"));

    const matchesType =
      driftTypeFilter === "All" || item.driftType === driftTypeFilter;

    return matchesSearch && matchesSubsystem && matchesType;
  });

  const handleRunSweep = () => {
    setIsSweeping(true);
    setTimeout(() => {
      setIsSweeping(false);
    }, 1500);
  };

  const handleExportAudit = () => {
    const auditData = {
      auditTimestamp: new Date().toISOString(),
      epoch: 8941,
      cluster: "us-east-core",
      targetConsensus: "100.0%",
      autoRepairEnabled: autoRepair,
      scannedResources: 14280,
      driftCount: DRIFT_RECORDS.length,
      autoRepaired: 5,
      escalatedToFallout: 2,
      records: DRIFT_RECORDS,
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `switchon-reconciler-audit-epoch8941.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyResourceId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* PAGE HEADER & SWEEP CONTROLS STRIP */}
      <div className="flex flex-col space-y-4">
        {/* Title & Context */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-headline-lg text-headline-lg text-[#0A1B2E] tracking-tight font-semibold">
                Resource Drift Reconciler
              </h1>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-white text-[#0A1B2E] font-semibold border border-[#CBD5E1] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E] animate-pulse"></span>
                ACTIVE AUDITOR
              </span>
            </div>
            <p className="font-body-md text-body-md text-[#64748B] max-w-3xl">
              Background state auditor continuously comparing source-of-truth orchestrator intent against live subsystem infrastructure state (OMS, Inventory, HLR, OCS).
            </p>
          </div>

          {/* Action Group */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportAudit}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white text-[#0A1B2E] border border-[#CBD5E1] rounded-lg font-body-md text-body-md hover:bg-[#F8FAFC] transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#64748B]">download</span>
              <span>Export Audit (.json)</span>
            </button>
            <button
              onClick={handleRunSweep}
              disabled={isSweeping}
              className="inline-flex items-center gap-2 h-9 px-4 bg-[#0A1B2E] hover:bg-[#14263b] text-white rounded-lg font-body-md text-body-md font-medium transition-all shadow-xs group cursor-pointer disabled:opacity-75"
            >
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-500 ${isSweeping ? "animate-spin" : "group-hover:rotate-180"}`}>
                sync
              </span>
              <span>{isSweeping ? "Sweeping Subsystems..." : "Run Drift Sweep Now"}</span>
            </button>
          </div>
        </div>

        {/* Operational Controls Strip Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-4 text-body-md">
            {/* Last Sweep Info */}
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="material-symbols-outlined text-[18px] text-[#94A3B8]">schedule</span>
              <span>Last Sweep:</span>
              <span className="font-label-md text-label-md text-[#0A1B2E] font-semibold font-mono">
                2026-07-12 14:28:45 UTC
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                (2m 14s ago)
              </span>
            </div>
            <div className="hidden lg:block h-4 w-[1px] bg-[#E2E8F0]"></div>

            {/* Sweep Interval Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-body-md text-body-md">Sweep Interval:</span>
              <div className="relative inline-block">
                <select
                  value={sweepInterval}
                  onChange={(e) => setSweepInterval(e.target.value)}
                  className="h-8 pl-2.5 pr-8 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md font-label-md text-label-md text-[#0A1B2E] focus:outline-none focus:border-[#0A1B2E] focus:ring-1 focus:ring-[#0A1B2E] appearance-none cursor-pointer"
                >
                  <option value="1m">Every 1m</option>
                  <option value="5m">Every 5m</option>
                  <option value="15m">Every 15m</option>
                  <option value="1h">Every 1h</option>
                </select>
                <span className="material-symbols-outlined absolute right-1.5 top-1.5 text-[18px] text-[#94A3B8] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            <div className="hidden lg:block h-4 w-[1px] bg-[#E2E8F0]"></div>

            {/* Consensus Target */}
            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-[#475569]">
              <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">verified</span>
              <span>
                Target Consensus: <strong className="text-[#0A1B2E] font-mono font-semibold">100.0%</strong>
              </span>
            </div>
          </div>

          {/* Auto-Repair Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoRepair}
                  onChange={(e) => setAutoRepair(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CBD5E1] after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#0A1B2E]"></div>
              </div>
              <span className="font-body-md text-body-md font-medium text-[#0A1B2E]">Auto-Repair Enabled</span>
            </label>
            <span className="font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full bg-white text-[#0A1B2E] border border-[#CBD5E1]">
              Safe Invariants Only
            </span>
          </div>
        </div>
      </div>

      {/* TOP SUMMARY KPI CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Resources Scanned */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md font-medium text-[#475569]">Resources Scanned</span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#0A1B2E]">
              <span className="material-symbols-outlined text-[20px]">manage_search</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">14,280</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                4 Subsystems
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">OMS, Inventory, HLR, OCS active states</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0A1B2E] h-full rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        {/* Card 2: Drift Detected */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md font-medium text-[#475569]">Drift Detected</span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#0A1B2E]">
              <span className="material-symbols-outlined text-[20px]">difference</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">7</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                0.049% Drift Rate
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">State divergences requiring intervention</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#475569] h-full rounded-full" style={{ width: "7%" }}></div>
          </div>
        </div>

        {/* Card 3: Auto-Repaired */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md font-medium text-[#475569]">Auto-Repaired</span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#0A1B2E]">
              <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">5</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                100% Compensated
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">Self-healed via deterministic sagas</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0A1B2E] h-full rounded-full" style={{ width: "71.4%" }}></div>
          </div>
        </div>

        {/* Card 4: Escalated to Fallout */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md font-medium text-[#475569]">Escalated to Fallout</span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#0A1B2E]">
              <span className="material-symbols-outlined text-[20px]">report</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">2</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                Needs Manual Review
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">Safety circuit-breaker halted compensation</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#94A3B8] h-full rounded-full" style={{ width: "28.6%" }}></div>
          </div>
        </div>
      </div>

      {/* MAIN SECTION: RECONCILED RESOURCE DRIFT LEDGER + OVERLAY SLIDE-OUT DRAWER */}
      <div className="relative">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-[#EDF0F5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A1B2E] text-[22px]">compare_arrows</span>
                <h2 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold">
                  Detected State Divergences &amp; Remediation History
                </h2>
              </div>
              <span className="font-label-sm text-label-sm font-mono px-2 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1]">
                Sweep Epoch #8,941 Complete
              </span>
            </div>
            <div className="flex items-center gap-2 text-label-sm font-mono text-[#64748B]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0A1B2E]"></span>
              <span>Next Audit: in 2m 46s</span>
            </div>
          </div>

          {/* Search and Filter Toolbar */}
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full md:max-w-md relative">
              <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-[#94A3B8]">
                search
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8.5 pl-9 pr-3 bg-white border border-[#CBD5E1] rounded-lg font-body-md text-body-md text-[#0A1B2E] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0A1B2E] focus:ring-1 focus:ring-[#0A1B2E] transition-all"
                placeholder="Filter by Resource ID, MSISDN, Order ID..."
                type="text"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Subsystem Filter */}
              <select
                value={subsystemFilter}
                onChange={(e) => setSubsystemFilter(e.target.value)}
                className="h-8.5 px-3 bg-white border border-[#CBD5E1] rounded-lg font-body-sm text-body-sm text-[#0A1B2E] focus:outline-none focus:border-[#0A1B2E] cursor-pointer"
              >
                <option value="all">All Subsystems (4)</option>
                <option value="hlr">HLR/HSS Gateway</option>
                <option value="sim">SIM Inventory</option>
                <option value="ocs">OCS Billing</option>
                <option value="oms">OMS Core</option>
              </select>

              {/* Drift Type Filter */}
              <div className="inline-flex rounded-lg border border-[#CBD5E1] bg-white p-0.5">
                {(["All", "Orphan", "Mismatch", "Missing"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDriftTypeFilter(type)}
                    className={`px-2.5 py-1 text-label-sm font-medium rounded-md transition-colors cursor-pointer ${
                      driftTypeFilter === type
                        ? "bg-[#0A1B2E] text-white font-semibold"
                        : "text-[#64748B] hover:text-[#0A1B2E] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Total Records Badge */}
              <span className="font-label-sm text-label-sm font-medium text-[#475569] bg-[#E2E8F0] px-2.5 py-1 rounded-md">
                Showing {filteredRecords.length} records
              </span>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-label-sm uppercase text-[#475569] tracking-wider h-10 select-none">
                  <th className="py-2 px-4 font-semibold">Resource ID</th>
                  <th className="py-2 px-4 font-semibold">Subsystem</th>
                  <th className="py-2 px-4 font-semibold">Expected State (Intent)</th>
                  <th className="py-2 px-4 font-semibold">Actual State (Observed)</th>
                  <th className="py-2 px-4 font-semibold">Drift Type</th>
                  <th className="py-2 px-4 font-semibold">Linked Order</th>
                  <th className="py-2 px-4 font-semibold">Remediation Action</th>
                  <th className="py-2 px-4 font-semibold">Sweep Timestamp</th>
                  <th className="py-2 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F5] font-body-sm text-body-sm">
                {filteredRecords.map((item) => {
                  const isSelected = selectedDrift.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedDrift(item);
                        setDrawerOpen(true);
                      }}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? "bg-[#F8FAFC] border-l-4 border-l-[#0A1B2E]"
                          : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <td className={`py-3 px-4 font-mono font-medium ${isSelected ? "text-[#0A1B2E]" : "text-[#0A1B2E]"}`}>
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#0A1B2E]"></span>}
                          <span>{item.resourceId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#0A1B2E]">{item.subsystem}</span>
                          <span className="font-label-sm text-label-sm font-mono text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                            {item.port}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-label-sm text-[#475569] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                          {item.expectedState}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-label-sm px-2 py-0.5 rounded border text-[#0A1B2E] bg-white border-[#CBD5E1]">
                          {item.actualState}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm font-medium border bg-[#F1F5F9] text-[#0A1B2E] border-[#CBD5E1]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>
                          {item.driftType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/orders/${item.linkedOrder}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-[#0A1B2E] hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          {item.linkedOrder}
                          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm font-medium border bg-white text-[#0A1B2E] border-[#CBD5E1] shadow-2xs">
                          <span className="material-symbols-outlined text-[14px] text-[#0A1B2E]">
                            {item.remediationStatus === "success" ? "check_circle" : "warning"}
                          </span>
                          {item.remediationAction}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748B] text-label-sm">{item.timestamp}</td>
                      <td className="py-3 px-4 text-right">
                        {isSelected ? (
                          <button className="inline-flex items-center gap-1 px-2.5 py-1 text-label-sm font-medium rounded-md bg-[#0A1B2E] text-white shadow-2xs hover:bg-[#14263b]">
                            <span>Diff</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        ) : (
                          <button className="inline-flex items-center gap-1 px-2 py-1 text-label-sm text-[#0A1B2E] hover:bg-[#F8FAFC] rounded">
                            Inspect Diff →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination / Ledger Summary Foot */}
          <div className="p-3.5 bg-white border-t border-[#EDF0F5] flex items-center justify-between text-body-sm text-[#64748B]">
            <div className="flex items-center gap-2">
              <span>Page 1 of 1</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>Showing {filteredRecords.length} of {DRIFT_RECORDS.length} total state divergences</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1 text-label-sm text-[#94A3B8] border border-[#E2E8F0] rounded bg-[#F8FAFC] cursor-not-allowed" disabled>
                Previous
              </button>
              <button className="px-2.5 py-1 text-label-sm text-[#94A3B8] border border-[#E2E8F0] rounded bg-[#F8FAFC] cursor-not-allowed" disabled>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE STATE DIFF DRAWER (Slide-Over Card) */}
        {drawerOpen && (
          <div
            className="fixed top-14 right-0 bottom-0 w-[560px] max-w-full bg-white border-l border-[#E2E8F0] shadow-2xl z-50 flex flex-col transition-transform duration-300 transform translate-x-0"
            id="inspector-drawer"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-start justify-between bg-white shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A1B2E]"></span>
                  <h3 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold">
                    Drift Inspection: {selectedDrift.subsystem}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-label-sm font-mono text-[#64748B]">
                  <span className="font-semibold text-[#0A1B2E]">Resource ID:</span>
                  <span className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#0A1B2E] border border-[#CBD5E1] select-all">
                    {selectedDrift.resourceId}
                  </span>
                  <button
                    onClick={() => copyResourceId(selectedDrift.resourceId)}
                    className="p-0.5 hover:text-[#0A1B2E] text-[#94A3B8] cursor-pointer"
                    title="Copy Resource ID"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedId ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFCFF]">
              {/* Meta Details Box */}
              <div className="bg-white p-4 rounded-xl border border-[#CBD5E1] space-y-2.5 text-body-sm shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Linked Orchestration Order:</span>
                  <Link
                    href={`/orders/${selectedDrift.linkedOrder}`}
                    className="font-mono text-label-sm text-[#0A1B2E] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    {selectedDrift.linkedOrder}
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Drift Classification:</span>
                  <span className="font-semibold text-[#0A1B2E] font-mono text-label-sm">
                    {selectedDrift.driftType === "Orphan" ? "Orphaned Slice" : selectedDrift.driftType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Root Cause Hypothesis:</span>
                  <span className="text-[#0A1B2E] text-right max-w-xs text-body-sm">
                    {selectedDrift.diffDetails.hypothesis}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Sweep Divergence Window:</span>
                  <span className="font-mono text-label-sm text-[#475569]">
                    Detected {selectedDrift.timestamp} · Epoch #8,941
                  </span>
                </div>
              </div>

              {/* Remediation Status Banner */}
              <div className="border border-[#CBD5E1] rounded-xl p-4 flex items-start gap-3 bg-white shadow-2xs">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 text-[#0A1B2E]">
                  {selectedDrift.remediationStatus === "success" ? "verified_user" : "error"}
                </span>
                <div className="space-y-1">
                  <p className="font-body-md text-body-md font-semibold text-[#0A1B2E]">
                    {selectedDrift.remediationStatus === "success"
                      ? "Action Taken: Auto-Compensated via Saga Tombstone"
                      : "Escalated to Operator: Human In-The-Loop Required"}
                  </p>
                  <p className="font-body-sm text-body-sm leading-relaxed text-[#64748B]">
                    {selectedDrift.remediationStatus === "success" ? (
                      <>
                        Formal TLA+ Invariant{" "}
                        <code className="font-mono bg-[#F1F5F9] text-[#0A1B2E] px-1 py-0.5 rounded text-label-sm border border-[#CBD5E1]">
                          INV-01 (No Orphan Slices)
                        </code>{" "}
                        successfully restored. Deprovision tombstone pushed to {selectedDrift.subsystem} with inverse transaction hash.
                      </>
                    ) : (
                      <>
                        Formal invariant circuit breaker tripped on threshold. Rollback halted to protect financial ledger integrity. Ticket created in Fallout Queue.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Visual Before / After Code Diff Panel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold">
                    State Payload Reconciliation Diff
                  </h4>
                  <span className="font-label-sm text-label-sm text-[#64748B] font-mono">Format: YAML (Canonical)</span>
                </div>
                <div className="bg-white rounded-xl border border-[#CBD5E1] overflow-hidden text-label-sm font-mono shadow-xs">
                  {/* Diff Headers */}
                  <div className="grid grid-cols-2 bg-[#F8FAFC] border-b border-[#CBD5E1] py-2 px-3 text-[#0A1B2E] font-medium text-center">
                    <div>Actual Subsystem (Observed)</div>
                    <div>Reconciled Intent (Target)</div>
                  </div>
                  {/* Diff Content View */}
                  <div className="p-3 text-[12px] leading-5 font-mono overflow-x-auto space-y-0.5 bg-white">
                    <div className="text-[#64748B]">1  resource_id: &quot;{selectedDrift.resourceId}&quot;</div>
                    <div className="text-[#64748B]">2  subsystem_node: &quot;{selectedDrift.diffDetails.subsystemNode || "us-east-core"}&quot;</div>
                    {selectedDrift.diffDetails.msisdn && (
                      <div className="text-[#64748B]">3  msisdn: &quot;{selectedDrift.diffDetails.msisdn}&quot;</div>
                    )}
                    {selectedDrift.diffDetails.imsi && (
                      <div className="text-[#64748B]">4  imsi: &quot;{selectedDrift.diffDetails.imsi}&quot;</div>
                    )}

                    {/* Removed / Actual Leaked Lines (Neutral Slate background) */}
                    {selectedDrift.diffDetails.actualLines.map((line, idx) => (
                      <div key={`act-${idx}`} className="bg-[#F8FAFC] text-[#0A1B2E] border border-[#E2E8F0] px-1.5 py-0.5 rounded-sm flex items-center">
                        <span className="w-5 select-none text-[#64748B] font-semibold">{5 + idx} -</span>
                        <span>{line}</span>
                      </div>
                    ))}

                    {/* Added / Expected Lines (White with Navy text) */}
                    {selectedDrift.diffDetails.expectedLines.map((line, idx) => (
                      <div key={`exp-${idx}`} className="bg-white text-[#0A1B2E] border border-[#CBD5E1] px-1.5 py-0.5 rounded-sm flex items-center">
                        <span className="w-5 select-none text-[#0A1B2E] font-semibold">
                          {5 + selectedDrift.diffDetails.actualLines.length + idx} +
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}

                    <div className="text-[#64748B] pt-1">
                      {5 + selectedDrift.diffDetails.actualLines.length + selectedDrift.diffDetails.expectedLines.length} updated_at: &quot;2026-07-12T14:28:44.209Z&quot;
                    </div>
                    <div className="text-[#64748B]">
                      {6 + selectedDrift.diffDetails.actualLines.length + selectedDrift.diffDetails.expectedLines.length} audit_actor: &quot;switchon-reconciler-daemon&quot;
                    </div>
                  </div>
                </div>
              </div>

              {/* Telemetry Trace Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-[#CBD5E1] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold">
                    Execution Audit Trace
                  </span>
                  <span className="font-label-sm text-label-sm font-mono text-[#0A1B2E] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded font-medium shadow-2xs">
                    PASSED VERIFICATION
                  </span>
                </div>
                <div className="space-y-2 text-label-sm font-mono">
                  {selectedDrift.diffDetails.traces.map((trace, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[#64748B]">
                      <span>{trace.time}</span>
                      <span className="text-right text-[#0A1B2E] font-medium">
                        {trace.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Action Bar */}
            <div className="p-4 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => alert(`Re-verifying state with ${selectedDrift.subsystem} (${selectedDrift.port})...`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-label-md font-medium text-[#0A1B2E] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Re-verify with Subsystem</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Dry-run compensation simulated for ${selectedDrift.resourceId}. Invariant checked: 0 side-effects.`)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-label-md font-medium text-[#0A1B2E] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Dry-Run Compensation</span>
                </button>
                <Link
                  href={`/orders/${selectedDrift.linkedOrder}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-label-md font-medium text-white bg-[#0A1B2E] hover:bg-[#14263b] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">timeline</span>
                  <span>View Trace</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ZERO-DRIFT EMPTY STATE / PERIODIC AUDIT MILESTONE SHOWCASE */}
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#0A1B2E] shrink-0 border border-[#CBD5E1]">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold">
                Audit Milestone: Periodic Zero-Drift Seal
              </h3>
              <span className="font-label-sm text-label-sm font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full shadow-2xs">
                FORMAL PROOF VERIFIED
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B]">
              No orphan or uncompensated drift detected in previous run — all 14,273 invariants fully satisfied across OMS, SIM Inventory, HLR, and OCS at sweep epoch #8,940.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="font-mono text-label-sm text-[#0A1B2E] bg-white px-3 py-1.5 rounded-lg border border-[#CBD5E1] shadow-2xs">
            Invariant Check: <strong className="text-[#0A1B2E]">0 FAILURES</strong>
          </div>
          <Link
            href="/proof/certificates"
            className="inline-flex items-center gap-1 text-label-md text-white bg-[#0A1B2E] hover:bg-[#14263b] font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <span>Proof Certificate</span>
            <span className="material-symbols-outlined text-[16px]">verified</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
