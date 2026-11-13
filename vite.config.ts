import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.webp', 'apple-touch-icon.png'],
      manifest: {
        name: 'Migra',
        short_name: 'Migra',
        description: 'Chet elda qonuniy ish sari ishonchli yoʻl',
        lang: 'uz',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F1EFE8',
        theme_color: '#F1EFE8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webp}'],
        // Kontent paketlari alohida boʻlaklarda (0.23.0); chegara zaxira uchun 4 MiB qoldirildi.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ]
})
