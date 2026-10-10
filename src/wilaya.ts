import { digitsOf } from "./normalize.js";
import { fail, type Result } from "./result.js";

/**
 * Number of wilayas under each map: 48 from loi 84-09 (1984), 58 from
 * loi 19-12 (2019), 69 from loi 26-06 (2026).
 */
export type WilayaMap = 48 | 58 | 69;

export type WilayaCode = {
  /** Two-digit code, "01" to "69". */
  code: string;
};

/**
 * Validates a wilaya code under a given map (69 by default). "1", "01" and
 * 1 all give "01".
 *
 * For names and communes, use the @syscli/algeria package.
 */
export function wilayaCode(value: unknown, map: WilayaMap = 69): Result<WilayaCode> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length > 2) return fail("length");
  const n = Number(d);
  if (n < 1 || n > map) return fail("range");
  return { valid: true, code: String(n).padStart(2, "0") };
}
