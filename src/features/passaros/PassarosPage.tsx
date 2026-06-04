/**
 * Página de Listagem de Pássaros
 * Mobile-first com filtros, busca e infinite scroll
 */

import { useState, useMemo, useRef, useCallback, useEffect, type FocusEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar, SearchInput, Chip, ChipGroup, BirdListSkeleton, EmptyState, EmptyStateOnboarding, ErrorState, PullToRefresh } from '@/components/ui'
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

    // Estado de foco da busca (controla visibilidade dos chips)
    const [isSearchFocused, setIsSearchFocused] = useState(false)

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

    // Chips ficam visíveis se a busca está focada OU se há filtro ativo diferente do padrão
    const hasActiveFilter = sexoFilter !== 'all' || situacaoFilter !== 'ativos' || especiesFilter.length > 0
    const showChips = isSearchFocused || hasActiveFilter

    // Blur do container de filtros: fecha chips apenas se foco saiu do container inteiro
    const handleFilterBlur = (e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsSearchFocused(false)
        }
    }

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
            <Topbar title="Pássaros" />

            {/* Área de filtros sticky — busca sempre visível, chips colapsáveis */}
            <div
                className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-900 px-4 pt-3 pb-3 border-b border-gray-200 dark:border-gray-700"
                onBlur={handleFilterBlur}
            >
                {/* Busca — sempre visível */}
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por anilha ou descrição..."
                    onFocus={() => setIsSearchFocused(true)}
                />

                {/* Chips de sexo e situação — aparecem ao focar ou quando filtro ativo */}
                <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                        showChips ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
                    }`}
                >
                    <div className="flex gap-4">
                        {/* Filtro de Sexo */}
                        <ChipGroup>
                            <Chip
                                label="Todos"
                                active={sexoFilter === 'all'}
                                onClick={() => setSexoFilter('all')}
                            />
                            <Chip
                                label="♂ Machos"
                                active={sexoFilter === 'macho'}
                                onClick={() => setSexoFilter('macho')}
                            />
                            <Chip
                                label="♀ Fêmeas"
                                active={sexoFilter === 'femea'}
                                onClick={() => setSexoFilter('femea')}
                            />
                        </ChipGroup>
                    </div>
                    <div className="mt-2">
                        {/* Filtro de Situação */}
                        <ChipGroup>
                            <Chip
                                label="Ativos"
                                active={situacaoFilter === 'ativos'}
                                onClick={() => setSituacaoFilter('ativos')}
                            />
                            <Chip
                                label="Todos"
                                active={situacaoFilter === 'todos'}
                                onClick={() => setSituacaoFilter('todos')}
                            />
                        </ChipGroup>
                    </div>
                </div>

                {/* Filtro de Espécie — fora do div colapsável, sempre visível quando há espécies */}
                {especies.length > 0 && (
                    <div className="mt-2">
                        <MultiSelectCheckbox
                            placeholder="Filtrar por espécie..."
                            options={especies.map((e) => ({
                                id: e.especie_usuario_id ?? e.id ?? 0,
                                label: e.descr ?? '—',
                            }))}
                            value={especiesFilter}
                            onChange={setEspeciesFilter}
                        />
                    </div>
                )}
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
