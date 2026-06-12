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

const defaultPosturas: PosturasFilters = { filterTypes: [], searchTerm: '' }
const defaultCasais: CasaisFilters = { searchTerm: '' }
const defaultPassaros: PassarosFilters = { sexoFilter: 'all', situacaoFilter: 'ativos', searchQuery: '', especiesFilter: [] }

interface FiltersState {
    posturas: PosturasFilters
    casais: CasaisFilters
    passaros: PassarosFilters
    setPosturasFilters: (filters: Partial<PosturasFilters>) => void
    setCasaisFilters: (filters: Partial<CasaisFilters>) => void
    setPassarosFilters: (filters: Partial<PassarosFilters>) => void
    resetAllFilters: () => void
}

export const useFiltersStore = create<FiltersState>()(
    persist(
        (set) => ({
            posturas: defaultPosturas,
            casais: defaultCasais,
            passaros: defaultPassaros,
            setPosturasFilters: (filters) =>
                set((state) => ({ posturas: { ...state.posturas, ...filters } })),
            setCasaisFilters: (filters) =>
                set((state) => ({ casais: { ...state.casais, ...filters } })),
            setPassarosFilters: (filters) =>
                set((state) => ({ passaros: { ...state.passaros, ...filters } })),
            resetAllFilters: () =>
                set({ posturas: defaultPosturas, casais: defaultCasais, passaros: defaultPassaros }),
        }),
        {
            name: 'meuplantel-filters',
            version: 1,
            migrate: (persisted: unknown) => {
                const s = persisted as Partial<FiltersState>
                return {
                    ...s,
                    passaros: {
                        sexoFilter: s.passaros?.sexoFilter ?? defaultPassaros.sexoFilter,
                        situacaoFilter: s.passaros?.situacaoFilter ?? defaultPassaros.situacaoFilter,
                        searchQuery: s.passaros?.searchQuery ?? defaultPassaros.searchQuery,
                        especiesFilter: Array.isArray(s.passaros?.especiesFilter)
                            ? s.passaros.especiesFilter
                            : defaultPassaros.especiesFilter,
                    },
                }
            },
        }
    )
)
