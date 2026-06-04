/**
 * Página principal do módulo financeiro
 */

import { useState, useMemo } from 'react'
import { Topbar, PullToRefresh, EmptyState } from '@/components/ui'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StatCard, StatCardSkeleton } from '@/features/dashboard/StatCard'
import { ApexLineChart } from '@/features/dashboard/ApexLineChart'
import { ApexPieChart } from '@/features/dashboard/ApexPieChart'
import {
    useFinanceiro,
    useFinanceiroDashboard,
    useDeleteTransacao,
    CATEGORIA_LABELS,
    CATEGORIA_ICONS,
    type Transacao,
} from './financeiroApi'
import { TransacaoFormSheet } from './TransacaoFormSheet'

// Formata valor monetário
const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// Formata mês para header da lista
const formatMesHeader = (mesStr: string) => {
    const [ano, mes] = mesStr.split('-')
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${nomes[parseInt(mes) - 1]} ${ano}`
}

// Ícone de carteira
function WalletIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
    )
}

function ArrowUpIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
    )
}

function ArrowDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
        </svg>
    )
}

const CORES_RECEITA: Record<string, string> = {
    venda_passaro:  '#10B981',
    receita_avulsa: '#3B82F6',
}
const CORES_DESPESA: Record<string, string> = {
    compra_passaro: '#F59E0B',
    despesa_geral:  '#EF4444',
}

// Filtro de tipo para extrato
type FiltroTipo = 'todos' | 'receita' | 'despesa'

const filtroOptions = [
    { value: 'todos' as FiltroTipo, label: 'Todos' },
    { value: 'receita' as FiltroTipo, label: 'Receitas' },
    { value: 'despesa' as FiltroTipo, label: 'Despesas' },
]

export function FinanceiroPage() {
    const [tabIndex, setTabIndex] = useState(0)
    const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
    const [showFormSheet, setShowFormSheet] = useState(false)
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const tabOptions = [
        { value: 0, label: 'Dashboard' },
        { value: 1, label: 'Extrato' },
    ]

    // Queries
    const {
        data: dashboard,
        isLoading: isLoadingDashboard,
        refetch: refetchDashboard,
    } = useFinanceiroDashboard(6)

    const filtrosExtrato = filtroTipo !== 'todos' ? { tipo: filtroTipo as 'receita' | 'despesa' } : {}
    const {
        data: transacoesData,
        isLoading: isLoadingTransacoes,
        refetch: refetchTransacoes,
    } = useFinanceiro(filtrosExtrato)
    const transacoes: Transacao[] = transacoesData?.data ?? []

    const deleteTransacao = useDeleteTransacao()

    // Agrupa transações por mês para o extrato
    const transacoesPorMes = useMemo(() => {
        const grupos: Record<string, Transacao[]> = {}
        for (const t of transacoes) {
            const mes = t.data.slice(0, 7)
            if (!grupos[mes]) grupos[mes] = []
            grupos[mes].push(t)
        }
        // Ordena meses decrescente
        return Object.fromEntries(
            Object.entries(grupos).sort(([a], [b]) => b.localeCompare(a))
        )
    }, [transacoes])

    // Dados para gráfico de linha
    const lineChartData = useMemo(() => {
        if (!dashboard?.por_mes?.length) return null
        const sorted = [...dashboard.por_mes].sort((a, b) => a.mes.localeCompare(b.mes))
        return {
            labels: sorted.map((m) => formatMesHeader(m.mes)),
            series: [
                {
                    label: 'Receitas',
                    color: '#10B981',
                    data: sorted.map((m) => m.receitas),
                },
                {
                    label: 'Despesas',
                    color: '#EF4444',
                    data: sorted.map((m) => m.despesas),
                },
            ],
        }
    }, [dashboard])

    // Dados para gráficos de pizza separados por tipo
    const pieReceitas = useMemo(() => {
        if (!dashboard?.por_categoria?.length) return []
        return dashboard.por_categoria
            .filter((c) => c.tipo === 'receita' && c.total > 0)
            .map((c) => ({
                label: CATEGORIA_LABELS[c.categoria] ?? c.categoria,
                value: c.total,
                color: CORES_RECEITA[c.categoria] ?? '#6EE7B7',
            }))
    }, [dashboard])

    const pieDespesas = useMemo(() => {
        if (!dashboard?.por_categoria?.length) return []
        return dashboard.por_categoria
            .filter((c) => c.tipo === 'despesa' && c.total > 0)
            .map((c) => ({
                label: CATEGORIA_LABELS[c.categoria] ?? c.categoria,
                value: c.total,
                color: CORES_DESPESA[c.categoria] ?? '#FCA5A5',
            }))
    }, [dashboard])

    const handleDeleteConfirm = async (id: number) => {
        setConfirmDeleteId(null)
        setDeletingId(id)
        try {
            await deleteTransacao.mutateAsync(id)
        } finally {
            setDeletingId(null)
        }
    }

    const handleRefresh = async () => {
        if (tabIndex === 0) {
            await refetchDashboard()
        } else {
            await refetchTransacoes()
        }
    }

    const saldoPositivo = (dashboard?.saldo ?? 0) >= 0

    return (
        <>
            <Topbar title="Financeiro" />

            <PullToRefresh onRefresh={handleRefresh} disabled={isLoadingDashboard || isLoadingTransacoes}>
                <div className="px-4 pt-4 pb-28 max-w-4xl mx-auto">
                    {/* Tabs */}
                    <div className="mb-6">
                        <SegmentedControl
                            options={tabOptions}
                            value={tabIndex}
                            onChange={(v) => setTabIndex(v as number)}
                        />
                    </div>

                    {/* ===== ABA DASHBOARD ===== */}
                    {tabIndex === 0 && (
                        <>
                            {/* StatCards */}
                            <section className="mb-8">
                                {isLoadingDashboard ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <StatCardSkeleton />
                                        <StatCardSkeleton />
                                        <div className="col-span-2">
                                            <StatCardSkeleton />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <StatCard
                                                title="Receitas"
                                                value={formatCurrency(dashboard?.total_receitas ?? 0)}
                                                icon={<ArrowUpIcon className="w-5 h-5" />}
                                                color="green"
                                            />
                                            <StatCard
                                                title="Despesas"
                                                value={formatCurrency(dashboard?.total_despesas ?? 0)}
                                                icon={<ArrowDownIcon className="w-5 h-5" />}
                                                color="red"
                                            />
                                        </div>
                                        <StatCard
                                            title="Saldo"
                                            value={formatCurrency(dashboard?.saldo ?? 0)}
                                            icon={<WalletIcon className="w-5 h-5" />}
                                            color={saldoPositivo ? 'green' : 'red'}
                                        />
                                    </div>
                                )}
                            </section>

                            {/* Gráfico de linha */}
                            {lineChartData && (
                                <section className="mb-8">
                                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Evolução (últimos 6 meses)
                                    </h2>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <ApexLineChart
                                            labels={lineChartData.labels}
                                            series={lineChartData.series}
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Donut receitas por categoria */}
                            {pieReceitas.length > 0 && (
                                <section className="mb-8">
                                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Receitas por categoria
                                    </h2>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <ApexPieChart data={pieReceitas} />
                                    </div>
                                </section>
                            )}

                            {/* Donut despesas por categoria */}
                            {pieDespesas.length > 0 && (
                                <section className="mb-8">
                                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Despesas por categoria
                                    </h2>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <ApexPieChart data={pieDespesas} />
                                    </div>
                                </section>
                            )}

                            {!isLoadingDashboard && !dashboard && (
                                <EmptyState
                                    title="Nenhuma movimentação ainda"
                                    description="Adicione receitas e despesas pelo botão abaixo"
                                    icon={<WalletIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
                                />
                            )}
                        </>
                    )}

                    {/* ===== ABA EXTRATO ===== */}
                    {tabIndex === 1 && (
                        <>
                            {/* Chips filtro */}
                            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                                {filtroOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFiltroTipo(opt.value)}
                                        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            filtroTipo === opt.value
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Loading */}
                            {isLoadingTransacoes && (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i}>
                                            <div className="skeleton h-4 w-20 rounded mb-3" />
                                            <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
                                                {[1, 2].map((j) => (
                                                    <div key={j} className="flex items-center gap-3 p-4">
                                                        <div className="skeleton w-10 h-10 rounded-xl" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="skeleton h-3 rounded w-2/3" />
                                                            <div className="skeleton h-3 rounded w-1/3" />
                                                        </div>
                                                        <div className="skeleton h-5 rounded w-16" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Lista agrupada por mês */}
                            {!isLoadingTransacoes && (
                                <>
                                    {Object.keys(transacoesPorMes).length === 0 ? (
                                        <EmptyState
                                            title="Nenhuma transação encontrada"
                                            icon={<WalletIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
                                        />
                                    ) : (
                                        <div className="space-y-6">
                                            {Object.entries(transacoesPorMes).map(([mes, lista]) => {
                                                const totalMes = lista.reduce((acc, t) => {
                                                    const v = Number(t.valor)
                                                    return t.tipo === 'receita' ? acc + v : acc - v
                                                }, 0)

                                                return (
                                                    <section key={mes}>
                                                        {/* Header do mês */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                {formatMesHeader(mes)}
                                                            </h3>
                                                            <span className={`text-sm font-semibold ${totalMes >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {totalMes >= 0 ? '+' : ''}{formatCurrency(totalMes)}
                                                            </span>
                                                        </div>

                                                        {/* Itens */}
                                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                            {lista.map((t, idx) => (
                                                                <div
                                                                    key={t.financeiro_id}
                                                                    className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                                                                >
                                                                    {/* Ícone categoria */}
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${t.tipo === 'receita' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                                                                        {CATEGORIA_ICONS[t.categoria] ?? '💱'}
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                            {CATEGORIA_LABELS[t.categoria] ?? t.categoria}
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                                            </p>
                                                                            {t.descricao && (
                                                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                                                                    · {t.descricao}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Valor + Ações */}
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {confirmDeleteId === t.financeiro_id ? (
                                                                            /* Modo confirmação inline */
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => handleDeleteConfirm(t.financeiro_id)}
                                                                                    disabled={deletingId === t.financeiro_id}
                                                                                    className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                                                >
                                                                                    Confirmar
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmDeleteId(null)}
                                                                                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                                                >
                                                                                    Cancelar
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <span className={`text-sm font-bold ${t.tipo === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                                    {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                                                                                </span>

                                                                                {/* Botão delete */}
                                                                                <button
                                                                                    onClick={() => setConfirmDeleteId(t.financeiro_id)}
                                                                                    disabled={deletingId === t.financeiro_id}
                                                                                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                                                                    aria-label="Excluir transação"
                                                                                >
                                                                                    {deletingId === t.financeiro_id ? (
                                                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                                        </svg>
                                                                                    ) : (
                                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                                        </svg>
                                                                                    )}
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </PullToRefresh>

            {/* FAB */}
            <button
                onClick={() => setShowFormSheet(true)}
                className="fixed right-4 bottom-24 z-40 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-gray-900 hover:bg-green-600 active:scale-95 transition-all"
                aria-label="Nova transação"
            >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Sheet de criação de transação */}
            <TransacaoFormSheet
                isOpen={showFormSheet}
                onClose={() => setShowFormSheet(false)}
            />
        </>
    )
}
