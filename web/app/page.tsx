"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MetricsSummary, Order } from "@/lib/types";
import { getOrderStateBadgeClass } from "@/lib/stateColors";
import { Activity, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Plus } from "lucide-react";

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [mRes, oRes] = await Promise.all([
        fetch(`${apiHost}/metrics/summary`),
        fetch(`${apiHost}/orders?limit=25`),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activation Control Plane</h1>
          <p className="text-sm text-slate-400">Live order saga state, latency KPIs and active orchestrations.</p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Order</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2">
            {metrics?.success_rate ?? 100}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Clean Rollback: {metrics?.clean_rollback_rate ?? 100}%</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>p95 Activation Time</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2">
            {metrics ? (metrics.p95_activation_ms / 1000).toFixed(2) : "0.00"}s
          </div>
          <p className="text-xs text-slate-400 mt-1">p50: {metrics ? (metrics.p50_activation_ms / 1000).toFixed(2) : "0.00"}s</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>In-Flight Sagas</span>
            <ArrowUpRight className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mt-2">
            {metrics?.in_flight_orders ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total Processed: {metrics?.total_orders ?? 0}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Needs Attention</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-400 mt-2">
            {metrics?.needs_attention_orders ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Rolled Back: {metrics?.rolled_back_orders ?? 0}</p>
        </div>
      </div>

      {/* Live Orders Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-semibold text-base text-slate-200">Recent Service Orders</h2>
          <span className="text-xs text-slate-400 font-mono">Live Sync (Polling/SSE)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No orders found. Click &apos;New Order&apos; or run demo scenarios.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-200">{o.order_id}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{o.customer_id}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">{o.product}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getOrderStateBadgeClass(o.state)}`}>
                        {o.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {o.activation_ms ? `${(o.activation_ms / 1000).toFixed(2)}s` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${o.order_id}`}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1"
                      >
                        <span>View DAG</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
