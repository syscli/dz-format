"""Shared helpers: reading digits the way people type them, and results."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Union

Result = Dict[str, Any]
"""{"valid": True, ...parts} or {"valid": False, "reason": ..., "suggestions"?: [...]}"""

# Arabic-Indic (U+0660..U+0669) and Extended Arabic-Indic (U+06F0..U+06F9)
# digits, both of which turn up in forms filled on Arabic keyboards.
_ARABIC_DIGITS = re.compile("[\\u0660-\\u0669\\u06f0-\\u06f9]")

# Spaces (including no-break and narrow no-break), dashes, dots, slashes,
# underscores and parentheses. These never carry meaning in the formats here.
_SEPARATORS = re.compile("[\\s\\u00a0\\u202f\\-\\u2010-\\u2015./_()]")
_DIGITS = re.compile("[0-9]+")


def fail(reason: str, suggestions: Optional[List[str]] = None) -> Result:
    out: Result = {"valid": False, "reason": reason}
    if suggestions:
        out["suggestions"] = suggestions
    return out


def ascii_digits(value: str) -> str:
    """Converts Arabic-Indic digits to ASCII digits."""

    def one(m: "re.Match[str]") -> str:
        code = ord(m.group(0))
        return str(code - 0x06F0 if code >= 0x06F0 else code - 0x0660)

    return _ARABIC_DIGITS.sub(one, value)


def digits_of(value: object) -> Union[str, Result]:
    """The digits of a value, or the failure explaining why there are none."""
    if isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 2**53 - 1:
        value = str(value)
    if not isinstance(value, str):
        return fail("chars")
    s = _SEPARATORS.sub("", ascii_digits(value))
    if s == "":
        return fail("empty")
    if not _DIGITS.fullmatch(s):
        return fail("chars")
    return s
