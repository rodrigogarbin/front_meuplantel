/**
 * Mini-formulário inline para criar uma nova categoria financeira customizada
 */

import { useState } from 'react'
import { useCreateCategoria } from './financeiroApi'

interface Props {
    tipo: 'receita' | 'despesa'
    onCreated: (nome: string) => void
    onCancel: () => void
}

export function NovaCategoriaMiniForm({ tipo, onCreated, onCancel }: Props) {
    const [icone, setIcone] = useState('')
    const [nome, setNome] = useState('')
    const [error, setError] = useState('')
    const { mutateAsync, isPending } = useCreateCategoria()

    async function handleSalvar() {
        if (!nome.trim()) {
            setError('Nome obrigatório')
            return
        }
        try {
            await mutateAsync({ nome: nome.trim(), tipo, icone: icone.trim() || undefined })
            onCreated(nome.trim())
        } catch {
            setError('Erro ao criar categoria')
        }
    }

    return (
        <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40 p-3">
            <p className="mb-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">Nova categoria</p>
            <div className="flex gap-2">
                <input
                    type="text"
                    maxLength={2}
                    placeholder="🏷"
                    value={icone}
                    onChange={(e) => setIcone(e.target.value)}
                    className="w-12 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-center text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                    type="text"
                    maxLength={50}
                    placeholder="Nome da categoria"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                    onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    onClick={handleSalvar}
                    disabled={isPending}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                    {isPending ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}
