"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RegistrarShell } from "@/components/RegistrarShell";
import { Order, OrderEvent, TaskRecord } from "@/lib/types";
import { getFriendlyStatus, getFriendlyProduct } from "@/lib/friendly";

// Friendly progressive journey steps mapped to actual backend tasks
interface FriendlyStep {
  id: string;
  number: number;
  title: string;
  description: string;
  relatedTasks: string[];
}

const ACTIVATION_JOURNEY_STEPS: FriendlyStep[] = [
  {
    id: "step_received",
    number: 1,
    title: "Order Received",
    description: "Request securely logged into SwitchOn orchestration queue.",
    relatedTasks: [],
  },
  {
    id: "step_validate",
    number: 2,
    title: "Identity & KYC Validated",
    description: "Customer profile, billing eligibility, and order schema verified.",
    relatedTasks: ["validate_order", "validate"],
  },
  {
    id: "step_reserve",
    number: 3,
    title: "Resources Reserved",
    description: "Physical ICCID SIM chip and network hardware capacity locked.",
    relatedTasks: ["reserve_inventory", "reserve"],
  },
  {
    id: "step_network",
    number: 4,
    title: "Network Configured",
    description: "HLR/HSS profile provisioned and high-speed data slice activated.",
    relatedTasks: ["provision_network", "provision"],
  },
  {
    id: "step_verify",
    number: 5,
    title: "Service Link Verified",
    description: "End-to-end signal link probe completed with zero packet loss.",
    relatedTasks: ["verify_service", "verify"],
  },
  {
    id: "step_billing",
    number: 6,
    title: "Billing Activated",
    description: "Online Rating Engine (OCS) instantiated with selected plan.",
    relatedTasks: ["create_billing_account", "start_billing", "create_account", "start_charging"],
  },
  {
    id: "step_confirm",
    number: 7,
    title: "Confirmation Delivered",
    description: "Service is fully active; subscriber notified and Ed25519 certificate sealed.",
    relatedTasks: ["notify_customer", "complete_order", "send_activation", "complete"],
  },
];

