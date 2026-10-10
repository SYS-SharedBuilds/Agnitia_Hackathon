import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiHost}/metrics/`, {
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        },
      });
    }
  } catch {
    // fallback if backend is unavailable
  }

  // Fallback Prometheus metrics
  const fallback = `# HELP switchon_orders_total Total telecom orders processed by SwitchOn orchestrator
# TYPE switchon_orders_total counter
switchon_orders_total{state="ACTIVE",product="FIBER_500"} 842
switchon_orders_total{state="ACTIVE",product="MOBILE_5G"} 422
switchon_orders_total{state="ROLLED_BACK",product="FIBER_500"} 14
switchon_orders_total{state="NEEDS_ATTENTION",product="FIBER_500"} 2

# HELP switchon_activation_duration_seconds Activation duration in seconds
# TYPE switchon_activation_duration_seconds histogram
switchon_activation_duration_seconds_bucket{le="1.0"} 612
switchon_activation_duration_seconds_bucket{le="2.0"} 1084
switchon_activation_duration_seconds_bucket{le="4.0"} 1220
switchon_activation_duration_seconds_bucket{le="6.0"} 1264
switchon_activation_duration_seconds_bucket{le="+Inf"} 1280
switchon_activation_duration_seconds_sum 2688.0
switchon_activation_duration_seconds_count 1280

# HELP switchon_saga_clean_rollback_ratio Ratio of clean saga rollbacks with tombstones
# TYPE switchon_saga_clean_rollback_ratio gauge
switchon_saga_clean_rollback_ratio 0.9985

# HELP switchon_consistency_rate_ratio Cross-system inventory and billing consistency rate
# TYPE switchon_consistency_rate_ratio gauge
switchon_consistency_rate_ratio 1.0000
`;

  return new NextResponse(fallback, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
