import { describe, expect, it } from "vitest";
import { formatPlate, plate, wilayaCode } from "../src/index.js";

const TODAY = new Date("2026-10-10");

describe("plate", () => {
  it("splits serial, category, year and wilaya", () => {
    expect(plate("12345 116 16", TODAY)).toEqual({
      valid: true,
      value: "1234511616",
      serial: "12345",
      category: "1",
      categoryName: "tourisme",
      yearCode: "16",
      year: 2016,
      wilaya: "16",
    });
  });

  it("accepts dashes, no separators and six-digit serials", () => {
    expect(plate("12345-116-16", TODAY).valid).toBe(true);
    expect(plate("1234511616", TODAY).valid).toBe(true);
    const p = plate("123456 299 31", TODAY);
    expect(p.valid && [p.serial, p.categoryName, p.year]).toEqual(["123456", "camion", 1999]);
  });

  it("knows the 2026 wilaya codes", () => {
    const p = plate("00012 125 68", TODAY);
    expect(p.valid && p.wilaya).toBe("68");
    expect(plate("00012 125 70", TODAY)).toEqual({ valid: false, reason: "range" });
    expect(plate("00012 125 00", TODAY)).toEqual({ valid: false, reason: "range" });
  });

  it("treats 33 as an unknown year", () => {
    const p = plate("00012 933 16", TODAY);
    expect(p.valid && [p.categoryName, p.year]).toEqual(["moto", null]);
  });

  it("rejects category 0, an empty serial and wrong lengths", () => {
    expect(plate("12345 016 16", TODAY)).toEqual({ valid: false, reason: "range" });
    expect(plate("00000 116 16", TODAY)).toEqual({ valid: false, reason: "range" });
    expect(plate("11616", TODAY)).toEqual({ valid: false, reason: "length" });
    expect(plate("1234567 116 16", TODAY)).toEqual({ valid: false, reason: "length" });
  });

  it("formats the way it is printed", () => {
    expect(formatPlate("1234511616")).toBe("12345 116 16");
  });
});

describe("wilayaCode", () => {
  it("pads and checks the range of each map", () => {
    expect(wilayaCode("1")).toEqual({ valid: true, code: "01" });
    expect(wilayaCode(69)).toEqual({ valid: true, code: "69" });
    expect(wilayaCode("59", 58)).toEqual({ valid: false, reason: "range" });
    expect(wilayaCode("49", 48)).toEqual({ valid: false, reason: "range" });
    expect(wilayaCode("00")).toEqual({ valid: false, reason: "range" });
    expect(wilayaCode("016")).toEqual({ valid: false, reason: "length" });
  });
});
