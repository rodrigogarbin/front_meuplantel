/**
 * Página de Listagem de Pássaros
 * Mobile-first com filtros, busca e infinite scroll
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar, SearchInput, BirdListSkeleton, EmptyState, EmptyStateOnboarding, ErrorState, PullToRefresh } from '@/components/ui'
import { MultiSelectCheckbox } from '@/components/ui/MultiSelectCheckbox'
import { BirdCard } from './BirdCard'
import { BirdDetailsSheet } from './BirdDetailsSheet'
import { usePassarosInfinite } from './passarosApi'
import { useFiltersStore } from '@/lib/filtersStore'
import { useEspecies } from '@/features/especies/especiesApi'
import type { Passaro, PassaroFilters } from '@/types'
import { SexoEnum, SituacaoEnum } from '@/types'

// Ícone de Plus
function PlusIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    )
}

export function PassarosPage() {
    const navigate = useNavigate()

    // Filtros persistentes
    const { passaros: passarosFilters, setPassarosFilters } = useFiltersStore()
    const { sexoFilter, situacaoFilter, searchQuery, especiesFilter } = passarosFilters
    const setSexoFilter = (v: typeof sexoFilter) => setPassarosFilters({ sexoFilter: v })
    const setSituacaoFilter = (v: typeof situacaoFilter) => setPassarosFilters({ situacaoFilter: v })
    const setSearchQuery = (v: string) => setPassarosFilters({ searchQuery: v })
    const setEspeciesFilter = (v: number[]) => setPassarosFilters({ especiesFilter: v })

    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

    // Debounce da busca (aguarda 500ms após digitar)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Estado do modal de detalhes
    const [selectedBird, setSelectedBird] = useState<Passaro | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // Converte filtros de UI para filtros da API
    const apiFilters: PassaroFilters = useMemo(() => {
        const filters: PassaroFilters = {}

        // Situação
        if (situacaoFilter === 'ativos') {
            filters.sit = SituacaoEnum.ATIVO
        }

        // Sexo - enviamos para API se for específico
        if (sexoFilter === 'macho') {
            filters.sexo = SexoEnum.MACHO
        } else if (sexoFilter === 'femea') {
            filters.sexo = SexoEnum.FEMEA
        }

        // Busca por anel ou descrição (enviado ao backend)
        if (debouncedSearch.trim()) {
            filters.search = debouncedSearch.trim()
        }

        // Filtro por espécie (múltipla seleção)
        if (especiesFilter.length > 0) {
            filters.especie_usuario_id = especiesFilter
        }

        return filters
    }, [sexoFilter, situacaoFilter, debouncedSearch, especiesFilter])

    // Query de pássaros com infinite scroll
    const {
        data,
        isLoading,
        isError,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = usePassarosInfinite(apiFilters)

    // Combina todas as páginas em uma lista
    const passaros = useMemo(() => {
        if (!data?.pages) return []
        return data.pages.flatMap(page => page.passaros)
    }, [data])

    // Total de pássaros (da API) - força conversão para número
    const totalPassaros = Number(data?.pages?.[0]?.total) || 0

    // Detecta se é um usuário novo (sem pássaros e sem filtros ativos)
    const isNewUser = totalPassaros === 0 && !debouncedSearch && sexoFilter === 'all' && situacaoFilter === 'ativos' && especiesFilter.length === 0

    // Espécies para filtro
    const { data: especies = [] } = useEspecies()

    // Referência para o observador de scroll infinito
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (isFetchingNextPage) return
        if (observerRef.current) observerRef.current.disconnect()

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage()
            }
        }, { threshold: 0.1 })

        if (node) observerRef.current.observe(node)
    }, [isFetchingNextPage, hasNextPage, fetchNextPage])

    // Refetch quando a página volta do background (ex: após cadastrar um pássaro)
    useEffect(() => {
        const handleFocus = () => {
            refetch()
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [refetch])

    // Handlers
    const handleCardClick = (bird: Passaro) => {
        setSelectedBird(bird)
        setIsDetailsOpen(true)
    }

    const handleCloseDetails = () => {
        setIsDetailsOpen(false)
        // Delay para limpar o bird após a animação
        setTimeout(() => setSelectedBird(null), 300)
    }

    return (
        <>
            <Topbar
                title="Pássaros"
                action={
                    <button
                        onClick={() => navigate('/passaros/relatorio')}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Relatório do criadouro"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                }
            />

            {/* Área de filtros sticky */}
            <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-900 px-4 pt-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                {/* Busca — sempre visível */}
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por anilha ou descrição..."
                />

                {/* Chips de filtro — sempre visíveis, scroll horizontal */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mt-3">
                    {/* Sexo */}
                    <button
                        onClick={() => setSexoFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${sexoFilter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >Todos</button>
                    <button
                        onClick={() => setSexoFilter('macho')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${sexoFilter === 'macho' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >♂ Machos</button>
                    <button
                        onClick={() => setSexoFilter('femea')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${sexoFilter === 'femea' ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >♀ Fêmeas</button>

                    {/* Separador */}
                    <div className="w-px bg-gray-300 dark:bg-gray-600 shrink-0 my-0.5" />

                    {/* Situação */}
                    <button
                        onClick={() => setSituacaoFilter('ativos')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${situacaoFilter === 'ativos' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >Ativos</button>
                    <button
                        onClick={() => setSituacaoFilter('todos')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${situacaoFilter === 'todos' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >Todos</button>

                    {/* Espécie — dropdown compacto no final do scroll */}
                    {especies.length > 0 && (
                        <>
                            <div className="w-px bg-gray-300 dark:bg-gray-600 shrink-0 my-0.5" />
                            <div className="shrink-0">
                                <MultiSelectCheckbox
                                    placeholder="Espécie"
                                    options={especies.map((e) => ({ id: e.especie_usuario_id ?? e.id ?? 0, label: e.descr ?? '—' }))}
                                    value={especiesFilter}
                                    onChange={setEspeciesFilter}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Lista de pássaros */}
            <main className="flex-1 px-4 py-4 pb-safe-bottom">
                <PullToRefresh
                    onRefresh={async () => { await refetch() }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <BirdListSkeleton count={6} />
                    ) : isError ? (
                        <ErrorState
                            title="Erro ao carregar"
                            message="Não foi possível carregar a lista de pássaros."
                            onRetry={() => refetch()}
                        />
                    ) : passaros.length === 0 ? (
                        isNewUser ? (
                            <EmptyStateOnboarding
                                title="Bem-vindo ao MeuPlantel!"
                                description="Comece cadastrando seu primeiro pássaro para gerenciar seu plantel de forma organizada."
                                actionLabel="Cadastrar primeiro pássaro"
                                onAction={() => navigate('/passaros/novo')}
                                steps={[
                                    'Cadastre seus pássaros com anilha e informações',
                                    'Monte casais para reprodução',
                                    'Registre posturas e acompanhe filhotes',
                                    'Visualize árvores genealógicas completas'
                                ]}
                            />
                        ) : (
                            <EmptyState
                                icon={
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                }
                                title="Nenhum pássaro encontrado"
                                description={searchQuery ? 'Tente ajustar os filtros ou a busca.' : 'Não há pássaros cadastrados com estes filtros.'}
                            />
                        )
                    ) : (
                        <>
                            {/* Contador de resultados */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                {`${passaros.length} de ${totalPassaros} ${totalPassaros === 1 ? 'pássaro' : 'pássaros'}`}
                            </p>

                            {/* Grid de cards */}
                            <div className="space-y-3">
                                {passaros.map((bird) => (
                                    <BirdCard
                                        key={bird.passaro_id}
                                        bird={bird}
                                        onClick={() => handleCardClick(bird)}
                                    />
                                ))}
                            </div>

                            {/* Elemento para detectar scroll infinito */}
                            <div ref={loadMoreRef} className="py-4">
                                {isFetchingNextPage && (
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
                                    </div>
                                )}
                                {!hasNextPage && passaros.length > 0 && (
                                    <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                                        Fim da lista
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </PullToRefresh>
            </main>

            {/* Modal de detalhes */}
            <BirdDetailsSheet
                bird={selectedBird}
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
            />

            {/* FAB - Botão Flutuante para Adicionar */}
            <button
                onClick={() => navigate('/passaros/novo')}
                className="fixed right-4 bottom-24 z-40 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900 mb-[env(safe-area-inset-bottom)]"
                aria-label="Novo Pássaro"
            >
                <PlusIcon />
            </button>
        </>
    )
}
