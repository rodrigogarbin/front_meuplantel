/**
 * Componente CasalDetailsSheet
 * Bottom sheet / Modal com detalhes completos do casal
 */

import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import { QRCodeSVG } from 'qrcode.react'
import type { Casal, Postura } from '@/types'
import { SitPostura } from '@/types'
import { BottomSheet } from '@/components/ui'
import { formatPassaroCompleto } from '@/lib/passaro'
import { formatDate, formatShortDate, parseLocalDate } from '@/lib/date'
import { getGaiolaAppUrl } from '@/lib/url'
import { AddPosturaSheet } from './AddPosturaSheet'
import { EditPosturaSheet } from './EditPosturaSheet'
import { usePosturasByCasal, useCasalEndogamia, useEncerrarCasal } from './casaisApi'

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
            return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
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

// Ícone de transferência
function TransferIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    )
}

export function CasalDetailsSheet({ casal, isOpen, onClose, onRefresh }: CasalDetailsSheetProps) {
    const navigate = useNavigate()
    const [isAddPosturaOpen, setIsAddPosturaOpen] = useState(false)
    const [selectedPostura, setSelectedPostura] = useState<Postura | null>(null)
    const [isEditPosturaOpen, setIsEditPosturaOpen] = useState(false)
    const [showHistorico, setShowHistorico] = useState(false)
    const [showQrCode, setShowQrCode] = useState(false)
    const [showConfirmEncerrar, setShowConfirmEncerrar] = useState(false)

    // Obtém o ID do casal
    const casalId = casal?.id ?? casal?.gaiola_id ?? null

    // Busca endogamia do casal
    const { data: endogamia } = useCasalEndogamia(casalId)

    // Mutation para encerrar casal
    const encerrarMutation = useEncerrarCasal()

    // Busca histórico completo de posturas (só quando showHistorico = true)
    const { data: historicoCompleto, isLoading: isLoadingHistorico, refetch: refetchHistorico } = usePosturasByCasal(
        casalId,
        showHistorico
    )

    if (!casal) return null

    const machoLabel = casal.macho ? formatPassaroCompleto(casal.macho) : casal.descr_pai || '—'
    const femeaLabel = casal.femea ? formatPassaroCompleto(casal.femea) : casal.descr_mae || '—'

    // Obtém dias de choco da espécie (do macho ou da fêmea) - padrão 13 dias (canários)
    // API retorna como 'especie' no CasalResource
    const diasChoco = casal.macho?.especie?.dias_choco
        ?? casal.femea?.especie?.dias_choco
        ?? 13

    const diasAnilha = casal.macho?.especie?.dias_anilha
        ?? casal.femea?.especie?.dias_anilha
        ?? 7

    const diasSepara = casal.macho?.especie?.dias_separa
        ?? casal.femea?.especie?.dias_separa
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
        (p.sit === SitPostura.CHOCO || p.sit === SitPostura.FERTIL || posturaPrecisaAcao(p) && !p.passaro_id)
    )

    // Separa ovos ativos entre nativos e recebidos de outros casais
    const ovosNativos = ovosAtivos.filter(p => !p.casal_origem)
    const ovosRecebidos = ovosAtivos.filter(p => !!p.casal_origem)

    const posturasConcluidas = posturas.filter(p =>
        p.sit !== SitPostura.CHOCO && !posturaPrecisaAcao(p)
    )

    // Agrupa ovos nativos por rodada
    const ovosNativosPorRodada = ovosNativos.reduce((acc, postura) => {
        const rodada = postura.nro_rodada ?? 0
        if (!acc[rodada]) {
            acc[rodada] = []
        }
        acc[rodada].push(postura)
        return acc
    }, {} as Record<number, Postura[]>)

    // Ordena as rodadas (mais recente primeiro)
    const rodadasAtivas = Object.keys(ovosNativosPorRodada)
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
        setShowConfirmEncerrar(true)
    }

    const handleConfirmEncerrar = async () => {
        if (!casalId) return

        try {
            await encerrarMutation.mutateAsync(casalId)
            setShowConfirmEncerrar(false)
            onRefresh?.()
            onClose()
        } catch (error) {
            console.error('Erro ao encerrar casal:', error)
        }
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
                            <span className="text-lg">♂</span>
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
                            <span className="text-lg">♀</span>
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

                {/* Consanguinidade */}
                {endogamia !== undefined && endogamia > 0 && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${endogamia >= 0.25
                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                        : endogamia >= 0.125
                            ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}>
                        <svg className={`w-5 h-5 flex-shrink-0 ${endogamia >= 0.25
                            ? 'text-red-500'
                            : endogamia >= 0.125
                                ? 'text-amber-500'
                                : 'text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Consanguinidade dos filhotes</p>
                            <p className={`text-lg font-bold ${endogamia >= 0.25
                                ? 'text-red-600 dark:text-red-400'
                                : endogamia >= 0.125
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-gray-700 dark:text-gray-200'
                                }`}>
                                {(endogamia * 100).toFixed(1)}%
                            </p>
                        </div>
                        {endogamia >= 0.25 && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                                Alto
                            </span>
                        )}
                    </div>
                )}

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
                {ovosNativos.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <EggIcon className="w-5 h-5" />
                            Ovos ({ovosNativos.length})
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
                                        {ovosNativosPorRodada[rodada].map((postura) => (
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

                {/* Ovos Recebidos de Outros Casais */}
                {ovosRecebidos.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            Ovos Recebidos ({ovosRecebidos.length})
                        </h3>
                        <div className="space-y-2">
                            {ovosRecebidos.map((postura) => (
                                <PosturaRecebidaChip
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
                )}

                {/* Ovos Transferidos para Outros Casais */}
                {(casal.posturas_transferidas && casal.posturas_transferidas.length > 0) && (
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                            <TransferIcon className="w-5 h-5" />
                            Ovos Transferidos ({casal.posturas_transferidas.length})
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {casal.posturas_transferidas.map((postura) => (
                                <PosturaTransferidaChip
                                    key={postura.postura_id}
                                    postura={postura}
                                />
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

                    {/* QR Code da gaiola - Oculto */}
                    {/* {casalId != null && (
                        <button
                            onClick={() => setShowQrCode(true)}
                            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            QR Code da Gaiola
                        </button>
                    )} */}

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

            {/* Modal QR Code da gaiola */}
            {casalId != null && (
                <Transition appear show={showQrCode} as={Fragment}>
                    <Dialog as="div" className="relative z-[60]" onClose={() => setShowQrCode(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/50" />
                        </Transition.Child>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-200"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4">
                                    <Dialog.Title className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                                        QR Code – Gaiola Nº {casal.nro}
                                    </Dialog.Title>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                        Escaneie com a câmera do celular para abrir esta gaiola no MeuPlantel. Se o app estiver instalado, abrirá direto no PWA.
                                    </p>
                                    <div className="bg-white p-4 rounded-xl">
                                        <QRCodeSVG
                                            value={getGaiolaAppUrl(casalId)}
                                            size={220}
                                            level="M"
                                            bgColor="#ffffff"
                                            fgColor="#0f172a"
                                            marginSize={2}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowQrCode(false)}
                                        className="w-full py-2.5 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        Fechar
                                    </button>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition>
            )}

            {/* Modal de confirmação para encerrar casal */}
            <Transition appear show={showConfirmEncerrar} as={Fragment}>
                <Dialog as="div" className="relative z-[60]" onClose={() => setShowConfirmEncerrar(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                <Dialog.Title className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                    Encerrar Casal?
                                </Dialog.Title>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Tem certeza que deseja encerrar este casal? Esta ação irá definir a data de vigência final como hoje.
                                    O casal aparecerá como inativo na listagem.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmEncerrar(false)}
                                        className="flex-1 py-2.5 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                        disabled={encerrarMutation.isPending}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmEncerrar}
                                        className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={encerrarMutation.isPending}
                                    >
                                        {encerrarMutation.isPending ? 'Encerrando...' : 'Sim, Encerrar'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </BottomSheet>
    )
}

// Chip unificado de ovo (chocando ou com ação pendente)
function PosturaOvoChip({ postura, diasChoco, diasAnilha, diasSepara, onClick }: {
    postura: Postura
    diasChoco: number
    diasAnilha: number
    diasSepara: number
    onClick?: () => void
}) {
    const isChocando = postura.sit === SitPostura.CHOCO || postura.sit === SitPostura.FERTIL
    const isNascido = postura.sit === SitPostura.NASCIDO
    const isFertil = postura.sit === SitPostura.FERTIL;

    // Calcula previsão de nascimento (para ovos chocando)
    const calcPrevisaoNascimento = (): { data: string; diasRestantes: number } | null => {
        if (!isChocando || !postura.data) return null;
        try {
            const dataPostura = parseLocalDate(postura.data);
            if (!dataPostura) return null;

            const previsao = new Date(dataPostura);
            previsao.setDate(previsao.getDate() + diasChoco);

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const diffTime = previsao.getTime() - hoje.getTime();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const day = previsao.getDate().toString().padStart(2, '0');
            const month = (previsao.getMonth() + 1).toString().padStart(2, '0');

            return {
                data: `${day}/${month}`,
                diasRestantes
            };
        } catch {
            return null;
        }
    };

    // Calcula alertas (para ovos nascidos)
    const getAlerts = (): string[] => {
        const alerts: string[] = [];
        if (!isNascido || !postura.data_nasc) return alerts;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataNasc = parseLocalDate(postura.data_nasc);
        if (!dataNasc) return alerts;

        const diffTime = hoje.getTime() - dataNasc.getTime();
        const diasDesdeNasc = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diasDesdeNasc >= diasAnilha && !postura.nro_anel && !postura.ano_anel) {
            alerts.push('Anilhar filhote');
        }
        if (diasDesdeNasc >= diasSepara && !postura.data_separa) {
            alerts.push('Separar filhote');
        }

        return alerts;
    }

    const previsao = calcPrevisaoNascimento()
    const alerts = getAlerts()

    // Cor do ícone e borda baseada no status
    const iconColor = isChocando ? 'text-amber-500' : 'text-emerald-500'
    const borderColor = isChocando
        ? 'border border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500'
        : 'border border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'

    return (
        <div className="flex items-stretch gap-2">
            <button
                onClick={onClick}
                className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg ${borderColor} hover:shadow-sm transition-all active:scale-[0.98] flex-1 text-left min-w-0`}
            >
                <EggIcon className={`w-8 h-8 ${iconColor} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                    {/* Info principal */}
                    {isChocando ? (
                        <>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span>Postura:</span>
                                <span className="font-medium">{formatShortDate(postura.data)}</span>
                                {isFertil ? (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                        Fértil
                                    </span>
                                ) : null}
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
            {/* Indicador de ovo transferido */}
            {postura.gaiola_origem_id && (
                <div className="flex items-center justify-center px-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg" title="Ovo transferido de outro casal">
                    <TransferIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    )
}

// Chip individual de postura no histórico (concluída)
function PosturaHistoricoChip({ postura, onClick }: { postura: Postura; onClick?: () => void }) {

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

    const borderClass = 'border border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg ${borderClass} hover:shadow-sm transition-all active:scale-[0.98] w-full text-left`}
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

// Chip para postura recebida de outro casal (ovo que está chocando aqui mas veio de outro casal)
function PosturaRecebidaChip({ postura, diasChoco, diasAnilha, diasSepara, onClick }: {
    postura: Postura
    diasChoco: number
    diasAnilha: number
    diasSepara: number
    onClick?: () => void
}) {
    const isChocando = postura.sit === SitPostura.CHOCO || postura.sit === SitPostura.FERTIL
    const isNascido = postura.sit === SitPostura.NASCIDO
    const isFertil = postura.sit === SitPostura.FERTIL

    // Calcula previsão de nascimento (para ovos chocando)
    const calcPrevisaoNascimento = (): { data: string; diasRestantes: number } | null => {
        if (!isChocando || !postura.data) return null
        try {
            const dataPostura = parseLocalDate(postura.data)
            if (!dataPostura) return null

            const previsao = new Date(dataPostura)
            previsao.setDate(previsao.getDate() + diasChoco)

            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)

            const diffTime = previsao.getTime() - hoje.getTime()
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            const day = previsao.getDate().toString().padStart(2, '0')
            const month = (previsao.getMonth() + 1).toString().padStart(2, '0')

            return {
                data: `${day}/${month}`,
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
        const dataNasc = parseLocalDate(postura.data_nasc)
        if (!dataNasc) return alerts

        const diffTime = hoje.getTime() - dataNasc.getTime()
        const diasDesdeNasc = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diasDesdeNasc >= diasAnilha && !postura.nro_anel && !postura.ano_anel) {
            alerts.push('Anilhar filhote')
        }
        if (diasDesdeNasc >= diasSepara && !postura.data_separa) {
            alerts.push('Separar filhote')
        }

        return alerts
    }

    const previsao = calcPrevisaoNascimento()
    const alerts = getAlerts()

    // Cor do ícone baseada no status
    const iconColor = isChocando ? 'text-amber-500' : 'text-emerald-500'

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 hover:shadow-sm transition-all active:scale-[0.98] w-full text-left"
        >
            <EggIcon className={`w-8 h-8 ${iconColor} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
                {/* Badge indicando de qual casal veio */}
                {postura.casal_origem && (
                    <div className="mb-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            Do casal {postura.casal_origem.nro}
                        </span>
                    </div>
                )}
                {/* Info principal */}
                {isChocando ? (
                    <>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>Postura:</span>
                            <span className="font-medium">{formatShortDate(postura.data)}</span>
                            {isFertil ? (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                    Fértil
                                </span>
                            ) : null}
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

// Chip para postura transferida para outro casal
function PosturaTransferidaChip({ postura }: { postura: Postura }) {

    // Cor do ícone baseada no status
    const getIconColor = () => {
        switch (postura.sit) {
            case SitPostura.CHOCO:
            case SitPostura.FERTIL:
                return 'text-amber-500'
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
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-dashed border-purple-400 dark:border-purple-500">
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
                {/* Badge indicando para qual casal foi transferido */}
                {postura.casal && (
                    <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            <TransferIcon className="w-3 h-3" />
                            Transferido para casal {postura.casal.nro}
                        </span>
                    </div>
                )}
            </div>
            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
        </div>
    )
}