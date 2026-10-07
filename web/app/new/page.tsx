"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [product, setProduct] = useState("FIBER_500");
  const [customerId, setCustomerId] = useState("CUST-99201");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiHost}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_order_ref: `ref_${Date.now()}`,
          customer_id: customerId,
          product: product,
          site_address: "45 Market St, Suite 400",
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit order");
      }
      const data = await res.json();
      router.push(`/orders/${data.order_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit Service Order</h1>
        <p className="text-sm text-slate-400">Initiate a new durable telecom service activation workflow.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Product Catalog</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="FIBER_500">Fiber Broadband 500Mbps (FIBER_500)</option>
            <option value="MOBILE_5G">5G Postpaid Mobile (MOBILE_5G)</option>
            <option value="ESIM_ADDON">eSIM Add-on Service (ESIM_ADDON)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Customer ID</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <span>{submitting ? "Submitting Order..." : "Activate Service"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
