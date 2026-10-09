"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  severity: "info" | "warning" | "critical" | "success";
  orderRef?: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Order activation completed",
    detail: "ORD-20260712-004216 completed activation in 4.1s. All 8 tasks verified.",
    time: "2m ago",
    severity: "success",
    orderRef: "ORD-20260712-004216",
    read: false,
  },
  {
    id: "notif-2",
    title: "Activation retry occurred",
    detail: "ORD-20260712-004215 retrying step 4 (HLR lock) attempt #2.",
    time: "6m ago",
    severity: "warning",
    orderRef: "ORD-20260712-004215",
    read: false,
  },
  {
    id: "notif-3",
    title: "Compensation requires operator attention",
    detail: "ORD-20260712-004217 halted at Deprovision Network (5/5 retries exhausted).",
    time: "10m ago",
    severity: "critical",
    orderRef: "ORD-20260712-004217",
    read: false,
  },
  {
    id: "notif-4",
    title: "Order rolled back cleanly",
    detail: "ORD-20260712-004211 compensation completed. Tombstone token recorded.",
    time: "18m ago",
    severity: "info",
    orderRef: "ORD-20260712-004211",
    read: true,
  },
  {
    id: "notif-5",
    title: "Certificate verification completed",
    detail: "Cryptographic Merkle log verified zero orphaned state records.",
    time: "25m ago",
    severity: "success",
    read: true,
  },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const navItems = [
    { name: "Overview", href: "/", pathKey: "overview", icon: "grid_view" },
    { name: "Orders", href: "/orders", pathKey: "orders", icon: "receipt_long" },
    { name: "New Order", href: "/new", pathKey: "new-order", icon: "add_circle" },
    { name: "Fallout Queue", href: "/fallout", pathKey: "fallout-queue", icon: "report_problem", badge: "14", badgeColor: "bg-[#eef3f9] text-[#0A1B2E] border-[#0A1B2E]" },
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
    <div className="min-h-screen bg-[#F8FAFC] font-body-md text-[#0F172A] antialiased flex flex-col">
      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Pure White with Crisp Border and Light Hover */}
      <aside
        className={`fixed left-0 top-0 h-full w-[240px] 2xl:w-[260px] bg-white border-r border-[#E2E8F0] z-50 flex flex-col justify-between select-none shadow-xs transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Version */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#E2E8F0] shrink-0 bg-white">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#1D4ED8] transition-colors">
                ⚡
              </div>
              <span className="font-headline-sm text-headline-sm text-[#0F172A] tracking-tight font-bold">
                SwitchOn
              </span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm bg-white text-[#0F172A] px-1.5 py-0.5 rounded font-mono font-semibold border border-[#E2E8F0]">
                v2.4
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-[#475569] hover:text-[#0F172A] rounded-md"
                aria-label="Close navigation"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-none bg-white">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    active
                      ? "bg-[#F8FAFC] text-[#0A1B2E] font-semibold border-l-4 border-[#0A1B2E] shadow-2xs"
                      : "text-body-md font-body-md text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0A1B2E]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-[19px] ${active ? "text-[#0A1B2E]" : "text-[#64748B]"}`}>
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
            <span className="font-label-sm text-label-sm font-semibold bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2 py-0.5 rounded-full">
              DEMO MODE
            </span>
            <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-[#64748B]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A1B2E]"></span>
              </span>
              <span className="font-label-sm text-label-sm">Live · SSE</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-1 border-t border-[#F1F5F9]">
            <div className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] text-[#0A1B2E] flex items-center justify-center font-bold text-xs shrink-0">
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
      <div className="md:pl-[240px] 2xl:md:pl-[260px] flex-1 flex flex-col min-h-screen bg-white min-w-0">
        {/* Top Header - Pure White */}
        <header className="fixed top-0 left-0 md:left-[240px] 2xl:md:left-[260px] right-0 h-14 bg-white border-b border-[#E2E8F0] z-40 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-[#64748B] hover:text-[#0A1B2E] hover:bg-[#F8FAFC] rounded-lg transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-body-md font-body-md text-[#64748B] min-w-0 truncate">
              <Link href="/" className="hover:text-[#0A1B2E] transition-colors cursor-pointer font-medium shrink-0">
                SwitchOn
              </Link>
              <span className="text-[#CBD5E1]">/</span>
              <span className="hover:text-[#0A1B2E] transition-colors cursor-pointer font-medium hidden md:inline truncate">
                Service Orchestration
              </span>
              <span className="text-[#CBD5E1] hidden md:inline">/</span>
              <span className="font-headline-sm text-headline-sm text-[#0A1B2E] font-semibold truncate">
                Overview
              </span>
            </div>
            <div className="sm:hidden font-headline-sm text-headline-sm text-[#0A1B2E] font-bold">
              SwitchOn
            </div>
          </div>

          <div className="flex-1 max-w-[420px] mx-1 sm:mx-4 hidden lg:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#94A3B8] text-[18px]">
                search
              </span>
              <input
                className="w-full h-9 pl-9 pr-3 text-body-sm font-body-md bg-white border border-[#CBD5E1] rounded-lg text-[#0A1B2E] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#0A1B2E] focus:ring-1 focus:ring-[#0A1B2E] transition-all"
                placeholder="Search order ID, customer, MSISDN… ⌘K"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden xl:inline-flex items-center gap-1.5 bg-white text-[#0A1B2E] border border-[#CBD5E1] px-2.5 py-1 rounded-full font-label-sm text-label-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
              <span>us-east-core: HEALTHY</span>
            </div>
            <a
              className="hidden sm:inline-flex items-center gap-1 text-label-sm font-label-sm text-[#0A1B2E] hover:text-[#14263b] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] px-2.5 py-1 rounded-lg transition-colors font-medium shadow-2xs"
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
                className="relative p-1.5 text-[#64748B] hover:text-[#0A1B2E] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#0A1B2E] border border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-none bg-white rounded-xl shadow-xl border border-[#CBD5E1] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-sm font-bold text-[#0A1B2E]">Notifications</span>
                      <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded-full bg-white text-[#0A1B2E] border border-[#CBD5E1] font-semibold">
                        {notifications.filter((n) => !n.read).length} new
                      </span>
                    </div>
                    {notifications.some((n) => !n.read) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11.5px] font-medium text-[#0A1B2E] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F5F9]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-[#64748B]">
                        <span className="material-symbols-outlined text-3xl text-[#94A3B8] mb-1">notifications_off</span>
                        <p className="text-body-sm font-medium">No notifications</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">All order events are up to date</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 transition-colors hover:bg-[#F8FAFC] flex items-start gap-3 ${
                            item.read ? "bg-white opacity-80" : "bg-[#F8FAFC]/50"
                          }`}
                        >
                          <span
                            className={`p-1.5 rounded-lg shrink-0 ${
                              item.severity === "critical"
                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                : item.severity === "warning"
                                ? "bg-[#FEF3C7] text-[#D97706]"
                                : "bg-[#F1F5F9] text-[#0A1B2E]"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {item.severity === "critical"
                                ? "warning"
                                : item.severity === "warning"
                                ? "refresh"
                                : item.severity === "success"
                                ? "verified"
                                : "info"}
                            </span>
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-body-sm font-semibold text-[#0A1B2E] truncate">
                                {item.title}
                              </span>
                              <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] leading-snug mb-1.5">
                              {item.detail}
                            </p>
                            <div className="flex items-center justify-between text-[11px]">
                              {item.orderRef ? (
                                <Link
                                  href={`/orders/${item.orderRef}`}
                                  onClick={() => setShowNotifications(false)}
                                  className="font-mono text-[#0A1B2E] font-medium hover:underline flex items-center gap-0.5"
                                >
                                  <span>{item.orderRef}</span>
                                  <span className="material-symbols-outlined text-[12px]">north_east</span>
                                </Link>
                              ) : <span />}
                              {!item.read && (
                                <button
                                  onClick={() => handleMarkItemRead(item.id)}
                                  className="text-[#64748B] hover:text-[#0A1B2E] text-[10.5px]"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
                    <span className="font-mono text-[10.5px] text-[#64748B]">
                      Demo Notification Stream · Sync: 2026-07-12
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative pt-18 sm:pt-20 px-3 sm:px-6 lg:px-8 pb-10 min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex-1 text-[#0F172A] max-w-[2400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
