"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOCK_ORDERS } from "./mockData";

export interface WorkflowNotification {
  id: string;
  orderId: string;
  orderRef: string;
  title: string;
  detail: string;
  time: string;
  timestamp: number;
  severity: "critical" | "warning" | "info" | "success";
  channel: "registrar" | "admin";
  source: string; // "Registrar Portal" | "Admin NOC"
  state: string; // "NEEDS_ATTENTION" | "FAILED" | "ROLLING_BACK"
  failedStep?: string;
  read: boolean;
  inspectUrl: string; // e.g. /orders/ORD-...
  falloutUrl: string; // e.g. /fallout?orderId=ORD-...
}

interface WorkflowNotificationContextType {
  notifications: WorkflowNotification[];
  unreadCount: number;
  activeToast: WorkflowNotification | null;
  dismissToast: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  triggerManualAlert: (notification: WorkflowNotification) => void;
  // Filtered views based on audience
  adminNotifications: WorkflowNotification[];
  adminUnreadCount: number;
  subscriberNotifications: WorkflowNotification[];
  subscriberUnreadCount: number;
}

const WorkflowNotificationContext = createContext<WorkflowNotificationContextType | undefined>(undefined);

// Web Audio API Synthesizer for Operator Attention Chime
export function playAlertChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.setValueAtTime(880.0, ctx.currentTime + 0.14); // A5
    osc2.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
    osc2.frequency.setValueAtTime(440.0, ctx.currentTime + 0.14); // A4

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // Autoplay restrictions before user interaction - fail silently
  }
}

// Initial seed notifications representing existing broken states
const SEED_NOTIFICATIONS: WorkflowNotification[] = [
  {
    id: "notif-seed-1",
    orderId: "ORD-20260712-004217",
    orderRef: "ORD-20260712-004217",
    title: "Workflow Halted: Deprovision Network Failed",
    detail: "504 Gateway Timeout during rollback cascade. 5/5 retries exhausted. Operator intervention required.",
    time: "4m ago",
    timestamp: Date.now() - 4 * 60 * 1000,
    severity: "critical",
    channel: "admin",
    source: "Admin NOC",
    state: "NEEDS_ATTENTION",
    failedStep: "deprovision_network",
    read: false,
    inspectUrl: "/orders/ORD-20260712-004217",
    falloutUrl: "/fallout?orderId=ORD-20260712-004217",
  },
  {
    id: "notif-seed-2",
    orderId: "ORD-20260712-004213",
    orderRef: "EXT-CRM-991020",
    title: "Workflow Broken: SIM Pool Exhausted",
    detail: "SIM Pool allocation conflict (Err 409): Block quota exhausted in eu-north-sto.",
    time: "12m ago",
    timestamp: Date.now() - 12 * 60 * 1000,
    severity: "critical",
    channel: "registrar",
    source: "Registrar Portal",
    state: "NEEDS_ATTENTION",
    failedStep: "allocate_sim",
    read: false,
    inspectUrl: "/orders/ORD-20260712-004213",
    falloutUrl: "/fallout?orderId=ORD-20260712-004213",
  },
  {
    id: "notif-seed-3",
    orderId: "ORD-20260712-004215",
    orderRef: "ORD-20260712-004215",
    title: "Workflow Retry In Progress: HLR Lock",
    detail: "Retrying step 4 (HLR Lock) attempt #2. Downstream service latency elevated.",
    time: "18m ago",
    timestamp: Date.now() - 18 * 60 * 1000,
    severity: "warning",
    channel: "admin",
    source: "Admin NOC",
    state: "ROLLING_BACK",
    failedStep: "hlr_lock",
    read: true,
    inspectUrl: "/orders/ORD-20260712-004215",
    falloutUrl: "/fallout?orderId=ORD-20260712-004215",
  },
];

