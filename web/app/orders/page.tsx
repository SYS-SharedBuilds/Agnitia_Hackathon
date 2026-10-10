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
    tasksCompleted: 4,
    totalTasks: 8,
    taskDetail: "Radius 401 Reject",
    retries: "3 (exhausted)",
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
    tasksCompleted: 1,
    totalTasks: 8,
    taskDetail: "SIM Pool 409",
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
  {
    id: "ORD-20260712-004209",
    clientRef: "EXT-CRM-990382",
    customer: "Acme Logistics Global",
    msisdn: "+1 415 555-0132",
    product: "IoT SIM Pool (500x)",
    status: "FAILED",
    tasksCompleted: 3,
    totalTasks: 8,
    taskDetail: "HLR Timeout 504",
    retries: "3 (exhausted)",
    activationTime: "16.4s",
    created: "52m ago",
    certStatus: "revoked",
  },
  {
    id: "ORD-20260712-004208",
    clientRef: "EXT-CRM-990312",
    customer: "David Alaba",
    msisdn: "+43 1 515 8800",
    product: "5G Postpaid Unlimited",
    status: "SUCCEEDED",
    tasksCompleted: 8,
    totalTasks: 8,
    taskDetail: "100%",
    retries: "0",
    activationTime: "3.8s",
    created: "1h ago",
    certStatus: "verified",
  },
  {
    id: "ORD-20260712-004207",
    clientRef: "EXT-CRM-990264",
    customer: "Nordic Tech AB",
    msisdn: "+46 8 555 1234",
    product: "Enterprise SIP Trunk",
    status: "NEEDS_ATTENTION",
    tasksCompleted: 4,
    totalTasks: 8,
    taskDetail: "Credit check hold",
    retries: "2",
    activationTime: "14.1s",
    created: "1h 15m ago",
    certStatus: "pending",
  },
  {
    id: "ORD-20260712-004206",
    clientRef: "EXT-CRM-990198",
    customer: "Elena Rostova",
    msisdn: "+49 89 21800",
    product: "eSIM Roaming Global",
    status: "FAILED",
    tasksCompleted: 2,
    totalTasks: 8,
    taskDetail: "Inventory OOS",
    retries: "1",
    activationTime: "11.2s",
    created: "1h 30m ago",
    certStatus: "revoked",
  },
  {
    id: "ORD-20260712-004205",
    clientRef: "EXT-CRM-990145",
    customer: "Lucas Martins",
    msisdn: "+55 11 98765-4321",
    product: "Fiber Broadband 500",
    status: "SUCCEEDED",
    tasksCompleted: 8,
    totalTasks: 8,
    taskDetail: "100%",
    retries: "0",
    activationTime: "4.5s",
    created: "2h ago",
    certStatus: "verified",
  },
  {
    id: "ORD-20260712-004204",
    clientRef: "EXT-CRM-990112",
    customer: "FinTech Prime Ltd",
    msisdn: "+44 20 7946 0888",
    product: "Enterprise SIP Trunk",
    status: "COMPENSATED",
    tasksCompleted: 5,
    totalTasks: 5,
    taskDetail: "Clean rollback",
    retries: "1",
    activationTime: "17.6s",
    created: "2h 10m ago",
    certStatus: "verified",
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

  // Dynamic counts for top header and tab badges
  const totalOrdersCount = orders.length;
  const failedTabCount = orders.filter((o) => o.status === "FAILED").length;
  const slowTabCount = orders.filter(
    (o) =>
      o.activationTime.includes("12.") ||
      o.activationTime.includes("18.") ||
      o.activationTime.includes("15.") ||
      o.activationTime.includes("16.") ||
      o.activationTime.includes("14.") ||
      o.activationTime.includes("17.")
  ).length;
  const attentionTabCount = orders.filter((o) => o.status === "NEEDS_ATTENTION").length;

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredOrders.length);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const renderStatusBadge = (status: DisplayOrder["status"]) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#000000] border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#000000] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#000000]"></span>
            </span>
            RUNNING
          </span>
        );
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#000000] border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#000000]"></span>
            SUCCEEDED
          </span>
        );
      case "RETRYING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#000000] border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#000000]"></span>
            RETRYING
          </span>
        );
      case "NEEDS_ATTENTION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full bg-[#000000] text-white border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            NEEDS_ATTENTION
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[#000000] text-white border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            FAILED
          </span>
        );
      case "COMPENSATING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#000000] border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#000000] animate-pulse"></span>
            COMPENSATING
          </span>
        );
      case "COMPENSATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#000000] border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#000000]"></span>
            COMPENSATED
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white text-[#000000] border border-[#000000] font-label-sm text-label-sm font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#000000]"></span>
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
            <h1 className="font-headline-lg text-headline-lg text-[#000000] tracking-tight font-bold">Orders</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold bg-white text-[#000000] border border-[#CBD5E1]">
              {totalOrdersCount} total orders
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm text-[#000000] bg-white border border-[#CBD5E1] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#000000]"></span>
              Cluster: prod-us-east-4
            </span>
          </div>
          <p className="font-body-md text-body-md text-[#000000]">
            Telecom provisioning orchestrations, saga lifecycles, and cryptographic execution proofs
          </p>
        </div>

        {/* Right Utility Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/orders/new-orders"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-[#000000] text-white hover:bg-neutral-800 transition-colors font-body-md text-body-md font-bold shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Order</span>
          </Link>
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
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-white text-[#000000] hover:bg-[#F8FAFC] transition-colors font-body-md text-body-md font-semibold shadow-2xs border border-[#CBD5E1]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-[#000000]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* DASHBOARD SUMMARY KPI CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
            <span className="material-symbols-outlined text-[20px] text-black">all_inbox</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-black">{totalOrdersCount}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Live SSE</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Synchronized with User Portal</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">In Flight (Running)</span>
            <span className="material-symbols-outlined text-[20px] text-blue-600">sync</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-black">
              {orders.filter(o => o.status === "RUNNING" || o.status === "RETRYING" || o.status === "PENDING").length}
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Temporal</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Actively provisioning</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Active &amp; Succeeded</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-black">
              {orders.filter(o => o.status === "SUCCEEDED").length}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">100% Sagas</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Verified with Signed Certs</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Fallout / Failed</span>
            <span className="material-symbols-outlined text-[20px] text-rose-600">report_problem</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-black">
              {orders.filter(o => o.status === "FAILED" || o.status === "NEEDS_ATTENTION" || o.status === "COMPENSATED" || o.status === "COMPENSATING").length}
            </span>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Clean Rollback</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">0 Inconsistent Leaks</span>
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
                ? "font-bold text-[#000000] border-b-2 border-[#000000]"
                : "font-semibold text-[#000000] hover:text-[#000000]"
            }`}
            type="button"
          >
            <span>All Orchestrations</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-white text-[#000000] font-bold border border-[#CBD5E1]">
              {totalOrdersCount}
            </span>
          </button>

          {/* Tab: Failed last 24h */}
          <button
            onClick={() => setActiveTab("failed")}
            className={`py-3.5 font-body-md text-body-md flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === "failed"
                ? "font-bold text-[#000000] border-b-2 border-[#000000]"
                : "font-semibold text-[#000000] hover:text-[#000000]"
            }`}
            type="button"
          >
            <span>Failed last 24h</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-white text-[#000000] font-bold border border-[#CBD5E1]">
              {failedTabCount}
            </span>
          </button>

          {/* Tab: Slow (>p95) */}
          <button
            onClick={() => setActiveTab("slow")}
            className={`py-3.5 font-body-md text-body-md flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === "slow"
                ? "font-bold text-[#000000] border-b-2 border-[#000000]"
                : "font-semibold text-[#000000] hover:text-[#000000]"
            }`}
            type="button"
          >
            <span>Slow (&gt;p95)</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-white text-[#000000] font-bold border border-[#CBD5E1]">
              {slowTabCount}
            </span>
          </button>

          {/* Tab: Needs Attention */}
          <button
            onClick={() => setActiveTab("attention")}
            className={`py-3.5 font-body-md text-body-md flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === "attention"
                ? "font-bold text-[#000000] border-b-2 border-[#000000]"
                : "font-semibold text-[#000000] hover:text-[#000000]"
            }`}
            type="button"
          >
            <span>Needs Attention</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-white text-[#000000] font-bold border border-[#CBD5E1]">
              {attentionTabCount}
            </span>
          </button>
        </div>

        {/* Auxiliary view selector */}
        <div className="hidden lg:flex items-center gap-3 font-label-sm text-label-sm text-[#000000] font-semibold">
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#000000]"></span>SLA 99.98%
          </span>
          <span>•</span>
          <span className="font-mono">Latency p95: 4.8s</span>
        </div>
      </div>

      {/* TABLE CONTAINER CARD */}
      <section className="bg-white rounded-xl shadow-2xs overflow-hidden flex flex-col border border-[#CBD5E1]">
        {/* HIGH-DENSITY FILTER TOOLBAR */}
        <div className="p-3.5 bg-white flex flex-wrap items-center justify-between gap-2.5 border-b border-[#CBD5E1]">
          {/* Left Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full max-w-[290px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#000000] text-[18px]">
                search
              </span>
              <input
                className="w-full h-8 pl-8 pr-7 bg-white rounded font-body-sm text-body-sm text-[#000000] placeholder:text-[#000000]/60 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#000000] border border-[#CBD5E1]"
                placeholder="Filter Order ID, Client Ref, MSISDN… ⌘F"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#000000] hover:text-[#000000]"
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
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#000000] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer font-bold"
                type="button"
              >
                <span className="text-[#000000] font-bold">Status:</span>
                <span className="font-bold text-[#000000]">
                  {selectedStatuses.length === 7 ? "All (7 selected)" : `${selectedStatuses.length} selected`}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[#000000]">
                  {openDropdown === "status" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "status" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-56 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#000000] uppercase tracking-wider flex items-center justify-between">
                    <span>Filter by Status</span>
                    <button
                      onClick={() => setSelectedStatuses(selectedStatuses.length === 7 ? [] : ["RUNNING", "SUCCEEDED", "RETRYING", "NEEDS_ATTENTION", "FAILED", "COMPENSATING", "COMPENSATED"])}
                      className="text-[#000000] hover:underline normal-case font-bold"
                      type="button"
                    >
                      {selectedStatuses.length === 7 ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  {(["RUNNING", "SUCCEEDED", "RETRYING", "NEEDS_ATTENTION", "FAILED", "COMPENSATING", "COMPENSATED"] as const).map((st) => (
                    <label
                      key={st}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F8FAFC] cursor-pointer text-body-sm font-body-sm text-[#000000]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(st)}
                        onChange={() => toggleStatusOption(st)}
                        className="rounded border-[#CBD5E1] text-[#000000] focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="font-mono text-xs font-semibold text-[#000000]">{st}</span>
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
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#000000] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer font-bold"
                type="button"
              >
                <span className="text-[#000000] font-bold">Product:</span>
                <span className="font-bold text-[#000000]">{selectedProduct}</span>
                <span className="material-symbols-outlined text-[16px] text-[#000000]">
                  {openDropdown === "product" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "product" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-52 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#000000] uppercase tracking-wider">
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
                        selectedProduct === prod ? "bg-[#F1F5F9] font-bold text-[#000000]" : "hover:bg-[#F8FAFC] text-[#000000] font-medium"
                      }`}
                      type="button"
                    >
                      <span>{prod}</span>
                      {selectedProduct === prod && (
                        <span className="material-symbols-outlined text-[16px] text-[#000000]">check</span>
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
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#000000] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#000000]">calendar_today</span>
                <span className="font-bold text-[#000000]">{selectedTimeRange}</span>
                <span className="material-symbols-outlined text-[16px] text-[#000000]">
                  {openDropdown === "timerange" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "timerange" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-48 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#000000] uppercase tracking-wider">
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
                        selectedTimeRange === tr ? "bg-[#F1F5F9] font-bold text-[#000000]" : "hover:bg-[#F8FAFC] text-[#000000] font-medium"
                      }`}
                      type="button"
                    >
                      <span>{tr}</span>
                      {selectedTimeRange === tr && (
                        <span className="material-symbols-outlined text-[16px] text-[#000000]">check</span>
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
                className="h-8 px-2.5 rounded bg-white hover:bg-[#F8FAFC] flex items-center gap-1.5 font-label-md text-label-md text-[#000000] transition-colors border border-[#CBD5E1] shadow-2xs cursor-pointer font-bold"
                type="button"
              >
                <span className="text-[#000000] font-bold">Systems:</span>
                <span className="font-bold text-[#000000]">{selectedSystem}</span>
                <span className="material-symbols-outlined text-[16px] text-[#000000]">
                  {openDropdown === "systems" ? "expand_less" : "expand_more"}
                </span>
              </button>

              {openDropdown === "systems" && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-56 bg-white rounded-lg shadow-lg border border-[#CBD5E1] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#000000] uppercase tracking-wider">
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
                        selectedSystem === sys ? "bg-[#F1F5F9] font-bold text-[#000000]" : "hover:bg-[#F8FAFC] text-[#000000] font-medium"
                      }`}
                      type="button"
                    >
                      <span className="truncate">{sys}</span>
                      {selectedSystem === sys && (
                        <span className="material-symbols-outlined text-[16px] text-[#000000] shrink-0">check</span>
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
                <div className="w-7 h-4 bg-[#CBD5E1] peer-checked:bg-[#000000] rounded-full peer peer-checked:after:translate-x-3 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
              <span className="font-label-sm text-label-sm text-[#000000] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#000000]">verified_user</span>
                <span>Signed Cert</span>
              </span>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={resetAllFilters}
              className="font-label-sm text-label-sm text-[#000000] hover:underline cursor-pointer font-bold"
              type="button"
            >
              Clear filters
            </button>
            <span className="font-label-sm text-label-sm text-[#000000] font-semibold">
              Showing {filteredOrders.length} of {orders.length}
            </span>
          </div>
        </div>

        {/* DENSE DATA TABLE WRAPPER */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left table-fixed border-collapse min-w-[1240px]">
            <thead>
              <tr className="h-10 bg-[#F8FAFC] text-[#000000] font-body-sm text-body-sm uppercase tracking-wider select-none font-bold border-b border-[#CBD5E1]">
                <th className="w-10 px-3 text-center">
                  <input
                    checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded bg-white text-[#000000] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    type="checkbox"
                  />
                </th>
                <th className="w-44 px-3 font-bold text-[#000000]">Order ID</th>
                <th className="w-36 px-3 font-bold text-[#000000]">Client Ref</th>
                <th className="w-48 px-3 font-bold text-[#000000]">Customer &amp; MSISDN</th>
                <th className="w-44 px-3 font-bold text-[#000000]">Product / Plan</th>
                <th className="w-40 px-3 font-bold text-[#000000]">Status</th>
                <th className="w-28 px-3 font-bold text-[#000000]">Tasks</th>
                <th className="w-28 px-3 font-bold text-[#000000]">Retries</th>
                <th className="w-28 px-3 text-right font-bold text-[#000000]">Activation</th>
                <th className="w-24 px-3 text-right font-bold text-[#000000]">Created</th>
                <th className="w-24 px-3 text-center font-bold text-[#000000]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-body-sm text-body-sm">
              {paginatedOrders.map((ord) => {
                const isSelected = selectedIds.includes(ord.id);
                return (
                  <tr
                    key={ord.id}
                    onClick={() => window.location.href = `/orders/${ord.id}`}
                    className={`h-12 transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-[#F8FAFC] hover:bg-[#F1F5F9]/80"
                        : "bg-white hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <td className="px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        checked={isSelected}
                        onChange={() => toggleSelect(ord.id)}
                        className="w-4 h-4 rounded bg-white text-[#000000] focus:ring-0 cursor-pointer"
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3">
                      <Link
                        className="font-label-md text-label-md font-bold text-[#000000] hover:underline"
                        href={`/orders/${ord.id}`}
                      >
                        {ord.id}
                      </Link>
                    </td>
                    <td className="px-3">
                      <span className="font-label-sm text-label-sm font-semibold text-[#000000]">{ord.clientRef}</span>
                    </td>
                    <td className="px-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#000000] truncate">{ord.customer}</span>
                        <span className="font-label-sm text-label-sm font-semibold text-[#000000] truncate">{ord.msisdn}</span>
                      </div>
                    </td>
                    <td className="px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-white text-[#000000] border border-[#CBD5E1] font-semibold text-body-sm truncate">
                        {ord.product}
                      </span>
                    </td>
                    <td className="px-3">
                      {renderStatusBadge(ord.status)}
                    </td>
                    <td className="px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between font-label-sm text-label-sm text-[#000000] font-bold">
                          <span>{ord.tasksCompleted}/{ord.totalTasks}</span>
                          <span className={ord.status === "FAILED" ? "text-[#000000] font-extrabold" : "text-[#000000] font-semibold"}>
                            {ord.taskDetail}
                          </span>
                        </div>
                        <div className="flex gap-0.5 h-1.5 w-full bg-[#E2E8F0] rounded overflow-hidden">
                          {Array.from({ length: ord.totalTasks }).map((_, tIdx) => {
                            const isFilled = tIdx < ord.tasksCompleted;
                            const barColor =
                              ord.status === "SUCCEEDED"
                                ? "bg-[#000000]"
                                : ord.status === "FAILED" || ord.status === "NEEDS_ATTENTION"
                                ? "bg-[#000000]"
                                : ord.status === "COMPENSATING" || ord.status === "COMPENSATED"
                                ? "bg-[#000000]"
                                : "bg-[#000000]";
                            return (
                              <div
                                key={tIdx}
                                className={`flex-1 ${isFilled ? barColor : "bg-[#E2E8F0]"}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3">
                      <span className={`font-label-sm text-label-sm ${
                        ord.retries.includes("exhausted")
                          ? "px-1.5 py-0.5 rounded bg-[#000000] text-white font-bold"
                          : ord.retries.includes("backoff")
                          ? "px-1.5 py-0.5 rounded bg-white text-[#000000] font-bold border border-[#000000]"
                          : "text-[#000000] font-semibold"
                      }`}>
                        {ord.retries}
                      </span>
                    </td>
                    <td className="px-3 text-right">
                      <span className="font-label-md text-label-md font-bold text-[#000000]">
                        {ord.activationTime}
                      </span>
                    </td>
                    <td className="px-3 text-right">
                      <span className="text-[#000000] font-label-sm text-label-sm font-semibold">{ord.created}</span>
                    </td>
                    <td className="px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {ord.certStatus === "verified" ? (
                          <span className="material-symbols-outlined text-[18px] text-[#000000]" title="Cryptographic Certificate Verified">
                            verified_user
                          </span>
                        ) : ord.certStatus === "revoked" ? (
                          <span className="material-symbols-outlined text-[18px] text-[#000000]" title="Certificate Revoked / Failed">
                            gpp_bad
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px] text-[#000000]" title="Pending / In-Progress">
                            shield
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 text-[#000000] hover:text-[#000000] rounded hover:bg-[#F1F5F9]"
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
        <div className="px-4 py-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-body-sm text-body-sm border-t border-[#CBD5E1]">
          <div className="flex items-center gap-4 text-[#000000] font-semibold">
            <span>
              Showing <strong className="text-[#000000] font-bold">{filteredOrders.length === 0 ? 0 : startIndex + 1}-{endIndex}</strong> of <strong className="text-[#000000] font-bold">{filteredOrders.length}</strong> orders
            </span>
            <div className="flex items-center gap-1">
              <label className="font-label-sm text-label-sm text-[#000000] font-semibold" htmlFor="rowsPerPage">Rows:</label>
              <select
                className="h-7 py-0 pl-2 pr-6 rounded bg-white font-label-sm text-label-sm text-[#000000] font-bold border border-[#CBD5E1] focus:ring-1 focus:ring-[#000000] cursor-pointer"
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
              className="px-2.5 h-7 rounded text-[#000000] hover:bg-[#F8FAFC] disabled:text-[#000000]/40 disabled:cursor-not-allowed font-bold font-body-sm transition-colors cursor-pointer"
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
              className="px-2.5 h-7 rounded text-[#000000] hover:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed font-medium font-body-sm transition-colors cursor-pointer"
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
          <div className="bg-white rounded-xl shadow-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border border-[#CBD5E1]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#000000] text-white font-label-md text-label-md font-bold">
                {selectedIds.length} orders selected
              </span>
              <button
                onClick={() => setSelectedIds(orders.map((o) => o.id))}
                className="font-body-sm text-body-sm text-[#000000] hover:underline font-bold"
                type="button"
              >
                Select all {totalOrdersCount} orders across pages
              </button>
            </div>
            {/* Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#000000] font-body-sm text-body-sm font-semibold transition-colors cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px] text-[#000000]">sync</span>
                <span>Bulk Re-trigger / Retry</span>
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#000000] font-body-sm text-body-sm font-semibold transition-colors cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px] text-[#000000]">download</span>
                <span>Export Selected (CSV)</span>
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#000000] font-body-sm text-body-sm font-semibold transition-colors cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px] text-[#000000]">verified_user</span>
                <span>Download Certs (ZIP)</span>
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-body-sm text-body-sm font-semibold transition-colors cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancel / Terminate</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 rounded text-[#000000] hover:bg-neutral-100 transition-colors ml-1 cursor-pointer"
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
        <details className="bg-white rounded-xl shadow-sm overflow-hidden group border border-[#CBD5E1]">
          <summary className="px-4 py-3 bg-white cursor-pointer flex items-center justify-between text-[#000000] font-body-md text-body-md font-bold select-none hover:bg-[#F8FAFC] transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#000000]">view_stream</span>
              <span>Inspect Skeleton Shimmer State</span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#F1F5F9] text-[#000000] border border-[#CBD5E1] font-semibold">Telecom Data Pipeline</span>
            </div>
            <span className="material-symbols-outlined text-[#000000] transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="p-4 space-y-3 bg-white border-t border-[#CBD5E1]">
            <p className="font-body-sm text-body-sm text-[#000000] font-medium">Zero-layout-shift data shimmer matching tabular widths:</p>
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-[#E2E8F0] rounded w-full"></div>
              <div className="h-8 bg-[#CBD5E1] rounded w-full"></div>
              <div className="h-8 bg-[#E2E8F0] rounded w-5/6"></div>
              <div className="h-8 bg-[#CBD5E1] rounded w-11/12"></div>
            </div>
          </div>
        </details>

        {/* State Preview 2: Filter Empty State */}
        <details className="bg-white rounded-xl shadow-sm overflow-hidden group border border-[#CBD5E1]">
          <summary className="px-4 py-3 bg-white cursor-pointer flex items-center justify-between text-[#000000] font-body-md text-body-md font-bold select-none hover:bg-[#F8FAFC] transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#000000]">filter_alt_off</span>
              <span>Inspect Empty Filter State</span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#F1F5F9] text-[#000000] border border-[#CBD5E1] font-semibold">Zero Matches</span>
            </div>
            <span className="material-symbols-outlined text-[#000000] transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-2.5 bg-white border-t border-[#CBD5E1]">
            <div className="w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#000000]">
              <span className="material-symbols-outlined text-[22px]">inbox</span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-headline-sm text-headline-sm text-[#000000] font-bold">No orders match these filters</h4>
              <p className="font-body-sm text-body-sm text-[#000000] font-medium max-w-sm">
                Try adjusting status filters, date range, or clear search queries to view orders.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
                setOnlySignedCert(false);
              }}
              className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded bg-[#000000] text-white font-body-sm text-body-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
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
