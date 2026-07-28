import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "analyze" &&
      visualizer({
        open: false,
        filename: "dist/stats.html",
        gzipSize: true,
      }),
  ].filter(Boolean),
  // Emit large JSON imports as `JSON.parse("…")` instead of a JS object literal.
  // Parsing a string is significantly faster than evaluating a big object literal
  // (matters for the 1.6MB rpgbot-ratings.json loaded on /builder). This disables
  // named imports from JSON, which the codebase does not use.
  json: { stringify: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@radix-ui/react-accordion"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // React, Radix y react-router deben compartir chunk para evitar
          // "useLayoutEffect of undefined" en producción (dependencia circular).
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/") ||
            id.includes("@radix-ui")
          ) {
            return "vendor";
          }
          if (id.includes("@tanstack/react-table")) return "table";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("pdf-lib")) return "pdf";
        },
      },
    },
  },
}));
