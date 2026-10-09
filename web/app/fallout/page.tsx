"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FalloutDagCanvas } from "@/components/ui/FalloutDagCanvas";

interface FalloutIncident {
  id: string;
  customer: string;
  msisdn: string;
  plan: string;
  subsystem: string;
  summary: string;
  errorCode: string;
  slaElapsed: string;
  ageMinutes: number;
  slaSeverity: "high" | "medium" | "low";
  createdAt: string;
  assignedTo?: string;
  status: "NEEDS_ATTENTION · COMPENSATION_FAILED" | "NEEDS_ATTENTION · LEASE_CONFLICT";
  isResolved?: boolean;
  resolvedAt?: string;
  remediation?: string;
  resolutionTicket?: string;
}

const INITIAL_INCIDENTS: FalloutIncident[] = [
  {
    id: "ORD-20260712-004217",
    customer: "Marcus Vance",
    msisdn: "+1 555 019-4821",
    plan: "Fiber Broadband 500 / Voice Add-on",
    subsystem: "HLR/HSS Gateway",
    summary: "HLR deprovision HTTP 504 Gateway Timeout after 5 retries",
    errorCode: "hlr:timeout-exhausted",
    slaElapsed: "1h 14m",
    ageMinutes: 74,
    slaSeverity: "high",
    createdAt: "2026-07-12T14:22:00Z",
    status: "NEEDS_ATTENTION · COMPENSATION_FAILED",
  },
  {
    id: "ORD-20260712-004210",
    customer: "Northstar Freight",
    msisdn: "500x IoT Fleet",
    plan: "M2M Telematics Enterprise",
    subsystem: "OCS Rating",
    summary: "OCS Void Billing Account rejected: invalid lease state (Err 409)",
    errorCode: "ocs:lease-state-409",
    slaElapsed: "38m",
    ageMinutes: 38,
    slaSeverity: "medium",
    createdAt: "2026-07-12T14:58:00Z",
    assignedTo: "Aarav S.",
    status: "NEEDS_ATTENTION · LEASE_CONFLICT",
  },
];

const RESOLVED_INCIDENTS_SEED: FalloutIncident[] = [
  {
    id: "ORD-20260712-004208",
    customer: "AeroTech Solutions",
    msisdn: "+1 555 230-1099",
    plan: "5G Postpaid Unlimited",
    subsystem: "HLR/HSS Gateway",
    summary: "HLR connection timeout cleared after automated node failover",
    errorCode: "hlr:transient-503",
    slaElapsed: "18m",
    ageMinutes: 18,
    slaSeverity: "low",
    createdAt: "2026-07-12T13:10:00Z",
    assignedTo: "Aarav Sharma",
    status: "NEEDS_ATTENTION · COMPENSATION_FAILED",
    isResolved: true,
    resolvedAt: "13:28:14 UTC",
    remediation: "Triggered HLR Gateway re-probe and compensation replay; tombstone recorded.",
    resolutionTicket: "INC-94802",
  },
  {
    id: "ORD-20260712-004205",
    customer: "Elena Rostova",
    msisdn: "+1 555 892-3341",
    plan: "eSIM Roaming Global",
    subsystem: "SIM/eSIM Provisioner",
    summary: "SM-DP+ profile download lock resolved following operator reset",
    errorCode: "sim:eid-lease-timeout",
    slaElapsed: "24m",
    ageMinutes: 24,
    slaSeverity: "low",
    createdAt: "2026-07-12T12:45:00Z",
    assignedTo: "Ops Team",
    status: "NEEDS_ATTENTION · LEASE_CONFLICT",
    isResolved: true,
    resolvedAt: "13:09:45 UTC",
    remediation: "Manually unlocked EID profile allocation in inventory database.",
    resolutionTicket: "INC-94798",
  },
];

