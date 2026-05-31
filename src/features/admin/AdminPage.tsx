import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { useAuthStore } from '@/features/auth/authStore'
import { useAdminUsuarios, useAdminStats, impersonateUser, toggleVersao, deleteUsuario, bulkDeleteUsuarios } from './adminApi'
import type { AdminUsuario, VersaoFilter, SortField, SortOrder } from './adminApi'
import { useLoginStats } from './loginStatsApi'
import { useQueryClient } from '@tanstack/react-query'
import { StatCard, StatCardSkeleton } from '@/features/dashboard/StatCard'
import { CampanhasTab } from './CampanhasTab'
import { FuncionalidadesTab } from './FuncionalidadesTab'
import { UsuarioFeatureFlagsPanel } from './UsuarioFeatureFlagsPanel'

// Ícones inline para os stat cards
function UsersIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )
}

function BirdIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 5.4 8 6.6 8 8c0 1.4.4 2.6 1 3.5.3.4.6.8 1 1.1V15l-2 2v2h8v-2l-2-2v-2.4c.4-.3.7-.7 1-1.1.6-.9 1-2.1 1-3.5 0-1.4-.4-2.6-1-3.5-.6-.9-1.8-1.5-3-1.5z" />
        </svg>
    )
}

function HeartIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
}

function EggIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <ellipse cx="12" cy="13" rx="7" ry="9" />
            <path strokeLinecap="round" d="M12 4V2" />
        </svg>
    )
}

function MailIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    )
}

function StarIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    )
}

type Tab = 'dashboard' | 'usuarios' | 'logins' | 'campanhas' | 'funcionalidades'

