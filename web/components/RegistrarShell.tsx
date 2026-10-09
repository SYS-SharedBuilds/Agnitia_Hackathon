"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

interface RegistrarShellProps {
  children: React.ReactNode;
}

export function RegistrarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const navLinks = [
    {
      name: "Dashboard",
      href: "/registrar",
      icon: "dashboard",
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0284C7] selection:text-white">
      {/* Top Banner: Clear Simulation / Dev Indicator */}
      <div className="bg-[#0F172A] text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px] font-semibold border border-sky-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            REGISTRAR PORTAL
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Subscriber &amp; Partner Self-Service Experience
          </span>
          <span className="text-amber-300/90 text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 font-mono hidden md:inline">
            Simulated Auth Session · Tenant: {user?.organization || "Partner Circle DL-14"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-md text-[11.5px] border border-slate-700 transition-colors cursor-pointer"
              title="Switch demo persona"
            >
              <span className="material-symbols-outlined text-[15px] text-sky-400">swap_horiz</span>
              <span className="font-medium">Switch to Admin Portal</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {showRoleDropdown && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                onClick={() => setShowRoleDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Demo Role Switcher
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Toggle between the dual application interfaces.
                  </p>
                </div>
                <button
                  onClick={() => switchRole("registrar")}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 flex items-center justify-between text-sky-900 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-sky-600">badge</span>
                    <span>Registrar Portal (Active)</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-sky-600">check</span>
                </button>
                <button
                  onClick={() => switchRole("admin")}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">admin_panel_settings</span>
                    <span>Admin/NOC Command Portal</span>
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-slate-400">arrow_forward</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/login"
            className="text-slate-400 hover:text-slate-200 text-[11.5px] font-medium transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>

      {/* Main Friendly Header & Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-6">
              <Link
                href="/registrar"
                className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">cell_tower</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-900 tracking-tight">
                      SwitchOn
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      Subscriber Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    National Telecom Service Registrar
                  </p>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Registrar Navigation">
                {navLinks.map((item) => {
                  const active = isCurrentActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-sky-50 text-sky-800 font-semibold shadow-2xs border border-sky-200/70"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
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
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              <Link
                href="/registrar/new-order"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>New Activation</span>
              </Link>

              {/* User Profile Pill */}
              <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "AP"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                    {user?.name || "Aanya Patel"}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                    Authorized Registrar
                  </span>
                </div>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Toggle mobile menu"
              >
                <span className="material-symbols-outlined text-[24px]">
                  {mobileMenuOpen ? "close" : "menu"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in fade-in">
            {navLinks.map((item) => {
              const active = isCurrentActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? "bg-sky-50 text-sky-800 font-semibold border border-sky-200"
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
                className="w-full text-center py-2.5 rounded-lg bg-sky-600 text-white font-semibold text-sm"
              >
                + Start New Service Activation
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  switchRole("admin");
                }}
                className="w-full text-center py-2 rounded-lg bg-slate-100 text-slate-800 font-medium text-xs hover:bg-slate-200"
              >
                Switch to Admin / NOC Portal
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>SwitchOn Telecom Gateway Service · Public Registrar Interface</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-800 underline">
              Admin NOC Command
            </Link>
            <span>·</span>
            <span>Zero-Downtime Saga Orchestration</span>
            <span>·</span>
            <span className="font-mono text-slate-400">v2.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
