"""Algerian phone numbers: mobile (05, 06, 07), landline and VoIP (09)."""

from __future__ import annotations

from ._core import Result, ascii_digits, digits_of, fail

_OPERATORS = {"5": "Ooredoo", "6": "Mobilis", "7": "Djezzy"}


def phone(value: object) -> Result:
    """Validates a number in national form (0661 23 45 67) or international
    form (+213 661 23 45 67, 00213 ...).

    Mobiles and VoIP numbers have 9 digits after the trunk 0, landlines 8.
    The operator is the one the range was allocated to; a number can move
    between operators.
    """
    plus = isinstance(value, str) and ascii_digits(value).strip().startswith("+")
    d = digits_of(value.replace("+", "", 1) if isinstance(value, str) else value)
    if not isinstance(d, str):
        return d

    if plus or d.startswith("00213"):
        rest = d if plus else d[2:]
        if not rest.startswith("213"):
            return fail("prefix")
        nsn = rest[3:]
        # "+213 0661 ..." is a common mistake; the trunk 0 is dropped abroad.
        if nsn.startswith("0"):
            nsn = nsn[1:]
    elif d.startswith("213") and len(d) in (11, 12):
        nsn = d[3:]
    elif d.startswith("0"):
        nsn = d[1:]
    else:
        return fail("prefix")

    first = nsn[:1]
    if first in _OPERATORS:
        if len(nsn) != 9:
            return fail("length")
        parsed = {"type": "mobile", "operator": _OPERATORS[first]}
    elif first == "9":
        if len(nsn) != 9:
            return fail("length")
        parsed = {"type": "voip"}
    elif first in ("2", "3", "4"):
        if len(nsn) != 8:
            return fail("length")
        parsed = {"type": "landline", "area": nsn[:2]}
    else:
        return fail("prefix")
    return {"valid": True, "value": "+213" + nsn, "national": "0" + nsn, **parsed}


def format_phone(value: str, style: str = "national") -> str:
    """Formats a valid number: "0661 23 45 67", or "+213 661 23 45 67" with
    style="international"."""
    p = phone(value)
    if not p["valid"]:
        raise ValueError(f"not an Algerian phone number: {value}")
    nsn = p["national"][1:]
    head = nsn[:2] if p["type"] == "landline" else nsn[:3]
    rest = nsn[len(head) :]
    tail = " ".join(rest[i : i + 2] for i in range(0, len(rest), 2))
    return f"+213 {head} {tail}" if style == "international" else f"0{head} {tail}"
