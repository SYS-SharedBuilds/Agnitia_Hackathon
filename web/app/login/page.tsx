"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("registrar");
  const [customName, setCustomName] = useState("Aanya Patel");
  const [customOrg, setCustomOrg] = useState("Bharat Telecom Registrar Services (Circle DL-14)");
  const [partnerId, setPartnerId] = useState("REG-DL-2026-9041");
  const [pin, setPin] = useState("••••");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAs(selectedRole, customName, customOrg);
    if (selectedRole === "admin") {
      router.push("/");
    } else {
      router.push("/registrar");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 mb-4">
          <span className="material-symbols-outlined text-[32px]">cell_tower</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          SwitchOn Access Gateway
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          Sign in to the national telecom service activation and orchestration network.
        </p>

        {/* Clear Development/Demo Notice */}
        <div className="mt-4 mx-4 sm:mx-0 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left flex items-start gap-2.5">
          <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">info</span>
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Simulated Development Mode:</span> The SwitchOn core backend does not enforce server-side user authentication. This login screen simulates portal personas for development and demonstration purposes.
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg shadow-slate-200/60 rounded-2xl border border-slate-200/80">
          {/* Persona selector tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Experience Portal
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("registrar");
                  setCustomName("Aanya Patel");
                  setCustomOrg("Bharat Telecom Registrar Services (Circle DL-14)");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === "registrar"
                    ? "bg-white text-sky-800 shadow-xs border border-sky-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-sky-600">badge</span>
                <span>Subscriber / Registrar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setCustomName("Aarav Sharma");
                  setCustomOrg("SwitchOn Central Network Operations Command");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === "admin"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-300"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-slate-700">admin_panel_settings</span>
                <span>Admin / NOC</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Representative Name
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Partner Organization / Circle
              </label>
              <input
                type="text"
                required
                value={customOrg}
                onChange={(e) => setCustomOrg(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Partner ID
                </label>
                <input
                  type="text"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Security PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === "registrar"
                    ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
                    : "bg-slate-900 hover:bg-black text-white shadow-slate-900/20"
                }`}
              >
                <span>Enter {selectedRole === "registrar" ? "Subscriber Registrar Portal" : "Admin NOC Command"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 underline">
              Direct Admin NOC Link
            </Link>
            <Link href="/registrar" className="hover:text-slate-900 underline">
              Direct Registrar Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
