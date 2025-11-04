import { execFile } from 'node:child_process';
import { join } from 'node:path';

import sdkIt from '@sdk-it/vite/typescript';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/pulse',
  server: {
    port: 5173,
    host: 'localhost',
  },
  plugins: [
    react(),
    tailwindcss(),
    sdkIt(join('../', '../', 'openapi.json'), {
      mode: 'minimal',
      output: join('../', '../', 'packages/client/src'),
      name: 'Client',
      pagination: false,
      readme: false,
      formatCode: ({ output, env }) => {
        execFile('prettier', ['openapi.json', output, '--write'], {
          env: env,
        });
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: 'Thought',
        short_name: 'Thought',
        description: 'paste it, remember it, find it',
        theme_color: '#000000',
        background_color: '#000000',
      },

      selfDestroying: true,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
