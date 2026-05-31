/**
 * Bottom sheet para criar uma transação financeira manual
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui'
import { PassaroAutocomplete } from '@/components/ui/PassaroAutocomplete'
import {
    useCreateTransacao,
    useFinanceiroCategorias,
    CATEGORIA_LABELS,
    CATEGORIA_ICONS,
    CATEGORIAS_RECEITA,
    CATEGORIAS_DESPESA,
    CATEGORIA_TIPO,
    type CreateTransacaoInput,
} from './financeiroApi'
import { NovaCategoriaMiniForm } from './NovaCategoriaMiniForm'
import { usePassaros } from '@/features/passaros/passarosApi'
import type { Passaro } from '@/types'

interface Props {
    isOpen: boolean
    onClose: () => void
    passaro_id?: number
    initialTipo?: 'receita' | 'despesa'
    initialCategoria?: string
}

// Categorias do sistema que requerem vínculo de pássaro
const CATEGORIAS_COM_PASSARO = ['venda_passaro', 'compra_passaro']

export function TransacaoFormSheet({ isOpen, onClose, passaro_id, initialTipo, initialCategoria }: Props) {
    const createTransacao = useCreateTransacao()

    const [tipo, setTipo] = useState<'receita' | 'despesa'>(initialTipo ?? 'receita')
    const [categoria, setCategoria] = useState<string>(initialCategoria ?? 'receita_avulsa')
    const [valor, setValor] = useState('')
    const [descricao, setDescricao] = useState('')
    const [data, setData] = useState(new Date().toISOString().split('T')[0])
    const [error, setError] = useState<string | null>(null)
    const [showNovaCategoria, setShowNovaCategoria] = useState(false)
    const [passaroId, setPassaroId] = useState<number | null>(passaro_id ?? null)

    // Categorias dinâmicas do backend
    const { data: cats } = useFinanceiroCategorias()

    // Pássaros ativos para autocomplete (apenas quando categoria requer pássaro)
    const precisaPassaro = CATEGORIAS_COM_PASSARO.includes(categoria)
    const { data: passaros = [], isLoading: isLoadingPassaros } = usePassaros(
        precisaPassaro ? { sit: 1 } : {}
    )

    // Categorias do sistema filtradas pelo tipo atual
    const categoriasDoSistema = [
        ...[...CATEGORIAS_RECEITA].filter(() => tipo === 'receita'),
        ...[...CATEGORIAS_DESPESA].filter(() => tipo === 'despesa'),
    ]

    // Categorias customizadas filtradas pelo tipo atual
    const categoriasCustom = (cats?.customizadas ?? []).filter((c) => c.tipo === tipo)

    // Ao mudar tipo, redefine categoria para a primeira opção válida se necessário
    useEffect(() => {
        const categoriasDoTipo: string[] = [
            ...(tipo === 'receita' ? [...CATEGORIAS_RECEITA] : [...CATEGORIAS_DESPESA]),
            ...(cats?.customizadas ?? []).filter((c) => c.tipo === tipo).map((c) => c.nome),
        ]
        // Verifica se categoria atual ainda é válida para o tipo
        const categoriaAtualEhDoSistema = CATEGORIA_TIPO[categoria]
        if (categoriaAtualEhDoSistema && categoriaAtualEhDoSistema !== tipo) {
            setCategoria(categoriasDoTipo[0] ?? (tipo === 'receita' ? 'receita_avulsa' : 'despesa_geral'))
            setPassaroId(null)
        } else if (!categoriaAtualEhDoSistema) {
            // Categoria customizada — verifica se ainda pertence ao tipo
            const customAtual = cats?.customizadas.find((c) => c.nome === categoria)
            if (customAtual && customAtual.tipo !== tipo) {
                setCategoria(categoriasDoTipo[0] ?? (tipo === 'receita' ? 'receita_avulsa' : 'despesa_geral'))
                setPassaroId(null)
            }
        }
    }, [tipo, cats]) // eslint-disable-line react-hooks/exhaustive-deps

    // Ao abrir, inicializa campos
    useEffect(() => {
        if (isOpen) {
            setTipo(initialTipo ?? 'receita')
            setCategoria(initialCategoria ?? (initialTipo === 'despesa' ? 'despesa_geral' : 'receita_avulsa'))
            setValor('')
            setDescricao('')
            setData(new Date().toISOString().split('T')[0])
            setError(null)
            setShowNovaCategoria(false)
            setPassaroId(passaro_id ?? null)
        }
    }, [isOpen, initialTipo, initialCategoria, passaro_id])

    // Ao mudar categoria, resetar pássaro se não for categoria com pássaro
    function handleCategoriaChange(novaCat: string) {
        setCategoria(novaCat)
        if (!CATEGORIAS_COM_PASSARO.includes(novaCat)) {
            setPassaroId(null)
        }
        setShowNovaCategoria(false)
    }

    const handleSubmit = async () => {
        setError(null)

        const valorNum = parseFloat(valor.replace(',', '.'))
        if (!valor || isNaN(valorNum) || valorNum <= 0) {
            setError('Informe um valor válido maior que zero.')
            return
        }
        if (!data) {
            setError('Informe a data da transação.')
            return
        }

        const input: CreateTransacaoInput = {
            tipo,
            categoria,
            valor: valorNum,
            data,
        }
        if (descricao.trim()) input.descricao = descricao.trim()
        // passaro_id da prop tem prioridade; senão usa o selecionado no autocomplete
        if (passaro_id) {
            input.passaro_id = passaro_id
        } else if (passaroId) {
            input.passaro_id = passaroId
        }

        try {
            await createTransacao.mutateAsync(input)
            onClose()
        } catch {
            setError('Erro ao salvar transação. Tente novamente.')
        }
    }

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Nova Transação">
            <div className="space-y-5">
                {/* Tipo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setTipo('receita')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                tipo === 'receita'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo('despesa')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                tipo === 'despesa'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            Despesa
                        </button>
                    </div>
                </div>

                {/* Categoria */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoria
                    </label>

                    {/* Chips de categorias */}
                    <div className="flex flex-wrap gap-2">
                        {/* Categorias do sistema */}
                        {categoriasDoSistema.map((cat) => {
                            const icon = CATEGORIA_ICONS[cat] ?? ''
                            const label = CATEGORIA_LABELS[cat] ?? cat
                            const isSelected = categoria === cat
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleCategoriaChange(cat)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                        isSelected
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    {icon && <span>{icon}</span>}
                                    {label}
                                </button>
                            )
                        })}

                        {/* Categorias customizadas */}
                        {categoriasCustom.map((cat) => {
                            const isSelected = categoria === cat.nome
                            return (
                                <button
                                    key={cat.financeiro_categoria_id}
                                    type="button"
                                    onClick={() => handleCategoriaChange(cat.nome)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                        isSelected
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    {cat.icone && <span>{cat.icone}</span>}
                                    {cat.nome}
                                </button>
                            )
                        })}

                        {/* Botão nova categoria */}
                        {!showNovaCategoria && (
                            <button
                                type="button"
                                onClick={() => setShowNovaCategoria(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nova categoria...
                            </button>
                        )}
                    </div>

                    {/* Mini-form de nova categoria */}
                    {showNovaCategoria && (
                        <NovaCategoriaMiniForm
                            tipo={tipo}
                            onCreated={(nome) => {
                                setCategoria(nome)
                                setShowNovaCategoria(false)
                            }}
                            onCancel={() => setShowNovaCategoria(false)}
                        />
                    )}
                </div>

                {/* Vínculo de pássaro (apenas para venda/compra) */}
                {precisaPassaro && !passaro_id && (
                    <div>
                        <PassaroAutocomplete
                            label={categoria === 'venda_passaro' ? 'Pássaro vendido (opcional)' : 'Pássaro comprado (opcional)'}
                            value={passaroId}
                            onChange={(id: number | null, _passaro: Passaro | null) => setPassaroId(id)}
                            options={passaros}
                            placeholder="Digite para buscar..."
                            isLoading={isLoadingPassaros}
                        />
                    </div>
                )}

                {/* Valor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor (R$) *
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-semibold"
                    />
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrição (opcional)
                    </label>
                    <input
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex: Venda para João, Ração, ..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                        onClick={handleSubmit}
                        disabled={createTransacao.isPending}
                        className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createTransacao.isPending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Salvando...
                            </>
                        ) : (
                            'Salvar'
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={createTransacao.isPending}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}
