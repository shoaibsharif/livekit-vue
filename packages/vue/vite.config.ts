import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "hooks/index": resolve(__dirname, "src/hooks/index.ts"),
      },
    },
    rollupOptions: {
      external: ["vue", "livekit-client"],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
