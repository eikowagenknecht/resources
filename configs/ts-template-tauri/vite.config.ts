/// <reference types="vitest" />
import path from "node:path";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  // Resolve @/ to the source root directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent vite from obscuring rust errors in the console / logging
  clearScreen: false,
  server: {
    // Tauri expects a fixed port
    port: 1420,
    strictPort: true,
    watch: {
      // Do not watch rust source files
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "tests/**/*.?(c|m)[jt]s?(x)"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
    },
    setupFiles: "./vitest-setup.ts",
  },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       // Split into chunks to see bundle sizes
  //       manualChunks: (id) => {
  //         if (id.includes("lodash")) return "lodash";
  //         if (id.includes("recharts") || id.includes("d3")) return "recharts";
  //         if (id.includes("react-router") || id.includes("tanstack")) return "react-router";
  //         if (id.includes("tauri")) return "tauri";
  //         if (id.includes("radix")) return "radix";
  //         if (id.includes("react")) return "react";
  //         if (id.includes("node_modules")) return "vendor-other";
  //       },
  //     },
  //   },
  // },
});
