import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
});
