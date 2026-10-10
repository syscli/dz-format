from datetime import date

import pytest

from dz_format import (
    ccp,
    ccp_key,
    format_phone,
    format_rib,
    nif,
    phone,
    plate,
    postal_code,
    rc,
    rib,
    rip,
    rip_of,
    wilaya_code,
)
from dz_format.place import commune, wilaya

# Accounts published by public bodies for donations; see sources/README.md.
PUBLISHED_RIBS = [
    "00799999000000020091",
    "00200112112300000146",
    "00200112112300000243",
    "00200112112300000340",
    "00100627030030018036",
]


def test_published_ribs():
    for r in PUBLISHED_RIBS:
        assert rib(r)["valid"], r
    assert rib("00200112112300000147") == {"valid": False, "reason": "key"}


def test_rip_and_ccp():
    assert rip("007 99999 0000000200 91")["ccp"] == "200"
    assert rip_of("200") == "00799999000000020091"
    assert ccp_key("200") == "12"
    assert ccp("200", "12") == {"valid": True, "account": "200", "key": "12"}
    assert ccp("17756415", "76") == {"valid": False, "reason": "key"}
    assert format_rib("00799999000000020091") == "007 99999 0000000200 91"
    with pytest.raises(ValueError):
        rip_of("12345678901")


def test_phone():
    p = phone("+213 661 23 45 67")
    assert p == {"valid": True, "value": "+213661234567", "national": "0661234567", "type": "mobile", "operator": "Mobilis"}
    assert phone("\u0660\u0666\u0666\u0661\u0662\u0663\u0664\u0665\u0666\u0667")["valid"]
    assert phone("021 23 45 67")["area"] == "21"
    assert phone("066123456") == {"valid": False, "reason": "length"}
    assert format_phone("0661234567", "international") == "+213 661 23 45 67"


def test_plate_and_wilaya_code():
    p = plate("12345 116 16", date(2026, 10, 10))
    assert (p["category_name"], p["year"], p["wilaya"]) == ("tourisme", 2016, "16")
    assert plate("00012 933 16")["year"] is None
    assert plate("12345 116 70") == {"valid": False, "reason": "range"}
    assert wilaya_code("1") == {"valid": True, "code": "01"}
    assert wilaya_code("59", 58) == {"valid": False, "reason": "range"}


def test_ids():
    assert postal_code("16024") == {"valid": True, "value": "16024", "wilaya": "16", "office": "024"}
    assert postal_code("68001") == {"valid": False, "reason": "range"}
    assert nif("00021600180833716001")["establishment"] == "16001"
    assert rc("01B 0015609-16/00")["canonical"] == "16/00-0015609 B 01"
    assert rc("16-0013767") == {"valid": False, "reason": "format"}


def test_place():
    assert commune("Bou Saada")["wilaya"] == "68"
    assert commune("Bou Saada", map=58)["wilaya"] == "28"
    r = commune("El Marsa")
    assert r["reason"] == "ambiguous"
    assert len(r["suggestions"]) == 3
    assert commune("El Marsa", wilaya="Alger")["code"] == "1640"
    assert commune("Tlemsen")["suggestions"][0].startswith("Tlemcen")
    assert wilaya("bou saada")["code"] == "68"
    assert wilaya("68", 58) == {"valid": False, "reason": "range"}
