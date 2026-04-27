/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import type { PrecacheEntry } from 'workbox-precaching'

// Augment the SW global scope so TypeScript knows about the injected manifest
declare global {
    interface ServiceWorkerGlobalScope {
        __WB_MANIFEST: Array<PrecacheEntry | string>
    }
}

declare let self: ServiceWorkerGlobalScope

// Ativa imediatamente sem esperar todas as abas fecharem
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Em dev mode o manifest é [] — precacheAndRoute com lista vazia é seguro
const manifest = self.__WB_MANIFEST ?? []
precacheAndRoute(manifest)
cleanupOutdatedCaches()

// SPA navigation fallback — só quando há entradas no precache (não em dev mode)
if (manifest.length > 0) {
    registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
}

// API: NetworkFirst
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
        plugins: [new ExpirationPlugin({ maxAgeSeconds: 5 * 60 })],
    })
)

// Images: CacheFirst
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images-cache',
        plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 })],
    })
)

// ── Push Notifications ──────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
    if (!event.data) return

    const payload = event.data.json() as {
        title: string
        body: string
        icon?: string
        badge?: string
        data?: { url?: string }
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon ?? '/icons/icon-192x192.png',
            badge: payload.badge ?? '/icons/icon-72x72.png',
            data: payload.data,
            vibrate: [200, 100, 200],
        })
    )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close()
    const url = (event.notification.data as { url?: string } | null)?.url ?? '/'
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const existing = clients.find((c) => c.url.includes(self.location.origin))
            if (existing) {
                existing.focus()
                existing.navigate(url)
            } else {
                self.clients.openWindow(url)
            }
        })
    )
})
