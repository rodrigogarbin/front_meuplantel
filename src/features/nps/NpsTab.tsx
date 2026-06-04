import { useState, useRef, useCallback, useEffect } from 'react'
import { useNpsResultados, useEnviarNpsEmail, type NpsResposta } from './npsApi'
import { useAdminUsuariosInfinite } from '@/features/admin/adminApi'
import { Toast, useToast } from '@/components/ui'

function NpsScoreDisplay({ score }: { score: number | null }) {
    if (score === null) return <span className="text-gray-400">N/A</span>
    const color =
        score >= 50 ? 'text-green-600 dark:text-green-400' :
        score >= 0  ? 'text-yellow-600 dark:text-yellow-400' :
                     'text-red-600 dark:text-red-400'
    const sign = score > 0 ? '+' : ''
    return <span className={`font-bold text-3xl ${color}`}>{sign}{score}</span>
}

function DistribuicaoBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
        </div>
    )
}

function NotaBadge({ nota }: { nota: number }) {
    const color =
        nota >= 9 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
        nota >= 7 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    return (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${color}`}>
            {nota}
        </span>
    )
}

function RespostasSection({ respostas }: { respostas: NpsResposta[] }) {
    const [expanded, setExpanded] = useState(false)
    const visible = expanded ? respostas : respostas.slice(0, 5)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Respostas ({respostas.length})
                </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {visible.map((r) => (
                    <div key={r.nps_resposta_id} className="px-4 py-3 flex items-start gap-3">
                        <NotaBadge nota={r.nota} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {r.usuario?.nome ?? 'Usuário desconhecido'}
                                </span>
                                <span className="text-xs text-gray-400">{r.usuario?.email}</span>
                                <span className="text-xs text-gray-400 ml-auto">
                                    {new Date(r.dt_resposta).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            {r.sugestao ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.sugestao}</p>
                            ) : (
                                <p className="text-xs text-gray-400 mt-1 italic">Sem sugestão</p>
                            )}
                            <span className="text-xs text-gray-400 capitalize">{r.origem}</span>
                        </div>
                    </div>
                ))}
            </div>
            {respostas.length > 5 && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    {expanded ? 'Ver menos' : `Ver mais ${respostas.length - 5} respostas`}
                </button>
            )}
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// Email panel — visible as a top-level section, not collapsed
// ────────────────────────────────────────────────────────────
function EnviarEmailPanel() {
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const { toast, showToast, hideToast } = useToast()
    const enviarEmail = useEnviarNpsEmail()

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350)
        return () => clearTimeout(t)
    }, [search])

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useAdminUsuariosInfinite(debouncedSearch)

    const allUsuarios = data?.pages.flatMap((p) => p.data) ?? []
    const totalCount = data?.pages[0]?.total ?? 0

    // Intersection observer for infinite scroll sentinel
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    const setupObserver = useCallback(() => {
        if (observerRef.current) observerRef.current.disconnect()
        if (!sentinelRef.current || !hasNextPage) return
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage()
                }
            },
            { threshold: 0.1 }
        )
        observerRef.current.observe(sentinelRef.current)
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    useEffect(() => {
        setupObserver()
        return () => observerRef.current?.disconnect()
    }, [setupObserver])

    function toggleUser(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    function toggleAll() {
        if (selectedIds.size === allUsuarios.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(allUsuarios.map((u) => u.usuario_id)))
        }
    }

    function handleSend() {
        if (selectedIds.size === 0) return
        enviarEmail.mutate(
            { user_ids: Array.from(selectedIds) },
            {
                onSuccess: (res: any) => {
                    showToast(`${res.enviados} email(s) enviado(s)${res.falhas > 0 ? `, ${res.falhas} falha(s)` : ''}`, 'success')
                    setSelectedIds(new Set())
                },
                onError: () => showToast('Erro ao enviar emails.', 'error'),
            }
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

            <div className="px-4 pt-4 pb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Enviar pesquisa por email</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {totalCount > 0 ? `${totalCount} usuarios encontrados` : 'Selecione usuarios para enviar a pesquisa NPS.'}
                </p>

                {/* Search */}
                <div className="relative mb-3">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou email..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Select all */}
                {allUsuarios.length > 0 && (
                    <button
                        onClick={toggleAll}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2"
                    >
                        {selectedIds.size === allUsuarios.length ? 'Desmarcar todos' : `Selecionar todos (${allUsuarios.length} carregados)`}
                    </button>
                )}
            </div>

            {/* User list with infinite scroll */}
            <div className="overflow-y-auto max-h-64 px-4 pb-2">
                {isLoading && (
                    <div className="space-y-2 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                )}

                {!isLoading && allUsuarios.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhum usuario encontrado.</p>
                )}

                <div className="space-y-1">
                    {allUsuarios.map((u) => (
                        <label
                            key={u.usuario_id}
                            className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.has(u.usuario_id)}
                                onChange={() => toggleUser(u.usuario_id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{u.nome}</p>
                                {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                            </div>
                        </label>
                    ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="py-2 flex justify-center">
                    {isFetchingNextPage && (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    )}
                </div>
            </div>

            {/* Send button */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={handleSend}
                    disabled={selectedIds.size === 0 || enviarEmail.isPending}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                    {enviarEmail.isPending
                        ? 'Enviando...'
                        : selectedIds.size > 0
                        ? `Enviar para ${selectedIds.size} usuario(s)`
                        : 'Selecione usuarios para enviar'}
                </button>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// Main tab
// ────────────────────────────────────────────────────────────
export function NpsTab() {
    const { data, isLoading } = useNpsResultados()

    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
            </div>
        )
    }

    const total = data?.total ?? 0
    const promotores = Object.entries(data?.distribuicao ?? {}).filter(([k]) => parseInt(k) >= 9).reduce((s, [, v]) => s + v, 0)
    const neutros = Object.entries(data?.distribuicao ?? {}).filter(([k]) => parseInt(k) >= 7 && parseInt(k) <= 8).reduce((s, [, v]) => s + v, 0)
    const detratores = Object.entries(data?.distribuicao ?? {}).filter(([k]) => parseInt(k) <= 6).reduce((s, [, v]) => s + v, 0)

    return (
        <div className="p-4 space-y-4">
            {/* Score */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-6 mb-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NPS Score</p>
                        <NpsScoreDisplay score={data?.nps_score ?? null} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Respostas</p>
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</span>
                    </div>
                    {data?.media != null && (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Media</p>
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.media}</span>
                        </div>
                    )}
                </div>

                {total > 0 ? (
                    <>
                        <DistribuicaoBar label="Promotores (9-10)" count={promotores} total={total} color="bg-green-500" />
                        <DistribuicaoBar label="Neutros (7-8)" count={neutros} total={total} color="bg-yellow-400" />
                        <DistribuicaoBar label="Detratores (0-6)" count={detratores} total={total} color="bg-red-500" />
                    </>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhuma resposta ainda.</p>
                )}
            </div>

            {/* Distribuicao detalhada */}
            {total > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Distribuicao</p>
                    <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                            <div key={n} className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{n}</div>
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {data?.distribuicao?.[String(n)] ?? 0}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Respostas */}
            {(data?.respostas?.length ?? 0) > 0 && (
                <RespostasSection respostas={data!.respostas} />
            )}

            {/* Email panel — always visible */}
            <EnviarEmailPanel />

            {/* Sugestoes */}
            {(data?.sugestoes?.length ?? 0) > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sugestoes recentes</p>
                    <div className="space-y-3">
                        {data!.sugestoes.map((s, idx) => (
                            <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-500">Nota {s.nota}</span>
                                    {s.usuario && <span className="text-xs text-gray-400">— {s.usuario.nome}</span>}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{s.sugestao}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(s.dt_resposta).toLocaleDateString('pt-BR')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NpsTab
