/**
 * Componente de Banner para Instalação do PWA
 */

import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function PWAInstallBanner() {
    const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()
    const [showBanner, setShowBanner] = useState(false)
    const [showIOSInstructions, setShowIOSInstructions] = useState(false)

    useEffect(() => {
        // Não mostra se já está instalado
        if (isInstalled) {
            setShowBanner(false)
            return
        }

        // Verifica se o usuário já dispensou o banner
        const dismissed = localStorage.getItem('pwa-banner-dismissed')
        if (dismissed) {
            const dismissedDate = new Date(dismissed)
            const now = new Date()
            // Mostra novamente após 7 dias
            const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
            if (daysDiff < 7) {
                return
            }
        }

        // Mostra o banner após 3 segundos se for instalável
        if (isInstallable) {
            const timer = setTimeout(() => {
                setShowBanner(true)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isInstallable, isInstalled])

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSInstructions(true)
        } else {
            const accepted = await promptInstall()
            if (accepted) {
                setShowBanner(false)
            }
        }
    }

    const handleDismiss = () => {
        setShowBanner(false)
        localStorage.setItem('pwa-banner-dismissed', new Date().toISOString())
    }

    const handleCloseIOSInstructions = () => {
        setShowIOSInstructions(false)
        setShowBanner(false)
        localStorage.setItem('pwa-banner-dismissed', new Date().toISOString())
    }

    if (!showBanner || isInstalled) return null

    return (
        <>
            {/* Banner de instalação */}
            <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-4">
                        {/* Ícone */}
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Instalar MeuPlantel
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Adicione à tela inicial para acesso rápido
                            </p>

                            {/* Botões */}
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg font-medium text-sm hover:bg-primary-600 active:scale-[0.98] transition-all"
                                >
                                    Instalar
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                                >
                                    Agora não
                                </button>
                            </div>
                        </div>

                        {/* Botão fechar */}
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de instruções iOS */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Como instalar no iPhone/iPad
                            </h3>
                            <button
                                onClick={handleCloseIOSInstructions}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Passo 1 */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-600 dark:text-primary-400 font-semibold">1</span>
                                </div>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-200">
                                        Toque no botão <strong>Compartilhar</strong>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            (na barra inferior do Safari)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Passo 2 */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-600 dark:text-primary-400 font-semibold">2</span>
                                </div>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-200">
                                        Selecione <strong>"Adicionar à Tela de Início"</strong>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            (role para baixo se necessário)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Passo 3 */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-600 dark:text-primary-400 font-semibold">3</span>
                                </div>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-200">
                                        Toque em <strong>"Adicionar"</strong>
                                    </p>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        (no canto superior direito)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCloseIOSInstructions}
                            className="w-full mt-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 active:scale-[0.98] transition-all"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
