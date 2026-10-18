import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'SOURCEMAP_BROKEN' &&
          warning.plugin?.includes('@tailwindcss/vite')
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@sentry')) {
            return 'sentry';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
})

