"""Wilaya and commune names, checked against syscli-algeria.

Install with the extra: pip install "dz-format[place]". The rest of the
package works without it.
"""

from __future__ import annotations

from typing import Union

try:
    from syscli_algeria import Commune, search
    from syscli_algeria import commune as _commune_by_code
    from syscli_algeria import wilaya as _find_wilaya
except ImportError as e:  # pragma: no cover
    raise ImportError('dz_format.place needs syscli-algeria: pip install "dz-format[place]"') from e

from ._core import Result, ascii_digits, fail

__all__ = ["commune", "wilaya"]


def _under(c: Commune, map: int) -> str:
    return c.wilaya_code_48 if map == 48 else c.wilaya_code_58 if map == 58 else c.wilaya_code


def _label(c: Commune, map: int) -> str:
    w = _find_wilaya(_under(c, map))
    return f"{c.name_fr}, {w.name_fr}" if w else c.name_fr


def wilaya(value: object, map: int = 69) -> Result:
    """Validates a wilaya given by code or by name, in French or Arabic."""
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        return fail("chars")
    if str(value).strip() == "":
        return fail("empty")
    w = _find_wilaya(value)
    if w is None:
        return fail("unknown")
    if int(w.code) > map:
        return fail("range")
    return {"valid": True, "code": w.code, "name_fr": w.name_fr, "name_ar": w.name_ar}


_check_wilaya = wilaya


def commune(value: object, wilaya: Union[str, int, None] = None, map: int = 69) -> Result:
    """Validates a commune given by ONS code or by name, in French or Arabic,
    old official names included.

    A name shared by several communes is "ambiguous" unless the wilaya is
    given. A misspelled name is not accepted; it comes back as "unknown" with
    the closest names as suggestions.
    """
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        return fail("chars")
    text = str(value).strip()
    if text == "":
        return fail("empty")

    only = None
    if wilaya is not None:
        w = _check_wilaya(wilaya, map)
        if not w["valid"]:
            return w
        only = w["code"]

    def ok(c: Commune) -> Result:
        return {"valid": True, "code": c.code, "name_fr": c.name_fr, "name_ar": c.name_ar, "wilaya": _under(c, map)}

    def inside(c: Commune) -> bool:
        return only is None or _under(c, map) == only

    digits = ascii_digits(text)
    if digits.isascii() and digits.isdigit() and len(digits) <= 4:
        c = _commune_by_code(digits)
        return ok(c) if c and inside(c) else fail("unknown")

    found = [r for r in search(text, limit=50) if inside(r.commune)]
    exact = [r.commune for r in found if r.score == 0]
    if len(exact) == 1:
        return ok(exact[0])
    if len(exact) > 1:
        return fail("ambiguous", [_label(c, map) for c in exact])
    return fail("unknown", [_label(r.commune, map) for r in found[:3]])
