"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SWEEP_DATASETS, DriftRecord } from "@/lib/reconcilerDatasets";


export default function ReconcilerPage() {
  const [sweepInterval, setSweepInterval] = useState<"1m" | "5m" | "15m" | "1h">("5m");
  const currentDataset = SWEEP_DATASETS[sweepInterval];

  const [selectedDrift, setSelectedDrift] = useState<DriftRecord>(currentDataset.records[0]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState("all");
  const [driftTypeFilter, setDriftTypeFilter] = useState<"All" | "Orphan" | "Mismatch" | "Missing">("All");
  const [autoRepair, setAutoRepair] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // When sweepInterval changes, keep selectedDrift pointing to a valid record in the active dataset
  useEffect(() => {
    const exists = currentDataset.records.some((r) => r.id === selectedDrift.id);
    if (!exists && currentDataset.records.length > 0) {
      setSelectedDrift(currentDataset.records[0]);
    }
  }, [sweepInterval, currentDataset, selectedDrift.id]);

  // Filtered records from the current active sweep interval dataset
  const filteredRecords = currentDataset.records.filter((item) => {
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
      sweepInterval: currentDataset.interval,
      epoch: currentDataset.epoch,
      cluster: "us-east-core",
      targetConsensus: currentDataset.consensusTarget,
      autoRepairEnabled: autoRepair,
      scannedResources: currentDataset.scannedResources,
      driftCount: currentDataset.driftCount,
      driftRate: currentDataset.driftRate,
      autoRepaired: currentDataset.autoRepaired,
      escalatedToFallout: currentDataset.escalatedToFallout,
      records: currentDataset.records,
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `switchon-reconciler-audit-${currentDataset.interval}-epoch${currentDataset.epoch}.json`;
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
                {currentDataset.lastSweep}
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                ({currentDataset.elapsedAgo})
              </span>
            </div>
            <div className="hidden lg:block h-4 w-[1px] bg-[#E2E8F0]"></div>

            {/* Sweep Interval Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-body-md text-body-md">Sweep Interval:</span>
              <div className="relative inline-block">
                <select
                  value={sweepInterval}
                  onChange={(e) => setSweepInterval(e.target.value as "1m" | "5m" | "15m" | "1h")}
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
                Target Consensus: <strong className="text-[#0A1B2E] font-mono font-semibold">{currentDataset.consensusTarget}</strong>
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
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">{currentDataset.scannedResources}</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                {currentDataset.subsystemCount} Subsystems
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
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">{currentDataset.driftCount}</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                {currentDataset.driftRate} Drift Rate
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">State divergences requiring intervention</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#475569] h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, (currentDataset.driftCount / 40) * 100))}%` }}
            ></div>
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
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">{currentDataset.autoRepaired}</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                {currentDataset.autoRepairedRate} Compensated
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">Self-healed via deterministic sagas</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0A1B2E] h-full rounded-full"
              style={{
                width: `${currentDataset.driftCount > 0 ? (currentDataset.autoRepaired / currentDataset.driftCount) * 100 : 100}%`,
              }}
            ></div>
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
              <span className="font-label-lg text-[28px] font-bold text-[#0A1B2E] leading-tight font-mono">{currentDataset.escalatedToFallout}</span>
              <span className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#CBD5E1]">
                {currentDataset.escalatedToFallout > 0 ? "Needs Manual Review" : "Zero Fallout"}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#64748B] mt-1">Safety circuit-breaker halted compensation</p>
          </div>
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#94A3B8] h-full rounded-full"
              style={{
                width: `${currentDataset.driftCount > 0 ? (currentDataset.escalatedToFallout / currentDataset.driftCount) * 100 : 0}%`,
              }}
            ></div>
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
                Sweep Epoch #{currentDataset.epoch.toLocaleString()} Complete
              </span>
            </div>
            <div className="flex items-center gap-2 text-label-sm font-mono text-[#64748B]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0A1B2E]"></span>
              <span>Next Audit: {currentDataset.nextAuditIn}</span>
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
              <span>Showing {filteredRecords.length} of {currentDataset.records.length} total state divergences</span>
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
          <>
            <div
              className="fixed inset-0 top-14 bg-[#0A1B2E]/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div
              className="fixed top-14 right-0 bottom-0 w-full sm:w-[560px] max-w-full bg-white border-l border-[#E2E8F0] shadow-2xl z-50 flex flex-col transition-transform duration-300 transform translate-x-0"
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
                    Detected {selectedDrift.timestamp} · Epoch #{currentDataset.epoch.toLocaleString()}
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
        </>
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
