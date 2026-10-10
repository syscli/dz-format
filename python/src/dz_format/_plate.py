"""Vehicle plates of the normal series, and wilaya codes."""

from __future__ import annotations

from datetime import date
from typing import Optional

from ._core import Result, digits_of, fail

# arrete of 5 May 1988, as amended by the arrete of 4 December 2022.
_CATEGORIES = {
    "1": "tourisme",
    "2": "camion",
    "3": "camionnette",
    "4": "autocar",
    "5": "tracteur-routier",
    "6": "tracteur",
    "7": "special",
    "8": "remorque",
    "9": "moto",
}

# Codes 59 to 69 were added by the arrete published on 17 June 2026, in force
# from 1 January 2027.
_MAX_WILAYA = 69

UNKNOWN_YEAR = "33"
"""Printed in place of the year when it is not known."""


def plate(value: object, today: Optional[date] = None) -> Result:
    """Validates a plate written as serial, category and year, wilaya:
    "12345 116 16". Temporary (W, WW) and public works series are not
    covered."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    # At least one serial digit; serials run to six digits in large wilayas.
    if not 6 <= len(d) <= 11:
        return fail("length")
    wilaya, year_code, category, serial = d[-2:], d[-4:-2], d[-5:-4], d[:-5]
    if not 1 <= int(wilaya) <= _MAX_WILAYA:
        return fail("range")
    name = _CATEGORIES.get(category)
    if name is None:
        return fail("range")
    if set(serial) == {"0"}:
        return fail("range")
    year = None
    if year_code != UNKNOWN_YEAR:
        yy = int(year_code)
        now = (today or date.today()).year
        year = 1900 + yy if 2000 + yy > now else 2000 + yy
    return {
        "valid": True,
        "value": d,
        "serial": serial,
        "category": category,
        "category_name": name,
        "year_code": year_code,
        "year": year,
        "wilaya": wilaya,
    }


def format_plate(value: str) -> str:
    """Formats a valid plate the way it is printed: "12345 116 16"."""
    p = plate(value)
    if not p["valid"]:
        raise ValueError(f"not an Algerian plate: {value}")
    return f"{p['serial']} {p['category']}{p['year_code']} {p['wilaya']}"


def wilaya_code(value: object, map: int = 69) -> Result:
    """Validates a wilaya code under the 48, 58 or 69 map. "1", "01" and 1
    all give "01". For names and communes, see dz_format.place."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) > 2:
        return fail("length")
    n = int(d)
    if n < 1 or n > map:
        return fail("range")
    return {"valid": True, "code": f"{n:02d}"}
