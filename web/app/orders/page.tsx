"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Order } from "@/lib/types";

interface DisplayOrder {
  id: string;
  clientRef: string;
  customer: string;
  msisdn: string;
  product: string;
  status: "RUNNING" | "SUCCEEDED" | "RETRYING" | "NEEDS_ATTENTION" | "FAILED" | "COMPENSATING" | "COMPENSATED" | "PENDING";
  tasksCompleted: number;
  totalTasks: number;
  taskDetail: string;
  retries: string;
  activationTime: string;
  created: string;
  certStatus: "verified" | "pending" | "revoked" | "none";
}

const INITIAL_ORDERS: DisplayOrder[] = [
  {
    id: "ORD-20260712-004217",
    clientRef: "EXT-CRM-991024",
    customer: "Marcus Vance",
    msisdn: "+1 555 019-4821",
    product: "Fiber Broadband 500",
    status: "RUNNING",
    tasksCompleted: 6,
    totalTasks: 8,
    taskDetail: "75%",
    retries: "0",
    activationTime: "3.2s",
    created: "2m ago",
    certStatus: "verified",
  },
  {
    id: "ORD-20260712-004216",
    clientRef: "EXT-CRM-991023",
    customer: "Eleanor Vance-Pryce",
    msisdn: "+44 7700 900142",
    product: "5G Postpaid Unlimited",
    status: "SUCCEEDED",
    tasksCompleted: 8,
    totalTasks: 8,
    taskDetail: "100%",
    retries: "0",
    activationTime: "4.1s",
    created: "6m ago",
    certStatus: "verified",
  },
  {
    id: "ORD-20260712-004215",
    clientRef: "EXT-CRM-990998",
    customer: "Kavita Narang",
    msisdn: "+91 98200 44911",
    product: "eSIM Roaming Global",
    status: "RETRYING",
    tasksCompleted: 4,
    totalTasks: 8,
    taskDetail: "HLR lock",
    retries: "2 (backoff)",
    activationTime: "12.8s",
    created: "10m ago",
    certStatus: "pending",
  },
  {
    id: "ORD-20260712-004214",
    clientRef: "EXT-CRM-990881",
    customer: "Apex Systems GmbH",
    msisdn: "+49 30 2312 990",
    product: "Enterprise SIP Trunk",
    status: "NEEDS_ATTENTION",
    tasksCompleted: 3,
    totalTasks: 8,
    taskDetail: "Manual approval",
    retries: "1",
    activationTime: "8.4s",
    created: "14m ago",
    certStatus: "pending",
  },
  {
    id: "ORD-20260712-004213",
    clientRef: "EXT-CRM-990710",
    customer: "Soren Lindqvist",
    msisdn: "+46 8 123 4567",
    product: "IoT SIM Pool (500x)",
    status: "FAILED",
    tasksCompleted: 5,
    totalTasks: 8,
    taskDetail: "OCS Err 409",
    retries: "3 (exhausted)",
    activationTime: "18.9s",
    created: "22m ago",
    certStatus: "revoked",
  },
  {
    id: "ORD-20260712-004212",
    clientRef: "EXT-CRM-990605",
    customer: "Chloe Beaulieu",
    msisdn: "+33 6 12 34 56 78",
    product: "Fiber Broadband 500",
    status: "COMPENSATING",
    tasksCompleted: 2,
    totalTasks: 5,
    taskDetail: "Saga",
    retries: "0",
    activationTime: "9.1s",
    created: "26m ago",
    certStatus: "pending",
  },
  {
    id: "ORD-20260712-004211",
    clientRef: "EXT-CRM-990544",
    customer: "Nesta Logistics UK",
    msisdn: "+44 20 7946 0912",
    product: "IoT SIM Pool (500x)",
    status: "COMPENSATED",
    tasksCompleted: 5,
    totalTasks: 5,
    taskDetail: "Rolled back",
    retries: "1",
    activationTime: "15.2s",
    created: "39m ago",
    certStatus: "verified",
  },
  {
    id: "ORD-20260712-004210",
    clientRef: "EXT-CRM-990499",
    customer: "Tatsuo Takahashi",
    msisdn: "+81 90 1234 5678",
    product: "5G Postpaid Unlimited",
    status: "PENDING",
    tasksCompleted: 0,
    totalTasks: 8,
    taskDetail: "Queued",
    retries: "0",
    activationTime: "—",
    created: "44m ago",
    certStatus: "none",
  },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "failed" | "slow" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlySignedCert, setOnlySignedCert] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(["ORD-20260712-004217", "ORD-20260712-004214"]);
  const [orders, setOrders] = useState<DisplayOrder[]>(INITIAL_ORDERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<"status" | "product" | "timerange" | "systems" | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "RUNNING", "SUCCEEDED", "RETRYING", "NEEDS_ATTENTION", "FAILED", "COMPENSATING", "COMPENSATED"
  ]);
  const [selectedProduct, setSelectedProduct] = useState<string>("All Plans");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("Last 24 Hours");
  const [selectedSystem, setSelectedSystem] = useState<string>("All (OMS, HLR, OCS…)");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".filter-dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    // Optionally fetch dynamic orders from API
    const loadApiOrders = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiHost}/orders?limit=100`);
        if (res.ok) {
          const apiData: Order[] = await res.json();
          if (apiData.length > 0) {
            const mapped: DisplayOrder[] = apiData.map((o) => {
              const stateStr = String(o.state);
              let statusMapped: DisplayOrder["status"] = "RUNNING";
              if (stateStr === "ACTIVE") statusMapped = "SUCCEEDED";
              else if (stateStr === "ROLLED_BACK") statusMapped = "COMPENSATED";
              else if (stateStr === "ROLLING_BACK") statusMapped = "COMPENSATING";
              else if (stateStr === "NEEDS_ATTENTION") statusMapped = "NEEDS_ATTENTION";
              else if (stateStr === "FAILED") statusMapped = "FAILED";
              else if (stateStr === "RECEIVED") statusMapped = "PENDING";

              return {
                id: o.order_id,
                clientRef: o.client_order_ref || `EXT-CRM-${o.order_id.slice(-6)}`,
                customer: o.customer_id,
                msisdn: String(o.payload?.msisdn || o.msisdn || "+1 555 019-4821"),
                product: o.product === "FIBER_500" ? "Fiber Broadband 500" : o.product === "MOBILE_5G" ? "5G Postpaid Unlimited" : o.product === "ESIM_ADDON" ? "eSIM Roaming Global" : (o.product || "Fiber Broadband 500"),
                status: statusMapped,
                tasksCompleted: stateStr === "ACTIVE" ? 8 : stateStr === "ROLLED_BACK" ? 5 : 4,
                totalTasks: 8,
                taskDetail: stateStr === "ACTIVE" ? "100%" : stateStr === "ROLLED_BACK" ? "Compensated" : "In Flight",
                retries: "0",
                activationTime: o.activation_ms ? `${(o.activation_ms / 1000).toFixed(1)}s` : "2.8s",
                created: "Just now",
                certStatus: stateStr === "ACTIVE" ? "verified" : "pending",
              };
            });
            // Merge or set
            setOrders((prev) => {
              const existingIds = new Set(apiData.map(d => d.order_id));
              const nonDuplicated = prev.filter(p => !existingIds.has(p.id));
              return [...mapped, ...nonDuplicated];
            });
          }
        }
      } catch {
        // Fallback to INITIAL_ORDERS
      }
    };
    loadApiOrders();
  }, []);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, onlySignedCert, selectedStatuses, selectedProduct, selectedTimeRange, selectedSystem, rowsPerPage]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map((o) => o.id));
    }
  };

  const toggleStatusOption = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
    setOnlySignedCert(false);
    setSelectedStatuses(["RUNNING", "SUCCEEDED", "RETRYING", "NEEDS_ATTENTION", "FAILED", "COMPENSATING", "COMPENSATED"]);
    setSelectedProduct("All Plans");
    setSelectedTimeRange("Last 24 Hours");
    setSelectedSystem("All (OMS, HLR, OCS…)");
    setCurrentPage(1);
    setOpenDropdown(null);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "failed" && o.status !== "FAILED") return false;
    if (activeTab === "slow" && !o.activationTime.includes("12.") && !o.activationTime.includes("18.") && !o.activationTime.includes("15.")) return false;
    if (activeTab === "attention" && o.status !== "NEEDS_ATTENTION") return false;
    if (onlySignedCert && o.certStatus !== "verified") return false;

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(o.status)) {
      return false;
    }

    // Product filter
    if (selectedProduct !== "All Plans") {
      if (selectedProduct === "Fiber Broadband" && !o.product.toLowerCase().includes("fiber")) return false;
      if (selectedProduct === "5G Postpaid" && !o.product.toLowerCase().includes("5g")) return false;
      if (selectedProduct === "eSIM Add-on" && !o.product.toLowerCase().includes("esim")) return false;
      if (selectedProduct === "IoT / SIP Trunk" && !o.product.toLowerCase().includes("iot") && !o.product.toLowerCase().includes("sip")) return false;
    }

    // Systems filter
    if (selectedSystem !== "All (OMS, HLR, OCS…)") {
      if (selectedSystem === "HLR / Network only" && !o.taskDetail.toLowerCase().includes("hlr") && o.status !== "RETRYING" && o.status !== "NEEDS_ATTENTION") return false;
      if (selectedSystem === "OCS / Billing only" && !o.taskDetail.toLowerCase().includes("ocs") && o.status !== "FAILED") return false;
      if (selectedSystem === "Inventory (SIM) only" && !o.product.toLowerCase().includes("sim")) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        o.id.toLowerCase().includes(q) ||
        o.clientRef.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.msisdn.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredOrders.length);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const renderStatusBadge = (status: DisplayOrder["status"]) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#0A1B2E] border border-[#0A1B2E] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A1B2E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A1B2E]"></span>
            </span>
            RUNNING
          </span>
        );
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#0A1B2E] border border-[#CBD5E1] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0A1B2E]"></span>
            SUCCEEDED
          </span>
        );
      case "RETRYING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#0A1B2E] border border-[#CBD5E1] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
            RETRYING
          </span>
        );
      case "NEEDS_ATTENTION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full bg-[#0A1B2E] text-white border border-[#0A1B2E] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            NEEDS_ATTENTION
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[#0A1B2E] text-white border border-[#0A1B2E] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            FAILED
          </span>
        );
      case "COMPENSATING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#0A1B2E] border border-[#CBD5E1] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0A1B2E] animate-pulse"></span>
            COMPENSATING
          </span>
        );
      case "COMPENSATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#64748B] border border-[#E2E8F0] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
            COMPENSATED
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#64748B] border border-[#E2E8F0] font-label-sm text-label-sm font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#CBD5E1]"></span>
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* PAGE HEADER & PRIMARY ACTIONS */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Orders</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm font-medium bg-surface-container text-on-surface-variant">
              1,284 total orders
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm text-secondary bg-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Cluster: prod-us-east-4
            </span>
          </div>
          <p className="font-body-md text-body-md text-outline">
            Telecom provisioning orchestrations, saga lifecycles, and cryptographic execution proofs
          </p>
        </div>

        {/* Right Utility Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              const csv = "Order ID,Client Ref,Customer,Product,Status\n" + orders.map(o => `${o.id},${o.clientRef},${o.customer},${o.product},${o.status}`).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `orders-export-${Date.now()}.csv`;
              a.click();
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-white text-[#0A1B2E] hover:bg-[#F8FAFC] transition-colors font-body-md text-body-md font-medium shadow-2xs border border-[#CBD5E1]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">download</span>
            <span>Export CSV</span>
          </button>
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-[#0A1B2E] text-white hover:bg-[#14263b] transition-colors font-body-md text-body-md font-medium shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Order</span>
          </Link>
        </div>
      </section>

      {/* SAVED VIEW TABS */}
      <div className="flex items-center justify-between bg-white px-4 rounded-xl shadow-2xs border border-[#E2E8F0]">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {/* Tab: All */}
          <button
            onClick={() => setActiveTab("all")}
            className={`relative py-3.5 font-body-md text-body-md flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === "all"
                ? "font-semibold text-[#0A1B2E] border-b-2 border-[#0A1B2E]"
                : "font-medium text-[#64748B] hover:text-[#0A1B2E]"
            }`}
            type="button"
          >
            <span>All Orchestrations</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-[#F8FAFC] text-[#0A1B2E] font-semibold border border-[#CBD5E1]">
              1,284
            </span>
          </button>

          {/* Tab: Failed last 24h */}
          <button
            onClick={() => setActiveTab("failed")}
            className={`py-3.5 font-body-md text-body-md flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === "failed"
                ? "font-semibold text-[#0A1B2E] border-b-2 border-[#0A1B2E]"
                : "font-medium text-[#64748B] hover:text-[#0A1B2E]"
            }`}
            type="button"
          >
            <span>Failed last 24h</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#0A1B2E] font-semibold border border-[#CBD5E1]">
              14
            </span>
          </button>

          {/* Tab: Slow (>p95) */}
          <button
            onClick={() => setActiveTab("slow")}
            className={`py-3.5 font-body-md text-body-md flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === "slow"
                ? "font-semibold text-[#0A1B2E] border-b-2 border-[#0A1B2E]"
                : "font-medium text-[#64748B] hover:text-[#0A1B2E]"
            }`}
            type="button"
          >
            <span>Slow (&gt;p95)</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#0A1B2E] font-semibold border border-[#CBD5E1]">
              48
            </span>
          </button>

          {/* Tab: Needs Attention */}
          <button
            onClick={() => setActiveTab("attention")}
            className={`py-3.5 font-body-md text-body-md flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === "attention"
                ? "font-semibold text-[#0A1B2E] border-b-2 border-[#0A1B2E]"
                : "font-medium text-[#64748B] hover:text-[#0A1B2E]"
            }`}
            type="button"
          >
            <span>Needs Attention</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#0A1B2E] font-bold border border-[#CBD5E1]">
              2
            </span>
          </button>
        </div>

        {/* Auxiliary view selector */}
        <div className="hidden lg:flex items-center gap-3 font-label-sm text-label-sm text-[#64748B]">
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#0A1B2E]"></span>SLA 99.98%
          </span>
          <span>•</span>
          <span className="font-mono">Latency p95: 4.8s</span>
        </div>
      </div>

      {/* TABLE CONTAINER CARD */}
      <section className="bg-white rounded-xl shadow-2xs overflow-hidden flex flex-col border border-[#E2E8F0]">
        {/* HIGH-DENSITY FILTER TOOLBAR */}
        <div className="p-3.5 bg-white flex flex-wrap items-center justify-between gap-2.5 border-b border-[#E2E8F0]">
          {/* Left Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full max-w-[290px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[18px]">
                search
              </span>
              <input
                className="w-full h-8 pl-8 pr-7 bg-[#F8FAFC] rounded font-body-sm text-body-sm text-[#0A1B2E] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0A1B2E] border border-[#CBD5E1]"
                placeholder="Filter Order ID, Client Ref, MSISDN… ⌘F"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0A1B2E]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(prev => prev === "status" ? null : "status");
                }}
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#0A1B2E] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer"
                type="button"
              >
                <span className="text-[#64748B]">Status:</span>
                <span className="font-medium text-[#0A1B2E]">
                  {selectedStatuses.length === 7 ? "All (7 selected)" : `${selectedStatuses.length} selected`}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[#64748B]">
                  {openDropdown === "status" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "status" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-56 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between">
                    <span>Filter by Status</span>
                    <button
                      onClick={() => setSelectedStatuses(selectedStatuses.length === 7 ? [] : ["RUNNING", "SUCCEEDED", "RETRYING", "NEEDS_ATTENTION", "FAILED", "COMPENSATING", "COMPENSATED"])}
                      className="text-[#0A1B2E] hover:underline normal-case font-medium"
                      type="button"
                    >
                      {selectedStatuses.length === 7 ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  {(["RUNNING", "SUCCEEDED", "RETRYING", "NEEDS_ATTENTION", "FAILED", "COMPENSATING", "COMPENSATED"] as const).map((st) => (
                    <label
                      key={st}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F8FAFC] cursor-pointer text-body-sm font-body-sm text-[#0A1B2E]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(st)}
                        onChange={() => toggleStatusOption(st)}
                        className="rounded border-[#CBD5E1] text-[#0A1B2E] focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="font-mono text-xs">{st}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Product / Plan Filter */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(prev => prev === "product" ? null : "product");
                }}
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#0A1B2E] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer"
                type="button"
              >
                <span className="text-[#64748B]">Product:</span>
                <span className="font-medium text-[#0A1B2E]">{selectedProduct}</span>
                <span className="material-symbols-outlined text-[16px] text-[#64748B]">
                  {openDropdown === "product" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "product" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-52 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Catalog Product
                  </div>
                  {["All Plans", "Fiber Broadband", "5G Postpaid", "eSIM Add-on", "IoT / SIP Trunk"].map((prod) => (
                    <button
                      key={prod}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-body-sm font-body-sm transition-colors flex items-center justify-between ${
                        selectedProduct === prod ? "bg-[#F1F5F9] font-semibold text-[#0A1B2E]" : "hover:bg-[#F8FAFC] text-[#475569]"
                      }`}
                      type="button"
                    >
                      <span>{prod}</span>
                      {selectedProduct === prod && (
                        <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(prev => prev === "timerange" ? null : "timerange");
                }}
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#0A1B2E] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#64748B]">calendar_today</span>
                <span className="font-medium text-[#0A1B2E]">{selectedTimeRange}</span>
                <span className="material-symbols-outlined text-[16px] text-[#64748B]">
                  {openDropdown === "timerange" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "timerange" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-48 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Time Window
                  </div>
                  {["Last 1 Hour", "Last 6 Hours", "Last 24 Hours", "Last 7 Days", "All History"].map((tr) => (
                    <button
                      key={tr}
                      onClick={() => {
                        setSelectedTimeRange(tr);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-body-sm font-body-sm transition-colors flex items-center justify-between ${
                        selectedTimeRange === tr ? "bg-[#F1F5F9] font-semibold text-[#0A1B2E]" : "hover:bg-[#F8FAFC] text-[#475569]"
                      }`}
                      type="button"
                    >
                      <span>{tr}</span>
                      {selectedTimeRange === tr && (
                        <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Systems Involved */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(prev => prev === "systems" ? null : "systems");
                }}
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#0A1B2E] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer"
                type="button"
              >
                <span className="text-[#64748B]">Systems:</span>
                <span className="font-medium text-[#0A1B2E]">{selectedSystem}</span>
                <span className="material-symbols-outlined text-[16px] text-[#64748B]">
                  {openDropdown === "systems" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "systems" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-56 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Subsystem Filter
                  </div>
                  {["All (OMS, HLR, OCS…)", "HLR / Network only", "OCS / Billing only", "Inventory (SIM) only"].map((sys) => (
                    <button
                      key={sys}
                      onClick={() => {
                        setSelectedSystem(sys);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-body-sm font-body-sm transition-colors flex items-center justify-between ${
                        selectedSystem === sys ? "bg-[#F1F5F9] font-semibold text-[#0A1B2E]" : "hover:bg-[#F8FAFC] text-[#475569]"
                      }`}
                      type="button"
                    >
                      <span className="truncate">{sys}</span>
                      {selectedSystem === sys && (
                        <span className="material-symbols-outlined text-[16px] text-[#0A1B2E] shrink-0">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Certificate Toggle Switch */}
            <div className="flex items-center gap-2 pl-1 py-1">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  checked={onlySignedCert}
                  onChange={(e) => setOnlySignedCert(e.target.checked)}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-7 h-4 bg-surface-container-highest peer-checked:bg-primary-container rounded-full peer peer-checked:after:translate-x-3 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
              <span className="font-label-sm text-label-sm text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#0A1B2E]">verified_user</span>
                <span>Signed Cert</span>
              </span>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={resetAllFilters}
              className="font-label-sm text-label-sm text-primary-container hover:underline cursor-pointer"
              type="button"
            >
              Clear filters
            </button>
            <span className="font-label-sm text-label-sm text-outline">
              Showing {filteredOrders.length} of {orders.length}
            </span>
          </div>
        </div>

        {/* DENSE DATA TABLE WRAPPER */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left table-fixed border-collapse min-w-[1240px]">
            <thead>
              <tr className="h-10 bg-[#F8FAFC] text-[#64748B] font-body-sm text-body-sm uppercase tracking-wider select-none font-semibold border-b border-[#E2E8F0]">
                <th className="w-10 px-3 text-center">
                  <input
                    checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded bg-white text-[#0A1B2E] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    type="checkbox"
                  />
                </th>
                <th className="w-44 px-3">Order ID</th>
                <th className="w-36 px-3">Client Ref</th>
                <th className="w-48 px-3">Customer &amp; MSISDN</th>
                <th className="w-44 px-3">Product / Plan</th>
                <th className="w-40 px-3">Status</th>
                <th className="w-28 px-3">Tasks</th>
                <th className="w-28 px-3">Retries</th>
                <th className="w-28 px-3 text-right">Activation</th>
                <th className="w-24 px-3 text-right">Created</th>
                <th className="w-24 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-body-sm text-body-sm">
              {paginatedOrders.map((ord) => {
                const isSelected = selectedIds.includes(ord.id);
                return (
                  <tr
                    key={ord.id}
                    className={`h-12 transition-colors ${
                      isSelected
                        ? "bg-[#F8FAFC] hover:bg-[#F1F5F9]/70"
                        : "bg-white hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <td className="px-3 text-center">
                      <input
                        checked={isSelected}
                        onChange={() => toggleSelect(ord.id)}
                        className="w-4 h-4 rounded bg-surface-container-lowest text-primary-container focus:ring-0 cursor-pointer"
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3">
                      <Link
                        className="font-label-md text-label-md font-semibold text-primary-container hover:underline"
                        href={`/orders/${ord.id}`}
                      >
                        {ord.id}
                      </Link>
                    </td>
                    <td className="px-3">
                      <span className="font-label-sm text-label-sm text-outline">{ord.clientRef}</span>
                    </td>
                    <td className="px-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-on-surface truncate">{ord.customer}</span>
                        <span className="font-label-sm text-label-sm text-outline truncate">{ord.msisdn}</span>
                      </div>
                    </td>
                    <td className="px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface font-medium text-body-sm truncate">
                        {ord.product}
                      </span>
                    </td>
                    <td className="px-3">
                      {renderStatusBadge(ord.status)}
                    </td>
                    <td className="px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface">
                          <span>{ord.tasksCompleted}/{ord.totalTasks}</span>
                          <span className={ord.status === "FAILED" ? "text-error" : ord.status === "SUCCEEDED" ? "text-[#0A1B2E] font-medium" : "text-outline"}>
                            {ord.taskDetail}
                          </span>
                        </div>
                        <div className="flex gap-0.5 h-1.5 w-full bg-[#F1F5F9] rounded overflow-hidden">
                          {Array.from({ length: ord.totalTasks }).map((_, tIdx) => {
                            const isFilled = tIdx < ord.tasksCompleted;
                            const barColor =
                              ord.status === "SUCCEEDED"
                                ? "bg-[#0A1B2E]"
                                : ord.status === "FAILED" || ord.status === "NEEDS_ATTENTION"
                                ? "bg-[#0A1B2E]"
                                : ord.status === "COMPENSATING" || ord.status === "COMPENSATED"
                                ? "bg-[#475569]"
                                : "bg-[#0A1B2E]";
                            return (
                              <div
                                key={tIdx}
                                className={`flex-1 ${isFilled ? barColor : "bg-[#F1F5F9]"}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3">
                      <span className={`font-label-sm text-label-sm ${
                        ord.retries.includes("exhausted")
                          ? "px-1.5 py-0.5 rounded bg-[#0A1B2E] text-white font-medium"
                          : ord.retries.includes("backoff")
                          ? "px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#0A1B2E] font-medium border border-[#CBD5E1]"
                          : "text-[#64748B]"
                      }`}>
                        {ord.retries}
                      </span>
                    </td>
                    <td className="px-3 text-right">
                      <span className="font-label-md text-label-md font-medium text-[#0A1B2E]">
                        {ord.activationTime}
                      </span>
                    </td>
                    <td className="px-3 text-right">
                      <span className="text-[#64748B] font-label-sm text-label-sm">{ord.created}</span>
                    </td>
                    <td className="px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {ord.certStatus === "verified" ? (
                          <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]" title="Cryptographic Certificate Verified">
                            verified_user
                          </span>
                        ) : ord.certStatus === "revoked" ? (
                          <span className="material-symbols-outlined text-[18px] text-[#0A1B2E]" title="Certificate Revoked / Failed">
                            gpp_bad
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px] text-[#CBD5E1]" title="Pending / In-Progress">
                            shield
                          </span>
                        )}
                        <button
                          className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-low"
                          title="Row Actions"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-4 py-3 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-body-sm text-body-sm border-t border-[#EDF0F5]">
          <div className="flex items-center gap-4 text-outline">
            <span>
              Showing <strong className="text-on-surface font-medium">{filteredOrders.length === 0 ? 0 : startIndex + 1}-{endIndex}</strong> of <strong className="text-on-surface font-medium">{filteredOrders.length}</strong> orders
            </span>
            <div className="flex items-center gap-1">
              <label className="font-label-sm text-label-sm" htmlFor="rowsPerPage">Rows:</label>
              <select
                className="h-7 py-0 pl-2 pr-6 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface border-0 focus:ring-1 focus:ring-primary-container cursor-pointer"
                id="rowsPerPage"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 select-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="px-2.5 h-7 rounded text-[#0A1B2E] hover:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed font-medium font-body-sm transition-colors cursor-pointer"
              type="button"
            >
              Previous
            </button>

            {/* Dynamic page numbers calculation */}
            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (validCurrentPage > 3) {
                  pages.push("…");
                }
                const startMiddle = Math.max(2, validCurrentPage - 1);
                const endMiddle = Math.min(totalPages - 1, validCurrentPage + 1);
                for (let i = startMiddle; i <= endMiddle; i++) {
                  if (!pages.includes(i)) pages.push(i);
                }
                if (validCurrentPage < totalPages - 2) {
                  pages.push("…");
                }
                if (!pages.includes(totalPages)) pages.push(totalPages);
              }

              return pages.map((p, idx) => {
                if (p === "…") {
                  return (
                    <span key={`dots-${idx}`} className="px-1 text-[#94A3B8] font-label-sm text-label-sm">
                      …
                    </span>
                  );
                }
                const isCurrent = p === validCurrentPage;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(Number(p))}
                    className={`w-7 h-7 rounded font-medium font-label-sm text-label-sm flex items-center justify-center transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-[#0A1B2E] text-white shadow-2xs"
                        : "hover:bg-[#F8FAFC] text-[#0A1B2E]"
                    }`}
                    type="button"
                  >
                    {p}
                  </button>
                );
              });
            })()}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="px-2.5 h-7 rounded text-[#0A1B2E] hover:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed font-medium font-body-sm transition-colors cursor-pointer"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* FLOATING / BOTTOM BULK-SELECTION BAR */}
      {selectedIds.length > 0 && (
        <section className="sticky bottom-4 z-30">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border border-[#E3E8F0]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold">
                {selectedIds.length} orders selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="font-body-sm text-body-sm text-primary-container hover:underline font-medium"
                type="button"
              >
                Select all 1,284 orders across pages
              </button>
            </div>
            {/* Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors" type="button">
                <span className="material-symbols-outlined text-[16px] text-primary-container">sync</span>
                <span>Bulk Re-trigger / Retry</span>
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors" type="button">
                <span className="material-symbols-outlined text-[16px] text-outline">download</span>
                <span>Export Selected (CSV)</span>
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors" type="button">
                <span className="material-symbols-outlined text-[16px] text-[#0A1B2E]">verified_user</span>
                <span>Download Certs (ZIP)</span>
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-error-container hover:bg-error/20 text-error font-body-sm text-body-sm font-medium transition-colors" type="button">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancel / Terminate</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors ml-1"
                title="Deselect all"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* COLLAPSIBLE PREVIEW STATES */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* State Preview 1: Skeleton Loading Pattern */}
        <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group border border-[#E3E8F0]">
          <summary className="px-4 py-3 bg-surface-container-lowest cursor-pointer flex items-center justify-between text-on-surface font-body-md text-body-md font-semibold select-none hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-outline">view_stream</span>
              <span>Inspect Skeleton Shimmer State</span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-outline">Telecom Data Pipeline</span>
            </div>
            <span className="material-symbols-outlined text-outline transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="p-4 space-y-3 bg-surface-container-lowest border-t border-[#EDF0F5]">
            <p className="font-body-sm text-body-sm text-outline">Zero-layout-shift data shimmer matching tabular widths:</p>
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-surface-container-high rounded w-full"></div>
              <div className="h-8 bg-surface-container rounded w-full"></div>
              <div className="h-8 bg-surface-container-high rounded w-5/6"></div>
              <div className="h-8 bg-surface-container rounded w-11/12"></div>
            </div>
          </div>
        </details>

        {/* State Preview 2: Filter Empty State */}
        <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group border border-[#E3E8F0]">
          <summary className="px-4 py-3 bg-surface-container-lowest cursor-pointer flex items-center justify-between text-on-surface font-body-md text-body-md font-semibold select-none hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-outline">filter_alt_off</span>
              <span>Inspect Empty Filter State</span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-outline">Zero Matches</span>
            </div>
            <span className="material-symbols-outlined text-outline transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-2.5 bg-surface-container-lowest border-t border-[#EDF0F5]">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-[22px]">inbox</span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">No orders match these filters</h4>
              <p className="font-body-sm text-body-sm text-outline max-w-sm">
                Try adjusting status filters, date range, or clear search queries to view orders.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
                setOnlySignedCert(false);
              }}
              className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded bg-primary-container text-on-primary font-body-sm text-body-sm font-medium hover:bg-primary transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset all filters</span>
            </button>
          </div>
        </details>
      </section>
    </div>
  );
}
