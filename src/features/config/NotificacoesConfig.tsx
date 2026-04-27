/**
 * Configuracoes de Notificacoes Push
 *
 * Card de configuração exibido na ConfigPage.
 * Gerencia o ciclo completo: verificar suporte, pedir permissão,
 * inscrever/cancelar inscrição no serviço de push.
 */

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    )
}

function BellSlashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        </svg>
    )
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

export function NotificacoesConfig() {
    const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe, requestPermission } =
        usePushNotifications()

    const [error, setError] = useState<string | null>(null)

    async function handleEnable() {
        setError(null)
        try {
            // Ask for permission if not yet granted
            if (permission !== 'granted') {
                const result = await requestPermission()
                if (result !== 'granted') return
            }
            await subscribe()
        } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            setError(msg || 'Não foi possível ativar as notificações. Tente novamente.')
        }
    }

    async function handleDisable() {
        setError(null)
        try {
            await unsubscribe()
        } catch {
            setError('Não foi possível desativar as notificações. Tente novamente.')
        }
    }

    // ── Render: not supported ──────────────────────────────────────
    if (!isSupported) {
        return (
            <div className="section-card">
                <div className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                        <BellSlashIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Notificações</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Notificações push nao sao suportadas neste navegador
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // ── Render: permission explicitly denied ───────────────────────
    if (permission === 'denied') {
        return (
            <div className="section-card">
                <div className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center shrink-0">
                        <BellSlashIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Notificações bloqueadas</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Para ativar, permita as notificacoes nas configuracoes do navegador
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // ── Render: active subscription ────────────────────────────────
    if (isSubscribed) {
        return (
            <div className="section-card space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Notificacoes ativas</p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Voce sera avisado sobre posturas e eventos
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <button
                    onClick={() => void handleDisable()}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Desativando...' : 'Desativar notificacoes'}
                </button>
            </div>
        )
    }

    // ── Render: default / not subscribed ──────────────────────────
    return (
        <div className="section-card space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Notificacoes push</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receba alertas de posturas, nascimentos e outros eventos
                    </p>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <button
                onClick={() => void handleEnable()}
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Ativando...' : 'Ativar notificacoes'}
            </button>
        </div>
    )
}
