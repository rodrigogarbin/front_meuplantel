/**
 * Página de Gestão do Plantel
 *
 * Aba 1 — Visão Geral: cards de resumo + comparativo ano atual vs média + gráfico de casais por ano + distribuição de posturas
 * Aba 2 — Melhores Reprodutores: ranking clicável + análise detalhada da ave selecionada
 *
 * Padrão de UI: mesmo que DashboardPage (StatCard, ApexCharts, PullToRefresh)
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGestaoConfig } from '@/features/config/accountApi'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { Topbar, PullToRefresh } from '@/components/ui'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StatCard, StatCardSkeleton } from '@/features/dashboard/StatCard'
import { ApexPieChart } from '@/features/dashboard/ApexPieChart'
import { useThemeStore } from '@/lib/theme'
import { sexIcon, sexColor } from '@/lib/passaro'
import {
    useGestaoEstatisticas,
    useGestaoMelhoresReprodutoresInfinite,
    useGestaoPassaro,
} from './gestaoApi'
import type { ComparativoStats, MelhoresReprodutoresItem, PassaroAnalise, PeriodoTipo } from './gestaoApi'

// ——— helpers ——————————————————————————————————————————

function anelLabel(anel: MelhoresReprodutoresItem['anel'] | null | undefined): string {
    if (!anel) return '(sem anel)'
    const parts: string[] = []
    if (anel.sg_clube) parts.push(anel.sg_clube)
    if (anel.nro_criador) parts.push(anel.nro_criador)
    parts.push(`${String(anel.nro).padStart(3, '0')}/${anel.ano}`)
    return parts.join(' ')
}

function fmtPct(n: number): string {
    return `${n.toFixed(1)}%`
}

function fmtDate(s: string | null | undefined): string {
    if (!s) return '—'
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
}

function filtroLabel(tipo: 0 | 1 | 2, valor: number | null): string | null {
    if (tipo === 1 && valor) return `a partir de ${valor}`
    if (tipo === 2 && valor) return `últimos ${valor} ano${valor > 1 ? 's' : ''}`
    return null
}

function taxaColor(taxa: number): string {
    if (taxa >= 70) return 'text-green-600 dark:text-green-400'
    if (taxa >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-500 dark:text-red-400'
}

function deltaClass(atual: number, media: number): string {
    if (atual >= media) return 'text-green-600 dark:text-green-400'
    return 'text-red-500 dark:text-red-400'
}

function deltaArrow(atual: number, media: number): string {
    if (atual > media) return '↑'
    if (atual < media) return '↓'
    return '='
}

// ——— ícones inline ——————————————————————————————————————

function IconCasais() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    )
}

function IconBird() {
    return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 5.4 8 6.6 8 8c0 1.4.4 2.6 1 3.5.3.4.6.8 1 1.1V15l-2 2v2h8v-2l-2-2v-2.4c.4-.3.7-.7 1-1.1.6-.9 1-2.1 1-3.5 0-1.4-.4-2.6-1-3.5-.6-.9-1.8-1.5-3-1.5z" />
        </svg>
    )
}

function IconChart() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    )
}

function IconStar() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}

// ——— Comparativo ——————————————————————————————————————

function ComparativoRow({
    label, atual, media, fmt = (v: number) => String(Math.round(v)),
    higherIsBetter = true, pctAtual, pctMedia,
}: {
    label: string
    atual: number
    media: number
    fmt?: (v: number) => string
    higherIsBetter?: boolean
    pctAtual?: number   // % do total no período atual
    pctMedia?: number   // % do total na média histórica
}) {
    const colorClass = higherIsBetter ? deltaClass(atual, media) : deltaClass(-atual, -media)
    const arrow = deltaArrow(atual, media)

    // variação em pontos percentuais (quando ambos os % estão disponíveis)
    const deltaPp = pctAtual !== undefined && pctMedia !== undefined
        ? Math.round(pctAtual) - Math.round(pctMedia)
        : null
    const deltaPpStr = deltaPp !== null && deltaPp !== 0
        ? `${deltaPp > 0 ? '+' : ''}${deltaPp}pp`
        : null
    const ppColorClass = deltaPp !== null
        ? (higherIsBetter ? (deltaPp >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400')
                          : (deltaPp <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'))
        : ''

    return (
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0 items-start">
            <span className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">{label}</span>

            {/* Atual + % */}
            <div className="text-right">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmt(atual)}</div>
                {pctAtual !== undefined && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">{Math.round(pctAtual)}%</div>
                )}
            </div>

            {/* Média + % + variação */}
            <div className="text-right pl-8 min-w-[5rem]">
                <div className="flex items-center justify-end gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{fmt(media)}</span>
                    <span className={`text-xs font-bold ${colorClass}`}>{arrow}</span>
                </div>
                {pctMedia !== undefined && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                        {Math.round(pctMedia)}%
                        {deltaPpStr && (
                            <span className={`ml-1 font-medium ${ppColorClass}`}>{deltaPpStr}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function PeriodoSelector({
    tipo, valor, valorFim, onChange,
}: {
    tipo: PeriodoTipo
    valor: number
    valorFim: number
    onChange: (tipo: PeriodoTipo, valor: number, valorFim: number) => void
}) {
    const hoje = new Date()
    const mesAtual       = hoje.getMonth() + 1
    const trimestreAtual = Math.ceil(mesAtual / 3)
    const semestreAtual  = mesAtual <= 6 ? 1 : 2

    // Para o range de mês: 'inicio' ou 'fim'
    const [selecting, setSelecting] = useState<'inicio' | 'fim'>('inicio')

    const tipoOpts: { v: PeriodoTipo; label: string }[] = [
        { v: 'ano',       label: 'Ano' },
        { v: 'mes',       label: 'Mês' },
        { v: 'trimestre', label: 'Trimestre' },
        { v: 'semestre',  label: 'Semestre' },
    ]

    function handleTipo(t: PeriodoTipo) {
        setSelecting('inicio')
        const defaultValor = t === 'mes' ? mesAtual
            : t === 'trimestre' ? trimestreAtual
            : t === 'semestre'  ? semestreAtual
            : 0
        onChange(t, defaultValor, defaultValor)
    }

    function handleMesClick(m: number) {
        if (selecting === 'inicio') {
            const novoFim = valorFim >= m ? valorFim : m
            onChange('mes', m, novoFim)
            setSelecting('fim')
        } else {
            if (m < valor) {
                onChange('mes', m, valor)
            } else {
                onChange('mes', valor, m)
            }
            setSelecting('inicio')
        }
    }

    return (
        <div className="mb-4">
            {/* Tipo */}
            <div className="flex gap-1.5 mb-3">
                {tipoOpts.map(opt => (
                    <button
                        key={opt.v}
                        onClick={() => handleTipo(opt.v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            tipo === opt.v
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Seletor do valor */}
            {tipo === 'mes' && (
                <div>
                    {/* Indicador De → Até */}
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => setSelecting('inicio')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                selecting === 'inicio'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            De: {MESES_ABREV[valor - 1]}
                        </button>
                        <span className="text-gray-400 text-xs">→</span>
                        <button
                            onClick={() => setSelecting('fim')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                selecting === 'fim'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            Até: {MESES_ABREV[valorFim - 1]}
                        </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                        {MESES_ABREV.map((m, i) => {
                            const mes = i + 1
                            const isStart = mes === valor
                            const isEnd   = mes === valorFim
                            const inRange = mes > valor && mes < valorFim
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleMesClick(mes)}
                                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        isStart || isEnd
                                            ? 'bg-primary text-white'
                                            : inRange
                                                ? 'bg-primary/20 text-primary dark:text-primary'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {m}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {tipo === 'trimestre' && (
                <div className="flex gap-2">
                    {[1,2,3,4].map(t => (
                        <button
                            key={t}
                            onClick={() => onChange('trimestre', t, t)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                valor === t
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            T{t}
                        </button>
                    ))}
                </div>
            )}

            {tipo === 'semestre' && (
                <div className="flex gap-2">
                    {[1,2].map(s => (
                        <button
                            key={s}
                            onClick={() => onChange('semestre', s, s)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                valor === s
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {s}º Semestre
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function ComparativoSection({
    ano, periodoNome, anoAtual, mediaHistorica, tipo, valor, valorFim, onPeriodoChange,
}: {
    ano: number
    periodoNome: string
    anoAtual: ComparativoStats
    mediaHistorica: ComparativoStats | null
    tipo: PeriodoTipo
    valor: number
    valorFim: number
    onPeriodoChange: (tipo: PeriodoTipo, valor: number, valorFim: number) => void
}) {
    const labelAtual = tipo === 'ano' ? String(ano) : `${periodoNome} ${ano}`

    return (
        <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Comparativo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {labelAtual} vs média histórica
            </p>

            <PeriodoSelector tipo={tipo} valor={valor} valorFim={valorFim} onChange={onPeriodoChange} />

            {!mediaHistorica ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Sem dados históricos suficientes para este período.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-medium text-right text-primary">{labelAtual}</span>
                        <span className="text-xs font-medium text-right text-gray-500 dark:text-gray-400 pl-8 min-w-[5rem]">Média hist.</span>
                    </div>
                    <div className="px-4">
                        {(() => {
                            const baseAtual = anoAtual.ovos
                            const baseMedia = mediaHistorica.ovos
                            const pcts = (a: number, m: number) => ({
                                pctAtual: baseAtual > 0 ? (a / baseAtual) * 100 : undefined,
                                pctMedia: baseMedia > 0 ? (m / baseMedia) * 100 : undefined,
                            })
                            return (
                                <>
                                    {tipo === 'ano' && (
                                        <ComparativoRow label="Casais" atual={anoAtual.casais} media={mediaHistorica.casais} />
                                    )}
                                    <ComparativoRow label="Ovos"          atual={anoAtual.ovos}          media={mediaHistorica.ovos} />
                                    <ComparativoRow label="Nascidos"      atual={anoAtual.nascidos}      media={mediaHistorica.nascidos}      {...pcts(anoAtual.nascidos,      mediaHistorica.nascidos)} />
                                    <ComparativoRow label="Fecundados"    atual={anoAtual.fecundados}    media={mediaHistorica.fecundados}    {...pcts(anoAtual.fecundados,    mediaHistorica.fecundados)} />
                                    <ComparativoRow label="Brancos"       atual={anoAtual.branco}        media={mediaHistorica.branco}        higherIsBetter={false} {...pcts(anoAtual.branco,        mediaHistorica.branco)} />
                                    <ComparativoRow label="Embrião morto" atual={anoAtual.embriao_morto} media={mediaHistorica.embriao_morto} higherIsBetter={false} {...pcts(anoAtual.embriao_morto, mediaHistorica.embriao_morto)} />
                                    <ComparativoRow label="Filhote morto" atual={anoAtual.filhote_morto} media={mediaHistorica.filhote_morto} higherIsBetter={false} {...pcts(anoAtual.filhote_morto, mediaHistorica.filhote_morto)} />
                                    <ComparativoRow label="Tx Fecundação" atual={anoAtual.taxa_fecundacao} media={mediaHistorica.taxa_fecundacao} fmt={fmtPct} />
                                    <ComparativoRow label="Tx Eclosão"    atual={anoAtual.taxa_eclosao}    media={mediaHistorica.taxa_eclosao}    fmt={fmtPct} />
                                </>
                            )
                        })()}
                    </div>
                </div>
            )}
        </section>
    )
}

// ——— Aba 1 — Visão Geral ——————————————————————————————

function AbaVisaoGeral() {
    const hoje = new Date()
    const [periodoTipo, setPeriodoTipo]       = useState<PeriodoTipo>('ano')
    const [periodoValor, setPeriodoValor]     = useState(0)
    const [periodoValorFim, setPeriodoValorFim] = useState(0)

    function handlePeriodoChange(tipo: PeriodoTipo, valor: number, valorFim: number) {
        setPeriodoTipo(tipo)
        setPeriodoValor(valor)
        setPeriodoValorFim(valorFim)
    }

    const periodoParams = periodoTipo !== 'ano' || periodoValor > 0
        ? { tipo: periodoTipo, valor: periodoValor, valorFim: periodoValorFim }
        : undefined

    const { data, isLoading, isError, refetch } = useGestaoEstatisticas(periodoParams)
    const theme = useThemeStore(s => s.mode)
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    const barOptions: ApexOptions = useMemo(() => ({
        chart: {
            type: 'bar',
            background: 'transparent',
            fontFamily: 'inherit',
            toolbar: { show: false },
        },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
        dataLabels: { enabled: false },
        colors: ['#3B82F6'],
        xaxis: {
            categories: data?.casais_por_ano.map(d => String(d.ano)) ?? [],
            labels: { style: { colors: isDark ? '#9CA3AF' : '#6B7280', fontSize: '12px' } },
            axisBorder: { color: isDark ? '#374151' : '#E5E7EB' },
            axisTicks: { color: isDark ? '#374151' : '#E5E7EB' },
        },
        yaxis: {
            labels: {
                style: { colors: isDark ? '#9CA3AF' : '#6B7280', fontSize: '12px' },
                formatter: (v) => Math.round(v).toString(),
            },
        },
        grid: { borderColor: isDark ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
        tooltip: { theme: isDark ? 'dark' : 'light' },
    }), [data, isDark])

    const barSeries = useMemo(() => [{
        name: 'Casais ativos',
        data: data?.casais_por_ano.map(d => d.total) ?? [],
    }], [data])

    const posturasPieData = useMemo(() => {
        if (!data) return []
        const p = data.posturas_por_situacao
        return [
            { label: 'Nascidos',       value: p.nascido,       color: '#10B981' },
            { label: 'Em choco',       value: p.choco,         color: '#3B82F6' },
            { label: 'Férteis',        value: p.fertil,        color: '#F59E0B' },
            { label: 'Brancos',        value: p.branco,        color: '#9CA3AF' },
            { label: 'Embrião morto',  value: p.embriao_morto, color: '#F97316' },
            { label: 'Filhote morto',  value: p.filhote_morto, color: '#EF4444' },
        ].filter(d => d.value > 0)
    }, [data])

    const periodoLabel = data?.filtro ? filtroLabel(data.filtro.tipo, data.filtro.valor) : null

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }} disabled={isLoading}>
            <div className="px-4 py-6 max-w-4xl mx-auto">
                {/* Cards de resumo */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Resumo do Plantel</h2>
                        {periodoLabel && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                {periodoLabel}
                            </span>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-4">
                            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                        </div>
                    ) : isError ? (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-center text-sm">
                            Erro ao carregar estatísticas
                        </div>
                    ) : data ? (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <StatCard title="Total de Casais" value={data.total_casais} icon={<IconCasais />} color="blue" />
                                <StatCard title="Casais Ativos" value={data.casais_ativos} icon={<IconCasais />} color="green" />
                                <StatCard title="Filhotes Nascidos" value={data.total_filhotes} icon={<IconBird />} color="yellow" />
                                <StatCard
                                    title="Taxa de Fecundação"
                                    value={fmtPct(data.taxa_fecundacao)}
                                    subtitle={`Eclosão ${fmtPct(data.taxa_eclosao)}`}
                                    icon={<IconChart />}
                                    color="purple"
                                />
                            </div>
                        </>
                    ) : null}
                </section>

                {/* Comparativo */}
                <ComparativoSection
                    ano={data?.comparativo?.ano ?? hoje.getFullYear()}
                    periodoNome={data?.comparativo?.periodo?.nome ?? 'Ano'}
                    anoAtual={data?.comparativo?.ano_atual ?? { casais:0,ovos:0,nascidos:0,ferteis:0,choco:0,branco:0,embriao_morto:0,filhote_morto:0,fecundados:0,eclodidos:0,taxa_fecundacao:0,taxa_eclosao:0 }}
                    mediaHistorica={data?.comparativo?.media_historica ?? null}
                    tipo={periodoTipo}
                    valor={periodoValor}
                    valorFim={periodoValorFim}
                    onPeriodoChange={handlePeriodoChange}
                />

                {/* Casais ativos por ano */}
                {data && data.casais_por_ano.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Casais Ativos por Ano</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Média de {data.media_casais_por_ano} casais/ano
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                            <Chart
                                options={barOptions}
                                series={barSeries}
                                type="bar"
                                height={220}
                            />
                        </div>
                    </section>
                )}

                {/* Distribuição de posturas */}
                {data && posturasPieData.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Distribuição de Posturas</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                            <ApexPieChart data={posturasPieData} />
                        </div>
                    </section>
                )}
            </div>
        </PullToRefresh>
    )
}

// ——— Aba 2 — Melhores Reprodutores ——————————————————————

function RankingItem({ item, rank, isSelected, onSelect }: {
    item: MelhoresReprodutoresItem
    rank: number
    isSelected: boolean
    onSelect: () => void
}) {
    const rankBadge =
        rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
        rank === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
        rank === 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                     'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'

    // Fêmea: eclosão é primária | Macho: fecundação é primária
    const isFemea = item.sexo === 2
    const col1 = isFemea
        ? { value: item.taxa_eclosao,    label: 'eclosão' }
        : { value: item.taxa_fecundacao, label: 'fecund.' }
    const col2 = isFemea
        ? { value: item.taxa_fecundacao, label: 'fecund.' }
        : { value: item.taxa_eclosao,    label: 'eclosão' }

    return (
        <button
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] ${
                isSelected
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
        >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankBadge}`}>
                {rank}
            </span>

            {item.foto ? (
                <img src={item.foto} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 5.4 8 6.6 8 8c0 1.4.4 2.6 1 3.5.3.4.6.8 1 1.1V15l-2 2v2h8v-2l-2-2v-2.4c.4-.3.7-.7 1-1.1.6-.9 1-2.1 1-3.5 0-1.4-.4-2.6-1-3.5-.6-.9-1.8-1.5-3-1.5z" />
                    </svg>
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {anelLabel(item.anel)}
                    </p>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${sexColor(item.sexo)}`}>
                        {sexIcon(item.sexo)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.descr || '—'}
                    {' · '}{item.total_ovos} ovos
                </p>
            </div>

            {/* Duas colunas de taxa — ordem por sexo */}
            <div className="flex items-center gap-1.5 shrink-0">
                <div className="text-center w-[46px]">
                    <p className={`text-sm font-bold leading-none ${taxaColor(col1.value)}`}>
                        {fmtPct(col1.value)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
                        {col1.label}
                    </p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-600 shrink-0" />
                <div className="text-center w-[46px]">
                    <p className={`text-sm font-bold leading-none ${taxaColor(col2.value)}`}>
                        {fmtPct(col2.value)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
                        {col2.label}
                    </p>
                </div>
                {item.taxa_eclosao >= 70 && (
                    <span className="text-yellow-500 shrink-0"><IconStar /></span>
                )}
            </div>
        </button>
    )
}

function DetalheAve({ analise, onBack }: { analise: PassaroAnalise; onBack: () => void }) {
    const { passaro, casais, totais } = analise

    return (
        <div className="px-4 py-6 max-w-4xl mx-auto">
            {/* Botão voltar */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-primary font-medium mb-5 -ml-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Ranking
            </button>

            {/* Card da ave */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 mb-6">
                {passaro.foto ? (
                    <img src={passaro.foto} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 5.4 8 6.6 8 8c0 1.4.4 2.6 1 3.5.3.4.6.8 1 1.1V15l-2 2v2h8v-2l-2-2v-2.4c.4-.3.7-.7 1-1.1.6-.9 1-2.1 1-3.5 0-1.4-.4-2.6-1-3.5-.6-.9-1.8-1.5-3-1.5z" />
                        </svg>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{anelLabel(passaro.anel)}</p>
                        {totais.taxa_eclosao >= 70 && (
                            <span className="text-yellow-500"><IconStar /></span>
                        )}
                        {passaro.sit !== 1 && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                Inativo
                            </span>
                        )}
                    </div>
                    {passaro.descr && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">{passaro.descr}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {passaro.sexo === 1 ? 'Macho' : passaro.sexo === 2 ? 'Fêmea' : '—'}
                        {passaro.especie && ` · ${passaro.especie.descr}`}
                        {passaro.mutacao && ` · ${passaro.mutacao.descr}`}
                    </p>
                </div>
            </div>

            {/* Totais */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Totais</h2>
                <div className="grid grid-cols-2 gap-3">
                    <StatCard title="Ovos" value={totais.ovos} icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.5 2 6 6 6 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" /></svg>} color="gray" />
                    <StatCard title="Nascidos" value={totais.nascidos} icon={<IconBird />} color="green" />
                    <StatCard
                        title="Taxa Fecundação"
                        value={fmtPct(totais.taxa_fecundacao)}
                        subtitle={`${totais.fecundados} fecundados`}
                        icon={<IconChart />}
                        color="blue"
                    />
                    <StatCard
                        title="Taxa Eclosão"
                        value={fmtPct(totais.taxa_eclosao)}
                        subtitle={totais.taxa_eclosao >= 70 ? '⭐ Bom reprodutor' : undefined}
                        icon={<IconChart />}
                        color={totais.taxa_eclosao >= 70 ? 'green' : totais.taxa_eclosao >= 50 ? 'yellow' : 'red'}
                    />
                </div>
            </section>

            {/* Casais */}
            {casais.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                        Casais ({casais.length})
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {casais.map(casal => (
                                <div key={casal.gaiola_id} className="px-4 py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    Casal #{casal.nro}
                                                </span>
                                                {casal.taxa_eclosao >= 70 && (
                                                    <span className="text-yellow-500"><IconStar /></span>
                                                )}
                                                {!casal.vigen_final && (
                                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                                        Ativo
                                                    </span>
                                                )}
                                            </div>
                                            {casal.parceiro && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {anelLabel(casal.parceiro.anel)}
                                                    {casal.parceiro.descr && ` – ${casal.parceiro.descr}`}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                {fmtDate(casal.vigen_inicial)} → {casal.vigen_final ? fmtDate(casal.vigen_final) : 'atual'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {casal.total_ovos} ovos · {casal.nascidos} nasc
                                            </p>
                                            <p className={`text-sm font-bold ${taxaColor(casal.taxa_eclosao)}`}>
                                                {fmtPct(casal.taxa_eclosao)}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {fmtPct(casal.taxa_fecundacao)} fec
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}

const SEX_FILTERS: { value: 0 | 1 | 2; label: string }[] = [
    { value: 0, label: 'Todos' },
    { value: 1, label: '♂ Machos' },
    { value: 2, label: '♀ Fêmeas' },
]

function RankingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2" />
                    </div>
                    <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
            ))}
        </div>
    )
}

function AbaAnaliseAve() {
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [sexo, setSexo] = useState<0 | 1 | 2>(0)

    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGestaoMelhoresReprodutoresInfinite(sexo)

    const { data: analise, isLoading: analiseLoading } = useGestaoPassaro(selectedId)
    const { data: gestaoConfig } = useGestaoConfig()
    const periodoLabel = gestaoConfig ? filtroLabel(gestaoConfig.tipo, gestaoConfig.valor) : null

    const melhores = data?.pages.flatMap(p => p.data) ?? []
    const total = data?.pages[0]?.meta.total ?? 0

    // IntersectionObserver para scroll infinito
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (isFetchingNextPage) return
        if (observerRef.current) observerRef.current.disconnect()
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
        }, { threshold: 0.1 })
        if (node) observerRef.current.observe(node)
    }, [isFetchingNextPage, hasNextPage, fetchNextPage])

    // Detalhe da ave selecionada
    if (selectedId !== null) {
        if (analiseLoading) {
            return (
                <div className="px-4 py-6 max-w-4xl mx-auto space-y-4">
                    <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm text-primary font-medium -ml-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Ranking
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                    </div>
                </div>
            )
        }
        if (analise) {
            return (
                <PullToRefresh onRefresh={async () => {}} disabled>
                    <DetalheAve analise={analise} onBack={() => setSelectedId(null)} />
                </PullToRefresh>
            )
        }
    }

    return (
        <PullToRefresh onRefresh={async () => {}} disabled={isLoading}>
            <div className="px-4 py-6 max-w-4xl mx-auto">
                <section>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            Melhores Reprodutores
                        </h2>
                        {periodoLabel && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                {periodoLabel}
                            </span>
                        )}
                        {!isLoading && total > 0 && (
                            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{total} aves</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Ordenados por taxa de eclosão · mínimo 5 ovos avaliados
                    </p>

                    {/* Filtro de sexo */}
                    <div className="flex gap-2 mb-4">
                        {SEX_FILTERS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSexo(opt.value)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    sexo === opt.value
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <RankingSkeleton />
                    ) : isError ? (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-center text-sm">
                            Erro ao carregar dados
                        </div>
                    ) : melhores.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                                Nenhuma ave com dados suficientes{sexo > 0 ? ' neste filtro' : ''}.
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                São necessários pelo menos 5 ovos avaliados por ave.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {melhores.map((item, i) => (
                                        <RankingItem
                                            key={item.passaro_id}
                                            item={item}
                                            rank={i + 1}
                                            isSelected={selectedId === item.passaro_id}
                                            onSelect={() => setSelectedId(item.passaro_id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Trigger do scroll infinito */}
                            <div ref={loadMoreRef} className="py-4 flex justify-center">
                                {isFetchingNextPage && (
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                                )}
                                {!hasNextPage && melhores.length > 0 && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Fim da lista · {melhores.length} aves
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </PullToRefresh>
    )
}

// ——— Página principal ——————————————————————————————————

export function GestaoPage() {
    const [aba, setAba] = useState<'geral' | 'ave'>('geral')
    const navigate = useNavigate()

    return (
        <>
            <Topbar title="Gestão do Plantel" />
            <div className="px-4 pt-4 flex items-center gap-2">
                <div className="flex-1">
                    <SegmentedControl
                        options={[
                            { value: 'geral', label: 'Visão Geral' },
                            { value: 'ave',   label: 'Reprodutores' },
                        ]}
                        value={aba}
                        onChange={v => setAba(v as 'geral' | 'ave')}
                    />
                </div>
                <button
                    onClick={() => navigate('/config/gestao')}
                    title="Configurar período da análise"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
            {aba === 'geral' ? <AbaVisaoGeral /> : <AbaAnaliseAve />}
        </>
    )
}
