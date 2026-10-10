"use client";

import React, { useState, useEffect, useRef } from "react";
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

export function SubscriberActivationWizardView() {
  const router = useRouter();
  const { user } = useAuth();

  // 6-step Onboarding Workflow
  // 1: Customer Information
  // 2: Service Address
  // 3: Select Service Plan
  // 4: Service Identifiers & Hardware
  // 5: Identity Demo Verification (Simulated Aadhaar, OTP & Face Demo)
  // 6: Review & Final Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Catalog items fetched from backend
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>([
    {
      product: "FIBER_500",
      name: "Fiber Broadband 500Mbps",
      description: "High-speed residential gigabit fiber with ONT verification, VLAN reservation, and billing rate setup.",
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

  // STEP 1: Customer Information
  const [customerName, setCustomerName] = useState(() => user?.name || "Aarav Sharma");
  const [contactMobile, setContactMobile] = useState("9820154821");
  const [contactEmail, setContactEmail] = useState("aarav.sharma@airtelmail.in");
  const [customerId, setCustomerId] = useState(() => `CUST-IND-${Math.floor(100000 + Math.random() * 900000)}`);
  const [customerType, setCustomerType] = useState<"individual" | "business">("individual");
  const [preferredContact, setPreferredContact] = useState<"sms" | "email" | "whatsapp">("sms");

  // STEP 2: Service Address
  const [streetAddress, setStreetAddress] = useState("Flat 402, Godrej Woods, Sector 43");
  const [apartmentUnit, setApartmentUnit] = useState("Tower 3, Unit 402");
  const [city, setCity] = useState("Noida");
  const [stateRegion, setStateRegion] = useState("Uttar Pradesh");
  const [postalCode, setPostalCode] = useState("201303");
  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  // STEP 3: Select Service Plan
  const [selectedProduct, setSelectedProduct] = useState<string>("FIBER_500");

  // STEP 4: Service Identifiers
  const [msisdn, setMsisdn] = useState("9820154821");
  const [iccid, setIccid] = useState("89918603211123456780");
  const [installationPreference, setInstallationPreference] = useState("Immediate Morning Slot (09:00 - 13:00)");
  const [clientOrderRef, setClientOrderRef] = useState(
    () => `EXT-CRM-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // STEP 5: Identity Demo Verification (Simulated Aadhaar, OTP & Face Demo)
  // Aadhaar sub-step
  const syntheticAadhaar = "9821 4402 4821";
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Face sub-step
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [faceProcessing, setFaceProcessing] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Demo Failure Scenarios (Allowlisted Sandbox Fault Injection)
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxScenario, setSandboxScenario] = useState<
    "none" | "network_timeout" | "inventory_error" | "billing_rejection" | "compensation_failure"
  >("none");
  const [showFalloutWarningConfirm, setShowFalloutWarningConfirm] = useState(false);

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
        // Fallback to initial catalog
      }
    };
    fetchCatalog();
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Clean up camera stream on unmount or when leaving step 5
  const stopCameraTracks = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraTracks();
    };
  }, [cameraStream]);

  // Attach camera stream to video element when ready
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Send Demo OTP handler (Simulated)
  const handleSendDemoOtp = () => {
    setOtpError(null);
    // Generate 6-digit random demo OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpCountdown(30);
    setEnteredOtp("");

    // Simulate realistic autofill after 1.8s delay with user announcement
    setIsAutofilling(true);
    setTimeout(() => {
      setEnteredOtp(code);
      setIsAutofilling(false);
    }, 1800);
  };

  // Verify Demo OTP
  const handleVerifyDemoOtp = () => {
    setOtpError(null);
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setOtpError("Please enter the 6-digit demo verification code.");
      return;
    }
    if (enteredOtp.trim() !== generatedOtp) {
      setOtpError("Invalid demo OTP. Please check the code or click Resend.");
      return;
    }
    setOtpVerified(true);
  };

  // Start Camera
  const handleEnableCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported in this browser environment. You may proceed with the simulated fallback.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      setCameraStream(stream);
      setCameraEnabled(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(`Camera permission unavailable or denied (${msg}). Demo bypass mode enabled.`);
    }
  };

  // Capture Photo locally (in-memory canvas only - NEVER uploaded)
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedPhotoUrl(dataUrl);
        stopCameraTracks();
      }
    } catch {
      setCapturedPhotoUrl("simulated_frame");
      stopCameraTracks();
    }
  };

  // Retake Photo
  const handleRetakePhoto = () => {
    setCapturedPhotoUrl(null);
    setFaceVerified(false);
    handleEnableCamera();
  };

  // Complete Simulated Face Processing
  const handleCompleteFaceVerification = () => {
    setFaceProcessing(true);
    setTimeout(() => {
      setFaceProcessing(false);
      setFaceVerified(true);
      stopCameraTracks();
    }, 1200);
  };

  // Form Validation per Step
  const validateStep = (step: number): boolean => {
    const errs: string[] = [];

    if (step === 1) {
      if (!customerName.trim()) errs.push("Subscriber Full Name is required.");
      if (!customerId.trim()) errs.push("Customer Account ID is required.");
      const cleanMobile = contactMobile.replace(/\D/g, "");
      if (cleanMobile.length < 10) errs.push("Contact mobile must contain at least 10 digits.");
      if (!contactEmail.trim() || !contactEmail.includes("@")) {
        errs.push("A valid contact email is required for activation notices.");
      }
    }

    if (step === 2) {
      if (!streetAddress.trim()) errs.push("Street Address is required.");
      if (!city.trim()) errs.push("City is required.");
      if (!stateRegion.trim()) errs.push("State / Region is required.");
      if (!postalCode.trim() || postalCode.trim().length < 5) {
        errs.push("Valid postal code (PIN code) is required.");
      }
    }

    if (step === 3) {
      if (!selectedProduct) errs.push("Please select an active telecom product plan.");
    }

    if (step === 4) {
      const cleanMsisdn = msisdn.replace(/\D/g, "");
      if (cleanMsisdn.length < 10) {
        errs.push("MSISDN must contain at least 10 digits (e.g. 9820154821).");
      }

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

    if (step === 5) {
      if (!otpVerified) {
        errs.push("Please complete the demo Aadhaar / OTP verification.");
      }
      if (!faceVerified) {
        errs.push("Please complete the simulated face verification check.");
      }
    }

    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setValidationErrors([]);
      if (currentStep === 5) {
        stopCameraTracks();
      }
      setCurrentStep((s) => (s < 6 ? ((s + 1) as 1 | 2 | 3 | 4 | 5 | 6) : 6));
    }
  };

  const handleBack = () => {
    setValidationErrors([]);
    setApiError(null);
    if (currentStep === 5) {
      stopCameraTracks();
    }
    setCurrentStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5 | 6) : 1));
  };

  // Submit via existing real backend Order API
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // STRICT API PAYLOAD: pass chaos_key mapped from allowlisted sandbox scenario
      let computedChaosKey: string | undefined = undefined;
      if (isSandboxMode && sandboxScenario !== "none") {
        if (sandboxScenario === "network_timeout") {
          // Triggers 504 gateway timeout on provision action
          computedChaosKey = "timeout_provision";
        } else if (sandboxScenario === "inventory_error") {
          // Triggers 422 business error OUT_OF_STOCK on inventory reserve
          computedChaosKey = "fail_business";
        } else if (sandboxScenario === "billing_rejection") {
          // Triggers 500 error on billing start_charging action triggering rollback
          computedChaosKey = "fail_start_charging";
        } else if (sandboxScenario === "compensation_failure") {
          // Triggers rollback followed by deterministic failure during compensation (NEEDS_ATTENTION)
          computedChaosKey = "fail_start_charging_fail_compensation";
        }
      }

      const formattedSiteAddress = `${streetAddress}, ${apartmentUnit ? apartmentUnit + ", " : ""}${city}, ${stateRegion} - ${postalCode}`;

      const payload = {
        client_order_ref: clientOrderRef.trim(),
        customer_id: customerId.trim(),
        product: selectedProduct,
        plan_name: catalogProducts.find((p) => p.product === selectedProduct)?.name,
        site_address: formattedSiteAddress,
        msisdn: msisdn.trim(),
        iccid: (selectedProduct === "MOBILE_5G" || selectedProduct === "ESIM_ADDON") ? iccid.trim() : undefined,
        engine: "temporal",
        chaos_key: computedChaosKey,
        channel: "registrar",
        source: "Registrar Portal",
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

  const stepLabels = [
    { num: 1, label: "Customer Info", icon: "person" },
    { num: 2, label: "Service Address", icon: "home_pin" },
    { num: 3, label: "Choose Plan", icon: "category" },
    { num: 4, label: "SIM & Hardware", icon: "dialpad" },
    { num: 5, label: "Demo Verification", icon: "verified_user" },
    { num: 6, label: "Review & Submit", icon: "fact_check" },
  ];

  return (
    <RegistrarShell>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Link href="/registrar" className="hover:text-slate-800 transition-colors">
                Registrar
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">New Service Activation</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight apple-display-title">
              Service Activation Request
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enterprise customer onboarding, identity verification demonstration, and deterministic saga orchestration.
            </p>
          </div>

          <Link
            href="/registrar"
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors apple-press"
          >
            Cancel &amp; Return
          </Link>
        </div>

        {/* 6-Step Visual Progress Bar - Apple Stepper */}
        <div className="apple-card p-3 sm:p-5 rounded-2xl">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            {stepLabels.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div
                  key={step.num}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                    isCurrent
                      ? "bg-sky-50 text-sky-950 font-bold border border-sky-200/90 shadow-2xs"
                      : isDone
                      ? "text-slate-800 font-medium"
                      : "text-slate-400"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      isDone
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="truncate w-full text-[11px]">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1 animate-in fade-in">
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

        {/* API Error Box */}
        {apiError && (
          <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0">warning</span>
            <div>
              <p className="font-bold">Backend Submission Error</p>
              <p className="mt-0.5 leading-relaxed">{apiError}</p>
            </div>
          </div>
        )}

        {/* FORM CONTAINER - Apple Card */}
        <div className="apple-card rounded-[26px] p-5 sm:p-10 transition-all">
          {/* STEP 1: CUSTOMER INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 1 — Customer Information</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Primary subscriber identity, contact credentials, and customer classification.
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
                    placeholder="e.g. Aarav Sharma"
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
                    Contact Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    placeholder="e.g. 9820154821"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email for Confirmation &amp; Certificate *
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
                    Customer Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerType("individual")}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                        customerType === "individual"
                          ? "bg-sky-50 border-sky-600 text-sky-900 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Individual / Consumer
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType("business")}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                        customerType === "business"
                          ? "bg-sky-50 border-sky-600 text-sky-900 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Enterprise / Corporate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Dispatch Channel
                  </label>
                  <select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value as "sms" | "email" | "whatsapp")}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="sms">SMS Text Alert</option>
                    <option value="email">Electronic Mail (PDF / Certificate)</option>
                    <option value="whatsapp">WhatsApp Business Messenger</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SERVICE ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 2 — Installation &amp; Service Address</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Physical location for fiber drop, ONT termination, and regional circle routing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address &amp; Society Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Godrej Woods, Sector 43"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apartment / Unit / Floor
                  </label>
                  <input
                    type="text"
                    value={apartmentUnit}
                    onChange={(e) => setApartmentUnit(e.target.value)}
                    placeholder="e.g. Tower 3, 4th Floor"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Circle Hub *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Noida / New Delhi"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State / Telecom Circle *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="e.g. Uttar Pradesh / Delhi NCR"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Postal Code (PIN Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 201303"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={sameBillingAddress}
                      onChange={(e) => setSameBillingAddress(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                    />
                    <span>Billing address is identical to installation address</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT SERVICE PLAN */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 3 — Select Telecom Service</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose from active plans registered in the SwitchOn product catalog.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {catalogProducts.map((p) => {
                  const isSelected = selectedProduct === p.product;
                  return (
                    <div
                      key={p.product}
                      onClick={() => setSelectedProduct(p.product)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                        isSelected
                          ? "border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="p-2.5 rounded-xl bg-white border border-slate-200 text-sky-700 material-symbols-outlined text-[24px]">
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

          {/* STEP 4: SERVICE IDENTIFIERS & HARDWARE */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 4 — Routing &amp; Hardware Identifiers</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Specify MSISDN routing, physical SIM card or eSIM EID, and idempotency tracking key.
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

                {selectedProduct === "FIBER_500" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Installation Slot Preference
                    </label>
                    <select
                      value={installationPreference}
                      onChange={(e) => setInstallationPreference(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Immediate Morning Slot (09:00 - 13:00)">Immediate Morning Slot (09:00 - 13:00)</option>
                      <option value="Afternoon Window (14:00 - 18:00)">Afternoon Window (14:00 - 18:00)</option>
                      <option value="Weekend Priority Dispatch">Weekend Priority Dispatch</option>
                    </select>
                  </div>
                )}

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
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Deduplication invariant: ensures duplicate clicks or retries do not create duplicate service orders.
                  </p>
                </div>
              </div>

              {/* Demo Failure Scenarios — Sandbox Only Panel */}
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-800 material-symbols-outlined text-[20px]">
                      bug_report
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Demo Failure Scenarios — Sandbox Only
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          SANDBOX MODE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Deliberately trigger realistic subsystem faults executed by live Temporal sagas and observe Admin NOC fallout propagation.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSandboxMode}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        setIsSandboxMode(nextVal);
                        if (!nextVal) {
                          setSandboxScenario("none");
                          setShowFalloutWarningConfirm(false);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {isSandboxMode && (
                  <div className="pt-3 border-t border-slate-200 space-y-3.5 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[
                        {
                          key: "none",
                          title: "1. Normal Activation",
                          subsystem: "All Subsystems Nominal",
                          desc: "No fault injected. Standard saga execution completes and seals Ed25519 certificate.",
                          outcome: "Terminal State: ACTIVE",
                          hasFallout: false,
                        },
                        {
                          key: "network_timeout",
                          title: "2. Network Timeout",
                          subsystem: "HLR/HSS Gateway (:8103)",
                          desc: "Simulates HTTP 504 gateway timeout on network provision with automated saga retry policy.",
                          outcome: "Retries exhaust → Saga Rollback (Clean)",
                          hasFallout: false,
                        },
                        {
                          key: "inventory_error",
                          title: "3. Inventory Unavailable",
                          subsystem: "SIM & Number Inventory (:8102)",
                          desc: "Simulates 422 OUT_OF_STOCK business rejection. Fast-fails before downstream reservation.",
                          outcome: "Fast Fail → Zero Leakage",
                          hasFallout: false,
                        },
                        {
                          key: "billing_rejection",
                          title: "4. Billing Rejection",
                          subsystem: "Online Charging System (:8104)",
                          desc: "Simulates 500 error on start_charging. Triggers backward compensation releasing network slices.",
                          outcome: "Compensates → Terminal State: ROLLED_BACK",
                          hasFallout: false,
                        },
                        {
                          key: "compensation_failure",
                          title: "5. Compensation Failure",
                          subsystem: "Network Compensation (:8103)",
                          desc: "Rollback attempt fails on deprovision. Halts compensation to prevent inconsistency and escalates.",
                          outcome: "Escalates → Terminal State: NEEDS_ATTENTION (NOC Fallout Queue)",
                          hasFallout: true,
                        },
                      ].map((scenario) => {
                        const isSelected = sandboxScenario === scenario.key;
                        return (
                          <button
                            key={scenario.key}
                            type="button"
                            onClick={() => {
                              setSandboxScenario(scenario.key as typeof sandboxScenario);
                              if (scenario.hasFallout) {
                                setShowFalloutWarningConfirm(true);
                              } else {
                                setShowFalloutWarningConfirm(false);
                              }
                            }}
                            className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between apple-press ${
                              isSelected
                                ? scenario.hasFallout
                                  ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-medium"
                                  : "bg-sky-50 border-sky-600 ring-2 ring-sky-600/20 text-sky-950 font-medium"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-xs">{scenario.title}</span>
                                {scenario.hasFallout && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                    NOC Alert
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 block mb-1.5">
                                {scenario.subsystem}
                              </span>
                              <p className="text-[11px] text-slate-600 leading-snug">
                                {scenario.desc}
                              </p>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-semibold flex items-center justify-between">
                              <span className={scenario.hasFallout ? "text-rose-700 font-mono" : "text-slate-500 font-mono"}>
                                {scenario.outcome}
                              </span>
                              <span className={isSelected ? "text-sky-700 font-bold" : "text-slate-400"}>
                                {isSelected ? "Selected ✓" : "Select"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fallout Warning & Explicit Operator Confirmation */}
                    {showFalloutWarningConfirm && sandboxScenario === "compensation_failure" && (
                      <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-1.5 animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold">
                          <span className="material-symbols-outlined text-[18px] text-rose-600">
                            warning
                          </span>
                          <span>Admin / NOC Portal Escalation Notice</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-rose-800">
                          This scenario intentionally fails an automated compensation step. In accordance with SwitchOn safety invariants, the order will transition to <strong>NEEDS_ATTENTION</strong> and appear immediately in the <strong>Admin Fallout Queue</strong> for engineer remediation.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: SIMULATED IDENTITY DEMO VERIFICATION */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 mb-2">
                  <span className="material-symbols-outlined text-[14px]">science</span>
                  <span>Demo Identity Verification — Simulated Aadhaar / OTP &amp; Face Capture</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Step 5 — Subscriber Identity Verification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete simulated digital verification for consumer SIM provisioning.
                </p>
              </div>

              {/* Notice Banner */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0">shield</span>
                <div>
                  <strong className="font-semibold">Privacy &amp; Sandbox Protection:</strong> This is a synthetic demonstration flow for hackathon evaluation. It does NOT connect to UIDAI, transmit Aadhaar records, or store facial images. No live biometrics or SMS are dispatched.
                </div>
              </div>

              {/* Sub-Step A: Aadhaar & Demo OTP */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                      A
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">Simulated National ID (Aadhaar Demo)</h3>
                  </div>
                  {otpVerified && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Demo OTP Verified</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Masked Synthetic Identifier (Demo Only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={syntheticAadhaar}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono tracking-wider"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Synthetic test record · Not connected to government registry
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      OTP Dispatch Action
                    </label>
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendDemoOtp}
                        className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Send Demo OTP</span>
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={otpCountdown > 0 || otpVerified}
                          onClick={handleSendDemoOtp}
                          className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">refresh</span>
                          <span>Resend {otpCountdown > 0 ? `(${otpCountdown}s)` : ""}</span>
                        </button>
                      </div>
                    )}
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Simulated OTP event — no SMS charge or gateway invoked
                    </p>
                  </div>
                </div>

                {otpSent && !otpVerified && (
                  <div className="mt-3 p-4 bg-white rounded-xl border border-sky-100 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Enter 6-Digit Demo OTP</span>
                      {isAutofilling ? (
                        <span className="text-sky-600 font-medium flex items-center gap-1 animate-pulse text-[11px]">
                          <span className="material-symbols-outlined text-[14px]">sync</span>
                          Simulating carrier autofill...
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Generated code: <strong className="font-mono text-sky-700">{generatedOtp}</strong></span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="w-40 px-3.5 py-2 text-center text-base tracking-widest font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyDemoOtp}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Confirm OTP</span>
                      </button>
                    </div>

                    {otpError && (
                      <p className="text-xs text-rose-600 font-medium">{otpError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-Step B: Face Verification Demo */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                      B
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">Face Verification Demo (Local Camera Preview)</h3>
                  </div>
                  {faceVerified && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Demo Capture Complete</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Interactive camera preview demonstrating in-browser liveness checks. Your camera feed stays strictly in local browser memory and is never stored or uploaded.
                </p>

                {cameraError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                    <span>{cameraError}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFaceVerified(true);
                        setCameraError(null);
                      }}
                      className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold text-[11px] hover:bg-rose-100"
                    >
                      Bypass Demo
                    </button>
                  </div>
                )}

                {/* Camera Viewport */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-64 h-48 bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-700 flex items-center justify-center shadow-inner">
                    {capturedPhotoUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                        {capturedPhotoUrl.startsWith("data:") ? (
                          <img
                            src={capturedPhotoUrl}
                            alt="Captured demo frame"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-300 text-xs">
                            <span className="material-symbols-outlined text-[36px] text-emerald-400">face</span>
                            <p className="mt-1 font-semibold">Simulated Frame Captured</p>
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          Frame Stored In-Memory
                        </span>
                      </div>
                    ) : cameraEnabled ? (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 border-2 border-dashed border-sky-400/60 rounded-2xl pointer-events-none m-3"></div>
                        <span className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Live Preview
                        </span>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <span className="material-symbols-outlined text-[32px] text-slate-500">videocam_off</span>
                        <p className="text-xs mt-1">Camera Standby</p>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    {!cameraEnabled && !capturedPhotoUrl && !faceVerified && (
                      <button
                        type="button"
                        onClick={handleEnableCamera}
                        className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                        <span>Enable Camera for Demo</span>
                      </button>
                    )}

                    {cameraEnabled && !capturedPhotoUrl && (
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                        <span>Capture Frame</span>
                      </button>
                    )}

                    {capturedPhotoUrl && !faceVerified && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={faceProcessing}
                          onClick={handleCompleteFaceVerification}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                        >
                          {faceProcessing ? (
                            <>
                              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                              <span>Evaluating Sample...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px]">verified</span>
                              <span>Complete Demo Verification</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleRetakePhoto}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    )}

                    {faceVerified && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          <span>Demo face capture completed</span>
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Synthetic biometric demonstration fulfilled. No biometric templates stored or transmitted.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & FINAL SUBMISSION */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 6 — Final Review &amp; Confirmation</h2>
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
                    <strong>Notification Contact:</strong> {contactMobile} · {contactEmail}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Installation Site:</strong> {streetAddress}, {city}, {stateRegion} - {postalCode}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>Demo Aadhaar &amp; Face Verified (Synthetic)</span>
                  </div>
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
                  {selectedProduct === "FIBER_500" && (
                    <div className="text-xs text-slate-600">
                      <strong>Installation Slot:</strong> {installationPreference}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Sandbox Scenario Notice in Review */}
              {isSandboxMode && sandboxScenario !== "none" && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  sandboxScenario === "compensation_failure"
                    ? "bg-rose-50/90 border-rose-300 text-rose-950"
                    : "bg-amber-50/90 border-amber-300 text-amber-950"
                }`}>
                  <span className="material-symbols-outlined text-[22px] shrink-0 text-amber-700">
                    bug_report
                  </span>
                  <div>
                    <strong className="font-bold block text-sm">
                      Demo Failure Mode Active: {
                        sandboxScenario === "network_timeout"
                          ? "Network Gateway Timeout (504)"
                          : sandboxScenario === "inventory_error"
                          ? "Inventory Unavailable (422 Business Error)"
                          : sandboxScenario === "billing_rejection"
                          ? "Billing Charging Rejection (500 Saga Rollback)"
                          : "Compensation Failure (NEEDS_ATTENTION Escalation)"
                      }
                    </strong>
                    <p className="mt-1 leading-relaxed text-[11px] opacity-90">
                      This order will be processed with an injected test fault. The orchestrator will execute real compensating actions and update the live status tracker and Admin NOC portal accordingly.
                    </p>
                  </div>
                </div>
              )}

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

            {currentStep < 6 ? (
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
