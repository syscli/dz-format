import { describe, expect, it } from "vitest";
import { ccp, ccpKey, formatRib, rib, ribKey, rip, ripOf } from "../src/index.js";
import { arabic } from "./arabic.js";

// Accounts published by public bodies for donations, with the key printed by
// the bank. See sources/README.md.
const PUBLISHED_RIBS = [
  "00799999000000020091", // Algerie Poste, COVID-19 solidarity fund
  "00200112112300000146", // BEA, COVID-19 fund, EUR account
  "00200112112300000243", // BEA, COVID-19 fund, USD account
  "00200112112300000340", // BEA, COVID-19 fund, GBP account
  "00100627030030018036", // BNA, CDER
];

describe("ribKey", () => {
  it("matches every published RIB", () => {
    for (const r of PUBLISHED_RIBS) {
      expect(ribKey(r.slice(3, 8), r.slice(8, 18))).toBe(r.slice(18));
    }
  });

  it("leaves the bank code out of the key", () => {
    // Same agency and account under two bank codes give the same key.
    expect(rib("00100627030030018036").valid).toBe(true);
    expect(rib("00400627030030018036").valid).toBe(true);
  });

  it("gives 97 rather than 00 when the remainder is zero", () => {
    let account = 0;
    while (ribKey("00001", String(account).padStart(10, "0")) !== "97") account++;
    expect(rib(`00100001${String(account).padStart(10, "0")}97`).valid).toBe(true);
  });
});

describe("rib", () => {
  it("accepts published RIBs with any spacing", () => {
    for (const r of PUBLISHED_RIBS) expect(rib(r).valid).toBe(true);
    expect(rib("002 00112 1123000001 46")).toEqual({
      valid: true,
      value: "00200112112300000146",
      bank: "002",
      agency: "00112",
      account: "1123000001",
      key: "46",
    });
  });

  it("rejects a wrong key, a wrong length and stray letters", () => {
    expect(rib("00200112112300000147")).toEqual({ valid: false, reason: "key" });
    expect(rib("0020011211230000014")).toEqual({ valid: false, reason: "length" });
    expect(rib("002 00112 112300000A 46")).toEqual({ valid: false, reason: "chars" });
    expect(rib("   ")).toEqual({ valid: false, reason: "empty" });
    expect(rib(null)).toEqual({ valid: false, reason: "chars" });
  });

  it("reads Arabic-Indic digits", () => {
    expect(rib(arabic("007 99999 0000000200 91")).valid).toBe(true);
    expect(rib(arabic("007 99999 0000000200 91", 0x06f0)).valid).toBe(true);
  });
});

describe("rip", () => {
  it("parses the CCP account out of a RIP", () => {
    const r = rip("007 99999 0000000200 91");
    expect(r.valid && r.ccp).toBe("200");
  });

  it("rejects a bank RIB", () => {
    expect(rip("00200112112300000146")).toEqual({ valid: false, reason: "prefix" });
  });

  it("is built from a CCP account", () => {
    expect(ripOf("200")).toBe("00799999000000020091");
    expect(ripOf(200)).toBe("00799999000000020091");
    expect(() => ripOf("12345678901")).toThrow();
  });
});

describe("ccp", () => {
  it("computes the key Algerie Poste prints", () => {
    // CCP 200, key 12, published by Algerie Poste with the RIP above.
    expect(ccpKey("200")).toBe("12");
    expect(ccp("200", "12")).toEqual({ valid: true, account: "200", key: "12" });
  });

  it("follows the weighted sum on longer accounts", () => {
    // 1*11 + 7*10 + 7*9 + 5*8 + 6*7 + 4*6 + 1*5 + 5*4 = 275
    expect(ccpKey("17756415")).toBe("75");
    // 9*10 + 5*9 + 3*8 + 6*7 + 5*6 + 0*5 + 3*4 = 243
    expect(ccpKey("9536503")).toBe("43");
  });

  it("checks the key when given and ignores leading zeros", () => {
    expect(ccp("0017756415", "75").valid).toBe(true);
    expect(ccp("17756415", "76")).toEqual({ valid: false, reason: "key" });
    expect(ccp("0")).toEqual({ valid: false, reason: "range" });
    expect(ccp("12345678901")).toEqual({ valid: false, reason: "length" });
  });
});

describe("formatRib", () => {
  it("groups bank, agency, account and key", () => {
    expect(formatRib("00799999000000020091")).toBe("007 99999 0000000200 91");
  });
});
