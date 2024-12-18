import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  root: "./",
  base: "/",
  publicDir: "./public",
  resolve: {
    extensions: [".ts", ".js", ".jsx", ".tsx"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@framework": path.resolve(__dirname, "./Framework/src"),
    },
  },
});
