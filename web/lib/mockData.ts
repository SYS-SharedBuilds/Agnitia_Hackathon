// Central mock and synthetic telecom dataset for SwitchOn NOC Console
// Adheres to rules: Realistic IDs (ORD-2026-..., CUST-..., MSISDN, IMSI), consistent state across pages,
// strictly synthetic data, typed, and clean fallback integration.

import { MetricsSummary, Order, OrderEvent, TaskRecord } from "./types";

export interface TelecomResource {
  id: string;
  type: "ONT_DEVICE" | "GPON_PORT" | "VLAN_TAG" | "IP_POOL" | "ESIM_PROFILE";
  name: string;
  allocationRef: string;
  assignedToOrder?: string;
  status: "ALLOCATED" | "AVAILABLE" | "RESERVED" | "RELEASED_TOMBSTONE";
  region: string;
  lastUpdated: string;
}

export interface NetworkProfile {
  imsi: string;
  msisdn: string;
  serviceProfile: string;
  qosPolicy: string;
  hlrSliceId: string;
  state: "PROVISIONED_ACTIVE" | "DEPROVISIONING" | "DECOMMISSIONED_TOMBSTONE" | "FAILED_TIMEOUT";
  linkedOrder: string;
  latencyMs: number;
}

export interface BillingAccount {
  accountRef: string;
  customerRef: string;
  monthlyCharge: string;
  currency: "USD" | "EUR";
  billingState: "ACTIVE" | "PENDING_VERIFICATION" | "VOIDED_REVERSED" | "DISPUTED";
  linkedOrder: string;
  paymentMethod: string;
  tariffPlan: string;
}

export interface DispatchNotification {
  id: string;
  channel: "SMS" | "EMAIL" | "WEBHOOK";
  recipient: string;
  subject: string;
  status: "DELIVERED" | "QUEUED" | "RETRIED_FAILED" | "SUPPRESSED";
  retryCount: number;
  dispatchedAt: string;
  linkedOrder: string;
}

// 1. Central Operational KPIs (Deterministic Fallback)
export const MOCK_OPERATIONAL_KPIS: MetricsSummary = {
  total_orders: 1420,
  active_orders: 1318,
  rolled_back_orders: 86,
  needs_attention_orders: 14,
  cancelled_orders: 2,
  in_flight_orders: 12,
  success_rate: 98.4,
  clean_rollback_rate: 100.0,
  p50_activation_ms: 1820,
  p95_activation_ms: 3410,
  p99_activation_ms: 4890,
};

