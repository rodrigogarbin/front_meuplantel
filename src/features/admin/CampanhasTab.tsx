import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getCampanhaTemplates, enviarCampanha } from './adminApi'
import type { CampanhaTemplate, AdminUsuario, VersaoFilter } from './adminApi'
import { api } from '@/lib/api'

// Toast simples inline — sem biblioteca externa
interface ToastState {
    message: string
    type: 'success' | 'error'
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div
            className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs w-full transition-all ${
                toast.type === 'success'
                    ? 'bg-green-600 dark:bg-green-700'
                    : 'bg-red-600 dark:bg-red-700'
            }`}
        >
            {toast.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
            <span className="flex-1">{toast.message}</span>
            <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}

// Filtros de destinatários disponíveis
type FiltroKey = 'inativo_30' | 'inativo_60' | 'v1' | 'todos'

interface FiltroOpcao {
    key: FiltroKey
    label: string
    versao: VersaoFilter
    inativoDias?: number
}

const FILTROS: FiltroOpcao[] = [
    { key: 'inativo_30', label: 'Inativos 30 dias', versao: '', inativoDias: 30 },
    { key: 'inativo_60', label: 'Inativos 60 dias', versao: '', inativoDias: 60 },
    { key: 'v1', label: 'Usuários v1', versao: 'v1' },
    { key: 'todos', label: 'Todos com email', versao: '' },
]

// Hook auxiliar para buscar usuários pelo filtro selecionado
function useFiltroUsuarios(filtro: FiltroOpcao | null) {
    return useQuery({
        queryKey: ['admin', 'campanhas', 'usuarios', filtro?.key ?? null],
        queryFn: async () => {
            if (!filtro) return []
            const params = new URLSearchParams()
            params.set('page', '1')
            params.set('per_page', '500')
            if (filtro.versao) params.set('versao', filtro.versao)
            if (filtro.inativoDias) params.set('inativo_dias', String(filtro.inativoDias))
            const { data } = await api.get(`/api/v1/admin/usuarios?${params}`)
            // retorna apenas usuários com email
            const usuarios: AdminUsuario[] = data.data ?? []
            return usuarios.filter(u => u.email && u.email.trim() !== '')
        },
        enabled: filtro !== null,
        staleTime: 60 * 1000,
    })
}

// Cards dos templates — ícones via texto para evitar dependências extras
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
    const [filtroSelecionado, setFiltroSelecionado] = useState<FiltroOpcao | null>(null)
    const [filtroAtivo, setFiltroAtivo] = useState<FiltroOpcao | null>(null)
    const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
    const [toast, setToast] = useState<ToastState | null>(null)

    const { data: templates, isLoading: isLoadingTemplates, isError: isErrorTemplates } = useQuery({
        queryKey: ['admin', 'campanhas', 'templates'],
        queryFn: getCampanhaTemplates,
        staleTime: 5 * 60 * 1000,
    })

    const { data: usuariosFiltrados, isLoading: isLoadingUsuarios } = useFiltroUsuarios(filtroAtivo)

    const { mutate: doEnviar, isPending: isEnviando } = useMutation({
        mutationFn: () => {
            if (!templateSelecionado) throw new Error('Nenhum template selecionado')
            return enviarCampanha(templateSelecionado.id, Array.from(selecionados))
        },
        onSuccess: (resultado) => {
            setToast({
                message: `Campanha enviada com sucesso! ${resultado.enviados} email${resultado.enviados !== 1 ? 's' : ''} enviado${resultado.enviados !== 1 ? 's' : ''}${resultado.sem_email > 0 ? ` (${resultado.sem_email} sem email)` : ''}.`,
                type: 'success',
            })
            // Resetar para etapa 1
            setStep(1)
            setTemplateSelecionado(null)
            setFiltroSelecionado(null)
            setFiltroAtivo(null)
            setSelecionados(new Set())
        },
        onError: () => {
            setToast({ message: 'Erro ao enviar a campanha. Tente novamente.', type: 'error' })
        },
    })

    // Quando os usuários carregam, pré-seleciona todos
    useEffect(() => {
        if (usuariosFiltrados) {
            setSelecionados(new Set(usuariosFiltrados.map(u => u.usuario_id)))
        }
    }, [usuariosFiltrados])

    const handleEscolherTemplate = (template: CampanhaTemplate) => {
        setTemplateSelecionado(template)
        setFiltroSelecionado(null)
        setFiltroAtivo(null)
        setSelecionados(new Set())
        setStep(2)
    }

    const handleEscolherFiltro = (filtro: FiltroOpcao) => {
        setFiltroSelecionado(filtro)
        setFiltroAtivo(filtro)
        setSelecionados(new Set())
    }

    const handleToggleUsuario = (id: number) => {
        setSelecionados(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const handleSelecionarTodos = () => {
        if (!usuariosFiltrados) return
        setSelecionados(new Set(usuariosFiltrados.map(u => u.usuario_id)))
    }

    const handleDeselecionarTodos = () => {
        setSelecionados(new Set())
    }

    const usuariosSelecionadosDetalhes = usuariosFiltrados?.filter(u => selecionados.has(u.usuario_id)) ?? []

    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
            {/* Toast */}
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

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

            {/* --- Etapa 2: Filtrar destinatários --- */}
            {step === 2 && templateSelecionado && (
                <section className="space-y-5">
                    {/* Cabeçalho com voltar */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setStep(1); setFiltroSelecionado(null); setFiltroAtivo(null); setSelecionados(new Set()) }}
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

                    {/* Filtros */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Filtrar destinatarios
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                            {FILTROS.map(filtro => (
                                <button
                                    key={filtro.key}
                                    onClick={() => handleEscolherFiltro(filtro)}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium text-center transition-all active:scale-[0.97] ${
                                        filtroSelecionado?.key === filtro.key
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {filtro.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de usuários */}
                    {filtroAtivo && (
                        <div>
                            {isLoadingUsuarios ? (
                                <div className="space-y-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                                    ))}
                                </div>
                            ) : usuariosFiltrados && usuariosFiltrados.length === 0 ? (
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm text-center">
                                    Nenhum usuario encontrado para este filtro.
                                </div>
                            ) : usuariosFiltrados ? (
                                <>
                                    {/* Acoes de selecao */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {selecionados.size} de {usuariosFiltrados.length} selecionado{selecionados.size !== 1 ? 's' : ''}
                                        </span>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSelecionarTodos}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                Todos
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
                                    <div className="section-card divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
                                        {usuariosFiltrados.map(u => (
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
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* Botao Proximo */}
                    {selecionados.size > 0 && (
                        <button
                            onClick={() => setStep(3)}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Proximo
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
                    {/* Cabeçalho com voltar */}
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

                    {/* Lista de destinatarios selecionados */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Lista de destinatarios
                        </h3>
                        <div className="section-card divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                            {usuariosSelecionadosDetalhes.map((u, index) => (
                                <div
                                    key={u.usuario_id}
                                    className={`flex items-center gap-3 py-2.5 ${index === 0 ? '' : ''}`}
                                >
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

                    {/* Botao de envio */}
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
