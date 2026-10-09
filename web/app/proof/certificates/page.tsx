"use client";

import React, { useState } from "react";
import Link from "next/link";

interface HashChainEvent {
  step: string;
  name: string;
  desc: string;
  subsystem: string;
  time: string;
  hash: string;
}

const DEFAULT_CHAIN: HashChainEvent[] = [
  {
    step: "h₀",
    name: "OrderAccepted",
    desc: "input payload hash validated",
    subsystem: "OMS Core",
    time: "14:22:02.041",
    hash: "0x44ae…df77",
  },
  {
    step: "h₁",
    name: "InventoryReserved",
    desc: "SIM/eSIM inventory locked & MSISDN assigned",
    subsystem: "Inventory",
    time: "14:22:02.312",
    hash: "0x7c9b…e4a1",
  },
  {
    step: "h₂",
    name: "PortAllocated",
    desc: "Terminal ODF #14 splitter cross-connect matched",
    subsystem: "GIS / Access",
    time: "14:22:02.684",
    hash: "0x1174…8990",
  },
  {
    step: "h₃",
    name: "NetworkSliceCreated",
    desc: "IMSI mapped & QoS 5QI-9 profile bounded",
    subsystem: "HLR / HSS",
    time: "14:22:03.011",
    hash: "0x3a4b…114d",
  },
  {
    step: "h₄",
    name: "ProvisioningVerified",
    desc: "HLR/HSS slice acknowledgment 200 OK",
    subsystem: "HLR Gateway",
    time: "14:22:03.450",
    hash: "0x8f4a…3321",
  },
  {
    step: "h₅",
    name: "BillingAccountActive",
    desc: "Tariff instantiated strictly after activation",
    subsystem: "OCS Billing",
    time: "14:22:03.789",
    hash: "0x992c…9912",
  },
  {
    step: "h₆",
    name: "NotificationDispatched",
    desc: "Welcome SMS & self-care activation link sent",
    subsystem: "SMS-C Gateway",
    time: "14:22:04.004",
    hash: "0xb512…90aa",
  },
  {
    step: "h₇",
    name: "OrderTerminalActive",
    desc: "Final state locked ACTIVE, orchestration closed",
    subsystem: "OMS State",
    time: "14:22:04.182",
    hash: "0xd108…77ef",
  },
];

