import { digitsOf } from "./normalize.js";
import { fail, type Result } from "./result.js";

/** Bank code of Algerie Poste in a RIB. */
export const POSTE_BANK = "007";
/** Agency code used for every CCP account in a RIP. */
export const POSTE_AGENCY = "99999";

export type Ccp = {
  /** Account number without leading zeros, e.g. "200". */
  account: string;
  /** Two-digit CCP key, e.g. "12". */
  key: string;
};

export type Rib = {
  /** The 20 digits, without separators. */
  value: string;
  /** Three-digit bank code. "007" is Algerie Poste. */
  bank: string;
  /** Five-digit agency code. */
  agency: string;
  /** Ten-digit account number, zero padded. */
  account: string;
  /** Two-digit key. */
  key: string;
};

export type Rip = Rib & {
  /** The CCP account number inside the RIP, without leading zeros. */
  ccp: string;
};

function mod97(digits: string): number {
  let r = 0;
  for (const d of digits) r = (r * 10 + (d.charCodeAt(0) - 48)) % 97;
  return r;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Key of a CCP account: digits weighted 4, 5, 6 ... from the right, summed,
 * last two digits of the sum.
 */
export function ccpKey(account: string | number): string {
  const d = digitsOf(account);
  if (typeof d !== "string" || d.length > 10) {
    throw new TypeError(`not a CCP account number: ${String(account)}`);
  }
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    sum += (d.charCodeAt(d.length - 1 - i) - 48) * (i + 4);
  }
  return pad2(sum % 100);
}

/**
 * Key of a RIB or RIP: 97 minus the remainder of (agency, account, 00) by 97.
 * The bank code is not part of the computation.
 */
export function ribKey(agency: string, account: string): string {
  if (!/^\d{5}$/.test(agency) || !/^\d{10}$/.test(account)) {
    throw new TypeError("agency must be 5 digits and account 10 digits");
  }
  return pad2(97 - mod97(agency + account + "00"));
}

/**
 * Validates a CCP account number, and its key when one is given.
 *
 *   ccp("200", "12")  // { valid: true, account: "200", key: "12" }
 */
export function ccp(account: unknown, key?: unknown): Result<Ccp> {
  const d = digitsOf(account);
  if (typeof d !== "string") return d;
  if (d.length > 10) return fail("length");
  const n = d.replace(/^0+(?=\d)/, "");
  if (n === "0") return fail("range");
  const expected = ccpKey(n);
  if (key !== undefined) {
    const k = digitsOf(key);
    if (typeof k !== "string") return k;
    if (k.length > 2) return fail("length");
    if (k.padStart(2, "0") !== expected) return fail("key");
  }
  return { valid: true, account: n, key: expected };
}

/** Validates a 20-digit RIB from any Algerian bank or Algerie Poste. */
export function rib(value: unknown): Result<Rib> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length !== 20) return fail("length");
  const bank = d.slice(0, 3);
  const agency = d.slice(3, 8);
  const account = d.slice(8, 18);
  const key = d.slice(18);
  if (ribKey(agency, account) !== key) return fail("key");
  return { valid: true, value: d, bank, agency, account, key };
}

/** Validates a RIP, the RIB of a CCP account (007 99999 ...). */
export function rip(value: unknown): Result<Rip> {
  const d = digitsOf(value);
  if (typeof d !== "string") return d;
  if (d.length !== 20) return fail("length");
  if (!d.startsWith(POSTE_BANK + POSTE_AGENCY)) return fail("prefix");
  const r = rib(d);
  if (!r.valid) return r;
  return { ...r, ccp: r.account.replace(/^0+(?=\d)/, "") };
}

/** Builds the 20-digit RIP of a CCP account. */
export function ripOf(account: string | number): string {
  const c = ccp(account);
  if (!c.valid) throw new TypeError(`not a CCP account number: ${String(account)}`);
  const acc = c.account.padStart(10, "0");
  return POSTE_BANK + POSTE_AGENCY + acc + ribKey(POSTE_AGENCY, acc);
}

/** Groups a RIB or RIP for display: "007 99999 0000000200 91". */
export function formatRib(value: string): string {
  const d = digitsOf(value);
  if (typeof d !== "string" || d.length !== 20) {
    throw new TypeError(`not a 20-digit RIB: ${value}`);
  }
  return `${d.slice(0, 3)} ${d.slice(3, 8)} ${d.slice(8, 18)} ${d.slice(18)}`;
}
