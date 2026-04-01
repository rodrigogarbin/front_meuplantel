/**
 * Layout principal com navegação bottom
 */

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ImpersonationBanner } from '@/features/admin'
import { useIsImpersonating } from '@/features/auth/authStore'
import { usePosturasPendentes } from '@/features/posturas/posturasApi'
import { useAuthStore } from '@/features/auth/authStore'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const isImpersonating = useIsImpersonating()
    const hasPosturasPendentes = usePosturasPendentes()
    const { user } = useAuthStore()
    const [showMaisMenu, setShowMaisMenu] = useState(false)

    const isActive = (path: string) => location.pathname === path

    const maisRoutes = ['/config', '/admin', '/medicamentos', '/doencas', '/sintomas', '/gestao', '/chat']
    const isMaisActive = maisRoutes.some(p => location.pathname.startsWith(p))

    function navigateTo(path: string) {
        setShowMaisMenu(false)
        navigate(path)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col safe-top">
            {/* Banner de impersonação */}
            <ImpersonationBanner />

            {/* Conteúdo principal */}
            <main className={`flex-1 pb-20 ${isImpersonating ? 'pt-10' : ''}`}>
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50">
                <div className="flex justify-around max-w-md mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex flex-col items-center py-2 px-4 transition-colors ${isActive('/') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/') ? 2.5 : 1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className={`text-xs mt-1 ${isActive('/') ? 'font-semibold' : ''}`}>Início</span>
                    </button>

                    <button
                        onClick={() => navigate('/passaros')}
                        className={`flex flex-col items-center py-2 px-4 transition-colors ${isActive('/passaros') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/passaros') ? 2.5 : 1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 5.4 8 6.6 8 8c0 1.4.4 2.6 1 3.5.3.4.6.8 1 1.1V15l-2 2v2h8v-2l-2-2v-2.4c.4-.3.7-.7 1-1.1.6-.9 1-2.1 1-3.5 0-1.4-.4-2.6-1-3.5-.6-.9-1.8-1.5-3-1.5z" />
                        </svg>
                        <span className={`text-xs mt-1 ${isActive('/passaros') ? 'font-semibold' : ''}`}>Plantel</span>
                    </button>

                    <button
                        onClick={() => navigate('/casais')}
                        className={`flex flex-col items-center py-2 px-4 transition-colors ${isActive('/casais') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/casais') ? 2.5 : 1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <span className={`text-xs mt-1 ${isActive('/casais') ? 'font-semibold' : ''}`}>Casais</span>
                    </button>

                    <button
                        onClick={() => navigate('/posturas')}
                        className={`flex flex-col items-center py-2 px-4 transition-colors relative ${isActive('/posturas') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {/* Badge de notificação */}
                        {hasPosturasPendentes && (
                            <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth={isActive('/posturas') ? 2.5 : 1.5}>
                            <path d="M12 2C8.5 2 6 6 6 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
                        </svg>
                        <span className={`text-xs mt-1 ${isActive('/posturas') ? 'font-semibold' : ''}`}>Posturas</span>
                    </button>

                    {/* Botão Mais */}
                    <button
                        onClick={() => setShowMaisMenu(true)}
                        className={`flex flex-col items-center py-2 px-4 transition-colors ${isMaisActive || showMaisMenu ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isMaisActive || showMaisMenu ? 2.5 : 1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className={`text-xs mt-1 ${isMaisActive || showMaisMenu ? 'font-semibold' : ''}`}>Mais</span>
                    </button>
                </div>
            </nav>

            {/* Menu "Mais" — Bottom Sheet */}
            {showMaisMenu && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/40 z-[60]"
                        onClick={() => setShowMaisMenu(false)}
                    />

                    {/* Painel */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl z-[70] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        </div>

                        <div className="px-2 pb-2">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-3">
                                Menu
                            </h2>

                            <div className="flex flex-col">
                                {/* Assistente */}
                                <button
                                    onClick={() => navigateTo('/chat')}
                                    className="flex items-center gap-4 px-3 py-3.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">Assistente</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Alertas e informações do plantel</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                    {/* Gestão do Plantel — apenas admin */}
                                {user?.is_admin && (
                                <button
                                    onClick={() => navigateTo('/gestao')}
                                    className="flex items-center gap-4 px-3 py-3.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">Gestão do Plantel</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Estatísticas e análise de reprodutores</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                )}

                                {/* Medicamentos */}
                                <button
                                    onClick={() => navigateTo('/medicamentos')}
                                    className="flex items-center gap-4 px-3 py-3.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">Medicamentos</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciar medicamentos e doenças</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Espécies */}
                                <button
                                    onClick={() => navigateTo('/config/especies')}
                                    className="flex items-center gap-4 px-3 py-3.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">Espécies</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie suas espécies</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Gerenciar Usuários — apenas admin */}
                                {user?.is_admin && (
                                    <button
                                        onClick={() => navigateTo('/admin')}
                                        className="flex items-center gap-4 px-3 py-3.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-base font-medium text-gray-900 dark:text-gray-100">Gerenciar Usuários</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Impersonar e administrar contas</p>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}

                                <div className="mx-3 border-t border-gray-100 dark:border-gray-700 my-1" />

                                {/* Configurações */}
                                <button
                                    onClick={() => navigateTo('/config')}
                                    className="flex items-center gap-4 px-3 py-3.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">Configurações</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Tema, perfil e conta</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
