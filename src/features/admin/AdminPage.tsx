import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { useAuthStore } from '@/features/auth/authStore'
import { useAdminUsuarios, impersonateUser } from './adminApi'

export function AdminPage() {
    const navigate = useNavigate()
    const { user, impersonate } = useAuthStore()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

    const { data, isLoading } = useAdminUsuarios(debouncedSearch)

    const handleSearchChange = (value: string) => {
        setSearch(value)
        if (debounceTimer) clearTimeout(debounceTimer)
        const timer = setTimeout(() => setDebouncedSearch(value), 300)
        setDebounceTimer(timer)
    }

    const handleImpersonate = async (id: number) => {
        setLoadingId(id)
        try {
            const result = await impersonateUser(id)
            impersonate(
                result.access_token,
                {
                    usuario_id: result.user.usuario_id,
                    nome: result.user.name,
                    username: result.user.name,
                    email: result.user.email,
                    needs_email: result.user.needs_email,
                    email_verified: result.user.email_verified,
                    is_admin: result.user.is_admin,
                },
                result.admin_token,
                result.expires_in
            )
            navigate('/')
        } catch {
            setLoadingId(null)
        }
    }

    return (
        <>
            <Topbar title="Administração" showBack onBack={() => navigate('/config')} />

            <main className="page-content">
                <div className="p-4 space-y-4">
                    {/* Busca */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou username..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Lista de usuários */}
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data?.data?.map((u) => (
                                <div
                                    key={u.usuario_id}
                                    className="section-card flex items-center gap-3"
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_admin ? 'bg-amber-100 dark:bg-amber-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                        <span className={`text-sm font-bold ${u.is_admin ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {u.nome?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {u.nome}
                                            </p>
                                            {u.is_admin && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {u.email || u.username}
                                        </p>
                                    </div>

                                    {/* Botão impersonar */}
                                    {u.usuario_id !== user?.usuario_id && (
                                        <button
                                            onClick={() => handleImpersonate(u.usuario_id)}
                                            disabled={loadingId !== null}
                                            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                                        >
                                            {loadingId === u.usuario_id ? (
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                'Entrar como'
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}

                            {data?.data?.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    Nenhum usuário encontrado
                                </p>
                            )}

                            {/* Paginação info */}
                            {data && data.total > 0 && (
                                <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
                                    {data.total} usuário{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
