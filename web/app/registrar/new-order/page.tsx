"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegistrarShell } from "@/components/RegistrarShell";
import { useAuth } from "@/lib/auth";

interface ProductCatalogItem {
  product: string;
  name: string;
  description: string;
  version: number;
}

export default function RegistrarNewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Wizard Step (1: Customer, 2: Choose Service, 3: Service Identifiers, 4: Review & Submit)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Catalog items fetched from live backend
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>([
    {
      product: "FIBER_500",
      name: "Fiber Broadband 500Mbps",
      description: "High-speed residential fiber activation with ONT verification and billing setup.",
      version: 1,
    },
    {
      product: "MOBILE_5G",
      name: "5G Postpaid Unlimited",
      description: "5G mobile subscription with ICCID lock, network slice provisioning, and rating profile.",
      version: 1,
    },
    {
      product: "ESIM_ADDON",
      name: "eSIM Roaming Global Add-on",
      description: "Fast eSIM profile download with SM-DP+ reservation and rating configuration.",
      version: 1,
    },
  ]);

  // Step 1: Customer Details
  const [customerName, setCustomerName] = useState("Aarav Sharma");
  const [contactEmail, setContactEmail] = useState("aarav.sharma@airtelmail.in");
  const [customerId, setCustomerId] = useState(() => `CUST-IND-${Math.floor(100000 + Math.random() * 900000)}`);
  const [siteAddress, setSiteAddress] = useState("Flat 402, Godrej Woods, Sector 43, Noida - 201303");

  // Step 2: Choose Service
  const [selectedProduct, setSelectedProduct] = useState<string>("FIBER_500");

  // Step 3: Service Details & Identifiers
  const [msisdn, setMsisdn] = useState("9820154821");
  const [iccid, setIccid] = useState("89918603211123456780");
  const [clientOrderRef, setClientOrderRef] = useState(
    () => `EXT-CRM-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Optional Demo Chaos / Sandbox mode (clearly labeled)
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxScenario, setSandboxScenario] = useState<"none" | "network_timeout" | "billing_409" | "inventory_error">("none");

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load catalog products from live backend on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiHost}/catalog/products`);
        if (res.ok) {
          const items: ProductCatalogItem[] = await res.json();
          if (items && items.length > 0) {
            setCatalogProducts(items);
          }
        }
      } catch {
        // Fallback to defaults
      }
    };
    fetchCatalog();
  }, []);

  // Validation function per step
  const validateStep = (step: number): boolean => {
    const errs: string[] = [];

    if (step === 1) {
      if (!customerName.trim()) errs.push("Customer Name is required.");
      if (!customerId.trim()) errs.push("Customer ID / National Identifier is required.");
      if (!contactEmail.trim() || !contactEmail.includes("@")) {
        errs.push("A valid contact email address is required for dispatch confirmations.");
      }
    }

    if (step === 2) {
      if (!selectedProduct) errs.push("Please select a service product plan.");
    }

    if (step === 3) {
      const cleanMsisdn = msisdn.replace(/\D/g, "");
      if (cleanMsisdn.length < 10) {
        errs.push("MSISDN must contain at least 10 digits (e.g. 9820154821).");
      }

      // If mobile or eSIM, check ICCID format
      if (selectedProduct === "MOBILE_5G" || selectedProduct === "ESIM_ADDON") {
        const cleanIccid = iccid.replace(/\s+/g, "");
        if (cleanIccid.length < 18 || !cleanIccid.startsWith("89")) {
          errs.push("Valid SIM ICCID must be 18-22 digits starting with telecom prefix '89'.");
        }
      }

      if (!clientOrderRef.trim()) {
        errs.push("Client Order Reference is required for deduplication & idempotency.");
      }
    }

    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setValidationErrors([]);
      setCurrentStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : 4));
    }
  };

  const handleBack = () => {
    setValidationErrors([]);
    setApiError(null);
    setCurrentStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : 1));
  };

  // Submit via existing real backend API
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // If sandbox chaos was requested, optionally prime mock service if endpoint is available
      if (isSandboxMode && sandboxScenario !== "none") {
        try {
          const portMap: Record<string, number> = {
            network_timeout: 8103, // HLR
            billing_409: 8104, // OCS
            inventory_error: 8102, // SIM Inv
          };
          const targetPort = portMap[sandboxScenario];
          if (targetPort) {
            await fetch(`http://localhost:${targetPort}/chaos/fault`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fault_type: sandboxScenario === "network_timeout" ? "TIMEOUT" : "ERROR",
                status_code: sandboxScenario === "network_timeout" ? 504 : 500,
                delay_ms: sandboxScenario === "network_timeout" ? 4000 : 0,
                path_pattern: ".*",
                exhaust_retries: true,
              }),
            }).catch(() => {});
          }
        } catch {
          // Continue with order submission
        }
      }

      // Real Order Create Request Body (adhering strictly to shared.models.OrderCreateRequest)
      const payload = {
        client_order_ref: clientOrderRef.trim(),
        customer_id: customerId.trim(),
        product: selectedProduct,
        plan_name: catalogProducts.find((p) => p.product === selectedProduct)?.name,
        site_address: selectedProduct === "FIBER_500" ? siteAddress.trim() : undefined,
        msisdn: msisdn.trim(),
        iccid: (selectedProduct === "MOBILE_5G" || selectedProduct === "ESIM_ADDON") ? iccid.trim() : undefined,
        engine: "temporal",
      };

      const response = await fetch(`${apiHost}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": clientOrderRef.trim(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect directly to the real-time order tracking page
        router.push(`/registrar/orders/${data.order_id}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setApiError(
          errorData.detail ||
            `Order submission rejected by SwitchOn API (HTTP ${response.status}). Please check parameters.`
        );
      }
    } catch (err: unknown) {
      setApiError(
        `Unable to reach SwitchOn service gateway (${err instanceof Error ? err.message : String(err)}). Ensure backend containers are running.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlanObj = catalogProducts.find((p) => p.product === selectedProduct);

  return (
    <RegistrarShell>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Link href="/registrar" className="hover:text-slate-800">
                Registrar
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">New Service Activation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Service Activation Request
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Follow the guided checklist to validate identifiers and orchestrate service fulfillment.
            </p>
          </div>

          <Link
            href="/registrar"
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel &amp; Return
          </Link>
        </div>

        {/* Multi-Step Progress Indicator */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { num: 1, label: "Customer Details", icon: "person" },
              { num: 2, label: "Service Plan", icon: "category" },
              { num: 3, label: "SIM & Routing", icon: "dialpad" },
              { num: 4, label: "Review & Submit", icon: "fact_check" },
            ].map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  disabled={currentStep < step.num}
                  onClick={() => {
                    if (currentStep > step.num) setCurrentStep(step.num as 1 | 2 | 3 | 4);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                    isCurrent
                      ? "bg-sky-50 text-sky-800 font-bold border border-sky-200"
                      : isDone
                      ? "text-slate-700 hover:bg-slate-50 font-medium"
                      : "text-slate-400 opacity-60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Please resolve the following fields before proceeding:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* API Error Notification */}
        {apiError && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0">warning</span>
            <div>
              <p className="font-bold">Backend Submission Error</p>
              <p className="mt-0.5 leading-relaxed">{apiError}</p>
            </div>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {/* STEP 1: CUSTOMER DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 1 — Customer Identification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Specify subscriber identity and contact information for service delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subscriber Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aarav Sharma or Enterprise Entity"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Account Reference / ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="e.g. CUST-IND-902148"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email for Activation Confirmation *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. subscriber@telecom.in"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Installation / Billing Address
                  </label>
                  <input
                    type="text"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="Flat 402, Godrej Woods, Sector 43, Noida - 201303"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE SERVICE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 2 — Select Telecom Product</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the product plan configured in the active SwitchOn service catalog.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {catalogProducts.map((p) => {
                  const isSelected = selectedProduct === p.product;
                  return (
                    <div
                      key={p.product}
                      onClick={() => setSelectedProduct(p.product)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="p-2 rounded-xl bg-white border border-slate-200 text-sky-700 material-symbols-outlined text-[24px]">
                            {p.product === "FIBER_500"
                              ? "router"
                              : p.product === "MOBILE_5G"
                              ? "5g"
                              : "sim_card"}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            v{p.version}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-slate-600">
                          {p.product}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-sky-700" : "text-slate-400"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SERVICE DETAILS & ROUTING */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 3 — Routing &amp; Hardware Identifiers</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Specify MSISDN routing, physical SIM card, and idempotency keys.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subscriber MSISDN (10-Digit Mobile Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={msisdn}
                    onChange={(e) => setMsisdn(e.target.value)}
                    placeholder="9820154821"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Target dialable number for HLR/HSS and billing rate engine.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SIM Card ICCID Identifier {selectedProduct !== "FIBER_500" && "*"}
                  </label>
                  <input
                    type="text"
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value)}
                    placeholder="89918603211123456780"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    E.118 ICCID chip identifier reserved in telecom SIM inventory.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Order Reference (Idempotency Key) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={clientOrderRef}
                      onChange={(e) => setClientOrderRef(e.target.value)}
                      placeholder="EXT-CRM-991024"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setClientOrderRef(`EXT-CRM-${Math.floor(100000 + Math.random() * 900000)}`)
                      }
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Regenerate Key
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Deduplication invariant: ensures duplicate clicks or retries do not create duplicate service orders.
                  </p>
                </div>
              </div>

              {/* Optional Demo Chaos Sandbox Accordion */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-slate-600">tune</span>
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Sandbox / Demo Fault Simulation
                      </span>
                      <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSandboxMode}
                      onChange={(e) => setIsSandboxMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                {isSandboxMode && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Simulate how SwitchOn transparently handles real telecom subsystem faults:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { key: "none", title: "Normal Flow (Clean Success)" },
                        { key: "network_timeout", title: "HLR Gateway 504 Timeout" },
                        { key: "billing_409", title: "OCS Billing Conflict 409" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSandboxScenario(item.key as typeof sandboxScenario)}
                          className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                            sandboxScenario === item.key
                              ? "bg-white border-sky-600 font-bold text-sky-900 shadow-2xs"
                              : "border-slate-200 text-slate-600 hover:bg-white"
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 4 — Final Review &amp; Confirmation</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Confirm your activation payload before dispatching to the orchestrator.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Customer &amp; Account
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{customerName}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{customerId}</div>
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Notification Email:</strong> {contactEmail}
                  </div>
                  {siteAddress && (
                    <div className="text-xs text-slate-600">
                      <strong>Installation Site:</strong> {siteAddress}
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Product &amp; Routing
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {activePlanObj?.name || selectedProduct}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Catalog Key: {selectedProduct}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>MSISDN:</strong> <span className="font-mono">{msisdn}</span>
                  </div>
                  {iccid && (
                    <div className="text-xs text-slate-600">
                      <strong>ICCID:</strong> <span className="font-mono">{iccid}</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-600">
                    <strong>Idempotency Key:</strong>{" "}
                    <span className="font-mono">{clientOrderRef}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-sky-700 shrink-0 mt-0.5">
                  security
                </span>
                <div className="text-xs text-sky-900 leading-relaxed">
                  <strong className="font-semibold">SwitchOn Invariant Guarantee:</strong> Orders submitted through this gateway are governed by deterministic saga workflows. If any subsystem encounters an unrecoverable fault, compensating actions cleanly release locks and ensure zero stranded billing state.
                </div>
              </div>
            </div>
          )}

          {/* Navigation & Submission Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back</span>
              </button>
            ) : (
              <span />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-7 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>Dispatching Order to Orchestrator...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                    <span>Submit &amp; Launch Activation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </RegistrarShell>
  );
}
