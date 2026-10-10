
export type OrderState =
  | "RECEIVED"
  | "VALIDATED"
  | "IN_PROGRESS"
  | "ACTIVE"
  | "ROLLING_BACK"
  | "ROLLED_BACK"
  | "NEEDS_ATTENTION"
  | "FAILED"
  | "CANCELLED";

export type TaskState =
  | "PENDING"
  | "RUNNING"
  | "RETRYING"
  | "SUCCEEDED"
  | "FAILED"
  | "SKIPPED"
  | "COMPENSATING"
  | "COMPENSATED"
  | "COMPENSATION_FAILED";

export interface Order {
  order_id: string;
  client_order_ref: string;
  customer_id: string;
  product: string;
  product_id?: string;
  state: OrderState;
  created_at: string;
  completed_at?: string;
  activation_ms?: number;
  failure_reason?: string;
  workflow_id: string;
  current_step?: string;
  msisdn?: string;
  iccid?: string;
  chaos_key?: string | null;
  explanation?: Record<string, unknown> | null;
  payload?: Record<string, unknown>;
}

export interface TaskRecord {
  order_id: string;
  task_id: string;
  system: string;
  action?: string;
  depends_on?: string[];
  state: TaskState;
  attempts: number;
  started_at?: string;
  ended_at?: string;
  last_error?: string;
}

export interface OrderEvent {
  id: number;
  order_id: string;
  seq: number;
  event_id: string;
  ts: string;
  type: string;
  task_id?: string;
  payload: Record<string, unknown>;
}

export interface MetricsSummary {
  total_orders: number;
  active_orders: number;
  rolled_back_orders: number;
  needs_attention_orders: number;
  cancelled_orders: number;
  in_flight_orders: number;
  success_rate: number;
  clean_rollback_rate: number;
  p50_activation_ms: number;
  p95_activation_ms: number;
  p99_activation_ms: number;
}
