/** Writes ASCII digits as Arabic-Indic (U+0660) or Extended Arabic-Indic (U+06F0) digits. */
export function arabic(s: string, base = 0x0660): string {
  return s.replace(/\d/g, d => String.fromCharCode(base + Number(d)));
}
