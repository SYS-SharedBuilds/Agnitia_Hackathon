"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWorkflowNotifications } from "@/lib/notifications";
import { motion, AnimatePresence } from "motion/react";

interface RegistrarShellProps {
  children: React.ReactNode;
}

export function SubscriberShell({ children }: RegistrarShellProps) {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useWorkflowNotifications();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key (WCAG compliant)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setShowNotifications(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    {
      name: "Dashboard",
      href: "/registrar",
      icon: "grid_view",
      description: "Overview & quick activation actions",
    },
    {
      name: "New Activation",
      href: "/registrar/new-order",
      icon: "add_circle",
      description: "Step-by-step service request builder",
    },
    {
      name: "My Orders",
      href: "/registrar/orders",
      icon: "inventory_2",
      description: "Track status & activation progress",
    },
  ];

  const isCurrentActive = (href: string) => {
    if (href === "/registrar") {
      return pathname === "/registrar";
    }
    return pathname.startsWith(href);
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AP";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0284C7] selection:text-white">
      {/* Exact Visual Target Navigation Bar Matching Screenshot - Apple Translucent Material */}
      <header className="sticky top-0 z-40 apple-material-header transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: SwitchOn Icon, Brand Name, Subscriber Portal Badge, Subtitle */}
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/registrar"
                className="flex items-center gap-3 apple-press focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl p-1"
              >
                {/* Blue Tower Icon in rounded square */}
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-sky-500/25">
                  <span className="material-symbols-outlined text-[24px]">cell_tower</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                      SwitchOn
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/90 leading-normal">
                      Subscriber Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-none">
                    National Telecom Service Registrar
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Dashboard, New Activation, My Orders */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Registrar Navigation">
              {navLinks.map((item) => {
                const active = isCurrentActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium apple-press transition-all ${
                      active
                        ? "bg-sky-50/90 text-sky-800 font-semibold border border-sky-200/80 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        active ? "text-sky-600" : "text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Primary New Activation Button + Notifications Bell + User Profile Capsule */}
            <div className="flex items-center gap-3">
              <Link
                href="/registrar/new-order"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-97 text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all apple-press focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>New Activation</span>
              </Link>

              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/80 apple-press cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
                  aria-label="Workflow Alerts"
                  title="Workflow Alerts"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[420px] max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Workflow Error Alerts</span>
                        <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold">
                          {unreadCount} active
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <span className="material-symbols-outlined text-3xl text-emerald-600 mb-1">check_circle</span>
                          <p className="text-xs font-bold text-slate-800">All workflows healthy</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">No broken activations or error states</p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 transition-colors hover:bg-slate-50 flex flex-col gap-2 ${
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
                                <span className="font-mono text-[10px] text-slate-500">
                                  {item.time}
                                </span>
                              </div>
                              {!item.read && (
                                <button
                                  onClick={() => markAsRead(item.id)}
                                  className="text-slate-400 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
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
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-300 transition-all"
                              >
                                <span className="material-symbols-outlined text-[13px]">report_problem</span>
                                <span>Fallout Queue</span>
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                      <span className="font-mono text-[10px] text-slate-500 font-medium">
                        Unified Orchestration Alert Stream
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Avatar & Accessible Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label="User profile and portal options"
                  className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-full text-slate-800 hover:bg-slate-100/80 border border-slate-200/80 apple-press cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                    {userInitials}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 hidden sm:inline">
                      {user?.name || "Aanya Patel"}
                    </span>
                    <span className="text-[10px] font-mono text-sky-700 font-bold hidden lg:inline">
                      ({user?.role?.toUpperCase() || "REGISTRAR"})
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${
                      profileMenuOpen ? "rotate-180 text-sky-600" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Profile Dropdown Menu - Apple Spring Animation (WWDC §3 & §4) */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      key="profile-dropdown"
                      initial={{ opacity: 0, scale: 0.96, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -6 }}
                      transition={{ type: "spring", bounce: 0, duration: 0.22 }}
                      role="menu"
                      aria-orientation="vertical"
                      className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl text-slate-900 rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 origin-top-right"
                    >
                      {/* User Profile Details */}
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {userInitials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {user?.name || "Aanya Patel"}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {user?.email || "aanya.patel@bharat-telecom.in"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-500">Tenant Circle</span>
                          <span className="font-mono text-slate-700 font-semibold truncate max-w-[130px]" title={user?.organization}>
                            DL-14 Circle
                          </span>
                        </div>
                      </div>

                      {/* Portal Switcher & Actions */}
                      <div className="px-2 py-1.5">
                        <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Switch Interface
                        </p>
                        <Link
                          href="/"
                          onClick={() => setProfileMenuOpen(false)}
                          role="menuitem"
                          className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 hover:text-slate-950 font-medium transition-colors group cursor-pointer apple-press"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-700">
                              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">Switch to Admin Portal</div>
                              <div className="text-[10px] text-slate-500">NOC command &amp; diagnostics</div>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                            arrow_forward
                          </span>
                        </Link>

                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            switchRole("registrar");
                          }}
                          role="menuitem"
                          className="w-full text-left px-2.5 py-2 text-xs rounded-xl bg-sky-50 text-sky-900 font-semibold flex items-center justify-between mt-1 cursor-default"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                              <span className="material-symbols-outlined text-[18px]">badge</span>
                            </div>
                            <div>
                              <div>Registrar Portal</div>
                              <div className="text-[10px] text-sky-600 font-normal">Active session view</div>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[18px] text-sky-600">check_circle</span>
                        </button>
                      </div>

                      {/* Sign Out / Change Persona */}
                      <div className="px-2 pt-1 border-t border-slate-100">
                        <Link
                          href="/login"
                          onClick={() => {
                            logout();
                            setProfileMenuOpen(false);
                          }}
                          role="menuitem"
                          className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-700 flex items-center gap-2.5 transition-colors cursor-pointer apple-press"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">logout</span>
                          <span>Sign out / Change Persona</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu toggle for drawer */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 apple-press"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {mobileMenuOpen ? "close" : "menu"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer with Motion Spring Animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.28 }}
              className="md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 overflow-hidden"
            >
              {navLinks.map((item) => {
                const active = isCurrentActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium apple-press ${
                      active
                        ? "bg-sky-50 text-sky-800 font-semibold border border-sky-200/90"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-sky-600">
                      {item.icon}
                    </span>
                    <div>
                      <div>{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.description}</div>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href="/registrar/new-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm apple-press shadow-xs"
                >
                  + Start New Service Activation
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    switchRole("admin");
                  }}
                  className="w-full text-center py-2 rounded-xl bg-slate-100 text-slate-800 font-medium text-xs hover:bg-slate-200 apple-press"
                >
                  Switch to Admin / NOC Portal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Page Body (mobile-first safe padding with room for bottom bar on small devices) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Apple-style Mobile Bottom Tab Bar (WWDC §1, §4, §12 - fixed bottom, fluid tactile feedback) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 apple-tab-bar px-3 pt-2 pb-5 transition-transform"
      >
        <div className="grid grid-cols-3 max-w-md mx-auto items-center">
          {navLinks.map((item) => {
            const active = isCurrentActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-2xl apple-press transition-colors ${
                  active ? "text-sky-600 font-semibold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                    active ? "bg-sky-100/90 text-sky-600" : "text-slate-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Clean Footer (hidden on small mobile to avoid clutter behind bottom tab bar) */}
      <footer className="hidden md:block bg-white border-t border-slate-200/80 py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>SwitchOn Telecom Gateway Service · Public Registrar Interface</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Zero-Downtime Saga Orchestration</span>
            <span>·</span>
            <span className="font-mono text-slate-400">v2.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
