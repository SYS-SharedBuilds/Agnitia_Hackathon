import re
from typing import Any

MSISDN_PATTERN = re.compile(r"(\d{2})\d{4,8}(\d{2})")
EMAIL_PATTERN = re.compile(r"([^@]{2})[^@]+(@.+)")


def mask_pii_string(value: str) -> str:
    """Masks phone numbers and emails according to RULES.md §7:
    MSISDN/ICCID -> 98XXXXXX10
    """
    if "@" in value:
        return EMAIL_PATTERN.sub(r"\1***\2", value)
    if len(value) >= 8 and value.isdigit():
        return f"{value[:2]}{'X' * (len(value) - 4)}{value[-2:]}"
    return value


def mask_payload(data: Any) -> Any:
    """Recursively masks PII fields in dictionaries and lists."""
    if isinstance(data, dict):
        masked = {}
        for k, v in data.items():
            if k.lower() in ("msisdn", "iccid", "phone", "contact_number"):
                masked[k] = mask_pii_string(str(v)) if v is not None else None
            elif k.lower() in ("email", "recipient") and isinstance(v, str):
                masked[k] = mask_pii_string(v)
            else:
                masked[k] = mask_payload(v)
        return masked
    elif isinstance(data, list):
        return [mask_payload(item) for item in data]
    return data
