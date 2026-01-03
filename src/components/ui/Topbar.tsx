/**
 * Componente Topbar
 * Header fixo no topo com título e ações
 */

import { useNavigate } from 'react-router-dom'
import { useAuthStore, useUser } from '@/features/auth'

interface TopbarProps {
    title: string
    showBack?: boolean
    onBack?: () => void
}

export function Topbar({ title, showBack, onBack }: TopbarProps) {
    const navigate = useNavigate()
    const user = useUser()
    const logout = useAuthStore((state) => state.logout)

    const handleLogout = async () => {
        await logout()
    }

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            navigate(-1)
        }
    }

    return (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between gap-4 safe-area-top">
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

            <div className="flex items-center gap-2">
                {/* User avatar/menu */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        {user?.nome?.split(' ')[0] ?? 'Usuário'}
                    </span>
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user?.nome?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors active:scale-95"
                    title="Sair"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    )
}
