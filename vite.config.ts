import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: isSsrBuild ? undefined : {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/ssr'],
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    }
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
}));
