import { defineConfig } from "tsup";

export default defineConfig({
  name: "tsup",
  treeshake: true,
  entry: ['autotasks'],
  outExtension() {
    return {
      js: `.js`,
    }
  },
});
