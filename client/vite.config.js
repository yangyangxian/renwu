import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' 
import tailwindcss from '@tailwindcss/vite'

// Get the directory of the current file (client/vite.config.js)
const __dirname = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\\?\/([A-Za-z]:)/, '$1')
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src').replace(/\\/g, '/'),
      '@fullstack/common': path.resolve(__dirname, '../common/src').replace(/\\/g, '/'),
    },
  },
  optimizeDeps: {
    include: ['recharts'],
  },
  server: {
    proxy: {
      // Proxy API requests starting with /api to the backend server
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
    },
    // Add file system watch options for external directories
    fs: {
      // Allow Vite to access files from the common/dist directory.
      // This implicitly tells Vite to watch these paths for HMR.
      allow: [
        '..',
        path.resolve('../common'),
        path.resolve(__dirname, '.')
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('marked')) {
              return 'vendor-marked';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            if (id.match(/node_modules\/(milkdown|@milkdown|prosemirror|@prosemirror|@lezer|@codemirror|@prosemirror-adapter)/)) {
              return 'vendor-milkdown';
            }
            if (id.match(/node_modules\/(\@radix-ui\/)/)) {
              return 'vendor-radix';
            }
            if (id.match(/node_modules\/lodash/)) {
              return 'vendor-lodash';
            }
            if (id.match(/node_modules\/@dnd-kit/)) {
              return 'vendor-dndkit';
            }
            if (id.match(/node_modules\/react-day-picker/)) {
              return 'vendor-react-day-picker';
            }
            if (id.match(/node_modules\/tailwind-merge/)) {
              return 'vendor-tailwind-merge';
            }
            // All other dependencies go into a generic vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
})
