/**
 * Página do Dashboard
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar, PullToRefresh } from '@/components/ui'
import { useUser } from '@/features/auth/authStore'
import { useDashboardStats } from './dashboardApi'
import { StatCard, StatCardSkeleton } from './StatCard'
import { PieChart } from './PieChart'
import {
    BirdIcon,
    CoupleIcon,
    EggIcon,
    CakeIcon,
    HeartIcon,
} from './icons'

export function DashboardPage() {
    const navigate = useNavigate()
    const user = useUser()
    const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
    const { data: stats, isLoading, error, refetch } = useDashboardStats(anoSelecionado)

    // Dados para o gráfico de sexo
    const sexoChartData = stats ? [
        { label: 'Machos', value: stats.passarosPorSexo.machos, color: '#3B82F6' },
        { label: 'Fêmeas', value: stats.passarosPorSexo.femeas, color: '#EC4899' },
        { label: 'Indefinidos', value: stats.passarosPorSexo.indefinidos, color: '#9CA3AF' },
    ] : []

    // Hora atual para saudação
    const hora = new Date().getHours()
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

    // Anos disponíveis para seleção (do mais recente para o mais antigo)
    const anosDisponiveis = stats?.anosDisponiveis?.length
        ? stats.anosDisponiveis
        : [new Date().getFullYear()]

    return (
        <>
            <Topbar title="Dashboard" />

            <PullToRefresh
                onRefresh={async () => { await refetch() }}
                disabled={isLoading}
            >
                <div className="px-4 py-6 max-w-4xl mx-auto">
                    {/* Saudação */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {saudacao}, {user?.nome?.split(' ')[0] || 'Criador'}! 👋
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Aqui está o resumo do seu plantel
                        </p>
                    </div>

                    {/* Seletor de Ano */}
                    <section className="mb-6">
                        <div className="flex items-center gap-2">
                            <label htmlFor="ano-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Ano:
                            </label>
                            <select
                                id="ano-select"
                                value={anoSelecionado}
                                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                            >
                                {anosDisponiveis.map((ano) => (
                                    <option key={ano} value={ano}>
                                        {ano}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {/* Cards de Estatísticas */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Resumo de {anoSelecionado}</h2>

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
                                    title="Total de Pássaros"
                                    value={stats.totalPassaros}
                                    icon={<BirdIcon />}
                                    color="blue"
                                />
                                <StatCard
                                    title="Casais Ativos"
                                    value={stats.casaisAtivos}
                                    subtitle={`de ${stats.totalCasais} total`}
                                    icon={<HeartIcon />}
                                    color="red"
                                />
                                <StatCard
                                    title="Posturas"
                                    value={stats.posturasAno}
                                    icon={<EggIcon />}
                                    color="yellow"
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

                    {/* Gráficos */}
                    {stats && (stats.passarosPorSexo.machos > 0 || stats.passarosPorSexo.femeas > 0 || stats.passarosPorSexo.indefinidos > 0) && (
                        <section className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Distribuição por Sexo em {anoSelecionado}</h2>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 max-w-md">
                                <PieChart data={sexoChartData} />
                            </div>
                        </section>
                    )}

                    {/* Aniversariantes */}
                    {stats && stats.aniversariantes.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <CakeIcon className="w-5 h-5 text-purple-500" />
                                Aniversariantes do Mês
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
                                                {new Date(passaro.nascimento).toLocaleDateString('pt-BR', {
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

                    {/* Ações Rápidas */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Ações Rápidas</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/passaros')}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <BirdIcon className="w-8 h-8 text-blue-500 mb-2" />
                                <p className="font-medium text-gray-900 dark:text-gray-100">Ver Plantel</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Todos os pássaros</p>
                            </button>

                            <button
                                onClick={() => navigate('/casais')}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <CoupleIcon className="w-8 h-8 text-red-500 mb-2" />
                                <p className="font-medium text-gray-900 dark:text-gray-100">Ver Casais</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Casais formados</p>
                            </button>

                            <button
                                onClick={() => navigate('/posturas')}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <EggIcon className="w-8 h-8 text-yellow-500 mb-2" />
                                <p className="font-medium text-gray-900 dark:text-gray-100">Ver Posturas</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Posturas ativas</p>
                            </button>

                            <button
                                onClick={() => navigate('/passaros/novo')}
                                className="bg-primary text-white rounded-xl p-4 shadow-sm text-left hover:bg-primary/90 transition-colors"
                            >
                                <div className="w-8 h-8 mb-2 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <p className="font-medium">Novo Pássaro</p>
                                <p className="text-sm text-white/80">Cadastrar pássaro</p>
                            </button>
                        </div>
                    </section>
                </div>
            </PullToRefresh>
        </>
    )
}
