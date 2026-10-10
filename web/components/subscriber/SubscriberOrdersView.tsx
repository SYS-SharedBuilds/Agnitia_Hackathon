"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RegistrarShell } from "@/components/RegistrarShell";
import { Order } from "@/lib/types";
import { getFriendlyStatus, getFriendlyProduct } from "@/lib/friendly";

function OrdersListContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "ALL";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [productFilter, setProductFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const paramStatus = searchParams?.get("status");
    if (paramStatus) {
      setStatusFilter(paramStatus);
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    setIsRefreshing(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiHost}/orders?limit=100`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
      }
    } catch {
      // Fallback handled
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter pipeline
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && o.state !== "ACTIVE") return false;
        if (
          statusFilter === "IN_PROGRESS" &&
          o.state !== "IN_PROGRESS" &&
          o.state !== "RECEIVED" &&
          o.state !== "VALIDATED"
        )
          return false;
        if (
          statusFilter === "NEEDS_ATTENTION" &&
          o.state !== "NEEDS_ATTENTION" &&
          o.state !== "ROLLING_BACK"
        )
          return false;
        if (statusFilter === "ROLLED_BACK" && o.state !== "ROLLED_BACK") return false;
      }

      // Product filter
      if (productFilter !== "ALL") {
        if (o.product !== productFilter) return false;
      }

      // Search query (order_id, customer_id, client_order_ref, msisdn)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (o.order_id || "").toLowerCase().includes(q);
        const matchesCustomer = (o.customer_id || "").toLowerCase().includes(q);
        const matchesRef = (o.client_order_ref || "").toLowerCase().includes(q);
        const matchesMsisdn = (o.msisdn || "").toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesRef && !matchesMsisdn) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, productFilter, searchQuery]);

  return (
    <RegistrarShell>
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Link href="/registrar" className="hover:text-slate-800">
                Registrar
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Service Orders</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight apple-display-title">
              My Service Activations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Search, filter, and inspect subscriber activation journeys and cryptographic certificates.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchOrders()}
              disabled={isRefreshing}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer apple-press"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <Link
              href="/registrar/new-order"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer apple-press"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Activation</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Toolbar - Apple Card Container */}
        <div className="apple-card p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Customer, Phone, or Ref..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 sm:px-3 bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer flex-1 sm:flex-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active &amp; Ready</option>
              <option value="IN_PROGRESS">Activating (In-Progress)</option>
              <option value="NEEDS_ATTENTION">Operator Review</option>
              <option value="ROLLED_BACK">Reversed / Rolled Back</option>
            </select>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="h-9 px-2.5 sm:px-3 bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer flex-1 sm:flex-none"
            >
              <option value="ALL">All Products</option>
              <option value="FIBER_500">Fiber 500Mbps</option>
              <option value="MOBILE_5G">5G Postpaid</option>
              <option value="ESIM_ADDON">eSIM Roaming</option>
            </select>
          </div>
        </div>

        {/* Orders Table & Cards - Apple Card Container */}
        <div className="apple-card rounded-[24px] overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-[36px] text-sky-600 animate-spin">
                progress_activity
              </span>
              <p className="mt-2 text-sm font-medium">Loading orders from SwitchOn ledger...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[24px]">search_off</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">No matching activations found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || statusFilter !== "ALL" || productFilter !== "ALL"
                  ? "Try resetting your search filter criteria."
                  : "No orders have been submitted in the current tenant circle."}
              </p>
              {(searchQuery || statusFilter !== "ALL" || productFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setProductFilter("ALL");
                  }}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Mobile Card List (shown on mobile < md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusMeta = getFriendlyStatus(order.state);
                  const prodMeta = getFriendlyProduct(order.product);

                  return (
                    <div key={order.order_id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-sky-50 text-sky-700 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">{prodMeta.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{prodMeta.title}</h3>
                            <p className="font-mono text-[11px] text-slate-400 truncate">{order.order_id}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border ${statusMeta.badgeClass}`}
                        >
                          <span className={`material-symbols-outlined text-[13px] ${statusMeta.pulse ? "animate-spin" : ""}`}>
                            {statusMeta.icon}
                          </span>
                          <span>{statusMeta.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <div>
                          <span>Customer: </span>
                          <strong className="text-slate-800">{order.customer_id}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {order.state === "ACTIVE" && (
                          <Link
                            href={`/registrar/orders/${order.order_id}/certificate`}
                            className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 text-center flex items-center justify-center gap-1 apple-press"
                          >
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            <span>Certificate</span>
                          </Link>
                        )}
                        <Link
                          href={`/registrar/orders/${order.order_id}`}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-800 font-semibold text-xs text-center flex items-center justify-center gap-1 apple-press"
                        >
                          <span>Track Order</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (shown on md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Order ID &amp; Ref</th>
                      <th className="py-3 px-4">Service Product</th>
                      <th className="py-3 px-4">Subscriber</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Created Time</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOrders.map((order) => {
                      const statusMeta = getFriendlyStatus(order.state);
                      const prodMeta = getFriendlyProduct(order.product);

                      return (
                        <tr
                          key={order.order_id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <Link
                              href={`/registrar/orders/${order.order_id}`}
                              className="font-mono font-bold text-slate-900 hover:text-sky-600 block"
                            >
                              {order.order_id}
                            </Link>
                            {order.client_order_ref && (
                              <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                                {order.client_order_ref}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-sky-700">
                                {prodMeta.icon}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {prodMeta.title}
                                </span>
                                <span className="text-[10.5px] text-slate-400 font-mono">
                                  {order.product}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-900">{order.customer_id}</div>
                            {order.msisdn && (
                              <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                                {order.msisdn}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                            >
                              <span
                                className={`material-symbols-outlined text-[14px] ${
                                  statusMeta.pulse ? "animate-spin" : ""
                                }`}
                              >
                                {statusMeta.icon}
                              </span>
                              <span>{statusMeta.label}</span>
                            </span>
                          </td>

                          <td className="py-4 px-4 text-slate-500">
                            {order.created_at ? (
                              <>
                                <div>{new Date(order.created_at).toLocaleDateString()}</div>
                                <div className="text-[11px] text-slate-400">
                                  {new Date(order.created_at).toLocaleTimeString()}
                                </div>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              {order.state === "ACTIVE" && (
                                <Link
                                  href={`/registrar/orders/${order.order_id}/certificate`}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 transition-colors inline-flex items-center gap-1 apple-press"
                                  title="View Activation Certificate"
                                >
                                  <span className="material-symbols-outlined text-[15px]">verified</span>
                                  <span className="hidden sm:inline">Certificate</span>
                                </Link>
                              )}
                              <Link
                                href={`/registrar/orders/${order.order_id}`}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1 apple-press"
                              >
                                <span>Track</span>
                                <span className="material-symbols-outlined text-[14px]">
                                  arrow_forward
                                </span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </RegistrarShell>
  );
}

export function SubscriberOrdersView() {
  return (
    <Suspense
      fallback={
        <RegistrarShell>
          <div className="p-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[36px] text-sky-600 animate-spin">
              progress_activity
            </span>
            <p className="mt-2 text-sm font-medium">Loading orders list...</p>
          </div>
        </RegistrarShell>
      }
    >
      <OrdersListContent />
    </Suspense>
  );
}
