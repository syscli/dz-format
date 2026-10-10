import { ccp, formatPhone, formatPlate, formatRib, phone, plate, rib, rip, ripOf, type Reason, type Result } from "../src/index.js";

type Any = Result<Record<string, unknown>>;
type Run = (value: string, extra: string) => { result: Any; call: string; more?: [string, string][] } | Promise<{ result: Any; call: string; more?: [string, string][] }>;

type Kind = {
  id: string;
  label: string;
  placeholder: string;
  extra?: string;
  examples: string[];
  run: Run;
};

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;
const q = (s: string) => JSON.stringify(s);

// Wilaya and commune names come from @syscli/algeria, loaded on first use.
let place: Promise<typeof import("../src/place.js")> | null = null;
const loadPlace = () => (place ??= import("../src/place.js"));

const KINDS: Kind[] = [
  {
    id: "phone",
    label: "Phone",
    placeholder: "0661 23 45 67 or +213 21 23 45 67",
    examples: ["0661 23 45 67", "+213 555 12 34 56", "021 23 45 67", "0661 23 45"],
    run: v => {
      const result = phone(v);
      return {
        result,
        call: `phone(${q(v)})`,
        more: result.valid ? [["international", formatPhone(v, "international")]] : [],
      };
    },
  },
  {
    id: "rip",
    label: "RIP",
    placeholder: "007 99999 0000000200 91",
    examples: ["007 99999 0000000200 91", "00799999000000020092"],
    run: v => ({ result: rip(v), call: `rip(${q(v)})` }),
  },
  {
    id: "ccp",
    label: "CCP",
    placeholder: "Account number",
    extra: "Key",
    examples: ["200", "200|12", "17756415|76"],
    run: (v, k) => {
      const result = ccp(v, k || undefined);
      const more: [string, string][] = result.valid ? [["RIP", formatRib(ripOf(result.account as string))]] : [];
      return { result, call: k ? `ccp(${q(v)}, ${q(k)})` : `ccp(${q(v)})`, more };
    },
  },
  {
    id: "rib",
    label: "RIB",
    placeholder: "002 00112 1123000001 46",
    examples: ["002 00112 1123000001 46", "001 00627 0300300180 36", "002 00112 1123000001 47"],
    run: v => {
      const result = rib(v);
      return { result, call: `rib(${q(v)})`, more: result.valid ? [["formatted", formatRib(v)]] : [] };
    },
  },
  {
    id: "plate",
    label: "Plate",
    placeholder: "12345 116 16",
    examples: ["12345 116 16", "00123 125 68", "4567 933 31", "12345 116 70"],
    run: v => {
      const result = plate(v);
      return { result, call: `plate(${q(v)})`, more: result.valid ? [["printed", formatPlate(v)]] : [] };
    },
  },
  {
    id: "commune",
    label: "Commune",
    placeholder: "Name or ONS code, in French or Arabic",
    extra: "Wilaya",
    examples: ["Bou Saada", "Bains Romains", "El Marsa", "El Marsa|Alger", "Tlemsen", "1601"],
    run: async (v, w) => {
      const p = await loadPlace();
      const result = p.commune(v, w ? { wilaya: w } : {});
      return { result, call: w ? `commune(${q(v)}, { wilaya: ${q(w)} })` : `commune(${q(v)})` };
    },
  },
  {
    id: "wilaya",
    label: "Wilaya",
    placeholder: "Name or code, in French or Arabic",
    examples: ["16", "bou saada", "Tamanrasset", "70"],
    run: async v => {
      const p = await loadPlace();
      return { result: p.wilaya(v), call: `wilaya(${q(v)})` };
    },
  },
];

const REASONS: Record<Reason, string> = {
  empty: "Type a value.",
  chars: "Only digits and the usual separators are allowed here.",
  length: "Wrong number of digits.",
  prefix: "This format does not use that prefix.",
  key: "The check key does not match. Most likely a typing mistake.",
  range: "A part of the value is out of range.",
  unknown: "Not found.",
  ambiguous: "Several communes have this name. Pick one, or give the wilaya.",
};

