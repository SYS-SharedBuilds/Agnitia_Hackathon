"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";

interface TaskDef {
  id: string;
  system: string;
  action: string;
  depends_on: string[];
  compensation?: string;
  read_only?: boolean;
  best_effort?: boolean;
}

interface Product {
  product: string;
  name: string;
  version: number;
  description: string;
  tasks: TaskDef[];
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiHost}/catalog/products`);
        if (res.ok) setProducts(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Task Graph Catalog</h1>
        <p className="text-sm text-slate-400">Declarative YAML-driven task graphs defining forward execution and saga compensations.</p>
      </div>

      <div className="space-y-6">
        {products.map((p) => (
          <div key={p.product} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-bold text-slate-100">{p.name}</h2>
                  <span className="text-xs font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                    {p.product} v{p.version}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {p.tasks.map((t, idx) => (
                <div key={t.id} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
                  <div className="flex justify-between text-slate-400 font-mono">
                    <span className="text-emerald-400 font-semibold">{idx + 1}. {t.system}</span>
                    <span>{t.action}</span>
                  </div>
                  <div className="font-bold text-slate-200 mt-1">{t.id}</div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    <div>Deps: {t.depends_on.length > 0 ? t.depends_on.join(", ") : "None"}</div>
                    <div className="text-purple-400">Undo: {t.compensation || (t.read_only ? "Read-Only" : "Best-Effort")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
