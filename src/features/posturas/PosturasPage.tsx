/**
 * Página de listagem de Posturas
 * Exibe todas as posturas ativas com alertas de ações
 */

import { useState } from 'react'
import { Topbar, SearchInput, EmptyState, ErrorState, PullToRefresh } from '@/components/ui'
import { usePosturas, type PosturaListItem } from './posturasApi'
import { SitPostura } from '@/types'
import { EditPosturaSheet } from '@/features/casais'
import { AddPosturaSheet } from '@/features/casais/AddPosturaSheet';
import { useCasal, useCasais } from '@/features/casais/casaisApi'
import { formatRingComplete } from '@/lib/passaro'
import type { Casal } from '@/types';

// Tipo para resultado dos alertas
interface PosturaAlertResult {
    alerts: string[]
    previsao?: Date // Data prevista para nascimento (quando em CHOCO)
    proximaAcao?: Date // Data da próxima ação necessária (para ordenação)
}

// Função para calcular alertas e previsão
function getPosturaAlerts(postura: PosturaListItem): PosturaAlertResult {
    const result: PosturaAlertResult = { alerts: [] }
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const diasChoco = postura.casal?.dias_choco ?? 21
    const diasAnilha = postura.casal?.dias_anilha ?? 7
    const diasSepara = postura.casal?.dias_separa ?? 45

    // Se status é CHOCO e data + dias_choco >= hoje => "Nascendo"
    if (postura.sit === SitPostura.CHOCO && postura.data) {
        const dataPostura = new Date(postura.data)
        dataPostura.setHours(0, 0, 0, 0)
        const dataNascendo = new Date(dataPostura)
        dataNascendo.setDate(dataNascendo.getDate() + diasChoco)

        // Guarda a previsão de nascimento
        result.previsao = dataNascendo
        result.proximaAcao = dataNascendo

        if (dataNascendo <= hoje) {
            result.alerts.push('🐣 Nascendo')
        }

        // Se era para nascer e não nasceu após 30 dias
        const dataVerificar = new Date(dataNascendo)
        dataVerificar.setDate(dataVerificar.getDate() + 30)
        if (!postura.data_nasc && dataVerificar <= hoje) {
            result.alerts.push('⚠️ Verificar')
        }
    }

    // Se status é NASCIDO e não tem passaro_id (ainda não gerou filhote)
    if (postura.sit === SitPostura.NASCIDO && !postura.passaro) {
        if (postura.data_nasc) {
            const dataNasc = new Date(postura.data_nasc)
            dataNasc.setHours(0, 0, 0, 0)

            // Verifica se já foi anilhado (tem nro_anel e ano_anel)
            const jaAnilhado = !!(postura.nro_anel && postura.ano_anel)

            if (!jaAnilhado) {
                // Se ainda não foi anilhado, verifica a data de anilhar
                const dataAnilhar = new Date(dataNasc)
                dataAnilhar.setDate(dataAnilhar.getDate() + diasAnilha)

                // Data da próxima ação é a data de anilhar
                result.proximaAcao = dataAnilhar

                // Se chegou a hora de anilhar
                if (dataAnilhar <= hoje) {
                    result.alerts.push('💍 Hora de anilhar')
                }

                // Se era pra anilhar e não anilhou após 30 dias
                const dataVerificarAnilhar = new Date(dataAnilhar)
                dataVerificarAnilhar.setDate(dataVerificarAnilhar.getDate() + 30)
                if (dataVerificarAnilhar <= hoje) {
                    result.alerts.push('⚠️ Verificar')
                }
            } else {
                // Se já foi anilhado, verifica se está na hora de separar
                const dataSeparar = new Date(dataNasc)
                dataSeparar.setDate(dataSeparar.getDate() + diasSepara)

                // Data da próxima ação é a data de separar
                result.proximaAcao = dataSeparar

                // Se chegou a hora de separar
                if (dataSeparar <= hoje) {
                    result.alerts.push('🔀 Separar')
                }

                // Se era pra separar e não separou após 30 dias
                const dataVerificarSeparar = new Date(dataSeparar)
                dataVerificarSeparar.setDate(dataVerificarSeparar.getDate() + 30)
                if (dataVerificarSeparar <= hoje) {
                    result.alerts.push('⚠️ Verificar')
                }
            }
        }
    }

    return result
}

// Função para formatar data
function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
}