export function WorkflowNotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegistrarRoute = pathname?.startsWith("/registrar");
  const [notifications, setNotifications] = useState<WorkflowNotification[]>(SEED_NOTIFICATIONS);
  const [activeToast, setActiveToast] = useState<WorkflowNotification | null>(null);
  const seenErrorsRef = useRef<Set<string>>(new Set(["ORD-20260712-004217", "ORD-20260712-004213", "ORD-20260712-004215"]));
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dismissToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  const triggerToastAlert = useCallback((item: WorkflowNotification) => {
    setActiveToast(item);
    playAlertChime();
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 9000);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const triggerManualAlert = useCallback((item: WorkflowNotification) => {
    setNotifications((prev) => [item, ...prev.filter((n) => n.orderId !== item.orderId)]);
    triggerToastAlert(item);
  }, [triggerToastAlert]);

  // Polling backend orders & Redis SSE to detect any broken workflows across Registrar and Admin portals
  useEffect(() => {
    let isMounted = true;
    const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const checkBrokenOrders = async () => {
      try {
        const res = await fetch(`${apiHost}/orders?limit=100`);
        if (!res.ok) return;
        const orders = await res.json();
        if (!Array.isArray(orders)) return;

        orders.forEach((ord: Record<string, unknown>) => {
          const orderId = String(ord.order_id || "");
          const state = String(ord.state || "").toUpperCase();
          const failureReason = ord.failure_reason ? String(ord.failure_reason) : "";
          const clientRef = ord.client_order_ref ? String(ord.client_order_ref) : orderId;

          // An order is considered broken if in NEEDS_ATTENTION, FAILED, ROLLING_BACK, or has failure_reason
          const isBroken =
            state === "NEEDS_ATTENTION" ||
            state === "FAILED" ||
            state === "ROLLING_BACK" ||
            (failureReason && !failureReason.toLowerCase().includes("manually resolved"));

          if (isBroken && orderId) {
            const errorKey = `${orderId}-${state}-${failureReason.slice(0, 30)}`;
            if (!seenErrorsRef.current.has(errorKey) && !seenErrorsRef.current.has(orderId)) {
              seenErrorsRef.current.add(errorKey);
              seenErrorsRef.current.add(orderId);

              // Determine origin portal (Registrar vs Admin)
              const isRegistrar =
                clientRef.startsWith("EXT-CRM") ||
                ord.channel === "registrar" ||
                String(ord.source || "").toLowerCase().includes("registrar");

              const newNotification: WorkflowNotification = {
                id: `notif-${orderId}-${Date.now()}`,
                orderId,
                orderRef: clientRef || orderId,
                title: `Workflow Broken: ${ord.product || "Service Activation"} (${state})`,
                detail: failureReason || `Workflow halted at current step. Admin NOC intervention required.`,
                time: "Just now",
                timestamp: Date.now(),
                severity: "critical",
                channel: isRegistrar ? "registrar" : "admin",
                source: isRegistrar ? "Registrar Portal" : "Admin NOC",
                state,
                read: false,
                inspectUrl: `/orders/${orderId}`,
                falloutUrl: `/fallout?orderId=${orderId}`,
              };

              if (isMounted) {
                setNotifications((prev) => [newNotification, ...prev]);
                triggerToastAlert(newNotification);
              }
            }
          }
        });
      } catch {
        // Backend temporarily unavailable; fallback to mock orders check
        MOCK_ORDERS.forEach((mOrd) => {
          const mState = String(mOrd.state);
          if (mState === "NEEDS_ATTENTION" || mState === "FAILED" || mState === "ROLLING_BACK") {
            const errorKey = `mock-${mOrd.order_id}`;
            if (!seenErrorsRef.current.has(errorKey)) {
              seenErrorsRef.current.add(errorKey);
            }
          }
        });
      }
    };

    // Initial check
    checkBrokenOrders();

    // Regular interval poll
    const interval = setInterval(checkBrokenOrders, 4000);

    // Also connect to SSE order stream if available
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource(`${apiHost}/stream/orders`);
      evtSource.addEventListener("order_event", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const type = String(parsed.type || "");
          const orderId = String(parsed.order_id || "");

          if (
            type.includes("failed") ||
            type.includes("compensation_failed") ||
            type.includes("needs_attention") ||
            type.includes("rolled_back")
          ) {
            checkBrokenOrders();
          }
        } catch {
          // ignore parsing error
        }
      });
    } catch {
      // EventSource not supported or failed
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (evtSource) evtSource.close();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [triggerToastAlert]);

  // Admin sees all operational breakdown / workflow error alerts
  const adminNotifications = notifications;
  const adminUnreadCount = adminNotifications.filter((n) => !n.read).length;

  // Subscriber / Registrar portal ONLY sees customer-facing alerts:
  // Specifically "Error sent to the Service Provider" notifications
  const subscriberNotifications = notifications
    .filter((n) => n.channel === "registrar" || n.state === "NEEDS_ATTENTION" || n.state === "FAILED" || n.state === "ROLLING_BACK")
    .map((n) => ({
      ...n,
      title: "Error sent to the Service Provider",
      detail: `Notice dispatched to partner network operations for ${n.orderRef}. Provisioning halted cleanly and under active investigation.`,
      source: "Service Desk",
      severity: "warning" as const,
      inspectUrl: `/registrar/orders/${n.orderId}`,
    }));
  const subscriberUnreadCount = subscriberNotifications.filter((n) => !n.read).length;

  const unreadCount = isRegistrarRoute ? subscriberUnreadCount : adminUnreadCount;

  return (
    <WorkflowNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearNotification,
        triggerManualAlert,
        adminNotifications,
        adminUnreadCount,
        subscriberNotifications,
        subscriberUnreadCount,
      }}
    >
      {children}
      {/* Global Interactive Workflow Error Alert Toast - only displayed on Admin NOC portal, NEVER on Registrar/Subscriber portal */}
      {activeToast && !isRegistrarRoute && (
        <WorkflowErrorToast alert={activeToast} onDismiss={dismissToast} onMarkRead={markAsRead} />
      )}
    </WorkflowNotificationContext.Provider>
  );
}


