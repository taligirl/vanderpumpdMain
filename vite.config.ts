// imports
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const enablePWA = isProd && process.env.PWA_DISABLED !== '1';

  return {
    plugins: [
      react(),
      // PWA only in prod (no SW at all in dev)
      enablePWA &&
        VitePWA({
          // Explicit switch to dodge terser renderChunk crashes; rebuild SW unminified
          minify: false,

          // auto-register the service worker for you (prod build only)
          injectRegister: 'script',
          registerType: 'autoUpdate',

          // what to precache at build time
          workbox: {
            navigateFallback: '/index.html',
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          },

          // app metadata (icons must exist in /public)
          manifest: {
            name: 'Vanderpumpd',
            short_name: 'Vanderpumpd',
            description: 'Rate, review, and share episodes.',
            start_url: '.',
            scope: '.',
            display: 'standalone',
            background_color: '#0b0a10',
            theme_color: '#0b0a10',
            icons: [
              { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
        }),
    ].filter(Boolean),
    server: { host: true, port: 5173 },
    preview: { host: true, port: 5173 },
    publicDir: 'public',
  };
});
