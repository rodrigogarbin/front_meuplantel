/**
 * Componente que exibe notificação quando há uma atualização do PWA disponível
 */

import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            if (!r) return
            // Verificar atualizações a cada 10 minutos
            setInterval(() => { r.update() }, 10 * 60 * 1000)
            // Verificar ao voltar pro app (tab em background → foreground)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') r.update()
            })
        },
        onRegisterError(error: unknown) {
            console.error('SW registration error', error)
        },
    })

    // Recarrega automaticamente quando um novo SW assume o controle
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return
        const handleControllerChange = () => { window.location.reload() }
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
        return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }, [])

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    const handleUpdate = () => {
        updateServiceWorker(true)
    }

    // Não mostrar nada se não houver atualização ou se estiver offline
    if (!offlineReady && !needRefresh) {
        return null
    }

    return (
        <div className="fixed bottom-20 left-0 right-0 z-[70] px-4">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 safe-bottom">
                <div className="flex items-start gap-3">
                    {/* Ícone */}
                    <div className="flex-shrink-0">
                        {needRefresh ? (
                            <svg
                                className="w-6 h-6 text-blue-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-6 h-6 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {needRefresh ? 'Nova atualização disponível!' : 'App pronto para funcionar offline'}
                        </p>
                        {needRefresh && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Clique em "Atualizar" para usar a versão mais recente
                            </p>
                        )}
                    </div>

                    {/* Botão fechar */}
                    <button
                        onClick={close}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        aria-label="Fechar"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                {/* Botões de ação */}
                {needRefresh && (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleUpdate}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Atualizar agora
                        </button>
                        <button
                            onClick={close}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Mais tarde
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
