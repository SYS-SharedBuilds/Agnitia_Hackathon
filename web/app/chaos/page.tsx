"use client";

import { useState } from "react";
import { Cpu, Play, Flame, RefreshCw, CheckCircle2 } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  desc: string;
  expected: string;
}

const SCENARIOS: Scenario[] = [
  { id: "S1", name: "S1: Happy Path", desc: "All systems succeed without errors.", expected: "ACTIVE (~4s)" },
  { id: "S2", name: "S2: Transient Network 503", desc: "Network returns 503 twice, retries succeed.", expected: "ACTIVE (Retries)" },
  { id: "S3", name: "S3: Inventory Out of Stock", desc: "Fast business error rejection.", expected: "ROLLED_BACK (No retry)" },
  { id: "S4", name: "S4: Network Provision Failure", desc: "Network fails permanently, reverses inventory & billing.", expected: "ROLLED_BACK (Compensated)" },
  { id: "S5", name: "S5: Billing Failure Post-Verify", desc: "Billing fails after network is active. Sagas deprovision network.", expected: "ROLLED_BACK" },
  { id: "S6", name: "S6: Compensation Failure", desc: "Compensation activity fails after max retries.", expected: "NEEDS_ATTENTION" },
  { id: "S8", name: "S8: Duplicate Order Ref", desc: "Idempotent submit with duplicate client ref.", expected: "Same Order (202)" },
  { id: "S9", name: "S9: Operator Cancellation", desc: "Order cancelled mid-flight by operator.", expected: "CANCELLED" },
  { id: "S10", name: "S10: 100 Orders Chaos Load", desc: "20% simulated failure mix across 100 orders.", expected: "Invariants PASS" },
];

export default function ChaosPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const triggerScenario = async (sc: Scenario) => {
    setRunning(sc.id);
    setResult(null);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiHost}/demo/scenarios/${sc.id}`, { method: "POST" });
      setResult(await res.json());
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setRunning(null);
    }
  };

  const resetAllChaos = async () => {
    try {
      const ports = [8101, 8102, 8103, 8104, 8105];
      for (const p of ports) {
        await fetch(`http://localhost:${p}/admin/chaos`, { method: "DELETE" }).catch(() => {});
      }
      setResult({ status: "All mock chaos reset to none" });
    } catch (e: any) {
      setResult({ error: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chaos & Scenario Runner</h1>
          <p className="text-sm text-slate-400">One-click reproducible failure mode demonstrations and load injection.</p>
        </div>
        <button
          onClick={resetAllChaos}
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reset All Chaos</span>
        </button>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((sc) => (
          <div key={sc.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-100">{sc.name}</h3>
                <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  {sc.expected}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">{sc.desc}</p>
            </div>

            <button
              onClick={() => triggerScenario(sc)}
              disabled={running !== null}
              className="mt-4 w-full inline-flex items-center justify-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{running === sc.id ? "Running..." : "Run Scenario"}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Scenario Output</h3>
          <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
