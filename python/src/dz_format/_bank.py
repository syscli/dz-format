"""CCP, RIP and RIB keys. See sources/README.md for how the rules were checked."""

from __future__ import annotations

from typing import Optional, Union

from ._core import Result, digits_of, fail

POSTE_BANK = "007"
"""Bank code of Algerie Poste in a RIB."""
POSTE_AGENCY = "99999"
"""Agency code used for every CCP account in a RIP."""


def _mod97(digits: str) -> int:
    r = 0
    for d in digits:
        r = (r * 10 + ord(d) - 48) % 97
    return r


def _strip_zeros(s: str) -> str:
    return s.lstrip("0") or "0"


def ccp_key(account: Union[str, int]) -> str:
    """Key of a CCP account: digits weighted 4, 5, 6 ... from the right,
    summed, last two digits of the sum."""
    d = digits_of(account)
    if not isinstance(d, str) or len(d) > 10:
        raise ValueError(f"not a CCP account number: {account}")
    total = sum((ord(c) - 48) * (i + 4) for i, c in enumerate(reversed(d)))
    return f"{total % 100:02d}"


def rib_key(agency: str, account: str) -> str:
    """Key of a RIB or RIP: 97 minus the remainder of (agency, account, 00)
    by 97. The bank code is not part of the computation."""
    if not (len(agency) == 5 and agency.isascii() and agency.isdigit()):
        raise ValueError("agency must be 5 digits")
    if not (len(account) == 10 and account.isascii() and account.isdigit()):
        raise ValueError("account must be 10 digits")
    return f"{97 - _mod97(agency + account + '00'):02d}"


def ccp(account: object, key: Optional[object] = None) -> Result:
    """Validates a CCP account number, and its key when one is given."""
    d = digits_of(account)
    if not isinstance(d, str):
        return d
    if len(d) > 10:
        return fail("length")
    n = _strip_zeros(d)
    if n == "0":
        return fail("range")
    expected = ccp_key(n)
    if key is not None:
        k = digits_of(key)
        if not isinstance(k, str):
            return k
        if len(k) > 2:
            return fail("length")
        if k.zfill(2) != expected:
            return fail("key")
    return {"valid": True, "account": n, "key": expected}


def rib(value: object) -> Result:
    """Validates a 20-digit RIB from any Algerian bank or Algerie Poste."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) != 20:
        return fail("length")
    bank, agency, account, key = d[:3], d[3:8], d[8:18], d[18:]
    if rib_key(agency, account) != key:
        return fail("key")
    return {"valid": True, "value": d, "bank": bank, "agency": agency, "account": account, "key": key}


def rip(value: object) -> Result:
    """Validates a RIP, the RIB of a CCP account (007 99999 ...)."""
    d = digits_of(value)
    if not isinstance(d, str):
        return d
    if len(d) != 20:
        return fail("length")
    if not d.startswith(POSTE_BANK + POSTE_AGENCY):
        return fail("prefix")
    r = rib(d)
    if not r["valid"]:
        return r
    return {**r, "ccp": _strip_zeros(r["account"])}


def rip_of(account: Union[str, int]) -> str:
    """Builds the 20-digit RIP of a CCP account."""
    c = ccp(account)
    if not c["valid"]:
        raise ValueError(f"not a CCP account number: {account}")
    acc = c["account"].zfill(10)
    return POSTE_BANK + POSTE_AGENCY + acc + rib_key(POSTE_AGENCY, acc)


def format_rib(value: str) -> str:
    """Groups a RIB or RIP for display: "007 99999 0000000200 91"."""
    d = digits_of(value)
    if not isinstance(d, str) or len(d) != 20:
        raise ValueError(f"not a 20-digit RIB: {value}")
    return f"{d[:3]} {d[3:8]} {d[8:18]} {d[18:]}"
