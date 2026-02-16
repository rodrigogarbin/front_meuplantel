/**
 * Layout principal com navegação bottom
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { ImpersonationBanner } from '@/features/admin'
import { useIsImpersonating } from '@/features/auth/authStore'
import { useEmailVerificationStatus } from '@/features/auth'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const isImpersonating = useIsImpersonating()
    const { data: emailStatus } = useEmailVerificationStatus()
    const hasConfigBadge = emailStatus && emailStatus.email && !emailStatus.email_verified

    const isActive = (path: string) => location.pathname === path

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
                        className={`flex flex-col items-center py-2 px-4 transition-colors ${isActive('/posturas') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth={isActive('/posturas') ? 2.5 : 1.5}>
                            <path d="M12 2C8.5 2 6 6 6 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
                        </svg>
                        <span className={`text-xs mt-1 ${isActive('/posturas') ? 'font-semibold' : ''}`}>Posturas</span>
                    </button>
                </div>
            </nav>
        </div>
    )
}
