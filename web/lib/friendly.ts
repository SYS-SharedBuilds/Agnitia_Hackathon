export function getFriendlyStatus(state: string) {
  const norm = (state || "").toUpperCase();
  switch (norm) {
    case "ACTIVE":
      return {
        label: "Active & Ready",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "check_circle",
        description: "Your telecom service has been successfully verified and activated.",
        isTerminal: true,
      };
    case "IN_PROGRESS":
    case "RUNNING":
      return {
        label: "Activating Service",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
        icon: "progress_activity",
        description: "SwitchOn is orchestrating your network, billing, and SIM credentials.",
        pulse: true,
      };
    case "RECEIVED":
    case "VALIDATED":
      return {
        label: "Order Received",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "schedule",
        description: "Your service request is queued for orchestration.",
        pulse: true,
      };
    case "NEEDS_ATTENTION":
      return {
        label: "Under Operator Review",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
        icon: "support_agent",
        description: "Our operations desk is performing a manual safety review.",
        needsReview: true,
      };
    case "ROLLING_BACK":
      return {
        label: "Reversing Incomplete Setup",
        badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
        icon: "history",
        description: "A subsystem timed out. Safeguards are currently releasing partial locks.",
        pulse: true,
      };
    case "ROLLED_BACK":
      return {
        label: "Safely Replaced & Reversed",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        icon: "undo",
        description: "Activation could not complete; all network locks were cleanly cleared with zero residual billing.",
        isTerminal: true,
      };
    case "CANCELLED":
      return {
        label: "Order Cancelled",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
        icon: "cancel",
        description: "The activation was cancelled upon request.",
        isTerminal: true,
      };
    default:
      return {
        label: norm || "Processing",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
        icon: "hourglass_empty",
        description: "Service order is being processed.",
      };
  }
}

export function getFriendlyProduct(prodCode: string) {
  const p = (prodCode || "").toUpperCase();
  if (p === "FIBER_500" || p.includes("FIBER")) {
    return {
      title: "Fiber Broadband 500 Mbps",
      badge: "High-Speed FTTH",
      icon: "router",
    };
  }
  if (p === "MOBILE_5G" || p.includes("5G")) {
    return {
      title: "5G Postpaid Unlimited",
      badge: "eSIM / VoNR",
      icon: "5g",
    };
  }
  if (p === "ESIM_ADDON" || p.includes("ESIM")) {
    return {
      title: "eSIM Global Roaming Add-on",
      badge: "SM-DP+ Direct",
      icon: "sim_card",
    };
  }
  return {
    title: prodCode || "Telecom Service Plan",
    badge: "Standard Plan",
    icon: "cell_tower",
  };
}
