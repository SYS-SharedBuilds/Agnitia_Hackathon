-- Schema initialization for SwitchOn multi-schema database

CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS oms;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS network;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS notify;

-- Read Model (Ops Schema)
CREATE TABLE IF NOT EXISTS ops.orders (
    order_id VARCHAR(64) PRIMARY KEY,
    client_order_ref VARCHAR(128) UNIQUE NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    product VARCHAR(64) NOT NULL,
    catalog_version INTEGER DEFAULT 1,
    plan_json JSONB DEFAULT '{}'::jsonb,
    engine VARCHAR(32) DEFAULT 'temporal',
    state VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    activation_ms INTEGER,
    failure_reason TEXT,
    explanation JSONB,
    workflow_id VARCHAR(128) NOT NULL,
    chaos_key VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS ops.tasks (
    order_id VARCHAR(64) NOT NULL,
    task_id VARCHAR(64) NOT NULL,
    system VARCHAR(32) NOT NULL,
    state VARCHAR(32) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    last_error TEXT,
    outcome_known BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (order_id, task_id)
);

CREATE TABLE IF NOT EXISTS ops.events (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    seq INTEGER NOT NULL,
    event_id VARCHAR(64) UNIQUE NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    type VARCHAR(64) NOT NULL,
    task_id VARCHAR(64),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ops.certificates (
    order_id VARCHAR(64) PRIMARY KEY,
    body JSONB NOT NULL,
    signature TEXT NOT NULL,
    key_id VARCHAR(64) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ops.drift (
    id SERIAL PRIMARY KEY,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    system VARCHAR(32) NOT NULL,
    resource_ref VARCHAR(128) NOT NULL,
    class VARCHAR(32) NOT NULL,
    order_id VARCHAR(64),
    action VARCHAR(64),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ops.system_calls (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    task_id VARCHAR(64),
    system VARCHAR(32) NOT NULL,
    direction VARCHAR(16) DEFAULT 'outbound',
    request JSONB NOT NULL DEFAULT '{}'::jsonb,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Schemas: OMS
CREATE TABLE IF NOT EXISTS oms.orders (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    product VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oms.idempotency (
    key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oms.tombstones (
    forward_key VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Schemas: Inventory
CREATE TABLE IF NOT EXISTS inventory.resources (
    order_id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64) NOT NULL,
    serial_number VARCHAR(64),
    status VARCHAR(32) NOT NULL, -- RESERVED, RELEASED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.idempotency (
    key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.tombstones (
    forward_key VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Schemas: Network
CREATE TABLE IF NOT EXISTS network.services (
    order_id VARCHAR(64) PRIMARY KEY,
    vlan_id INTEGER,
    ip_address VARCHAR(45),
    port_id VARCHAR(64),
    status VARCHAR(32) NOT NULL, -- PROVISIONED, VERIFIED, DEPROVISIONED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network.idempotency (
    key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network.tombstones (
    forward_key VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Schemas: Billing
CREATE TABLE IF NOT EXISTS billing.accounts (
    order_id VARCHAR(64) PRIMARY KEY,
    account_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL, -- ACTIVE, CHARGING, VOIDED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing.charges (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL, -- STARTED, REVERSED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing.idempotency (
    key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing.tombstones (
    forward_key VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Schemas: Notification
CREATE TABLE IF NOT EXISTS notify.messages (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    recipient VARCHAR(128) NOT NULL,
    template VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL, -- ENQUEUED, DELIVERED, FAILED
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notify.idempotency (
    key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notify.tombstones (
    forward_key VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