// 2. Central Orders List (Rich realistic states)
export const MOCK_ORDERS: Order[] = [
  {
    order_id: "ORD-2026-10482",
    client_order_ref: "EXT-CRM-991024",
    customer_id: "CUST-4821",
    product: "Fiber 500 Mbps",
    product_id: "fiber-broadband",
    state: "IN_PROGRESS",
    created_at: "2026-10-09T05:58:12Z",
    workflow_id: "wf-saga-fiber-10482",
    current_step: "HLR Provisioning",
    payload: {
      customer_name: "Marcus Vance",
      msisdn: "+1 555 019-4821",
      address: "742 Evergreen Terrace, Springfield, OR 97477",
      plan: "Fiber Broadband 500",
      bandwidth_mbps: 500,
    },
  },
  {
    order_id: "ORD-2026-10481",
    client_order_ref: "EXT-CRM-991023",
    customer_id: "CUST-4820",
    product: "Fiber 1 Gbps",
    product_id: "fiber-gigabit",
    state: "ACTIVE",
    created_at: "2026-10-09T05:52:40Z",
    completed_at: "2026-10-09T05:52:43Z",
    activation_ms: 3120,
    workflow_id: "wf-saga-fiber-10481",
    current_step: "Completed",
    payload: {
      customer_name: "Eleanor Vance-Pryce",
      msisdn: "+44 7700 900142",
      address: "12 Hanover Square, London, W1S 1HT",
      plan: "Fiber Broadband 1000",
      bandwidth_mbps: 1000,
    },
  },
  {
    order_id: "ORD-2026-10480",
    client_order_ref: "EXT-CRM-991020",
    customer_id: "CUST-4819",
    product: "Business Broadband",
    product_id: "business-broadband",
    state: "ROLLED_BACK",
    created_at: "2026-10-09T05:44:19Z",
    completed_at: "2026-10-09T05:44:27Z",
    activation_ms: 8200,
    failure_reason: "HLR_GATEWAY_TIMEOUT_504: Clean Saga compensation executed; 0 orphan leaks",
    workflow_id: "wf-saga-biz-10480",
    current_step: "Compensated (Clean)",
    payload: {
      customer_name: "Apex Systems GmbH",
      msisdn: "+49 30 2312 990",
      address: "Friedrichstraße 44, Berlin 10117",
      plan: "Business Broadband Direct 2G",
      bandwidth_mbps: 2000,
    },
  },
  {
    order_id: "ORD-2026-10479",
    client_order_ref: "EXT-CRM-990998",
    customer_id: "CUST-4818",
    product: "5G Postpaid Unlimited",
    product_id: "mobile-5g-postpaid",
    state: "NEEDS_ATTENTION",
    created_at: "2026-10-09T05:39:05Z",
    failure_reason: "Manual intervention required: Network deprovision failed after 5 retries (HLR_GATEWAY_TIMEOUT_504)",
    workflow_id: "wf-saga-5g-10479",
    current_step: "Awaiting NOC Operator Override",
    payload: {
      customer_name: "Kavita Narang",
      msisdn: "+91 98200 44911",
      address: "Bandra Kurla Complex, Mumbai 400051",
      plan: "5G Postpaid Pro Max",
      bandwidth_mbps: 300,
    },
  },
  {
    order_id: "ORD-2026-10478",
    client_order_ref: "EXT-CRM-990881",
    customer_id: "CUST-4817",
    product: "eSIM Roaming Global",
    product_id: "esim-roaming",
    state: "ACTIVE",
    created_at: "2026-10-09T05:25:31Z",
    completed_at: "2026-10-09T05:25:33Z",
    activation_ms: 2450,
    workflow_id: "wf-saga-esim-10478",
    current_step: "Completed",
    payload: {
      customer_name: "Soren Lindqvist",
      msisdn: "+46 8 123 4567",
      address: "Kungsgatan 18, Stockholm 111 43",
      plan: "eSIM Global Roam 50GB",
    },
  },
  {
    order_id: "ORD-2026-10477",
    client_order_ref: "EXT-CRM-990710",
    customer_id: "CUST-4816",
    product: "Fiber 500 Mbps",
    product_id: "fiber-broadband",
    state: "CANCELLED",
    created_at: "2026-10-09T05:12:00Z",
    completed_at: "2026-10-09T05:12:02Z",
    activation_ms: 1900,
    failure_reason: "Cancelled by subscriber prior to physical dispatch",
    workflow_id: "wf-saga-fiber-10477",
    current_step: "Order Terminated",
    payload: {
      customer_name: "Aria Montgomery",
      msisdn: "+1 555 302-8812",
      address: "350 5th Ave, New York, NY 10118",
      plan: "Fiber Broadband 500",
    },
  },
  {
    order_id: "ORD-2026-10476",
    client_order_ref: "EXT-CRM-990654",
    customer_id: "CUST-4815",
    product: "Fiber 1 Gbps",
    product_id: "fiber-gigabit",
    state: "ACTIVE",
    created_at: "2026-10-09T04:48:19Z",
    completed_at: "2026-10-09T04:48:22Z",
    activation_ms: 3340,
    workflow_id: "wf-saga-fiber-10476",
    current_step: "Completed",
    payload: {
      customer_name: "Kasper Thorne",
      msisdn: "+1 555 891-2311",
      address: "100 Pine Street, San Francisco, CA 94111",
      plan: "Fiber Broadband 1000",
    },
  },
];

