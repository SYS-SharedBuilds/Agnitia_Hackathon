from typing import Any

EXPLANATION_RULES: dict[tuple[str, str], dict[str, str]] = {
    ("inventory", "OUT_OF_STOCK"): {
        "cause": "Requested hardware terminal (ONT/eSIM) is out of stock in local distribution center.",
        "customer_impact": "Service activation paused; no billing or physical line provisioned.",
        "recommended_action": "Restock hardware inventory or substitute alternative compatible device profile.",
        "owner": "Supply Chain / Warehouse Operations",
    },
    ("network", "PORT_EXHAUSTED"): {
        "cause": "DSLAM/OLT terminal port allocation exhausted at street cabinet.",
        "customer_impact": "Line cannot be physically patched.",
        "recommended_action": "Dispatch network engineering team for splitter expansion or cable grooming.",
        "owner": "Outside Plant Engineering",
    },
    ("billing", "CREDIT_CHECK_FAILED"): {
        "cause": "Customer credit score below threshold for postpaid tier.",
        "customer_impact": "Postpaid subscription cannot be activated.",
        "recommended_action": "Offer prepaid plan alternative or security deposit request.",
        "owner": "Finance & Risk Ops",
    },
    ("oms", "INVALID_CUSTOMER"): {
        "cause": "Customer profile missing required KYC or address validation.",
        "customer_impact": "Order rejected prior to provisioning.",
        "recommended_action": "Request customer update KYC details.",
        "owner": "Customer Care",
    },
}


def explain_failure(
    system: str,
    error_code: str,
    failed_task: str,
    order_state: str,
    completed_tasks: list[str] | None = None,
) -> dict[str, Any]:
    """Generates deterministic root-cause analysis, blast radius, and recovery guidance (X7)."""
    rule = EXPLANATION_RULES.get((system.lower(), error_code.upper()))
    if not rule:
        rule = {
            "cause": f"System '{system}' failed at step '{failed_task}' with error: {error_code}",
            "customer_impact": "Order execution failed and clean rollback executed.",
            "recommended_action": "Investigate downstream system logs and retry order if transient.",
            "owner": f"{system.capitalize()} Operations",
        }

    undone_effects = []
    if completed_tasks:
        for t in completed_tasks:
            undone_effects.append(f"Compensated: {t}")

    return {
        "system": system,
        "error_code": error_code,
        "task_id": failed_task,
        "state": order_state,
        "cause": rule["cause"],
        "customer_impact": rule["customer_impact"],
        "recommended_action": rule["recommended_action"],
        "owner": rule["owner"],
        "remediation_summary": f"Clean saga rollback applied. {len(undone_effects)} effects reverted.",
        "undone_effects": undone_effects,
    }
