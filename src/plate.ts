import { digitsOf } from "./normalize.js";
import { fail, type Result } from "./result.js";

export type PlateCategory =
  | "tourisme"
  | "camion"
  | "camionnette"
  | "autocar"
  | "tracteur-routier"
  | "tracteur"
  | "special"
  | "remorque"
  | "moto";

export type Plate = {
  /** Digits without separators, e.g. "1234511616". */
  value: string;
  /** Order number within the wilaya, category and year. */
  serial: string;
  /** Category digit, "1" to "9". */
  category: string;
  categoryName: PlateCategory;
  /** Two digits as printed. "33" means the year is not known. */
  yearCode: string;
  /** Year the vehicle was first put on the road, or null when unknown. */
  year: number | null;
  /** Two-digit wilaya code, "01" to "69". */
  wilaya: string;
};

// arrete of 5 May 1988, as amended by the arrete of 4 December 2022.
const CATEGORIES: Record<string, PlateCategory> = {
  "1": "tourisme",
  "2": "camion",
  "3": "camionnette",
  "4": "autocar",
  "5": "tracteur-routier",
  "6": "tracteur",
  "7": "special",
  "8": "remorque",
  "9": "moto",
};

// Codes 59 to 69 were added by the arrete published on 17 June 2026, in force
// from 1 January 2027.
const MAX_WILAYA = 69;

/** Printed in place of the year when it is not known. */
export const UNKNOWN_YEAR = "33";

/**
 * Validates a plate of the normal series, written as
 * serial, category and year, wilaya: "12345 116 16", "12345-116-16".
 *
 * Temporary (W, WW) and public works series are not covered.
 */
export function plate(value: unknown, today: Date = new Date()): Result<Plate> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  // At least one serial digit; serials run to six digits in large wilayas.
  if (d.length < 6 || d.length > 11) return fail("length");

  const wilaya = d.slice(-2);
  const yearCode = d.slice(-4, -2);
  const category = d.slice(-5, -4);
  const serial = d.slice(0, -5);

  const w = Number(wilaya);
  if (w < 1 || w > MAX_WILAYA) return fail("range");
  const categoryName = CATEGORIES[category];
  if (!categoryName) return fail("range");
  if (/^0+$/.test(serial)) return fail("range");

  let year: number | null = null;
  if (yearCode !== UNKNOWN_YEAR) {
    const yy = Number(yearCode);
    const now = today.getFullYear();
    year = 2000 + yy > now ? 1900 + yy : 2000 + yy;
  }
  return { valid: true, value: d, serial, category, categoryName, yearCode, year, wilaya };
}

/** Formats a valid plate the way it is printed: "12345 116 16". */
export function formatPlate(value: string): string {
  const p = plate(value);
  if (!p.valid) throw new TypeError(`not an Algerian plate: ${value}`);
  return `${p.serial} ${p.category}${p.yearCode} ${p.wilaya}`;
}
