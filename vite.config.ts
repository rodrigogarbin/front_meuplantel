import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            registerType: 'prompt',
            includeAssets: ['favicon.svg', 'icons/*.png'],
            manifest: {
                name: 'MeuPlantel',
                short_name: 'MeuPlantel',
                description: 'Sistema de gerenciamento de aves - Controle seu plantel, casais e posturas',
                theme_color: '#2563eb',
                background_color: '#1e293b',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                lang: 'pt-BR',
                categories: ['productivity', 'utilities'],
                icons: [
                    {
                        src: '/icons/icon-72x72.png',
                        sizes: '72x72',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-128x128.png',
                        sizes: '128x128',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-144x144.png',
                        sizes: '144x144',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-152x152.png',
                        sizes: '152x152',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable any'
                    }
                ],
                screenshots: [
                    {
                        src: '/screenshots/mobile.png',
                        sizes: '390x844',
                        type: 'image/png',
                        form_factor: 'narrow'
                    }
                ]
            },
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB — main chunk exceeds default 2 MiB limit
            },
            devOptions: {
                enabled: false,
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        host: true, // Needed for Capacitor
    },
    define: {
        __APP_VERSION__: JSON.stringify(version),
    },
    build: {
        // Optimize for mobile
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: false,
    },
})
