import { defineConfig } from "tsup";

export default defineConfig({
  name: "tsup",
  treeshake: true,
  entry: ['bumpers'],
  outExtension() {
    return {
      js: `.js`,
    }
  },
});
