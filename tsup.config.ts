import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/place.ts"],
  format: ["esm", "cjs"],
  target: "node18",
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
});
