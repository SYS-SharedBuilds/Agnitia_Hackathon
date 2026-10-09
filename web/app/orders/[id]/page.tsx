"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Order, OrderEvent, TaskRecord } from "@/lib/types";
import { OrderDagCanvas } from "@/components/ui/OrderDagCanvas";

export default function OrderDetailPage() {
  const { id } = useParams();
  const orderId = (typeof id === "string" ? id : Array.isArray(id) ? id[0] : "") || "ORD-20260712-004217";

  const [order, setOrder] = useState<Order | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("deprovision_network");
  const [certificateData, setCertificateData] = useState<{
    order_id: string;
    body: {
      order_id: string;
      outcome: string;
      catalog_version: number;
      events_digest: string;
      system_state: Record<string, unknown>;
      invariants: { id: string; result: string; detail: string }[];
    };
    signature: string;
    key_id: string;
    issued_at: string;
    public_key_pem: string;
  } | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"timeline" | "task" | "cert">("task");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeq, setCurrentSeq] = useState(31);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkAudit, setNetworkAudit] = useState<unknown>(null);
  const [resolutionNotes, setResolutionNotes] = useState(
    "Verified HLR profile 310410••••••••• deprovisioned via manual HSS command hssctl-east purge-sub --imsi 31041000004821. Resource lock released. Ticket NOC-41908."
  );
  const [verifiedCheckbox, setVerifiedCheckbox] = useState(true);

  const [isResolved, setIsResolved] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dagZoom, setDagZoom] = useState(1);
  const [dagGrid, setDagGrid] = useState(true);
  const [dagMinimap, setDagMinimap] = useState(true);

  const handleZoomIn = () => setDagZoom((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setDagZoom((z) => Math.max(0.5, Math.round((z - 0.15) * 100) / 100));
  const handleZoomReset = () => setDagZoom(1);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchDetail = useCallback(async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [dRes, eRes, cRes] = await Promise.all([
        fetch(`${apiHost}/orders/${orderId}`),
        fetch(`${apiHost}/orders/${orderId}/events`),
        fetch(`${apiHost}/orders/${orderId}/certificate`),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setOrder(d.order);
        setTasks(d.tasks || []);
        if (d.order && (d.order.state === "ROLLED_BACK" || d.order.state === "ACTIVE")) {
          setIsResolved(true);
        }
      }
      if (eRes.ok) {
        setEvents(await eRes.json());
      }
      if (cRes.ok) {
        setCertificateData(await cRes.json());
      }
    } catch {
      // Backend not running, using mock state
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 3000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleManualResolve = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiHost}/orders/${orderId}/resolve?note=${encodeURIComponent(resolutionNotes)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        console.warn("Backend resolution returned non-200:", res.status);
      }
    } catch (e) {
      console.warn("Backend unavailable, applying local operator override:", e);
    }
    setIsResolved(true);
    setIsModalOpen(false);
    showToast("Manual resolution confirmed: Order state transitioned to ROLLED_BACK. Residual resource locks released.");
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            state: "ROLLED_BACK",
            failure_reason: `Manually resolved: ${resolutionNotes}`,
          }
        : null
    );
    fetchDetail();
  };

  const handleRetryCompensation = async () => {
    setIsRetrying(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiHost}/orders/${orderId}/retry-compensation`, { method: "POST" });
    } catch (e) {
      console.warn("Backend unavailable for retry compensation:", e);
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
        showToast("Compensation retry triggered for Deprovision Network (hlr-worker-east).");
        fetchDetail();
      }, 800);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* SUCCESS / ACTION TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A1B2E] text-white px-5 py-3 rounded-xl shadow-xl border border-[#1E293B] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-[20px] text-white">check_circle</span>
          <span className="font-body-sm text-body-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white p-0.5 ml-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* STICKY INTERVENTION BANNER (Hidden once resolved) */}
      {!isResolved && (order ? order.state === "NEEDS_ATTENTION" : true) && (
        <div className="sticky top-14 z-30 bg-white border-2 border-[#0A1B2E] rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A1B2E] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Manual intervention required</span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#0A1B2E] text-white font-mono font-semibold">
                  5 RETRIES EXHAUSTED
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#475569] mt-0.5">
                Network deprovision failed after 5 attempts (<code className="font-mono font-semibold text-[#0A1B2E]">HLR_GATEWAY_TIMEOUT_504</code>). Saga rollback halted; downstream compensation steps are stalled.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={async () => {
                setIsNetworkModalOpen(true);
                setNetworkLoading(true);
                try {
                  const res = await fetch("http://localhost:8103/admin/audit/resources");
                  if (res.ok) {
                    setNetworkAudit(await res.json());
                  } else {
                    setNetworkAudit({ status: "HLR_GATEWAY_TIMEOUT_504", error: "Connection to upstream HLR slice timed out after 5000ms" });
                  }
                } catch {
                  setNetworkAudit({ status: "HLR_GATEWAY_TIMEOUT_504", error: "Mock network service (port 8103) unreachable or halted" });
                } finally {
                  setNetworkLoading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 text-label-md text-label-md text-[#0A1B2E] hover:text-[#0A1B2E] px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] transition-colors font-medium shadow-2xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">cell_tower</span>
              <span>Open Network System</span>
              <span className="material-symbols-outlined text-[14px]">north_east</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-label-md text-label-md text-[#0A1B2E] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">build_circle</span>
              <span>Resolve Manually…</span>
            </button>
            <button
              onClick={handleRetryCompensation}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 text-label-md text-label-md bg-[#0A1B2E] hover:bg-[#14263b] disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRetrying ? "animate-spin" : ""}`}>refresh</span>
              <span>{isRetrying ? "Retrying..." : "Retry Compensation"}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: RESOLVE SAGA COMPENSATION MANUALLY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-[#E2E8F0] max-w-[580px] w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0A1B2E] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">assignment_late</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Resolve Saga Compensation Manually</h3>
                  <p className="font-label-sm text-label-sm text-[#64748B] font-mono">{orderId} · Task: Deprovision Network (hlr-worker-east)</p>
                </div>
              </div>
              <button
                className="text-[#64748B] hover:text-[#0A1B2E] p-1 rounded-md transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-body-sm text-[#0A1B2E] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold font-label-sm text-label-sm text-[#0A1B2E]">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Manual Compensation Override</span>
                </div>
                <p className="leading-relaxed text-[#475569]">
                  Bypassing the automated compensation flow records this step as manually purged. You must verify subscriber IMSI <span className="font-mono font-bold text-[#0A1B2E]">310410•••••••••</span> has been removed from HLR/HSS east cluster before completing.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm font-semibold text-[#0A1B2E] flex items-center justify-between">
                  <span>Resolution Notes / Ticket Reference <span className="text-[#0A1B2E]">*</span></span>
                  <span className="text-[#64748B] font-normal font-mono">INC-88910 / JIRA-HLR-552</span>
                </label>
                <textarea
                  className="w-full text-body-sm font-mono border border-[#CBD5E1] rounded-lg p-2.5 text-[#0A1B2E] placeholder:text-[#94A3B8] focus:border-[#0A1B2E] focus:outline-none focus:ring-1 focus:ring-[#0A1B2E] bg-white"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] cursor-pointer">
                <input
                  checked={verifiedCheckbox}
                  onChange={(e) => setVerifiedCheckbox(e.target.checked)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#0A1B2E] focus:ring-[#0A1B2E] h-4 w-4"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm text-[#0A1B2E] leading-tight">
                  I verified the system state and confirmed network resources are released manually in HLR/HSS east-01.
                </span>
              </label>
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg font-body-md text-body-md text-[#475569] hover:text-[#0A1B2E] hover:bg-white border border-[#CBD5E1] transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleManualResolve}
                className="px-4 py-2 rounded-lg font-body-md text-body-md font-semibold text-white bg-[#0A1B2E] hover:bg-[#14263b] transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Confirm Manual Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: NETWORK SUBSYSTEM (HLR / UDM GATEWAY) */}
      {isNetworkModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A1B2E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#CBD5E1] max-w-[680px] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A1B2E] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">cell_tower</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">
                      Network Subsystem Console (HLR / UDM)
                    </h3>
                    <span className="font-mono text-[11px] font-semibold bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full">
                      Port 8103
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-[#64748B] font-mono">
                    Target Order: {orderId} · Subsystem Slice: hlr-east-01
                  </p>
                </div>
              </div>
              <button
                className="text-[#64748B] hover:text-[#0A1B2E] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                onClick={() => setIsNetworkModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Status Summary Banner */}
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[22px] text-[#0A1B2E] shrink-0 mt-0.5">
                  sync_problem
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-[13px] font-bold text-[#0A1B2E]">
                      Downstream HLR Profile Lock Detected
                    </span>
                    <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#0A1B2E] text-white">
                      TIMEOUT_504
                    </span>
                  </div>
                  <p className="font-body-sm text-[12.5px] text-[#475569] leading-relaxed">
                    Saga compensation activity <code className="font-mono bg-white px-1 py-0.5 rounded border border-[#CBD5E1] text-[#0A1B2E]">deprovision_network</code> failed due to HLR gateway timeout. An orphaned subscriber reservation profile lock remains on IMSI slice.
                  </p>
                </div>
              </div>

              {/* Live Subsystem Inspection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                    Active Slice Telemetry &amp; Resource State
                  </span>
                  <a
                    href="http://localhost:8103/admin/audit/resources"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11.5px] text-[#0A1B2E] hover:underline font-medium inline-flex items-center gap-1 font-mono"
                  >
                    <span>Raw Endpoint ↗</span>
                  </a>
                </div>

                <div className="bg-[#0A1B2E] text-[#F8FAFC] p-4 rounded-xl font-mono text-[12px] overflow-x-auto shadow-inner border border-[#1E293B]">
                  {networkLoading ? (
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      <span>Querying HLR/UDM gateway on :8103/admin/audit/resources...</span>
                    </div>
                  ) : (
                    <pre className="text-[11.5px] leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(
                        networkAudit || {
                          subsystem: "Mock Network Gateway (HLR/HSS/UDM)",
                          port: 8103,
                          slice: "hlr-east-01",
                          order_id: orderId,
                          imsi_lock: "31041000004821",
                          status: "HALTED_SAGA_TIMEOUT",
                          attempts_exhausted: 5,
                          upstream_circuit_breaker: "HALF_OPEN",
                          suggested_action: "Execute manual purge or retry compensation with updated backoff"
                        },
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              </div>

              {/* Troubleshooting Actions */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2">
                <div className="text-[12px] font-bold text-[#0A1B2E]">Diagnostic Recommendations:</div>
                <ul className="text-[12px] text-[#64748B] space-y-1 list-disc list-inside">
                  <li>Use <strong>Resolve Manually</strong> to record manual NOC verification and clear the fallout blocker.</li>
                  <li>Click <strong>Retry Compensation</strong> once upstream HLR gateway network latency recovers.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#64748B]">
                Subsystem: Network (HLR) · Health: DEGRADED
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  className="px-3.5 py-1.5 rounded-lg font-body-md text-body-md text-[#0A1B2E] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors shadow-2xs font-medium cursor-pointer"
                  onClick={() => setIsNetworkModalOpen(false)}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsNetworkModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-lg font-body-md text-body-md font-semibold text-white bg-[#0A1B2E] hover:bg-[#14263b] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">build_circle</span>
                  <span>Proceed to Resolve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB INTERNAL LINK TRACKER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <Link
            className="hover:text-primary-container font-medium flex items-center gap-1 transition-colors"
            href="/orders"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Orders
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="font-label-md text-label-md font-semibold text-on-surface bg-surface-container-high px-2 py-0.5 rounded">
            {orderId}
          </span>
          <span className="text-outline-variant">·</span>
          <span className="text-on-surface-variant">Fiber Activation Saga (v1.18.4)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary-container"></span>
            Workflow ID:{" "}
            <span className="font-mono text-on-surface font-semibold">
              {order?.workflow_id || (orderId.startsWith("ord_") ? `wf-${orderId.toLowerCase()}` : "wf-fiber-saga-991024-aa7b")}
            </span>
          </div>
          <button
            onClick={fetchDetail}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
            title="Refresh state"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>
      </div>

      {/* 1. HEADER BAND */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-4 border border-[#E3E8F0]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Order ID & Primary Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                {orderId}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 text-on-surface-variant hover:text-primary-container hover:bg-surface-container rounded-lg transition-colors"
                id="copy-btn"
                title="Copy Order ID"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
            {/* Prominent State Semantic Pill */}
            {isResolved || order?.state === "ROLLED_BACK" ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A1B2E] text-white border border-[#0A1B2E] shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span className="font-label-sm text-label-sm font-bold tracking-wide uppercase">ROLLED_BACK</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A1B2E] text-white border border-[#0A1B2E] shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">warning</span>
                <span className="font-label-sm text-label-sm font-bold tracking-wide uppercase">NEEDS_ATTENTION</span>
              </div>
            )}
            {isResolved || order?.state === "ROLLED_BACK" ? (
              <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-semibold font-mono">
                MANUALLY RESOLVED (NOC OVERRIDE)
              </span>
            ) : (
              <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-semibold font-mono">
                COMPENSATION FAILED (5/5)
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={`/orders/${orderId}/replay`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md font-medium bg-white text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors border border-[#CBD5E1] shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Replay Mode</span>
            </Link>
            {/* Certificate Pending Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-medium bg-white border border-[#CBD5E1] text-[#0A1B2E] shadow-2xs"
              title="Certificate pending — order not terminal-consistent"
            >
              <span className="material-symbols-outlined text-[16px] text-[#64748B]">warning</span>
              <span>Certificate pending — order not terminal-consistent</span>
            </div>
            <a
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md font-medium text-[#0A1B2E] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors shadow-2xs"
              href={
                order?.workflow_id
                  ? `${process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8233"}/namespaces/default/workflows/${order.workflow_id}`
                  : orderId.startsWith("ord_")
                  ? `${process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8233"}/namespaces/default/workflows/wf-${orderId.toLowerCase()}`
                  : `${process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8233"}/namespaces/default/workflows`
              }
              target="_blank"
              rel="noreferrer"
            >
              <span>Open in Temporal</span>
              <span className="material-symbols-outlined text-[14px]">north_east</span>
            </a>
            <button
              onClick={async () => {
                const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                await fetch(`${apiHost}/orders/${orderId}/cancel`, { method: "POST" });
                fetchDetail();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md font-medium text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Cancel Order</span>
            </button>
          </div>
        </div>

        {/* Metadata Badges Strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 bg-surface-container-low/40 rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant border border-[#EDF0F5]">
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Product:</span>
            <span className="font-semibold text-on-surface">{order?.product || "Fiber Broadband 500"}</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Customer:</span>
            <span className="font-semibold text-on-surface">{order?.customer_id || "Marcus Vance"}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">(+1 555 019-4821)</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Client Ref:</span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">EXT-CRM-991024</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Created:</span>
            <span className="font-label-sm text-label-sm text-on-surface">2026-07-12 14:22:04 UTC</span>
            <span className="text-on-surface-variant">(8m 14s ago)</span>
          </div>
          <div className="text-outline-variant">·</div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="material-symbols-outlined text-[16px] text-primary-container">timer</span>
            <span className="font-label-sm text-label-sm text-primary-container font-bold px-2 py-0.5 rounded bg-surface-container">
              Elapsed: 4.82s
            </span>
          </div>
        </div>
      </div>

      {/* 2. TIME-TRAVEL REPLAY SCRUBBER */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3 border border-[#E3E8F0]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-[#E2E8F0]">
              <button
                onClick={() => setCurrentSeq(Math.max(1, currentSeq - 1))}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded transition-colors"
                title="Step Back"
              >
                <span className="material-symbols-outlined text-[18px]">skip_previous</span>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 bg-[#0A1B2E] text-white rounded transition-colors shadow-xs"
                title="Halted"
              >
                <span className="material-symbols-outlined text-[18px]">pause</span>
              </button>
              <button
                onClick={() => setCurrentSeq(Math.min(42, currentSeq + 1))}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded transition-colors"
                title="Step Forward"
              >
                <span className="material-symbols-outlined text-[18px]">skip_next</span>
              </button>
            </div>
            {/* Speed Selector Pills */}
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 text-label-sm font-label-sm border border-[#E2E8F0]">
              <button
                onClick={() => setPlaybackSpeed(1)}
                className={`px-2 py-1 rounded transition-colors ${
                  playbackSpeed === 1 ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-on-surface-variant"
                }`}
              >
                1×
              </button>
              <button
                onClick={() => setPlaybackSpeed(2)}
                className={`px-2 py-1 rounded transition-colors ${
                  playbackSpeed === 2 ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-on-surface-variant"
                }`}
              >
                2×
              </button>
              <button
                onClick={() => setPlaybackSpeed(4)}
                className={`px-2 py-1 rounded transition-colors ${
                  playbackSpeed === 4 ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-on-surface-variant"
                }`}
              >
                4×
              </button>
            </div>
            <span className="text-outline-variant">|</span>
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              Seq {currentSeq} <span className="text-on-surface-variant font-normal">/ 42</span>
            </span>
          </div>

          {/* Scrubber Label / Status Alert */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1 rounded-full text-label-sm font-label-sm text-[#0A1B2E] shadow-2xs">
            <span className="material-symbols-outlined text-[15px] text-[#0A1B2E]">error</span>
            <span>
              Seq {currentSeq}: <span className="font-bold font-mono text-[#0A1B2E]">saga.compensation_failed</span> · Deprovision Network (HLR Gateway 504 Gateway Timeout)
            </span>
          </div>

          {/* Jump & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSeq(31)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-label-sm font-label-sm font-semibold bg-[#0A1B2E] text-white hover:bg-[#1E293B] transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px]">report_problem</span>
              <span>Jump to Compensation Halt</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-label-sm font-label-sm font-medium bg-white text-[#0A1B2E] border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E] animate-ping"></span>
              <span>Waiting on NOC</span>
            </button>
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        <div className="relative pt-2 pb-1">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPercent = (e.clientX - rect.left) / rect.width;
              setCurrentSeq(Math.max(1, Math.round(clickPercent * 42)));
            }}
            className="w-full h-2 bg-[#F1F5F9] rounded-full relative cursor-pointer overflow-hidden border border-[#CBD5E1]"
          >
            <div className="absolute left-0 top-0 bottom-0 bg-[#0A1B2E] rounded-l-full" style={{ width: "55%" }}></div>
            <div className="absolute top-0 bottom-0 bg-[#475569]" style={{ left: "55%", width: "3%" }}></div>
            <div className="absolute top-0 bottom-0 bg-[#0A1B2E]" style={{ left: "58%", width: "14%" }}></div>
            <div className="absolute top-0 bottom-0 bg-[#CBD5E1]" style={{ left: "72%", width: "28%" }}></div>
          </div>
          {/* Playhead Thumb Indicator placed exactly at halt point */}
          <div
            className="absolute top-1 -ml-2 flex flex-col items-center pointer-events-none transition-all"
            style={{ left: `${(currentSeq / 42) * 100}%` }}
          >
            <div className="w-4 h-4 bg-[#0A1B2E] border-2 border-white rounded-full shadow-md animate-pulse"></div>
          </div>
          {/* Timeline Tick Marks */}
          <div className="flex justify-between items-center px-1 pt-1.5 font-label-sm text-label-sm text-[#64748B] font-mono">
            <span>0.00s (Validate)</span>
            <span>1.20s (Parallel Fork)</span>
            <span className="text-[#0A1B2E] font-semibold">3.62s (OCS Fail)</span>
            <span className="text-[#0A1B2E] font-bold">5.94s (HLR Retry 5× Fail)</span>
            <span className="text-[#64748B]">Halted: Rollback Blocked</span>
            <span className="text-[#64748B]">Target: 42 (Unreachable)</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: REGION A & REGION B */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* REGION (A) - CENTER GRAPH CANVAS (8 cols) */}
        <div className="col-span-12 xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col h-[640px] relative overflow-hidden border border-[#E3E8F0]">
          {/* Canvas Header & Toolbar */}
          <div className="h-auto min-h-12 py-2 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-surface-container-lowest border-b border-[#EDF0F5]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[18px] text-primary-container shrink-0">account_tree</span>
              <span className="font-headline-sm text-sm sm:text-headline-sm text-on-surface font-semibold truncate">
                Order Orchestration DAG
              </span>
              <span className="hidden sm:inline-block font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono shrink-0">
                Temporal v1.18.4
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 border border-[#E2E8F0]">
              <button onClick={handleZoomIn} className="p-1 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer" title="Zoom In">
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              <button onClick={handleZoomOut} className="p-1 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer" title="Zoom Out">
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <button onClick={handleZoomReset} className="px-1.5 py-0.5 hover:bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface transition-colors font-mono text-[11px] cursor-pointer" title="Reset Zoom">
                {Math.round(dagZoom * 100)}%
              </button>
              <span className="text-outline-variant mx-1">|</span>
              <button onClick={() => setDagGrid((g) => !g)} className={`p-1 rounded transition-colors cursor-pointer ${dagGrid ? "text-[#0A1B2E] font-bold" : "text-[#94A3B8]"}`} title="Toggle Grid">
                <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
              </button>
              <button onClick={() => setDagMinimap((m) => !m)} className={`p-1 rounded shadow-xs cursor-pointer ${dagMinimap ? "bg-surface-container-lowest text-primary font-bold" : "text-[#94A3B8]"}`} title="Minimap Toggle">
                <span className="material-symbols-outlined text-[18px]">map</span>
              </button>
            </div>
          </div>

          {/* Interactive DAG Canvas Body */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
            <OrderDagCanvas
              isResolved={isResolved}
              selectedTaskId={selectedTaskId}
              onSelectTask={(taskId) => {
                setSelectedTaskId(taskId);
                setActiveRightTab("task");
              }}
              dagGrid={dagGrid}
              dagMinimap={dagMinimap}
            />
          </div>
        </div>

        {/* REGION (B) - RIGHT INSPECTION PANEL (4 cols) */}
        <div className="col-span-12 xl:col-span-4 bg-white rounded-xl shadow-2xs flex flex-col h-[640px] overflow-hidden border border-[#CBD5E1]">
          {/* Tabs Navigation */}
          <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-white border-b border-[#E2E8F0]">
            <div className="flex items-center gap-6 h-full font-body-md text-body-md">
              <button
                onClick={() => setActiveRightTab("timeline")}
                className={`h-full flex items-center transition-colors ${
                  activeRightTab === "timeline" ? "text-[#0A1B2E] font-semibold relative" : "text-[#64748B] hover:text-[#0A1B2E] font-medium"
                }`}
              >
                Timeline (27)
                {activeRightTab === "timeline" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A1B2E] rounded-t-full"></span>}
              </button>
              <button
                onClick={() => setActiveRightTab("task")}
                className={`h-full flex items-center transition-colors ${
                  activeRightTab === "task" ? "text-[#0A1B2E] font-semibold relative" : "text-[#64748B] hover:text-[#0A1B2E] font-medium"
                }`}
              >
                Task Detail
                {activeRightTab === "task" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A1B2E] rounded-t-full"></span>}
              </button>
              <button
                onClick={() => setActiveRightTab("cert")}
                className={`h-full flex items-center transition-colors ${
                  activeRightTab === "cert" ? "text-[#0A1B2E] font-semibold relative" : "text-[#64748B] hover:text-[#0A1B2E] font-medium"
                }`}
              >
                Certificate
                {activeRightTab === "cert" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A1B2E] rounded-t-full"></span>}
              </button>
            </div>
            <button className="p-1 text-[#64748B] hover:text-[#0A1B2E] hover:bg-[#F8FAFC] rounded transition-colors" title="Expand panel">
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: TIMELINE */}
            {activeRightTab === "timeline" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg flex items-start gap-2.5 text-[#0A1B2E]">
                  <span className="material-symbols-outlined text-[18px] text-[#0A1B2E] shrink-0 mt-0.5">history</span>
                  <div>
                    <h4 className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      Order Lifecycle &amp; Saga Workflow Events
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#475569] mt-0.5">
                      Chronological progression of forward tasks, transient faults, retries, and compensation triggers.
                    </p>
                  </div>
                </div>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                  {(events && events.length > 0
                    ? events
                    : [
                        { seq: 1, type: "order.received", ts: "2026-07-12T14:22:04.110Z", payload: { client_ref: order?.client_order_ref || "EXT-CRM-991024", state: "RECEIVED" } },
                        { seq: 2, type: "order.validated", ts: "2026-07-12T14:22:04.330Z", payload: { state: "VALIDATED", catalog_version: 1 } },
                        { seq: 3, type: "task.started", ts: "2026-07-12T14:22:04.420Z", payload: { task_id: "reserve_inventory", system: "inventory" } },
                        { seq: 4, type: "task.succeeded", ts: "2026-07-12T14:22:04.760Z", payload: { task_id: "reserve_inventory", duration: "340ms" } },
                        { seq: 5, type: "task.started", ts: "2026-07-12T14:22:04.780Z", payload: { task_id: "provision_network", system: "network" } },
                        { seq: 6, type: "task.succeeded", ts: "2026-07-12T14:22:06.200Z", payload: { task_id: "provision_network", slice: "hlr-east-01" } },
                        { seq: 7, type: "task.started", ts: "2026-07-12T14:22:06.210Z", payload: { task_id: "start_charging", system: "billing" } },
                        { seq: 8, type: "task.failed", ts: "2026-07-12T14:22:07.820Z", payload: { task_id: "start_charging", error: "OCS_TIMEOUT_504", retries: 3 } },
                        { seq: 9, type: "saga.rollback_initiated", ts: "2026-07-12T14:22:07.840Z", payload: { trigger: "start_charging_exhausted" } },
                        { seq: 10, type: "task.compensation_failed", ts: "2026-07-12T14:22:09.112Z", payload: { task_id: "deprovision_network", retries: 5, status: "HLR_GATEWAY_TIMEOUT_504" } },
                        { seq: 11, type: "order.needs_attention", ts: "2026-07-12T14:22:09.120Z", payload: { state: "NEEDS_ATTENTION", reason: "Operator intervention required" } },
                      ]
                  ).map((evt, idx) => {
                    const isFailure = evt.type.includes("failed") || evt.type.includes("attention");
                    const isSuccess = evt.type.includes("succeeded") || evt.type.includes("received");
                    return (
                      <div key={idx} className="relative group">
                        <div className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                          isFailure ? "bg-[#0A1B2E]" : isSuccess ? "bg-[#0A1B2E]" : "bg-[#64748B]"
                        }`} />
                        <div className="bg-white p-3 rounded-lg border border-[#CBD5E1] shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#0A1B2E]">{evt.type}</span>
                            <span className="font-mono text-[11px] text-[#64748B]">
                              {new Date(evt.ts).toLocaleTimeString()} UTC
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-[#475569] bg-[#F8FAFC] p-1.5 rounded border border-[#E2E8F0] overflow-x-auto">
                            {JSON.stringify(evt.payload || {}, null, 2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: TASK DETAIL */}
            {activeRightTab === "task" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Header Banner for Selected Task */}
                {(() => {
                  const taskMetadata: Record<string, { title: string; system: string; action: string; attempts: string; duration: string; result: string; code: string; err: string }> = {
                    validate_order: {
                      title: "Validate Order",
                      system: "OMS Core",
                      action: "validate_schema_and_catalog",
                      attempts: "1/3",
                      duration: "220ms",
                      result: "SUCCESS",
                      code: "HTTP 200 OK",
                      err: "None · Acyclic task graph resolved",
                    },
                    reserve_inventory: {
                      title: "Reserve Inventory",
                      system: "Inventory / SIM Pool",
                      action: "reserve_imsi_and_msisdn",
                      attempts: "1/3",
                      duration: "340ms",
                      result: "SUCCESS",
                      code: "HTTP 200 OK",
                      err: "None · Reserved MSISDN & SIM hold",
                    },
                    provision_network: {
                      title: "Provision Network",
                      system: "HLR/HSS East Slice",
                      action: "create_diameter_sub_slice",
                      attempts: "1/3",
                      duration: "1,420ms",
                      result: "SUCCESS",
                      code: "Diameter 2001 (SUCCESS)",
                      err: "None · 5QI profile attached",
                    },
                    verify_service: {
                      title: "Verify Service",
                      system: "Network Access Gateway",
                      action: "ping_radius_ont_sync",
                      attempts: "1/3",
                      duration: "610ms",
                      result: "SUCCESS",
                      code: "Radius Access-Accept",
                      err: "None · Loopback probe latency 4.2ms",
                    },
                    create_billing_account: {
                      title: "Create Billing Account",
                      system: "OCS Rating Engine",
                      action: "create_subscriber_billing_account",
                      attempts: "1/3",
                      duration: "420ms",
                      result: "SUCCESS",
                      code: "HTTP 201 Created",
                      err: "None · Prepaid/Postpaid ledger initialized",
                    },
                    start_billing: {
                      title: "Start Charging",
                      system: "OCS Rating Engine",
                      action: "start_quota_reservation",
                      attempts: "3/3 (Exhausted)",
                      duration: "3,000ms",
                      result: "FAILED",
                      code: "HTTP 500 Internal Timeout",
                      err: "OCS_TIMEOUT_504 · Upstream tariff lock error",
                    },
                    deprovision_network: {
                      title: "Deprovision Network",
                      system: "Network / HLR/HSS East",
                      action: "purge_sub_slice",
                      attempts: "5/5 Exceeded",
                      duration: "5.94s",
                      result: isResolved ? "MANUALLY_RESOLVED" : "COMPENSATION_FAILED",
                      code: isResolved ? "NOC_OVERRIDE_200" : "HLR_GATEWAY_TIMEOUT_504",
                      err: isResolved ? "Operator verified IMSI purged via hssctl-east" : "Connection timed out across 5 exponential retries",
                    },
                    release_inventory: {
                      title: "Release Inventory",
                      system: "Inventory / SIM Pool",
                      action: "release_imsi_hold",
                      attempts: "0/3 (Paused)",
                      duration: "--",
                      result: "STALLED",
                      code: "WAITING",
                      err: "Rollback blocked pending upstream network compensation",
                    },
                    void_billing_account: {
                      title: "Void Billing Account",
                      system: "OCS Rating Engine",
                      action: "void_account_and_reconcile",
                      attempts: "0/3 (Paused)",
                      duration: "--",
                      result: "STALLED",
                      code: "WAITING",
                      err: "Rollback blocked pending upstream network compensation",
                    },
                    notify_customer: {
                      title: "Notify Customer",
                      system: "SMS-C Gateway",
                      action: "send_sms_activation_dispatch",
                      attempts: "0/2 (Paused)",
                      duration: "--",
                      result: "SKIPPED",
                      code: "best-effort",
                      err: "Paused due to order saga failure",
                    },
                  };

                  const currentMeta = taskMetadata[selectedTaskId] || taskMetadata["deprovision_network"];

                  return (
                    <>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0A1B2E] font-mono border border-[#CBD5E1]">
                            {currentMeta.system}
                          </span>
                          <span className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                            currentMeta.result.includes("FAILED")
                              ? "bg-[#0A1B2E] text-white"
                              : currentMeta.result === "MANUALLY_RESOLVED" || currentMeta.result === "SUCCESS"
                              ? "bg-[#0A1B2E] text-white"
                              : "bg-[#F1F5F9] text-[#64748B]"
                          }`}>
                            <span className="material-symbols-outlined text-[13px]">
                              {currentMeta.result.includes("FAILED") ? "warning" : "check_circle"}
                            </span>
                            {currentMeta.result}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">{currentMeta.title}</h3>
                          <p className="font-label-sm text-label-sm text-[#64748B] font-mono mt-0.5">
                            Action: <span className="text-[#0A1B2E]">{currentMeta.action}</span>
                          </p>
                        </div>
                      </div>

                      {/* Execution Details Table */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Execution Summary</span>
                          <span className="font-label-sm text-label-sm text-[#64748B] font-semibold">{currentMeta.attempts}</span>
                        </div>
                        <div className="rounded-lg overflow-hidden font-body-sm text-body-sm border border-[#CBD5E1] bg-white divide-y divide-[#F1F5F9]">
                          <div className="px-3 py-2 flex items-center justify-between">
                            <span className="text-[#64748B]">Duration</span>
                            <span className="font-mono text-label-sm font-medium text-[#0A1B2E]">{currentMeta.duration}</span>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between">
                            <span className="text-[#64748B]">Result / Protocol Code</span>
                            <span className="font-mono text-label-sm font-semibold text-[#0A1B2E]">{currentMeta.code}</span>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between">
                            <span className="text-[#64748B]">Error / Diagnostic</span>
                            <span className="font-mono text-xs text-[#0A1B2E] truncate max-w-[200px]" title={currentMeta.err}>
                              {currentMeta.err}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Payload */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Diagnostic Payload</span>
                          <button
                            onClick={() => navigator.clipboard?.writeText(JSON.stringify({
                              task_id: selectedTaskId,
                              system: currentMeta.system,
                              action: currentMeta.action,
                              duration: currentMeta.duration,
                              code: currentMeta.code,
                              order_id: orderId,
                            }, null, 2))}
                            className="font-label-sm text-label-sm text-[#0A1B2E] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">content_copy</span>
                            Copy JSON
                          </button>
                        </div>
                        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-3 font-label-sm text-label-sm font-mono text-[#0A1B2E] overflow-x-auto leading-relaxed">
                          <pre className="text-xs">
{JSON.stringify({
  task_id: selectedTaskId,
  system: currentMeta.system,
  action: currentMeta.action,
  status: currentMeta.result,
  duration: currentMeta.duration,
  code: currentMeta.code,
  order_id: orderId,
}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: CERTIFICATE */}
            {activeRightTab === "cert" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Certificate Status Notice Banner */}
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg flex items-start gap-2.5 text-[#0A1B2E]">
                  <span className="material-symbols-outlined text-[18px] text-[#0A1B2E] shrink-0 mt-0.5">
                    {certificateData || isResolved ? "verified" : "report"}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-label-sm text-label-sm font-bold">
                      {certificateData || isResolved
                        ? "Cryptographic Consistency Certificate Sealed"
                        : "Certificate Pending — Order Not Terminal-Consistent"}
                    </div>
                    <p className="font-body-sm text-body-sm text-[#475569]">
                      {certificateData || isResolved
                        ? "Ed25519-signed Merkle execution proof valid. Zero orphaned state across downstream telecom subsystems."
                        : "Cryptographic proof cannot be sealed while saga rollback or compensation is unfinalized."}
                    </p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#64748B]">Order Reference</span>
                      <span className="font-mono text-xs font-semibold text-[#0A1B2E]">{orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#64748B]">Key ID</span>
                      <span className="font-mono text-xs text-[#0A1B2E]">
                        {certificateData?.key_id || "ed25519-switchon-primary"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#64748B]">Issued Timestamp</span>
                      <span className="font-mono text-xs text-[#0A1B2E]">
                        {certificateData?.issued_at ? new Date(certificateData.issued_at).toUTCString() : "Pending terminal state"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#64748B]">Signature Verification</span>
                      <span className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                        certificateData || isResolved ? "bg-[#0A1B2E] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                      }`}>
                        <span className="material-symbols-outlined text-[13px]">
                          {certificateData || isResolved ? "verified_user" : "hourglass_empty"}
                        </span>
                        {certificateData || isResolved ? "PASS (Valid)" : "PENDING"}
                      </span>
                    </div>
                  </div>

                  {/* Hash-Chain Digest */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Hash-Chain Digest</span>
                      <button
                        onClick={() => navigator.clipboard?.writeText(certificateData?.body?.events_digest || "sha256:d10842aef91204847eec0")}
                        className="font-label-sm text-label-sm text-[#0A1B2E] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        Copy
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-xs text-[#0A1B2E] break-all">
                      {certificateData?.body?.events_digest || "sha256:3a4b114d8f4a3321992c9912b51290aad10877ef"}
                    </div>
                  </div>

                  {/* Cryptographic Signature Hex */}
                  <div className="space-y-1.5">
                    <span className="font-body-sm text-body-sm font-semibold text-[#0A1B2E]">Ed25519 Signature</span>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-[11px] text-[#475569] break-all">
                      {certificateData?.signature || (isResolved ? "3b9a1f48d91c73a84e2098bfe124018274a001928374e6f5d4c3b2a1" : "Signature pending terminal consistency check")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REGION (C) - BOTTOM FULL-WIDTH CARD: ROOT-CAUSE EXPLAINER */}
      <div className="bg-white rounded-xl shadow-2xs p-5 space-y-4 border border-[#CBD5E1]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#0A1B2E]">psychology</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">Root-Cause Explainer &amp; Automated Triage</h2>
            {isResolved ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A1B2E] text-white font-label-sm text-label-sm font-bold shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Resolved by NOC</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A1B2E] text-white font-label-sm text-label-sm font-bold shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Action Required</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-white text-[#0A1B2E] border border-[#CBD5E1] font-mono font-semibold">
              {isResolved ? "SLA Status: Resolved (All locks cleared)" : "SLA Alert: +182s residual resource lock"}
            </span>
          </div>
        </div>

        {/* 3-Column Grid: Cause / Impact / Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. CAUSE */}
          <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#0A1B2E] font-semibold font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>1. CAUSE</span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
              HLR gateway timed out across 5 retry attempts during network deprovisioning saga rollback. Gateway node <code className="font-mono font-semibold text-[#0A1B2E]">hlr-east-01</code> stopped responding to gRPC health checks (<code className="font-mono text-[#0A1B2E]">HLR_UPSTREAM_UNRESPONSIVE</code>).
            </p>
          </div>

          {/* 2. IMPACT */}
          <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#0A1B2E] font-semibold font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">report</span>
              <span>2. IMPACT</span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
              {isResolved ? (
                <>
                  <span className="font-semibold text-[#0A1B2E]">Resolved:</span> Resource lock cleared. HLR profile manually purged from cluster east-01. Order state reconciled to <span className="font-mono font-bold text-[#0A1B2E]">ROLLED_BACK</span>.
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#0A1B2E]">Critical:</span> Active SIM/HLR resource orphaned in network core. Subscriber disconnected but HLR profile not purged. <span className="font-mono font-bold text-[#0A1B2E]">1 residual HLR resource lock</span> preventing order termination.
                </>
              )}
            </p>
          </div>

          {/* 3. RECOMMENDED ACTION */}
          <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#0A1B2E] font-semibold font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">{isResolved ? "task_alt" : "handyman"}</span>
              <span>3. {isResolved ? "RESOLUTION RECORD" : "RECOMMENDED ACTION"}</span>
            </div>
            <p className="font-body-sm text-body-sm text-[#475569] leading-relaxed">
              {isResolved ? (
                <>
                  Operator verified and completed manual override. Resolution notes filed under <span className="font-semibold text-[#0A1B2E]">NOC-41908</span>. Cryptographic consistency seal pending final archival.
                </>
              ) : (
                <>
                  Manual intervention required. Verify HLR profile status via <span className="font-semibold text-[#0A1B2E]">Network Admin Portal</span>, purge subscriber record, and mark compensation resolved via <span className="font-semibold text-[#0A1B2E] underline">Resolve Manually…</span> above.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Explainer Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 font-label-sm text-label-sm text-[#64748B] font-mono">
            <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">pending_actions</span>
            <span>
              {isResolved
                ? "Reconciliation state: Consistent (0 orphaned records, tombstone recorded)"
                : "Reconciliation state: Inconsistent (1 orphaned Core Network record)"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-md text-body-md text-[#0A1B2E] hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>View Audit Log</span>
            </button>
            {!isResolved && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-body-md text-body-md font-semibold text-white bg-[#0A1B2E] hover:bg-[#14263b] transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">handyman</span>
                <span>Resolve Compensation Manually</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ORDER EVENT AUDIT LOG */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A1B2E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#CBD5E1] max-w-[760px] w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A1B2E] flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-[#0A1B2E]">
                    Order Lifecycle Audit Log
                  </h3>
                  <p className="font-label-sm text-label-sm text-[#64748B] font-mono">
                    {orderId} · Cryptographic Linear Sequence
                  </p>
                </div>
              </div>
              <button
                className="text-[#64748B] hover:text-[#0A1B2E] p-1 rounded-md transition-colors"
                onClick={() => setIsAuditModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Event List Body */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-[#F8FAFC]">
              {(events && events.length > 0 ? events : [
                { id: 1, seq: 1, type: "order.received", ts: "2026-07-12T14:22:04.110Z", payload: { client_ref: "EXT-CRM-991024", product: "Fiber Broadband 500" } },
                { id: 2, seq: 2, type: "order.validated", ts: "2026-07-12T14:22:04.330Z", payload: { catalog_version: 1, acyclic_dag: true } },
                { id: 3, seq: 3, type: "task.started", ts: "2026-07-12T14:22:04.420Z", payload: { task_id: "reserve_inventory", system: "inventory" } },
                { id: 4, seq: 4, type: "task.succeeded", ts: "2026-07-12T14:22:04.760Z", payload: { task_id: "reserve_inventory", sim_iccid: "89014103211123456780" } },
                { id: 5, seq: 5, type: "task.started", ts: "2026-07-12T14:22:04.780Z", payload: { task_id: "provision_network", system: "network" } },
                { id: 6, seq: 6, type: "task.succeeded", ts: "2026-07-12T14:22:06.200Z", payload: { task_id: "provision_network", hlr_slice: "hlr-east-01" } },
                { id: 7, seq: 7, type: "task.started", ts: "2026-07-12T14:22:06.210Z", payload: { task_id: "start_charging", system: "billing" } },
                { id: 8, seq: 8, type: "task.failed", ts: "2026-07-12T14:22:07.820Z", payload: { task_id: "start_charging", error: "OCS_TIMEOUT_504" } },
                { id: 9, seq: 9, type: "task.compensating", ts: "2026-07-12T14:22:07.850Z", payload: { task_id: "deprovision_network", attempt: 1 } },
                { id: 10, seq: 10, type: "task.compensation_failed", ts: "2026-07-12T14:22:09.112Z", payload: { task_id: "deprovision_network", retries: 5, status: "HLR_GATEWAY_TIMEOUT_504" } },
                { id: 11, seq: 11, type: "order.needs_attention", ts: "2026-07-12T14:22:09.120Z", payload: { reason: "Compensation halted; waiting for operator NOC review" } },
              ]).map((evt, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs font-mono text-label-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-[#0A1B2E] text-white font-bold text-[10.5px]">
                        Seq #{evt.seq || idx + 1}
                      </span>
                      <span className="font-semibold text-[#0A1B2E] text-body-sm font-sans">
                        {evt.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B]">
                      {new Date(evt.ts).toLocaleTimeString()} UTC
                    </span>
                  </div>
                  <div className="text-[11px] text-[#475569] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] overflow-x-auto">
                    {JSON.stringify(evt.payload || {}, null, 2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
              <span className="font-mono text-xs text-[#64748B]">
                Cryptographic Merkle Tree Hash: sha256:e3b0c44298fc1c149afbf4c8996fb924
              </span>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-1.5 rounded-lg font-body-md text-body-md font-medium bg-[#0A1B2E] text-white hover:bg-[#14263b] transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
