// Builds the playground into public/ for GitHub Pages.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");

fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });
for (const f of ["index.html", "style.css", "favicon.svg"]) fs.copyFileSync(path.join(root, "site", f), path.join(pub, f));
await build({
  entryPoints: [path.join(root, "site", "app.ts")],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  // The wilaya and commune data loads only when those tabs are used.
  splitting: true,
  outdir: pub,
  chunkNames: "chunks/[name]-[hash]",
});
fs.writeFileSync(path.join(pub, ".nojekyll"), "");
console.log("public/ built");
