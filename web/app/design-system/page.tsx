"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DesignSystemReferenceBoardPage() {
  const [activeNav, setActiveNav] = useState<"overview" | "foundations" | "components" | "patterns" | "telecom-matrix">("components");
  const [demoSecretType, setDemoSecretType] = useState<"password" | "text">("password");
  const [autoRollbackChecked, setAutoRollbackChecked] = useState(true);
  const [strictIsolationChecked, setStrictIsolationChecked] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState("15m");
  const [viewMode, setViewMode] = useState<"graph" | "yaml" | "rules">("graph");

  return (
    <div className="flex flex-col w-full -m-6 bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* Top Fixed Header */}
      <header className="sticky top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E3E8F0]">
        <div className="h-14 w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[16px]">token</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                SwitchOn Design System &amp; Component Library Reference Board
              </span>
            </div>
            <div className="h-4 w-px bg-outline-variant"></div>
            <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-mono font-medium">
              v2.4.1
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low border border-[#E2E8F0]">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary-container"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">ACTIVE ENGINE</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-5">
              {(["overview", "foundations", "components", "patterns", "telecom-matrix"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveNav(tab)}
                  className={`capitalize transition-colors cursor-pointer text-body-md ${
                    activeNav === tab
                      ? "text-on-surface font-headline-sm font-semibold border-b-2 border-primary pb-0.5"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.replace("-", " ")}
                </button>
              ))}
            </nav>
            <div className="h-4 w-px bg-outline-variant"></div>
            <Link
              href="/"
              className="text-body-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Back to App</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Spec Canvas */}
      <main className="w-full bg-surface min-h-screen">
        <div className="w-full px-8 py-6 flex flex-col gap-6">
          {/* 1. HEADER & META BANNER */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 border border-[#E3E8F0]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider font-mono">
                    DS-SPEC-2025
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    SwitchOn Core Telecommunications Engine
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                  SwitchOn Design System — Master Component Library &amp; Token Spec
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
                  Version v2.4.1 • Single source of truth for the SwitchOn distributed saga execution orchestrator, microservice telemetry matrix, and critical path operational controls. WCAG AA compliant.
                </p>
              </div>

              <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-[#E2E8F0] shrink-0">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">Runtime Target</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Nitro EAL4+ Verified</span>
                </div>
                <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">Safety Invariants</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-semibold">TLA+ Checked (Saga L3)</span>
                </div>
                <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">Baseline Ground</span>
                  <span className="font-label-md text-label-md text-on-surface bg-surface-container-lowest px-2 py-0.5 rounded font-mono shadow-2xs border border-[#CBD5E1]">
                    #FAF8FF / #F6F8FB
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. STATUS PILLS & BADGE SET */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between pb-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Status Pills, Invariant Badges &amp; Port Tags
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                TOKEN: --switchon-pill-matrix-v2
              </span>
            </div>

            {/* Order States */}
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                Order Lifecycle States (Global Execution Status)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {/* PENDING */}
                <span className="h-6 px-3 rounded-full bg-slate-500/10 text-slate-700 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>PENDING
                </span>
                {/* IN_PROGRESS */}
                <span className="h-6 px-3 rounded-full bg-blue-600/10 text-blue-700 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>IN_PROGRESS
                </span>
                {/* SUCCEEDED */}
                <span className="h-6 px-3 rounded-full bg-emerald-600/10 text-emerald-700 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>SUCCEEDED
                </span>
                {/* NEEDS_ATTENTION */}
                <span className="h-6 px-3 rounded-full bg-amber-600/15 text-amber-800 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>NEEDS_ATTENTION
                </span>
                {/* COMPENSATING */}
                <span className="h-6 px-3 rounded-full bg-purple-600/10 text-purple-700 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-purple-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>COMPENSATING
                </span>
                {/* CANCELLED */}
                <span className="h-6 px-3 rounded-full bg-zinc-500/15 text-zinc-700 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-zinc-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>CANCELLED
                </span>
                {/* FAILED */}
                <span className="h-6 px-3 rounded-full bg-rose-600/10 text-rose-700 font-label-sm text-label-sm flex items-center gap-1.5 font-mono border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>FAILED
                </span>
              </div>
            </div>

            {/* Task States */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                DAG Task Micro-States (10 Atomic Transaction States)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "QUEUED", cls: "bg-slate-200 text-slate-800" },
                  { label: "SCHEDULED", cls: "bg-slate-300 text-slate-900" },
                  { label: "RUNNING", cls: "bg-primary/10 text-primary font-bold" },
                  { label: "COMPLETED", cls: "bg-emerald-600/10 text-emerald-800 font-semibold" },
                  { label: "RETRYING", cls: "bg-amber-500/15 text-amber-900 font-semibold" },
                  { label: "COMPENSATING", cls: "bg-purple-600/10 text-purple-800 font-semibold" },
                  { label: "COMPENSATED", cls: "bg-violet-600/10 text-violet-800 font-semibold" },
                  { label: "COMPENSATION_FAILED", cls: "bg-rose-600/15 text-rose-900 font-bold" },
                  { label: "SKIPPED", cls: "bg-zinc-200 text-zinc-600" },
                  { label: "ABORTED", cls: "bg-stone-300 text-stone-800" },
                ].map((st) => (
                  <span key={st.label} className={`h-6 px-2.5 rounded-full font-label-sm text-label-sm font-mono flex items-center ${st.cls}`}>
                    {st.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Telecom Subsystems & Protocol Invariant Badges */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                Subsystem Routing Endpoints &amp; Protocol Tags
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1 font-mono border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px] text-primary">router</span>OMS:8101
                </span>
                <span className="px-2.5 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1 font-mono border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px] text-primary">sim_card</span>SIM_INV:8102
                </span>
                <span className="px-2.5 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1 font-mono border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px] text-primary">cell_tower</span>HLR_HSS:8103
                </span>
                <span className="px-2.5 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1 font-mono border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px] text-primary">payments</span>OCS:8104
                </span>
                <span className="px-2.5 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1 font-mono border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px] text-primary">notifications_active</span>NOTIFY:8105
                </span>
                <span className="px-2.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1 font-mono border border-[#B4C5FF]">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>TLA+_VERIFIED
                </span>
                <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1 font-mono border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px]">security</span>NITRO_EAL4+
                </span>
                <span className="px-2.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1 font-mono border border-[#C7D2FE]">
                  <span className="material-symbols-outlined text-[14px]">account_tree</span>ACID_SAGA_L3
                </span>
              </div>
            </div>
          </section>

          {/* 3. BUTTON SUITE */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">smart_button</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Button Suite &amp; Interactive Action States
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                WCAG 2.1 AA Compliant Contrast
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Col 1: Primary Indigo */}
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-lg border border-[#E2E8F0]">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  1. Primary Indigo
                </span>
                <button className="h-9 px-4 bg-primary hover:bg-surface-tint text-on-primary rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer" type="button">
                  Primary Action
                </button>
                <button className="h-9 px-4 bg-surface-tint text-on-primary rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 shadow-inner" type="button">
                  Hover / Active
                </button>
                <button className="h-9 px-4 bg-primary text-on-primary rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 outline outline-2 outline-offset-2 outline-primary" type="button">
                  Focus State
                </button>
                <button className="h-9 px-4 bg-primary text-on-primary rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 opacity-90 cursor-wait" type="button">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path></svg>
                  <span>Dispatching...</span>
                </button>
                <button className="h-9 px-4 bg-primary/40 text-on-primary rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-not-allowed" disabled type="button">
                  Disabled
                </button>
              </div>

              {/* Col 2: Secondary Slate */}
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-lg border border-[#E2E8F0]">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  2. Secondary Tonal
                </span>
                <button className="h-9 px-4 bg-surface-container-highest hover:bg-surface-dim text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#E2E8F0]" type="button">
                  Secondary
                </button>
                <button className="h-9 px-4 bg-surface-dim text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 shadow-inner" type="button">
                  Hover State
                </button>
                <button className="h-9 px-4 bg-surface-container-highest text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 outline outline-2 outline-offset-2 outline-outline-variant" type="button">
                  Focus Active
                </button>
                <button className="h-9 px-4 bg-surface-container-highest text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-wait" type="button">
                  <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path></svg>
                  <span>Auditing...</span>
                </button>
                <button className="h-9 px-4 bg-surface-container-high/50 text-outline rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-not-allowed" disabled type="button">
                  Disabled
                </button>
              </div>

              {/* Col 3: Outline / Bordered */}
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-lg border border-[#E2E8F0]">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  3. Ghost / Outline
                </span>
                <button className="h-9 px-4 bg-surface-container-lowest text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 shadow-xs hover:bg-surface-container transition-colors cursor-pointer border border-[#CBD5E1]" type="button">
                  Inspect Schema
                </button>
                <button className="h-9 px-4 bg-surface-container text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 border border-[#777587]" type="button">
                  Active Hover
                </button>
                <button className="h-9 px-4 bg-surface-container-lowest text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 outline outline-2 outline-offset-2 outline-primary border border-primary" type="button">
                  Focus Ring
                </button>
                <button className="h-9 px-4 bg-surface-container-lowest text-on-surface rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-wait border border-[#CBD5E1]" type="button">
                  <svg className="animate-spin h-4 w-4 text-on-surface" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path></svg>
                  <span>Verifying</span>
                </button>
                <button className="h-9 px-4 bg-surface-container-lowest text-outline-variant rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-not-allowed border border-[#E2E8F0]" disabled type="button">
                  Disabled
                </button>
              </div>

              {/* Col 4: Destructive Rose */}
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-lg border border-[#E2E8F0]">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  4. Destructive Rollback
                </span>
                <button className="h-9 px-4 bg-error hover:bg-on-error-container text-on-error rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs" type="button">
                  Abort Saga
                </button>
                <button className="h-9 px-4 bg-[#93000a] text-on-error rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 shadow-inner" type="button">
                  Critical Hover
                </button>
                <button className="h-9 px-4 bg-error text-on-error rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 outline outline-2 outline-offset-2 outline-error" type="button">
                  Focus State
                </button>
                <button className="h-9 px-4 bg-error text-on-error rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-wait" type="button">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path></svg>
                  <span>Reversing...</span>
                </button>
                <button className="h-9 px-4 bg-error-container text-error rounded font-body-md text-body-md font-medium flex items-center justify-center gap-2 cursor-not-allowed opacity-60" disabled type="button">
                  Locked
                </button>
              </div>

              {/* Col 5: Scale & Icon Variants */}
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-lg border border-[#E2E8F0]">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  5. Scale &amp; Icon Variants
                </span>
                <button className="h-7 px-2.5 bg-primary text-on-primary rounded font-label-sm text-label-sm font-medium flex items-center gap-1 justify-center cursor-pointer shadow-xs" type="button">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  <span>Fast SM (28px)</span>
                </button>
                <button className="h-9 px-3 bg-surface-container-lowest text-on-surface shadow-xs rounded font-body-md text-body-md font-medium flex items-center justify-between cursor-pointer border border-[#E2E8F0]" type="button">
                  <span className="flex items-center gap-1.5 font-mono text-[13px]">
                    <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>MD Console
                  </span>
                  <span className="material-symbols-outlined text-[14px]">north_east</span>
                </button>
                <button className="h-11 px-4 bg-primary-container text-white rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs font-semibold" type="button">
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  <span>Execute LG (44px)</span>
                </button>
                <div className="flex items-center gap-2 pt-1">
                  {["replay", "content_copy", "open_in_new", "dangerous"].map((icon) => (
                    <button
                      key={icon}
                      className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer border border-[#E2E8F0] ${
                        icon === "dangerous"
                          ? "bg-error-container text-error"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. FORM INPUTS & SELECTS */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">input</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Form Controls, Masked Inputs &amp; Precision Selectors
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                SPEC: 36px BASE HEIGHT • 6px RADIUS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Field 1: Standard & Filled */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  Order ID Filter (Default)
                </label>
                <div className="relative">
                  <input
                    defaultValue="ORD-2026-90412"
                    className="w-full h-9 px-3 bg-surface-container-lowest rounded text-on-surface font-body-md text-body-md border border-[#CBD5E1] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    type="text"
                  />
                  <span className="absolute right-2.5 top-2.5 material-symbols-outlined text-outline text-[16px]">search</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Glob syntax supported (*, ?, prefix)</span>
              </div>

              {/* Field 2: Focused State Showcase */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-primary uppercase font-semibold font-mono">
                  HLR Provisioning Key (Active Focus)
                </label>
                <div className="relative">
                  <input
                    defaultValue="HLR-EAST-SAGA-TX-99801"
                    className="w-full h-9 px-3 bg-surface-container-lowest rounded text-on-surface font-body-md text-body-md border-2 border-primary outline-none font-mono"
                    type="text"
                  />
                  <span className="absolute right-2.5 top-2.5 material-symbols-outlined text-primary text-[16px]">edit</span>
                </div>
                <span className="font-body-sm text-body-sm text-primary">Active cursor in node namespace slot</span>
              </div>

              {/* Field 3: Error State */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-error uppercase font-semibold font-mono">
                  MSISDN Number (Validation Error)
                </label>
                <div className="relative">
                  <input
                    defaultValue="+1-555-0199-ERR"
                    className="w-full h-9 px-3 bg-surface-container-lowest rounded text-on-surface font-body-md text-body-md border-2 border-error outline-none"
                    type="text"
                  />
                  <span className="absolute right-2.5 top-2.5 material-symbols-outlined text-error text-[16px]">error</span>
                </div>
                <span className="font-body-sm text-body-sm text-error">Invalid E.164 ITU-T schema format</span>
              </div>

              {/* Field 4: Masked API Key Input with Toggle */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  OCS Gateway Secret (Masked)
                </label>
                <div className="flex items-center rounded border border-[#CBD5E1] overflow-hidden bg-surface-container-lowest">
                  <span className="px-2.5 h-9 bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center font-mono">
                    OCS_BEARER
                  </span>
                  <input
                    defaultValue="sk_live_telecom_48901bca280ef1"
                    type={demoSecretType}
                    className="flex-1 h-9 px-2.5 bg-surface-container-lowest text-on-surface font-mono font-label-md text-label-md outline-none"
                  />
                  <button
                    onClick={() => setDemoSecretType(demoSecretType === "password" ? "text" : "password")}
                    className="px-2.5 text-outline hover:text-on-surface cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {demoSecretType === "password" ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Rotated 4 days ago by Terraform AWS vault</span>
              </div>

              {/* Field 5: Select Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  Workflow Definition Topology
                </label>
                <div className="relative">
                  <select className="w-full h-9 pl-3 pr-8 bg-surface-container-lowest rounded text-on-surface font-body-md text-body-md border border-[#CBD5E1] focus:border-primary outline-none appearance-none cursor-pointer">
                    <option>eSIM_Activate_V4 (Strict Compensation)</option>
                    <option>Physical_SIM_Port_In_V2 (Relaxed Saga)</option>
                    <option>OCS_Quota_Rebalance_FastPath</option>
                    <option>Enterprise_Pool_Bulk_Allocation</option>
                  </select>
                  <span className="absolute right-2.5 top-2.5 material-symbols-outlined text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Determines fallback compensation policy</span>
              </div>

              {/* Field 6: Segmented Control & Switches */}
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                  Saga Horizon &amp; View Mode
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-surface-container-high p-0.5 rounded border border-[#E2E8F0]">
                    {["15m", "1h", "24h", "7d"].map((rng) => (
                      <button
                        key={rng}
                        onClick={() => setTimeHorizon(rng)}
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-mono cursor-pointer transition-colors ${
                          timeHorizon === rng
                            ? "bg-surface-container-lowest text-primary font-bold shadow-2xs"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                        type="button"
                      >
                        {rng}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center bg-surface-container-high p-0.5 rounded flex-1 justify-around border border-[#E2E8F0]">
                    {(["graph", "yaml", "rules"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold capitalize flex items-center gap-1 cursor-pointer transition-colors ${
                          viewMode === mode
                            ? "bg-surface-container-lowest text-primary shadow-2xs"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                        type="button"
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      checked={autoRollbackChecked}
                      onChange={(e) => setAutoRollbackChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                      type="checkbox"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">Auto-Rollback on 5xx</span>
                  </label>
                  <label
                    onClick={() => setStrictIsolationChecked(!strictIsolationChecked)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Strict Isolation</span>
                    <div className={`w-8 h-4 rounded-full relative p-0.5 flex items-center transition-colors ${
                      strictIsolationChecked ? "bg-primary justify-end" : "bg-slate-300 justify-start"
                    }`}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-2xs"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* 5. NAVIGATION & TABS */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">tab</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Navigation Bars, Tabs &amp; Trace Breadcrumbs
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                ROUTER LEVEL SPEC
              </span>
            </div>

            {/* Breadcrumbs */}
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                Canonical Orchestration Breadcrumb Trail
              </span>
              <nav className="flex items-center gap-2 py-2 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm border border-[#E2E8F0]">
                <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[16px]">dns</span>SwitchOn
                </span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="text-on-surface-variant">Service Orchestration</span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="text-on-surface-variant">Orders Pipeline</span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="text-on-surface font-label-sm text-label-sm font-semibold font-mono bg-surface-container-highest px-2 py-0.5 rounded border border-[#CBD5E1]">
                  ORD-20260712-004217
                </span>
                <span className="material-symbols-outlined text-[14px] text-emerald-600 ml-1">check_circle</span>
              </nav>
            </div>

            {/* Underline Tab Bar */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                Underline Tabs with Metrics
              </span>
              <div className="flex items-center gap-6 border-b border-[#DAE2FD]">
                <button className="pb-2 font-headline-sm text-headline-sm text-primary border-b-2 border-primary flex items-center gap-2 font-semibold cursor-pointer">
                  <span>Saga Execution Graph</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold font-mono">
                    10 Nodes
                  </span>
                </button>
                <button className="pb-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface flex items-center gap-2 transition-colors cursor-pointer">
                  <span>Telemetry Streams</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-mono">
                    84.2k eps
                  </span>
                </button>
                <button className="pb-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface flex items-center gap-2 transition-colors cursor-pointer">
                  <span>Compensation Journal</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-900 font-label-sm text-label-sm font-mono">
                    2 Retried
                  </span>
                </button>
                <button className="pb-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface flex items-center gap-2 transition-colors cursor-pointer">
                  <span>TLA+ Safety Proofs</span>
                </button>
                <button className="pb-2 font-body-md text-body-md text-outline-variant cursor-not-allowed" disabled>
                  <span>Manual Override (Locked)</span>
                </button>
              </div>
            </div>

            {/* Pill Tabs */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                Pill Tabs (Isolated Partition Scopes)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-medium shadow-2xs cursor-pointer font-mono">
                  All Subsystems (5/5)
                </button>
                {["Core OMS (Active)", "SIM Inventory (Pool 12)", "HLR/HSS Cluster (US-East)", "OCS Rating Engine"].map((sys) => (
                  <button
                    key={sys}
                    className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium cursor-pointer border border-[#E2E8F0] font-mono"
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 6. TOASTS & ALERT NOTIFICATIONS */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Toasts, Operational Banners &amp; Invariant Alerts
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                DISPATCH • TRANSIENT • CRITICAL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toast 1: Success */}
              <div className="p-4 rounded-lg bg-surface-container-lowest shadow-md flex items-start justify-between border border-[#BBF7D0]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Order Accepted — 202 Ingested
                      </span>
                      <span className="font-label-sm text-label-sm bg-emerald-600/10 text-emerald-800 px-1.5 rounded font-bold font-mono">
                        ACK
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Ingested to Kafka partition #04 • Saga ID <span className="font-label-sm text-label-sm text-on-surface font-semibold font-mono">019058ac-e2</span>
                    </p>
                  </div>
                </div>
                <button className="text-outline hover:text-on-surface cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Toast 2: Warning */}
              <div className="p-4 rounded-lg bg-surface-container-lowest shadow-md flex items-start justify-between border border-[#FDE68A]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">sync_problem</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Transient Retry Triggered
                      </span>
                      <span className="font-label-sm text-label-sm bg-amber-500/15 text-amber-900 px-1.5 rounded font-bold font-mono">
                        ATTEMPT 2/3
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      OCS rating backoff attempt in progress (jitter 420ms) • downstream port 8104 saturated.
                    </p>
                  </div>
                </div>
                <button className="text-outline hover:text-on-surface cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Banner 1: Error Failure */}
              <div className="p-4 rounded-lg bg-error-container text-on-error-container flex items-start justify-between md:col-span-2 border border-[#FFDAD6]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">report</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-error-container font-semibold">
                        Compensation Failed — Out-of-Band Rollback Halted at Step 4
                      </span>
                      <span className="px-2 py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-semibold uppercase font-mono">
                        FALLOUT ESCALATION
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-error-container mt-1">
                      Subsystem <code className="font-label-sm text-label-sm font-bold font-mono">HLR_HSS:8103</code> rejected inverse release operation. SIM <code className="font-label-sm text-label-sm font-bold font-mono">890141032111234900F</code> remains locked in state <code className="font-label-sm text-label-sm font-bold font-mono">RESERVED_ORPHAN</code>. Operator intervention required.
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 rounded bg-error text-on-error font-body-sm text-body-sm font-medium hover:bg-on-error-container transition-colors cursor-pointer shrink-0">
                  Inspect Journal
                </button>
              </div>

              {/* Banner 2: Formal Invariant PASS */}
              <div className="p-4 rounded-lg bg-surface-container-high flex items-center justify-between md:col-span-2 border border-[#C7D2FE]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Formal Invariants PASS — TLA+ Model Checked
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Liveness Condition ∅ • Safety Rule: “No Double SIM Allocation Without OCS Reservation Ledger” confirmed on 14,280 states.
                    </span>
                  </div>
                </div>
                <span className="font-label-md text-label-md text-secondary font-semibold bg-surface-container-lowest px-3 py-1 rounded shadow-2xs font-mono border border-[#B4C5FF]">
                  PROOF ID #TLA-9921-OK
                </span>
              </div>
            </div>
          </section>

          {/* 7. OVERLAYS & MODALS DIRECTLY DEMONSTRATED */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Modal Dialogs &amp; Slide-Over Resource Inspector
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                LEVEL 3 ELEVATION DEMONSTRATIONS
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Modal 1: Confirm Cancel Order */}
              <div className="p-5 rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between border border-[#E2E8F0]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-error">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Confirm Cancel Order?
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-error-container text-error font-label-sm text-label-sm font-semibold font-mono">
                      IRREVERSIBLE
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Target Saga: <strong className="text-on-surface font-label-sm text-label-sm font-mono">ORD-20260712-004217</strong>. Initiating early cancellation will immediately dispatch compensating inverse tasks:
                  </p>
                  <div className="p-3 rounded bg-surface-container-low flex flex-col gap-2 font-body-sm text-body-sm border border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span>Release SIM Reservation</span>
                      <span className="font-label-sm text-label-sm text-on-surface font-mono">SIM_INV:8102</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600"></span>Refund Pre-Auth Balance</span>
                      <span className="font-label-sm text-label-sm text-on-surface font-mono">$49.00 USD (OCS)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600"></span>Terminate HLR Profile</span>
                      <span className="font-label-sm text-label-sm text-on-surface font-mono">IMSI: 310-410-092</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 bg-surface-container-low p-3 rounded-lg border border-[#E2E8F0]">
                  <button className="px-3 h-8 bg-surface-container-lowest text-on-surface rounded font-body-sm text-body-sm hover:bg-surface-container font-medium cursor-pointer border border-[#E2E8F0]">
                    Abort
                  </button>
                  <button className="px-3 h-8 bg-error hover:bg-on-error-container text-on-error rounded font-body-sm text-body-sm font-medium flex items-center gap-1 shadow-2xs cursor-pointer">
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                    <span>Confirm Rollback</span>
                  </button>
                </div>
              </div>

              {/* Modal 2: Manual Resolve Compensation */}
              <div className="p-5 rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between border border-[#E2E8F0]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">healing</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Manual Resolve Compensation
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-mono">
                      STEP 4/6
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                      Compensation Strategy
                    </label>
                    <select className="w-full h-8 px-2 bg-surface-container-lowest rounded text-on-surface font-body-sm text-body-sm border border-[#CBD5E1]">
                      <option>Force Soft Compensate (Idempotent replay)</option>
                      <option>Mark As Manually Rectified &amp; Skip</option>
                      <option>Inject Synthetic Success Acknowledgment</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                      Audit Idempotency Token
                    </label>
                    <input
                      className="w-full h-8 px-2 bg-surface-container-lowest rounded text-on-surface font-label-md text-label-md font-mono border border-[#CBD5E1]"
                      type="text"
                      defaultValue="REC-TOKEN-098842-HLR-BYPASS"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low border border-[#E2E8F0]">
                    <span className="font-body-sm text-body-sm text-on-surface">Execute Dry-Run First</span>
                    <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox"/>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 bg-surface-container-low p-3 rounded-lg border border-[#E2E8F0]">
                  <button className="px-3 h-8 bg-surface-container-lowest text-on-surface rounded font-body-sm text-body-sm hover:bg-surface-container font-medium cursor-pointer border border-[#E2E8F0]">
                    Cancel
                  </button>
                  <button className="px-3 h-8 bg-primary hover:bg-surface-tint text-on-primary rounded font-body-sm text-body-sm font-medium flex items-center gap-1 shadow-2xs cursor-pointer">
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>Dispatch Action</span>
                  </button>
                </div>
              </div>

              {/* Slide Drawer Preview: Resource Drift Inspector */}
              <div className="p-5 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between border border-[#E2E8F0]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1 bg-surface-container-high px-2 py-1 rounded border border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">difference</span>
                      <span className="font-headline-sm text-[13px] font-semibold text-on-surface">
                        Resource Drift Inspector
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[16px] cursor-pointer">dock_to_left</span>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
                    <span>TARGET: HLR_PROFILE_310</span>
                    <span className="text-rose-700 font-semibold bg-rose-500/10 px-1 rounded">1 DRIFT DETECTED</span>
                  </div>
                  {/* Code Diff Mockup */}
                  <div className="p-2.5 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm font-mono flex flex-col gap-1 shadow-inner border border-[#E2E8F0]">
                    <span className="text-outline">--- Expected Orchestration State</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-500/10 px-1 rounded">+ &quot;status&quot;: &quot;ACTIVE_SUBSCRIBER&quot;</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-500/10 px-1 rounded">+ &quot;imsi_pool&quot;: &quot;US_EAST_01&quot;</span>
                    <span className="text-outline mt-1">+++ Actual Downstream Subsystem State</span>
                    <span className="text-rose-700 font-semibold bg-rose-500/10 px-1 rounded">- &quot;status&quot;: &quot;HLR_UNREACHABLE_TIMEOUT&quot;</span>
                    <span className="text-rose-700 font-semibold bg-rose-500/10 px-1 rounded">- &quot;imsi_pool&quot;: null</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8F0]">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">Sync: 18s ago</span>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 h-7 bg-surface-container-lowest text-on-surface rounded font-label-sm text-label-sm hover:bg-surface-container cursor-pointer border border-[#CBD5E1]">
                      Diff View
                    </button>
                    <button className="px-2.5 h-7 bg-secondary text-on-secondary rounded font-label-sm text-label-sm font-semibold cursor-pointer">
                      Resync Resource
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 8. TABLE ROW STATES */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">table_rows</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Data Table Rows &amp; Interactive Hover/Error States
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                SPEC: 48px ROW HEIGHT • 40px HEADER
              </span>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-[#E2E8F0]">
              <table className="w-full text-left font-body-md text-body-md border-collapse">
                <thead>
                  <tr className="h-10 bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-[#E2E8F0]">
                    <th className="px-4 w-12"><input className="rounded accent-primary" type="checkbox"/></th>
                    <th className="px-4">Saga Task ID</th>
                    <th className="px-4">Subsystem Port</th>
                    <th className="px-4">Status Badge</th>
                    <th className="px-4">Latency</th>
                    <th className="px-4">Worker Host</th>
                    <th className="px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF0F5]">
                  {/* State 1: Standard Neutral Row */}
                  <tr className="h-12 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                    <td className="px-4"><input className="rounded accent-primary" type="checkbox"/></td>
                    <td className="px-4 font-label-sm text-label-sm text-on-surface font-semibold font-mono">TSK-8101-ALLOC-SIM</td>
                    <td className="px-4"><span className="font-label-sm text-label-sm bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface font-mono">SIM_INV:8102</span></td>
                    <td className="px-4">
                      <span className="h-6 px-2.5 rounded-full bg-emerald-600/10 text-emerald-800 font-label-sm text-label-sm inline-flex items-center gap-1 font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>COMPLETED
                      </span>
                    </td>
                    <td className="px-4 font-label-sm text-label-sm text-on-surface-variant font-mono">142ms</td>
                    <td className="px-4 font-body-sm text-body-sm text-on-surface-variant">worker-k8s-pod-east-11</td>
                    <td className="px-4 text-right">
                      <button className="p-1 text-outline hover:text-on-surface cursor-pointer"><span className="material-symbols-outlined text-[16px]">more_vert</span></button>
                    </td>
                  </tr>

                  {/* State 2: Hovered Row */}
                  <tr className="h-12 bg-surface-container-low">
                    <td className="px-4"><input className="rounded accent-primary" type="checkbox"/></td>
                    <td className="px-4 font-label-sm text-label-sm text-primary font-semibold font-mono">TSK-8104-PREAUTH-OCS (Hovered)</td>
                    <td className="px-4"><span className="font-label-sm text-label-sm bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface font-mono">OCS:8104</span></td>
                    <td className="px-4">
                      <span className="h-6 px-2.5 rounded-full bg-blue-600/10 text-blue-700 font-label-sm text-label-sm inline-flex items-center gap-1 font-mono font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>RUNNING
                      </span>
                    </td>
                    <td className="px-4 font-label-sm text-label-sm text-on-surface-variant font-mono">518ms</td>
                    <td className="px-4 font-body-sm text-body-sm text-on-surface">worker-k8s-pod-east-04</td>
                    <td className="px-4 text-right">
                      <button className="p-1 text-primary hover:text-on-surface cursor-pointer"><span className="material-symbols-outlined text-[16px]">play_arrow</span></button>
                    </td>
                  </tr>

                  {/* State 3: Selected Active Row */}
                  <tr className="h-12 bg-primary-fixed/20 relative">
                    <td className="px-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      <input defaultChecked className="rounded accent-primary" type="checkbox"/>
                    </td>
                    <td className="px-4 font-label-sm text-label-sm text-primary font-bold font-mono">TSK-8103-PROVISION-HLR [SELECTED]</td>
                    <td className="px-4"><span className="font-label-sm text-label-sm bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface font-mono">HLR_HSS:8103</span></td>
                    <td className="px-4">
                      <span className="h-6 px-2.5 rounded-full bg-purple-600/10 text-purple-800 font-label-sm text-label-sm inline-flex items-center gap-1 font-mono font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>COMPENSATING
                      </span>
                    </td>
                    <td className="px-4 font-label-sm text-label-sm text-primary font-semibold font-mono">1,024ms</td>
                    <td className="px-4 font-body-sm text-body-sm text-on-surface font-medium">worker-k8s-pod-central-02</td>
                    <td className="px-4 text-right">
                      <button className="px-2 py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm font-medium cursor-pointer shadow-2xs">
                        Inspect
                      </button>
                    </td>
                  </tr>

                  {/* State 4: Error / Flagged Row */}
                  <tr className="h-12 bg-rose-500/10 relative">
                    <td className="px-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600"></div>
                      <input className="rounded accent-primary" type="checkbox"/>
                    </td>
                    <td className="px-4 font-label-sm text-label-sm text-rose-800 font-bold font-mono">TSK-8105-SMS-NOTIFY (HALTED)</td>
                    <td className="px-4"><span className="font-label-sm text-label-sm bg-rose-600/10 px-1.5 py-0.5 rounded text-rose-900 font-mono">NOTIFY:8105</span></td>
                    <td className="px-4">
                      <span className="h-6 px-2.5 rounded-full bg-rose-600/15 text-rose-900 font-label-sm text-label-sm inline-flex items-center gap-1 font-semibold font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>FAILED (HTTP 504)
                      </span>
                    </td>
                    <td className="px-4 font-label-sm text-label-sm text-rose-800 font-mono">4,991ms (TIMEOUT)</td>
                    <td className="px-4 font-body-sm text-body-sm text-rose-800">worker-k8s-pod-west-09</td>
                    <td className="px-4 text-right">
                      <button className="px-2 py-1 bg-rose-600 text-white rounded font-label-sm text-label-sm font-medium cursor-pointer shadow-2xs">
                        Retry Node
                      </button>
                    </td>
                  </tr>

                  {/* State 5: Loading Skeleton Row */}
                  <tr className="h-12 bg-surface-container-lowest animate-pulse">
                    <td className="px-4"><div className="w-4 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-4"><div className="w-32 h-3.5 bg-surface-container-high rounded"></div></td>
                    <td className="px-4"><div className="w-20 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-4"><div className="w-24 h-5 bg-surface-container-high rounded-full"></div></td>
                    <td className="px-4"><div className="w-12 h-3.5 bg-surface-container-high rounded"></div></td>
                    <td className="px-4"><div className="w-28 h-3.5 bg-surface-container-high rounded"></div></td>
                    <td className="px-4 text-right"><div className="w-6 h-6 bg-surface-container-high rounded ml-auto"></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. DATA DISPLAY & KPI CARDS */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Data Displays, Telemetry Gauges &amp; Empty State Invariants
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                LIVE REPUTATION GAUGES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* KPI Card 1: Standard Metric */}
              <div className="p-5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-4 border border-[#E2E8F0]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                      Active Saga Invariants
                    </span>
                    <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold font-mono mt-1">
                      14,280
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-600/10 text-emerald-800 font-label-sm text-label-sm font-bold flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>+12.4%
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "88%" }}></div>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
                    <span>4 Subsystems Active</span>
                    <span className="text-on-surface font-semibold">88% Capacity</span>
                  </div>
                </div>
              </div>

              {/* KPI Card 2: Interactive Tooltip & Skeletons Showcase */}
              <div className="p-5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-4 border border-[#E2E8F0]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold font-mono">
                      Worker Node Health (p99)
                    </span>
                    <span className="font-headline-xl text-headline-xl text-secondary tracking-tight font-bold font-mono mt-1">
                      18.4ms
                    </span>
                  </div>
                  <div className="relative group">
                    <button className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-sm text-label-sm font-bold cursor-pointer">
                      ?
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-inverse-surface text-inverse-on-surface rounded-lg shadow-xl font-label-sm text-label-sm flex flex-col gap-1 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-bold text-white font-mono">Worker: hlr-east-01-pod-7b</span>
                      <span className="text-secondary-fixed font-mono">p99 latency: 18ms • Memory: 64%</span>
                      <span className="text-slate-300">0 dropped packets in rolling 60min window.</span>
                    </div>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="w-full h-12 flex items-end gap-1 pt-2">
                  {[40, 55, 35, 70, 60, 85, 95, 45].map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${val}%` }}
                      className={`flex-1 rounded-t transition-all ${
                        idx === 7 ? "bg-secondary/80 hover:bg-secondary" : "bg-secondary/30 hover:bg-secondary"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* KPI Card 3: Empty State / Zero Fallout Shield */}
              <div className="p-5 rounded-xl bg-surface-container-low flex items-center gap-4 border border-[#E2E8F0]">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <span className="material-symbols-outlined text-[32px]">shield</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    No Fallout — Clean Board
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                    All 14,273 invariants fully satisfied. Zero orphaned SIM profiles detected across all cell towers.
                  </p>
                  <span className="font-label-sm text-label-sm text-emerald-800 font-semibold mt-1 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>AUTONOMIC DRIFT ZERO
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 10. THE GRAPH NODE COMPONENT IN ALL 10 STATES */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-5 border border-[#E3E8F0]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    The DAG Task Node Component — All 10 Formal States
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    The core visual signature of the SwitchOn Saga Execution Directed Acyclic Graph
                  </p>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold font-mono">
                SAGA PATTERN COMPONENT SPEC
              </span>
            </div>

            {/* 2 x 5 High Fidelity Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Node 1: PENDING / QUEUED */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold font-mono">
                    01 • QUEUED
                  </span>
                  <span className="material-symbols-outlined text-outline text-[18px]">schedule</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    Queue_Sim_Lock
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Pending worker slot</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-outline border-t border-outline-variant/30 font-mono">
                  <span>Priority: normal</span>
                  <span>-- ms</span>
                </div>
              </div>

              {/* Node 2: SCHEDULED */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border-2 border-slate-300 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-slate-700 font-semibold font-mono">
                    02 • SCHEDULED
                  </span>
                  <span className="material-symbols-outlined text-slate-600 text-[18px]">assignment_turned_in</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    Assign_Worker
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">worker-k8s-pod-11</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant border-t border-slate-200 font-mono">
                  <span>In Dispatch Ring</span>
                  <span>0 ms</span>
                </div>
              </div>

              {/* Node 3: RUNNING / IN-FLIGHT */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border-2 border-primary flex flex-col justify-between gap-2 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1 bg-primary/20">
                  <div className="h-full bg-primary animate-pulse w-3/4"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold font-mono">
                    03 • IN-FLIGHT
                  </span>
                  <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path></svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    Lock_SIM_Inv
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-medium font-mono">SIM_INV:8102</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-primary border-t border-primary/20 font-mono">
                  <span>Executing...</span>
                  <span className="font-bold">820 ms</span>
                </div>
              </div>

              {/* Node 4: SUCCEEDED / COMPLETED */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border-2 border-emerald-500 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-emerald-700 font-bold font-mono">
                    04 • SUCCEEDED
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    Validate_OMS
                  </span>
                  <span className="font-label-sm text-label-sm text-emerald-800 font-medium font-mono">oms-validator</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-emerald-800 border-t border-emerald-200 font-mono">
                  <span>Exit Code 0</span>
                  <span className="font-bold">220 ms</span>
                </div>
              </div>

              {/* Node 5: RETRYING / BACKOFF */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border-2 border-amber-500 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-amber-900 font-bold font-mono">
                    05 • RETRYING
                  </span>
                  <span className="material-symbols-outlined text-amber-700 text-[18px] animate-spin">autorenew</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    OCS_PreAuth
                  </span>
                  <span className="font-label-sm text-label-sm text-amber-900 font-medium font-mono">Attempt 2/3</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-amber-900 border-t border-amber-300 font-mono">
                  <span>Backoff: exp</span>
                  <span className="font-bold">500 ms</span>
                </div>
              </div>

              {/* Node 6: FAILED / ERROR */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border-2 border-rose-600 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-rose-800 font-bold font-mono">
                    06 • FAILED
                  </span>
                  <span className="material-symbols-outlined text-rose-700 text-[18px]">error</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    HLR_Attach
                  </span>
                  <span className="font-label-sm text-label-sm text-rose-800 font-medium font-mono">Rating Timeout</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-rose-900 border-t border-rose-300 font-mono">
                  <span>HTTP 500</span>
                  <span className="font-bold">4,190 ms</span>
                </div>
              </div>

              {/* Node 7: COMPENSATING */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border-2 border-purple-600 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-purple-900 font-bold font-mono">
                    07 • COMPENSATING
                  </span>
                  <span className="material-symbols-outlined text-purple-700 text-[18px]">undo</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    Compensate_SIM
                  </span>
                  <span className="font-label-sm text-label-sm text-purple-900 font-medium font-mono">Reversing state...</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-purple-900 border-t border-purple-300 font-mono">
                  <span>Inverse action</span>
                  <span className="font-bold">Running</span>
                </div>
              </div>

              {/* Node 8: COMPENSATED */}
              <div className="p-3.5 rounded-xl bg-violet-600/10 border-2 border-violet-500 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-violet-900 font-bold font-mono">
                    08 • COMPENSATED
                  </span>
                  <span className="material-symbols-outlined text-violet-700 text-[18px]">published_with_changes</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    Release_SIM
                  </span>
                  <span className="font-label-sm text-label-sm text-violet-900 font-medium font-mono">Rollback Verified</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-violet-900 border-t border-violet-300 font-mono">
                  <span>Clean unwind</span>
                  <span className="font-bold">310 ms</span>
                </div>
              </div>

              {/* Node 9: COMPENSATION_FAILED */}
              <div className="p-3.5 rounded-xl bg-orange-600/10 border-2 border-dashed border-orange-600 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-orange-900 font-bold font-mono">
                    09 • CRITICAL FALLOUT
                  </span>
                  <span className="material-symbols-outlined text-orange-700 text-[18px]">fmd_bad</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-mono">
                    HLR_Rollback
                  </span>
                  <span className="font-label-sm text-label-sm text-orange-900 font-medium font-mono">Escalated Fallout</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-orange-900 border-t border-orange-300 font-mono">
                  <span>Intervention!</span>
                  <span className="font-bold">DEADLOCK</span>
                </div>
              </div>

              {/* Node 10: SKIPPED / PRUNED */}
              <div className="p-3.5 rounded-xl bg-surface-container-high/40 border-2 border-dashed border-outline flex flex-col justify-between gap-2 opacity-75">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline font-semibold font-mono">
                    10 • SKIPPED
                  </span>
                  <span className="material-symbols-outlined text-outline text-[18px]">block</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-outline font-mono">
                    Notify_Customer
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">Skipped by rule</span>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-outline border-t border-outline/20 font-mono">
                  <span>Pruned branch</span>
                  <span>N/A</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Spec Signature */}
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-4 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm border border-[#E2E8F0] gap-2">
            <span>SwitchOn Design System Tokens • CSS Custom Properties • JetBrains Mono + Inter Typography</span>
            <span className="font-mono">Export Hash: 0x9AF84B2 • All Components Verified Clean Ground</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)] border-t border-[#E3E8F0]">
        <div className="w-full px-8 py-4 flex items-center justify-between text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span>SwitchOn Core Engineering Board • WCAG AA Compliant</span>
            <span className="text-outline">•</span>
            <span>Precision Telecommunications Spec</span>
          </div>
          <div className="flex items-center gap-4">
            <span>System Status: Optimal</span>
            <span>© 2025 SwitchOn Infrastructure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
