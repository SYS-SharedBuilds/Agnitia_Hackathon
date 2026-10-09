"use client";

import React, { useState } from "react";

interface CatalogTask {
  id: string;
  name: string;
  system: string;
  port: number;
  actionRoutine: string;
  wave: number;
  upstreamDeps: string[];
  retryPolicy: string;
  timeoutMs: number;
  compensationAction?: string;
  flag: "read_only" | "mutating" | "best_effort" | "strict_commit";
}

interface ProductSpecification {
  id: string;
  name: string;
  tagline: string;
  version: string;
  tasksCount: number;
  wavesCount: number;
  slaSeconds: number;
  subsystems: string[];
  deployedAt: string;
  deployedBy: string;
  checksum: string;
  status: "PROD_ACTIVE" | "PROD";
  yamlSpec: string;
  tasks: CatalogTask[];
}

const PRODUCTS: ProductSpecification[] = [
  {
    id: "fiber-broadband",
    name: "Fiber Broadband",
    tagline: "FTTH GPON/XGS-PON provisioning saga",
    version: "v2.4.0",
    tasksCount: 7,
    wavesCount: 3,
    slaSeconds: 6.0,
    subsystems: ["ONT", "OLT", "OCS"],
    deployedAt: "2026-07-10 18:22 UTC",
    deployedBy: "ci-bot@switchon.internal",
    checksum: "sha256:d8a2...3f1c",
    status: "PROD_ACTIVE",
    yamlSpec: `version: "2.4.0"
name: fiber_broadband_provisioning
domain: telecom.access.ftth
target_sla_seconds: 6.0
idempotency_key_path: "payload.order_id"

waves:
  - wave_id: 1
    description: "Customer Eligibility & Port Lock"
    concurrency_limit: 2
    tasks:
      - id: validate_customer_eligibility
        system: OMS
        port: 8101
        action: VerifyAddressAndCredit
        type: READ_ONLY
        timeout_ms: 1500
      - id: reserve_terminal_port
        system: Inventory
        port: 8102
        action: LockGponPortAndSplitter
        type: MUTATING
        timeout_ms: 3000
        compensation:
          id: release_terminal_port
          action: ReleaseGponPortLock

  - wave_id: 2
    description: "Network Activation & Telemetry"
    depends_on_waves: [1]
    tasks:
      - id: provision_ont_bridge
        system: Network
        port: 8103
        action: ConfigureCpeBridge
        depends_on: [reserve_terminal_port]
        compensation: deprovision_ont_bridge
      - id: bind_qos_profile
        system: Network
        port: 8103
        action: SetBandwidthSlice
        params: { slice: "500M_SYM" }
        depends_on: [reserve_terminal_port]
        compensation: unbind_qos_profile
      - id: verify_optical_power
        system: Network
        port: 8103
        action: SampleOtdrTelemetry
        depends_on: [provision_ont_bridge]
        type: BEST_EFFORT

  - wave_id: 3
    description: "Billing Engagement & Customer Welcome"
    depends_on_waves: [2]
    tasks:
      - id: activate_tariff_billing
        system: Billing
        port: 8104
        action: InstantiateChargeLedger
        depends_on: [bind_qos_profile, provision_ont_bridge]
        compensation: revoke_charge_ledger
        commit_level: STRICT_COMMIT
      - id: dispatch_welcome_notification
        system: Notification
        port: 8105
        action: SendSmsAndEmail
        depends_on: [activate_tariff_billing]
        type: BEST_EFFORT`,
    tasks: [
      {
        id: "validate_customer_eligibility",
        name: "Validate Customer Eligibility",
        system: "OMS (8101)",
        port: 8101,
        actionRoutine: "VerifyAddressAndCredit",
        wave: 1,
        upstreamDeps: [],
        retryPolicy: "3 max · exp 200ms",
        timeoutMs: 1500,
        flag: "read_only",
      },
      {
        id: "reserve_terminal_port",
        name: "Reserve Terminal Port",
        system: "Inventory (8102)",
        port: 8102,
        actionRoutine: "LockGponPortAndSplitter",
        wave: 1,
        upstreamDeps: [],
        retryPolicy: "5 max · jitter 500ms",
        timeoutMs: 3000,
        compensationAction: "release_terminal_port",
        flag: "mutating",
      },
      {
        id: "provision_ont_bridge",
        name: "Provision ONT Bridge",
        system: "Network (8103)",
        port: 8103,
        actionRoutine: "ConfigureCpeBridge",
        wave: 2,
        upstreamDeps: ["reserve_terminal_port"],
        retryPolicy: "3 max · exp 300ms",
        timeoutMs: 2500,
        compensationAction: "deprovision_ont_bridge",
        flag: "mutating",
      },
      {
        id: "bind_qos_profile",
        name: "Bind QoS Profile",
        system: "Network (8103)",
        port: 8103,
        actionRoutine: "SetBandwidthSlice (500M)",
        wave: 2,
        upstreamDeps: ["reserve_terminal_port"],
        retryPolicy: "3 max · exp 300ms",
        timeoutMs: 2000,
        compensationAction: "unbind_qos_profile",
        flag: "mutating",
      },
      {
        id: "verify_optical_power",
        name: "Verify Optical Power",
        system: "Network (8103)",
        port: 8103,
        actionRoutine: "SampleOtdrTelemetry",
        wave: 2,
        upstreamDeps: ["provision_ont_bridge"],
        retryPolicy: "1 max · no retry",
        timeoutMs: 1000,
        flag: "best_effort",
      },
      {
        id: "activate_tariff_billing",
        name: "Activate Tariff Billing",
        system: "Billing (8104)",
        port: 8104,
        actionRoutine: "InstantiateChargeLedger",
        wave: 3,
        upstreamDeps: ["bind_qos_profile", "provision_ont_bridge"],
        retryPolicy: "5 max · jitter 1000ms",
        timeoutMs: 5000,
        compensationAction: "revoke_charge_ledger",
        flag: "strict_commit",
      },
      {
        id: "dispatch_welcome_notification",
        name: "Dispatch Welcome Notification",
        system: "Notify (8105)",
        port: 8105,
        actionRoutine: "SendSmsAndEmail",
        wave: 3,
        upstreamDeps: ["activate_tariff_billing"],
        retryPolicy: "2 max · exp 500ms",
        timeoutMs: 2000,
        flag: "best_effort",
      },
    ],
  },
  {
    id: "5g-postpaid",
    name: "5G Postpaid",
    tagline: "eSIM/pSIM IMSI & Network Slice allocation",
    version: "v1.9.2",
    tasksCount: 5,
    wavesCount: 2,
    slaSeconds: 4.5,
    subsystems: ["HLR", "HSS", "SMF"],
    deployedAt: "2026-07-08 11:15 UTC",
    deployedBy: "ci-bot@switchon.internal",
    checksum: "sha256:b14e...99c4",
    status: "PROD",
    yamlSpec: `version: "1.9.2"
name: 5g_postpaid_activation
domain: telecom.core.5g
target_sla_seconds: 4.5

waves:
  - wave_id: 1
    tasks:
      - id: allocate_imsi_sim
        system: SIM
        port: 8102
        action: AssignImsiProfile
      - id: verify_kyc_status
        system: OMS
        port: 8101
        action: CheckRegulatoryKyc
  - wave_id: 2
    tasks:
      - id: provision_5g_slice
        system: Network
        port: 8103
        action: Set5gCoreQos
      - id: bind_ocs_account
        system: Billing
        port: 8104
        action: OpenSubscriptionLedger`,
    tasks: [
      {
        id: "allocate_imsi_sim",
        name: "Allocate IMSI Profile",
        system: "SIM (8102)",
        port: 8102,
        actionRoutine: "AssignImsiProfile",
        wave: 1,
        upstreamDeps: [],
        retryPolicy: "3 max · exp 200ms",
        timeoutMs: 2000,
        compensationAction: "release_imsi_profile",
        flag: "mutating",
      },
      {
        id: "verify_kyc_status",
        name: "Verify KYC Status",
        system: "OMS (8101)",
        port: 8101,
        actionRoutine: "CheckRegulatoryKyc",
        wave: 1,
        upstreamDeps: [],
        retryPolicy: "2 max · no retry",
        timeoutMs: 1200,
        flag: "read_only",
      },
      {
        id: "provision_5g_slice",
        name: "Provision 5G Slice",
        system: "Network (8103)",
        port: 8103,
        actionRoutine: "Set5gCoreQos",
        wave: 2,
        upstreamDeps: ["allocate_imsi_sim"],
        retryPolicy: "4 max · exp 400ms",
        timeoutMs: 3500,
        compensationAction: "deprovision_5g_slice",
        flag: "mutating",
      },
      {
        id: "bind_ocs_account",
        name: "Bind OCS Account",
        system: "Billing (8104)",
        port: 8104,
        actionRoutine: "OpenSubscriptionLedger",
        wave: 2,
        upstreamDeps: ["provision_5g_slice"],
        retryPolicy: "3 max · jitter 500ms",
        timeoutMs: 3000,
        compensationAction: "close_subscription_ledger",
        flag: "strict_commit",
      },
      {
        id: "sms_welcome",
        name: "Send Welcome SMS",
        system: "Notify (8105)",
        port: 8105,
        actionRoutine: "SendWelcomeMessage",
        wave: 2,
        upstreamDeps: ["bind_ocs_account"],
        retryPolicy: "2 max",
        timeoutMs: 1500,
        flag: "best_effort",
      },
    ],
  },
  {
    id: "esim-addon",
    name: "eSIM Add-on",
    tagline: "Instant QR remote SIM provisioning",
    version: "v1.3.4",
    tasksCount: 4,
    wavesCount: 2,
    slaSeconds: 2.0,
    subsystems: ["SM-DP+", "OCS"],
    deployedAt: "2026-07-05 09:40 UTC",
    deployedBy: "ci-bot@switchon.internal",
    checksum: "sha256:77ae...4419",
    status: "PROD",
    yamlSpec: `version: "1.3.4"
name: esim_addon_provisioning
domain: telecom.consumer.esim
target_sla_seconds: 2.0

waves:
  - wave_id: 1
    tasks:
      - id: generate_smdpp_profile
        system: SIM
        port: 8102
        action: RequestEsimQrPayload
  - wave_id: 2
    tasks:
      - id: bind_esim_billing
        system: Billing
        port: 8104
        action: ApplyAddonCharge
      - id: send_esim_qr_email
        system: Notify
        port: 8105
        action: DispatchQrTokenEmail`,
    tasks: [
      {
        id: "generate_smdpp_profile",
        name: "Generate SM-DP+ Profile",
        system: "SIM (8102)",
        port: 8102,
        actionRoutine: "RequestEsimQrPayload",
        wave: 1,
        upstreamDeps: [],
        retryPolicy: "3 max · exp 150ms",
        timeoutMs: 1500,
        compensationAction: "revoke_smdpp_profile",
        flag: "mutating",
      },
      {
        id: "bind_esim_billing",
        name: "Bind Add-on Billing",
        system: "Billing (8104)",
        port: 8104,
        actionRoutine: "ApplyAddonCharge",
        wave: 2,
        upstreamDeps: ["generate_smdpp_profile"],
        retryPolicy: "3 max · jitter 300ms",
        timeoutMs: 2000,
        compensationAction: "refund_addon_charge",
        flag: "strict_commit",
      },
      {
        id: "send_esim_qr_email",
        name: "Dispatch QR Email",
        system: "Notify (8105)",
        port: 8105,
        actionRoutine: "DispatchQrTokenEmail",
        wave: 2,
        upstreamDeps: ["bind_esim_billing"],
        retryPolicy: "2 max",
        timeoutMs: 1500,
        flag: "best_effort",
      },
    ],
  },
];