export default function FalloutQueuePage() {
  const [incidents, setIncidents] = useState<FalloutIncident[]>(INITIAL_INCIDENTS);
  const [resolvedIncidents, setResolvedIncidents] = useState<FalloutIncident[]>(RESOLVED_INCIDENTS_SEED);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("ORD-20260712-004217");
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [subsystemFilter, setSubsystemFilter] = useState("All Subsystems");
  const [ageSortFilter, setAgeSortFilter] = useState<string>("Age (Oldest first)");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [resolutionTicket, setResolutionTicket] = useState("INC-94821");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [activeDagNode, setActiveDagNode] = useState<string>("rollback-deprovision");

  // Fetch real incidents needing attention from Order API
  useEffect(() => {
    const fetchLiveFallout = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiHost}/orders?limit=100`);
        if (res.ok) {
          const apiOrders = await res.json();
          const attentionOrders = apiOrders.filter(
            (o: { state: string }) => o.state === "NEEDS_ATTENTION"
          );
          if (attentionOrders.length > 0) {
            const liveIncidents: FalloutIncident[] = attentionOrders.map(
              (o: { order_id: string; customer_id: string; msisdn?: string; product: string; failure_reason?: string; created_at?: string }) => ({
                id: o.order_id,
                customer: o.customer_id,
                msisdn: o.msisdn || "+1 555 019-4821",
                plan: o.product,
                subsystem: "HLR/HSS Gateway",
                summary: o.failure_reason || "Compensation stalled / manual operator intervention needed",
                errorCode: "hlr:timeout-exhausted",
                slaElapsed: "12m",
                ageMinutes: 12,
                slaSeverity: "high",
                createdAt: o.created_at || new Date().toISOString(),
                status: "NEEDS_ATTENTION · COMPENSATION_FAILED",
              })
            );
            setIncidents((prev) => {
              const liveIds = new Set(liveIncidents.map((i) => i.id));
              const nonDuplicated = prev.filter((p) => !liveIds.has(p.id));
              return [...liveIncidents, ...nonDuplicated];
            });
          }
        }
      } catch {
        // Fallback to initial incidents
      }
    };
    fetchLiveFallout();
    const interval = setInterval(fetchLiveFallout, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeDataSet: FalloutIncident[] = activeTab === "active" ? incidents : resolvedIncidents;
  const selectedIncident = activeDataSet.find((i: FalloutIncident) => i.id === selectedId) || activeDataSet[0];
  const isCurrentResolved = resolvedIds.includes(selectedId) || (selectedIncident ? !!selectedIncident.isResolved : false);

  const handleClaim = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, assignedTo: "Aarav Sharma (You)" } : inc))
    );
  };

  const handleRetryCompensation = (id: string) => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      setResolvedIds((prev) => Array.from(new Set([...prev, id])));
      alert(`Triggered Temporal compensation workflow replay for ${id}. Profile lock cleared and rollback completed.`);
    }, 900);
  };

  const handleManualResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolving = incidents.find((i) => i.id === selectedId);
    if (resolving) {
      const now = new Date();
      const timeStr = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")} UTC`;
      const newlyResolved: FalloutIncident = {
        ...resolving,
        isResolved: true,
        resolvedAt: timeStr,
        remediation: resolutionNotes || "Manually reconciled via NOC console ticket.",
        resolutionTicket,
      };
      setIncidents((prev) => prev.filter((i) => i.id !== selectedId));
      setResolvedIncidents((prev) => [newlyResolved, ...prev]);
    }
    setResolvedIds((prev) => Array.from(new Set([...prev, selectedId])));
    setShowManualModal(false);
    alert(`Incident ${selectedId} marked RESOLVED with reference ${resolutionTicket}. Guided checklist now completed.`);
  };

  // Base list depending on active tab
  const listToFilter: FalloutIncident[] = activeTab === "active" ? incidents : resolvedIncidents;

  // Filter and Sort Pipeline
  const filteredIncidents = listToFilter
    .filter((inc: FalloutIncident) => {
      if (subsystemFilter !== "All Subsystems" && inc.subsystem !== subsystemFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inc.id.toLowerCase().includes(q) ||
          inc.customer.toLowerCase().includes(q) ||
          inc.msisdn.toLowerCase().includes(q) ||
          inc.summary.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a: FalloutIncident, b: FalloutIncident) => {
      if (ageSortFilter === "Age (Oldest first)") {
        return (b.ageMinutes || 0) - (a.ageMinutes || 0);
      }
      if (ageSortFilter === "Age (Newest first)") {
        return (a.ageMinutes || 0) - (b.ageMinutes || 0);
      }
      if (ageSortFilter === "SLA Severity") {
        const order: Record<"high" | "medium" | "low", number> = { high: 3, medium: 2, low: 1 };
        return order[b.slaSeverity] - order[a.slaSeverity];
      }
      return 0;
    });

  // Calculate dynamic SLA Risk counts based on the active dataset
  const countTotal = activeDataSet.length;
  const countHighRisk = activeDataSet.filter((i: FalloutIncident) => i.ageMinutes >= 60).length;
  const countMedRisk = activeDataSet.filter((i: FalloutIncident) => i.ageMinutes >= 15 && i.ageMinutes < 60).length;
  const countLowRisk = activeDataSet.filter((i: FalloutIncident) => i.ageMinutes < 15).length;

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Top Command Banner / Metadata & Controls */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-lg text-headline-lg text-[#0A1B2E] tracking-tight font-bold">
                Fallout Queue
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A1B2E] text-white font-label-sm text-label-sm font-semibold shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                {incidents.length} Active Incidents
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-[#0A1B2E] font-label-sm text-label-sm font-medium border border-[#CBD5E1] shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                SLA Risk: Moderate
              </span>
            </div>
            <p className="font-body-md text-body-md text-[#475569] max-w-3xl">
              Orders needing manual intervention (
              <span className="font-label-sm text-label-sm text-[#0A1B2E] bg-white border border-[#CBD5E1] px-1 py-0.5 rounded font-mono font-semibold">
                NEEDS_ATTENTION
              </span>
              ) — automated saga rollback halted or circuit-breaker tripped
            </p>
          </div>

          {/* Toolbar / Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subsystem Dropdown */}
            <div className="relative">
              <select
                value={subsystemFilter}
                onChange={(e) => setSubsystemFilter(e.target.value)}
                className="h-9 px-3 pr-8 bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg shadow-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer"
              >
                <option>All Subsystems</option>
                <option>HLR/HSS Gateway</option>
                <option>OCS Rating</option>
                <option>SIM/eSIM Provisioner</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2 text-[#000000] pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            {/* Sort / Age Select */}
            <div className="relative">
              <select
                value={ageSortFilter}
                onChange={(e) => setAgeSortFilter(e.target.value)}
                className="h-9 px-3 pr-8 bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg shadow-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer"
              >
                <option value="Age (Oldest first)">Age (Oldest first)</option>
                <option value="Age (Newest first)">Age (Newest first)</option>
                <option value="SLA Severity">SLA Severity</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2 text-[#000000] pointer-events-none text-[18px]">
                sort
              </span>
            </div>

            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-9 px-3 flex items-center gap-1.5 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface rounded-lg shadow-sm border border-outline-variant/30 transition-colors font-label-sm text-label-sm cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[16px] text-primary ${
                  autoRefresh ? "animate-spin" : ""
                }`}
                style={{ animationDuration: "10s" }}
              >
                sync
              </span>
              <span>{autoRefresh ? "Auto-refresh: 10s" : "Paused"}</span>
            </button>

            {/* Export Action */}
            <button
              onClick={() => alert("Exporting Fallout Incident Triage report...")}
              className="h-9 px-3.5 flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg shadow-sm border border-outline-variant/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Triage Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two-Column Master / Detail Grid */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (4 Cols) - Incident Cards Queue */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          {/* Tab Header & Quick Count Ribbon */}
          <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between p-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <button
                onClick={() => {
                  setActiveTab("active");
                  if (incidents.length > 0) setSelectedId(incidents[0].id);
                }}
                className={`flex-1 py-1.5 px-3 rounded-md font-headline-sm text-headline-sm shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "active"
                    ? "bg-[#0A1B2E] text-white font-semibold shadow-xs"
                    : "text-[#64748B] hover:text-[#0A1B2E] font-normal"
                }`}
              >
                <span>Active Fallout</span>
                <span className="px-1.5 py-0.5 bg-white text-[#0A1B2E] border border-[#CBD5E1] rounded-full font-label-sm text-label-sm font-bold">
                  {incidents.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("resolved");
                  if (resolvedIncidents.length > 0) setSelectedId(resolvedIncidents[0].id);
                }}
                className={`flex-1 py-1.5 px-3 rounded-md font-body-sm text-body-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "resolved"
                    ? "bg-[#0A1B2E] text-white font-semibold shadow-xs"
                    : "text-[#64748B] hover:text-[#0A1B2E] font-normal"
                }`}
              >
                <span>Resolved</span>
                <span className="px-1.5 py-0.5 bg-white text-[#64748B] border border-[#E2E8F0] rounded-full font-label-sm text-label-sm">
                  {resolvedIncidents.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#94A3B8] text-[18px]">
                filter_list
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-3 text-body-sm font-body-sm bg-white rounded-lg text-[#0A1B2E] placeholder:text-[#94A3B8] border border-[#CBD5E1] focus:outline-none focus:ring-1 focus:ring-[#0A1B2E]"
                placeholder={activeTab === "active" ? "Filter fallout items..." : "Filter resolved items..."}
                type="text"
              />
            </div>

            {/* SLA Risk Counter Ribbon */}
            <div className="grid grid-cols-4 gap-1 pt-1 bg-[#F8FAFC] p-2 rounded-lg text-center font-label-sm text-label-sm border border-[#E2E8F0]">
              <div className="flex flex-col">
                <span className="text-[#64748B] font-normal">Total</span>
                <span className="font-bold text-[#0A1B2E]">{countTotal}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B] font-normal">&gt;1h Risk</span>
                <span className="font-bold text-[#0A1B2E]">{countHighRisk}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B] font-normal">&lt;1h Risk</span>
                <span className="font-bold text-[#0A1B2E]">{countMedRisk}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B] font-normal">&lt;15m</span>
                <span className="font-bold text-[#64748B]">{countLowRisk}</span>
              </div>
            </div>
          </div>

          {/* Fallout Incident List Cards */}
          <div className="flex flex-col gap-3">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 bg-white rounded-xl text-center border border-[#CBD5E1] shadow-2xs">
                <span className="material-symbols-outlined text-[32px] text-[#94A3B8] mb-1">inbox</span>
                <p className="font-body-sm text-body-sm text-[#0A1B2E] font-medium">No incidents match your filter.</p>
                <p className="font-label-sm text-label-sm text-[#64748B] mt-0.5">Try resetting search or filters.</p>
              </div>
            ) : (
              filteredIncidents.map((inc: FalloutIncident) => {
                const isSelected = inc.id === selectedId;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedId(inc.id)}
                    className={`relative rounded-xl p-4 shadow-sm transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#F8FAFC] border-[#0A1B2E] ring-2 ring-[#0A1B2E]"
                        : "bg-white hover:bg-[#F8FAFC] border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${inc.isResolved ? "bg-[#059669]" : "bg-[#0A1B2E]"}`}></span>
                        <span className="font-label-md text-label-md font-bold text-[#0A1B2E] tracking-wide">
                          {inc.id}
                        </span>
                      </div>
                      {/* SLA / Resolved Pill */}
                      {inc.isResolved ? (
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] shadow-2xs">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          RESOLVED
                        </span>
                      ) : (
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border bg-white text-[#0A1B2E] border-[#CBD5E1] shadow-2xs">
                          <span className="material-symbols-outlined text-[12px]">timer</span>
                          {inc.slaElapsed}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-medium bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1]">
                        {inc.subsystem}
                      </span>
                      <span className="font-body-sm text-body-sm text-[#64748B] truncate">
                        {inc.customer} ({inc.msisdn})
                      </span>
                    </div>

                    <p className="font-body-sm text-body-sm text-[#0A1B2E] font-medium line-clamp-2 mb-3 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      &quot;{inc.summary}&quot;
                    </p>

                    <div className="flex items-center justify-between font-label-sm text-label-sm text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                      <div className="flex items-center gap-1 truncate max-w-[170px]" title={`RFC-7807 urn:telecom:${inc.errorCode}`}>
                        <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                        <span className="truncate">{inc.errorCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{inc.isResolved ? "Resolved at:" : "Assigned:"}</span>
                        {inc.isResolved ? (
                          <span className="font-medium text-[#0A1B2E]">{inc.resolvedAt}</span>
                        ) : inc.assignedTo ? (
                          <span className="font-medium text-[#0A1B2E] flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                            {inc.assignedTo}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaim(inc.id);
                            }}
                            className="text-[#0A1B2E] hover:text-[#14263b] font-semibold hover:underline"
                          >
                            + Claim
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Collapsed Archive Note */}
            <div className="p-3 bg-white rounded-xl text-center border border-[#CBD5E1] shadow-2xs">
              <span className="font-body-sm text-body-sm text-[#64748B]">
                {activeTab === "active"
                  ? `Showing ${filteredIncidents.length} active fallout items. ${resolvedIncidents.length} resolved in compliance with SLA.`
                  : `Showing ${filteredIncidents.length} resolved incidents with full remediation audit records.`}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 Cols) - Detailed Fallout Triage & Resolution Workbench */}
        {selectedIncident && (
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            {/* 1. Incident Master Header Box */}
            <div className="bg-white rounded-xl p-5 shadow-2xs border border-[#CBD5E1] flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-headline-md text-headline-md font-bold text-[#0A1B2E] font-label-md">
                      {selectedIncident.id}
                    </span>
                    <button
                      className="p-1 text-[#64748B] hover:text-[#0A1B2E] rounded hover:bg-[#F8FAFC] transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedIncident.id);
                        alert(`Copied ${selectedIncident.id} to clipboard!`);
                      }}
                      title="Copy Order ID"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm font-bold shadow-2xs ${
                      isCurrentResolved
                        ? "bg-emerald-700 text-white"
                        : "bg-[#0A1B2E] text-white"
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${isCurrentResolved ? "bg-white" : "bg-white"}`}></span>
                      {isCurrentResolved ? "RESOLVED · OPERATOR_OVERRIDE_APPLIED" : selectedIncident.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-[#64748B]">
                    <span>
                      Customer: <strong className="text-[#0A1B2E] font-medium">{selectedIncident.customer}</strong>
                    </span>
                    <span>·</span>
                    <span>Plan: {selectedIncident.plan}</span>
                    <span>·</span>
                    <span>MSISDN: {selectedIncident.msisdn}</span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    className="inline-flex items-center gap-1 text-[#0A1B2E] hover:text-[#14263b] font-label-sm text-label-sm font-semibold hover:underline"
                    href={`/orders/${selectedIncident.id}`}
                  >
                    <span>Full Order Detail</span>
                    <span className="material-symbols-outlined text-[14px]">north_east</span>
                  </Link>
                  <span className="text-[#CBD5E1]">|</span>
                  <a
                    className="inline-flex items-center gap-1 text-[#0A1B2E] hover:text-[#14263b] font-label-sm text-label-sm font-semibold hover:underline"
                    href={`${process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8233"}/namespaces/default/workflows`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Temporal Console</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* SLA Warning Bar + Action Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <div className="flex items-center gap-2 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[#0A1B2E] text-[18px]">alarm</span>
                  <span className="text-[#0A1B2E] font-semibold">SLA Deadline:</span>
                  <span className="text-[#0A1B2E] font-bold">In 16 mins</span>
                  <span className="text-[#64748B]">(Elapsed: {selectedIncident.slaElapsed} / 90m Threshold)</span>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleClaim(selectedIncident.id)}
                    className="h-8 px-3 rounded-md bg-white hover:bg-[#F8FAFC] text-[#0A1B2E] font-body-sm text-body-sm font-medium shadow-2xs border border-[#CBD5E1] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    <span>{selectedIncident.assignedTo ? "Assigned to You" : "Assign to me"}</span>
                  </button>
                  {!isCurrentResolved ? (
                    <>
                      <button
                        onClick={() => setShowManualModal(true)}
                        className="h-8 px-3 rounded-md bg-white hover:bg-[#F8FAFC] text-[#0A1B2E] border border-[#CBD5E1] font-body-sm text-body-sm font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">handyman</span>
                        <span>Resolve Manually…</span>
                      </button>
                      <button
                        onClick={() => handleRetryCompensation(selectedIncident.id)}
                        disabled={isResolving}
                        className="h-8 px-3 rounded-md bg-[#0A1B2E] hover:bg-[#14263b] text-white font-body-sm text-body-sm font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${isResolving ? "animate-spin" : ""}`}>
                          replay
                        </span>
                        <span>{isResolving ? "Replaying..." : "Retry Compensation"}</span>
                      </button>
                    </>
                  ) : (
                    <span className="h-8 px-3 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-label-sm text-label-sm font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      <span>Resolved via Operator Override</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Root-Cause & Fallout Copilot Synthesis Box */}
              <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-200 flex flex-col gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-purple-700">psychology</span>
                    <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-purple-900">
                      SwitchOn Telecom RCA Copilot v2.4
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 font-bold">
                      98.4% Confidence
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#000000] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    Read-Only Diagnostics · Determinism Invariant Safe
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-body-sm text-[#000000]">
                  <div className="bg-white p-3 rounded-lg border border-[#CBD5E1] space-y-1">
                    <span className="font-label-sm text-label-sm font-bold text-[#000000] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-purple-700">troubleshoot</span>
                      Root-Cause Diagnosis
                    </span>
                    <p className="text-[12px] leading-relaxed">
                      {selectedIncident.summary}. Upstream node failed healthcheck probe during backward saga rollback.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#CBD5E1] space-y-1">
                    <span className="font-label-sm text-label-sm font-bold text-[#000000] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-amber-700">security</span>
                      Blast Radius &amp; Risk
                    </span>
                    <p className="text-[12px] leading-relaxed">
                      Zero billing leakage. 1 residual profile lock on <code className="font-mono font-semibold">hlr-east-01</code> preventing terminal saga completion.
                    </p>
                  </div>
                </div>
              </div>

            {/* 2. Interactive Guided Remediation Checklist */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Guided Remediation Checklist
                  </h2>
                </div>
                <span className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-medium ${
                  isCurrentResolved
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {isCurrentResolved ? "3 of 3 steps completed (RESOLVED)" : "1 of 3 steps completed"}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {/* Step 1: COMPLETED */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low/70 border border-outline-variant/20">
                  <div className="mt-0.5">
                    <span
                      className="material-symbols-outlined text-[#0A1B2E] text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-medium text-on-surface line-through decoration-outline">
                        1. Inspect HLR/HSS subsystem telemetry &amp; confirm subscriber profile lock status
                      </span>
                      <span className="font-label-sm text-label-sm text-[#0A1B2E] font-bold font-mono">PASSED</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Auto-checked by agent: 1 orphaned profile lock detected on active slice{" "}
                      <code className="font-label-sm text-label-sm bg-surface-container-high px-1 rounded">
                        hlr-east-01
                      </code>
                      .
                    </p>
                  </div>
                </div>

                {/* Step 2: DYNAMIC STATE */}
                <div className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${
                  isCurrentResolved
                    ? "bg-surface-container-low/70 border-outline-variant/20"
                    : "bg-[#F8FAFC] shadow-xs border-[#CBD5E1]"
                }`}>
                  <div className="mt-0.5">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isCurrentResolved ? "text-[#0A1B2E]" : "text-primary"
                      }`}
                      style={isCurrentResolved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {isCurrentResolved ? "check_circle" : "radio_button_checked"}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`font-body-md text-body-md font-semibold ${
                        isCurrentResolved ? "text-on-surface line-through decoration-outline" : "text-primary"
                      }`}>
                        2. Verify network resources or retry automated compensation
                      </span>
                      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-bold ${
                        isCurrentResolved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono"
                          : "bg-primary text-on-primary"
                      }`}>
                        {isCurrentResolved ? "VERIFIED & CLEARED" : "IN PROGRESS"}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      {isCurrentResolved ? (
                        <span className="text-[#475569]">
                          Orchestrator runner cleared profile lock and verified tombstone on <code className="bg-slate-100 px-1 rounded font-mono">hlr-east-01</code>. Residual resources deallocated.
                        </span>
                      ) : (
                        <>
                          Execute{" "}
                          <button
                            onClick={() => handleRetryCompensation(selectedIncident.id)}
                            className="underline font-semibold text-primary hover:text-primary-container"
                          >
                            Retry Compensation
                          </button>{" "}
                          if cluster gRPC endpoint has recovered, or trigger automated network release script via orchestrator runner.
                        </>
                      )}
                    </p>
                    {!isCurrentResolved && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => alert("Executing HLR Lock Purge Script via Temporal Runner...")}
                          className="h-7 px-2.5 rounded bg-surface-container-lowest hover:bg-surface-container-low text-primary font-label-sm text-label-sm font-medium shadow-xs border border-outline-variant/30 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">terminal</span> Run Lock Purge Script
                        </button>
                        <button
                          onClick={() => alert("gRPC Health Probe: hlr-east-01 is UP (RTT 18ms). Ready to retry.")}
                          className="h-7 px-2.5 rounded bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-medium border border-outline-variant/30 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">sync_alt</span> Probe gRPC Health (hlr-east-01)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: DYNAMIC RESOLUTION STEP */}
                <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isCurrentResolved
                    ? "bg-[#F8FAFC] shadow-xs border-[#CBD5E1]"
                    : "bg-surface-container-low/40 opacity-75 border-outline-variant/20"
                }`}>
                  <div className="mt-0.5">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isCurrentResolved ? "text-emerald-700 font-bold" : "text-[#000000]"
                      }`}
                      style={isCurrentResolved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {isCurrentResolved ? "task_alt" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`font-body-sm text-body-sm font-semibold ${
                        isCurrentResolved ? "text-[#0A1B2E]" : "text-on-surface"
                      }`}>
                        3. Resolve manually with NOC change ticket reference
                      </span>
                      <span className={`font-label-sm text-label-sm font-bold ${
                        isCurrentResolved
                          ? "bg-[#0A1B2E] text-white px-2 py-0.5 rounded font-mono"
                          : "text-[#000000]"
                      }`}>
                        {isCurrentResolved ? "COMPLETED" : "QUEUED"}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {isCurrentResolved ? (
                        <span className="text-emerald-900 font-medium">
                          NOC override ticket applied. Saga rollback cascade verified and order transitioned to ROLLED_BACK.
                        </span>
                      ) : (
                        "Requires mandatory JIRA/INC incident cross-reference and peer confirmation once resource deallocation is reconciled."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Mini Saga Execution DAG (Interactive ReactFlow Graph) */}
            <div className="bg-white rounded-xl shadow-2xs border border-[#CBD5E1] flex flex-col overflow-hidden">
              {/* DAG Header & Controls */}
              <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A1B2E] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold text-[#0A1B2E] tracking-tight">
                        Saga Orchestration Execution DAG
                      </h2>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                        isCurrentResolved
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]"
                      }`}>
                        {isCurrentResolved ? "RESOLVED" : "HALTED"}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#64748B]">
                      Interactive saga topology · Drag tags to restructure · Click nodes to inspect telemetry &amp; retry handlers
                    </p>
                  </div>
                </div>

                {/* Legend Chips */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A1B2E]">
                    <span className="h-2 w-2 rounded-full bg-[#0A1B2E]"></span>
                    Succeeded
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B]">
                    <span className="h-2 w-2 rounded-full bg-[#64748B]"></span>
                    Forward Fail
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A1B2E]">
                    <span className="h-2 w-2 rounded-full bg-[#0A1B2E] animate-pulse"></span>
                    Comp. Failed
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-[#94A3B8]">
                    <span className="h-2 w-2 rounded-full bg-[#CBD5E1]"></span>
                    Stalled
                  </span>
                </div>
              </div>

              {/* Fully Interactive ReactFlow DAG Canvas */}
              <FalloutDagCanvas
                activeDagNode={activeDagNode}
                onSelectNode={(nodeId) => setActiveDagNode(nodeId)}
                isResolved={isCurrentResolved}
              />

              {/* Interactive Inspector Panel for Clicked Node */}
              <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                {activeDagNode === "rollback-deprovision" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#0A1B2E] text-white">
                          TASK: HLR_DEPROVISION_SLICE
                        </span>
                        <span className="text-[12px] font-bold text-[#0A1B2E]">
                          {isCurrentResolved
                            ? "Manually Resolved (Operator Override Applied)"
                            : "Compensation Failure (Halted Saga)"}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748B]">
                        {isCurrentResolved
                          ? "Verified subscriber profile purged manually via NOC override ticket. Downstream tombstones confirmed clean."
                          : "Attempted 5 exponential retries [1s, 2s, 4s, 8s, 16s]. Subsystem endpoint hlr-east-01:8103 unresponsive."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isCurrentResolved ? (
                        <button
                          onClick={() => handleRetryCompensation(selectedIncident.id)}
                          disabled={isResolving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1B2E] hover:bg-[#14263b] text-white font-medium text-[12px] shadow-xs cursor-pointer disabled:opacity-75"
                        >
                          <span className={`material-symbols-outlined text-[14px] ${isResolving ? "animate-spin" : ""}`}>replay</span>
                          <span>Retry Compensation Now</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[12px] font-bold font-mono border border-emerald-300">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          RESOLVED
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {activeDagNode === "forward-charging" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1]">
                          FORWARD TRIGGER: OCS_START_CHARGING
                        </span>
                        <span className="text-[12px] font-bold text-[#0A1B2E]">Initial Business Failure</span>
                      </div>
                      <p className="text-[12px] text-[#64748B]">
                        Upstream rating microservice threw HTTP 500 internal server error. This triggered the automatic backward compensation saga.
                      </p>
                    </div>
                  </div>
                )}

                {activeDagNode === "forward-validate" && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1]">
                        TASK: OMS_VALIDATE_ORDER
                      </span>
                      <span className="text-[12px] font-bold text-[#0A1B2E]">Forward Step 1 (Completed)</span>
                    </div>
                    <p className="text-[12px] text-[#64748B]">
                      Order schema, customer KYC, and cryptographic idempotency key verified in 220ms.
                    </p>
                  </div>
                )}

                {activeDagNode === "forward-inventory" && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1]">
                        TASK: SIM_LOCK_ICCID
                      </span>
                      <span className="text-[12px] font-bold text-[#0A1B2E]">Parallel Branch A (Completed)</span>
                    </div>
                    <p className="text-[12px] text-[#64748B]">
                      Allocated physical SIM ICCID lock. Compensation tombstone prepared for auto-release.
                    </p>
                  </div>
                )}

                {activeDagNode === "forward-billing" && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1]">
                        TASK: OCS_INSTANTIATE_ACCOUNT
                      </span>
                      <span className="text-[12px] font-bold text-[#0A1B2E]">Parallel Branch B (Completed)</span>
                    </div>
                    <p className="text-[12px] text-[#64748B]">
                      Billing account created in pending allocation state. Inverse compensation registered with Temporal.
                    </p>
                  </div>
                )}

                {activeDagNode === "forward-network" && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1]">
                        TASK: HLR_PROVISION_SLICE
                      </span>
                      <span className="text-[12px] font-bold text-[#0A1B2E]">Step 3 (Completed Forward, Pending Rollback)</span>
                    </div>
                    <p className="text-[12px] text-[#64748B]">
                      Network slice provisioned successfully forward in 1.42s. Requires rollback due to Step 4 failure.
                    </p>
                  </div>
                )}

                {(activeDagNode === "rollback-inventory" || activeDagNode === "rollback-billing") && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#CBD5E1]">
                        COMPENSATION STATUS: STALLED
                      </span>
                      <span className="text-[12px] font-bold text-[#0A1B2E]">Linear Saga Cascade Invariant</span>
                    </div>
                    <p className="text-[12px] text-[#64748B]">
                      Under strict ACID saga ordering, upstream compensations cannot fire until the network slice deprovisioning is resolved or forced.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Root-Cause Explainer (3-Column Clean Card) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Cause */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-error font-headline-sm text-headline-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">bug_report</span>
                  <span>Root Cause</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  HLR Gateway timed out across 5 retry attempts (exponential backoff 1s→16s). Upstream cluster{" "}
                  <code className="font-label-sm text-label-sm bg-surface-container-high px-1 rounded">hlr-east-01</code> stopped responding to gRPC health checks.
                </p>
              </div>

              {/* Impact */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[#D97706] font-headline-sm text-headline-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
                  <span>Blast Radius</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  1 residual HLR profile lock active. Subscriber disconnected but IMSI{" "}
                  <span className="font-label-sm text-label-sm font-bold text-on-surface font-mono">310410•••••••••</span> is orphaned in core network. Zero customer billing leaks.
                </p>
              </div>

              {/* Recommended Action */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-primary font-headline-sm text-headline-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">tips_and_updates</span>
                  <span>Prescription</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Verify HLR cluster recovery via Network Admin Portal, or manually purge resource lock and click{" "}
                  <button
                    onClick={() => setShowManualModal(true)}
                    className="font-body-sm text-body-sm font-semibold text-primary hover:underline cursor-pointer"
                  >
                    &apos;Resolve Manually&apos;
                  </button>
                  .
                </p>
              </div>
            </div>

            {/* 5. Audit Trail & Incident Activity Log */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Incident Activity Log &amp; Audit Trail
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">4 events logged</span>
              </div>
              <div className="flex flex-col gap-2">
                {/* Item 1 */}
                <div className="flex items-start gap-3 text-body-sm font-body-sm">
                  <span className="font-label-sm text-label-sm text-[#000000] shrink-0 w-24 font-mono">15:36:21 UTC</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shrink-0">
                    System
                  </span>
                  <p className="text-on-surface">
                    Compensation step 5 failed with{" "}
                    <code className="font-label-sm text-label-sm text-error bg-error-container/40 px-1 rounded">
                      HLR_GATEWAY_TIMEOUT_504
                    </code>{" "}
                    after exponential backoff exhaustion.
                  </p>
                </div>
                {/* Item 2 */}
                <div className="flex items-start gap-3 text-body-sm font-body-sm">
                  <span className="font-label-sm text-label-sm text-[#000000] shrink-0 w-24 font-mono">15:36:22 UTC</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary-fixed/40 text-primary font-label-sm text-label-sm shrink-0">
                    Orchestrator
                  </span>
                  <p className="text-on-surface">
                    Circuit-breaker triggered. Transitioned order to{" "}
                    <span className="font-label-sm text-label-sm text-[#0A1B2E] font-bold font-mono">NEEDS_ATTENTION</span>,
                    pushed payload to Fallout Queue.
                  </p>
                </div>
                {/* Item 3 */}
                <div className="flex items-start gap-3 text-body-sm font-body-sm">
                  <span className="font-label-sm text-label-sm text-[#000000] shrink-0 w-24 font-mono">15:45:10 UTC</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shrink-0">
                    Monitoring
                  </span>
                  <p className="text-on-surface">
                    Paged On-Call NOC Orchestrator (<span className="font-medium">Aarav Sharma</span>) via Opsgenie schedule tier 1.
                  </p>
                </div>
                {/* Item 4 */}
                <div className="flex items-start gap-3 text-body-sm font-body-sm">
                  <span className="font-label-sm text-label-sm text-[#000000] shrink-0 w-24 font-mono">16:10:04 UTC</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1] font-label-sm text-label-sm shrink-0 font-mono">
                    SLA Monitor
                  </span>
                  <p className="text-on-surface">
                    <span className="text-[#0A1B2E] font-bold">Warning:</span> Approaching 1h SLA tier breach. 16 minutes remaining until customer escalation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM COLLAPSIBLE PREVIEW DRAWER (Empty State Preview) */}
      <section className="mt-2 mb-2">
        <details className="group bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 transition-all overflow-hidden">
          <summary className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-surface-container-low transition-colors list-none">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000000] group-open:rotate-180 transition-transform">
                expand_more
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Inspect Zero Fallout State Preview
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                Design System Reference
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-medium">Toggle view</span>
          </summary>
          {/* Drawer Content: Pristine Clean Zero State */}
          <div className="p-8 flex flex-col items-center justify-center text-center bg-surface-container-low/40">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-[#0A1B2E] mb-4 shadow-sm border border-[#CBD5E1]">
              <span
                className="material-symbols-outlined text-[36px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
              No fallout — all orders consistent
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-4">
              0 orders require operator intervention. All active provisioning workflows and saga compensations are operating smoothly.
            </p>
            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-white text-[#0A1B2E] font-semibold flex items-center gap-1.5 border border-[#CBD5E1] shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                100% Consistency Rate maintained
              </span>
              <span className="font-label-sm text-label-sm text-[#000000]">Temporal Cluster: 0 Halts</span>
            </div>
          </div>
        </details>
      </section>

      {/* Manual Resolution Modal Dialog */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1B2E]/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#CBD5E1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A1B2E]">handyman</span>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-[#0A1B2E]">
                  Manually Resolve Fallout Incident
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[#64748B] hover:text-[#0A1B2E] p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleManualResolveSubmit} className="mt-4 space-y-4">
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-3 rounded-lg text-[13px] text-[#0A1B2E]">
                <strong>Warning:</strong> Manual intervention bypasses automated saga rollback. Ensure upstream locks
                on <code className="font-mono font-semibold text-[#0A1B2E]">hlr-east-01</code> have been verified clean before proceeding.
              </div>

              <div>
                <label className="block font-label-sm text-label-sm font-medium text-[#0A1B2E] mb-1">
                  Incident / JIRA Ticket Reference *
                </label>
                <input
                  type="text"
                  required
                  value={resolutionTicket}
                  onChange={(e) => setResolutionTicket(e.target.value)}
                  placeholder="e.g. INC-94821 or NOC-4029"
                  className="w-full px-3 py-2 text-body-md border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1B2E] focus:border-[#0A1B2E] font-mono text-sm bg-white text-[#0A1B2E]"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm font-medium text-[#0A1B2E] mb-1">
                  Resolution Notes &amp; Verification Evidence *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Cleared orphaned profile lock on hlr-east-01 manually via vendor CLI. Billing ledger checked."
                  className="w-full px-3 py-2 text-body-md border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1B2E] focus:border-[#0A1B2E] text-sm bg-white text-[#0A1B2E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-body-md text-[#64748B] hover:text-[#0A1B2E] font-medium rounded-lg hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-body-md bg-[#0A1B2E] hover:bg-[#14263b] text-white font-medium rounded-lg shadow-xs transition-colors"
                >
                  Mark as Resolved &amp; Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
