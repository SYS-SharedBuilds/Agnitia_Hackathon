"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RegistrarShell } from "@/components/RegistrarShell";
import { useAuth } from "@/lib/auth";
import { Order } from "@/lib/types";
import { HoverFeatureCards } from "@/components/unlumen-ui/hover-feature-cards";
import { getFriendlyStatus, getFriendlyProduct } from "@/lib/friendly";

export function SubscriberDashboardView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiHost}/orders?limit=10`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        setError(null);
      } else {
        setError(`Backend responded with code ${res.status}`);
      }
    } catch {
      setError("Unable to reach SwitchOn backend service. Showing offline status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentOrders();

    // Setup live SSE connection if available
    let evtSource: EventSource | null = null;
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      evtSource = new EventSource(`${apiHost}/stream/orders`);
      evtSource.onopen = () => setIsLiveConnected(true);
      evtSource.onmessage = (event) => {
        try {
          if (event.data) {
            // Re-fetch on any order events
            fetchRecentOrders();
          }
        } catch {
          // Ignore parse errors
        }
      };
      evtSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch {
      setIsLiveConnected(false);
    }

    const interval = setInterval(fetchRecentOrders, 5000);
    return () => {
      clearInterval(interval);
      if (evtSource) evtSource.close();
    };
  }, [fetchRecentOrders]);

  // Aggregate stats from real backend orders
  const activeCount = orders.filter((o) => o.state === "ACTIVE").length;
  const inProgressCount = orders.filter(
    (o) => o.state === "IN_PROGRESS" || o.state === "RECEIVED" || o.state === "VALIDATED"
  ).length;
  const reviewCount = orders.filter(
    (o) => o.state === "NEEDS_ATTENTION" || o.state === "ROLLING_BACK"
  ).length;

  return (
    <RegistrarShell>
      <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-200">
        {/* Welcome Hero Card - Apple Depth & Fluid Materials */}
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white p-6 sm:p-10 shadow-lg shadow-sky-950/15 border border-white/10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-semibold mb-3.5 border border-white/15 apple-caption">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Welcome back, {user?.name || "Subscriber Registrar"}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white apple-display-title">
              Manage &amp; Track Telecom Service Activations
            </h1>
            <p className="mt-2.5 text-xs sm:text-base text-sky-100/80 leading-relaxed max-w-xl">
              Provision high-speed residential fiber, 5G postpaid SIMs, and instant eSIM profiles with automated saga safeguards and verified cryptographic delivery.
            </p>

            <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                href="/registrar/new-order"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white hover:bg-sky-50 text-slate-950 font-bold text-xs sm:text-sm shadow-sm apple-press focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-sky-700">add_circle</span>
                <span>Start New Activation</span>
              </Link>
              <Link
                href="/registrar/orders"
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 apple-press"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">receipt_long</span>
                <span>Browse All Orders</span>
              </Link>
            </div>
          </div>

          {/* Decorative Background Graphics */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-15 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">cell_tower</span>
          </div>
        </div>

        {/* Live Status Summary Bar - Mobile 2x2 Grid / Desktop 4x1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/registrar/orders"
            className="apple-card p-4 sm:p-5 apple-press cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">
                Total Orders
              </span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-700 material-symbols-outlined text-[18px] sm:text-[20px]">
                receipt
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 apple-section-headline">{orders.length}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">in ledger</span>
            </div>
          </Link>

          <Link
            href="/registrar/orders?status=ACTIVE"
            className="apple-card p-4 sm:p-5 apple-press cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                Active Ready
              </span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-700 material-symbols-outlined text-[18px] sm:text-[20px]">
                verified
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 apple-section-headline">{activeCount}</span>
              <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">Activated</span>
            </div>
          </Link>

          <Link
            href="/registrar/orders?status=IN_PROGRESS"
            className="apple-card p-4 sm:p-5 apple-press cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-sky-700 transition-colors">
                In-Flight
              </span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-sky-50 text-sky-700 material-symbols-outlined text-[18px] sm:text-[20px]">
                sync
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-sky-700 apple-section-headline">{inProgressCount}</span>
              <span className="text-[10px] sm:text-xs text-sky-600 font-medium">Processing</span>
            </div>
          </Link>

          <Link
            href="/registrar/orders?status=NEEDS_ATTENTION"
            className="apple-card p-4 sm:p-5 apple-press cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                Safeguards
              </span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-700 material-symbols-outlined text-[18px] sm:text-[20px]">
                support_agent
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-700 apple-section-headline">{reviewCount}</span>
              <span className="text-[10px] sm:text-xs text-amber-600 font-medium">Review</span>
            </div>
          </Link>
        </div>

        {/* Live Connectivity Banner - Apple Subtle Status */}
        <div className="flex items-center justify-between px-4 py-2.5 apple-card rounded-2xl text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-sky-400"
              }`}
            ></span>
            <span className="font-medium text-[11px] sm:text-xs">
              {isLiveConnected
                ? "Live SwitchOn Event Stream (SSE Active)"
                : "Standard Polling Mode (5s interval)"}
            </span>
          </div>
          <button
            onClick={() => fetchRecentOrders()}
            className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer apple-press p-1"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Featured Product Capabilities - Unlumen Hover Feature Cards */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 apple-section-headline">
                Service Catalog &amp; Rapid Provisioning
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Explore supported telecom product tiers with instant saga orchestration and automated rollbacks.
              </p>
            </div>
            <Link
              href="/registrar/new-order"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 apple-press"
            >
              <span>Launch wizard</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          <HoverFeatureCards
            items={[
              {
                name: "Fiber Broadband 500",
                description: "High-speed residential gigabit fiber activation with automated ONT validation, VLAN provisioning, and billing account setup.",
                badge: "FIBER_500",
                tag: "Up to 500 Mbps · Symmetric SLA",
                icon: "router",
                href: "/registrar/new-order",
                actionLabel: "Configure Fiber Drop",
              },
              {
                name: "5G Postpaid Unlimited",
                description: "Next-gen 5G mobile slice provisioning with network policy rules, ICCID inventory lock, and real-time OCS rating profiles.",
                badge: "MOBILE_5G",
                tag: "Ultra-Low Latency · VoNR Ready",
                icon: "5g",
                href: "/registrar/new-order",
                actionLabel: "Provision 5G SIM",
              },
              {
                name: "eSIM Roaming Global",
                description: "Instant over-the-air digital profile download via SM-DP+ reservation with instant QR activation and international roaming.",
                badge: "ESIM_ADDON",
                tag: "Digital Profile · Instant Delivery",
                icon: "sim_card",
                href: "/registrar/new-order",
                actionLabel: "Order eSIM Profile",
              },
            ]}
          />
        </div>

        {/* Recent Service Activations Section - Apple Card Container */}
        <div className="apple-card rounded-[24px] overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 apple-section-headline">
                Recent Service Activations
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Orders created by authorized subscribers and registrar circles.
              </p>
            </div>
            <Link
              href="/registrar/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 apple-press"
            >
              <span>View complete history</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-[36px] text-sky-600 animate-spin">
                progress_activity
              </span>
              <p className="mt-2 text-sm font-medium">Retrieving activation records...</p>
            </div>
          ) : error && orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[24px]">cloud_off</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">Connection Notice</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{error}</p>
              <div className="mt-4">
                <Link
                  href="/registrar/new-order"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs inline-block"
                >
                  Create an Order to Test
                </Link>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-[48px] text-slate-300">
                inventory_2
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-800">No service orders yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Begin by creating a new fiber broadband, 5G postpaid, or eSIM activation order.
              </p>
              <div className="mt-4">
                <Link
                  href="/registrar/new-order"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs inline-block"
                >
                  Start First Activation
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => {
                const statusMeta = getFriendlyStatus(order.state);
                const prodMeta = getFriendlyProduct(order.product);

                return (
                  <div
                    key={order.order_id}
                    className="p-5 sm:px-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">
                          {prodMeta.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {prodMeta.title}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {order.order_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                          <span>Customer: <strong className="text-slate-800">{order.customer_id}</strong></span>
                          {order.client_order_ref && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-[11px] text-slate-500">Ref: {order.client_order_ref}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      {/* Friendly Status Pill */}
                      <div className="flex flex-col sm:items-end">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
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
                        <span className="text-[11px] text-slate-400 mt-1">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString() : "Recent"}
                        </span>
                      </div>

                      {/* View Details Action */}
                      <Link
                        href={`/registrar/orders/${order.order_id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                      >
                        <span>Track</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RegistrarShell>
  );
}
