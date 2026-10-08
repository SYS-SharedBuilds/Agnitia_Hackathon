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
    <div className="min-h-screen bg-[#F2F6FB] font-body-md text-black antialiased flex flex-col">
      {/* Sidebar - Structural Deep Navy */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#0A1B2E] border-r border-[#557392]/30 z-50 flex flex-col justify-between select-none shadow-sm">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Version */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#557392]/30 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#557392] text-white flex items-center justify-center font-bold text-base shadow-sm">
                ⚡
              </div>
              <span className="font-headline-sm text-headline-sm text-white tracking-tight font-semibold">
                SwitchOn
              </span>
            </Link>
            <span className="font-label-sm text-label-sm bg-[#557392]/20 text-[#F2F6FB] px-1.5 py-0.5 rounded border border-[#557392]/50">
              v2.4
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-none">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-[#557392] text-white border-l-4 border-white font-semibold shadow-xs"
                      : "text-body-md font-body-md text-[#F2F6FB]/80 hover:bg-[#557392]/40 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">
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
        <div className="p-3 border-t border-[#557392]/30 space-y-3 shrink-0 bg-[#0A1B2E]">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-semibold bg-[#557392]/30 text-white border border-[#557392]/50 px-2 py-0.5 rounded-full">
              DEMO MODE
            </span>
            <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-[#F2F6FB]/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#557392] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#557392]"></span>
              </span>
              <span className="font-label-sm text-label-sm">Live · SSE</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-1 border-t border-[#557392]/30">
            <div className="w-8 h-8 rounded-full bg-[#557392] border border-[#557392] text-white flex items-center justify-center font-bold text-xs shrink-0">
              AS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-md text-body-md font-medium text-white truncate">
                Aarav Sharma
              </span>
              <span className="font-body-sm text-body-sm text-[#F2F6FB]/70 truncate">
                Lead Orchestrator
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="pl-[240px] flex-1 flex flex-col min-h-screen">
        {/* Top Header - Structural Deep Navy */}
        <header className="fixed top-0 left-[240px] right-0 h-14 bg-[#0A1B2E] border-b border-[#557392]/30 z-40 px-6 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-body-md font-body-md text-[#F2F6FB]/80">
            <Link href="/" className="hover:text-white transition-colors cursor-pointer">
              SwitchOn
            </Link>
            <span className="text-[#557392]">/</span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Service Orchestration
            </span>
            <span className="text-[#557392]">/</span>
            <span className="font-headline-sm text-headline-sm text-white font-semibold">
              Overview
            </span>
          </div>

          <div className="flex-1 max-w-[420px] mx-4">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#557392] text-[18px]">
                search
              </span>
              <input
                className="w-full h-9 pl-9 pr-3 text-body-sm font-body-md bg-[#0A1B2E] border border-[#557392] rounded-lg text-white placeholder:text-[#F2F6FB]/50 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                placeholder="Search order ID, customer, MSISDN… ⌘K"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-[#557392]/20 text-[#F2F6FB] border border-[#557392]/50 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#557392]"></span>
              <span>us-east-core: HEALTHY</span>
            </div>
            <a
              className="inline-flex items-center gap-1 text-label-sm font-label-sm text-white hover:text-[#F2F6FB] bg-[#557392]/30 border border-[#557392]/60 px-2.5 py-1 rounded-lg transition-colors font-medium"
              href="http://localhost:8233"
              target="_blank"
              rel="noreferrer"
            >
              <span>Temporal UI</span>
              <span className="material-symbols-outlined text-[14px]">north_east</span>
            </a>
            <button className="relative p-1.5 text-[#F2F6FB]/80 hover:text-white rounded-lg hover:bg-[#557392]/30 transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#557392] border border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative pt-14 min-h-[calc(100vh-56px)] bg-[#F2F6FB] p-6 flex-1 text-black">
          {children}
        </main>
      </div>
    </div>
  );
}