export function useWorkflowNotifications() {
  const context = useContext(WorkflowNotificationContext);
  if (!context) {
    throw new Error("useWorkflowNotifications must be used within a WorkflowNotificationProvider");
  }
  return context;
}

// Global Floating Workflow Alert Toast for the Admin
function WorkflowErrorToast({
  alert,
  onDismiss,
  onMarkRead,
}: {
  alert: WorkflowNotification;
  onDismiss: () => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div className="fixed top-16 right-4 sm:right-6 z-[100] max-w-md w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-250">
      {/* Alert Header Banner */}
      <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="font-mono text-xs font-black tracking-wider uppercase">
            Workflow Error Alert
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              alert.channel === "registrar"
                ? "bg-sky-100 text-sky-900 border border-sky-300"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}
          >
            {alert.source}
          </span>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-700 rounded-md transition-colors text-white cursor-pointer"
            aria-label="Dismiss alert"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Alert Body */}
      <div className="p-4 space-y-3 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Order Reference:
              </span>
              <span className="font-mono text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {alert.orderRef}
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
              {alert.title}
            </h4>
          </div>
        </div>

        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono leading-relaxed line-clamp-3">
          {alert.detail}
        </p>

        {/* Action Buttons: Inspect & Resolve or Fallout Queue */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={alert.inspectUrl}
            onClick={() => {
              onMarkRead(alert.id);
              onDismiss();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all text-center"
          >
            <span className="material-symbols-outlined text-[16px]">build_circle</span>
            <span>Inspect & Resolve</span>
          </Link>

          <Link
            href={alert.falloutUrl}
            onClick={() => {
              onMarkRead(alert.id);
              onDismiss();
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 text-xs font-semibold border border-slate-300 transition-all flex items-center gap-1 text-center"
          >
            <span className="material-symbols-outlined text-[15px]">report_problem</span>
            <span>Fallout Queue</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
