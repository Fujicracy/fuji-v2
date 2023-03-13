import { defineConfig } from "tsup";

export default defineConfig({
  name: "tsup",
  treeshake: true,
  entry: ['src'],
  outExtension() {
    return {
      js: `.js`,
    }
  },
});
