# dz-format

Validate and parse Algerian formats: phone numbers, CCP accounts, RIP and RIB
keys, vehicle plates, wilayas and communes.

Try it in your browser: https://syscli.github.io/dz-format/

```sh
npm install @syscli/dz-format
```

```ts
import { phone, rip, ripOf, ccp, rib, plate, wilayaCode } from "@syscli/dz-format";

phone("0661 23 45 67");
// { valid: true, value: "+213661234567", national: "0661234567",
//   type: "mobile", operator: "Mobilis" }

ripOf("200");                      // "00799999000000020091"
rip("007 99999 0000000200 91");    // { valid: true, ccp: "200", key: "91", ... }
ccp("200", "12");                  // { valid: true, account: "200", key: "12" }
rib("002 00112 1123000001 47");    // { valid: false, reason: "key" }

plate("12345 116 16");
// { valid: true, serial: "12345", categoryName: "tourisme", year: 2016,
//   wilaya: "16", ... }

wilayaCode("68");                  // { valid: true, code: "68" }
wilayaCode("68", 58);              // { valid: false, reason: "range" }
```

Every function takes the value the way people type it: with spaces, dashes or
dots, with or without +213, and with Arabic-Indic digits. It returns either
the parsed parts or the reason the value was rejected, so a form can tell the
user what is wrong.

| reason | |
|---|---|
| empty | nothing but spaces and separators |
| chars | something other than digits |
| length | wrong number of digits |
| prefix | a prefix this format does not use |
| key | the check key does not match |
| range | a part is out of range, such as wilaya 70 |
| unknown | no wilaya or commune by that name or code |
| ambiguous | several communes have that name; give the wilaya |

## Wilayas and communes

```sh
npm install @syscli/dz-format @syscli/algeria
```

```ts
import { commune, wilaya } from "@syscli/dz-format/place";

commune("Bou Saada");                    // { valid: true, code: "2820", wilaya: "68", ... }
commune("Bains Romains");                // Hammamet, by its old official name
commune("El Marsa");                     // { valid: false, reason: "ambiguous",
                                         //   suggestions: ["El Marsa, Chlef", "El Marsa, Alger", ...] }
commune("El Marsa", { wilaya: "Alger" }); // valid, code "1640"
commune("Tlemsen");                      // { valid: false, reason: "unknown", suggestions: ["Tlemcen, Tlemcen"] }
commune("Bou Saada", { map: 58 });       // valid, wilaya "28" under the 58-wilaya map
wilaya("bou saada");                     // { valid: true, code: "68", ... }
```

The names come from [@syscli/algeria](https://github.com/syscli/algeria),
which this entry needs as a peer dependency; the rest of the package does not.
A misspelled name is never accepted silently: it comes back with suggestions,
so a form can ask the user to pick one. Usual transliterations (Djelfa and
Jelfa, Beni and Bni) count as spellings, not typos.

## What is covered

| function | format |
|---|---|
| `phone`, `formatPhone` | mobile (05, 06, 07), landline, VoIP (09), national or international |
| `ccp`, `ccpKey` | CCP account and its two-digit key |
| `rip`, `ripOf` | RIP of a CCP account, and building it from the account |
| `rib`, `ribKey`, `formatRib` | 20-digit RIB of any bank |
| `plate`, `formatPlate` | vehicle plate, normal series, wilaya codes up to 69 |
| `wilayaCode` | wilaya code under the 48, 58 or 69 map |
| `place`: `wilaya`, `commune` | wilaya and commune names or codes, with suggestions |
| `asciiDigits` | converts Arabic-Indic digits |

## What valid means

Valid means well formed: the right length, the right prefix, a matching key.
It does not mean the number exists. A RIP with a correct key may belong to
no account, and a mobile number may have moved to another operator.

## Sources

Each rule and where it comes from is in [sources/README.md](sources/README.md).
The RIB key rule is checked against accounts published by Algerie Poste, BEA
and BNA; it is not the French RIB key that many tools use.

## Releases and security

Versions are listed in [CHANGELOG.md](CHANGELOG.md). Releases are published
from GitHub Actions with npm provenance; `npm audit signatures` checks them.
To report a security problem, see [SECURITY.md](SECURITY.md).

## License

MIT