// 3. Central Detailed Tasks Map for Order Detail & Replay views
export const MOCK_ORDER_TASKS: Record<string, TaskRecord[]> = {
  "ORD-2026-10482": [
    {
      order_id: "ORD-2026-10482",
      task_id: "validate_customer_eligibility",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:58:12.100Z",
      ended_at: "2026-10-09T05:58:12.350Z",
    },
    {
      order_id: "ORD-2026-10482",
      task_id: "reserve_terminal_port",
      system: "Inventory",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:58:12.360Z",
      ended_at: "2026-10-09T05:58:12.820Z",
    },
    {
      order_id: "ORD-2026-10482",
      task_id: "assign_vlan_resource",
      system: "Inventory",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:58:12.830Z",
      ended_at: "2026-10-09T05:58:13.110Z",
    },
    {
      order_id: "ORD-2026-10482",
      task_id: "provision_olt_slice",
      system: "Network",
      state: "RUNNING",
      attempts: 1,
      started_at: "2026-10-09T05:58:13.120Z",
    },
    {
      order_id: "ORD-2026-10482",
      task_id: "verify_optical_carrier",
      system: "Network",
      state: "PENDING",
      attempts: 0,
    },
    {
      order_id: "ORD-2026-10482",
      task_id: "create_billing_account",
      system: "Billing",
      state: "PENDING",
      attempts: 0,
    },
    {
      order_id: "ORD-2026-10482",
      task_id: "send_activation_notice",
      system: "Notification",
      state: "PENDING",
      attempts: 0,
    },
  ],
  "ORD-2026-10480": [
    {
      order_id: "ORD-2026-10480",
      task_id: "validate_customer_eligibility",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:44:19.100Z",
      ended_at: "2026-10-09T05:44:19.400Z",
    },
    {
      order_id: "ORD-2026-10480",
      task_id: "reserve_terminal_port",
      system: "Inventory",
      state: "COMPENSATED",
      attempts: 1,
      started_at: "2026-10-09T05:44:19.410Z",
      ended_at: "2026-10-09T05:44:26.900Z",
    },
    {
      order_id: "ORD-2026-10480",
      task_id: "provision_olt_slice",
      system: "Network",
      state: "COMPENSATED",
      attempts: 4,
      started_at: "2026-10-09T05:44:19.900Z",
      ended_at: "2026-10-09T05:44:25.800Z",
      last_error: "HLR_GATEWAY_TIMEOUT_504 on attempt 4 -> Compensated cleanly",
    },
    {
      order_id: "ORD-2026-10480",
      task_id: "create_billing_account",
      system: "Billing",
      state: "SKIPPED",
      attempts: 0,
    },
    {
      order_id: "ORD-2026-10480",
      task_id: "send_activation_notice",
      system: "Notification",
      state: "SKIPPED",
      attempts: 0,
    },
  ],
  // 1. SAGA HALTED AT NETWORK DEPROVISION (S11 Scenario)
  "ORD-20260712-004217": [
    {
      order_id: "ORD-20260712-004217",
      task_id: "validate_order",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:22:00.100Z",
      ended_at: "2026-07-12T14:22:00.320Z",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "reserve_inventory",
      system: "Inventory",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:22:00.330Z",
      ended_at: "2026-07-12T14:22:00.670Z",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "create_billing_account",
      system: "Billing",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:22:00.340Z",
      ended_at: "2026-07-12T14:22:00.760Z",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "provision_network",
      system: "Network",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:22:00.680Z",
      ended_at: "2026-07-12T14:22:02.100Z",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "verify_service",
      system: "Network",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:22:02.110Z",
      ended_at: "2026-07-12T14:22:02.720Z",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "start_billing",
      system: "Billing",
      state: "FAILED",
      attempts: 3,
      started_at: "2026-07-12T14:22:02.730Z",
      ended_at: "2026-07-12T14:22:05.730Z",
      last_error: "OCS 500: Internal Rating Timeout after 3 retries",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "deprovision_network",
      system: "Network",
      state: "COMPENSATION_FAILED",
      attempts: 5,
      started_at: "2026-07-12T14:22:05.740Z",
      ended_at: "2026-07-12T14:22:11.680Z",
      last_error: "HLR_GATEWAY_TIMEOUT_504: 5 retries exhausted on hlr-east-01",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "release_inventory",
      system: "Inventory",
      state: "PENDING",
      attempts: 0,
      last_error: "Stalled: waiting on upstream network rollback",
    },
    {
      order_id: "ORD-20260712-004217",
      task_id: "void_billing_account",
      system: "Billing",
      state: "PENDING",
      attempts: 0,
      last_error: "Stalled: waiting on upstream network rollback",
    },
  ],
  // 2. FAILED AT INVENTORY ALLOCATION (SIM POOL EXHAUSTION / LEASE CONFLICT)
  "ORD-20260712-004213": [
    {
      order_id: "ORD-20260712-004213",
      task_id: "validate_order",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T13:40:00.100Z",
      ended_at: "2026-07-12T13:40:00.280Z",
    },
    {
      order_id: "ORD-20260712-004213",
      task_id: "reserve_inventory",
      system: "Inventory",
      state: "FAILED",
      attempts: 3,
      started_at: "2026-07-12T13:40:00.290Z",
      ended_at: "2026-07-12T13:40:01.890Z",
      last_error: "SIM_POOL_CONFLICT_409: EID block locked or exhausted in cluster eu-north-sto",
    },
    {
      order_id: "ORD-20260712-004213",
      task_id: "create_billing_account",
      system: "Billing",
      state: "COMPENSATED",
      attempts: 1,
      started_at: "2026-07-12T13:40:00.300Z",
      ended_at: "2026-07-12T13:40:02.100Z",
      last_error: "Voided cleanly after parallel inventory failure",
    },
    {
      order_id: "ORD-20260712-004213",
      task_id: "provision_network",
      system: "Network",
      state: "SKIPPED",
      attempts: 0,
    },
    {
      order_id: "ORD-20260712-004213",
      task_id: "verify_service",
      system: "Network",
      state: "SKIPPED",
      attempts: 0,
    },
    {
      order_id: "ORD-20260712-004213",
      task_id: "start_billing",
      system: "Billing",
      state: "SKIPPED",
      attempts: 0,
    },
  ],
  // 3. FAILED AT NETWORK PROVISIONING (HLR SLICE TIMEOUT ON INITIAL FORWARD STEP)
  "ORD-20260712-004209": [
    {
      order_id: "ORD-20260712-004209",
      task_id: "validate_order",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T13:10:00.100Z",
      ended_at: "2026-07-12T13:10:00.300Z",
    },
    {
      order_id: "ORD-20260712-004209",
      task_id: "reserve_inventory",
      system: "Inventory",
      state: "COMPENSATED",
      attempts: 1,
      started_at: "2026-07-12T13:10:00.310Z",
      ended_at: "2026-07-12T13:10:04.200Z",
      last_error: "Compensated: SIM reservation hold released with zero leakage",
    },
    {
      order_id: "ORD-20260712-004209",
      task_id: "create_billing_account",
      system: "Billing",
      state: "COMPENSATED",
      attempts: 1,
      started_at: "2026-07-12T13:10:00.320Z",
      ended_at: "2026-07-12T13:10:04.150Z",
      last_error: "Compensated: Billing account voided and journal marked reversed",
    },
    {
      order_id: "ORD-20260712-004209",
      task_id: "provision_network",
      system: "Network",
      state: "FAILED",
      attempts: 3,
      started_at: "2026-07-12T13:10:00.650Z",
      ended_at: "2026-07-12T13:10:03.950Z",
      last_error: "HLR_GATEWAY_TIMEOUT_504: Diameter credit control & subscriber attachment timeout on hlr-east-01",
    },
    {
      order_id: "ORD-20260712-004209",
      task_id: "verify_service",
      system: "Network",
      state: "SKIPPED",
      attempts: 0,
    },
    {
      order_id: "ORD-20260712-004209",
      task_id: "start_billing",
      system: "Billing",
      state: "SKIPPED",
      attempts: 0,
    },
  ],
  // 4. FAILED AT SERVICE VERIFICATION (RADIUS LOOPBACK AUTHENTICATION REJECTION)
  "ORD-20260712-004214": [
    {
      order_id: "ORD-20260712-004214",
      task_id: "validate_order",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T13:48:00.100Z",
      ended_at: "2026-07-12T13:48:00.250Z",
    },
    {
      order_id: "ORD-20260712-004214",
      task_id: "reserve_inventory",
      system: "Inventory",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T13:48:00.260Z",
      ended_at: "2026-07-12T13:48:00.580Z",
    },
    {
      order_id: "ORD-20260712-004214",
      task_id: "create_billing_account",
      system: "Billing",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T13:48:00.270Z",
      ended_at: "2026-07-12T13:48:00.690Z",
    },
    {
      order_id: "ORD-20260712-004214",
      task_id: "provision_network",
      system: "Network",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T13:48:00.600Z",
      ended_at: "2026-07-12T13:48:02.100Z",
    },
    {
      order_id: "ORD-20260712-004214",
      task_id: "verify_service",
      system: "Network",
      state: "FAILED",
      attempts: 3,
      started_at: "2026-07-12T13:48:02.110Z",
      ended_at: "2026-07-12T13:48:05.400Z",
      last_error: "RADIUS_ACCESS_REJECT_401: ONT optics loopback carrier probe failed - BER exceeds threshold 10^-6",
    },
    {
      order_id: "ORD-20260712-004214",
      task_id: "start_billing",
      system: "Billing",
      state: "SKIPPED",
      attempts: 0,
    },
  ],
  // 5. FAILED AT CREATE BILLING ACCOUNT (TARIFF DEFINITION / OCS LEASE CONFLICT)
  "ORD-20260712-004210": [
    {
      order_id: "ORD-20260712-004210",
      task_id: "validate_order",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:58:00.100Z",
      ended_at: "2026-07-12T14:58:00.220Z",
    },
    {
      order_id: "ORD-20260712-004210",
      task_id: "reserve_inventory",
      system: "Inventory",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-07-12T14:58:00.230Z",
      ended_at: "2026-07-12T14:58:00.580Z",
    },
    {
      order_id: "ORD-20260712-004210",
      task_id: "create_billing_account",
      system: "Billing",
      state: "FAILED",
      attempts: 3,
      started_at: "2026-07-12T14:58:00.240Z",
      ended_at: "2026-07-12T14:58:02.800Z",
      last_error: "OCS_TARIFF_INVALID_422: Custom tariff table matrix undefined for M2M fleet tier",
    },
    {
      order_id: "ORD-20260712-004210",
      task_id: "provision_network",
      system: "Network",
      state: "SKIPPED",
      attempts: 0,
    },
    {
      order_id: "ORD-20260712-004210",
      task_id: "verify_service",
      system: "Network",
      state: "SKIPPED",
      attempts: 0,
    },
    {
      order_id: "ORD-20260712-004210",
      task_id: "start_billing",
      system: "Billing",
      state: "SKIPPED",
      attempts: 0,
    },
  ],
  // 6. 5G POSTPAID SAGA HALTED AT HLR OVERRIDE (ORD-2026-10479)
  "ORD-2026-10479": [
    {
      order_id: "ORD-2026-10479",
      task_id: "validate_order",
      system: "OMS",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:39:05.100Z",
      ended_at: "2026-10-09T05:39:05.300Z",
    },
    {
      order_id: "ORD-2026-10479",
      task_id: "reserve_inventory",
      system: "Inventory",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:39:05.310Z",
      ended_at: "2026-10-09T05:39:05.620Z",
    },
    {
      order_id: "ORD-2026-10479",
      task_id: "create_billing_account",
      system: "Billing",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:39:05.320Z",
      ended_at: "2026-10-09T05:39:05.710Z",
    },
    {
      order_id: "ORD-2026-10479",
      task_id: "provision_network",
      system: "Network",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:39:05.630Z",
      ended_at: "2026-10-09T05:39:07.100Z",
    },
    {
      order_id: "ORD-2026-10479",
      task_id: "verify_service",
      system: "Network",
      state: "SUCCEEDED",
      attempts: 1,
      started_at: "2026-10-09T05:39:07.110Z",
      ended_at: "2026-10-09T05:39:07.720Z",
    },
    {
      order_id: "ORD-2026-10479",
      task_id: "start_billing",
      system: "Billing",
      state: "FAILED",
      attempts: 3,
      started_at: "2026-10-09T05:39:07.730Z",
      ended_at: "2026-10-09T05:39:10.730Z",
      last_error: "OCS 500: Quota lease timeout after 3 retries",
    },
    {
      order_id: "ORD-2026-10479",
      task_id: "deprovision_network",
      system: "Network",
      state: "COMPENSATION_FAILED",
      attempts: 5,
      started_at: "2026-10-09T05:39:10.740Z",
      ended_at: "2026-10-09T05:39:16.680Z",
      last_error: "HLR_GATEWAY_TIMEOUT_504: 5 retries exhausted on hlr-slice-5g-in",
    },
  ],
};