// Componente de alerta badge
function AlertBadge({ text }: { text: string }) {
    // Determinar cor baseado no tipo de alerta (mesmas cores dos filtros)
    let className = 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'

    if (text.includes('Nascendo')) {
        className = 'bg-yellow-500 text-white animate-pulse'
    } else if (text.includes('Hora de anilhar')) {
        className = 'bg-purple-500 text-white animate-pulse'
    } else if (text.includes('Separar')) {
        className = 'bg-cyan-500 text-white animate-pulse'
    } else if (text.includes('Verificar')) {
        className = 'bg-red-500 text-white animate-pulse'
    }

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${className}`}>
            {text}
        </span>
    )
}

// Componente do card de postura
function PosturaCard({ postura, onClick }: { postura: PosturaListItem; onClick: () => void }) {
    const { alerts, previsao } = getPosturaAlerts(postura)

    // Formata info do casal
    const casalNro = postura.casal?.nro ?? '?'
    const machoAnel = formatRingComplete(postura.casal?.macho?.anel)
    const femeaAnel = formatRingComplete(postura.casal?.femea?.anel)
    // Usa descr_pai/descr_mae do casal, que são as descrições cadastradas no casal
    // Se não houver, usa a descr do pássaro individual
    const machoDescr = postura.casal?.descr_pai || postura.casal?.macho?.descr || ''
    const femeaDescr = postura.casal?.descr_mae || postura.casal?.femea?.descr || ''

    // Formata previsão de nascimento
    const formatPrevisao = (date: Date | undefined): string | null => {
        if (!date) return null
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    // Separa alertas principais (Nascendo, Hora de anilhar, Separar) de Verificar
    const alertasPrincipais = alerts.filter(a => !a.includes('Verificar'))
    const alertaVerificar = alerts.find(a => a.includes('Verificar'))

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 active:scale-[0.98] transition-transform cursor-pointer relative"
        >
            {/* Alertas principais no canto superior direito */}
            {alertasPrincipais.length > 0 && (
                <div className="absolute top-4 right-4 flex flex-wrap gap-1 justify-end">
                    {alertasPrincipais.map((alert, idx) => (
                        <AlertBadge key={idx} text={alert} />
                    ))}
                </div>
            )}

            {/* Header: Casal */}
            <div className="flex items-start justify-between mb-3">
                <div className={alertasPrincipais.length > 0 ? 'pr-24' : ''}>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Casal #{casalNro}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div>♂ {machoDescr || machoAnel}</div>
                        <div>♀ {femeaDescr || femeaAnel}</div>
                    </div>
                </div>
            </div>

            {/* Info da postura */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                    <span className="text-gray-500 dark:text-gray-400">Postura:</span>
                    <span className="ml-1 text-gray-900 dark:text-gray-100">{formatDate(postura.data)}</span>
                </div>
                {postura.data_nasc && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Nasc:</span>
                        <span className="ml-1 text-gray-900 dark:text-gray-100">{formatDate(postura.data_nasc)}</span>
                    </div>
                )}
                {/* Previsão de nascimento para posturas em CHOCO */}
                {postura.sit === SitPostura.CHOCO && previsao && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Previsão:</span>
                        <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                            🥚 {formatPrevisao(previsao)}
                        </span>
                    </div>
                )}
                {postura.nro_rodada && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Rodada:</span>
                        <span className="ml-1 text-gray-900 dark:text-gray-100">{postura.nro_rodada}</span>
                    </div>
                )}
                {(postura.nro_anel || postura.ano_anel) && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Anel:</span>
                        <span className="ml-1 text-gray-900 dark:text-gray-100">
                            {postura.nro_anel}/{postura.ano_anel}
                        </span>
                    </div>
                )}
            </div>

            {/* Alerta Verificar no canto inferior esquerdo */}
            {alertaVerificar && (
                <div className="flex">
                    <AlertBadge text={alertaVerificar} />
                </div>
            )}
        </div>
    )
}

// Skeleton do card
function PosturaCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
        </div>
    )
}

// Tipos de filtro
type FilterType = 'todas' | 'nascendo' | 'anilhar' | 'separar' | 'verificar'

// Página principal
export function PosturasPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<FilterType>('todas')
    const [selectedPostura, setSelectedPostura] = useState<PosturaListItem | null>(null)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [isAddPosturaOpen, setIsAddPosturaOpen] = useState(false);
    const [casalSelecionado, setCasalSelecionado] = useState<Casal | null>(null);

    const { data: posturas, isLoading, error, refetch } = usePosturas()
    const { data: casais = [] } = useCasais({ sit: 1 });

    // Busca o casal completo quando uma postura é selecionada
    const { data: casalData } = useCasal(selectedPostura?.casal?.id ?? null)

    // Função para verificar se postura tem alerta específico
    const hasAlert = (postura: PosturaListItem, alertType: 'nascendo' | 'anilhar' | 'separar' | 'verificar'): boolean => {
        const { alerts } = getPosturaAlerts(postura)
        switch (alertType) {
            case 'nascendo':
                return alerts.some(a => a.includes('Nascendo'))
            case 'anilhar':
                return alerts.some(a => a.includes('Hora de anilhar'))
            case 'separar':
                return alerts.some(a => a.includes('Separar'))
            case 'verificar':
                return alerts.some(a => a.includes('Verificar'))
            default:
                return false
        }
    }

    // Filtra posturas pelo termo de busca e tipo de filtro
    const filteredPosturas: PosturaListItem[] = posturas?.filter((postura: PosturaListItem) => {
        // Filtro por tipo de alerta
        if (filterType !== 'todas') {
            if (!hasAlert(postura, filterType)) {
                return false
            }
        }

        // Filtro por texto
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const casalNro = String(postura.casal?.nro || '')
            const machoAnel = formatRingComplete(postura.casal?.macho?.anel).toLowerCase()
            const femeaAnel = formatRingComplete(postura.casal?.femea?.anel).toLowerCase()

            return (
                casalNro.includes(term) ||
                machoAnel.includes(term) ||
                femeaAnel.includes(term)
            )
        }

        return true
    }) ?? []

    // Função para ordenar posturas por data da próxima ação (mais antigas primeiro)
    const sortPosturasByProximaAcao = (posturas: PosturaListItem[]): PosturaListItem[] => {
        return [...posturas].sort((a, b) => {
            const alertsA = getPosturaAlerts(a)
            const alertsB = getPosturaAlerts(b)

            // Se ambas têm próxima ação, ordena pela data (mais antiga primeiro)
            if (alertsA.proximaAcao && alertsB.proximaAcao) {
                return alertsA.proximaAcao.getTime() - alertsB.proximaAcao.getTime()
            }

            // Se só A tem próxima ação, A vem primeiro
            if (alertsA.proximaAcao) return -1

            // Se só B tem próxima ação, B vem primeiro
            if (alertsB.proximaAcao) return 1

            // Se nenhuma tem, mantém ordem original (ou ordena por data de postura)
            if (a.data && b.data) {
                return new Date(b.data).getTime() - new Date(a.data).getTime()
            }

            return 0
        })
    }

    // Agrupa por prioridade de alerta e ordena
    const posturasComAlerta = sortPosturasByProximaAcao(
        filteredPosturas.filter((p: PosturaListItem) => getPosturaAlerts(p).alerts.length > 0)
    )
    const posturasSemAlerta = sortPosturasByProximaAcao(
        filteredPosturas.filter((p: PosturaListItem) => getPosturaAlerts(p).alerts.length === 0)
    )

    // Abre o detalhe da postura
    const handlePosturaClick = (postura: PosturaListItem) => {
        setSelectedPostura(postura)
        setIsEditSheetOpen(true)
    }

    // Fecha o sheet e atualiza a lista
    const handleCloseSheet = () => {
        setIsEditSheetOpen(false)
        setSelectedPostura(null)
    }

    // Callback de sucesso ao editar
    const handleEditSuccess = () => {
        handleCloseSheet()
        refetch()
    }

    // Converte PosturaListItem para Postura (formato esperado pelo EditPosturaSheet)
    const posturaForSheet = selectedPostura ? {
        postura_id: selectedPostura.id,
        gaiola_id: selectedPostura.casal_id,
        nro: undefined,
        data: selectedPostura.data,
        data_nasc: selectedPostura.data_nasc,
        sit: selectedPostura.sit,
        passaro_id: selectedPostura.passaro?.id ?? null,
        nro_rodada: selectedPostura.nro_rodada,
        nro_anel: selectedPostura.nro_anel,
        ano_anel: selectedPostura.ano_anel,
        obs: selectedPostura.obs,
    } : null

    return (
        <>
            <Topbar title="Posturas" />

            <PullToRefresh
                onRefresh={async () => { await refetch() }}
                disabled={isLoading}
            >
                <div className="px-4 py-4 max-w-4xl mx-auto">
                    {/* Barra de busca */}
                    <div className="mb-4">
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Buscar por casal ou anel..."
                        />
                    </div>

                    {/* Filtros por tipo de alerta */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                        <button
                            onClick={() => setFilterType('todas')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'todas'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterType('nascendo')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'nascendo'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            🐣 Nascendo
                        </button>
                        <button
                            onClick={() => setFilterType('anilhar')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'anilhar'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            💍 Anilhar
                        </button>
                        <button
                            onClick={() => setFilterType('separar')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'separar'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            🏠 Separar
                        </button>
                        <button
                            onClick={() => setFilterType('verificar')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'verificar'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            ⚠️ Verificar
                        </button>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <PosturaCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

                    {/* Erro */}
                    {error && (
                        <ErrorState
                            title="Erro ao carregar posturas"
                            message="Não foi possível carregar a lista de posturas."
                            onRetry={refetch}
                        />
                    )}

                    {/* Lista vazia */}
                    {!isLoading && !error && filteredPosturas.length === 0 && (
                        <EmptyState
                            title="Nenhuma postura encontrada"
                            description={
                                searchTerm
                                    ? 'Tente alterar os filtros de busca.'
                                    : 'Adicione posturas nos casais para vê-las aqui.'
                            }
                            icon={
                                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2C6.5 2 4 6 4 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
                                </svg>
                            }
                        />
                    )}

                    {/* Lista de posturas com alertas (prioridade) */}
                    {!isLoading && !error && posturasComAlerta.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                Atenção Necessária ({posturasComAlerta.length})
                            </h2>
                            <div className="space-y-3">
                                {posturasComAlerta.map((postura) => (
                                    <PosturaCard
                                        key={postura.id}
                                        postura={postura}
                                        onClick={() => handlePosturaClick(postura)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de posturas sem alertas */}
                    {!isLoading && !error && posturasSemAlerta.length > 0 && (
                        <div>
                            {posturasComAlerta.length > 0 && (
                                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                                    Outras Posturas ({posturasSemAlerta.length})
                                </h2>
                            )}
                            <div className="space-y-3">
                                {posturasSemAlerta.map((postura) => (
                                    <PosturaCard
                                        key={postura.id}
                                        postura={postura}
                                        onClick={() => handlePosturaClick(postura)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contador total */}
                    {!isLoading && !error && filteredPosturas.length > 0 && (
                        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            {filteredPosturas.length} postura{filteredPosturas.length !== 1 ? 's' : ''} encontrada{filteredPosturas.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </PullToRefresh>

            {/* Sheet de edição da postura */}
            <EditPosturaSheet
                casal={casalData ?? null}
                postura={posturaForSheet}
                isOpen={isEditSheetOpen}
                onClose={handleCloseSheet}
                onSuccess={handleEditSuccess}
            />

            {/* Botão flutuante para adicionar nova postura */}
            <button
                onClick={() => setIsAddPosturaOpen(true)}
                className="fixed right-4 bottom-20 z-40 w-14 h-14 bg-amber-500 text-white rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900"
                aria-label="Nova Postura"
            >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Modal para selecionar casal */}
            {isAddPosturaOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => setIsAddPosturaOpen(false)}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-bold mb-4">Selecione o casal</h2>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {casais.length === 0 && <div className="text-gray-500">Nenhum casal ativo</div>}
                            {casais.map((casal) => (
                                <button
                                    key={casal.id ?? casal.gaiola_id}
                                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all border border-gray-100 dark:border-gray-700 mb-1"
                                    onClick={() => {
                                        setCasalSelecionado(casal);
                                        setIsAddPosturaOpen(false);
                                    }}
                                >
                                    <div className="font-bold dark:text-gray-400 mb-1">
                                        Casal: #{casal.nro}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            ♂
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">
                                            {casal.macho?.descr || casal.descr_pai || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            ♀
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">
                                            {casal.femea?.descr || casal.descr_mae || '—'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Sheet para adicionar postura */}
            <AddPosturaSheet
                casal={casalSelecionado}
                isOpen={!!casalSelecionado}
                onClose={() => setCasalSelecionado(null)}
                onSuccess={() => {
                    setCasalSelecionado(null);
                    refetch();
                }}
            />
        </>
    )
}
