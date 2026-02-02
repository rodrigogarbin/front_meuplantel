/**
 * Página de Configurações
 */

import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { useThemeStore, type ThemeMode } from '@/lib/theme'
import { useAuthStore } from '@/features/auth/authStore'

// Ícones
function SunIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )
}

function MoonIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    )
}

function ComputerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    )
}

function LogoutIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    )
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
}

function BirdIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
}

const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <SunIcon className="w-5 h-5" /> },
    { value: 'dark', label: 'Escuro', icon: <MoonIcon className="w-5 h-5" /> },
    { value: 'system', label: 'Sistema', icon: <ComputerIcon className="w-5 h-5" /> },
]

export function ConfigPage() {
    const navigate = useNavigate()
    const { mode, setMode } = useThemeStore()
    const { user, logout } = useAuthStore()
    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <>
            <Topbar title="Configurações" />

            <main className="page-content">
                <div className="p-4 space-y-6">
                    {/* Usuário */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Conta
                        </h2>
                        <div className="section-card">
                            <button
                                onClick={() => navigate('/config/perfil')}
                                className="w-full flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {user?.nome?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {user?.nome || 'Usuário'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {user?.email || user?.username}
                                    </p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </section>

                    {/* Cadastros */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Cadastros
                        </h2>
                        <div className="section-card">
                            <button
                                onClick={() => navigate('/config/especies')}
                                className="w-full flex items-center justify-between py-3 text-gray-700 dark:text-gray-200"
                            >
                                <span className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                        <BirdIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium">Espécies</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie suas espécies</p>
                                    </div>
                                </span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </section>

                    {/* Aparência */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Aparência
                        </h2>
                        <div className="section-card space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Escolha o tema da interface
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {themeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setMode(option.value)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${mode === option.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className={`${mode === option.value
                                            ? 'text-blue-500'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {option.icon}
                                        </div>
                                        <span className={`text-sm font-medium ${mode === option.value
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {option.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Sobre */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Sobre
                        </h2>
                        <div className="section-card space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Versão</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">1.0.0</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Desenvolvido por</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">MeuPlantel</span>
                            </div>
                        </div>
                    </section>

                    {/* Administração - apenas para admins */}
                    {user?.is_admin && (
                        <section>
                            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                Administração
                            </h2>
                            <div className="section-card">
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="w-full flex items-center justify-between py-3 text-gray-700 dark:text-gray-200"
                                >
                                    <span className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Gerenciar Usuários</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Impersonar e administrar contas</p>
                                        </div>
                                    </span>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Ações */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Ações
                        </h2>
                        <div className="section-card">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between py-3 text-red-600 dark:text-red-400 font-medium"
                            >
                                <span className="flex items-center gap-3">
                                    <LogoutIcon className="w-5 h-5" />
                                    Sair da conta
                                </span>
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </section>
                </div>
            </main>

        </>
    )
}
