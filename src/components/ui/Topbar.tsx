/**
 * Componente Topbar
 * Header que rola junto com o conteúdo. Apenas a barra de busca fica sticky.
 * A safe area do notch/relógio é tratada pelo div raiz do MainLayout.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNaoLidasCount } from '@/features/notificacoes/notificacoesApi'
import { NotificacoesSheet } from '@/features/notificacoes/NotificacoesSheet'

interface TopbarProps {
    title: string
    showBack?: boolean
    onBack?: () => void
}

export function Topbar({ title, showBack, onBack }: TopbarProps) {
    const navigate = useNavigate()
    const [isNotificacoesOpen, setIsNotificacoesOpen] = useState(false)
    const { data: naoLidasCount } = useNaoLidasCount()
    const countDisplay = (naoLidasCount ?? 0) > 99 ? '99+' : naoLidasCount

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            navigate(-1)
        }
    }

    return (
        <>
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {/* Inner div com altura fixa — separado do header para não conflitar com safe-area */}
            <div className="h-14 px-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    {showBack && (
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</h1>
                </div>

                {/* Botão sino de notificações */}
                <button
                    onClick={() => setIsNotificacoesOpen(true)}
                    className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
                    aria-label="Notificações"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {(naoLidasCount ?? 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                            {countDisplay}
                        </span>
                    )}
                </button>
            </div>
        </header>

        {/* Sheet de notificações */}
        <NotificacoesSheet
            isOpen={isNotificacoesOpen}
            onClose={() => setIsNotificacoesOpen(false)}
        />
        </>
    )
}
