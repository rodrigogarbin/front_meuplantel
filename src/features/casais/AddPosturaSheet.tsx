/**
 * Componente AddPosturaSheet
 * Bottom sheet para adicionar novo ovo (postura)
 */

import { useState, useEffect } from 'react'
import type { Casal } from '@/types'
import { SitPostura } from '@/types'
import { BottomSheet } from '@/components/ui'
import { useCreatePostura } from './casaisApi'

interface AddPosturaSheetProps {
    casal: Casal | null
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

// Ícone de ovo
function EggIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C6.5 2 4 6 4 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
        </svg>
    )
}

export function AddPosturaSheet({ casal, isOpen, onClose, onSuccess }: AddPosturaSheetProps) {
    const createPostura = useCreatePostura()

    // Estado do formulário
    const [data, setData] = useState('')
    const [obs, setObs] = useState('')
    const [novaRodada, setNovaRodada] = useState(false)

    // Reset do form quando abre
    useEffect(() => {
        if (isOpen) {
            // Data padrão: hoje
            const hoje = new Date()
            const dataFormatada = hoje.toISOString().split('T')[0]
            setData(dataFormatada)
            setObs('')
            setNovaRodada(false)
        }
    }, [isOpen])

    if (!casal) return null

    // Obtém dias de choco da espécie (do macho ou da fêmea)
    const diasChoco = casal.macho?.especie_usuario?.dias_choco
        ?? casal.macho?.especieUsuario?.dias_choco
        ?? casal.femea?.especie_usuario?.dias_choco
        ?? casal.femea?.especieUsuario?.dias_choco
        ?? null

    // Calcula previsão de nascimento
    const calcPrevisao = (): string | null => {
        if (!data || !diasChoco) return null
        try {
            const dataPostura = new Date(data)
            if (isNaN(dataPostura.getTime())) return null
            dataPostura.setDate(dataPostura.getDate() + diasChoco)
            const day = dataPostura.getDate().toString().padStart(2, '0')
            const month = (dataPostura.getMonth() + 1).toString().padStart(2, '0')
            const year = dataPostura.getFullYear()
            return `${day}/${month}/${year}`
        } catch {
            return null
        }
    }

    const previsaoNascimento = calcPrevisao()

    // Obtém o ID do casal (API retorna como 'id', banco usa 'gaiola_id')
    const casalId = casal.id ?? casal.gaiola_id

    const handleSubmit = async () => {
        if (!data || !casalId) return

        try {
            await createPostura.mutateAsync({
                casalId,
                payload: {
                    data,
                    sit: SitPostura.CHOCO,
                    obs: obs || null,
                    nro_rodada: novaRodada ? (casal.nro_rodadas ?? 0) + 1 : null,
                },
            })

            onClose()
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao adicionar ovo:', error)
        }
    }

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Adicionar Ovo">
            <div className="space-y-6">
                {/* Header visual */}
                <div className="flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <EggIcon className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Info do Casal */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Casal</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">Nº {casal.nro}</p>
                    {casal.nro_rodadas !== undefined && casal.nro_rodadas !== null && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Rodada atual: {casal.nro_rodadas}
                        </p>
                    )}
                </div>

                {/* Campo: Data da Postura */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data da Postura *
                    </label>
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-lg"
                    />
                </div>

                {/* Previsão de Nascimento */}
                {previsaoNascimento && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-amber-700 dark:text-amber-300">Previsão de Nascimento</p>
                                <p className="text-lg font-bold text-amber-800 dark:text-amber-200">{previsaoNascimento}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">{diasChoco} dias de choco</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nova Rodada */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Iniciar nova rodada?</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Rodada {novaRodada ? (casal.nro_rodadas ?? 0) + 1 : casal.nro_rodadas ?? 1}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNovaRodada(!novaRodada)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${novaRodada ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                    >
                        <span
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${novaRodada ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Campo: Observações */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                    </label>
                    <textarea
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                        placeholder="Observações sobre o ovo..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                    />
                </div>

                {/* Erro */}
                {createPostura.isError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
                        Erro ao adicionar ovo. Tente novamente.
                    </div>
                )}

                {/* Botões */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!data || createPostura.isPending}
                        className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createPostura.isPending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <EggIcon className="w-5 h-5" />
                                Adicionar Ovo
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={createPostura.isPending}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}