export default function CatalogPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductSpecification>(PRODUCTS[0]);
  const [activeTab, setActiveTab] = useState<"graph" | "yaml" | "validation">("graph");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [copiedSpec, setCopiedSpec] = useState(false);

  // Filter products
  const filteredProducts = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.tagline.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  // Filter tasks in current product
  const filteredTasks = selectedProduct.tasks.filter(
    (t) =>
      t.id.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.system.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.actionRoutine.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const copyRawSpec = () => {
    navigator.clipboard.writeText(selectedProduct.yamlSpec);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  const handleExportPackage = () => {
    const pkg = {
      specVersion: "2.4.1",
      exportedAt: new Date().toISOString(),
      cluster: "us-east-core",
      products: PRODUCTS,
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `switchon-catalog-specs-v2.4.1.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Context Header Card */}
      <div className="bg-white rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs border border-[#CBD5E1]">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A1B2E] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
            </span>
            <h1 className="font-headline-md text-headline-md text-[#0A1B2E] tracking-tight font-bold truncate">
              Service Catalog &amp; DAG Orchestration
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-[#64748B] max-w-3xl">
            Formal saga workflow definitions, dependency DAGs, and compensation guarantees across telecommunication subsystems.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => alert("Upload YAML specification dialog opened.")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0A1B2E] border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors font-body-sm text-body-sm font-medium shadow-2xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#64748B]">file_upload</span>
            <span>Import YAML Spec</span>
          </button>
          <button
            onClick={handleExportPackage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0A1B2E] border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors font-body-sm text-body-sm font-medium shadow-2xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#64748B]">download</span>
            <span>Export Package (v2.4.1)</span>
          </button>
          <button
            onClick={() => alert("Initiate new service specification builder wizard.")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A1B2E] hover:bg-[#14263b] text-white rounded-lg transition-colors font-body-sm text-body-sm font-semibold shadow-2xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Service Specification</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Column Console Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR: Service Specifications List (w-80 / 320px) */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col gap-3 border border-[#E3E8F0]">
            {/* Sidebar Filter & Count */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Specifications
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                  {PRODUCTS.length} Active
                </span>
              </div>
              <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">tune</span>
            </div>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-[#94A3B8]">
                search
              </span>
              <input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-surface-container-low rounded-lg text-on-surface placeholder:text-[#94A3B8] font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary"
                placeholder="Filter catalog..."
                type="text"
              />
            </div>

            {/* Catalog Product Cards */}
            <div className="flex flex-col gap-2 pt-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProduct.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`p-3 rounded-lg transition-all flex flex-col gap-1 shadow-xs cursor-pointer relative overflow-hidden border ${
                      isSelected
                        ? "bg-surface-container-low text-on-surface border-primary"
                        : "bg-surface-container-lowest hover:bg-surface-container-low/60 text-on-surface border-[#E2E8F0]"
                    }`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                    <div className="flex items-start justify-between pl-1">
                      <div>
                        <span
                          className={`font-headline-sm text-headline-sm leading-tight block font-semibold ${
                            isSelected ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {p.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                          {p.tagline}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-surface-container-lowest px-1.5 py-0.5 rounded shadow-2xs font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        PROD
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-1 pt-1">
                      <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono">
                        {p.version}
                      </span>
                      <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono">
                        {p.tasksCount} Tasks
                      </span>
                      <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono">
                        {p.wavesCount} Waves
                      </span>
                    </div>
                    <div className="flex items-center justify-between pl-1 pt-2 text-[#94A3B8] font-label-sm text-label-sm font-mono">
                      <span>SLA: {p.slaSeconds.toFixed(1)}s</span>
                      <span>{p.subsystems.join(" · ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Rail Helper / Invariant Guarantee Card */}
          <div className="p-4 rounded-xl bg-surface-container-low text-on-surface flex flex-col gap-2 shadow-xs border border-[#E3E8F0]">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider font-mono">
                DAG Invariant Compiler
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              All catalog sagas enforce acyclic graphs, strict phase commits, and inverse compensation rollbacks prior to cluster deployment.
            </p>
            <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#E2E8F0]">
              <span>Engine: Temporal Sagas</span>
              <span className="font-semibold text-primary">v2.4 Runtime</span>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN WORKSPACE: Selected Service Orchestration Detail */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
          {/* Card Container for Saga Overview & Interactive Tabs */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-6 border border-[#E3E8F0]">
            {/* Header Info & Tab Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#E3E8F0]">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  <span>Catalog</span>
                  <span className="text-outline">/</span>
                  <span className="font-semibold text-primary">
                    {selectedProduct.name} ({selectedProduct.version})
                  </span>
                  <span className="text-outline">•</span>
                  <span>
                    Deployed {selectedProduct.deployedAt} by{" "}
                    <code className="text-on-surface font-mono">{selectedProduct.deployedBy}</code>
                  </span>
                  <span className="text-outline">•</span>
                  <span className="text-outline font-label-sm font-mono">{selectedProduct.checksum}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                    {selectedProduct.name} Provisioning Saga
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    PROD_ACTIVE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">rule</span>
                    TLA+ VERIFIED
                  </span>
                </div>
              </div>

              {/* Segmented Tab Strip */}
              <div className="flex items-center p-1 bg-surface-container-low rounded-xl shrink-0 self-start lg:self-center border border-[#E2E8F0]">
                <button
                  onClick={() => setActiveTab("graph")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-body-sm text-body-sm transition-all cursor-pointer ${
                    activeTab === "graph"
                      ? "bg-surface-container-lowest font-semibold text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface font-medium"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  <span>Graph View</span>
                </button>
                <button
                  onClick={() => setActiveTab("yaml")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-body-sm text-body-sm transition-all cursor-pointer ${
                    activeTab === "yaml"
                      ? "bg-surface-container-lowest font-semibold text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface font-medium"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  <span>YAML Spec</span>
                </button>
                <button
                  onClick={() => setActiveTab("validation")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-body-sm text-body-sm transition-all cursor-pointer ${
                    activeTab === "validation"
                      ? "bg-surface-container-lowest font-semibold text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface font-medium"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                  <span>Validation</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm font-mono">
                    3/3
                  </span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: GRAPH VIEW */}
            {activeTab === "graph" && (
              <div className="flex flex-col gap-6">
                {/* Swim-lanes Execution DAG */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 font-semibold">
                        <span>Execution DAG (Wave Swim-lanes)</span>
                        <span className="font-label-sm text-label-sm font-normal text-outline">
                          Deterministic Partial Order
                        </span>
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Tasks grouped by execution wave. Within each wave, tasks execute concurrently. Wave{" "}
                        <span className="font-mono">N+1</span> dispatches only after preceding wave resolves.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm font-mono">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-primary"></span> Read-Only
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-secondary"></span> Mutating w/ Rollback
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-outline"></span> Best Effort
                      </span>
                    </div>
                  </div>

                  {/* Wave Swim-lane Canvas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 pt-2">
                    {/* WAVE 1 */}
                    <div className="bg-surface-container-low rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs border border-[#E2E8F0] min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary text-white font-label-sm text-label-sm flex items-center justify-center font-bold">
                            1
                          </span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                            Wave 1 — Verify &amp; Lock
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                          2 Concurrent
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {/* Node 1.1 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-primary font-mono break-all sm:break-normal">
                              validate_customer_eligibility
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm uppercase font-mono shrink-0">
                              Read_Only
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">dns</span> OMS (8101)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">VerifyAddressAndCredit</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span>Timeout: 1,500ms</span>
                            <span className="text-tertiary">Comp: None</span>
                          </div>
                        </div>

                        {/* Connector Arrow */}
                        <div className="flex justify-center text-[#94A3B8]">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </div>

                        {/* Node 1.2 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-secondary font-mono break-all sm:break-normal">
                              reserve_terminal_port
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm uppercase font-mono shrink-0">
                              Mutating
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">inventory_2</span> Inventory (8102)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">LockGponPortAndSplitter</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span>Timeout: 3,000ms</span>
                            <span className="text-primary font-mono truncate" title="release_terminal_port">↩ release_terminal_port</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WAVE 2 */}
                    <div className="bg-surface-container-low rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs border border-[#E2E8F0] min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-secondary text-white font-label-sm text-label-sm flex items-center justify-center font-bold">
                            2
                          </span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                            Wave 2 — Slice Config
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                          3 Concurrent
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {/* Node 2.1 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-secondary font-mono break-all sm:break-normal">
                              provision_ont_bridge
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm uppercase font-mono shrink-0">
                              Mutating
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">router</span> Network (8103)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">ConfigureCpeBridge</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span className="truncate">Deps: [reserve_terminal_port]</span>
                            <span className="text-primary font-mono truncate" title="deprovision_ont_bridge">↩ deprovision_ont_bridge</span>
                          </div>
                        </div>

                        {/* Node 2.2 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-secondary font-mono break-all sm:break-normal">
                              bind_qos_profile
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm uppercase font-mono shrink-0">
                              Mutating
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">speed</span> Network (8103)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">SetBandwidthSlice (500M)</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span className="truncate">Deps: [reserve_terminal_port]</span>
                            <span className="text-primary font-mono truncate" title="unbind_qos_profile">↩ unbind_qos_profile</span>
                          </div>
                        </div>

                        {/* Node 2.3 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface font-mono break-all sm:break-normal">
                              verify_optical_power
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase font-mono shrink-0">
                              Best_Effort
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">sensors</span> Network (8103)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">SampleOtdrTelemetry</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span className="truncate">Deps: [provision_ont_bridge]</span>
                            <span className="text-tertiary shrink-0">Comp: None</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WAVE 3 */}
                    <div className="bg-surface-container-low rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs border border-[#E2E8F0] min-w-0 md:col-span-2 2xl:col-span-1">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-tertiary-container text-white font-label-sm text-label-sm flex items-center justify-center font-bold">
                            3
                          </span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                            Wave 3 — Billing &amp; Comms
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono">
                          2 Sequential
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {/* Node 3.1 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-secondary font-mono break-all sm:break-normal">
                              activate_tariff_billing
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm uppercase font-semibold font-mono shrink-0">
                              Strict_Commit
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">receipt_long</span> Billing (8104)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">InstantiateChargeLedger</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span className="truncate">Deps: [bind_qos, provision_ont]</span>
                            <span className="text-primary font-mono truncate" title="revoke_charge_ledger">↩ revoke_charge_ledger</span>
                          </div>
                        </div>

                        {/* Connector Arrow */}
                        <div className="flex justify-center text-[#94A3B8]">
                          <span className="material-symbols-outlined text-[16px]">south</span>
                        </div>

                        {/* Node 3.2 */}
                        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-1 border border-[#E2E8F0] min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface font-mono break-all sm:break-normal">
                              dispatch_welcome_notification
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase font-mono shrink-0">
                              Best_Effort
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 font-body-sm text-body-sm text-on-surface-variant pt-1">
                            <span className="flex items-center gap-1 font-mono text-[#64748B] shrink-0">
                              <span className="material-symbols-outlined text-[14px]">send</span> Notify (8105)
                            </span>
                            <span className="font-mono text-on-surface text-[12px] truncate">SendSmsAndEmail</span>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1 font-label-sm text-label-sm text-[#94A3B8] font-mono border-t border-[#F1F5F9]">
                            <span className="truncate">Deps: [activate_tariff_billing]</span>
                            <span className="text-tertiary">Comp: None</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TASK SPECIFICATION DATA TABLE */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Task Register Specification
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-mono font-semibold">
                        {filteredTasks.length} Tasks Registered
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2 top-1.5 text-[16px] text-outline">
                          search
                        </span>
                        <input
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          className="h-7 pl-7 pr-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none w-56 border border-transparent focus:border-primary"
                          placeholder="Filter tasks by system, ID..."
                          type="text"
                        />
                      </div>
                      <button
                        className="p-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">filter_list</span>
                      </button>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-x-auto rounded-xl shadow-xs bg-surface-container-lowest border border-[#E2E8F0]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-9">
                          <th className="py-2 px-3 font-semibold">Task ID &amp; Identifier</th>
                          <th className="py-2 px-3 font-semibold">Subsystem</th>
                          <th className="py-2 px-3 font-semibold">Action Routine</th>
                          <th className="py-2 px-3 font-semibold">Wave &amp; Upstream Deps</th>
                          <th className="py-2 px-3 font-semibold">Retry Policy</th>
                          <th className="py-2 px-3 font-semibold">Timeout</th>
                          <th className="py-2 px-3 font-semibold">Compensation Action</th>
                          <th className="py-2 px-3 font-semibold">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF0F5] font-body-sm text-body-sm text-on-surface">
                        {filteredTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="py-2.5 px-3 font-label-sm text-label-sm font-semibold font-mono text-primary">
                              {task.id}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[12px] text-outline">{task.system}</td>
                            <td className="py-2.5 px-3 font-mono text-[12px]">{task.actionRoutine}</td>
                            <td className="py-2.5 px-3 font-label-sm text-label-sm text-outline font-mono">
                              W{task.wave} · {task.upstreamDeps.length > 0 ? `[${task.upstreamDeps.join(", ")}]` : "none"}
                            </td>
                            <td className="py-2.5 px-3 font-label-sm text-label-sm font-mono">{task.retryPolicy}</td>
                            <td className="py-2.5 px-3 font-label-sm text-label-sm font-mono">{task.timeoutMs}ms</td>
                            <td className="py-2.5 px-3 font-mono text-[12px]">
                              {task.compensationAction ? (
                                <span className="text-primary">{task.compensationAction}</span>
                              ) : (
                                <span className="text-outline">— (None)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-mono ${
                                  task.flag === "read_only"
                                    ? "bg-surface-container text-primary"
                                    : task.flag === "mutating"
                                    ? "bg-surface-container-high text-secondary font-semibold"
                                    : task.flag === "strict_commit"
                                    ? "bg-surface-container-high text-secondary font-bold"
                                    : "bg-surface-container-highest text-outline"
                                }`}
                              >
                                {task.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: YAML SPECIFICATION */}
            {activeTab === "yaml" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {selectedProduct.name} DAG Specification
                    </span>
                    <span className="font-label-sm text-label-sm text-outline font-mono">
                      {selectedProduct.id}_v2.4.0.yaml
                    </span>
                  </div>
                  <button
                    onClick={copyRawSpec}
                    className="flex items-center gap-1 font-body-sm text-body-sm text-primary hover:underline cursor-pointer font-medium"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedSpec ? "check" : "content_copy"}
                    </span>
                    <span>{copiedSpec ? "Copied Spec!" : "Copy Raw Spec"}</span>
                  </button>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 font-mono text-[13px] leading-relaxed text-on-surface overflow-x-auto shadow-inner border border-[#E2E8F0]">
                  <pre className="text-on-surface">{selectedProduct.yamlSpec}</pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: VALIDATION & FORMAL SAFETY */}
            {activeTab === "validation" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Specification Integrity &amp; Formal Verification
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Validated against Temporal cluster runtime invariant suite v2.4.1.
                    </p>
                  </div>
                  <button
                    onClick={() => alert("Re-running TLA+ model checker across active DAG tasks... All invariants satisfied.")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-body-sm text-body-sm font-semibold transition-colors cursor-pointer border border-[#E2E8F0]"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">refresh</span>
                    <span>Re-run TLA+ Checker</span>
                  </button>
                </div>

                {/* 3 PASS verification cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Check 1 */}
                  <div className="p-4 rounded-xl bg-surface-container-low text-on-surface flex flex-col gap-1 shadow-xs border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 text-secondary pb-1">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-semibold">
                        Acyclic Verification
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Topological sort completed in 0.4ms. 0 cycles detected across 7 nodes. Strict partial order guaranteed.
                    </p>
                    <div className="pt-2 font-label-sm text-label-sm text-outline flex justify-between items-center font-mono border-t border-[#E2E8F0]">
                      <span>Cycles: 0</span>
                      <span className="font-semibold text-secondary">PASS</span>
                    </div>
                  </div>

                  {/* Check 2 */}
                  <div className="p-4 rounded-xl bg-surface-container-low text-on-surface flex flex-col gap-1 shadow-xs border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 text-secondary pb-1">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-semibold">
                        Billing Invariant (INV-02)
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Task <code className="font-mono text-on-surface">activate_tariff_billing</code> strictly depends on upstream network activation ACK.
                    </p>
                    <div className="pt-2 font-label-sm text-label-sm text-outline flex justify-between items-center font-mono border-t border-[#E2E8F0]">
                      <span>Premature Bill Risk: 0.00%</span>
                      <span className="font-semibold text-secondary">PASS</span>
                    </div>
                  </div>

                  {/* Check 3 */}
                  <div className="p-4 rounded-xl bg-surface-container-low text-on-surface flex flex-col gap-1 shadow-xs border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 text-secondary pb-1">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-semibold">
                        Compensation Completeness
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      All mutating tasks (4/4) define an inverse idempotent compensation action with matching keys.
                    </p>
                    <div className="pt-2 font-label-sm text-label-sm text-outline flex justify-between items-center font-mono border-t border-[#E2E8F0]">
                      <span>Coverage: 100% (4/4)</span>
                      <span className="font-semibold text-secondary">PASS</span>
                    </div>
                  </div>
                </div>

                {/* Formal Safety Matrix Log */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col gap-1 border border-[#E2E8F0]">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                    Formal Model Checker Trace Log
                  </span>
                  <div className="font-mono text-[12px] text-on-surface-variant flex flex-col gap-1 pt-1">
                    <div>[2026-07-10 18:22:01.104] INFO: Model checker instantiated with spec &apos;{selectedProduct.id}_v2.4.0&apos;</div>
                    <div>[2026-07-10 18:22:01.121] PASS: Tarjan algorithm verified graph DAG-G=(V={selectedProduct.tasksCount}, E={selectedProduct.tasksCount + 1}) has no strongly connected components of size &gt; 1.</div>
                    <div>[2026-07-10 18:22:01.139] PASS: Invariant INV-COMMERCE-01 satisfied: No billing ledger entries pre-exist terminal port locks.</div>
                    <div>[2026-07-10 18:22:01.144] PASS: Idempotency keys match schema regex ^order_[a-z0-9]&#123;12&#125;$. Compensation rollback tree complete.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM SECTION: Specification Invariants & Formal Safety Checks */}
          <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-4 border border-[#E3E8F0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Cluster Deployment Verification Checklist
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-secondary bg-surface-container-low px-2 py-0.5 rounded font-semibold font-mono border border-[#CBD5E1]">
                ALL GATES CLEARED
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-[#E2E8F0]">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">verified</span>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">Acyclic Verification</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">
                    Strict partial order guaranteed; 0 cycles found.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-[#E2E8F0]">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">shield</span>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">Billing Invariant</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">
                    Strict sequence guarantees billing follows network ACK.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-[#E2E8F0]">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                  published_with_changes
                </span>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                    Compensation Completeness
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">
                    All 4 mutating steps have matched rollback actions.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
