/**
 * Hook para gerenciar instalação do PWA
 *
 * O evento `beforeinstallprompt` dispara muito antes do React montar.
 * Capturamos em nível de módulo (executa na importação) para não perder o evento.
 */

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Captura global — executado assim que o módulo é importado
let _deferredPrompt: BeforeInstallPromptEvent | null = null
let _installed = false
const _listeners = new Set<() => void>()

function notify() {
    _listeners.forEach((fn) => fn())
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferredPrompt = e as BeforeInstallPromptEvent
    notify()
})

window.addEventListener('appinstalled', () => {
    _deferredPrompt = null
    _installed = true
    notify()
})

export function usePWAInstall() {
    const [, rerender] = useState(0)

    useEffect(() => {
        const fn = () => rerender((n) => n + 1)
        _listeners.add(fn)
        return () => { _listeners.delete(fn) }
    }, [])

    const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream

    const isInstalled =
        _installed ||
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true

    const isInstallable = !isInstalled && (_deferredPrompt !== null || isIOS)

    const promptInstall = async (): Promise<boolean> => {
        if (!_deferredPrompt) return false
        try {
            await _deferredPrompt.prompt()
            const { outcome } = await _deferredPrompt.userChoice
            if (outcome === 'accepted') {
                _deferredPrompt = null
                _installed = true
                notify()
            }
            return outcome === 'accepted'
        } catch {
            return false
        }
    }

    return { isInstallable, isInstalled, isIOS, promptInstall }
}
