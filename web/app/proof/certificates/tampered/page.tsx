"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function TamperedCertificatePage() {
  const selectedOrder = "ORD-20260712-004212";
  const [copiedCLI, setCopiedCLI] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showHexDiff, setShowHexDiff] = useState(false);

  const copyCLICommand = () => {
    navigator.clipboard.writeText(`make verify-cert id=${selectedOrder}`);
    setCopiedCLI(true);
    setTimeout(() => setCopiedCLI(false), 2000);
  };

  const handleVerifyAgain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      alert("Verification FAILED (Exit Code 1): Hash mismatch at event #14 (NetworkSliceCreated). Computed hash 0x7c9b…e4a1 != recorded 0xDEAD…BEEF.");
    }, 600);
  };

  const downloadTamperReport = () => {
    const report = {
      auditType: "CRYPTOGRAPHIC_TAMPER_FORENSICS",
      timestamp: "2026-07-12T14:22:04.182Z",
      orderId: selectedOrder,
      certificateSerial: "CERT-20260712-4212-A89F",
      tamperLocation: {
        eventSequence: 14,
        nodeIndex: "h3",
        eventType: "NetworkSliceCreated",
        fieldAltered: "bandwidth_mbps",
        originalValue: 500,
        mutatedValue: 1000,
        unauthorizedImpact: "Unauthorized upgrade from Fiber 500 to Fiber 1000",
      },
      cryptographicFailure: {
        expectedDigest: "0x3a4b918f0c2e114d",
        computedDigest: "0xfa9144d189ca001c",
        consensusStatus: "ATTESTATION_COMPROMISED",
        verdict: "INVALID_INTEGRITY_COMPROMISED",
      },
      downstreamActions: [
        "Locked downstream network orchestration gates",
        "Severed Merkle chain cascades h4 through h7",
        "Alerted NOC Operations Center",
      ],
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TAMPER-REPORT-${selectedOrder}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-12 space-y-6">
      {/* Subtab Bar & Operational Context Header */}
      <div className="px-4 pt-4 pb-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-4">
        {/* Breadcrumb-style Context Sub-navigation */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="/proof"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Proof Matrix</span>
            </Link>
            <div className="flex items-center gap-1.5 font-headline-sm text-headline-sm text-primary border-b-2 border-primary pb-1 -mb-[13px]">
              <span className="material-symbols-outlined text-[20px] text-error">gpp_bad</span>
              <span>Certificates</span>
              <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm uppercase font-semibold">
                1 Invalid
              </span>
            </div>
            <Link
              className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="/proof/ab"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Audit Snapshots</span>
            </Link>
            <Link
              className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="/proof/certificates"
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              <span>CLI Test Vectors</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 bg-error-container/40 px-3 py-1 rounded-full text-on-error-container font-label-sm text-label-sm font-semibold border border-error/20">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span>ATTESTATION COMPROMISED</span>
          </div>
        </div>

        {/* Active Operational Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Order Selector */}
            <div className="flex items-center bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mr-2">
                Target Order:
              </span>
              <div className="flex items-center gap-1 font-label-md text-label-md font-semibold text-error font-mono">
                <span>{selectedOrder}</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-pointer hover:text-on-surface">
                  expand_more
                </span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                <span className="text-on-surface font-semibold">2026-07-12 14:22:04.182 UTC</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-outline">Epoch:</span>
                <span className="bg-surface-container px-1.5 py-0.5 rounded text-on-surface font-label-sm">
                  1714521600
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadTamperReport}
              className="h-9 px-4 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md font-semibold flex items-center gap-1.5 shadow-sm border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download Tamper Report</span>
            </button>
            <button
              onClick={handleVerifyAgain}
              disabled={isVerifying}
              className="h-9 px-4 rounded-lg bg-error text-on-error hover:opacity-95 transition-all font-body-md text-body-md font-semibold flex items-center gap-1.5 shadow-sm"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] ${isVerifying ? "animate-spin" : ""}`}>
                replay
              </span>
              <span>{isVerifying ? "Verifying..." : "Verify Again"}</span>
            </button>
            {/* Command Snippet */}
            <div className="hidden xl:flex items-center bg-inverse-surface text-inverse-on-surface px-3 py-1.5 rounded-lg font-label-sm text-label-sm select-all font-mono">
              <span className="text-tertiary-fixed-dim mr-2">$</span>
              <span>make verify-cert id={selectedOrder}</span>
              <span
                className="material-symbols-outlined text-[14px] ml-2 text-outline cursor-pointer hover:text-white"
                onClick={copyCLICommand}
                title="Copy Command"
              >
                {copiedCLI ? "done" : "content_copy"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Document Ground Canvas */}
      <div className="flex flex-col items-center justify-center">
        {/* Centered Verified Receipt Document Container */}
        <div className="w-full max-w-5xl bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 p-6 md:p-10 mb-8 flex flex-col gap-6">
          {/* 1. Prominent Tampered Failure Alert Banner */}
          <div className="bg-error-container/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-error/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-error flex items-center justify-center shrink-0 text-white">
                <span className="material-symbols-outlined text-[24px]">gpp_bad</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-headline-sm text-headline-sm text-error font-semibold">
                  <span>Verification FAILED — Hash mismatch at event #14 (NetworkSliceCreated)</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Computed hash{" "}
                  <code className="font-label-sm text-label-sm font-semibold text-error bg-surface-container-lowest px-1 rounded font-mono">
                    0x7c9b…e4a1
                  </code>{" "}
                  does not match recorded state digest{" "}
                  <code className="font-label-sm text-label-sm font-semibold text-on-surface bg-surface-container-lowest px-1 rounded font-mono">
                    0xDEAD…BEEF
                  </code>
                  . Cryptographic proof broke linearizability guarantees.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => setShowHexDiff(!showHexDiff)}
                className="h-8 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container transition-colors shadow-sm flex items-center gap-1 border border-outline-variant/30"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">difference</span>
                <span>{showHexDiff ? "Hide Diff" : "Inspect Diff"}</span>
              </button>
              <Link
                href="/proof/certificates"
                className="h-8 px-3 rounded-lg bg-primary-container text-on-primary font-body-sm text-body-sm font-medium hover:opacity-90 transition-colors shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">restore</span>
                <span>Restore Original Log</span>
              </Link>
            </div>
          </div>

          {/* Hex Diff Expandable Box */}
          {showHexDiff && (
            <div className="p-4 rounded-xl bg-inverse-surface text-inverse-on-surface font-mono text-xs space-y-1.5 animate-in fade-in">
              <div className="text-outline text-[11px] pb-1 border-b border-outline/30 flex justify-between">
                <span>PAYLOAD BYTE-LEVEL DIFF INSPECTION</span>
                <span className="text-error font-bold">1 CORRUPTED BLOCK</span>
              </div>
              <div className="text-secondary-fixed-dim">--- expected/h3_payload.json</div>
              <div className="text-secondary-fixed-dim">+++ actual/h3_payload.json</div>
              <div className="text-outline">@@ -14,3 +14,3 @@</div>
              <div className="text-[#10B981]">- &quot;bandwidth_mbps&quot;: 500,</div>
              <div className="text-error font-bold">+ &quot;bandwidth_mbps&quot;: 1000, [UNAUTHORIZED UPGRADE INJECTED]</div>
              <div className="text-outline">  &quot;slice_id&quot;: &quot;slice-fiber-us-east-01&quot;,</div>
            </div>
          )}

          {/* 2. Certificate Header Band */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-surface-container-high">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold text-outline">
                  Tampered Receipt
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold border border-error/20">
                  REJECTED
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface mt-1 font-semibold">
                Consistency Certificate
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Cryptographic Attestation of Linearizable Telecom State Commitment
              </p>
              <div className="mt-2 font-label-sm text-label-sm text-error flex items-center gap-1 font-semibold font-mono">
                <span className="material-symbols-outlined text-[16px]">link_off</span>
                <span>CERT-20260712-4212-A89F (CORRUPTED)</span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1.5 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error text-on-error font-label-sm text-label-sm font-semibold shadow-xs">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Signature INVALID ✖</span>
              </div>
              <div className="flex items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
                <span>
                  Status: <strong className="text-error uppercase">TAMPER_DETECTED</strong>
                </span>
                <span>
                  Scheme: <strong className="text-on-surface font-mono">Ed25519 / SHA-256</strong>
                </span>
              </div>
              <div className="font-label-sm text-label-sm text-outline">RFC 6962 Auditable Merkle Log Tree</div>
            </div>
          </div>

          {/* 3. Tamper Simulation Controls Panel */}
          <div className="bg-surface-container-high/60 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-outline-variant/30">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">science</span>
              <div>
                <div className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 font-semibold">
                  <span>SIMULATION ACTIVE</span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-semibold">
                    Fault Injection Demo
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Byte #42 in Event #14 payload was altered from{" "}
                  <code className="font-label-sm text-label-sm text-on-surface bg-surface-container-lowest px-1 rounded font-mono">
                    &quot;bandwidth_mbps&quot;: 500
                  </code>{" "}
                  to{" "}
                  <code className="font-label-sm text-label-sm font-bold text-error bg-error-container px-1 rounded font-mono">
                    &quot;bandwidth_mbps&quot;: 1000
                  </code>
                  .
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowHexDiff(!showHexDiff)}
                className="h-8 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1 border border-outline-variant/30"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">data_object</span>
                <span>View Hex Diff</span>
              </button>
              <Link
                href="/proof/certificates"
                className="h-8 px-3 rounded-lg bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold hover:opacity-90 transition-colors shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                <span>Restore Pristine Log</span>
              </Link>
            </div>
          </div>

          {/* 4. Order Summary Grid (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Order ID
              </span>
              <div className="font-label-md text-label-md font-bold text-on-surface mt-1 flex items-center gap-1 font-mono">
                <span>{selectedOrder}</span>
                <span className="text-error" title="Tamper flag raised">
                  *
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-error mt-0.5 font-medium">Payload mismatch</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Customer Target
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-1 font-semibold">Marcus Vance</span>
              <span className="font-label-sm text-label-sm text-outline mt-0.5 font-mono">+1 555 019-4821</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Product / Plan
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-body-md text-body-md line-through text-outline">Fiber 500</span>
                <span className="material-symbols-outlined text-[14px] text-error">arrow_forward</span>
                <span className="font-body-md text-body-md font-semibold text-error">Fiber 1000</span>
              </div>
              <span className="font-label-sm text-label-sm text-error mt-0.5 font-medium">Unauthorized upgrade</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Execution Profile
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-1 font-semibold font-mono">
                2.14s Duration
              </span>
              <span className="font-label-sm text-label-sm text-error font-medium mt-0.5">
                Verification rejected in 12ms
              </span>
            </div>
          </div>

          {/* 5. 'What this attests' vs 'What this does not prove' (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Attested Guarantees (Compromised) */}
            <div className="bg-error-container/20 rounded-xl p-4 flex flex-col justify-between border border-error/20">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-error/20 mb-3">
                  <span className="font-headline-sm text-headline-sm text-error flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Attested Guarantees</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold border border-error/30">
                    FAILED INTEGRITY
                  </span>
                </div>
                <ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-error shrink-0">cancel</span>
                    <span>
                      <strong>Strict Linearizability:</strong> Sequence broke at transition h₂ → h₃. Replay rejected by consensus nodes.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-error shrink-0">cancel</span>
                    <span>
                      <strong>Payload Immutability:</strong> SHA-256 state commitment invalidated for provisioned bandwidth resource.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-error shrink-0">cancel</span>
                    <span>
                      <strong>Hardware Enclave Attestation:</strong> TPM 2.0 quote root rejects intermediate node signature.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-2 border-t border-error/15 text-error font-label-sm text-label-sm font-medium">
                ⚠ Downstream network orchestration gates are locked to prevent illegal resource reservation.
              </div>
            </div>

            {/* Right Column: Boundaries & Scope */}
            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between border border-outline-variant/20">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest mb-3">
                  <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span>What this does not prove</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                    Scope Boundary
                  </span>
                </div>
                <ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-outline shrink-0">remove_circle_outline</span>
                    <span>Physical optical fiber continuity at street cabinet (L1 loop verified independently via OTDR telemetry).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-outline shrink-0">remove_circle_outline</span>
                    <span>Third-party credit score legitimacy at payment gateway ingestion time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-outline shrink-0">remove_circle_outline</span>
                    <span>End-user CPE device operational power at subscriber residence.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-container-highest text-outline font-label-sm text-label-sm">
                Operational boundary governed under Section 4.2 of Telco State Proofing Protocol.
              </div>
            </div>
          </div>

          {/* 6. Hash-Chain Visualization with CORRUPTED BROKEN LINK */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Merkle Hash Chain Sequence (h₀ → h₇)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold border border-error/30">
                  BREAK DETECTED AT h₃
                </span>
              </div>
              <div className="flex items-center gap-4 font-label-sm text-label-sm">
                <span className="flex items-center gap-1 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span> Valid Chain
                </span>
                <span className="flex items-center gap-1 text-error">
                  <span className="w-2 h-2 rounded-full bg-error"></span> Tampered Node
                </span>
                <span className="flex items-center gap-1 text-outline">
                  <span className="w-2 h-2 rounded-full bg-outline"></span> Cascading Invalidation
                </span>
              </div>
            </div>

            <div className="relative flex flex-col gap-3">
              {/* Event #0 */}
              <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center font-label-sm text-label-sm font-semibold">
                    0
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                    <span className="font-body-md text-body-md font-semibold text-on-surface">OrderSubmitted</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">h₀: 0x8a12…90de</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">t + 0ms</span>
              </div>

              {/* Event #1 */}
              <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center font-label-sm text-label-sm font-semibold">
                    1
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                    <span className="font-body-md text-body-md font-semibold text-on-surface">InventoryReserved</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">h₁: 0x22f1…aa4c</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">t + 180ms</span>
              </div>

              {/* Event #2 */}
              <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center font-label-sm text-label-sm font-semibold">
                    2
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                    <span className="font-body-md text-body-md font-semibold text-on-surface">BillingProfileValidated</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">h₂: 0x6e90…21b7</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">t + 395ms</span>
              </div>

              {/* BROKEN LINK BREAK INDICATOR */}
              <div className="my-1 flex items-center justify-center gap-4 py-1.5 bg-error-container/20 rounded-lg border border-error/20">
                <div className="h-0.5 flex-1 bg-error/30"></div>
                <div className="flex items-center gap-1.5 text-error font-label-sm text-label-sm font-semibold px-3 py-1 rounded bg-surface-container-lowest shadow-sm border border-error/20">
                  <span className="material-symbols-outlined text-[16px] text-error animate-bounce">bolt</span>
                  <span>CRYPTOGRAPHIC LINK SEVERED (SHA256(h₂ || e₃) != h₃_recorded)</span>
                </div>
                <div className="h-0.5 flex-1 bg-error/30"></div>
              </div>

              {/* Event #3 (h₃: NetworkSliceCreated - TAMPERED) */}
              <div className="bg-error-container/30 rounded-xl p-4 shadow-sm border border-error/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-error/20">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center font-label-sm text-label-sm font-bold">
                      3
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-error">gpp_bad</span>
                      <span className="font-headline-sm text-headline-sm text-error font-semibold">
                        h₃: NetworkSliceCreated (Event #14)
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm font-semibold self-start md:self-auto">
                    TAMPERED / MISMATCH
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Expected Recorded Hash:</span>
                    <code className="font-label-sm text-label-sm font-semibold text-secondary bg-surface-container-lowest p-1.5 rounded mt-1 font-mono border border-outline-variant/20">
                      0x3a4b918f0c2e114d
                    </code>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Actual Computed Hash:</span>
                    <code className="font-label-sm text-label-sm font-semibold text-error bg-surface-container-lowest p-1.5 rounded mt-1 font-mono border border-error/30">
                      0xfa9144d189ca001c
                    </code>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Payload Mutation Diff:</span>
                    <div className="bg-surface-container-lowest p-1.5 rounded mt-1 font-label-sm text-label-sm flex items-center gap-1 font-mono border border-outline-variant/20">
                      <span className="text-on-surface-variant line-through">{JSON.stringify({ bw: 500 })}</span>
                      <span className="text-error font-bold">→</span>
                      <span className="text-error font-bold bg-error-container/50 px-1 rounded">
                        {JSON.stringify({ bw: 1000 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Downstream Events #4 through #7 (Cascading Rejections) */}
              <div className="flex flex-col gap-2 opacity-60">
                {/* Event #4 */}
                <div className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-sm text-label-sm">
                      4
                    </span>
                    <div className="flex items-center gap-2 text-outline">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span className="font-body-md text-body-md line-through">CpeConfigurationPushed</span>
                      <span className="font-label-sm text-label-sm font-mono">h₄: [INVALIDATED PARENT ROOT]</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                    CASCADING REJECTION
                  </span>
                </div>
                {/* Event #5 */}
                <div className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-sm text-label-sm">
                      5
                    </span>
                    <div className="flex items-center gap-2 text-outline">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span className="font-body-md text-body-md line-through">RadiusProfileActivated</span>
                      <span className="font-label-sm text-label-sm font-mono">h₅: [INVALIDATED PARENT ROOT]</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                    CASCADING REJECTION
                  </span>
                </div>
                {/* Event #6 */}
                <div className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-sm text-label-sm">
                      6
                    </span>
                    <div className="flex items-center gap-2 text-outline">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span className="font-body-md text-body-md line-through">TelemetryBaselineSampled</span>
                      <span className="font-label-sm text-label-sm font-mono">h₆: [INVALIDATED PARENT ROOT]</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                    CASCADING REJECTION
                  </span>
                </div>
                {/* Event #7 */}
                <div className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-sm text-label-sm">
                      7
                    </span>
                    <div className="flex items-center gap-2 text-outline">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span className="font-body-md text-body-md line-through">OrderFinalized</span>
                      <span className="font-label-sm text-label-sm font-mono">h₇: [REJECTED ROOT DIGEST]</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                    UNTRUSTED STATE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. 'System State Digest' Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Subsystem State Digest Matrix
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Invariant Assertions: 4 Evaluated, 2 Violated
              </span>
            </div>
            <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm border border-outline-variant/30">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-3 px-4 font-semibold">Subsystem</th>
                    <th className="py-3 px-4 font-semibold">Target Resource</th>
                    <th className="py-3 px-4 font-semibold">Verified State</th>
                    <th className="py-3 px-4 font-semibold">Invariant Reference</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
                  <tr className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-4 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">layers</span>
                      <span>OMS Core</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-outline">order.service_spec</td>
                    <td className="py-3 px-4 text-on-surface">Plan: fiber_broadband_500</td>
                    <td className="py-3 px-4 text-outline font-mono">INV-01 (CatalogMatch)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                        <span>✔</span> Intact
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-4 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">sim_card</span>
                      <span>SIM Inventory</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-outline">inv.resource_lock</td>
                    <td className="py-3 px-4 text-on-surface">ONT-ID #4412-A LOCKED</td>
                    <td className="py-3 px-4 text-outline font-mono">INV-03 (SingleTenancy)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                        <span>✔</span> Intact
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-error-container/20">
                    <td className="py-3 px-4 font-semibold text-error flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-error">router</span>
                      <span>HLR / HSS Gateway</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-error font-medium">net.slice.bandwidth</td>
                    <td className="py-3 px-4 text-error font-medium">Mutated: 1000 Mbps</td>
                    <td className="py-3 px-4 text-error font-mono">INV-02 (PlanTierConstraint)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                        <span>✖</span> VIOLATED
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-error-container/10">
                    <td className="py-3 px-4 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-outline">account_balance_wallet</span>
                      <span>OCS Billing</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-outline">ledger.charge_basis</td>
                    <td className="py-3 px-4 text-on-surface-variant">Ledger sync revoked</td>
                    <td className="py-3 px-4 text-outline font-mono">INV-05 (DownstreamProof)</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                        <span>✖</span> UNTRUSTED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. Cryptographic Signature Block (Tampered State) */}
          <div className="bg-error-container/20 rounded-xl p-4 font-label-sm text-label-sm text-on-surface border border-error/30">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-error/20 mb-3">
              <div className="flex items-center gap-2 text-error font-semibold">
                <span className="material-symbols-outlined text-[18px]">key_off</span>
                <span>Cryptographic Attestation Digest Block</span>
              </div>
              <span className="text-outline uppercase font-mono">Spec: RFC 8032 / Edwards-curve Digital Signature</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-body-sm mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-outline">Attestation Key Scheme:</span>
                <span className="text-on-surface font-semibold">Ed25519-SHA256 (Enclave Key #PK-CORE-US-EAST)</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-outline">Root Merkle Hash Attestation:</span>
                <span className="text-error font-semibold">REJECTED (0x9e1200…fec4 != 0xbc4412…9012)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-outline font-mono">Signature Envelope (Hex):</span>
              <div className="bg-surface-container-lowest p-3 rounded-lg text-error break-all select-all font-mono border border-error/20">
                3045022100e19a84b0f9c2d61a29384729103847a98b7c6d5e4f3a2b1c0d9e8f7a6b5c4d0220394857201938472910293847a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0
                [INVALID_SIGNATURE_DIGEST_CORRUPTED]
              </div>
            </div>

            {/* Terminal Verification CLI Snippet */}
            <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-lg flex flex-col gap-1 font-mono text-xs">
              <div className="flex items-center justify-between text-outline text-[11px] pb-1 border-b border-outline/20">
                <span>TERMINAL VERIFICATION OUTPUT</span>
                <span className="text-error font-bold">EXIT CODE: 1</span>
              </div>
              <div className="text-surface-dim pt-1">$ switchon-proof verify --cert CERT-20260712-4212-A89F</div>
              <div className="text-surface-dim">&gt; Fetching event log h₀..h₇ for ORD-20260712-004212... OK (8 events)</div>
              <div className="text-surface-dim">&gt; Traversing Merkle hash sequence...</div>
              <div className="text-secondary-fixed-dim">&gt; Node 0 (OrderSubmitted) matches digest 0x8a12... OK</div>
              <div className="text-secondary-fixed-dim">&gt; Node 1 (InventoryReserved) matches digest 0x22f1... OK</div>
              <div className="text-secondary-fixed-dim">&gt; Node 2 (BillingProfileValidated) matches digest 0x6e90... OK</div>
              <div className="text-error font-bold">&gt; FAIL: Node 3 (NetworkSliceCreated) payload digest mismatch!</div>
              <div className="text-error">&gt; Expected: 0x3a4b918f0c2e114d | Computed: 0xfa9144d189ca001c</div>
              <div className="text-error font-bold">&gt; FATAL: Linearizability guarantee collapsed at sequence #14. Aborting proof chain.</div>
            </div>
          </div>

          {/* Footer Attestation Details */}
          <div className="pt-4 border-t border-surface-container-high flex flex-wrap items-center justify-between text-on-surface-variant font-label-sm text-label-sm gap-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">verified</span>
              <span>SwitchOn Temporal Verification Engine v1.24.1-rc</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Authority: US-EAST-CORE-HSM-01</span>
              <span>Security Level: EAL4+ Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
