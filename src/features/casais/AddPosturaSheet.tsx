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
        <BottomSheet isOpen={isOpen} onClose={onClose} title={`Adicionar Ovo - Casal #${casal.nro}`}>
            <div className="space-y-6">
                {/* Header visual */}
                <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <EggIcon className="w-5 h-5 text-white" />
                    </div>
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
                            className={`absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform ${novaRodada ? 'translate-x-6' : 'translate-x-1'
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
