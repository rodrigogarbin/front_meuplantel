/**
 * Componente CasalDetailsSheet
 * Bottom sheet / Modal com detalhes completos do casal
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Casal, Postura } from '@/types'
import { SitPostura } from '@/types'
import { BottomSheet } from '@/components/ui'
import { formatPassaroCompleto } from '@/lib/passaro'
import { formatDate } from '@/lib/date'
import { AddPosturaSheet } from './AddPosturaSheet'
import { EditPosturaSheet } from './EditPosturaSheet'
import { usePosturasByCasal } from './casaisApi'

interface CasalDetailsSheetProps {
    casal: Casal | null
    isOpen: boolean
    onClose: () => void
    onRefresh?: () => void
}

function getSitPosturaLabel(sit: number | null | undefined): string {
    switch (sit) {
        case SitPostura.CHOCO:
            return 'Chocando'
        case SitPostura.NASCIDO:
            return 'Nascido'
        case SitPostura.BRANCO:
            return 'Infértil'
        case SitPostura.EMBRIAO_MORTO:
            return 'Embrião Morto'
        case SitPostura.FILHOTE_MORTO:
            return 'Filhote Morto'
        case SitPostura.FERTIL:
            return 'Fértil'
        default:
            return '—'
    }
}

function getSitPosturaColor(sit: number | null | undefined): string {
    switch (sit) {
        case SitPostura.CHOCO:
            return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
        case SitPostura.NASCIDO:
            return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
        case SitPostura.BRANCO:
            return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        case SitPostura.EMBRIAO_MORTO:
        case SitPostura.FILHOTE_MORTO:
            return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
        case SitPostura.FERTIL:
            return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
        default:
            return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    }
}

// Ícone de ovo
function EggIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C6.5 2 4 6 4 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
        </svg>
    )
}

export function CasalDetailsSheet({ casal, isOpen, onClose, onRefresh }: CasalDetailsSheetProps) {
    const navigate = useNavigate()
    const [isAddPosturaOpen, setIsAddPosturaOpen] = useState(false)
    const [selectedPostura, setSelectedPostura] = useState<Postura | null>(null)
    const [isEditPosturaOpen, setIsEditPosturaOpen] = useState(false)
    const [showHistorico, setShowHistorico] = useState(false)

    // Obtém o ID do casal
    const casalId = casal?.id ?? casal?.gaiola_id ?? null

    // Busca histórico completo de posturas (só quando showHistorico = true)
    const { data: historicoCompleto, isLoading: isLoadingHistorico, refetch: refetchHistorico } = usePosturasByCasal(
        casalId,
        showHistorico
    )

    if (!casal) return null

    const machoLabel = casal.macho ? formatPassaroCompleto(casal.macho) : casal.descr_pai || '—'
    const femeaLabel = casal.femea ? formatPassaroCompleto(casal.femea) : casal.descr_mae || '—'

    // Obtém dias de choco da espécie (do macho ou da fêmea)
    const diasChoco = casal.macho?.especie_usuario?.dias_choco
        ?? casal.macho?.especieUsuario?.dias_choco
        ?? casal.femea?.especie_usuario?.dias_choco
        ?? casal.femea?.especieUsuario?.dias_choco
        ?? null

    const diasAnilha = casal.macho?.especie_usuario?.dias_anilha
        ?? casal.macho?.especieUsuario?.dias_anilha
        ?? casal.femea?.especie_usuario?.dias_anilha
        ?? casal.femea?.especieUsuario?.dias_anilha
        ?? 7

    const diasSepara = casal.macho?.especie_usuario?.dias_separa
        ?? casal.macho?.especieUsuario?.dias_separa
        ?? casal.femea?.especie_usuario?.dias_separa
        ?? casal.femea?.especieUsuario?.dias_separa
        ?? 45

    // Verifica se uma postura NASCIDA precisa de ação (não tem pássaro vinculado ainda)
    const posturaPrecisaAcao = (postura: Postura): boolean => {
        if (postura.sit !== SitPostura.NASCIDO) return false
        // Se já tem pássaro vinculado, não precisa de ação
        if (postura.passaro_id) return false
        return true
    }

    // Agrupa posturas por status
    const posturas = casal.posturas ?? []
    // Ovos ativos = chocando ou nascidos que precisam de ação
    const ovosAtivos = posturas.filter(p =>
        p.sit === SitPostura.CHOCO || posturaPrecisaAcao(p)
    )
    const posturasConcluidas = posturas.filter(p =>
        p.sit !== SitPostura.CHOCO && !posturaPrecisaAcao(p)
    )

    // Agrupa ovos ativos por rodada
    const ovosAtivosPorRodada = ovosAtivos.reduce((acc, postura) => {
        const rodada = postura.nro_rodada ?? 0
        if (!acc[rodada]) {
            acc[rodada] = []
        }
        acc[rodada].push(postura)
        return acc
    }, {} as Record<number, Postura[]>)

    // Ordena as rodadas (mais recente primeiro)
    const rodadasAtivas = Object.keys(ovosAtivosPorRodada)
        .map(Number)
        .sort((a, b) => b - a)

    // Agrupa histórico por rodada
    const historicoPorRodada = posturasConcluidas.reduce((acc, postura) => {
        const rodada = postura.nro_rodada ?? 0
        if (!acc[rodada]) {
            acc[rodada] = []
        }
        acc[rodada].push(postura)
        return acc
    }, {} as Record<number, Postura[]>)

    // Ordena as rodadas do histórico (mais recente primeiro)
    const rodadasHistorico = Object.keys(historicoPorRodada)
        .map(Number)
        .sort((a, b) => b - a)

    // Contadores
    const totalOvos = posturas.length
    const totalNascidos = posturas.filter(p => p.sit === SitPostura.NASCIDO).length
    const totalInferteis = posturas.filter(p => p.sit === SitPostura.BRANCO).length
    const totalMortos = posturas.filter(p => p.sit === SitPostura.EMBRIAO_MORTO || p.sit === SitPostura.FILHOTE_MORTO).length

    const handleEdit = () => {
        onClose()
        navigate(`/casais/${casalId}/editar`)
    }

    const handleAddPostura = () => {
        setIsAddPosturaOpen(true)
    }

    const handleEditPostura = (postura: Postura) => {
        setSelectedPostura(postura)
        setIsEditPosturaOpen(true)
    }

    const handlePosturaSuccess = () => {
        onRefresh?.()
        if (showHistorico) {
            refetchHistorico()
        }
    }

    const handleToggleHistorico = () => {
        setShowHistorico(prev => !prev)
    }

    const handleFinalizarCasal = () => {
        // TODO: Implementar modal de confirmação para finalizar casal
        console.log('Finalizar casal:', casalId)
    }

    // Prepara histórico completo agrupado por rodada
    const historicoCompletoAgrupado = historicoCompleto?.reduce((acc, postura) => {
        const rodada = postura.nro_rodada ?? 0
        if (!acc[rodada]) {
            acc[rodada] = []
        }
        acc[rodada].push(postura)
        return acc
    }, {} as Record<number, Postura[]>) ?? {}

    const rodadasHistoricoCompleto = Object.keys(historicoCompletoAgrupado)
        .map(Number)
        .sort((a, b) => b - a)

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Detalhes do Casal">
            <div className="space-y-6">
                {/* Header: Número do Casal */}
                <div className="flex items-center justify-center gap-4">
                    <span className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {casal.nro ?? '?'}
                    </span>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Casal</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nº {casal.nro}</p>
                        {casal.vigen_inicial && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Desde {formatDate(casal.vigen_inicial)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Macho e Fêmea */}
                <div className="space-y-3">
                    {/* Macho */}
                    <button
                        onClick={() => {
                            if (casal.macho?.passaro_id) {
                                onClose()
                                navigate(`/passaros?id=${casal.macho.passaro_id}`)
                            }
                        }}
                        disabled={!casal.macho?.passaro_id}
                        className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-[0.98] disabled:hover:bg-blue-50 dark:disabled:hover:bg-blue-900/30 disabled:active:scale-100"
                    >
                        <span className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm2-4h5v2h-2.59L21 8.59 19.59 10 15 5.41V8h-2V2h1z" />
                            </svg>
                        </span>
                        <div className="flex-1 text-left">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Macho</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                                {machoLabel}
                            </p>
                        </div>
                        {casal.macho?.passaro_id && (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>

                    {/* Fêmea */}
                    <button
                        onClick={() => {
                            if (casal.femea?.passaro_id) {
                                onClose()
                                navigate(`/passaros?id=${casal.femea.passaro_id}`)
                            }
                        }}
                        disabled={!casal.femea?.passaro_id}
                        className="w-full flex items-center gap-3 p-4 bg-pink-50 dark:bg-pink-900/30 rounded-xl transition-all hover:bg-pink-100 dark:hover:bg-pink-900/50 active:scale-[0.98] disabled:hover:bg-pink-50 dark:disabled:hover:bg-pink-900/30 disabled:active:scale-100"
                    >
                        <span className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-md">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm1 8h-2v3H8v2h3v3h2v-3h3v-2h-3v-3z" />
                            </svg>
                        </span>
                        <div className="flex-1 text-left">
                            <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Fêmea</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                                {femeaLabel}
                            </p>
                        </div>
                        {casal.femea?.passaro_id && (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalOvos}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalNascidos}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Nascidos</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{totalInferteis}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Inférteis</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-red-500 dark:text-red-400">{totalMortos}</p>
                        <p className="text-xs text-red-500 dark:text-red-400">Mortos</p>
                    </div>
                </div>

                {/* Nº de Rodadas */}
                {casal.nro_rodadas !== undefined && casal.nro_rodadas !== null && casal.nro_rodadas > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{casal.nro_rodadas} {casal.nro_rodadas === 1 ? 'rodada' : 'rodadas'}</span>
                    </div>
                )}

                {/* Ovos Ativos (chocando ou com ação pendente) */}
                {ovosAtivos.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <EggIcon className="w-5 h-5" />
                            Ovos ({ovosAtivos.length})
                        </h3>
                        <div className="space-y-2">
                            {rodadasAtivas.map((rodada, rodadaIdx) => (
                                <div key={rodada}>
                                    {/* Divisória entre rodadas */}
                                    {rodadaIdx > 0 && (
                                        <div className="flex items-center gap-2 my-3">
                                            <div className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                Rodada {rodada || '—'}
                                            </span>
                                            <div className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
                                        </div>
                                    )}
                                    {/* Label da primeira rodada se houver mais de uma */}
                                    {rodadaIdx === 0 && rodadasAtivas.length > 1 && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                Rodada {rodada || '—'}
                                            </span>
                                        </div>
                                    )}
                                    {/* Ovos da rodada */}
                                    <div className="space-y-2">
                                        {ovosAtivosPorRodada[rodada].map((postura) => (
                                            <PosturaOvoChip
                                                key={postura.postura_id}
                                                postura={postura}
                                                diasChoco={diasChoco}
                                                diasAnilha={diasAnilha}
                                                diasSepara={diasSepara}
                                                onClick={() => handleEditPostura(postura)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Histórico de Posturas */}
                {posturasConcluidas.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Histórico ({posturasConcluidas.length})
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {rodadasHistorico.map((rodada, rodadaIdx) => (
                                <div key={rodada}>
                                    {/* Divisória entre rodadas */}
                                    {rodadaIdx > 0 && (
                                        <div className="flex items-center gap-2 my-3">
                                            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                Rodada {rodada || '—'}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                                        </div>
                                    )}
                                    {/* Label da primeira rodada se houver mais de uma */}
                                    {rodadaIdx === 0 && rodadasHistorico.length > 1 && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                Rodada {rodada || '—'}
                                            </span>
                                        </div>
                                    )}
                                    {/* Posturas da rodada */}
                                    <div className="space-y-2">
                                        {historicoPorRodada[rodada].map((postura) => (
                                            <PosturaHistoricoChip
                                                key={postura.postura_id}
                                                postura={postura}
                                                onClick={() => handleEditPostura(postura)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botão Ver Histórico Completo */}
                <button
                    onClick={handleToggleHistorico}
                    className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className={`w-4 h-4 transition-transform ${showHistorico ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {showHistorico ? 'Ocultar histórico completo' : 'Ver histórico completo de posturas'}
                </button>

                {/* Histórico Completo de Posturas (carregado sob demanda) */}
                {showHistorico && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Histórico Completo ({historicoCompleto?.length ?? 0})
                        </h3>

                        {isLoadingHistorico ? (
                            <div className="flex items-center justify-center py-4">
                                <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        ) : historicoCompleto && historicoCompleto.length > 0 ? (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {rodadasHistoricoCompleto.map((rodada, rodadaIdx) => (
                                    <div key={rodada}>
                                        {/* Divisória entre rodadas */}
                                        {rodadaIdx > 0 && (
                                            <div className="flex items-center gap-2 my-3">
                                                <div className="flex-1 h-px bg-blue-300 dark:bg-blue-700" />
                                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                    Rodada {rodada || '—'}
                                                </span>
                                                <div className="flex-1 h-px bg-blue-300 dark:bg-blue-700" />
                                            </div>
                                        )}
                                        {/* Label da primeira rodada se houver mais de uma */}
                                        {rodadaIdx === 0 && rodadasHistoricoCompleto.length > 1 && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                    Rodada {rodada || '—'}
                                                </span>
                                            </div>
                                        )}
                                        {/* Posturas da rodada */}
                                        <div className="space-y-2">
                                            {historicoCompletoAgrupado[rodada].map((postura) => (
                                                <PosturaHistoricoChip
                                                    key={postura.postura_id}
                                                    postura={postura}
                                                    onClick={() => handleEditPostura(postura)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                Nenhuma postura encontrada
                            </p>
                        )}
                    </div>
                )}

                {/* Ações */}
                <div className="space-y-3 pt-2 pb-4">
                    {/* Adicionar Postura */}
                    <button
                        onClick={handleAddPostura}
                        className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/30"
                    >
                        <EggIcon className="w-5 h-5" />
                        Adicionar Ovo
                    </button>

                    {/* Editar */}
                    <button
                        onClick={handleEdit}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Casal
                    </button>

                    {/* Finalizar Casal */}
                    <button
                        onClick={handleFinalizarCasal}
                        className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Finalizar Casal
                    </button>
                </div>
            </div>

            {/* Sheet para adicionar ovo */}
            <AddPosturaSheet
                casal={casal}
                isOpen={isAddPosturaOpen}
                onClose={() => setIsAddPosturaOpen(false)}
                onSuccess={handlePosturaSuccess}
            />

            {/* Sheet para editar ovo */}
            <EditPosturaSheet
                casal={casal}
                postura={selectedPostura}
                isOpen={isEditPosturaOpen}
                onClose={() => {
                    setIsEditPosturaOpen(false)
                    setSelectedPostura(null)
                }}
                onSuccess={handlePosturaSuccess}
            />
        </BottomSheet>
    )
}

// Chip unificado de ovo (chocando ou com ação pendente)
function PosturaOvoChip({ postura, diasChoco, diasAnilha, diasSepara, onClick }: {
    postura: Postura
    diasChoco: number | null
    diasAnilha: number
    diasSepara: number
    onClick?: () => void
}) {
    // Formata data curta (DD/MM)
    const formatShortDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '—'
        try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return '—'
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            return `${day}/${month}`
        } catch {
            return '—'
        }
    }

    const isChocando = postura.sit === SitPostura.CHOCO
    const isNascido = postura.sit === SitPostura.NASCIDO

    // Calcula previsão de nascimento (para ovos chocando)
    const calcPrevisaoNascimento = (): { data: string; diasRestantes: number } | null => {
        if (!isChocando || !postura.data || !diasChoco) return null
        try {
            const dataPostura = new Date(postura.data)
            if (isNaN(dataPostura.getTime())) return null

            const previsao = new Date(dataPostura)
            previsao.setDate(previsao.getDate() + diasChoco)

            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)
            previsao.setHours(0, 0, 0, 0)

            const diffTime = previsao.getTime() - hoje.getTime()
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            return {
                data: formatShortDate(previsao.toISOString()),
                diasRestantes
            }
        } catch {
            return null
        }
    }

    // Calcula alertas (para ovos nascidos)
    const getAlerts = (): string[] => {
        const alerts: string[] = []
        if (!isNascido || !postura.data_nasc) return alerts

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataNasc = new Date(postura.data_nasc)
        dataNasc.setHours(0, 0, 0, 0)

        const diffTime = hoje.getTime() - dataNasc.getTime()
        const diasDesdeNasc = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diasDesdeNasc >= diasAnilha && !postura.nro_anel && !postura.ano_anel) {
            alerts.push('💍 Anilhar')
        }
        if (diasDesdeNasc >= diasSepara) {
            alerts.push('🏠 Separar')
        }
        if (diasDesdeNasc >= 30) {
            alerts.push('⚠️ Verificar')
        }

        return alerts
    }

    const previsao = calcPrevisaoNascimento()
    const alerts = getAlerts()

    // Cor do ícone e borda baseada no status
    const iconColor = isChocando ? 'text-amber-500' : 'text-emerald-500'
    const borderColor = isChocando
        ? 'border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500'
        : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border ${borderColor} hover:shadow-sm transition-all active:scale-[0.98] w-full text-left`}
        >
            <EggIcon className={`w-8 h-8 ${iconColor} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
                {/* Info principal */}
                {isChocando ? (
                    <>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>Postura:</span>
                            <span className="font-medium">{formatShortDate(postura.data)}</span>
                        </div>
                        {previsao && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Nasce:</span>
                                <span className="font-semibold text-amber-700 dark:text-amber-300">{previsao.data}</span>
                                {previsao.diasRestantes > 0 ? (
                                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                                        {previsao.diasRestantes}d
                                    </span>
                                ) : previsao.diasRestantes === 0 ? (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded font-semibold">
                                        Hoje!
                                    </span>
                                ) : (
                                    <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded animate-pulse">
                                        🐣 Descascando
                                    </span>
                                )}
                            </div>
                        )}
                        {!previsao && diasChoco && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                Choco: {diasChoco} dias
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>Nasceu:</span>
                            <span className="font-medium">{formatShortDate(postura.data_nasc)}</span>
                            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                Nascido
                            </span>
                        </div>
                        {alerts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {alerts.map((alert, idx) => (
                                    <span
                                        key={idx}
                                        className={`px-1.5 py-0.5 rounded text-xs font-medium animate-pulse ${alert.includes('Anilhar')
                                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                                            : alert.includes('Separar')
                                                ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300'
                                                : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                            }`}
                                    >
                                        {alert}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    )
}

// Chip individual de postura no histórico (concluída)
function PosturaHistoricoChip({ postura, onClick }: { postura: Postura; onClick?: () => void }) {
    // Formata data curta (DD/MM)
    const formatShortDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '—'
        try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return '—'
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        } catch {
            return '—'
        }
    }

    // Cor do ícone baseada no status
    const getIconColor = () => {
        switch (postura.sit) {
            case SitPostura.NASCIDO:
                return 'text-emerald-500'
            case SitPostura.BRANCO:
                return 'text-gray-400'
            case SitPostura.EMBRIAO_MORTO:
            case SitPostura.FILHOTE_MORTO:
                return 'text-red-400'
            default:
                return 'text-gray-400'
        }
    }

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all active:scale-[0.98] w-full text-left"
        >
            <EggIcon className={`w-8 h-8 ${getIconColor()} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Postura:</span>
                    <span className="font-medium">{formatShortDate(postura.data)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSitPosturaColor(postura.sit)}`}>
                        {getSitPosturaLabel(postura.sit)}
                    </span>
                </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    )
}