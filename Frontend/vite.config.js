import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    rollupOptions: {
      output: {
        // Split big third-party libraries into their own long-cached files so an app update
        // doesn't make everyone re-download React/Firebase/etc., and they load in parallel
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react';
          if (/node_modules[\/](react-router|react-router-dom|@remix-run)[\/]/.test(id)) return 'router';
          if (/node_modules[\/](framer-motion|motion-dom|motion-utils)[\/]/.test(id)) return 'motion';
          if (/node_modules[\/](firebase|@firebase)[\/]/.test(id)) return 'firebase';
          if (/node_modules[\/](gsap|lenis)[\/]/.test(id)) return 'scroll-anim';
          if (/node_modules[\/](@reduxjs|redux|react-redux|immer|reselect)[\/]/.test(id)) return 'state';
          if (/node_modules[\/](socket.io-client|engine.io-client|socket.io-parser)[\/]/.test(id)) return 'socket';
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    // Some pages call the API with a relative /api URL; forward those to the backend in development
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000'
    }
  }
});