export default function CertificatesProofPage() {
  const [selectedOrder, setSelectedOrder] = useState("ORD-20260712-004212");
  const [isTampered, setIsTampered] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const commandStr = `make verify-cert id=${selectedOrder} --key=/etc/switchon/pub.pem`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(commandStr);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleVerifyNow = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (isTampered) {
        alert("VERIFICATION ERROR: Local hash chain evaluation does not yield signature state root. One or more events altered!");
      } else {
        alert("SUCCESS: Cryptographically Sound. Ed25519 signature and SHA-256 state root match consensus ledger.");
      }
    }, 600);
  };

  const handleDownloadJSON = () => {
    const certData = {
      serial: "CERT-20260712-4212-A89F",
      orderId: selectedOrder,
      timestamp: "2026-07-12T14:22:04.182Z",
      epoch: 1714521600,
      algorithm: "Ed25519-SHA256",
      keyId: "key_switchon_prod_us_east_2026_01",
      stateRoot: isTampered
        ? "0x33b1e90011a5e188204b7719f9d2a30b05e04ef441"
        : "0x9e1200fec4917a2283cb7810459c0211a5e188204b7719f9d2a30b05e04ef441",
      signature:
        "3045022100e47b319d88ab29c490fa8b417c80031a591244e8bc92a34891b6170d89283e0220671192e81190bc9312ab68192a019481239cba874139824c80345b1284a1e941",
      isTampered,
      guarantees: [
        "Terminal State Consistency",
        "Billing Linearizability",
        "Strict Idempotency",
        "Audit Immutability",
      ],
    };
    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CERT-${selectedOrder}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-12 space-y-6">
      {/* Top Sub-Navigation & Scope Bar */}
      <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <Link className="hover:text-primary transition-colors flex items-center gap-1" href="/proof">
              <span className="material-symbols-outlined text-[16px]">experiment</span>
              <span>Scenarios &amp; Proof</span>
            </Link>
            <span className="text-[#000000]">/</span>
            <span className="font-semibold text-on-surface">Certificates</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm flex items-center gap-1.5 border border-outline-variant/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Ed25519 Verified
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/20">
            Consensus Slot #842,910
          </span>
        </div>

        {/* Live Epoch & Status indicator */}
        <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-tertiary">schedule</span>
            <span>2026-07-12 14:22:04.182 UTC</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-label-sm font-mono">
            <span className="text-[#000000]">Epoch:</span>
            <span className="text-on-surface font-semibold">1714521600</span>
          </div>
        </div>
      </div>

      {/* Operational Context Bar */}
      <div className="bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Order Selector Dropdown & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified_user</span>
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <label className="sr-only" htmlFor="order-select">
                Select Order
              </label>
              <div className="flex items-center bg-surface-container-lowest rounded-lg px-3 py-1.5 shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-[#000000] text-[18px] mr-2 shrink-0">receipt_long</span>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
                  id="order-select"
                >
                  <option value="ORD-20260712-004212">ORD-20260712-004212 — Fiber Broadband 500 / Voice Add-on</option>
                  <option value="ORD-20260712-004189">ORD-20260712-004189 — 5G Standalone Ultra / eSIM</option>
                  <option value="ORD-20260711-003902">ORD-20260711-003902 — Multi-Gig Business DIA 2Gbps</option>
                </select>
                <span className="material-symbols-outlined text-[#000000] text-[16px] pointer-events-none ml-1">
                  expand_more
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">Merkle Proof Tier</span>
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">L1 Linearized</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleVerifyNow}
              disabled={isVerifying}
              className="h-9 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-1.5 font-body-sm text-body-sm font-medium shadow-sm"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] ${isVerifying ? "animate-spin" : ""}`}>
                {isVerifying ? "refresh" : "file_open"}
              </span>
              <span>{isVerifying ? "Verifying..." : "Verify Now"}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5 font-body-sm text-body-sm font-medium shadow-sm border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary">download</span>
              <span>Download JSON</span>
            </button>
            <button
              onClick={handleCopyCmd}
              className="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5 font-body-sm text-body-sm shadow-sm border border-outline-variant/30 group"
              title="Copy CLI Command"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
                terminal
              </span>
              <span className="font-label-sm text-label-sm hidden xl:inline font-mono">
                make verify-cert id={selectedOrder}
              </span>
              <span className="font-label-sm text-label-sm xl:hidden">Copy CLI</span>
              <span className="material-symbols-outlined text-[16px] text-[#000000] ml-1">
                {copiedCmd ? "done" : "content_copy"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Document Area */}
      <div className="flex flex-col items-center justify-center">
        {/* Central Verified Receipt Card */}
        <div className="w-full max-w-4xl bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 p-6 sm:p-10 flex flex-col gap-6 relative overflow-hidden">
          {/* Subtle Background Guilloche / Security Pattern Accents */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5 pointer-events-none blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-secondary-container/5 pointer-events-none blur-2xl"></div>

          {/* 1. Certificate Header Band */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between pb-4 gap-4 border-b border-outline-variant/20">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                  SwitchOn Cryptographic Trust Core
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Consistency Certificate
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Cryptographic Attestation of Linearizable Telecom State Commitment across Distributed Orchestration Nodes.
              </p>
              <div className="mt-2 flex items-center gap-2 font-label-sm text-label-sm">
                <span className="text-on-surface-variant">SERIAL:</span>
                <span className="font-semibold text-on-surface bg-surface-container-high px-2 py-0.5 rounded font-mono">
                  CERT-20260712-4212-A89F
                </span>
                <span className="text-[#000000]">•</span>
                <span className="text-on-surface-variant">NODE:</span>
                <span className="text-on-surface font-mono">us-east-core-tx09</span>
              </div>
            </div>

            {/* Verification Shield Badge */}
            <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
              <div
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm border ${
                  isTampered
                    ? "bg-error-container text-error border-error/30"
                    : "bg-secondary-container/10 text-secondary-container border-secondary-container/20"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isTampered ? "gpp_bad" : "verified"}
                </span>
                <span className="font-label-sm text-label-sm font-semibold tracking-wide">
                  {isTampered ? "Signature INVALID ✘" : "Signature valid ✔"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                <span className="text-[#000000]">Verdict:</span>
                <span className={`font-semibold ${isTampered ? "text-error" : "text-secondary-container"}`}>
                  {isTampered ? "INVALID_INTEGRITY_COMPROMISED" : "VERIFIED_SOUND"}
                </span>
              </div>
              <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                <span>Algorithm:</span>
                <span className="font-semibold text-on-surface font-mono">Ed25519 / SHA-256</span>
              </div>
            </div>
          </div>

          {/* 2. Tamper Interactive Simulator Banner */}
          <div
            className={`p-4 rounded-xl transition-colors duration-300 border ${
              isTampered
                ? "bg-error-container text-on-error-container border-error/30"
                : "bg-surface-container-low text-on-surface border-outline-variant/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isTampered ? "bg-error text-on-error" : "bg-surface-container-high text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isTampered ? "gpp_bad" : "tune"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm flex items-center gap-2 font-semibold">
                    Tamper Demo / Fault Simulation
                    <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                      Interactive Zero-Trust Proof
                    </span>
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {isTampered ? (
                      <span className="font-semibold text-error">
                        TAMPER DETECTED: Payload modified at h₃. Merkle chain broken. Signature validation failed!
                      </span>
                    ) : (
                      <span>
                        Current state: Pristine event log. Ledger root intact (
                        <span className="font-label-sm font-mono">0x9e1200...fec4</span>).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsTampered(!isTampered)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface font-body-sm text-body-sm font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border border-outline-variant/30"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary">warning</span>
                  <span>{isTampered ? "Reset to Pristine State" : "Mutate Event #3 (Simulate Tamper)"}</span>
                </button>
                {isTampered && (
                  <button
                    onClick={() => setIsTampered(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface text-body-sm font-body-sm transition-colors border border-outline-variant/30"
                    type="button"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Order Summary Grid (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/20">
            <div className="flex flex-col p-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Order Identifier
              </span>
              <span className="font-label-md text-label-md font-semibold text-on-surface mt-1 font-mono">
                {selectedOrder}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Sub-type: GPON-ONT-v2</span>
            </div>
            <div className="flex flex-col p-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Customer Identity
              </span>
              <span className="font-body-md text-body-md font-semibold text-on-surface mt-1">Marcus Vance</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-mono">+1 555 019-4821</span>
            </div>
            <div className="flex flex-col p-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Product &amp; Tier
              </span>
              <span className="font-body-md text-body-md font-semibold text-on-surface mt-1 truncate">
                Fiber Broadband 500
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">+ Static IPv4 (/32)</span>
            </div>
            <div className="flex flex-col p-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Execution Timing
              </span>
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface mt-1 font-mono">2.14s</span>
              <span className="font-label-sm text-label-sm text-secondary mt-0.5">8 Distributed Steps</span>
            </div>
          </div>

          {/* 4. What this attests vs What this does not prove */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attested Guarantees (Left) */}
            <div className="p-5 rounded-xl bg-surface-container-low flex flex-col gap-3 border border-outline-variant/20">
              <div className="flex items-center gap-2 text-secondary-container">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Attested Guarantees
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Mathematically enforceable under consensus quorum &amp; hash-chain verification:
              </p>
              <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0">done</span>
                  <div>
                    <strong className="font-semibold text-on-surface">Terminal State Consistency:</strong>
                    <span className="text-on-surface-variant"> No orphan resource locks exist across HLR/HSS, OMS, and OCS.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0">done</span>
                  <div>
                    <strong className="font-semibold text-on-surface">Billing Linearizability:</strong>
                    <span className="text-on-surface-variant"> Charging was instantiated strictly after network activation ACK.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0">done</span>
                  <div>
                    <strong className="font-semibold text-on-surface">Strict Idempotency:</strong>
                    <span className="text-on-surface-variant"> Execution idempotency key executed exactly once; duplicate calls rejected.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0">done</span>
                  <div>
                    <strong className="font-semibold text-on-surface">Audit Immutability:</strong>
                    <span className="text-on-surface-variant"> Event log is append-only with Merkle root anchored in consensus ledger.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Scope Boundaries (Right) */}
            <div className="p-5 rounded-xl bg-surface-container-high/40 flex flex-col gap-3 border border-outline-variant/20">
              <div className="flex items-center gap-2 text-[#000000]">
                <span className="material-symbols-outlined text-[20px]">remove_moderator</span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Out-of-Scope Proof Bounds
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Physical external bounds not captured within cryptographic software consensus:
              </p>
              <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#000000] mt-0.5 shrink-0">remove</span>
                  <span>Upstream physical fiber ONT hardware signal quality or photon optical attenuation (dBm).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#000000] mt-0.5 shrink-0">remove</span>
                  <span>End-user credit card authorization fraud checks conducted outside the telco billing gateway.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#000000] mt-0.5 shrink-0">remove</span>
                  <span>Out-of-band manual database modifications bypassing the Temporal orchestrator worker cluster.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 5. Merkle Hash Chain Sequence Visualization */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-2 border-b border-outline-variant/20">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Merkle Hash Chain Sequence (h₀ → h₇)
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Each block seals state hash of prior node with local activity transition digest.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-lg border border-outline-variant/30">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Ledger Root:</span>
                <span
                  className={`font-label-sm text-label-sm font-semibold font-mono ${
                    isTampered ? "text-error" : "text-primary"
                  }`}
                >
                  {isTampered ? "0x33b1e9…0011 (MISMATCH)" : "0x9e1200…fec4"}
                </span>
              </div>
            </div>

            {/* Sequential Event Chain */}
            <div className="relative pl-6 sm:pl-8 flex flex-col gap-3 py-2">
              <div className="absolute left-3 sm:left-4 top-4 bottom-4 w-0.5 bg-primary/20 -translate-x-1/2"></div>

              {DEFAULT_CHAIN.map((evt, idx) => {
                const isEvent3 = idx === 3;
                const mutated = isEvent3 && isTampered;

                return (
                  <div
                    key={evt.step}
                    className={`relative flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg transition-all gap-2 border ${
                      mutated
                        ? "bg-[#FEF2F2] border-[#ED2C2C]"
                        : "bg-white hover:bg-[#F0FDF4]/40 border-[#22C55E]/70 shadow-2xs"
                    }`}
                  >
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full ring-4 ring-white transition-colors ${
                        mutated ? "bg-[#ED2C2C]" : "bg-[#22C55E]"
                      }`}
                    ></div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded font-mono ${
                          mutated ? "text-[#ED2C2C] bg-[#FEF2F2] border border-[#ED2C2C]" : "text-[#22C55E] bg-[#F0FDF4] border border-[#22C55E]"
                        }`}
                      >
                        {evt.step}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                          {mutated ? (
                            <>
                              NetworkSliceCreated{" "}
                              <span className="text-error font-mono text-xs">(MUTATED: IMSI=310410099999999)</span>
                            </>
                          ) : (
                            evt.name
                          )}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {mutated ? "Invalid bit flipped in payload. Hash mismatch!" : evt.desc}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm ${
                          idx === 7
                            ? "bg-secondary-fixed text-on-secondary-fixed"
                            : "bg-surface-container-highest text-tertiary"
                        }`}
                      >
                        {evt.subsystem}
                      </span>
                      <span className="font-label-sm text-label-sm text-[#000000] font-mono">{evt.time}</span>
                      <span
                        className={`font-label-sm text-label-sm font-mono ${
                          mutated ? "text-error font-bold" : "text-on-surface"
                        }`}
                      >
                        {mutated ? "0xFA11…BAD0 (Calculated)" : evt.hash}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. System State Digest Table */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">System State Digest</h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Target Topology: 4 Subsystems</span>
            </div>
            <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
              <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-3 px-4 font-semibold">Subsystem</th>
                    <th className="py-3 px-4 font-semibold">Target Resource</th>
                    <th className="py-3 px-4 font-semibold">Verified State</th>
                    <th className="py-3 px-4 font-semibold">Invariant Reference</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      OMS Core
                    </td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-on-surface font-mono">{selectedOrder}</td>
                    <td className="py-3 px-4 text-on-surface">Order Completed (ACTIVE)</td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-primary font-mono">INV-1 (State Parity)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span> Verified
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      SIM / Inventory
                    </td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-on-surface font-mono">
                      IMSI 310410091842001
                    </td>
                    <td className="py-3 px-4 text-on-surface">Allocated &amp; Bound</td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-primary font-mono">INV-3 (Zero Orphan)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span> Verified
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      HLR / HSS Gateway
                    </td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-on-surface font-mono">Profile MSISDN-4821</td>
                    <td className="py-3 px-4 text-on-surface">Active Slice Provisioned</td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-primary font-mono">INV-2 (Account Tied)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span> Verified
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      OCS Billing
                    </td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-on-surface font-mono">Acc 88201-FIBER</td>
                    <td className="py-3 px-4 text-on-surface">Tariff Charging Engaged</td>
                    <td className="py-3 px-4 font-label-sm text-label-sm text-primary font-mono">INV-5 (Linearized)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span> Verified
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. Formal Cryptographic Signature Block */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Formal Cryptographic Signature Block
              </span>
              <span className="font-label-sm text-label-sm text-tertiary">RFC 8032 Compliant</span>
            </div>
            <div className="p-5 rounded-lg bg-surface-container-low font-label-sm text-label-sm flex flex-col gap-3 text-on-surface select-all border border-outline-variant/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-on-surface-variant">Key Scheme:</span>
                  <span className="font-semibold text-on-surface ml-1 font-mono">Ed25519-SHA256 (PureEdDSA)</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Signer Key ID:</span>
                  <span className="font-semibold text-on-surface ml-1 font-mono">
                    key_switchon_prod_us_east_2026_01
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">SHA-256 State Root:</span>
                <div className="p-2 rounded bg-surface-container-lowest text-primary font-mono text-[11px] break-all border border-outline-variant/20">
                  {isTampered
                    ? "0x33b1e90011a5e188204b7719f9d2a30b05e04ef441"
                    : "0x9e1200fec4917a2283cb7810459c0211a5e188204b7719f9d2a30b05e04ef441"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">Ed25519 Signature Hex:</span>
                <div
                  className={`p-2 rounded bg-surface-container-lowest text-on-surface font-mono text-[11px] break-all border border-outline-variant/20 ${
                    isTampered ? "line-through opacity-60 text-error" : ""
                  }`}
                >
                  3045022100e47b319d88ab29c490fa8b417c80031a591244e8bc92a34891b6170d89283e0220671192e81190bc9312ab68192a019481239cba874139824c80345b1284a1e941
                </div>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-on-surface-variant">Offline Verification CLI:</span>
                <div className="p-2 rounded bg-surface-container-highest text-on-surface flex items-center justify-between border border-outline-variant/20">
                  <span className="font-mono text-[11px]">{commandStr}</span>
                  <button
                    onClick={handleCopyCmd}
                    className="text-primary hover:text-primary-container p-1 rounded transition-colors"
                    title="Copy Command"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedCmd ? "done" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Footer Note & Seal */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[#000000] font-label-sm text-label-sm gap-2 border-t border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Anchored to SwitchOn Quorum Multi-Party Consensus Network</span>
            </div>
            <div>
              <span>Certificate Token: </span>
              <span className="font-mono text-on-surface-variant">SHA256:d891...02fa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
