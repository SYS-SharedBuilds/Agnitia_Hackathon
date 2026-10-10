"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWorkflowNotifications } from "@/lib/notifications";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { adminNotifications, adminUnreadCount, markAsRead, markAllAsRead } = useWorkflowNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // If on subscriber registrar portal or login, let page render its own dedicated layout
  if (pathname.startsWith("/registrar") || pathname === "/login") {
    return <>{children}</>;
  }

  const operationsNav = [
    { name: "Overview", href: "/", pathKey: "overview", icon: "grid_view" },
    {
      name: "Orders",
      href: "/orders",
      pathKey: "orders",
      icon: "receipt_long",
      subItems: [
        { name: "All Orders", href: "/orders", icon: "table_rows" },
        { name: "New Order", href: "/orders/new-orders", icon: "add_circle" },
      ],
    },
    { name: "Fallout Queue", href: "/fallout", pathKey: "fallout-queue", icon: "report_problem", badge: "2", badgeColor: "bg-[#eef3f9] text-[#0A1B2E] border-[#0A1B2E]" },
    { name: "Metrics", href: "/metrics", pathKey: "metrics", icon: "monitoring" },
  ];

  const resilienceNav = [
    { name: "Scenarios & Proof", href: "/proof", pathKey: "scenarios-proof", icon: "verified" },
    { name: "Systems & Chaos", href: "/chaos", pathKey: "systems-chaos", icon: "hub" },
    { name: "Reconciler", href: "/reconciler", pathKey: "reconciler", icon: "sync_alt" },
    { name: "Catalog", href: "/catalog", pathKey: "catalog", icon: "menu_book" },
    { name: "Design System", href: "/design-system", pathKey: "design-system", icon: "palette" },
  ];

  const isActive = (itemHref: string, exact: boolean = false) => {
    if (exact || itemHref === "/") return pathname === itemHref;
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  };

  return (
    <div className="min-h-screen bg-white font-body-md text-[#000000] antialiased flex flex-col">
      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Pure White with Crisp Border and Light Hover */}
      <aside
        className={`fixed left-0 top-0 h-full w-[240px] 2xl:w-[260px] bg-white border-r border-[#CBD5E1] z-50 flex flex-col justify-between select-none shadow-xs transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Version */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#CBD5E1] shrink-0 bg-white">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-neutral-800 transition-colors">
                ⚡
              </div>
              <span className="font-headline-sm text-headline-sm text-[#000000] tracking-tight font-bold">
                SwitchOn
              </span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm bg-white text-[#000000] px-1.5 py-0.5 rounded font-mono font-bold border border-[#CBD5E1]">
                v2.4
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-[#000000] hover:bg-neutral-100 rounded-md"
                aria-label="Close navigation"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none bg-white">
            {/* Live Operations Section */}
            <div>
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Operations
              </div>
              <div className="space-y-1">
                {operationsNav.map((item) => {
                  const active = isActive(item.href);
                  const isOrdersFamily = item.name === "Orders" && (pathname === "/orders" || pathname.startsWith("/orders/"));

                  return (
                    <div key={item.href} className="space-y-0.5">
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                          active && (!item.subItems || pathname === item.href)
                            ? "bg-[#F1F5F9] text-[#000000] font-bold border-l-4 border-[#000000] shadow-2xs"
                            : isOrdersFamily
                            ? "bg-[#F8FAFC] text-[#000000] font-bold"
                            : "text-body-md font-body-md text-[#000000] hover:bg-[#F8FAFC] font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[19px] text-[#000000]">
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className="font-label-sm text-label-sm font-bold px-1.5 py-0.5 rounded-full border border-[#000000] bg-neutral-100 text-[#000000]"
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>

                      {/* Sub-items for Orders */}
                      {item.subItems && (
                        <div className="pl-6 pr-1 py-0.5 space-y-0.5">
                          {item.subItems.map((sub) => {
                            const subActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                  subActive
                                    ? "bg-[#E2E8F0] font-bold text-[#000000]"
                                    : "text-slate-600 hover:text-black hover:bg-[#F1F5F9] font-medium"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  {sub.icon}
                                </span>
                                <span>{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resilience & Engine Tools Section */}
            <div>
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
                <span>Engine & Resilience</span>
                <span className="text-[9px] px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-600 rounded font-mono font-medium">ADMIN</span>
              </div>
              <div className="space-y-1">
                {resilienceNav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        active
                          ? "bg-[#F1F5F9] text-[#000000] font-bold border-l-4 border-[#000000] shadow-2xs"
                          : "text-body-md font-body-md text-[#000000] hover:bg-[#F8FAFC] font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[19px] text-[#000000]">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#CBD5E1] space-y-3 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-bold bg-white text-[#000000] border border-[#CBD5E1] px-2 py-0.5 rounded-full">
              DEMO MODE
            </span>
            <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-[#000000] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#000000] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#000000]"></span>
              </span>
              <span className="font-label-sm text-label-sm font-bold">Live · SSE</span>
            </div>
          </div>
          {/* Interactive Profile Row with Clickable Popover Menu */}
          <div className="relative pt-1 border-t border-[#CBD5E1]" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors text-left cursor-pointer group"
              aria-expanded={profileMenuOpen}
              aria-label="User Profile and Account Menu"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "AS"}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-body-md text-body-md font-bold text-[#000000] truncate">
                  {user?.name || "Aarav Sharma"}
                </span>
                <span className="font-body-sm text-body-sm text-slate-500 font-medium truncate">
                  {user?.role === "admin" ? "Lead Orchestrator (NOC)" : "Authorized Registrar"}
                </span>
              </div>
              <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}>
                expand_less
              </span>
            </button>

            {/* Profile Popover Menu */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-[#CBD5E1] p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-mono font-bold text-slate-900 uppercase">
                      Active Session
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                    {user?.organization || "SwitchOn Central Network Operations Command"}
                  </p>
                </div>

                <Link
                  href="/registrar"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-sky-600">badge</span>
                  <span>Switch to Registrar Portal</span>
                </Link>

                <Link
                  href="/login"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">swap_horiz</span>
                  <span>Switch Account / Persona</span>
                </Link>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-[16px] text-red-600">logout</span>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/registrar"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>Subscriber / Registrar Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="md:pl-[240px] 2xl:md:pl-[260px] flex-1 flex flex-col min-h-screen bg-white min-w-0">
        {/* Top Header - Pure White */}
        <header className="fixed top-0 left-0 md:left-[240px] 2xl:md:left-[260px] right-0 h-14 bg-white border-b border-[#CBD5E1] z-40 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-[#000000] hover:bg-[#F8FAFC] rounded-lg transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-body-md font-body-md text-[#000000] min-w-0 truncate">
              <Link href="/" className="hover:underline transition-colors cursor-pointer font-bold shrink-0 text-[#000000]">
                SwitchOn
              </Link>
              <span className="text-[#000000] font-bold">/</span>
              <span className="hover:underline transition-colors cursor-pointer font-medium hidden md:inline truncate text-[#000000]">
                Service Orchestration
              </span>
              <span className="text-[#000000] hidden md:inline font-bold">/</span>
              <span className="font-headline-sm text-headline-sm text-[#000000] font-bold truncate">
                Overview
              </span>
            </div>
            <div className="sm:hidden font-headline-sm text-headline-sm text-[#000000] font-bold">
              SwitchOn
            </div>
          </div>

          <div className="flex-1 max-w-[420px] mx-1 sm:mx-4 hidden lg:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#000000] text-[18px]">
                search
              </span>
              <input
                className="w-full h-9 pl-9 pr-3 text-body-sm font-body-md bg-white border border-[#CBD5E1] rounded-lg text-[#000000] placeholder:text-[#000000] placeholder:opacity-60 focus:outline-none focus:bg-white focus:border-[#000000] focus:ring-1 focus:ring-[#000000] transition-all font-medium"
                placeholder="Search order ID, customer, MSISDN… ⌘K"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden xl:inline-flex items-center gap-1.5 bg-white text-[#000000] border border-[#CBD5E1] px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#000000]"></span>
              <span>us-east-core: HEALTHY</span>
            </div>
            <a
              className="hidden sm:inline-flex items-center gap-1 text-label-sm font-label-sm text-[#000000] hover:bg-[#F8FAFC] bg-white border border-[#CBD5E1] px-2.5 py-1 rounded-lg transition-colors font-bold shadow-2xs"
              href={process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8233"}
              target="_blank"
              rel="noreferrer"
            >
              <span>Temporal UI</span>
              <span className="material-symbols-outlined text-[14px]">north_east</span>
            </a>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 text-[#000000] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                aria-label="Workflow Notifications"
                title="Workflow Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                    {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[440px] max-w-md sm:max-w-none bg-white rounded-xl shadow-2xl border border-[#CBD5E1] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 bg-white border-b border-[#CBD5E1] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-sm font-bold text-[#000000]">Workflow Alerts & Breakages</span>
                      <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-black">
                        {adminUnreadCount} active
                      </span>
                    </div>
                    {adminUnreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11.5px] font-bold text-slate-600 hover:text-black hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto divide-y divide-[#CBD5E1]">
                    {adminNotifications.length === 0 ? (
                      <div className="p-8 text-center text-[#000000]">
                        <span className="material-symbols-outlined text-3xl text-emerald-600 mb-1">check_circle</span>
                        <p className="text-body-sm font-bold">No broken workflows</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">All order DAGs running normally without errors</p>
                      </div>
                    ) : (
                      adminNotifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 transition-colors hover:bg-[#F8FAFC] flex flex-col gap-2 ${
                            !item.read ? "bg-red-50/20" : "bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  item.channel === "registrar"
                                    ? "bg-sky-100 text-sky-800 border border-sky-300"
                                    : "bg-slate-100 text-slate-800 border border-slate-300"
                                }`}
                              >
                                {item.source}
                              </span>
                              <span className="font-mono text-xs font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                {item.orderRef}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 font-medium">
                                {item.time}
                              </span>
                            </div>
                            {!item.read && (
                              <button
                                onClick={() => markAsRead(item.id)}
                                className="text-slate-500 hover:text-black text-[10px] font-bold cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-snug">
                              {item.title}
                            </div>
                            <p className="text-[11.5px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                              {item.detail}
                            </p>
                          </div>

                          {/* Quick Inspect & Resolve Action Trigger */}
                          <div className="flex items-center gap-2 pt-1">
                            <Link
                              href={item.inspectUrl}
                              onClick={() => {
                                markAsRead(item.id);
                                setShowNotifications(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 active:scale-97 text-white font-bold text-[11px] shadow-2xs transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">build_circle</span>
                              <span>Inspect & Resolve</span>
                            </Link>

                            <Link
                              href={item.falloutUrl}
                              onClick={() => {
                                markAsRead(item.id);
                                setShowNotifications(false);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-97 text-slate-800 font-semibold text-[11px] border border-slate-300 transition-all"
                            >
                              <span className="material-symbols-outlined text-[13px]">report_problem</span>
                              <span>Fallout Queue</span>
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-[#CBD5E1] text-center">
                    <span className="font-mono text-[10.5px] text-slate-600 font-medium">
                      SwitchOn Unified Orchestration Alert Bus · Live SSE
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative pt-18 sm:pt-20 px-3 sm:px-6 lg:px-8 pb-10 min-h-[calc(100vh-56px)] bg-white flex-1 text-[#000000] max-w-[2400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