// 4. Central Detailed Events Stream
export const MOCK_ORDER_EVENTS: Record<string, OrderEvent[]> = {
  "ORD-2026-10482": [
    {
      id: 1,
      order_id: "ORD-2026-10482",
      seq: 1,
      event_id: "evt-oms-001",
      ts: "2026-10-09T05:58:12.100Z",
      type: "OrderAccepted",
      task_id: "validate_customer_eligibility",
      payload: { client_ref: "EXT-CRM-991024", customer: "CUST-4821", product: "Fiber 500 Mbps" },
    },
    {
      id: 2,
      order_id: "ORD-2026-10482",
      seq: 2,
      event_id: "evt-inv-002",
      ts: "2026-10-09T05:58:12.820Z",
      type: "InventoryReserved",
      task_id: "reserve_terminal_port",
      payload: { ont_id: "ONT-GPON-9941", splitter: "SPL-E4-P12", vlan: 402 },
    },
    {
      id: 3,
      order_id: "ORD-2026-10482",
      seq: 3,
      event_id: "evt-net-003",
      ts: "2026-10-09T05:58:13.120Z",
      type: "NetworkProvisioningStarted",
      task_id: "provision_olt_slice",
      payload: { profile: "GPON-500M-SYM", olt_node: "olt-or-springfield-01" },
    },
  ],
};

