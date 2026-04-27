import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

/**
 * Aguarda o Service Worker estar ativo e controlando a página.
 * navigator.serviceWorker.ready só resolve quando o SW está em estado "activated"
 * e controlando a página atual — é o único estado em que push subscriptions funcionam.
 */
async function getActiveRegistration(): Promise<ServiceWorkerRegistration> {
    return Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
            setTimeout(() => {
                // Loga o estado atual para diagnóstico
                navigator.serviceWorker.getRegistrations().then((regs) => {
                    console.warn('[Push] Timeout esperando SW. Registrations:', regs.map((r) => ({
                        scope: r.scope,
                        active: r.active?.state,
                        installing: r.installing?.state,
                        waiting: r.waiting?.state,
                    })))
                })
                reject(new Error('Recarregue a página completamente (Ctrl+Shift+R) e tente novamente.'))
            }, 20000)
        ),
    ])
}

/**
 * Converts a URL-safe base64 string to a Uint8Array.
 * Required to pass the VAPID public key to pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

type PushPermission = 'default' | 'granted' | 'denied'

export interface UsePushNotificationsReturn {
    permission: PushPermission
    isSubscribed: boolean
    isLoading: boolean
    isSupported: boolean
    subscribe: () => Promise<void>
    unsubscribe: () => Promise<void>
    requestPermission: () => Promise<PushPermission>
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

    const [permission, setPermission] = useState<PushPermission>(
        isSupported ? Notification.permission : 'default'
    )
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!isSupported) return
        void checkSubscriptionStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSupported])

    async function checkSubscriptionStatus() {
        try {
            const reg = await getActiveRegistration()
            const sub = await reg.pushManager.getSubscription()
            setIsSubscribed(!!sub)
        } catch {
            setIsSubscribed(false)
        }
    }

    const requestPermission = useCallback(async (): Promise<PushPermission> => {
        if (!isSupported) return 'denied'
        const result = await Notification.requestPermission()
        setPermission(result)
        return result
    }, [isSupported])

    const subscribe = useCallback(async (): Promise<void> => {
        if (!isSupported) throw new Error('Push notifications not supported')
        setIsLoading(true)
        try {
            // 1. Fetch VAPID public key from backend
            const { data } = await api.get<{ public_key: string }>('/api/v1/push/vapid-public-key')
            const vapidPublicKey = urlBase64ToUint8Array(data.public_key)

            // 2. Get the active SW registration
            const reg = await getActiveRegistration()

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidPublicKey,
            })

            // 3. Send subscription details to the backend
            const sub = subscription.toJSON()
            await api.post('/api/v1/push/subscribe', {
                endpoint: sub.endpoint,
                public_key: sub.keys?.p256dh,
                auth_token: sub.keys?.auth,
                user_agent: navigator.userAgent,
            })

            setIsSubscribed(true)
        } catch (err) {
            console.error('[usePushNotifications] subscribe failed:', err)
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [isSupported])

    const unsubscribe = useCallback(async (): Promise<void> => {
        if (!isSupported) throw new Error('Push notifications not supported')
        setIsLoading(true)
        try {
            const reg = await getActiveRegistration()
            const subscription = await reg.pushManager.getSubscription()
            if (subscription) {
                // Notify backend first so it removes the record
                await api.delete('/api/v1/push/unsubscribe', {
                    data: { endpoint: subscription.endpoint },
                })
                await subscription.unsubscribe()
            }
            setIsSubscribed(false)
        } catch (err) {
            console.error('[usePushNotifications] unsubscribe failed:', err)
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [isSupported])

    return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe, requestPermission }
}
