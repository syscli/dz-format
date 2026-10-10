import { describe, expect, it } from "vitest";
import { commune, wilaya } from "../src/place.js";
import { arabic } from "./arabic.js";

describe("wilaya", () => {
  it("accepts a code or a name in French or Arabic", () => {
    expect(wilaya("16")).toMatchObject({ valid: true, code: "16", nameFr: "Alger" });
    expect(wilaya(5)).toMatchObject({ valid: true, code: "05" });
    expect(wilaya("bou saada")).toMatchObject({ valid: true, code: "68" });
    const ar = wilaya("16");
    expect(ar.valid && wilaya(ar.nameAr)).toMatchObject({ valid: true, code: "16" });
  });

  it("checks the code against the map", () => {
    expect(wilaya("68", 58)).toEqual({ valid: false, reason: "range" });
    expect(wilaya("Bou Saada", 58)).toEqual({ valid: false, reason: "range" });
    expect(wilaya("58", 58).valid).toBe(true);
  });

  it("rejects unknown and empty values", () => {
    expect(wilaya("Paris")).toEqual({ valid: false, reason: "unknown" });
    expect(wilaya("70")).toEqual({ valid: false, reason: "unknown" });
    expect(wilaya(" ")).toEqual({ valid: false, reason: "empty" });
    expect(wilaya(null)).toEqual({ valid: false, reason: "chars" });
  });
});

describe("commune", () => {
  it("accepts a name, an old official name or an ONS code", () => {
    expect(commune("Bou Saada")).toEqual({
      valid: true,
      code: "2820",
      nameFr: "Bou Saada",
      nameAr: expect.any(String),
      wilaya: "68",
    });
    expect(commune("Bains Romains")).toMatchObject({ valid: true, nameFr: "Hammamet" });
    expect(commune("1601")).toMatchObject({ valid: true, code: "1601", wilaya: "16" });
  });

  it("accepts the Arabic name", () => {
    const c = commune("2820");
    expect(c.valid && commune(c.nameAr)).toMatchObject({ valid: true, code: "2820" });
  });

  it("asks for the wilaya when a name is shared", () => {
    const r = commune("El Marsa");
    expect(r.valid).toBe(false);
    expect(!r.valid && r.reason).toBe("ambiguous");
    expect(!r.valid && r.suggestions?.length).toBe(3);
    expect(commune("El Marsa", { wilaya: "Alger" })).toMatchObject({ valid: true, wilaya: "16" });
    expect(commune("El Marsa", { wilaya: 16 })).toMatchObject({ valid: true, code: "1640" });
  });

  it("checks that the commune is in the given wilaya", () => {
    expect(commune("Bou Saada", { wilaya: "68" }).valid).toBe(true);
    expect(commune("Bou Saada", { wilaya: "28" })).toMatchObject({ valid: false, reason: "unknown" });
    expect(commune("2820", { wilaya: "28" })).toEqual({ valid: false, reason: "unknown" });
    expect(commune("Bou Saada", { wilaya: "99" })).toEqual({ valid: false, reason: "unknown" });
  });

  it("follows the older maps", () => {
    expect(commune("Bou Saada", { map: 58 })).toMatchObject({ valid: true, wilaya: "28" });
    expect(commune("Bou Saada", { map: 58, wilaya: "M'Sila" }).valid).toBe(true);
  });

  it("suggests names for a misspelling instead of accepting it", () => {
    const r = commune("Tlemsen");
    expect(r.valid).toBe(false);
    expect(!r.valid && r.reason).toBe("unknown");
    expect(!r.valid && r.suggestions?.[0]).toMatch(/^Tlemcen/);
    // A usual transliteration is a spelling, not a typo.
    expect(commune("tamanghaset")).toMatchObject({ valid: true, nameFr: "Tamenghasset" });
    expect(commune("Atlantis")).toEqual({ valid: false, reason: "unknown" });
  });

  it("reads codes written in Arabic-Indic digits", () => {
    expect(commune(arabic("1601"))).toMatchObject({ valid: true, code: "1601" });
  });
});
