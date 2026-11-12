import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/common/tts/*.test.ts"] },
});