export function AdminPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, impersonate } = useAuthStore()
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
    const [deletingUser, setDeletingUser] = useState<AdminUsuario | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [page, setPage] = useState(1)
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [versaoFilter, setVersaoFilter] = useState<VersaoFilter>('')
    const [sortField, setSortField] = useState<SortField>('nome')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [expandedUserId, setExpandedUserId] = useState<number | null>(null)

    const { data: usuariosData, isLoading: isLoadingUsuarios } = useAdminUsuarios(debouncedSearch, page, versaoFilter, sortField, sortOrder)
    const { data: stats, isLoading: isLoadingStats } = useAdminStats()
    const { data: loginStats, isLoading: isLoadingLoginStats } = useLoginStats(30)

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setPage(1)
        if (debounceTimer) clearTimeout(debounceTimer)
        const timer = setTimeout(() => setDebouncedSearch(value), 300)
        setDebounceTimer(timer)
    }

    const handleVersaoFilter = (v: VersaoFilter) => {
        setVersaoFilter(v)
        setPage(1)
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
        setPage(1)
    }

    const handleImpersonate = async (id: number) => {
        setLoadingId(id)
        try {
            const result = await impersonateUser(id)
            impersonate(
                {
                    usuario_id:     result.user.usuario_id,
                    nome:           result.user.name,
                    username:       result.user.name,
                    email:          result.user.email,
                    needs_email:    result.user.needs_email,
                    email_verified: result.user.email_verified,
                    is_admin:       result.user.is_admin,
                },
                result.expires_in
            )
            navigate('/')
        } catch {
            setLoadingId(null)
        }
    }

    const handleToggleVersao = async (id: number) => {
        setTogglingId(id)
        try {
            await toggleVersao(id)
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })
        } catch {
            // ignore
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deletingUser) return
        setIsDeleting(true)
        try {
            await deleteUsuario(deletingUser.usuario_id)
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            setDeletingUser(null)
        } catch {
            // ignore
        } finally {
            setIsDeleting(false)
        }
    }

    const handleToggleSelectUser = (userId: number) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev)
            if (newSet.has(userId)) {
                newSet.delete(userId)
            } else {
                newSet.add(userId)
            }
            return newSet
        })
    }

    const handleSelectAll = () => {
        if (!usuariosData?.data) return
        const allIds = usuariosData.data
            .filter(u => u.usuario_id !== user?.usuario_id)
            .map(u => u.usuario_id)
        setSelectedUsers(new Set(allIds))
    }

    const handleDeselectAll = () => {
        setSelectedUsers(new Set())
    }

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true)
        try {
            // Chama o endpoint otimizado de exclusão em lote
            await bulkDeleteUsuarios(Array.from(selectedUsers))
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            setSelectedUsers(new Set())
            setShowBulkDeleteModal(false)
        } catch {
            // ignore
        } finally {
            setIsBulkDeleting(false)
        }
    }

    return (
        <>
            <Topbar title="Administração" showBack onBack={() => navigate('/config')} />

            <main className="page-content">
                {/* Abas */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                            activeTab === 'dashboard'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                            activeTab === 'usuarios'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('logins')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                            activeTab === 'logins'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Logins
                    </button>
                    <button
                        onClick={() => setActiveTab('campanhas')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                            activeTab === 'campanhas'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Campanhas
                    </button>
                    <button
                        onClick={() => setActiveTab('funcionalidades')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                            activeTab === 'funcionalidades'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Funcional.
                    </button>
                </div>

                {/* Conteúdo da aba Dashboard */}
                {activeTab === 'dashboard' && (
                    <div className="p-4 space-y-6">
                        {/* Seção: Usuários */}
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Usuários</h2>
                            {isLoadingStats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </div>
                            ) : stats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard
                                        title="Total"
                                        value={stats.usuarios.total}
                                        icon={<UsersIcon />}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="Novos este mês"
                                        value={stats.usuarios.novos_mes}
                                        icon={<StarIcon />}
                                        color="green"
                                    />
                                    <StatCard
                                        title="E-mail verificado"
                                        value={stats.usuarios.email_verificado}
                                        subtitle={`de ${stats.usuarios.com_email} com e-mail`}
                                        icon={<MailIcon />}
                                        color="purple"
                                    />
                                    <StatCard
                                        title="Versão"
                                        value={`V2: ${stats.usuarios.usa_v2}`}
                                        subtitle={`V1: ${stats.usuarios.usa_v1}`}
                                        icon={<UsersIcon />}
                                        color="yellow"
                                    />
                                </div>
                            ) : null}
                        </section>

                        {/* Seção: Plantel */}
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Plantel Global</h2>
                            {isLoadingStats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </div>
                            ) : stats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard
                                        title="Total Pássaros"
                                        value={stats.passaros.total}
                                        subtitle={`${stats.passaros.no_plantel} no plantel`}
                                        icon={<BirdIcon />}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="Casais Ativos"
                                        value={stats.casais.ativos}
                                        subtitle={`de ${stats.casais.total} total`}
                                        icon={<HeartIcon />}
                                        color="red"
                                    />
                                    <StatCard
                                        title="Posturas do Ano"
                                        value={stats.posturas.ano_atual}
                                        subtitle={`${stats.posturas.total} total`}
                                        icon={<EggIcon />}
                                        color="yellow"
                                    />
                                    <StatCard
                                        title="Por Sexo"
                                        value={`♂ ${stats.passaros.machos}`}
                                        subtitle={`♀ ${stats.passaros.femeas} · ? ${stats.passaros.indefinidos}`}
                                        icon={<BirdIcon />}
                                        color="purple"
                                    />
                                </div>
                            ) : null}
                        </section>

                        {/* Seção: Situação dos pássaros */}
                        {stats && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Situação dos Pássaros</h2>
                                <div className="section-card space-y-3">
                                    <BarItem label="No plantel" value={stats.passaros.no_plantel} total={stats.passaros.total} color="bg-green-500" />
                                    <BarItem label="Vendidos" value={stats.passaros.vendidos} total={stats.passaros.total} color="bg-blue-500" />
                                    <BarItem label="Mortos" value={stats.passaros.mortos} total={stats.passaros.total} color="bg-red-500" />
                                    <BarItem label="Emprestados" value={stats.passaros.emprestados} total={stats.passaros.total} color="bg-amber-500" />
                                </div>
                            </section>
                        )}

                        {/* Seção: Top Usuários */}
                        {stats && stats.top_usuarios.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Top Usuários</h2>
                                <div className="section-card overflow-hidden">
                                    {stats.top_usuarios.map((u, index) => (
                                        <div
                                            key={u.usuario_id}
                                            className={`flex items-center gap-3 py-3 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {u.nome || u.username}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {u.total_passaros} no plantel · {u.total_casais} casal{u.total_casais !== 1 ? 'is' : ''} ativo{u.total_casais !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* Conteúdo da aba Usuários */}
                {activeTab === 'usuarios' && (
                    <div className="space-y-0">
                        {/* Barra de ações em lote */}
                        {selectedUsers.size > 0 && (
                            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                    {selectedUsers.size} usuário{selectedUsers.size !== 1 ? 's' : ''} selecionado{selectedUsers.size !== 1 ? 's' : ''}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeselectAll}
                                        className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Limpar
                                    </button>
                                    <button
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Excluir selecionados
                                    </button>
                                </div>
                            </div>
                        )}

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

                        {/* Filtros e ordenação */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filtro versão */}
                            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                                {(['', 'v1', 'v2'] as VersaoFilter[]).map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => handleVersaoFilter(v)}
                                        className={`px-3 py-1.5 font-medium transition-colors ${
                                            versaoFilter === v
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {v === '' ? 'Todos' : v.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Ordenação */}
                            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                                <button
                                    onClick={() => handleSort('nome')}
                                    className={`px-3 py-1.5 font-medium transition-colors flex items-center gap-1 ${
                                        sortField === 'nome'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Nome
                                    {sortField === 'nome' && (
                                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleSort('dt_criacao')}
                                    className={`px-3 py-1.5 font-medium transition-colors flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${
                                        sortField === 'dt_criacao'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Data
                                    {sortField === 'dt_criacao' && (
                                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Checkbox Selecionar todos */}
                        {usuariosData && usuariosData.data && usuariosData.data.length > 0 && (
                            <label className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                <input
                                    type="checkbox"
                                    checked={usuariosData.data.filter(u => u.usuario_id !== user?.usuario_id).every(u => selectedUsers.has(u.usuario_id))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            handleSelectAll()
                                        } else {
                                            handleDeselectAll()
                                        }
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                Selecionar todos
                            </label>
                        )}

                        {/* Lista de usuários */}
                        {isLoadingUsuarios ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {usuariosData?.data?.map((u) => (
                                    <div
                                        key={u.usuario_id}
                                        className="section-card overflow-hidden"
                                    >
                                        {/* Linha principal do usuário */}
                                        <div className="flex items-center gap-3">
                                        {/* Checkbox */}
                                        {u.usuario_id !== user?.usuario_id && (
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(u.usuario_id)}
                                                onChange={() => handleToggleSelectUser(u.usuario_id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        )}

                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_admin ? 'bg-amber-100 dark:bg-amber-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                            <span className={`text-sm font-bold ${u.is_admin ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {u.nome?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {u.nome}
                                                </p>
                                                {u.is_admin && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                                        Admin
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => handleToggleVersao(u.usuario_id)}
                                                    disabled={togglingId !== null}
                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                                                        u.usa_v2
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}
                                                >
                                                    {togglingId === u.usuario_id ? '...' : u.usa_v2 ? 'V2' : 'V1'}
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {u.email || u.username}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {u.total_passaros} no plantel · {u.total_casais} casal{u.total_casais !== 1 ? 'is' : ''} ativo{u.total_casais !== 1 ? 's' : ''}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                                {/* E-mail verificado */}
                                                {u.email ? (
                                                    u.email_verified_at ? (
                                                        <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            E-mail confirmado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                                            </svg>
                                                            E-mail pendente
                                                        </span>
                                                    )
                                                ) : null}
                                                {/* Separador */}
                                                {u.email && <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>}
                                                {/* Último login */}
                                                {u.ultimo_login ? (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        Login {new Date(u.ultimo_login).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 text-xs text-red-500 dark:text-red-400">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                        Nunca acessou
                                                    </span>
                                                )}
                                            </div>
                                            {u.dt_criacao && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    Desde {new Date(u.dt_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>

                                        {/* Ações */}
                                        {u.usuario_id !== user?.usuario_id && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => handleImpersonate(u.usuario_id)}
                                                    disabled={loadingId !== null}
                                                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                                                >
                                                    {loadingId === u.usuario_id ? (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        'Entrar como'
                                                    )}
                                                </button>
                                                {!u.is_admin && (
                                                    <button
                                                        onClick={() => setDeletingUser(u)}
                                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                                                        title="Excluir usuário"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        </div>

                                        {/* Toggle flags panel */}
                                        <button
                                            onClick={() => setExpandedUserId(expandedUserId === u.usuario_id ? null : u.usuario_id)}
                                            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border-t border-gray-100 dark:border-gray-700 transition-colors"
                                        >
                                            <span>Funcionalidades</span>
                                            <svg className={`w-3 h-3 transition-transform ${expandedUserId === u.usuario_id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedUserId === u.usuario_id && (
                                            <UsuarioFeatureFlagsPanel userId={u.usuario_id} />
                                        )}
                                    </div>
                                ))}

                                {usuariosData?.data?.length === 0 && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        Nenhum usuário encontrado
                                    </p>
                                )}

                                {/* Paginação */}
                                {usuariosData && usuariosData.total > 0 && (
                                    <div className="pt-2 space-y-3">
                                        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                                            {usuariosData.total} usuário{usuariosData.total !== 1 ? 's' : ''} encontrado{usuariosData.total !== 1 ? 's' : ''}
                                        </p>
                                        {usuariosData.last_page > 1 && (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page <= 1}
                                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    Anterior
                                                </button>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {page} / {usuariosData.last_page}
                                                </span>
                                                <button
                                                    onClick={() => setPage(p => Math.min(usuariosData.last_page, p + 1))}
                                                    disabled={page >= usuariosData.last_page}
                                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    Próxima
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                )}

                {/* Conteúdo da aba Logins */}
                {activeTab === 'logins' && (
                    <div className="p-4 space-y-6">
                        {/* Seção: Estatísticas de Login */}
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Últimos 30 dias</h2>
                            {isLoadingLoginStats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </div>
                            ) : loginStats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard
                                        title="Total de Logins"
                                        value={loginStats.total_logins}
                                        icon={<UsersIcon />}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="Bem-sucedidos"
                                        value={loginStats.logins_sucesso}
                                        subtitle={`${((loginStats.logins_sucesso / loginStats.total_logins) * 100).toFixed(1)}%`}
                                        icon={<StarIcon />}
                                        color="green"
                                    />
                                    <StatCard
                                        title="Falhas"
                                        value={loginStats.logins_falha}
                                        subtitle={loginStats.total_logins > 0 ? `${((loginStats.logins_falha / loginStats.total_logins) * 100).toFixed(1)}%` : '0%'}
                                        icon={<MailIcon />}
                                        color="red"
                                    />
                                    <StatCard
                                        title="Usuários Ativos"
                                        value={loginStats.usuarios_ativos}
                                        subtitle={`${loginStats.periodo_dias} dias`}
                                        icon={<UsersIcon />}
                                        color="purple"
                                    />
                                </div>
                            ) : null}
                        </section>

                        {/* Seção: Usuários Mais Ativos */}
                        {loginStats && loginStats.usuarios_mais_ativos.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Usuários Mais Ativos</h2>
                                <div className="section-card overflow-hidden">
                                    {loginStats.usuarios_mais_ativos.slice(0, 10).map((u, index) => (
                                        <div
                                            key={u.usuario_id}
                                            className={`flex items-center gap-3 py-3 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {u.usuario.nome || u.usuario.username}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {u.total_logins} login{u.total_logins !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Seção: Logins por Dia */}
                        {loginStats && loginStats.logins_por_dia.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Logins por Dia</h2>
                                <div className="section-card overflow-hidden">
                                    {loginStats.logins_por_dia.slice(0, 15).map((dia, index) => (
                                        <div
                                            key={dia.data}
                                            className={`py-3 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {dia.total} login{dia.total !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 h-2">
                                                <div
                                                    className="bg-green-500 rounded-l"
                                                    style={{ width: `${dia.total > 0 ? (dia.sucesso / dia.total) * 100 : 0}%` }}
                                                    title={`${dia.sucesso} sucesso`}
                                                />
                                                <div
                                                    className="bg-red-500 rounded-r"
                                                    style={{ width: `${dia.total > 0 ? (dia.falha / dia.total) * 100 : 0}%` }}
                                                    title={`${dia.falha} falhas`}
                                                />
                                            </div>
                                            <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                <span>✓ {dia.sucesso}</span>
                                                <span>✗ {dia.falha}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* Conteúdo da aba Campanhas */}
                {activeTab === 'campanhas' && <CampanhasTab />}

                {/* Conteúdo da aba Funcionalidades */}
                {activeTab === 'funcionalidades' && <FuncionalidadesTab />}
            </main>

            {/* Modal de confirmação de exclusão em lote */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Confirmar exclusão em lote
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Tem certeza que deseja excluir {selectedUsers.size} usuário{selectedUsers.size !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkDeleteModal(false)}
                                disabled={isBulkDeleting}
                                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isBulkDeleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmação de exclusão */}
            {deletingUser && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                            Excluir usuário
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-1">
                            Tem certeza que deseja excluir <strong>{deletingUser.nome}</strong>?
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 text-center mb-6">
                            Todos os dados (pássaros, casais, posturas) serão removidos permanentemente.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Excluindo...
                                    </span>
                                ) : (
                                    'Excluir'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

/** Barra horizontal para visualização de proporção */
function BarItem({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total > 0 ? (value / total) * 100 : 0
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value} ({pct.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}
