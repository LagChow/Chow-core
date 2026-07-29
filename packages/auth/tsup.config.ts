import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    compilerOptions: {
      skipLibCheck: true,
      types: ["node"],
    },
  },
  clean: true,
  splitting: false,
});
