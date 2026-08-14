import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from https://zazieproductions.github.io/index-organica/ on GitHub
  // Pages, so the production build must emit sub-path-relative asset URLs.
  // Dev keeps the root base so `npm run dev` stays at http://localhost:5173/.
  base: command === "build" ? "/index-organica/" : "/",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
