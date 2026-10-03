import { defineConfig } from "vite";
import { apiMiddleware } from "./server/metrics.mjs";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  plugins: [
    {
      name: "public-indicators",
      configureServer(server) {
        server.middlewares.use(apiMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(apiMiddleware);
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"], astronomy: ["astronomy-engine"] },
      },
    },
  },
});
