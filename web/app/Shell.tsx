"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/", pathKey: "overview", icon: "grid_view" },
    { name: "Orders", href: "/orders", pathKey: "orders", icon: "receipt_long" },
    { name: "New Order", href: "/new", pathKey: "new-order", icon: "add_circle" },
    { name: "Fallout Queue", href: "/fallout", pathKey: "fallout-queue", icon: "report_problem", badge: "14", badgeColor: "bg-[#eef3f9] text-[#0A1B2E] border-[#557392]" },
    { name: "Metrics", href: "/metrics", pathKey: "metrics", icon: "monitoring" },
    { name: "Scenarios & Proof", href: "/proof", pathKey: "scenarios-proof", icon: "verified" },
    { name: "Reconciler", href: "/reconciler", pathKey: "reconciler", icon: "sync_alt" },
    { name: "Systems & Chaos", href: "/chaos", pathKey: "systems-chaos", icon: "hub" },
    { name: "Catalog", href: "/catalog", pathKey: "catalog", icon: "menu_book" },
    { name: "Design System", href: "/design-system", pathKey: "design-system", icon: "palette" },
  ];

  const isActive = (itemHref: string) => {
    if (itemHref === "/") return pathname === "/";
    return pathname.startsWith(itemHref);
  };

  return (
    <div className="min-h-screen bg-white font-body-md text-[#0A1B2E] antialiased flex flex-col">
      {/* Sidebar - Pure White with Crisp Border and Light Hover */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#E2E8F0] z-50 flex flex-col justify-between select-none shadow-xs">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Version */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#E2E8F0] shrink-0 bg-white">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#1D4ED8] transition-colors">
                ⚡
              </div>
              <span className="font-headline-sm text-headline-sm text-[#0A1B2E] tracking-tight font-bold">
                SwitchOn
              </span>
            </Link>
            <span className="font-label-sm text-label-sm bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-mono font-semibold border border-[#BFDBFE]">
              v2.4
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-none bg-white">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    active
                      ? "bg-[#EFF6FF] text-[#2563EB] font-semibold border-l-4 border-[#2563EB] shadow-2xs"
                      : "text-body-md font-body-md text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0A1B2E]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-[19px] ${active ? "text-[#2563EB]" : "text-[#64748B]"}`}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`font-label-sm text-label-sm font-bold px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-3 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-semibold bg-[#F1F5F9] text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full">
              DEMO MODE
            </span>
            <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-[#64748B]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
              </span>
              <span className="font-label-sm text-label-sm">Live · SSE</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-1 border-t border-[#F1F5F9]">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
              AS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-md text-body-md font-semibold text-[#0A1B2E] truncate">
                Aarav Sharma
              </span>
              <span className="font-body-sm text-body-sm text-[#64748B] truncate">
                Lead Orchestrator
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="pl-[240px] flex-1 flex flex-col min-h-screen bg-white">
        {/* Top Header - Pure White */}
        <header className="fixed top-0 left-[240px] right-0 h-14 bg-white border-b border-[#E2E8F0] z-40 px-6 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-body-md font-body-md text-[#64748B]">
            <Link href="/" className="hover:text-[#0A1B2E] transition-colors cursor-pointer font-medium">
              SwitchOn
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="hover:text-[#0A1B2E] transition-colors cursor-pointer font-medium">
              Service Orchestration
            </span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold">
              Overview
            </span>
          </div>

          <div className="flex-1 max-w-[420px] mx-4">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#94A3B8] text-[18px]">
                search
              </span>
              <input
                className="w-full h-9 pl-9 pr-3 text-body-sm font-body-md bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0A1B2E] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                placeholder="Search order ID, customer, MSISDN… ⌘K"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-[#F1F5F9] text-[#0A1B2E] border border-[#E2E8F0] px-2.5 py-1 rounded-full font-label-sm text-label-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]"></span>
              <span>us-east-core: HEALTHY</span>
            </div>
            <a
              className="inline-flex items-center gap-1 text-label-sm font-label-sm text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] px-2.5 py-1 rounded-lg transition-colors font-medium shadow-2xs"
              href="http://localhost:8233"
              target="_blank"
              rel="noreferrer"
            >
              <span>Temporal UI</span>
              <span className="material-symbols-outlined text-[14px]">north_east</span>
            </a>
            <button className="relative p-1.5 text-[#64748B] hover:text-[#0A1B2E] rounded-lg hover:bg-[#F1F5F9] transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#2563EB] border border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative pt-14 min-h-[calc(100vh-56px)] bg-white p-6 flex-1 text-[#0A1B2E]">
          {children}
        </main>
      </div>
    </div>
  );
}
