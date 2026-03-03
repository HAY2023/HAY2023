import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  build: {
    // تحسين السرعة
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
        },
      },
    },
  },
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'icon-mosque.png'],
      manifest: {
        name: "صندوق فتوى - مسجد الإيمان 150 مسكن",
        short_name: "صندوق فتوى",
        description: "نجمع استفساراتكم الشرعية ويتم الإجابة عليها في حلقات دورية بمسجد الإيمان",
        theme_color: "#1a1a2e",
        background_color: "#0f0f1a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        dir: "rtl",
        lang: "ar",
        scope: "/",
        categories: ["education", "lifestyle"],
        icons: [
          {
            src: "/favicon.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
        screenshots: [],
        shortcuts: [
          {
            name: "إرسال سؤال",
            short_name: "سؤال",
            url: "/?action=question",
            icons: [{ src: "/favicon.jpg", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // تخزين بيانات Supabase (الإعدادات وغيرها)
            urlPattern: /^https:\/\/bagmmxiclfysesjdcgrk\.supabase\.co\/rest\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-data-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // يوم واحد
              },
            },
          },
          {
            // تخزين الصور الخارجية من Supabase بصورة دائمة تقريباً
            urlPattern: /^https:\/\/bagmmxiclfysesjdcgrk\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 يوم
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));