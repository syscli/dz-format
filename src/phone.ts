import { asciiDigits, digitsOf } from "./normalize.js";
import { fail, type Result } from "./result.js";

export type PhoneType = "mobile" | "landline" | "voip";

export type Phone = {
  /** E.164 form, e.g. "+213661234567". */
  value: string;
  /** National form with the trunk 0, e.g. "0661234567". */
  national: string;
  type: PhoneType;
  /**
   * For mobiles, the operator the range was allocated to. A number can move
   * between operators, so this is a hint, not a guarantee.
   */
  operator?: "Ooredoo" | "Mobilis" | "Djezzy";
  /** For landlines, the two-digit area code, e.g. "21". */
  area?: string;
};

const OPERATORS = { "5": "Ooredoo", "6": "Mobilis", "7": "Djezzy" } as const;

/**
 * Validates an Algerian phone number written in national form (0661 23 45 67)
 * or international form (+213 661 23 45 67, 00213 ...).
 *
 * Mobiles and VoIP numbers have 9 digits after the trunk 0, landlines 8.
 */
export function phone(value: unknown): Result<Phone> {
  const plus = typeof value === "string" && asciiDigits(value).trim().startsWith("+");
  const d = digitsOf(typeof value === "string" ? value.replace("+", "") : value);
  if (typeof d !== "string") return d;

  let nsn: string;
  if (plus || d.startsWith("00213")) {
    const rest = plus ? d : d.slice(2);
    if (!rest.startsWith("213")) return fail("prefix");
    nsn = rest.slice(3);
    // "+213 0661 ..." is a common mistake; the trunk 0 is dropped abroad.
    if (nsn.startsWith("0")) nsn = nsn.slice(1);
  } else if (d.startsWith("213") && (d.length === 11 || d.length === 12)) {
    nsn = d.slice(3);
  } else if (d.startsWith("0")) {
    nsn = d.slice(1);
  } else {
    return fail("prefix");
  }

  const first = nsn[0];
  let parsed: Phone;
  if (first === "5" || first === "6" || first === "7") {
    if (nsn.length !== 9) return fail("length");
    parsed = { value: "", national: "", type: "mobile", operator: OPERATORS[first] };
  } else if (first === "9") {
    if (nsn.length !== 9) return fail("length");
    parsed = { value: "", national: "", type: "voip" };
  } else if (first === "2" || first === "3" || first === "4") {
    if (nsn.length !== 8) return fail("length");
    parsed = { value: "", national: "", type: "landline", area: nsn.slice(0, 2) };
  } else {
    return fail("prefix");
  }
  parsed.value = "+213" + nsn;
  parsed.national = "0" + nsn;
  return { valid: true, ...parsed };
}

/**
 * Formats a valid number for display.
 *
 *   formatPhone("+213661234567")                  // "0661 23 45 67"
 *   formatPhone("0661234567", "international")    // "+213 661 23 45 67"
 */
export function formatPhone(value: string, style: "national" | "international" = "national"): string {
  const p = phone(value);
  if (!p.valid) throw new TypeError(`not an Algerian phone number: ${value}`);
  const nsn = p.national.slice(1);
  const head = p.type === "landline" ? nsn.slice(0, 2) : nsn.slice(0, 3);
  const tail = nsn.slice(head.length).match(/\d\d/g)!.join(" ");
  return style === "international" ? `+213 ${head} ${tail}` : `0${head} ${tail}`;
}
