import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
// base must match the GitHub Pages project path: https://zazieproductions.github.io/index-organica/
export default defineConfig({
  base: "/index-organica/",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
