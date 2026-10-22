import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: false,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "src/routeTree.gen.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/test/",
        "src/routeTree.gen.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/**",
        "**/models/**",
      ],
    },
  },
  // Chrome 109 is the last release for Windows 7, and the school still runs it. The theme is
  // written in oklch(), which that browser cannot parse: every color variable came out invalid and
  // backgrounds turned transparent. Minifying with Lightning CSS for that target writes each color
  // as hex first and keeps lab() behind @supports, so modern browsers render exactly as before.
  css: {
    lightningcss: {
      targets: { chrome: 109 << 16 },
    },
  },
  build: {
    cssMinify: "lightningcss",
  },
  server: {
    port: 5300,
    strictPort: true,
  },
})
