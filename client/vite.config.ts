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

// Tauri CLIが起動した場合のみ設定される環境変数
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // PWAはブラウザ版のみ有効
    ...(!isTauri
      ? [
          VitePWA({
            registerType: "prompt",
            injectRegister: "script-defer",
            manifest,
            manifestFilename: "manifest.json",
            includeAssets: [
              "favicon.svg",
              "icon512_maskable.png",
              "icon512_rounded.png",
            ],
            workbox: {
              globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
              cleanupOutdatedCaches: true,
              navigateFallback: "/index.html",
              navigateFallbackDenylist: [/^\/api(?:\/|$)/],
              runtimeCaching: [],
            },
          }),
        ]
      : []),

    babel({ presets: [reactCompilerPreset()] }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      cn: fileURLToPath(new URL("./src/lib/utils.ts", import.meta.url)),
    },
  },

  // Tauriの開発サーバー用設定
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  envPrefix: ["VITE_", "TAURI_ENV_*"],

  clearScreen: false,
});
