// Wilaya and commune names, checked against @syscli/algeria. A separate entry
// so that the rest of the package works without that dependency.
import { commune as communeByCode, search, wilaya as findWilaya, type Commune } from "@syscli/algeria";
import { asciiDigits } from "./normalize.js";
import { fail, type Invalid, type Result } from "./result.js";
import type { WilayaMap } from "./wilaya.js";

export type PlaceWilaya = {
  /** Two-digit code, "01" to "69". */
  code: string;
  nameFr: string;
  nameAr: string;
};

export type PlaceCommune = {
  /** Four-digit ONS code. */
  code: string;
  nameFr: string;
  nameAr: string;
  /** Wilaya code under the map asked for (69 by default). */
  wilaya: string;
};

export type CommuneOptions = {
  /** Only accept a commune of this wilaya, given by code or name. */
  wilaya?: string | number;
  /** Wilaya map to check against: 48, 58 or 69 (default). */
  map?: WilayaMap;
};

function wilayaUnder(c: Commune, map: WilayaMap): string {
  return map === 48 ? c.wilayaCode48 : map === 58 ? c.wilayaCode58 : c.wilayaCode;
}

function label(c: Commune, map: WilayaMap): string {
  const w = findWilaya(wilayaUnder(c, map));
  return w ? `${c.nameFr}, ${w.nameFr}` : c.nameFr;
}

/**
 * Validates a wilaya given by code or by name, in French or Arabic.
 *
 *   wilaya("bou saada")   // { valid: true, code: "68", ... }
 *   wilaya("68", 58)      // { valid: false, reason: "range" }
 */
export function wilaya(value: unknown, map: WilayaMap = 69): Result<PlaceWilaya> {
  if (typeof value !== "string" && typeof value !== "number") return fail("chars");
  if (String(value).trim() === "") return fail("empty");
  const w = findWilaya(value);
  if (!w) return fail("unknown");
  if (Number(w.code) > map) return fail("range");
  return { valid: true, code: w.code, nameFr: w.nameFr, nameAr: w.nameAr };
}

/**
 * Validates a commune given by ONS code or by name, in French or Arabic, old
 * official names included. A name shared by several communes is "ambiguous"
 * unless the wilaya is given. A misspelled name is not accepted; it comes back
 * as "unknown" with the closest names as suggestions.
 *
 *   commune("Bou Saada")                       // valid, wilaya "68"
 *   commune("El Marsa")                        // ambiguous, 3 suggestions
 *   commune("El Marsa", { wilaya: "Alger" })   // valid
 *   commune("Bou Saada", { map: 58 })          // valid, wilaya "28"
 */
export function commune(value: unknown, options: CommuneOptions = {}): Result<PlaceCommune> {
  const map = options.map ?? 69;
  if (typeof value !== "string" && typeof value !== "number") return fail("chars");
  const text = String(value).trim();
  if (text === "") return fail("empty");

  let only: string | undefined;
  if (options.wilaya !== undefined) {
    const w = wilaya(options.wilaya, map);
    if (!w.valid) return w;
    only = w.code;
  }
  const inWilaya = (c: Commune) => only === undefined || wilayaUnder(c, map) === only;
  const ok = (c: Commune): Result<PlaceCommune> => ({
    valid: true,
    code: c.code,
    nameFr: c.nameFr,
    nameAr: c.nameAr,
    wilaya: wilayaUnder(c, map),
  });

  const digits = asciiDigits(text);
  if (/^\d{1,4}$/.test(digits)) {
    const c = communeByCode(digits);
    return c && inWilaya(c) ? ok(c) : fail("unknown");
  }

  const found = search(text, { limit: 50 }).filter(r => inWilaya(r.commune));
  const exact = found.filter(r => r.score === 0).map(r => r.commune);
  if (exact.length === 1) return ok(exact[0]!);
  if (exact.length > 1) {
    return { valid: false, reason: "ambiguous", suggestions: exact.map(c => label(c, map)) };
  }
  const suggestions = found.slice(0, 3).map(r => label(r.commune, map));
  const out: Invalid = { valid: false, reason: "unknown" };
  if (suggestions.length) out.suggestions = suggestions;
  return out;
}
