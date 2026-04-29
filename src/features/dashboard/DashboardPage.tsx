/**
 * Página do Dashboard
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar, PullToRefresh, NumberScanner } from '@/components/ui'
import { useUser } from '@/features/auth/authStore'
import { useDashboardStats } from './dashboardApi'
import { useEspecies } from '@/features/especies/especiesApi'
import { useCasaisEstatisticas } from '@/features/casais/casaisApi'
import { StatCard, StatCardSkeleton } from './StatCard'
import { ApexPieChart } from './ApexPieChart'
import { ApexLineChart } from './ApexLineChart'
import {
    BirdIcon,
    CoupleIcon,
    EggIcon,
    CakeIcon,
    HeartIcon,
} from './icons'
import { parseLocalDate } from '@/lib/date'

export function DashboardPage() {
    const navigate = useNavigate()
    const user = useUser()
    const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
    const [showNumberScanner, setShowNumberScanner] = useState(false)
    const { data: stats, isLoading, error, refetch } = useDashboardStats(anoSelecionado)
    const { data: especies, isLoading: isLoadingEspecies } = useEspecies()
    const { data: casaisEstat } = useCasaisEstatisticas()

    const temCasaisAtivos = (casaisEstat?.ativos ?? 0) > 0
    const casaisAtivosCount = casaisEstat?.ativos ?? 0
    const casaisTotalCount = casaisEstat?.total ?? 0

    // Redireciona para cadastro de espécies se não houver nenhuma
    useEffect(() => {
        if (!isLoadingEspecies && especies && especies.length === 0) {
            navigate('/config/especies', { replace: true })
        }
    }, [especies, isLoadingEspecies, navigate])

    // Dados para o gráfico de status das posturas
    const posturasStatusData = stats?.posturasDetalhadas ? [
        { label: 'Nascidos', value: stats.posturasDetalhadas.nascidos, color: '#10B981' },
        { label: 'Chocando', value: stats.posturasDetalhadas.choco, color: '#F59E0B' },
        { label: 'Férteis', value: stats.posturasDetalhadas.ferteis, color: '#3B82F6' },
        { label: 'Brancos (Inférteis)', value: stats.posturasDetalhadas.branco, color: '#9CA3AF' },
        { label: 'Embrião Morto', value: stats.posturasDetalhadas.embriaoMorto, color: '#EF4444' },
        { label: 'Filhote Morto', value: stats.posturasDetalhadas.filhoteMorto, color: '#DC2626' },
    ].filter(item => item.value > 0) : []

    // Dados para o gráfico de linhas histórico
    const historicoLineChartData = stats?.historicoPosturas?.length ? {
        labels: stats.historicoPosturas.slice().map(item => item.ano.toString()),
        series: [
            {
                label: 'Posturas',
                color: '#F59E0B',
                data: stats.historicoPosturas.slice().map(item => item.total),
            },
            {
                label: 'Nascimentos',
                color: '#10B981',
                data: stats.historicoPosturas.slice().map(item => item.nascidos),
            },
            {
                label: 'Casais',
                color: '#3B82F6',
                data: stats.historicoPosturas.slice().map(item => item.gaiolas),
            },
            {
                label: 'Mortalidade',
                color: '#EF4444',
                data: stats.historicoPosturas.slice().map(item => item.mortalidade ?? 0),
            },
        ],
    } : null

    // Hora atual para saudação
    const hora = new Date().getHours()
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

    // Anos disponíveis para seleção (do mais recente para o mais antigo)
    const anosDisponiveis = stats?.anosDisponiveis?.length
        ? stats.anosDisponiveis
        : [new Date().getFullYear()]

    const handleNumberScanResult = useCallback((numero: number) => {
        setShowNumberScanner(false)
        navigate(`/casais?nro=${numero}`)
    }, [navigate])

    return (
        <>
            <Topbar title="MeuPlantel" />

            <PullToRefresh
                onRefresh={async () => { await refetch() }}
                disabled={isLoading}
            >
                <div className="px-4 py-6 max-w-4xl mx-auto">
                    {/* Saudação */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🐦</span>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {saudacao}, {user?.nome?.split(' ')[0] || 'Criador'}!
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Aqui está o resumo do seu plantel
                        </p>
                    </div>

                    {/* Cards de Estatísticas */}
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Resumo</h2>
                            <select
                                value={anoSelecionado}
                                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                                className="px-2.5 py-1 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                {anosDisponiveis.map((ano) => (
                                    <option key={ano} value={ano}>{ano}</option>
                                ))}
                            </select>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-2 gap-4">
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-center">
                                Erro ao carregar estatísticas
                            </div>
                        ) : stats ? (
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard
                                    title="Pássaros Ativos"
                                    value={stats.passarosAtivos}
                                    subtitle={`${stats.totalPassaros} no total`}
                                    icon={<BirdIcon />}
                                    color="blue"
                                    onClick={() => navigate('/passaros')}
                                />
                                <StatCard
                                    title="Casais Ativos"
                                    value={casaisAtivosCount}
                                    subtitle={casaisTotalCount > casaisAtivosCount ? `de ${casaisTotalCount} total` : undefined}
                                    icon={<HeartIcon />}
                                    color="red"
                                    onClick={() => navigate('/casais')}
                                />
                                <StatCard
                                    title="Posturas"
                                    value={stats.posturasAno}
                                    icon={<EggIcon />}
                                    color="yellow"
                                    onClick={() => navigate('/posturas')}
                                />
                                <StatCard
                                    title="Filhotes Nascidos"
                                    value={stats.filhotesAno}
                                    icon={<BirdIcon />}
                                    color="green"
                                />
                            </div>
                        ) : null}
                    </section>

                    {/* Ações Rápidas */}
                    <section className="mt-6 mb-2">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Acesso rápido</h2>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/passaros')}
                                className="relative overflow-hidden bg-blue-500 rounded-2xl p-4 text-left shadow-sm active:scale-[0.97] transition-transform"
                            >
                                <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
                                <BirdIcon className="w-7 h-7 text-white mb-2 relative" />
                                <p className="font-semibold text-white text-sm">Plantel</p>
                                <p className="text-xs text-blue-100">Ver pássaros</p>
                            </button>

                            <button
                                onClick={() => navigate('/casais')}
                                className="relative overflow-hidden bg-rose-500 rounded-2xl p-4 text-left shadow-sm active:scale-[0.97] transition-transform"
                            >
                                <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
                                <CoupleIcon className="w-7 h-7 text-white mb-2 relative" />
                                <p className="font-semibold text-white text-sm">Casais</p>
                                <p className="text-xs text-rose-100">Casais ativos</p>
                            </button>

                            <button
                                onClick={() => navigate('/posturas')}
                                className="relative overflow-hidden bg-amber-500 rounded-2xl p-4 text-left shadow-sm active:scale-[0.97] transition-transform"
                            >
                                <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
                                <EggIcon className="w-7 h-7 text-white mb-2 relative" />
                                <p className="font-semibold text-white text-sm">Posturas</p>
                                <p className="text-xs text-amber-100">Acompanhar ninhadas</p>
                            </button>

                            <button
                                onClick={() => navigate('/passaros/novo')}
                                className="relative overflow-hidden bg-emerald-500 rounded-2xl p-4 text-left shadow-sm active:scale-[0.97] transition-transform"
                            >
                                <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
                                <div className="w-7 h-7 mb-2 relative flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <p className="font-semibold text-white text-sm">Novo Pássaro</p>
                                <p className="text-xs text-emerald-100">Cadastrar</p>
                            </button>
                        </div>

                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={() => temCasaisAtivos && setShowNumberScanner(true)}
                                disabled={!temCasaisAtivos}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                Escanear gaiola
                            </button>
                        </div>
                    </section>


                    {/* Gráfico de Status das Posturas */}
                    {stats && posturasStatusData.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Status das Posturas em {anoSelecionado}
                            </h2>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <ApexPieChart data={posturasStatusData} />
                            </div>
                        </section>
                    )}

                    {/* Gráfico Histórico de Posturas e Nascimentos */}
                    {stats && historicoLineChartData && (
                        <section className="mb-8">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Histórico de Reprodução
                            </h2>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <ApexLineChart
                                    labels={historicoLineChartData.labels}
                                    series={historicoLineChartData.series}
                                />
                            </div>
                        </section>
                    )}

                    {/* Aniversariantes */}
                    {stats && stats.aniversariantes.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <CakeIcon className="w-4 h-4 text-purple-500" />
                                Aniversariantes do mês
                            </h2>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {stats.aniversariantes.map((passaro, index) => (
                                    <div
                                        key={passaro.id}
                                        className={`p-4 flex items-center justify-between ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                                            }`}
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {passaro.nome || passaro.anel || `Pássaro #${passaro.id}`}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {passaro.idade}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-purple-600 font-medium">
                                                {(parseLocalDate(passaro.nascimento) ?? new Date(passaro.nascimento)).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </PullToRefresh>

            {/* Number Scanner (OCR) */}
            {showNumberScanner && (
                <NumberScanner
                    onResult={handleNumberScanResult}
                    onClose={() => setShowNumberScanner(false)}
                />
            )}
        </>
    )
}
