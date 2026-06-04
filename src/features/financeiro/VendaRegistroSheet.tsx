/**
 * Bottom sheet para registrar venda de um pássaro após marcar como Vendido
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui'
import { useCreateTransacao } from './financeiroApi'

interface Props {
    isOpen: boolean
    onClose: () => void
    onPular: () => void
    passaro: { passaro_id: number; descr?: string; anel?: string } | null
}

export function VendaRegistroSheet({ isOpen, onClose, onPular, passaro }: Props) {
    const createTransacao = useCreateTransacao()

    const [valor, setValor] = useState('')
    const [comprador, setComprador] = useState('')
    const [data, setData] = useState(new Date().toISOString().split('T')[0])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setValor('')
            setComprador('')
            setData(new Date().toISOString().split('T')[0])
            setError(null)
        }
    }, [isOpen])

    if (!passaro) return null

    const identificacao = passaro.anel || passaro.descr || `Pássaro #${passaro.passaro_id}`

    const handleRegistrar = async () => {
        setError(null)

        const valorNum = parseFloat(valor.replace(',', '.'))
        if (!valor || isNaN(valorNum) || valorNum <= 0) {
            setError('Informe o valor da venda.')
            return
        }
        if (!data) {
            setError('Informe a data da venda.')
            return
        }

        try {
            await createTransacao.mutateAsync({
                tipo: 'receita',
                categoria: 'venda_passaro',
                valor: valorNum,
                descricao: comprador.trim() || undefined,
                data,
                passaro_id: passaro.passaro_id,
            })
            onClose()
        } catch {
            setError('Erro ao registrar venda. Tente novamente.')
        }
    }

    return (
        <BottomSheet isOpen={isOpen} onClose={onPular} title="Registrar Venda">
            <div className="space-y-5">
                {/* Cabeçalho visual */}
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0 text-white text-lg">
                        🐦
                    </div>
                    <div>
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                            Registrar venda de
                        </p>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                            {identificacao}
                        </p>
                    </div>
                </div>

                {/* Valor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor da venda (R$) *
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg font-semibold"
                    />
                </div>

                {/* Comprador */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comprador (opcional)
                    </label>
                    <input
                        type="text"
                        value={comprador}
                        onChange={(e) => setComprador(e.target.value)}
                        placeholder="Nome do comprador"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                </div>

                {/* Data */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data *
                    </label>
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                </div>

                {/* Erro */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Botões */}
                <div className="space-y-3 pt-1">
                    <button
                        onClick={handleRegistrar}
                        disabled={createTransacao.isPending}
                        className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createTransacao.isPending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Registrando...
                            </>
                        ) : (
                            'Registrar venda'
                        )}
                    </button>

                    <button
                        onClick={onPular}
                        disabled={createTransacao.isPending}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        Pular
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}
