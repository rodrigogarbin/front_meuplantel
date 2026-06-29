/**
 * Componente TransferPosturaSheet
 * Bottom sheet para transferir um ovo para outro casal
 */

import { useState, useEffect } from 'react'
import type { Casal, Postura } from '@/types'
import { BottomSheet } from '@/components/ui'
import { useCasais, useTransferirPostura } from './casaisApi'
import { formatPassaroCompleto } from '@/lib/passaro'

interface TransferPosturaSheetProps {
    casal: Casal | null
    postura: Postura | null
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function TransferPosturaSheet({ casal, postura, isOpen, onClose, onSuccess }: TransferPosturaSheetProps) {
    const [selectedCasalId, setSelectedCasalId] = useState<number | null>(null)
    const [nroRodada, setNroRodada] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const casalId = casal?.id ?? casal?.gaiola_id ?? null

    // Busca todos os casais ativos
    const { data: casais = [], isLoading: isLoadingCasais } = useCasais({ sit: 1 })

    // Mutation para transferir
    const transferirMutation = useTransferirPostura()

    // Filtra casais removendo o casal atual
    const casaisDisponiveis = casais.filter(c => {
        const cId = c.id ?? c.gaiola_id
        return cId !== casalId
    })

    // Reset form quando abre
    useEffect(() => {
        if (isOpen) {
            setSelectedCasalId(null)
            setNroRodada('')
            setError(null)
        }
    }, [isOpen])

    const handleTransferir = async () => {
        if (!casalId || !postura?.postura_id || !selectedCasalId) {
            setError('Selecione um casal de destino')
            return
        }

        setError(null)

        try {
            await transferirMutation.mutateAsync({
                casalOrigemId: casalId,
                posturaId: postura.postura_id,
                payload: {
                    gaiola_destino_id: selectedCasalId,
                    nro_rodada: nroRodada ? parseInt(nroRodada, 10) : undefined,
                },
            })

            onSuccess?.()
            onClose()
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } }
            setError(error.response?.data?.message || 'Erro ao transferir. Tente novamente.')
        }
    }

    if (!casal || !postura) return null

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Transferir Ovo">
            <div className="space-y-6">
                {/* Info do ovo */}
                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-200 dark:bg-amber-700 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-700 dark:text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2C6.5 2 4 6 4 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                Ovo da Rodada {postura.nro_rodada || '—'}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Casal atual: Nº {casal.nro}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seleção do casal destino */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecione o casal de destino
                    </label>

                    {isLoadingCasais ? (
                        <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    ) : casaisDisponiveis.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Nenhum outro casal ativo disponível
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {casaisDisponiveis.map((c) => {
                                const cId = c.id ?? c.gaiola_id
                                const isSelected = selectedCasalId === cId

                                return (
                                    <button
                                        key={cId}
                                        type="button"
                                        onClick={() => setSelectedCasalId(cId ?? null)}
                                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${isSelected
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isSelected
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400'
                                                }`}>
                                                {c.nro ?? '?'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Casal Nº {c.nro}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    <span className="text-blue-500 font-bold">♂</span>{' '}
                                                    {c.macho ? formatPassaroCompleto(c.macho) : (c.descr_pai || '—')}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    <span className="text-pink-500 font-bold">♀</span>{' '}
                                                    {c.femea ? formatPassaroCompleto(c.femea) : (c.descr_mae || '—')}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Número da rodada (opcional) */}
                <div>
                    <label htmlFor="nro_rodada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número da rodada no destino (opcional)
                    </label>
                    <input
                        type="number"
                        id="nro_rodada"
                        min="1"
                        value={nroRodada}
                        onChange={(e) => setNroRodada(e.target.value)}
                        placeholder="Deixe vazio para usar a rodada atual"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Se não informado, o ovo será adicionado à rodada atual do casal de destino
                    </p>
                </div>

                {/* Erro */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Botões */}
                <div className="space-y-3 pt-2 pb-4">
                    <button
                        onClick={handleTransferir}
                        disabled={!selectedCasalId || transferirMutation.isPending}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {transferirMutation.isPending ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Transferindo...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Transferir Ovo
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}
