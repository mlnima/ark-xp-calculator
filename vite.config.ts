import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const environment = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env;
const host = environment?.TAURI_DEV_HOST;
const repository = environment?.GITHUB_REPOSITORY?.split("/").at(-1);

export default defineConfig(async () => ({
  base: repository ? `/${repository}/` : "/",
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
