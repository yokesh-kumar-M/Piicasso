/// <reference types="vitest/config" />
import { defineConfig, loadEnv, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

const srcJsPattern = /[\\/]src[\\/].*\.js$/;

// Oxc selects its parser from the file extension. CRA permitted JSX in `.js`,
// so transform those modules as JSX before Vite's normal Oxc pass. The normal
// pass still adds React Fast Refresh in development.
function jsxInJsWithOxc() {
  return {
    name: 'piicasso:jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      const filename = id.split('?', 1)[0];
      if (!srcJsPattern.test(filename)) return null;

      const result = await transformWithOxc(code, filename, {
        lang: 'jsx',
        jsx: {
          runtime: 'automatic',
          importSource: 'react',
        },
        sourcemap: true,
      });

      return { code: result.code, map: result.map };
    },
  };
}

// Migrated from Create React App (react-scripts) to Vite.
//
// Two CRA-isms are preserved so neither the application source nor the
// deployment environment variables had to change:
//   1. JSX lives inside plain `.js` files (CRA allowed this; Vite/Oxc does
//      not infer it from the extension) — handled by the Oxc/Rolldown
//      module-type configuration below.
//   2. Env vars keep the `REACT_APP_` prefix and are read via
//      `process.env.*`, so Vercel/Render dashboard vars stay as-is. They
//      are statically inlined at build time via `define`, exactly like CRA.
export default defineConfig(({ mode }) => {
  // Load every env var (empty prefix) so the REACT_APP_* names resolve.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [jsxInJsWithOxc(), react({ include: /src\/.*\.[jt]sx?$/ })],

    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      open: false,
    },

    build: {
      // Match CRA's output dir so the Dockerfile COPY and the Vercel
      // output directory keep working without changes.
      outDir: 'build',
      sourcemap: false,
      rolldownOptions: {
        moduleTypes: { '.js': 'jsx' },
      },
    },

    // Statically replace the CRA-style env references at build time.
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || ''),
      'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(
        env.REACT_APP_GOOGLE_CLIENT_ID || '',
      ),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },

    // Vite 8 uses Oxc for transforms and Rolldown for dependency scanning
    // and production bundling. Keep CRA's JSX-in-.js convention explicit in
    // both halves of that pipeline.
    oxc: {
      include: /src\/.*\.[jt]sx?$/,
      exclude: [],
      jsx: {
        runtime: 'automatic',
        importSource: 'react',
      },
    },
    optimizeDeps: {
      rolldownOptions: {
        moduleTypes: { '.js': 'jsx' },
        transform: {
          jsx: {
            runtime: 'automatic',
            importSource: 'react',
          },
        },
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
