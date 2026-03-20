/**
 * Página de configuração do período histórico para Gestão do Plantel
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { useGestaoConfig, useSaveGestaoConfig } from './accountApi'

const ANO_ATUAL = new Date().getFullYear()

export function GestaoConfigPage() {
    const navigate = useNavigate()
    const { data, isLoading } = useGestaoConfig()
    const { mutate: save, isPending, isSuccess } = useSaveGestaoConfig()

    const [tipo, setTipo] = useState<0 | 1 | 2>(0)
    const [valor, setValor] = useState<string>('')

    useEffect(() => {
        if (data) {
            setTipo(data.tipo)
            setValor(data.valor != null ? String(data.valor) : '')
        }
    }, [data])

    function handleSave() {
        const valorNum = valor !== '' ? parseInt(valor, 10) : null
        save({ tipo, valor: tipo > 0 ? valorNum : null })
    }

    const isValid = () => {
        if (tipo === 0) return true
        const n = parseInt(valor, 10)
        if (isNaN(n)) return false
        if (tipo === 1) return n >= 1900 && n <= ANO_ATUAL
        if (tipo === 2) return n >= 1 && n <= 50
        return false
    }

    return (
        <>
            <Topbar title="Período da Análise" showBack onBack={() => navigate(-1)} />
            <main className="page-content">
                <div className="p-4 max-w-lg mx-auto space-y-6">

                    <section>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Define quais anos compõem a <strong>média histórica</strong> exibida na tela de Gestão do Plantel.
                        </p>

                        <div className="section-card divide-y divide-gray-100 dark:divide-gray-700">
                            {/* Opção: todos os anos */}
                            <label className="flex items-center gap-3 py-3.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="tipo"
                                    className="accent-primary w-4 h-4 shrink-0"
                                    checked={tipo === 0}
                                    onChange={() => setTipo(0)}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Todos os anos</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Usa todos os dados desde o início</p>
                                </div>
                            </label>

                            {/* Opção: a partir de ano específico */}
                            <div>
                                <label className="flex items-center gap-3 py-3.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        className="accent-primary w-4 h-4 shrink-0"
                                        checked={tipo === 1}
                                        onChange={() => setTipo(1)}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">A partir de um ano</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Ex.: somente de 2020 em diante</p>
                                    </div>
                                </label>
                                {tipo === 1 && (
                                    <div className="pb-3 pl-7">
                                        <input
                                            type="number"
                                            value={valor}
                                            onChange={e => setValor(e.target.value)}
                                            min={1900}
                                            max={ANO_ATUAL}
                                            placeholder={String(ANO_ATUAL - 5)}
                                            className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Entre 1900 e {ANO_ATUAL}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Opção: últimos N anos */}
                            <div>
                                <label className="flex items-center gap-3 py-3.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        className="accent-primary w-4 h-4 shrink-0"
                                        checked={tipo === 2}
                                        onChange={() => setTipo(2)}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Últimos N anos</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Ex.: considerar apenas os últimos 5 anos</p>
                                    </div>
                                </label>
                                {tipo === 2 && (
                                    <div className="pb-3 pl-7">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={valor}
                                                onChange={e => setValor(e.target.value)}
                                                min={1}
                                                max={50}
                                                placeholder="5"
                                                className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">anos</span>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Entre 1 e 50
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <button
                        onClick={handleSave}
                        disabled={isPending || isLoading || !isValid()}
                        className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 transition-opacity active:scale-[0.98]"
                    >
                        {isPending ? 'Salvando...' : 'Salvar'}
                    </button>

                    {isSuccess && (
                        <p className="text-center text-sm text-green-600 dark:text-green-400">
                            Configuração salva! As análises serão atualizadas.
                        </p>
                    )}
                </div>
            </main>
        </>
    )
}
