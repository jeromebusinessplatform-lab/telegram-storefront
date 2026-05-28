import { defineConfig, PluginOption } from "vite";
import { enterDevPlugin, enterProdPlugin } from 'vite-plugin-enter-dev';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    ...enterProdPlugin(),
  ];
  if (mode === 'development') {
    plugins.push(...enterDevPlugin());
  }
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean) as PluginOption[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (
              id.includes('/node_modules/react/') ||
              id.includes('react-dom') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react-router-dom') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor';
            }

            if (
              id.includes('@supabase') ||
              id.includes('@tanstack/react-query')
            ) {
              return 'data-vendor';
            }

            if (
              id.includes('@radix-ui') ||
              id.includes('lucide-react') ||
              id.includes('sonner') ||
              id.includes('cmdk') ||
              id.includes('date-fns') ||
              id.includes('embla-carousel-react') ||
              id.includes('framer-motion') ||
              id.includes('react-day-picker') ||
              id.includes('react-hook-form') ||
              id.includes('react-resizable-panels') ||
              id.includes('input-otp') ||
              id.includes('recharts') ||
              id.includes('vaul') ||
              id.includes('zod')
            ) {
              return 'ui-vendor';
            }
          },
        },
      },
    }
  };
});
