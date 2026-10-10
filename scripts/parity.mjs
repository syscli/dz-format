// Writes python/tests/parity.json: what the npm package answers for a few
// thousand inputs, so the Python port can be compared call by call.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dz from "../dist/index.js";
import * as place from "../dist/place.js";
import { communes } from "@syscli/algeria";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = new Date("2026-10-10");

// Deterministic random numbers, so the fixture is the same on every run.
let seed = 20261010;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = n => Math.floor(rand() * n);
const digits = n => Array.from({ length: n }, () => int(10)).join("");

// camelCase keys of the npm package become snake_case in Python.
const snake = k => k.replace(/[A-Z]/g, c => "_" + c.toLowerCase());
function py(value) {
  if (Array.isArray(value)) return value.map(py);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [snake(k), py(v)]));
  return value;
}

const cases = [];
function add(fn, args, run) {
  let expected;
  try {
    expected = { ok: py(run()) };
  } catch {
    expected = { error: true };
  }
  cases.push([fn, args, expected]);
}

const noise = ["", "   ", "abc", "12a4", "+", "-", "\u0660\u0666\u0666\u0661\u0662\u0663\u0664\u0665\u0666\u0667", "\u06f0\u06f6\u06f6\u06f1 \u06f2\u06f3 \u06f4\u06f5 \u06f6\u06f7", "00 213 661 23 45 67"];

// RIB and RIP: published accounts, random ones with right and wrong keys.
const ribs = ["00799999000000020091", "00200112112300000146", "00100627030030018036", "002 00112 1123000001 47", "0079999900000002009"];
for (let i = 0; i < 300; i++) {
  const bank = i % 3 ? digits(3) : "007";
  const agency = i % 3 ? digits(5) : "99999";
  const account = digits(10);
  const key = dz.ribKey(agency, account);
  const wrong = String((Number(key) + 1 + int(90)) % 100).padStart(2, "0");
  ribs.push(bank + agency + account + key, `${bank} ${agency} ${account} ${wrong}`);
}
for (const v of [...ribs, ...noise]) {
  add("rib", [v], () => dz.rib(v));
  add("rip", [v], () => dz.rip(v));
}

// CCP: accounts of every length, with and without keys.
for (let i = 0; i < 300; i++) {
  const account = digits(1 + int(11));
  add("ccp_key", [account], () => dz.ccpKey(account));
  add("ccp", [account], () => dz.ccp(account));
  const key = i % 2 ? digits(2) : (() => { try { return dz.ccpKey(account); } catch { return "00"; } })();
  add("ccp", [account, key], () => dz.ccp(account, key));
  add("rip_of", [account], () => dz.ripOf(account));
}
for (const v of ["0", "000", "200", ...noise]) add("ccp", [v], () => dz.ccp(v));

// Phones: every prefix style, first digit and length.
const phones = [...noise, "+213 (0) 661 23 45 67", "+33612345678", "213661234567", "21321234567", "0661234567"];
for (const prefix of ["0", "+213", "+213 0", "00213", "213", ""]) {
  for (let first = 0; first <= 9; first++) {
    for (const len of [7, 8, 9, 10]) phones.push(prefix + first + digits(len - 1));
  }
}
for (const v of phones) {
  add("phone", [v], () => dz.phone(v));
  add("format_phone", [v], () => dz.formatPhone(v));
  add("format_phone", [v, "international"], () => dz.formatPhone(v, "international"));
}

// Plates: random digit runs of every length around the valid ones.
const plates = [...noise, "12345 116 16", "00000 116 16", "12345 016 16", "12345 933 16", "12345 116 70"];
for (let i = 0; i < 300; i++) plates.push(digits(4 + int(9)));
for (const v of plates) {
  add("plate", [v], () => dz.plate(v, TODAY));
  add("format_plate", [v], () => dz.formatPlate(v));
}

// Wilaya codes under each map.
for (let n = 0; n <= 75; n++) {
  for (const map of [48, 58, 69]) add("wilaya_code", [String(n), map], () => dz.wilayaCode(String(n), map));
}
for (const v of ["016", "1", ...noise]) add("wilaya_code", [v, 69], () => dz.wilayaCode(v, 69));

// Postal codes, NIN, NIF, NIS.
for (let i = 0; i < 150; i++) {
  const v = digits(3 + int(20));
  add("postal_code", [v], () => dz.postalCode(v));
  add("nin", [v], () => dz.nin(v));
  add("nif", [v], () => dz.nif(v));
  add("nis", [v], () => dz.nis(v));
}
for (const v of ["16024", "68001", "00123", ...noise]) add("postal_code", [v], () => dz.postalCode(v));

// RC in its written layouts, and broken ones.
const rcs = [
  "16/00-0013767 B 00", "01B 0015609-16/00", "02 B 0018083 - 16/00", "22B1242074", "16/00 - 09722557 B 06",
  "16/00-0013767 A 00", "16/00-0013767 C 00", "70/00-0013767 B 00", "00/00-0013767 B 00", "16-0013767", "16/00-001376 B 00",
  "16/00\u20130013767 b 00", ...noise,
];
for (const v of rcs) add("rc", [v], () => dz.rc(v));

// Places: names, Arabic names, misspellings, shared names, older maps.
const sample = communes().filter((_, i) => i % 15 === 0);
const names = ["El Marsa", "Bains Romains", "Tlemsen", "tamanghaset", "Atlantis", "1601", "2820", "9999", "\u0662\u0668\u0662\u0660", ...noise];
for (const c of sample) names.push(c.nameFr, c.nameAr, c.nameFr.slice(0, -1) + "x", c.code);
for (const v of names) {
  add("commune", [v], () => place.commune(v));
  add("commune", [v, null, 58], () => place.commune(v, { map: 58 }));
}
for (const [v, w] of [["El Marsa", "Alger"], ["El Marsa", "16"], ["Bou Saada", "28"], ["Bou Saada", "99"], ["2820", "68"]]) {
  add("commune", [v, w], () => place.commune(v, { wilaya: w }));
}
for (const v of ["16", "5", "Setif", "bou saada", "Paris", "70", "68", ...noise]) {
  for (const map of [48, 58, 69]) add("wilaya", [v, map], () => place.wilaya(v, map));
}

const file = path.join(root, "python", "tests", "parity.json");
fs.writeFileSync(file, JSON.stringify({ today: "2026-10-10", cases }));
console.log(`${cases.length} cases`);
