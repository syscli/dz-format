import { fail, type Invalid } from "./result.js";

// Arabic-Indic (U+0660..U+0669) and Extended Arabic-Indic (U+06F0..U+06F9)
// digits, both of which turn up in forms filled on Arabic keyboards.
const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

// Spaces (including no-break and narrow no-break), dashes, dots, slashes,
// underscores and parentheses. These never carry meaning in the formats here.
const SEPARATORS = /[\s\u00A0\u202F\-\u2010-\u2015./_()]/g;

/** Converts Arabic-Indic digits to ASCII digits. */
export function asciiDigits(value: string): string {
  return value.replace(ARABIC_DIGITS, ch => {
    const code = ch.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * Strips separators and converts Arabic-Indic digits. Returns the digits, or
 * the reason the value cannot be read as a run of digits.
 */
export function digitsOf(value: unknown): string | Invalid {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    value = String(value);
  }
  if (typeof value !== "string") return fail("chars");
  const s = asciiDigits(value).replace(SEPARATORS, "");
  if (s === "") return fail("empty");
  if (!/^\d+$/.test(s)) return fail("chars");
  return s;
}