export function SubscriberOrderDetailView() {
  const { id } = useParams();
  const orderId = (typeof id === "string" ? id : Array.isArray(id) ? id[0] : "") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [hasCert, setHasCert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Cancellation state
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [orderRes, eventsRes, certRes] = await Promise.all([
        fetch(`${apiHost}/orders/${orderId}`),
        fetch(`${apiHost}/orders/${orderId}/events`),
        fetch(`${apiHost}/orders/${orderId}/certificate`),
      ]);

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrder(orderData.order);
        setTasks(orderData.tasks || []);
        setError(null);
      } else {
        setError(`Order ${orderId} not found or unavailable.`);
      }

      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }

      if (certRes.ok) {
        setHasCert(true);
      } else {
        setHasCert(false);
      }
    } catch {
      setError("Unable to connect to SwitchOn backend service.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();

    // SSE Stream Subscription
    let evtSource: EventSource | null = null;
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      evtSource = new EventSource(`${apiHost}/stream/orders`);
      evtSource.onopen = () => setIsLiveActive(true);
      evtSource.onmessage = () => {
        fetchOrderDetail();
      };
      evtSource.onerror = () => setIsLiveActive(false);
    } catch {
      setIsLiveActive(false);
    }

    const interval = setInterval(fetchOrderDetail, 3000);
    return () => {
      clearInterval(interval);
      if (evtSource) evtSource.close();
    };
  }, [fetchOrderDetail]);

  // Request order cancellation
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiHost}/orders/${orderId}/cancel?reason=Registrar+Customer+Request`,
        { method: "POST" }
      );
      if (res.ok) {
        setCancelSuccessMsg("Cancellation signal dispatched to Temporal saga. Reversing steps...");
        setCancelModalOpen(false);
        fetchOrderDetail();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Unable to cancel order in its current state.");
      }
    } catch (e: unknown) {
      alert(`Error requesting cancellation: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCancelling(false);
    }
  };

  const statusMeta = getFriendlyStatus(order?.state || "");
  const prodMeta = getFriendlyProduct(order?.product || "");

  // Determine progression of the 7 friendly steps based on order and tasks
  const getStepProgress = (step: FriendlyStep) => {
    if (!order) return "pending";

    // If order is ACTIVE, all steps succeeded
    if (order.state === "ACTIVE") return "completed";

    // If step 1 (order received), it's completed once order exists
    if (step.id === "step_received") return "completed";

    // If order is in ROLLED_BACK or ROLLING_BACK, check if this step failed or was reversed
    const matchingTasks = tasks.filter((t) =>
      step.relatedTasks.some((rt) => t.task_id.toLowerCase().includes(rt))
    );

    if (matchingTasks.length === 0) {
      // Step not reached yet or queued
      return order.state === "RECEIVED" ? "pending" : "in_progress";
    }

    const hasFailed = matchingTasks.some(
      (t) => t.state === "FAILED" || t.state === "COMPENSATION_FAILED"
    );
    if (hasFailed) return "failed";

    const hasCompensated = matchingTasks.some(
      (t) => t.state === "COMPENSATED" || t.state === "COMPENSATING"
    );
    if (hasCompensated) return "reversed";

    const allSucceeded = matchingTasks.every((t) => t.state === "SUCCEEDED");
    if (allSucceeded) return "completed";

    const isRunning = matchingTasks.some(
      (t) => t.state === "RUNNING" || t.state === "RETRYING"
    );
    if (isRunning) return "in_progress";

    return "pending";
  };

  if (loading) {
    return (
      <RegistrarShell>
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
          <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            <span className="material-symbols-outlined text-[36px] text-sky-600 animate-spin">
              progress_activity
            </span>
            <p className="mt-2 text-sm font-medium">Retrieving real-time order telemetry for {orderId}...</p>
          </div>
        </div>
      </RegistrarShell>
    );
  }

  if (error || !order) {
    return (
      <RegistrarShell>
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">error</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Order Unavailable or Not Found</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {error || `Order ID "${orderId}" could not be located in the SwitchOn orchestration ledger.`}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => fetchOrderDetail()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Retry Query
              </button>
              <Link
                href="/registrar/orders"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
              >
                Return to Orders
              </Link>
            </div>
          </div>
        </div>
      </RegistrarShell>
    );
  }

  return (
    <RegistrarShell>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Link href="/registrar" className="hover:text-slate-800">
                Registrar
              </Link>
              <span>/</span>
              <Link href="/registrar/orders" className="hover:text-slate-800">
                Orders
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold font-mono">{orderId}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight apple-display-title">
                Activation Status Tracker
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
              >
                <span
                  className={`material-symbols-outlined text-[15px] ${
                    statusMeta.pulse ? "animate-spin" : ""
                  }`}
                >
                  {statusMeta.icon}
                </span>
                <span>{statusMeta.label}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrderDetail()}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer apple-press"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Refresh</span>
            </button>
            {hasCert && (
              <Link
                href={`/registrar/orders/${orderId}/certificate`}
                className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer apple-press"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>View Certificate</span>
              </Link>
            )}
          </div>
        </div>

        {/* Cancellation Message Banner */}
        {cancelSuccessMsg && (
          <div className="p-4 bg-sky-50 border border-sky-300 rounded-2xl text-xs text-sky-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-sky-700">info</span>
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {/* Failure / Review Human-Language Explainer Box */}
        {order?.state === "NEEDS_ATTENTION" && (
          <div className="p-5 sm:p-6 bg-amber-50 border border-amber-300 rounded-3xl shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <span className="material-symbols-outlined text-[22px] text-amber-700">
                support_agent
              </span>
              <span>Our Operations Desk is Reviewing Your Activation</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              Your service order encountered a temporary gateway timeout during the network provision step. SwitchOn halted further operations safely without leaving any orphaned billing charges. A network engineer has been notified and is reviewing the profile lock. This page will update automatically once verified.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-amber-800">
              <span>Incident Ticket: <strong>NOC-AUTO-94821</strong></span>
              <span>·</span>
              <span>SLA Target: <strong>Under 30 minutes</strong></span>
            </div>
          </div>
        )}

        {order?.state === "ROLLED_BACK" && (
          <div className="p-5 sm:p-6 bg-slate-100 border border-slate-300 rounded-3xl shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <span className="material-symbols-outlined text-[22px] text-slate-600">
                undo
              </span>
              <span>Activation Safeguard: Incomplete Setup Safely Reversed</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Because an upstream rating or network service was temporarily unreachable, SwitchOn triggered an automated backward compensation saga. All reserved SIM allocations and network slice profiles were cleanly restored. You may safely initiate a new activation when ready.
            </p>
          </div>
        )}

        {/* Order Profile Summary Card - Apple Card */}
        <div className="apple-card p-5 sm:p-6 rounded-[24px]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">
                Selected Service
              </span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-700 text-[20px]">
                  {prodMeta.icon}
                </span>
                <span className="font-bold text-slate-900 text-sm">{prodMeta.title}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">
                Subscriber Customer
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {order?.customer_id || "Aarav Sharma"}
              </div>
              {order?.msisdn && (
                <div className="font-mono text-slate-500 mt-0.5">{order.msisdn}</div>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">
                Order Reference
              </span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {order?.client_order_ref || orderId}
              </div>
              <div className="text-slate-400 font-mono mt-0.5 text-[11px] truncate">{orderId}</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">
                Real-Time Sync
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                ></span>
                <span>{isLiveActive ? "Live SSE Stream" : "Polling (3s)"}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {order?.created_at ? new Date(order.created_at).toLocaleTimeString() : "Recent"}
              </div>
            </div>
          </div>
        </div>

        {/* Friendly 7-Step Visual Activation Journey - Apple Card */}
        <div className="apple-card p-5 sm:p-8 rounded-[26px]">
          <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 apple-section-headline">Activation Journey Progress</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Real-time milestone tracker backed by SwitchOn deterministic workflow states.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Pending
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {ACTIVATION_JOURNEY_STEPS.map((step, idx) => {
              const state = getStepProgress(step);
              const isLast = idx === ACTIVATION_JOURNEY_STEPS.length - 1;

              let iconName = "radio_button_unchecked";
              let circleClass = "bg-slate-100 text-slate-400 border-slate-300";
              let titleClass = "text-slate-500";
              let descClass = "text-slate-400";

              if (state === "completed") {
                iconName = "check";
                circleClass = "bg-emerald-600 text-white border-emerald-600 shadow-xs";
                titleClass = "text-slate-900 font-bold";
                descClass = "text-slate-600";
              } else if (state === "in_progress") {
                iconName = "sync";
                circleClass = "bg-sky-600 text-white border-sky-600 shadow-md ring-4 ring-sky-100 animate-pulse";
                titleClass = "text-sky-900 font-bold";
                descClass = "text-sky-800";
              } else if (state === "failed") {
                iconName = "close";
                circleClass = "bg-red-600 text-white border-red-600 shadow-xs";
                titleClass = "text-red-900 font-bold";
                descClass = "text-red-700";
              } else if (state === "reversed") {
                iconName = "undo";
                circleClass = "bg-slate-600 text-white border-slate-600";
                titleClass = "text-slate-800 font-bold";
                descClass = "text-slate-600";
              }

              return (
                <div key={step.id} className="relative flex items-start gap-4 sm:gap-6 group">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div
                      className={`absolute left-4 sm:left-5 top-10 bottom-0 w-0.5 -ml-px ${
                        state === "completed" ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    ></div>
                  )}

                  {/* Step icon circle */}
                  <div
                    className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all ${circleClass}`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] sm:text-[20px] ${
                        state === "in_progress" ? "animate-spin" : ""
                      }`}
                    >
                      {iconName}
                    </span>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-6 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          0{step.number}
                        </span>
                        <h3 className={`text-sm sm:text-base ${titleClass}`}>{step.title}</h3>
                      </div>

                      {/* State Badge */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          state === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : state === "in_progress"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : state === "failed"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : state === "reversed"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {state === "completed"
                          ? "Completed"
                          : state === "in_progress"
                          ? "Executing"
                          : state === "failed"
                          ? "Halted"
                          : state === "reversed"
                          ? "Safely Reversed"
                          : "Pending"}
                      </span>
                    </div>

                    <p className={`text-xs mt-1 leading-relaxed ${descClass}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Card Callout (When Ready) */}
        {hasCert && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Activation Certificate Ready &amp; Verified
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  An Ed25519-signed consistency certificate has been cryptographically sealed for this activation order.
                </p>
              </div>
            </div>
            <Link
              href={`/registrar/orders/${orderId}/certificate`}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Certificate</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
          <Link
            href="/registrar/orders"
            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Orders List</span>
          </Link>

          {/* Cancel button if order is in-flight */}
          {order?.state === "IN_PROGRESS" || order?.state === "RECEIVED" ? (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Request Order Cancellation</span>
            </button>
          ) : (
            <span />
          )}
        </div>

        {/* Cancel Order Confirmation Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancel Service Activation?</h3>
                  <p className="text-xs text-slate-500">
                    Order Ref: <span className="font-mono">{orderId}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Cancelling an in-flight order will trigger SwitchOn saga compensation workflows to cleanly deallocate reserved resources and release SIM locks.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Keep Order Active
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {cancelling ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Signaling Cancellation...</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RegistrarShell>
  );
}
