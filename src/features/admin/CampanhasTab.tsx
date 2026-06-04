import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getCampanhaTemplates, enviarCampanha } from './adminApi'
import type { CampanhaTemplate, AdminUsuario, VersaoFilter } from './adminApi'
import { api } from '@/lib/api'
import { Toast, useToast } from '@/components/ui'

// Cards dos templates
function TemplateCard({
    template,
    onClick,
}: {
    template: CampanhaTemplate
    onClick: () => void
}) {
    const icone = template.id === 'saudade' ? '🐦' : '🚀'

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
        >
            <div className="flex items-start gap-3">
                <span className="text-3xl leading-none mt-0.5" aria-hidden="true">{icone}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{template.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {template.descricao}
                    </p>
                    {template.filtro_sugerido && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            Sugerido: {template.filtro_sugerido}
                        </span>
                    )}
                </div>
                <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    )
}

export function CampanhasTab() {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [templateSelecionado, setTemplateSelecionado] = useState<CampanhaTemplate | null>(null)
    const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
    const { toast, showToast, hideToast } = useToast()

    // Filtros da etapa 2
    const [filtroVersao, setFiltroVersao] = useState<VersaoFilter>('')
    const [filtroInativo, setFiltroInativo] = useState<number | null>(null)
    const [filtroSemPassaros, setFiltroSemPassaros] = useState(false)
    const [busca, setBusca] = useState('')

    const { data: templates, isLoading: isLoadingTemplates, isError: isErrorTemplates } = useQuery({
        queryKey: ['admin', 'campanhas', 'templates'],
        queryFn: getCampanhaTemplates,
        staleTime: 5 * 60 * 1000,
    })

    // Busca usuários assim que chega na etapa 2; re-busca quando filtro muda
    const { data: todosUsuarios, isLoading: isLoadingUsuarios } = useQuery({
        queryKey: ['admin', 'campanhas', 'usuarios', filtroVersao, filtroInativo, filtroSemPassaros],
        queryFn: async () => {
            const params = new URLSearchParams({ per_page: '500' })
            if (filtroVersao) params.set('versao', filtroVersao)
            if (filtroInativo) params.set('inativo_dias', String(filtroInativo))
            if (filtroSemPassaros) params.set('sem_passaros', '1')
            const { data } = await api.get(`/api/v1/admin/usuarios?${params}`)
            const lista: AdminUsuario[] = data.data ?? []
            return lista.filter(u => u.email && u.email.trim() !== '')
        },
        enabled: step >= 2,
        staleTime: 60 * 1000,
    })

    // Filtro de busca textual aplicado client-side
    const usuariosVisiveis = useMemo(() => {
        if (!todosUsuarios) return []
        const q = busca.trim().toLowerCase()
        if (!q) return todosUsuarios
        return todosUsuarios.filter(u =>
            u.nome?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q)
        )
    }, [todosUsuarios, busca])

    // Seleciona todos automaticamente quando a lista muda (filtro de servidor mudou)
    useEffect(() => {
        if (todosUsuarios) {
            setSelecionados(new Set(todosUsuarios.map(u => u.usuario_id)))
        }
    }, [todosUsuarios])

    const { mutate: doEnviar, isPending: isEnviando } = useMutation({
        mutationFn: () => {
            if (!templateSelecionado) throw new Error('Nenhum template selecionado')
            return enviarCampanha(templateSelecionado.id, Array.from(selecionados))
        },
        onSuccess: (resultado) => {
            const partes = [`${resultado.enviados} email${resultado.enviados !== 1 ? 's' : ''} enviado${resultado.enviados !== 1 ? 's' : ''}`]
            if (resultado.sem_email > 0) partes.push(`${resultado.sem_email} sem email`)
            if (resultado.falhas > 0) partes.push(`${resultado.falhas} com falha`)
            showToast(
                `Campanha processada! ${partes.join(' · ')}.`,
                resultado.falhas > 0 ? 'error' : 'success',
            )
            setStep(1)
            setTemplateSelecionado(null)
            setSelecionados(new Set())
            setFiltroVersao('')
            setFiltroInativo(null)
            setFiltroSemPassaros(false)
            setBusca('')
        },
        onError: () => {
            showToast('Erro ao enviar a campanha. Tente novamente.', 'error')
        },
    })

    const handleEscolherTemplate = (template: CampanhaTemplate) => {
        setTemplateSelecionado(template)
        setSelecionados(new Set())
        setFiltroVersao('')
        setFiltroInativo(null)
        setFiltroSemPassaros(false)
        setBusca('')
        setStep(2)
    }

    const handleToggleUsuario = (id: number) => {
        setSelecionados(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSelecionarTodos = () => {
        if (!todosUsuarios) return
        setSelecionados(new Set(todosUsuarios.map(u => u.usuario_id)))
    }

    const handleDeselecionarTodos = () => setSelecionados(new Set())

    // Seleciona apenas os visíveis (após busca textual)
    const handleSelecionarVisiveis = () => {
        setSelecionados(prev => {
            const next = new Set(prev)
            usuariosVisiveis.forEach(u => next.add(u.usuario_id))
            return next
        })
    }

    const handleToggleFiltroInativo = (dias: number) => {
        setFiltroInativo(prev => (prev === dias ? null : dias))
    }

    const handleToggleFiltroVersao = (v: 'v1') => {
        setFiltroVersao(prev => (prev === v ? '' : v))
    }

    const usuariosSelecionadosDetalhes = todosUsuarios?.filter(u => selecionados.has(u.usuario_id)) ?? []

    const filtrosAtivos = filtroVersao !== '' || filtroInativo !== null || filtroSemPassaros

    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

            {/* Indicador de etapas */}
            <div className="flex items-center gap-2">
                {([1, 2, 3] as const).map((n) => (
                    <div key={n} className="flex items-center gap-2 flex-1">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                                step >= n
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            }`}
                        >
                            {step > n ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : n}
                        </div>
                        {n < 3 && (
                            <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > n ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* --- Etapa 1: Escolher template --- */}
            {step === 1 && (
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        Escolher template
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Selecione o modelo de email que deseja enviar.
                    </p>

                    {isLoadingTemplates && (
                        <div className="space-y-3">
                            {[0, 1].map(i => (
                                <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {isErrorTemplates && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                            Erro ao carregar templates. Verifique sua conexao e tente novamente.
                        </div>
                    )}

                    {!isLoadingTemplates && !isErrorTemplates && templates && templates.length === 0 && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm text-center">
                            Nenhum template disponivel.
                        </div>
                    )}

                    {!isLoadingTemplates && templates && templates.length > 0 && (
                        <div className="space-y-3">
                            {templates.map(t => (
                                <TemplateCard key={t.id} template={t} onClick={() => handleEscolherTemplate(t)} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* --- Etapa 2: Destinatários --- */}
            {step === 2 && templateSelecionado && (
                <section className="space-y-5">
                    {/* Cabeçalho com voltar */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setStep(1); setSelecionados(new Set()) }}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Voltar
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                Template: <span className="font-medium text-gray-800 dark:text-gray-200">{templateSelecionado.nome}</span>
                            </p>
                        </div>
                    </div>

                    {/* Busca + filtros */}
                    <div className="space-y-3">
                        {/* Campo de busca */}
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                            </svg>
                            <input
                                type="text"
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                placeholder="Buscar por nome, email ou username..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {busca && (
                                <button
                                    onClick={() => setBusca('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Chips de filtro */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 self-center mr-1">Filtros:</span>
                            {(
                                [
                                    { label: 'Só v1', action: () => handleToggleFiltroVersao('v1'), active: filtroVersao === 'v1' },
                                    { label: 'Inativos 30d', action: () => handleToggleFiltroInativo(30), active: filtroInativo === 30 },
                                    { label: 'Inativos 60d', action: () => handleToggleFiltroInativo(60), active: filtroInativo === 60 },
                                    { label: 'Sem pássaros', action: () => setFiltroSemPassaros(prev => !prev), active: filtroSemPassaros },
                                ] as { label: string; action: () => void; active: boolean }[]
                            ).map(f => (
                                <button
                                    key={f.label}
                                    onClick={f.action}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        f.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {f.active && (
                                        <span className="mr-1">✕</span>
                                    )}
                                    {f.label}
                                </button>
                            ))}
                            {filtrosAtivos && (
                                <button
                                    onClick={() => { setFiltroVersao(''); setFiltroInativo(null); setFiltroSemPassaros(false) }}
                                    className="px-3 py-1 rounded-full text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista de usuários */}
                    {isLoadingUsuarios ? (
                        <div className="space-y-2">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                            ))}
                        </div>
                    ) : todosUsuarios && todosUsuarios.length === 0 ? (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm text-center">
                            Nenhum usuario encontrado{filtrosAtivos ? ' para estes filtros' : ''}.
                        </div>
                    ) : todosUsuarios ? (
                        <>
                            {/* Contadores e ações em massa */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {busca
                                        ? `${usuariosVisiveis.length} de ${todosUsuarios.length} exibidos`
                                        : `${todosUsuarios.length} usuário${todosUsuarios.length !== 1 ? 's' : ''}`
                                    }
                                    {' · '}
                                    <span className="font-medium">{selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}</span>
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={busca ? handleSelecionarVisiveis : handleSelecionarTodos}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    >
                                        {busca ? 'Sel. visíveis' : 'Todos'}
                                    </button>
                                    <button
                                        onClick={handleDeselecionarTodos}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                                    >
                                        Nenhum
                                    </button>
                                </div>
                            </div>

                            {/* Lista scrollavel */}
                            <div className="section-card divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                                {usuariosVisiveis.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                                        Nenhum resultado para "{busca}"
                                    </p>
                                ) : (
                                    usuariosVisiveis.map(u => (
                                        <label
                                            key={u.usuario_id}
                                            className="flex items-center gap-3 py-3 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selecionados.has(u.usuario_id)}
                                                onChange={() => handleToggleUsuario(u.usuario_id)}
                                                className="w-4 h-4 accent-blue-600 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {u.nome || u.username}
                                                    {!u.usa_v2 && (
                                                        <span className="ml-1.5 px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs rounded">v1</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {u.email}
                                                </p>
                                            </div>
                                            {u.ultimo_login && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block">
                                                    {new Date(u.ultimo_login).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>
                        </>
                    ) : null}

                    {/* Botão Próximo */}
                    {selecionados.size > 0 && (
                        <button
                            onClick={() => setStep(3)}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Próximo — {selecionados.size} destinatário{selecionados.size !== 1 ? 's' : ''}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </section>
            )}

            {/* --- Etapa 3: Revisar e Enviar --- */}
            {step === 3 && templateSelecionado && (
                <section className="space-y-5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setStep(2)}
                            disabled={isEnviando}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Voltar
                        </button>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Revisar e enviar
                    </h2>

                    {/* Resumo */}
                    <div className="section-card space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Template</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{templateSelecionado.nome}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Destinatarios</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {selecionados.size} usuario{selecionados.size !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lista de destinatários */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Lista de destinatarios
                        </h3>
                        <div className="section-card divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                            {usuariosSelecionadosDetalhes.map(u => (
                                <div key={u.usuario_id} className="flex items-center gap-3 py-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                            {(u.nome || u.username).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {u.nome || u.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botão de envio */}
                    <button
                        onClick={() => doEnviar()}
                        disabled={isEnviando || selecionados.size === 0}
                        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isEnviando ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Enviar campanha para {selecionados.size} usuario{selecionados.size !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </section>
            )}
        </div>
    )
}
