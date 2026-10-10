import { asciiDigits, digitsOf } from "./normalize.js";
import { fail, type Result } from "./result.js";

// None of these identifiers has a published check key, so these functions
// check the layout only. See sources/README.md for what each rule rests on.

export type PostalCode = {
  /** The 5 digits. */
  value: string;
  /**
   * Wilaya prefix, under the 58-wilaya map: in October 2026 Algerie Poste had
   * not yet re-coded the offices of the wilayas created in 2026 (59 to 69).
   */
  wilaya: string;
  /** Last 3 digits, the post office within the wilaya. */
  office: string;
};

/** Postal code: 5 digits, the first 2 being the wilaya (01 to 58). */
export function postalCode(value: unknown): Result<PostalCode> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length !== 5) return fail("length");
  const w = Number(d.slice(0, 2));
  if (w < 1 || w > 58) return fail("range");
  return { valid: true, value: d, wilaya: d.slice(0, 2), office: d.slice(2) };
}

export type Nin = {
  /** The 18 digits. */
  value: string;
};

/**
 * NIN, the national identification number of decret executif 23-316: 18
 * digits. Its key is computed by the issuing system and is not published, so
 * only the length is checked.
 */
export function nin(value: unknown): Result<Nin> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length !== 18) return fail("length");
  return { valid: true, value: d };
}

export type Nif = {
  /** The 15 or 20 digits. */
  value: string;
  /** The 15-digit NIF of the taxpayer. */
  base: string;
  /** For a 20-digit NIF, the 5 digits of the secondary establishment. */
  establishment: string | null;
};

/** NIF, the tax identification number: 15 digits, or 20 for an establishment. */
export function nif(value: unknown): Result<Nif> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length !== 15 && d.length !== 20) return fail("length");
  return { valid: true, value: d, base: d.slice(0, 15), establishment: d.length === 20 ? d.slice(15) : null };
}

export type Nis = {
  /** The 15 digits. */
  value: string;
};

/** NIS, the statistical identification number of the ONS: 15 digits. */
export function nis(value: unknown): Result<Nis> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length !== 15) return fail("length");
  return { valid: true, value: d };
}

export type Rc = {
  /** Two-digit wilaya of the registry, when written. */
  wilaya: string | null;
  /** Two digits written after the wilaya, "00" in every example seen. */
  office: string | null;
  /** Sequence number, 7 or 8 digits. */
  number: string;
  /** Letter: B for companies; A is believed to be for individuals. */
  letter: "A" | "B";
  /** Two-digit year of registration, not of creation. */
  year: string;
  /** "16/00-0013767 B 00" when the wilaya is known, else "00 B 0013767". */
  canonical: string;
};

// The layouts seen on extracts, tenders and the GLEIF register:
//   16/00-0013767 B 00      wilaya/office-number letter year
//   01B 0015609-16/00       year letter number-wilaya/office
//   22B1242074              year letter number
const WILAYA_FIRST = /^(\d{2})\/(\d{2})-?(\d{7,8})([AB])(\d{2})$/;
const YEAR_FIRST = /^(\d{2})([AB])(\d{7,8})(?:-?(\d{2})\/(\d{2}))?$/;

/**
 * Number of the registre du commerce, in any of the written layouts above.
 * The CNRC has not published the format; this follows the layout seen on
 * published extracts, so treat a rejection as a hint, not a verdict.
 */
export function rc(value: unknown): Result<Rc> {
  if (typeof value !== "string") return fail("chars");
  const s = asciiDigits(value).toUpperCase().replace(/[\s\u00a0\u202f]/g, "").replace(/[\u2010-\u2015]/g, "-");
  if (s === "") return fail("empty");
  if (!/^[0-9AB/-]+$/.test(s)) return fail("chars");

  let wilaya: string | null = null;
  let office: string | null = null;
  let number: string;
  let letter: string;
  let year: string;
  let m = WILAYA_FIRST.exec(s);
  if (m) {
    [, wilaya, office, number, letter, year] = m as unknown as [string, string, string, string, string, string];
  } else if ((m = YEAR_FIRST.exec(s))) {
    [, year, letter, number] = m as unknown as [string, string, string, string];
    wilaya = m[4] ?? null;
    office = m[5] ?? null;
  } else {
    return fail("format");
  }
  if (wilaya !== null && (Number(wilaya) < 1 || Number(wilaya) > 69)) return fail("range");
  const canonical = wilaya !== null ? `${wilaya}/${office}-${number} ${letter} ${year}` : `${year} ${letter} ${number}`;
  return { valid: true, wilaya, office, number, letter: letter as "A" | "B", year, canonical };
}
