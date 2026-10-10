import { describe, expect, it } from "vitest";
import { formatPhone, phone } from "../src/index.js";
import { arabic } from "./arabic.js";

describe("phone", () => {
  it("reads a mobile in every common spelling", () => {
    for (const s of [
      "0661234567",
      "0661 23 45 67",
      "06.61.23.45.67",
      "+213 661 23 45 67",
      "+213661234567",
      "00213661234567",
      "213661234567",
      "+213 (0) 661 23 45 67",
      arabic("0661234567"),
      arabic("0661 23 45 67", 0x06f0),
    ]) {
      expect(phone(s), s).toEqual({
        valid: true,
        value: "+213661234567",
        national: "0661234567",
        type: "mobile",
        operator: "Mobilis",
      });
    }
  });

  it("names the operator of each mobile range", () => {
    const op = (s: string) => {
      const p = phone(s);
      return p.valid ? p.operator : undefined;
    };
    expect(op("0551234567")).toBe("Ooredoo");
    expect(op("0661234567")).toBe("Mobilis");
    expect(op("0771234567")).toBe("Djezzy");
  });

  it("reads landlines with their area code", () => {
    const p = phone("021 23 45 67");
    expect(p).toEqual({
      valid: true,
      value: "+21321234567",
      national: "021234567",
      type: "landline",
      area: "21",
    });
  });

  it("reads VoIP numbers", () => {
    const p = phone("0961234567");
    expect(p.valid && p.type).toBe("voip");
  });

  it("rejects wrong lengths and prefixes", () => {
    expect(phone("066123456")).toEqual({ valid: false, reason: "length" });
    expect(phone("02123456")).toEqual({ valid: false, reason: "length" });
    expect(phone("0161234567")).toEqual({ valid: false, reason: "prefix" });
    expect(phone("661234567")).toEqual({ valid: false, reason: "prefix" });
    expect(phone("+33612345678")).toEqual({ valid: false, reason: "prefix" });
    expect(phone("06 61 ab")).toEqual({ valid: false, reason: "chars" });
  });
});

describe("formatPhone", () => {
  it("formats nationally and internationally", () => {
    expect(formatPhone("+213661234567")).toBe("0661 23 45 67");
    expect(formatPhone("0661234567", "international")).toBe("+213 661 23 45 67");
    expect(formatPhone("021234567")).toBe("021 23 45 67");
    expect(formatPhone("021234567", "international")).toBe("+213 21 23 45 67");
  });

  it("throws on an invalid number", () => {
    expect(() => formatPhone("123")).toThrow();
  });
});
