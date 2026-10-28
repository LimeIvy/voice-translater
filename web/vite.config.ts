import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestOptions } from "vite-plugin-pwa";

const manifest = JSON.parse(
  readFileSync(new URL("./manifest.json", import.meta.url), "utf8"),
) as Partial<ManifestOptions>;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Activate updates after the app is closed, without interrupting recording.
      registerType: "prompt",
      injectRegister: "script-defer",
      // Generate the public manifest from client/manifest.json.
      manifest,
      manifestFilename: "manifest.json",
      includeAssets: ["favicon.svg", "icon512_maskable.png", "icon512_rounded.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        // Translation and speech requests must always go to the server.
        runtimeCaching: [],
      },
    }),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      cn: fileURLToPath(new URL("./src/lib/utils.ts", import.meta.url)),
    },
  },
});
