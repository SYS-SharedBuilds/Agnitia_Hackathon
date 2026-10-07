import "./globals.css";
import Link from "next/link";
import { Activity, Radio, Cpu, BarChart3, Layers } from "lucide-react";

export const metadata = {
  title: "SwitchOn — Telecom Service Activation Orchestrator",
  description: "Durable saga orchestration control plane for telecom activations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                SwitchOn
              </span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                Telco Sagas
              </span>
            </div>

            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 transition-colors">
                <Activity className="h-4 w-4" />
                <span>Overview</span>
              </Link>
              <Link href="/chaos" className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 transition-colors">
                <Cpu className="h-4 w-4" />
                <span>Chaos & Scenarios</span>
              </Link>
              <Link href="/metrics" className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 transition-colors">
                <BarChart3 className="h-4 w-4" />
                <span>Metrics</span>
              </Link>
              <Link href="/catalog" className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 transition-colors">
                <Layers className="h-4 w-4" />
                <span>Catalog</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