// 5. Central Telecom Inventory Resources
export const MOCK_INVENTORY_RESOURCES: TelecomResource[] = [
  {
    id: "RES-ONT-8841",
    type: "ONT_DEVICE",
    name: "Nokia XS-010X-Q XGS-PON ONT",
    allocationRef: "ALLOC-ONT-ORD-10482",
    assignedToOrder: "ORD-2026-10482",
    status: "ALLOCATED",
    region: "us-west-or",
    lastUpdated: "2026-10-09 05:58:12 UTC",
  },
  {
    id: "RES-PORT-104",
    type: "GPON_PORT",
    name: "Terminal ODF #14 Splitter Port 04",
    allocationRef: "ALLOC-PORT-ORD-10481",
    assignedToOrder: "ORD-2026-10481",
    status: "ALLOCATED",
    region: "eu-west-lon",
    lastUpdated: "2026-10-09 05:52:41 UTC",
  },
  {
    id: "RES-VLAN-402",
    type: "VLAN_TAG",
    name: "QinQ Outer S-TAG 402 / C-TAG 108",
    allocationRef: "ALLOC-VLAN-ORD-10480",
    assignedToOrder: "ORD-2026-10480",
    status: "RELEASED_TOMBSTONE",
    region: "eu-central-ber",
    lastUpdated: "2026-10-09 05:44:26 UTC",
  },
  {
    id: "RES-ESIM-991",
    type: "ESIM_PROFILE",
    name: "SM-DP+ RSP Profile Tier 1",
    allocationRef: "ALLOC-ESIM-ORD-10478",
    assignedToOrder: "ORD-2026-10478",
    status: "ALLOCATED",
    region: "eu-north-sto",
    lastUpdated: "2026-10-09 05:25:32 UTC",
  },
  {
    id: "RES-ONT-8842",
    type: "ONT_DEVICE",
    name: "Huawei HG8010H GPON ONT",
    allocationRef: "AVAIL-POOL-WEST",
    status: "AVAILABLE",
    region: "us-west-or",
    lastUpdated: "2026-10-09 05:00:00 UTC",
  },
];

