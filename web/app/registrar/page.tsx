"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RegistrarShell } from "@/components/RegistrarShell";
import { useAuth } from "@/lib/auth";
import { Order } from "@/lib/types";

import { getFriendlyStatus, getFriendlyProduct } from "@/lib/friendly";

export default function RegistrarHomePage() {
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
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl shadow-sky-900/10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-semibold mb-4 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Welcome back, {user?.name || "Subscriber Registrar"}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Manage &amp; Track Telecom Service Activations
            </h1>
            <p className="mt-3 text-sm sm:text-base text-sky-100/90 leading-relaxed">
              Provision high-speed residential fiber, 5G postpaid SIMs, and instant eSIM profiles with automated saga safeguards and verified cryptographic delivery.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/registrar/new-order"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-sky-50 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="material-symbols-outlined text-[20px] text-sky-700">add_circle</span>
                <span>Start New Activation</span>
              </Link>
              <Link
                href="/registrar/orders"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-sm border border-white/15 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Browse All Orders</span>
              </Link>
            </div>
          </div>

          {/* Decorative Background Graphics */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[220px]">cell_tower</span>
          </div>
        </div>

        {/* Live Status Summary Bar - Clickable Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/registrar/orders"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">
                Total Orders Logged
              </span>
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700 material-symbols-outlined text-[20px] group-hover:bg-slate-200 transition-colors">
                receipt
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{orders.length}</span>
              <span className="text-xs text-slate-500">records in current ledger</span>
            </div>
          </Link>

          <Link
            href="/registrar/orders?status=ACTIVE"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                Active &amp; Ready
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 material-symbols-outlined text-[20px] group-hover:bg-emerald-100 transition-colors">
                verified
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-700">{activeCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Services activated</span>
            </div>
          </Link>

          <Link
            href="/registrar/orders?status=IN_PROGRESS"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-sky-700 transition-colors">
                In-Flight Activations
              </span>
              <span className="p-2 rounded-xl bg-sky-50 text-sky-700 material-symbols-outlined text-[20px] group-hover:bg-sky-100 transition-colors">
                sync
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-sky-700">{inProgressCount}</span>
              <span className="text-xs text-sky-600 font-medium">Processing through saga</span>
            </div>
          </Link>

          <Link
            href="/registrar/orders?status=NEEDS_ATTENTION"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                Review &amp; Reversals
              </span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 material-symbols-outlined text-[20px] group-hover:bg-amber-100 transition-colors">
                support_agent
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-700">{reviewCount}</span>
              <span className="text-xs text-amber-600 font-medium">Safe guardrail states</span>
            </div>
          </Link>
        </div>

        {/* Live Connectivity Banner */}
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            ></span>
            <span>
              {isLiveConnected
                ? "Connected to SwitchOn Real-Time Event Stream (SSE Active)"
                : "Standard Polling Mode (Refreshing every 5 seconds)"}
            </span>
          </div>
          <button
            onClick={() => fetchRecentOrders()}
            className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            <span>Refresh Now</span>
          </button>
        </div>

        {/* Recent Service Activations Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Service Activations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders created by authorized subscribers and registrar circles.
              </p>
            </div>
            <Link
              href="/registrar/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900"
            >
              <span>View complete order history</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
