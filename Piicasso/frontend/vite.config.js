/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Migrated from Create React App (react-scripts) to Vite.
//
// Two CRA-isms are preserved so neither the application source nor the
// deployment environment variables had to change:
//   1. JSX lives inside plain `.js` files (CRA allowed this; Vite/esbuild
//      does not by default) — handled by the esbuild `jsx` loader below.
//   2. Env vars keep the `REACT_APP_` prefix and are read via
//      `process.env.*`, so Vercel/Render dashboard vars stay as-is. They
//      are statically inlined at build time via `define`, exactly like CRA.
export default defineConfig(({ mode }) => {
  // Load every env var (empty prefix) so the REACT_APP_* names resolve.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    server: {
      port: 3000,
      open: false,
    },

    build: {
      // Match CRA's output dir so the Dockerfile COPY and the Vercel
      // output directory keep working without changes.
      outDir: 'build',
      sourcemap: false,
    },

    // Statically replace the CRA-style env references at build time.
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || ''),
      'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(env.REACT_APP_GOOGLE_CLIENT_ID || ''),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },

    // Allow JSX syntax inside `.js` files under src/.
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: false,
    },
  };
});
