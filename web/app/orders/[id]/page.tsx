"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Order, OrderEvent, TaskRecord } from "@/lib/types";
import { getOrderStateBadgeClass, getTaskStateColor } from "@/lib/stateColors";
import { Activity, Clock, ShieldAlert, CheckCircle2, RotateCcw, Ban } from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<{ order: Order; tasks: TaskRecord[] } | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [cancelling, setCancelling] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [dRes, eRes] = await Promise.all([
        fetch(`${apiHost}/orders/${id}`),
        fetch(`${apiHost}/orders/${id}/events`),
      ]);
      if (dRes.ok) setData(await dRes.json());
      if (eRes.ok) setEvents(await eRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 1500);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiHost}/orders/${id}/cancel`, { method: "POST" });
      await fetchDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Loading order orchestration details...</div>;
  }

  const { order, tasks } = data;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold font-mono text-slate-100">{order.order_id}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getOrderStateBadgeClass(order.state)}`}>
              {order.state}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Product: <span className="text-slate-200 font-semibold">{order.product}</span> · Customer: <span className="font-mono text-slate-300">{order.customer_id}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {["RECEIVED", "VALIDATED", "IN_PROGRESS"].includes(order.state) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Ban className="h-4 w-4" />
              <span>{cancelling ? "Cancelling..." : "Cancel Order"}</span>
            </button>
          )}
          <a
            href={`${process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8233"}/namespaces/default/workflows/${order.workflow_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <span>Temporal History</span>
          </a>
        </div>
      </div>

      {/* DAG Visualization Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center space-x-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>Task Graph Execution</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {tasks.map((t) => {
            const colors = getTaskStateColor(t.state);
            return (
              <div
                key={t.task_id}
                className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="uppercase font-mono font-semibold">{t.system}</span>
                    <span className="font-mono">att: {t.attempts}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 mt-1">{t.task_id}</h3>
                  {t.last_error && (
                    <p className="text-xs text-rose-400 mt-2 line-clamp-2 bg-rose-950/40 p-1.5 rounded border border-rose-900/40 font-mono">
                      {t.last_error}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
                  <span className={`font-semibold ${colors.text}`}>{t.state}</span>
                  {t.state === "SUCCEEDED" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {t.state === "RETRYING" && <Clock className="h-4 w-4 text-amber-400 animate-spin" />}
                  {t.state === "COMPENSATED" && <RotateCcw className="h-4 w-4 text-slate-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Event Stream Timeline</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No events captured yet.</p>
          ) : (
            events.map((e) => (
              <div key={e.id || e.event_id} className="flex items-start space-x-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                <span className="font-mono text-slate-500">#{e.seq}</span>
                <span className="font-mono text-emerald-400 font-semibold">{e.type}</span>
                {e.task_id && <span className="text-slate-300 font-medium">[{e.task_id}]</span>}
                <span className="text-slate-400 ml-auto font-mono">{new Date(e.ts).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
