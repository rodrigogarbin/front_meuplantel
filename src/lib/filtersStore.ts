/**
 * Store de filtros persistentes
 * Mantém os últimos filtros aplicados em Posturas, Casais e Plantel
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PosturasFilterType = 'nascendo' | 'anilhar' | 'separar' | 'verificar'
export type SexoFilter = 'all' | 'macho' | 'femea'
export type SituacaoFilter = 'ativos' | 'todos'

interface PosturasFilters {
    filterTypes: PosturasFilterType[] // vazio = "Todas"
    searchTerm: string
}

interface CasaisFilters {
    searchTerm: string
}

interface PassarosFilters {
    sexoFilter: SexoFilter
    situacaoFilter: SituacaoFilter
    searchQuery: string
    especiesFilter: number[]
}

interface FiltersState {
    posturas: PosturasFilters
    casais: CasaisFilters
    passaros: PassarosFilters
    setPosturasFilters: (filters: Partial<PosturasFilters>) => void
    setCasaisFilters: (filters: Partial<CasaisFilters>) => void
    setPassarosFilters: (filters: Partial<PassarosFilters>) => void
}

export const useFiltersStore = create<FiltersState>()(
    persist(
        (set) => ({
            posturas: {
                filterTypes: [],
                searchTerm: '',
            },
            casais: {
                searchTerm: '',
            },
            passaros: {
                sexoFilter: 'all',
                situacaoFilter: 'ativos',
                searchQuery: '',
                especiesFilter: [],
            },
            setPosturasFilters: (filters) =>
                set((state) => ({ posturas: { ...state.posturas, ...filters } })),
            setCasaisFilters: (filters) =>
                set((state) => ({ casais: { ...state.casais, ...filters } })),
            setPassarosFilters: (filters) =>
                set((state) => ({ passaros: { ...state.passaros, ...filters } })),
        }),
        {
            name: 'meuplantel-filters',
            version: 1,
            migrate: (persisted: unknown) => {
                const s = persisted as Partial<FiltersState>
                return {
                    ...s,
                    passaros: {
                        sexoFilter: s.passaros?.sexoFilter ?? 'all',
                        situacaoFilter: s.passaros?.situacaoFilter ?? 'ativos',
                        searchQuery: s.passaros?.searchQuery ?? '',
                        especiesFilter: Array.isArray(s.passaros?.especiesFilter)
                            ? s.passaros.especiesFilter
                            : [],
                    },
                }
            },
        }
    )
)