// 6. Central Network Profiles (Consistent with order states)
export const MOCK_NETWORK_PROFILES: NetworkProfile[] = [
  {
    imsi: "310410091824701",
    msisdn: "+1 555 019-4821",
    serviceProfile: "GPON-500M-SYM-PREMIUM",
    qosPolicy: "5QI-9 · Committed 500 Mbps",
    hlrSliceId: "slice-ftth-or-9182",
    state: "PROVISIONED_ACTIVE",
    linkedOrder: "ORD-2026-10482",
    latencyMs: 14,
  },
  {
    imsi: "234109823411290",
    msisdn: "+44 7700 900142",
    serviceProfile: "FTTH-1000M-GIGABIT",
    qosPolicy: "5QI-8 · Committed 1000 Mbps",
    hlrSliceId: "slice-ftth-uk-1041",
    state: "PROVISIONED_ACTIVE",
    linkedOrder: "ORD-2026-10481",
    latencyMs: 9,
  },
  {
    imsi: "262019948211024",
    msisdn: "+49 30 2312 990",
    serviceProfile: "BIZ-DIRECT-2G-QOS",
    qosPolicy: "5QI-1 · Priority SLA Guaranteed",
    hlrSliceId: "slice-biz-de-8819",
    state: "DECOMMISSIONED_TOMBSTONE",
    linkedOrder: "ORD-2026-10480",
    latencyMs: 0,
  },
  {
    imsi: "404450918293811",
    msisdn: "+91 98200 44911",
    serviceProfile: "5G-SA-VOICE-DATA",
    qosPolicy: "5QI-9 · Best Effort 300 Mbps",
    hlrSliceId: "slice-5g-in-4491",
    state: "FAILED_TIMEOUT",
    linkedOrder: "ORD-2026-10479",
    latencyMs: 380,
  },
];