const LABELS: Record<string, string> = {
  value: "value",
  national: "national",
  type: "type",
  operator: "operator (range)",
  area: "area code",
  bank: "bank",
  agency: "agency",
  account: "account",
  key: "key",
  ccp: "CCP account",
  serial: "serial",
  category: "category",
  categoryName: "category name",
  yearCode: "year code",
  year: "year",
  wilaya: "wilaya",
  code: "code",
  nameFr: "name (fr)",
  nameAr: "name (ar)",
};

const tabs = $<HTMLDivElement>(".kinds");
const input = $<HTMLInputElement>("#value");
const extra = $<HTMLInputElement>("#extra");
const verdict = $<HTMLDivElement>("#verdict");
const parts = $<HTMLDListElement>("#parts");
const code = $<HTMLPreElement>("#code");
const examples = $<HTMLSpanElement>("#examples");

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

let kind = KINDS[0]!;
let run = 0;

function selectKind(id: string, focus = true) {
  kind = KINDS.find(k => k.id === id) ?? KINDS[0]!;
  tabs.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.id === kind.id)));
  input.placeholder = kind.placeholder;
  extra.hidden = !kind.extra;
  extra.placeholder = kind.extra ?? "";
  examples.innerHTML = kind.examples
    .map(e => `<button type="button" data-v="${esc(e)}">${esc(e.replace("|", " + "))}</button>`)
    .join("");
  if (focus) input.focus();
  update();
}

async function update() {
  const id = ++run;
  const value = input.value;
  const more = kind.extra ? extra.value.trim() : "";
  saveState(value, more);
  if (!value.trim()) {
    verdict.innerHTML = `<span class="badge badge--idle">waiting</span><p>Type a value, or pick an example.</p>`;
    parts.innerHTML = "";
    code.innerHTML = `<span class="k">import</span> { ${kind.id} } <span class="k">from</span> "@syscli/dz-format${kind.id === "commune" || kind.id === "wilaya" ? "/place" : ""}";`;
    return;
  }
  const out = await kind.run(value, more);
  if (id !== run) return;
  const r = out.result;
  if (r.valid) {
    verdict.innerHTML = `<span class="badge badge--ok">valid</span><p>Well formed.</p>`;
    const rows = Object.entries(r)
      .filter(([k, v]) => k !== "valid" && v !== undefined)
      .map(([k, v]) => [LABELS[k] ?? k, v === null ? "unknown" : String(v)] as [string, string])
      .concat(out.more ?? []);
    parts.innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
  } else {
    const sugg = r.suggestions?.length
      ? `<div class="suggest">${r.suggestions.map(s => `<button type="button" data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div>`
      : "";
    verdict.innerHTML = `<span class="badge badge--no">${esc(r.reason)}</span><p>${esc(REASONS[r.reason])}</p>${sugg}`;
    parts.innerHTML = "";
  }
  code.textContent = `${out.call}\n// => ${JSON.stringify(r, null, 2).replace(/\n/g, "\n//    ")}`;
}

function saveState(value: string, more: string) {
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("k", kind.id);
  if (value) url.searchParams.set("v", value);
  if (more) url.searchParams.set("x", more);
  history.replaceState(null, "", url);
}

tabs.innerHTML = KINDS.map(k => `<button type="button" role="tab" data-id="${k.id}">${k.label}</button>`).join("");
tabs.addEventListener("click", e => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button[data-id]");
  if (!b || b.dataset.id === kind.id) return;
  input.value = "";
  extra.value = "";
  selectKind(b.dataset.id!);
});

examples.addEventListener("click", e => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button[data-v]");
  if (!b) return;
  const [v, x = ""] = b.dataset.v!.split("|");
  input.value = v!;
  extra.value = x;
  update();
});

verdict.addEventListener("click", e => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button[data-s]");
  if (!b) return;
  // Suggestions read "Commune, Wilaya".
  const [name, w = ""] = b.dataset.s!.split(", ");
  input.value = name!;
  if (kind.extra) extra.value = w;
  update();
});

input.addEventListener("input", update);
extra.addEventListener("input", update);

const start = new URLSearchParams(location.search);
input.value = start.get("v") ?? "";
extra.value = start.get("x") ?? "";
selectKind(start.get("k") ?? "phone", false);
