import vue from "@vitejs/plugin-vue";
import { copyFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { defineConfig, type Plugin } from "vite";
import dts from "vite-plugin-dts";

function copyTheme(): Plugin {
  return {
    name: "copy-theme",
    closeBundle() {
      mkdirSync(resolve(__dirname, "dist/theme"), { recursive: true });
      copyFileSync(
        resolve(__dirname, "src/theme/variables.css"),
        resolve(__dirname, "dist/theme/variables.css"),
      );
    },
  };
}

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: "./tsconfig.json",
      rollupTypes: true,
      outDir: "dist",
    }),
    copyTheme(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue", "markstream-vue", "@ag-ui/client", "@ag-ui/core"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
    cssCodeSplit: false,
  },
});
