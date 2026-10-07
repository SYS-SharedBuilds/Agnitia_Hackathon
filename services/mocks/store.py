import json
import sqlite3
from typing import Any


class MockStateStore:
    """In-memory + SQLite persistent store for mock systems state & idempotency replay."""

    def __init__(self, system_name: str, db_path: str | None = None) -> None:
        self.system_name = system_name
        self.db_path = db_path or f"/tmp/switchon_mock_{system_name}.sqlite"
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS idempotency (
                    key TEXT PRIMARY KEY,
                    response TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS entities (
                    order_id TEXT PRIMARY KEY,
                    state TEXT NOT NULL,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()

    def check_idempotency(self, key: str) -> tuple[int, dict[str, Any]] | None:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT status_code, response FROM idempotency WHERE key = ?", (key,)
            ).fetchone()
            if row:
                return row["status_code"], json.loads(row["response"])
        return None

    def record_idempotency(self, key: str, status_code: int, response: dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO idempotency (key, status_code, response) VALUES (?, ?, ?)",
                (key, status_code, json.dumps(response)),
            )
            conn.commit()

    def get_entity(self, order_id: str) -> dict[str, Any] | None:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT order_id, state, data FROM entities WHERE order_id = ?", (order_id,)
            ).fetchone()
            if row:
                return {
                    "order_id": row["order_id"],
                    "state": row["state"],
                    "data": json.loads(row["data"]),
                }
        return None

    def upsert_entity(self, order_id: str, state: str, data: dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO entities (order_id, state, data, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(order_id) DO UPDATE SET
                    state = excluded.state,
                    data = excluded.data,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (order_id, state, json.dumps(data)),
            )
            conn.commit()

    def delete_entity(self, order_id: str) -> bool:
        with self._get_conn() as conn:
            cur = conn.execute("DELETE FROM entities WHERE order_id = ?", (order_id,))
            conn.commit()
            return cur.rowcount > 0

    def clear(self) -> None:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM idempotency")
            conn.execute("DELETE FROM entities")
            conn.commit()
