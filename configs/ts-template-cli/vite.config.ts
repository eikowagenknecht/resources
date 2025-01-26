/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  // Resolve @/ to the source root directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    lib: {
      // Set the entry point
      entry: path.resolve(__dirname, "src/index.ts"),
      // The name of your CLI tool
      name: "template-project",
      // The formats to build
      formats: ["es"],
      // The name of the output file
      fileName: "index",
    },
    // Rollup specific options
    rollupOptions: {
      // External packages that shouldn't be bundled
      external: [
        // Add any packages that should be external here
      ],
    },
  },
  // Prevent vite from obscuring errors in the console
  clearScreen: false,
  test: {
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "tests/**/*.?(c|m)[jt]s?(x)"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
    },
    setupFiles: "./vitest-setup.ts",
  },
});