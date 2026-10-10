"""Validate and parse Algerian formats.

The Python twin of the npm package @syscli/dz-format: the same rules and the
same answers. Every function returns a dict: {"valid": True, ...parts} or
{"valid": False, "reason": ...}.

    >>> from dz_format import phone, rip_of
    >>> phone("0661 23 45 67")["operator"]
    'Mobilis'
    >>> rip_of("200")
    '00799999000000020091'

Wilaya and commune names are in dz_format.place, which needs the "place"
extra.
"""

from ._bank import POSTE_AGENCY, POSTE_BANK, ccp, ccp_key, format_rib, rib, rib_key, rip, rip_of
from ._core import Result, ascii_digits
from ._ids import nif, nin, nis, postal_code, rc
from ._phone import format_phone, phone
from ._plate import UNKNOWN_YEAR, format_plate, plate, wilaya_code

__all__ = [
    "POSTE_AGENCY",
    "POSTE_BANK",
    "UNKNOWN_YEAR",
    "Result",
    "ascii_digits",
    "ccp",
    "ccp_key",
    "format_phone",
    "format_plate",
    "format_rib",
    "nif",
    "nin",
    "nis",
    "phone",
    "plate",
    "postal_code",
    "rc",
    "rib",
    "rib_key",
    "rip",
    "rip_of",
    "wilaya_code",
]

__version__ = "0.1.0"
