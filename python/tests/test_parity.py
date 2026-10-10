"""Checks that the Python port answers like the npm package, call by call.

tests/parity.json is written by scripts/parity.mjs from the built npm package;
CI writes it before running these tests. Without it, this test is skipped.
"""

import json
from collections import Counter
from datetime import date
from pathlib import Path

import pytest

import dz_format
from dz_format import place

FIXTURE = Path(__file__).with_name("parity.json")
DATA = json.loads(FIXTURE.read_text(encoding="utf-8")) if FIXTURE.exists() else None
TODAY = date(2026, 10, 10)


def call(fn, args):
    if fn == "plate":
        return dz_format.plate(args[0], TODAY)
    if fn == "commune":
        value, wilaya, map_ = (list(args) + [None, 69])[:3]
        return place.commune(value, wilaya=wilaya, map=map_ or 69)
    if fn == "wilaya":
        return place.wilaya(*args)
    return getattr(dz_format, fn)(*args)


@pytest.mark.skipif(DATA is None, reason="run scripts/parity.mjs first")
def test_same_answers_as_npm():
    wrong = []
    for fn, args, expected in DATA["cases"]:
        try:
            got = {"ok": call(fn, args)}
        except (ValueError, TypeError):
            got = {"error": True}
        if got != expected:
            wrong.append((fn, args, expected, got))
    by_fn = Counter(fn for fn, *_ in wrong)
    assert wrong == [], f"{len(wrong)} of {len(DATA['cases'])} differ: {dict(by_fn)}; first: {wrong[:3]}"
