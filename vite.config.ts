import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, createLogger } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const logger = createLogger();
const originalWarn = logger.warn;
const originalError = logger.error;

logger.warn = (msg, options) => {
  if (msg.includes('Error when using sourcemap for reporting an error')) return;
  originalWarn(msg, options);
};

logger.error = (msg, options) => {
  if (msg.includes('Error when using sourcemap for reporting an error')) return;
  originalError(msg, options);
};

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  customLogger: logger,
  build: {
    sourcemap: !isSsrBuild,
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
