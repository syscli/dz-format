"""Postal codes, NIN, NIF, NIS and RC numbers.

None of these has a published check key, so these functions check the layout
only. See sources/README.md for what each rule rests on.
"""

from __future__ import annotations

import re

from ._core import Result, ascii_digits, digits_of, fail


def postal_code(value: object) -> Result:
    """Postal code: 5 digits, the first 2 being the wilaya (01 to 58).

    In October 2026 Algerie Poste had not yet re-coded the offices of the
    wilayas created in 2026 (59 to 69), so the prefix follows the 58 map.
    """
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) != 5:
        return fail("length")
    if not 1 <= int(d[:2]) <= 58:
        return fail("range")
    return {"valid": True, "value": d, "wilaya": d[:2], "office": d[2:]}


def nin(value: object) -> Result:
    """NIN of decret executif 23-316: 18 digits. Its key is not published, so
    only the length is checked."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) != 18:
        return fail("length")
    return {"valid": True, "value": d}


def nif(value: object) -> Result:
    """NIF, the tax identification number: 15 digits, or 20 for a secondary
    establishment, whose first 15 digits are the NIF of the taxpayer."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) not in (15, 20):
        return fail("length")
    return {"valid": True, "value": d, "base": d[:15], "establishment": d[15:] if len(d) == 20 else None}


def nis(value: object) -> Result:
    """NIS, the statistical identification number of the ONS: 15 digits."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) != 15:
        return fail("length")
    return {"valid": True, "value": d}


# The layouts seen on extracts, tenders and the GLEIF register:
#   16/00-0013767 B 00      wilaya/office-number letter year
#   01B 0015609-16/00       year letter number-wilaya/office
#   22B1242074              year letter number
_WILAYA_FIRST = re.compile(r"(\d{2})/(\d{2})-?(\d{7,8})([AB])(\d{2})")
_YEAR_FIRST = re.compile(r"(\d{2})([AB])(\d{7,8})(?:-?(\d{2})/(\d{2}))?")
_RC_CHARS = re.compile(r"[0-9AB/-]+")
_SPACES = re.compile("[\\s\\u00a0\\u202f]")
_DASHES = re.compile("[\\u2010-\\u2015]")


def rc(value: object) -> Result:
    """Number of the registre du commerce, in any of the written layouts above.

    The CNRC has not published the format; this follows the layout seen on
    published extracts, so treat a rejection as a hint, not a verdict.
    """
    if not isinstance(value, str):
        return fail("chars")
    s = _DASHES.sub("-", _SPACES.sub("", ascii_digits(value).upper()))
    if s == "":
        return fail("empty")
    if not _RC_CHARS.fullmatch(s):
        return fail("chars")
    m = _WILAYA_FIRST.fullmatch(s)
    if m:
        wilaya, office, number, letter, year = m.groups()
    else:
        m = _YEAR_FIRST.fullmatch(s)
        if not m:
            return fail("format")
        year, letter, number, wilaya, office = m.groups()
    if wilaya is not None and not 1 <= int(wilaya) <= 69:
        return fail("range")
    canonical = f"{wilaya}/{office}-{number} {letter} {year}" if wilaya is not None else f"{year} {letter} {number}"
    return {
        "valid": True,
        "wilaya": wilaya,
        "office": office,
        "number": number,
        "letter": letter,
        "year": year,
        "canonical": canonical,
    }
