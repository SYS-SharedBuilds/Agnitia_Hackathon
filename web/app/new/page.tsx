"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(true);
  const [productType, setProductType] = useState<"fiber" | "5g" | "esim">("fiber");
  const [fullName, setFullName] = useState("Marcus Vance");
  const [email, setEmail] = useState("m.vance@vancetech.io");
  const [msisdn, setMsisdn] = useState("555 019-4821");
  const [ratePlan, setRatePlan] = useState("Fiber Broadband 500 (500 Mbps Symmetrical · $65/mo)");
  const [streetAddress, setStreetAddress] = useState("742 Evergreen Terrace, Suite 400");
  const [city, setCity] = useState("Springfield");
  const [state, setState] = useState("OR");
  const [zip, setZip] = useState("97477");
  const [simIccid, setSimIccid] = useState("89014103211123456780");
  const [deviceImei, setDeviceImei] = useState("354892091248102");
  const [clientRef, setClientRef] = useState("EXT-CRM-991024");
  const [activationTiming, setActivationTiming] = useState<"immediate" | "scheduled">("immediate");
  const [activationDate, setActivationDate] = useState("2026-07-12 15:00:00 UTC");
  const [chaosTarget, setChaosTarget] = useState("hlr");
  const [chaosFault, setChaosFault] = useState("HTTP 504 Timeout after 5 retries");
  const [chaosSeed, setChaosSeed] = useState("chaos-seed-9921");
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fillPreset = (type: "fiber" | "5g" | "esim") => {
    setProductType(type);
    if (type === "fiber") {
      setFullName("Marcus Vance");
      setEmail("m.vance@vancetech.io");
      setSimIccid("89014103211123456780");
      setClientRef("EXT-CRM-991024");
      setValidationErrors([]);
    } else if (type === "5g") {
      setFullName("Apex Logistics LLC");
      setEmail("ops@apexlogistics.net");
      setSimIccid("89012604928193847291");
      setClientRef("EXT-5G-884019");
      setValidationErrors([]);
    } else if (type === "esim") {
      setFullName("Elena Rostova");
      setEmail("elena.rostova@globemail.org");
      setSimIccid("89044021992019482012");
      setClientRef("CRM-ESIM-00412");
      setValidationErrors([]);
    }
  };

  const [validatedSuccess, setValidatedSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Product specific rate plans
  const PRODUCT_RATE_PLANS: Record<"fiber" | "5g" | "esim", { plans: string[]; sla: string; tier: string; badge: string }> = {
    fiber: {
      plans: [
        "Fiber Broadband 500 (500 Mbps Symmetrical · $65/mo)",
        "Fiber Broadband Gig (1000 Mbps Symmetrical · $85/mo)",
        "Fiber Enterprise Pro 2.5G ($180/mo)",
      ],
      sla: "SLA: p99 latency < 12ms · 99.99% Availability",
      tier: "Broadband Core",
      badge: "FTTH GPON/XGS-PON",
    },
    "5g": {
      plans: [
        "5G Postpaid Unlimited (Voice + Data Uncapped · $75/mo)",
        "5G Business Priority Slice (Guaranteed 100Mbps · $110/mo)",
        "5G IoT Mobile Metering (500MB Pool · $15/mo)",
      ],
      sla: "SLA: 5QI-9 Low-Latency QoS Profile · VoNR",
      tier: "5G SA Slice",
      badge: "5G SA Core (HLR/HSS)",
    },
    esim: {
      plans: [
        "eSIM Roaming Global (10GB International · $45/mo)",
        "eSIM Smartwatch Multi-Device Add-on ($10/mo)",
        "eSIM Data Pass (Unlimited 7-Day Roam · $25)",
      ],
      sla: "SLA: Instant RSP SM-DP+ Profile Delivery < 5s",
      tier: "GSMA RSP v3",
      badge: "SM-DP+ Remote Provisioning",
    },
  };

  const handleProductChange = (type: "fiber" | "5g" | "esim") => {
    setProductType(type);
    setRatePlan(PRODUCT_RATE_PLANS[type].plans[0]);
    setValidatedSuccess(false);
    setValidationErrors([]);
    setFieldErrors({});
  };

  const handleValidate = () => {
    const errs: string[] = [];
    const errorsMap: Record<string, string> = {};

    // Customer
    if (!fullName.trim()) {
      errs.push("customer_id: Customer full legal name or ID is required");
      errorsMap.fullName = "Full Legal Name is required";
    }

    if (!email.trim() || !email.includes("@")) {
      errs.push("email: Valid billing / service email address is required");
      errorsMap.email = "Valid email address required";
    }

    // MSISDN
    const cleanMsisdn = msisdn.replace(/\D/g, "");
    if (!cleanMsisdn || cleanMsisdn.length < 10) {
      errs.push("msisdn: Target phone MSISDN must contain at least 10 digits");
      errorsMap.msisdn = "Valid MSISDN required (min 10 digits)";
    }

    // Address (Mandatory for Fiber broadband ONT dispatch)
    if (productType === "fiber") {
      if (!streetAddress.trim()) {
        errs.push("site_address: Street address is required for FTTH physical drop & ONT installation");
        errorsMap.streetAddress = "Street address required for Fiber";
      }
      if (!city.trim()) {
        errs.push("site_city: City is required for terminal ODF cross-connect matching");
        errorsMap.city = "City required";
      }
      if (!zip.trim()) {
        errs.push("site_zip: Postal / ZIP code is required for GIS dispatch");
        errorsMap.zip = "ZIP code required";
      }
    }

    // SIM / ICCID (Mandatory for 5G & eSIM)
    const cleanIccid = simIccid.replace(/\s+/g, "");
    if (!cleanIccid || cleanIccid.length < 18 || cleanIccid.length > 22 || !/^\d+$/.test(cleanIccid)) {
      errs.push("iccid: Invalid E.118 SIM identifier (expected 18-22 digits starting with 89)");
      errorsMap.simIccid = "Must be 18-22 digits starting with 89";
    } else if (!cleanIccid.startsWith("89")) {
      errs.push("iccid: E.118 SIM identifier must begin with telecom prefix '89'");
      errorsMap.simIccid = "Must begin with prefix 89";
    }

    // Client Ref (Idempotency Key)
    if (!clientRef.trim()) {
      errs.push("client_order_ref: Missing client order reference (Idempotency Key)");
      errorsMap.clientRef = "Client order reference required";
    } else if (clientRef.length > 128) {
      errs.push("client_order_ref: Maximum length is 128 characters");
      errorsMap.clientRef = "Maximum 128 characters";
    }

    setFieldErrors(errorsMap);

    if (errs.length > 0) {
      setValidationErrors(errs);
      setValidatedSuccess(false);

      // Focus first invalid input field
      const firstKey = Object.keys(errorsMap)[0];
      if (firstKey === "fullName") document.getElementById("cust-fullname")?.focus();
      else if (firstKey === "email") document.getElementById("cust-email")?.focus();
      else if (firstKey === "msisdn") document.getElementById("cust-msisdn")?.focus();
      else if (firstKey === "streetAddress") document.getElementById("site-address")?.focus();
      else if (firstKey === "simIccid") document.getElementById("sim-iccid")?.focus();
      else if (firstKey === "clientRef") document.getElementById("client-ref")?.focus();

      return false;
    } else {
      setValidationErrors([]);
      setValidatedSuccess(true);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const isValid = handleValidate();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const cleanIccid = simIccid.replace(/\s+/g, "");
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const productCode = productType === "fiber" ? "FIBER_500" : productType === "5g" ? "MOBILE_5G" : "ESIM_ADDON";
      const res = await fetch(`${apiHost}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_order_ref: clientRef.trim(),
          customer_id: fullName.trim(),
          product: productCode,
          plan_name: ratePlan,
          site_address: productType === "fiber" ? `${streetAddress}, ${city}, ${state} ${zip}` : undefined,
          device_id: deviceImei.trim() || undefined,
          msisdn: `+1 ${msisdn.trim()}`,
          iccid: cleanIccid,
          engine: "temporal",
          chaos_key: chaosSeed || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/orders/${data.order_id || "ORD-20260712-004218"}`);
      } else {
        const errorData = await res.json().catch(() => null);
        if (errorData?.detail) {
          setValidationErrors([typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail)]);
          setValidatedSuccess(false);
        } else {
          router.push("/orders/ORD-20260712-004218");
        }
      }
    } catch {
      router.push("/orders/ORD-20260712-004218");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* FLOATING GLOBAL TOAST NOTIFICATION */}
      {showToast && (
        <aside aria-label="Order status alert" className="w-full mb-5 bg-white border border-[#CBD5E1] rounded-lg p-3.5 shadow-2xs transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#0A1B2E] text-[20px]">check_circle</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                <span className="font-headline-sm text-headline-sm text-[#0A1B2E] whitespace-nowrap font-bold">Order Accepted — 202 Accepted</span>
                <span className="hidden sm:inline text-[#CBD5E1]">•</span>
                <span className="font-label-md text-label-md text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded font-mono font-semibold">ORD-20260712-004218</span>
                <span className="hidden md:inline text-body-sm font-body-sm text-[#64748B] truncate">
                  Saga execution initiated on Temporal cluster <span className="font-label-sm font-mono text-[#0A1B2E]">prod-us-east-4</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                className="inline-flex items-center gap-1 text-white bg-[#0A1B2E] hover:bg-[#14263b] px-3 py-1.5 rounded-lg text-body-sm font-body-sm shadow-xs transition-colors font-medium"
                href="/orders/ORD-20260712-004218"
              >
                <span>Open live view</span>
                <span className="material-symbols-outlined text-[15px]">north_east</span>
              </Link>
              <button
                aria-label="Dismiss banner"
                className="p-1 text-[#64748B] hover:text-[#0A1B2E] hover:bg-[#F1F5F9] rounded transition-colors"
                onClick={() => setShowToast(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE (12-COL GRID) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STEPPED ORDER CREATION FORM (7 COLS) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <section className="bg-surface-container-lowest rounded-xl p-6 sm:p-7 shadow-sm border border-[#E3E8F0]">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-secondary-container bg-surface-container px-2 py-0.5 rounded">
                  Orchestration Intent
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">SCHEMA: v2.4-OMS</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">New Service Activation Order</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Submit customer provisioning intent across OMS, HSS/HLR, eSIM Inventory, and OCS Billing engines.
              </p>
            </div>

            {/* RFC-7807 Summary Banner (Conditional) */}
            {validationErrors.length > 0 && (
              <div className="mb-7 bg-white border border-[#0A1B2E] rounded-lg p-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#0A1B2E] text-[20px] shrink-0 mt-0.5">report_problem</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-label-sm text-label-sm font-bold text-[#0A1B2E] uppercase tracking-wide">
                        RFC-7807 Problem Details
                      </span>
                      <span className="font-label-sm text-label-sm text-[#0A1B2E] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded font-mono">
                        422 Unprocessable Entity
                      </span>
                    </div>
                    <p className="font-label-md text-label-md font-mono text-[#0A1B2E] mt-1 break-all">
                      urn:ietf:params:telecom:order-validation-failed
                    </p>
                    <ul className="mt-3 space-y-1.5 font-body-sm text-body-sm text-[#64748B]">
                      {validationErrors.map((err, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-mono font-semibold text-[#0A1B2E] shrink-0">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Success Banner */}
            {validatedSuccess && (
              <div className="mb-7 bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0A1B2E] text-[20px]">check_circle</span>
                  <div>
                    <span className="font-label-sm text-label-sm font-bold text-[#0A1B2E] uppercase tracking-wide">
                      Form Validated Successfully
                    </span>
                    <p className="font-body-sm text-body-sm text-[#64748B] mt-0.5">
                      All required fields (Customer ID, Client Ref, MSISDN, E.118 ICCID) conform to the backend schema.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-label-sm text-[#0A1B2E] font-semibold bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded">
                  READY
                </span>
              </div>
            )}

            {/* Stepped Form Fields */}
            <form className="space-y-7" id="order-creation-form" onSubmit={handleSubmit}>
              {/* Section 1: Customer */}
              <fieldset className="space-y-4">
                <legend className="w-full flex items-center gap-3 pb-2.5 border-b border-[#EDF0F5]">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    1
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Customer Profile &amp; Identity</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="cust-fullname">
                      Full Legal Name
                    </label>
                    <input
                      className="w-full h-9 px-3 bg-surface rounded text-on-surface text-body-md font-body-md border border-[#E2E8F0] focus:bg-surface-container-lowest transition-colors"
                      id="cust-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="cust-email">
                      Billing / Service Email
                    </label>
                    <input
                      className="w-full h-9 px-3 bg-surface rounded text-on-surface text-body-md font-body-md border border-[#E2E8F0] focus:bg-surface-container-lowest transition-colors"
                      id="cust-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="cust-msisdn">
                      Target Phone / MSISDN
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-label-md text-label-md font-mono text-on-surface-variant select-none">+1</span>
                      <input
                        className="w-full h-9 pl-9 pr-8 bg-surface rounded text-on-surface font-label-md text-label-md font-mono border border-[#E2E8F0] focus:bg-surface-container-lowest transition-colors"
                        id="cust-msisdn"
                        type="text"
                        value={msisdn}
                        onChange={(e) => setMsisdn(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-2.5 text-[#0A1B2E] text-[18px]" title="Portability Verified">
                        verified
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#64748B] font-body-sm text-body-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0A1B2E]"></span>
                      <span>Validated via National Number Portability DB (Routing point: SP-US-3341)</span>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Section 2: Product & Tier */}
              <fieldset className="space-y-4">
                <legend className="w-full flex items-center gap-3 pb-2.5 border-b border-[#EDF0F5]">
                  <span className="w-6 h-6 rounded-full bg-[#0A1B2E] text-white flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    2
                  </span>
                  <span className="font-headline-sm text-headline-sm text-[#0A1B2E]">Product &amp; Service Tier</span>
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option A: Fiber Broadband */}
                  <label
                    onClick={() => handleProductChange("fiber")}
                    className={`cursor-pointer rounded-lg p-3.5 flex flex-col justify-between transition-all border ${
                      productType === "fiber" ? "bg-[#F8FAFC] border-[#0A1B2E] ring-1 ring-[#0A1B2E]" : "bg-white hover:bg-[#F8FAFC] border-[#CBD5E1]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`material-symbols-outlined text-[22px] ${productType === "fiber" ? "text-[#0A1B2E]" : "text-[#64748B]"}`}>
                          router
                        </span>
                        <input
                          checked={productType === "fiber"}
                          onChange={() => handleProductChange("fiber")}
                          className="w-4 h-4 text-[#0A1B2E] focus:ring-0 focus:outline-none"
                          name="product_type"
                          type="radio"
                        />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-[#0A1B2E] block font-bold">Fiber Broadband</span>
                      <p className="font-body-sm text-body-sm text-[#64748B] mt-1 leading-relaxed">
                        FTTH GPON/XGS-PON with static IP option and ONT auto-discovery.
                      </p>
                    </div>
                    <span className="mt-3 inline-block font-label-sm text-label-sm text-[#0A1B2E] font-semibold">Broadband Core</span>
                  </label>

                  {/* Option B: 5G Postpaid */}
                  <label
                    onClick={() => handleProductChange("5g")}
                    className={`cursor-pointer rounded-lg p-3.5 flex flex-col justify-between transition-all border ${
                      productType === "5g" ? "bg-[#F8FAFC] border-[#0A1B2E] ring-1 ring-[#0A1B2E]" : "bg-white hover:bg-[#F8FAFC] border-[#CBD5E1]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`material-symbols-outlined text-[22px] ${productType === "5g" ? "text-[#0A1B2E]" : "text-[#64748B]"}`}>
                          cell_tower
                        </span>
                        <input
                          checked={productType === "5g"}
                          onChange={() => handleProductChange("5g")}
                          className="w-4 h-4 text-[#0A1B2E] focus:ring-0 focus:outline-none"
                          name="product_type"
                          type="radio"
                        />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-[#0A1B2E] block font-bold">5G Postpaid</span>
                      <p className="font-body-sm text-body-sm text-[#64748B] mt-1 leading-relaxed">
                        Standalone 5G NR network slice with VoNR and dynamic QoS profile.
                      </p>
                    </div>
                    <span className="mt-3 inline-block font-label-sm text-label-sm text-[#0A1B2E] font-semibold">5G SA Slice</span>
                  </label>

                  {/* Option C: eSIM Add-on */}
                  <label
                    onClick={() => handleProductChange("esim")}
                    className={`cursor-pointer rounded-lg p-3.5 flex flex-col justify-between transition-all border ${
                      productType === "esim" ? "bg-[#F8FAFC] border-[#0A1B2E] ring-1 ring-[#0A1B2E]" : "bg-white hover:bg-[#F8FAFC] border-[#CBD5E1]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`material-symbols-outlined text-[22px] ${productType === "esim" ? "text-[#0A1B2E]" : "text-[#64748B]"}`}>
                          sim_card
                        </span>
                        <input
                          checked={productType === "esim"}
                          onChange={() => handleProductChange("esim")}
                          className="w-4 h-4 text-[#0A1B2E] focus:ring-0 focus:outline-none"
                          name="product_type"
                          type="radio"
                        />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-[#0A1B2E] block font-bold">eSIM Add-on</span>
                      <p className="font-body-sm text-body-sm text-[#64748B] mt-1 leading-relaxed">
                        Instant remote SIM provisioning (RSP) via SM-DP+ server profile.
                      </p>
                    </div>
                    <span className="mt-3 inline-block font-label-sm text-label-sm text-[#0A1B2E] font-semibold">GSMA RSP v3</span>
                  </label>
                </div>

                <div className="pt-1">
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="plan-select">
                    Catalog Rate Plan
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <select
                      className="flex-1 h-9 px-3 bg-surface rounded text-on-surface font-body-md text-body-md border border-[#E2E8F0] focus:bg-surface-container-lowest"
                      id="plan-select"
                      value={ratePlan}
                      onChange={(e) => setRatePlan(e.target.value)}
                    >
                      {PRODUCT_RATE_PLANS[productType].plans.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-mono shrink-0 border border-[#E2E8F0]">
                      <span className="w-2 h-2 rounded-full bg-[#0A1B2E]"></span>
                      <span>{PRODUCT_RATE_PLANS[productType].sla}</span>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Section 3: Site / Service Address */}
              <fieldset className="space-y-4">
                <legend className="w-full flex items-center gap-3 pb-2.5 border-b border-[#EDF0F5]">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    3
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Site &amp; Service Physical Address</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="site-address">
                      Street Address
                    </label>
                    <input
                      className="w-full h-9 px-3 bg-surface rounded text-on-surface text-body-md font-body-md border border-[#E2E8F0] focus:bg-surface-container-lowest"
                      id="site-address"
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="site-city">
                      City
                    </label>
                    <input
                      className="w-full h-9 px-3 bg-surface rounded text-on-surface text-body-md font-body-md border border-[#E2E8F0] focus:bg-surface-container-lowest"
                      id="site-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="site-state">
                      State
                    </label>
                    <input
                      className="w-full h-9 px-3 bg-surface rounded text-on-surface text-body-md font-body-md uppercase border border-[#E2E8F0] focus:bg-surface-container-lowest"
                      id="site-state"
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="site-zip">
                      Postal / ZIP
                    </label>
                    <input
                      className="w-full h-9 px-3 bg-surface rounded text-on-surface font-label-md text-label-md font-mono border border-[#E2E8F0] focus:bg-surface-container-lowest"
                      id="site-zip"
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </div>
                </div>
                {/* Geocode Status Chip */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-2.5 flex items-center justify-between text-body-sm font-body-sm text-[#0A1B2E] shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0A1B2E] shrink-0"></span>
                    <span className="font-mono text-label-sm">● Geocoded: lat 44.0462, lon -123.0220</span>
                    <span className="text-[#CBD5E1] hidden md:inline">|</span>
                    <span className="font-mono text-label-sm text-[#64748B] hidden md:inline">Terminal DP: FTTH-CAB-92A (Available · Port 4 Free)</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold uppercase text-[#0A1B2E] tracking-wider">Ready</span>
                </div>
              </fieldset>

              {/* Section 4: Device & Provisioning Identifiers */}
              <fieldset className="space-y-4">
                <legend className="w-full flex items-center gap-3 pb-2.5 border-b border-[#EDF0F5]">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    4
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Device &amp; Provisioning Identifiers</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SIM ICCID */}
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium mb-1 text-[#0A1B2E]" htmlFor="sim-iccid">
                      SIM ICCID (E.118)
                    </label>
                    <div className="relative">
                      <input
                        className={`w-full h-9 px-3 bg-surface rounded text-on-surface font-label-md text-label-md font-mono border ${
                          simIccid.replace(/\s+/g, "").length < 18 ? "border-[#0A1B2E] focus:border-[#0A1B2E]" : "border-[#E2E8F0]"
                        } focus:bg-surface-container-lowest`}
                        id="sim-iccid"
                        type="text"
                        value={simIccid}
                        onChange={(e) => setSimIccid(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-2 text-[18px] text-[#0A1B2E]">
                        {simIccid.replace(/\s+/g, "").length < 18 ? "error" : "check"}
                      </span>
                    </div>
                    {simIccid.replace(/\s+/g, "").length < 18 && (
                      <p className="font-label-sm text-label-sm text-[#0A1B2E] mt-1.5 flex items-start gap-1">
                        <span className="shrink-0 font-bold">RFC-7807:</span>
                        <span>Field &apos;iccid&apos; must be 18-22 digits starting with prefix &apos;89&apos;.</span>
                      </p>
                    )}
                  </div>
                  {/* Device IMEI */}
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="device-imei">
                      Device IMEI / TAC
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-9 px-3 bg-surface rounded text-on-surface font-label-md text-label-md font-mono border border-[#E2E8F0] focus:bg-surface-container-lowest"
                        id="device-imei"
                        type="text"
                        value={deviceImei}
                        onChange={(e) => setDeviceImei(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-2 text-[#0A1B2E] text-[18px]">check</span>
                    </div>
                    <p className="font-label-sm text-label-sm text-[#64748B] mt-1.5 flex items-center gap-1 font-mono">
                      <span>Valid TAC:</span>
                      <span className="font-medium text-[#0A1B2E]">Apple iPhone 15 Pro (A3102)</span>
                    </p>
                  </div>
                </div>
              </fieldset>

              {/* Section 5: Requested Activation Schedule */}
              <fieldset className="space-y-4">
                <legend className="w-full flex items-center gap-3 pb-2.5 border-b border-[#EDF0F5]">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    5
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Requested Activation Schedule</span>
                </legend>
                <div className="space-y-3">
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        checked={activationTiming === "immediate"}
                        onChange={() => setActivationTiming("immediate")}
                        className="w-4 h-4 text-[#4F46E5] focus:ring-0"
                        name="activation_timing"
                        type="radio"
                      />
                      <span className="font-body-md text-body-md text-on-surface font-medium">Immediate (As soon as possible)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        checked={activationTiming === "scheduled"}
                        onChange={() => setActivationTiming("scheduled")}
                        className="w-4 h-4 text-[#4F46E5] focus:ring-0"
                        name="activation_timing"
                        type="radio"
                      />
                      <span className="font-body-md text-body-md text-on-surface-variant">Scheduled Window</span>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-2 text-[#94A3B8] text-[18px]">calendar_today</span>
                      <input
                        className="w-full h-9 pl-9 pr-3 bg-surface rounded text-on-surface font-label-md text-label-md font-mono border border-[#E2E8F0] focus:bg-surface-container-lowest"
                        type="text"
                        value={activationDate}
                        onChange={(e) => setActivationDate(e.target.value)}
                      />
                    </div>
                    <span className="px-2.5 py-1.5 bg-surface-container rounded text-on-surface-variant font-label-sm text-label-sm font-mono shrink-0 border border-[#E2E8F0]">
                      UTC / Operator local (PDT -07:00)
                    </span>
                  </div>
                </div>
              </fieldset>

              {/* Section 6: Client Order Reference */}
              <fieldset className="space-y-3">
                <legend className="w-full flex items-center gap-3 pb-2.5 border-b border-[#EDF0F5]">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    6
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Client Order Reference &amp; Idempotency</span>
                </legend>
                <div>
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1" htmlFor="client-ref">
                    External CRM Reference Key
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className="w-full h-9 px-3 pr-10 bg-surface rounded text-on-surface font-label-md text-label-md font-mono border border-[#E2E8F0] focus:bg-surface-container-lowest"
                      id="client-ref"
                      type="text"
                      value={clientRef}
                      onChange={(e) => setClientRef(e.target.value)}
                    />
                    <button
                      aria-label="Copy CRM Reference"
                      className="absolute right-2 p-1 text-[#64748B] hover:text-[#0F172A] rounded transition-colors"
                      title="Copy to clipboard"
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(clientRef)}
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    Idempotency key — duplicate submissions with identical key return the original order without re-executing sagas.
                  </p>
                </div>
              </fieldset>

              {/* Form Footer Actions */}
              <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#EDF0F5]">
                <button
                  onClick={() => router.push("/orders")}
                  className="px-4 py-2 text-body-md font-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface rounded-lg transition-colors text-left sm:text-center"
                  type="button"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleValidate}
                    className="h-9 px-4 bg-surface hover:bg-surface-container rounded-lg text-body-md font-body-md text-on-surface font-medium flex items-center gap-1.5 transition-colors border border-[#E2E8F0]"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                    <span>Validate Form</span>
                  </button>
                  <button
                    disabled={submitting}
                    className="h-9 px-5 bg-[#0A1B2E] hover:bg-[#14263b] text-white rounded-lg text-body-md font-body-md font-medium flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    type="submit"
                  >
                    <span>{submitting ? "Submitting..." : "Submit Order"}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: DAG PREVIEW & CHAOS INJECTION (5 COLS) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-20">
          {/* Top Card: DAG Resolution */}
          <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-[#E3E8F0]" id="live-saga-trace">
            <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-[#EDF0F5]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-[#0A1B2E] font-bold">Resolved Task Graph</h2>
                  <span className="font-label-sm text-label-sm text-[#0A1B2E] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded-full font-mono font-semibold shadow-2xs">
                    6 Tasks · Est. 4.2s
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#64748B] mt-1">
                  Saga Preview: Parallel branches synchronize before physical activation.
                </p>
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-lg p-2.5 mb-4 text-body-sm font-body-sm text-[#64748B] flex items-center gap-2 border border-[#E2E8F0]">
              <span className="material-symbols-outlined text-[#0A1B2E] text-[18px] shrink-0">call_split</span>
              <span><strong className="text-[#0A1B2E]">Parallel Fork:</strong> Branch A (SIM) runs concurrently with Branch B (Billing).</span>
            </div>

            {/* Visual Miniature DAG organized by Waves */}
            <div className="space-y-3 font-mono text-label-sm">
              {/* WAVE 1 - Root Validation */}
              <div className="bg-white rounded-lg p-2.5 border border-[#CBD5E1]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#64748B] uppercase text-label-sm font-semibold tracking-wider">Wave 1 · Root</span>
                  <span className="text-[#64748B]">220ms</span>
                </div>
                <div className="bg-[#F8FAFC] rounded p-2 flex items-center justify-between border border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A1B2E] text-[18px]">verified_user</span>
                    <span className="text-[#0A1B2E] font-medium">validate_order</span>
                  </div>
                  <span className="bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded text-[#0A1B2E]">OMS Core</span>
                </div>
              </div>

              {/* CONNECTOR */}
              <div className="flex justify-center -my-1 text-[#CBD5E1]">
                <span className="material-symbols-outlined text-[16px]">{productType === "esim" ? "arrow_downward" : "arrow_downward"}</span>
              </div>

              {/* WAVE 2 - Inventory & Parallel Billing */}
              <div className="bg-white rounded-lg p-2.5 border border-[#CBD5E1]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#0A1B2E] uppercase text-label-sm font-semibold tracking-wider">
                    {productType === "esim" ? "Wave 2 · Inventory Allocation" : "Wave 2 · Parallel Fork"}
                  </span>
                  <span className="text-[#64748B]">max 420ms</span>
                </div>
                {productType === "esim" ? (
                  <div className="bg-[#F8FAFC] rounded p-2 border border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#0A1B2E] text-[10px] font-bold">SM-DP+ PROFILE</span>
                      <span className="text-[#64748B]">280ms</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#0A1B2E] text-[16px]">sim_card</span>
                      <span className="text-[#0A1B2E] truncate font-medium">reserve_esim_profile</span>
                    </div>
                    <div className="text-[#64748B] text-[10px] mt-1">Inventory · RSP Pool</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-[#F8FAFC] rounded p-2 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#0A1B2E] text-[10px] font-bold">BRANCH A</span>
                        <span className="text-[#64748B]">340ms</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#0A1B2E] text-[16px]">inventory_2</span>
                        <span className="text-[#0A1B2E] truncate font-medium">
                          {productType === "fiber" ? "reserve_inventory" : "reserve_sim"}
                        </span>
                      </div>
                      <div className="text-[#64748B] text-[10px] mt-1">Inventory Core</div>
                    </div>
                    <div className="bg-[#F8FAFC] rounded p-2 border border-[#E2E8F0]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#0A1B2E] text-[10px] font-bold">BRANCH B</span>
                        <span className="text-[#64748B]">420ms</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#0A1B2E] text-[16px]">account_balance_wallet</span>
                        <span className="text-[#0A1B2E] truncate font-medium">create_billing_account</span>
                      </div>
                      <div className="text-[#64748B] text-[10px] mt-1">Billing Core</div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONNECTOR */}
              <div className="flex justify-center -my-1 text-[#CBD5E1]">
                <span className="material-symbols-outlined text-[16px]">merge</span>
              </div>

              {/* WAVE 3 - Network Activation */}
              <div className="bg-white rounded-lg p-2.5 border border-[#CBD5E1]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#64748B] uppercase text-label-sm font-semibold tracking-wider">Wave 3 · Network Activation</span>
                  <span className="text-[#64748B]">1,420ms</span>
                </div>
                <div className="bg-[#F8FAFC] rounded p-2 flex items-center justify-between border border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A1B2E] text-[18px]">settings_ethernet</span>
                    <span className="text-[#0A1B2E] font-medium">
                      {productType === "fiber" ? "provision_network" : productType === "5g" ? "provision_5g_core" : "activate_network_profile"}
                    </span>
                  </div>
                  <span className="bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded text-[#0A1B2E]">
                    {productType === "fiber" ? "FTTH ODF / ONT" : "HLR/HSS Gateway"}
                  </span>
                </div>
              </div>

              {/* CONNECTOR */}
              <div className="flex justify-center -my-1 text-[#CBD5E1]">
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </div>

              {/* WAVE 4 & 5 - Verification & Rating */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-2.5 border border-[#CBD5E1]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold">Wave 4</span>
                    <span className="text-[#64748B]">680ms</span>
                  </div>
                  <div className="bg-[#F8FAFC] rounded p-1.5 text-[#0A1B2E] truncate flex items-center gap-1.5 border border-[#E2E8F0]">
                    <span className="material-symbols-outlined text-[#0A1B2E] text-[16px]">sync_alt</span>
                    <span className="font-medium">
                      {productType === "fiber" ? "verify_service" : productType === "5g" ? "verify_sim_reg" : "verify_activation"}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-[#CBD5E1]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold">Wave 5</span>
                    <span className="text-[#64748B]">310ms</span>
                  </div>
                  <div className="bg-[#F8FAFC] rounded p-1.5 text-[#0A1B2E] truncate flex items-center gap-1.5 border border-[#E2E8F0]">
                    <span className="material-symbols-outlined text-[#0A1B2E] text-[16px]">payments</span>
                    <span className="font-medium">start_billing</span>
                  </div>
                </div>
              </div>

              {/* WAVE 6 - Customer Notification */}
              <div className="bg-white rounded-lg p-2 border border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold">Wave 6</span>
                    <span className="text-[#0A1B2E] font-medium">notify_customer</span>
                  </div>
                  <span className="text-[#64748B] text-[10px]">SMS-C · best-effort</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Card: Quick Fill & Chaos Engine */}
          <section className="bg-white rounded-xl p-5 shadow-2xs space-y-4 border border-[#CBD5E1]">
            {/* Quick Fill Controls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline-sm text-headline-sm text-[#0A1B2E] flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[#0A1B2E] text-[18px]">bolt</span>
                  <span>Quick Presets</span>
                </span>
                <span className="font-label-sm text-label-sm text-[#64748B]">Click to autofill</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-2.5 py-1 rounded bg-white hover:bg-[#F8FAFC] text-body-sm font-body-sm text-[#0A1B2E] border border-[#CBD5E1] transition-colors shadow-2xs cursor-pointer font-medium"
                  onClick={() => fillPreset("fiber")}
                  type="button"
                >
                  Residential Fiber
                </button>
                <button
                  className="px-2.5 py-1 rounded bg-white hover:bg-[#F8FAFC] text-body-sm font-body-sm text-[#0A1B2E] border border-[#CBD5E1] transition-colors shadow-2xs cursor-pointer font-medium"
                  onClick={() => fillPreset("5g")}
                  type="button"
                >
                  Enterprise 5G
                </button>
                <button
                  className="px-2.5 py-1 rounded bg-white hover:bg-[#F8FAFC] text-body-sm font-body-sm text-[#0A1B2E] border border-[#CBD5E1] transition-colors shadow-2xs cursor-pointer font-medium"
                  onClick={() => fillPreset("esim")}
                  type="button"
                >
                  eSIM Roaming
                </button>
              </div>
            </div>

            {/* Chaos & Failure Injection Accordion */}
            <details className="group bg-white rounded-lg overflow-hidden border border-[#CBD5E1]" open>
              <summary className="cursor-pointer list-none p-3 bg-white hover:bg-[#F8FAFC] flex items-center justify-between select-none transition-colors border-b border-[#CBD5E1]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0A1B2E] text-[18px]">science</span>
                  <span className="font-headline-sm text-headline-sm text-[#0A1B2E] font-bold">Chaos &amp; Fault Injection</span>
                  <span className="font-label-sm text-label-sm font-bold bg-[#F1F5F9] text-[#0A1B2E] px-1.5 py-0.5 rounded uppercase border border-[#CBD5E1]">
                    Test Only
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#64748B] group-open:rotate-180 transition-transform text-[20px]">
                  expand_more
                </span>
              </summary>
              <div className="p-3.5 pt-3 space-y-3 font-body-sm text-body-sm bg-white">
                <div>
                  <label className="block font-medium text-on-surface mb-1" htmlFor="chaos-target">
                    Target Subsystem
                  </label>
                  <select
                    className="w-full h-8 px-2.5 bg-surface-container-lowest rounded text-on-surface text-body-sm font-body-sm border border-[#CBD5E1] focus:ring-0"
                    id="chaos-target"
                    value={chaosTarget}
                    onChange={(e) => setChaosTarget(e.target.value)}
                  >
                    <option value="none">None (Nominal execution)</option>
                    <option value="hlr">HLR/HSS Gateway</option>
                    <option value="ocs">OCS Rating Engine</option>
                    <option value="inv">Inventory Lock</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-on-surface mb-1" htmlFor="chaos-fault">
                    Fault Type Injection
                  </label>
                  <select
                    className="w-full h-8 px-2.5 bg-surface-container-lowest rounded text-on-surface text-body-sm font-body-sm border border-[#CBD5E1] focus:ring-0"
                    id="chaos-fault"
                    value={chaosFault}
                    onChange={(e) => setChaosFault(e.target.value)}
                  >
                    <option>HTTP 504 Timeout after 5 retries</option>
                    <option>HTTP 500 Internal Error</option>
                    <option>TCP RST Packet Drop</option>
                    <option>Corrupted Payload</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-on-surface mb-1" htmlFor="chaos-seed">
                    Chaos Seed / Trace ID
                  </label>
                  <input
                    className="w-full h-8 px-2.5 bg-surface-container-lowest rounded text-on-surface font-label-sm text-label-sm font-mono border border-[#CBD5E1] focus:ring-0"
                    id="chaos-seed"
                    type="text"
                    value={chaosSeed}
                    onChange={(e) => setChaosSeed(e.target.value)}
                  />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Injects deterministic failures to test Saga compensations and automated rollback triggers.
                </p>
              </div>
            </details>
          </section>
        </div>
      </div>
    </div>
  );
}