// 7. Central Billing Accounts
export const MOCK_BILLING_ACCOUNTS: BillingAccount[] = [
  {
    accountRef: "BILL-ACC-991024",
    customerRef: "CUST-4821",
    monthlyCharge: "$65.00 / month",
    currency: "USD",
    billingState: "PENDING_VERIFICATION",
    linkedOrder: "ORD-2026-10482",
    paymentMethod: "ACH Direct Debit (•••• 4821)",
    tariffPlan: "Fiber Broadband 500 Plan",
  },
  {
    accountRef: "BILL-ACC-991023",
    customerRef: "CUST-4820",
    monthlyCharge: "£75.00 / month",
    currency: "EUR",
    billingState: "ACTIVE",
    linkedOrder: "ORD-2026-10481",
    paymentMethod: "BACS Credit (•••• 1042)",
    tariffPlan: "Fiber Gigabit Pro Unlimited",
  },
  {
    accountRef: "BILL-ACC-991020",
    customerRef: "CUST-4819",
    monthlyCharge: "€210.00 / month",
    currency: "EUR",
    billingState: "VOIDED_REVERSED",
    linkedOrder: "ORD-2026-10480",
    paymentMethod: "SEPA Corporate (•••• 9901)",
    tariffPlan: "Business Broadband Dedicated",
  },
];

// 8. Central Notifications
export const MOCK_NOTIFICATIONS: DispatchNotification[] = [
  {
    id: "NOTIF-SMS-001",
    channel: "SMS",
    recipient: "+1 555 019-4821",
    subject: "Order ORD-2026-10482 received and in provisioning",
    status: "DELIVERED",
    retryCount: 0,
    dispatchedAt: "2026-10-09 05:58:13 UTC",
    linkedOrder: "ORD-2026-10482",
  },
  {
    id: "NOTIF-EMAIL-002",
    channel: "EMAIL",
    recipient: "e.vance@londonnet.uk",
    subject: "Your Gigabit Fiber connection is now ACTIVE",
    status: "DELIVERED",
    retryCount: 0,
    dispatchedAt: "2026-10-09 05:52:43 UTC",
    linkedOrder: "ORD-2026-10481",
  },
  {
    id: "NOTIF-SMS-003",
    channel: "SMS",
    recipient: "+49 30 2312 990",
    subject: "Notice: Provisioning rollback executed safely. Zero charges applied.",
    status: "DELIVERED",
    retryCount: 0,
    dispatchedAt: "2026-10-09 05:44:27 UTC",
    linkedOrder: "ORD-2026-10480",
  },
];

// Helper to determine if a response is fallback demo data
export const isSyntheticData = (orderId?: string): boolean => {
  if (!orderId) return true;
  return orderId.startsWith("ORD-2026-") || orderId.startsWith("ORD-20260712-");
};
