import { describe, expect, it } from "vitest";
import { nif, nin, nis, postalCode, rc } from "../src/index.js";
import { arabic } from "./arabic.js";

// Values published by the organisations themselves or by registrars; see
// sources/README.md.

describe("postalCode", () => {
  it("reads post office codes from Algerie Poste", () => {
    expect(postalCode("16024")).toEqual({ valid: true, value: "16024", wilaya: "16", office: "024" });
    expect(postalCode("55002").valid).toBe(true); // Touggourt, re-coded in 2019 from 30002
    expect(postalCode("28001").valid).toBe(true); // Bou Saada, not yet re-coded for 2026
    expect(postalCode(arabic("31104")).valid).toBe(true);
  });

  it("rejects prefixes outside 01 to 58 and wrong lengths", () => {
    expect(postalCode("68001")).toEqual({ valid: false, reason: "range" });
    expect(postalCode("00123")).toEqual({ valid: false, reason: "range" });
    expect(postalCode("1600")).toEqual({ valid: false, reason: "length" });
  });
});

describe("nin", () => {
  it("checks 18 digits", () => {
    expect(nin("1".repeat(18))).toEqual({ valid: true, value: "111111111111111111" });
    expect(nin("1".repeat(17))).toEqual({ valid: false, reason: "length" });
  });
});

describe("nif", () => {
  it("reads a 15-digit NIF and a 20-digit establishment NIF", () => {
    // Algerie Telecom, from its published tender notices.
    expect(nif("000216001808337")).toEqual({
      valid: true,
      value: "000216001808337",
      base: "000216001808337",
      establishment: null,
    });
    expect(nif("00021600180833716001")).toMatchObject({ valid: true, base: "000216001808337", establishment: "16001" });
    expect(nif("0002160018083")).toEqual({ valid: false, reason: "length" });
  });
});

describe("nis", () => {
  it("checks 15 digits", () => {
    expect(nis("000216290656936").valid).toBe(true); // Algerie Telecom
    expect(nis("0002162906569")).toEqual({ valid: false, reason: "length" });
  });
});

describe("rc", () => {
  it("reads the wilaya-first layout", () => {
    expect(rc("16/00-0013767 B 00")).toEqual({
      valid: true,
      wilaya: "16",
      office: "00",
      number: "0013767",
      letter: "B",
      year: "00",
      canonical: "16/00-0013767 B 00",
    }); // Sonatrach
  });

  it("reads the year-first layouts", () => {
    expect(rc("01B 0015609-16/00")).toMatchObject({ valid: true, wilaya: "16", year: "01", canonical: "16/00-0015609 B 01" });
    expect(rc("02 B 0018083 - 16/00")).toMatchObject({ valid: true, number: "0018083", wilaya: "16" });
    expect(rc("22B1242074")).toMatchObject({ valid: true, wilaya: null, canonical: "22 B 1242074" });
    expect(rc("16/00 - 09722557 B 06")).toMatchObject({ valid: true, number: "09722557" });
  });

  it("rejects other layouts", () => {
    expect(rc("16/00-0013767 C 00")).toEqual({ valid: false, reason: "chars" });
    expect(rc("16-0013767")).toEqual({ valid: false, reason: "format" });
    expect(rc("70/00-0013767 B 00")).toEqual({ valid: false, reason: "range" });
    expect(rc(" ")).toEqual({ valid: false, reason: "empty" });
    expect(rc(16)).toEqual({ valid: false, reason: "chars" });
  });
});
