/**
 * Componente Topbar
 * Header fixo no topo com título e ações
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useUser } from '@/features/auth'
import { useEmailVerificationStatus } from '@/features/auth'

interface TopbarProps {
    title: string
    showBack?: boolean
    onBack?: () => void
}

export function Topbar({ title, showBack, onBack }: TopbarProps) {
    const navigate = useNavigate()
    const user = useUser()
    const logout = useAuthStore((state) => state.logout)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { data: emailStatus } = useEmailVerificationStatus()
    const hasConfigBadge = emailStatus && emailStatus.email && !emailStatus.email_verified

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

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdownOpen])

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

            {/* User menu dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 transition-colors active:scale-95 relative"
                >
                    <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        {user?.nome?.split(' ')[0] ?? 'Usuário'}
                    </span>
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user?.nome?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    {hasConfigBadge && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                    <svg
                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                    <div className="fixed sm:absolute right-4 sm:right-0 sm:mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50" style={{ top: 'calc(3.5rem + env(safe-area-inset-top) + 0.5rem)' }}>
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {user?.nome ?? 'Usuário'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.email ?? ''}
                            </p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false)
                                    navigate('/config')
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 relative"
                            >
                                {hasConfigBadge && (
                                    <span className="absolute left-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Configurações</span>
                            </button>

                            <hr className="my-1 border-gray-100 dark:border-gray-700" />

                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false)
                                    handleLogout()
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Sair</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
