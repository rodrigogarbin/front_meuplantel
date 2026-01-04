/**
 * Página de listagem de Posturas
 * Exibe todas as posturas ativas com alertas de ações
 */

import { useState } from 'react'
import { Topbar, SearchInput, EmptyState, ErrorState } from '@/components/ui'
import { usePosturas, type PosturaListItem } from './posturasApi'
import { SitPostura } from '@/types'
import { EditPosturaSheet } from '@/features/casais'
import { useCasal } from '@/features/casais/casaisApi'
import { formatRingComplete } from '@/lib/passaro'

// Tipo para resultado dos alertas
interface PosturaAlertResult {
    alerts: string[]
    previsao?: Date // Data prevista para nascimento (quando em CHOCO)
}

// Função para calcular alertas e previsão
function getPosturaAlerts(postura: PosturaListItem): PosturaAlertResult {
    const result: PosturaAlertResult = { alerts: [] }
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const diasChoco = postura.casal?.dias_choco ?? 21
    const diasAnilha = postura.casal?.dias_anilha ?? 7
    const diasSepara = postura.casal?.dias_separa ?? 45

    // Se status é CHOCO e data + dias_choco >= hoje => "Descascando"
    if (postura.sit === SitPostura.CHOCO && postura.data) {
        const dataPostura = new Date(postura.data)
        dataPostura.setHours(0, 0, 0, 0)
        const dataDescascando = new Date(dataPostura)
        dataDescascando.setDate(dataDescascando.getDate() + diasChoco)

        // Guarda a previsão de nascimento
        result.previsao = dataDescascando

        if (dataDescascando <= hoje) {
            result.alerts.push('🐣 Descascando')
        }
    }

    // Se status é NASCIDO e não tem passaro_id (ainda não gerou filhote)
    if (postura.sit === SitPostura.NASCIDO && !postura.passaro) {
        // Se data_nasc + dias_anilha <= hoje => "Hora de Anilhar"
        if (postura.data_nasc) {
            const dataNasc = new Date(postura.data_nasc)
            dataNasc.setHours(0, 0, 0, 0)
            const dataAnilhar = new Date(dataNasc)
            dataAnilhar.setDate(dataAnilhar.getDate() + diasAnilha)

            // Mostrar se já passou a data ou está no dia
            if (dataAnilhar <= hoje) {
                // Verifica se tem anel preenchido
                if (!postura.nro_anel && !postura.ano_anel) {
                    result.alerts.push('💍 Hora de Anilhar')
                }
            }

            // Se data_nasc + dias_separa <= hoje => "Hora de Separar"
            const dataSeparar = new Date(dataNasc)
            dataSeparar.setDate(dataSeparar.getDate() + diasSepara)

            if (dataSeparar <= hoje) {
                result.alerts.push('🏠 Hora de Separar')
            }

            // Se data_nasc + 30 dias <= hoje => "Verificar" (postura antiga sem resolução)
            const dataVerificar = new Date(dataNasc)
            dataVerificar.setDate(dataVerificar.getDate() + 30)

            if (dataVerificar <= hoje) {
                result.alerts.push('⚠️ Verificar')
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

// Componente de status badge
function StatusBadge({ sit }: { sit: number }) {
    const config: Record<number, { label: string; className: string }> = {
        [SitPostura.CHOCO]: {
            label: 'Chocando',
            className: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
        },
        [SitPostura.NASCIDO]: {
            label: 'Nascido',
            className: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
        },
        [SitPostura.BRANCO]: {
            label: 'Infértil',
            className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        },
        [SitPostura.EMBRIAO_MORTO]: {
            label: 'Embrião Morto',
            className: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        },
        [SitPostura.FILHOTE_MORTO]: {
            label: 'Filhote Morto',
            className: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        },
        [SitPostura.FERTIL]: {
            label: 'Fértil',
            className: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
        },
    }

    const { label, className } = config[sit] || {
        label: 'Desconhecido',
        className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    }

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${className}`}>
            {label}
        </span>
    )
}

// Componente de alerta badge
function AlertBadge({ text }: { text: string }) {
    // Determinar cor baseado no tipo de alerta
    let className = 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'

    if (text.includes('Descascando')) {
        className = 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 animate-pulse'
    } else if (text.includes('Anilhar')) {
        className = 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 animate-pulse'
    } else if (text.includes('Separar')) {
        className = 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 animate-pulse'
    } else if (text.includes('Verificar')) {
        className = 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 animate-pulse'
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

    // Formata previsão de nascimento
    const formatPrevisao = (date: Date | undefined): string | null => {
        if (!date) return null
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 active:scale-[0.98] transition-transform cursor-pointer"
        >
            {/* Header: Casal + Status */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Casal #{casalNro}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ♂ {machoAnel} × ♀ {femeaAnel}
                    </p>
                </div>
                <StatusBadge sit={postura.sit ?? 0} />
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

            {/* Alertas */}
            {alerts.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {alerts.map((alert, idx) => (
                        <AlertBadge key={idx} text={alert} />
                    ))}
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
type FilterType = 'todas' | 'descascando' | 'anilhar' | 'separar' | 'verificar'

// Página principal
export function PosturasPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<FilterType>('todas')
    const [selectedPostura, setSelectedPostura] = useState<PosturaListItem | null>(null)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

    const { data: posturas, isLoading, error, refetch } = usePosturas()

    // Busca o casal completo quando uma postura é selecionada
    const { data: casalData } = useCasal(selectedPostura?.casal?.id ?? null)

    // Função para verificar se postura tem alerta específico
    const hasAlert = (postura: PosturaListItem, alertType: 'descascando' | 'anilhar' | 'separar' | 'verificar'): boolean => {
        const { alerts } = getPosturaAlerts(postura)
        switch (alertType) {
            case 'descascando':
                return alerts.some(a => a.includes('Descascando'))
            case 'anilhar':
                return alerts.some(a => a.includes('Anilhar'))
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

    // Agrupa por prioridade de alerta
    const posturasComAlerta = filteredPosturas.filter((p: PosturaListItem) => getPosturaAlerts(p).alerts.length > 0)
    const posturasSemAlerta = filteredPosturas.filter((p: PosturaListItem) => getPosturaAlerts(p).alerts.length === 0)

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
                        onClick={() => setFilterType('descascando')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'descascando'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🐣 Descascando
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

            {/* Sheet de edição da postura */}
            <EditPosturaSheet
                casal={casalData ?? null}
                postura={posturaForSheet}
                isOpen={isEditSheetOpen}
                onClose={handleCloseSheet}
                onSuccess={handleEditSuccess}
            />
        </>
    )
}
