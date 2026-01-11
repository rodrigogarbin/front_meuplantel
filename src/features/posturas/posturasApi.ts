/**
 * API Service para Posturas
 * Hooks do TanStack Query para fetch de dados
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// Tipo da postura vinda da API
export interface PosturaListItem {
    id: number
    casal_id: number
    data: string | null
    data_nasc: string | null
    sit: number
    sit_descricao: string
    nro_rodada: number | null
    nro_anel: number | null
    ano_anel: number | null
    obs: string | null
    passaro?: {
        id: number
        sexo: number | null
        anel?: {
            id: number
            ano: number
            nro: number
            sg_clube: string
        } | null
    } | null
    casal?: {
        id: number
        nro: number | null
        dias_choco: number | null
        dias_anilha: number | null
        dias_separa: number | null
        macho?: {
            id: number
            especie_usuario_id: number | null
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            } | null
        } | null
        femea?: {
            id: number
            especie_usuario_id: number | null
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            } | null
        } | null
    } | null
}

// Tipo da resposta da API
interface PosturasResponse {
    data: PosturaListItem[]
    meta?: {
        current_page: number
        per_page: number
        total: number
    }
}

// Filtros para busca de posturas
export interface PosturasFilters {
    sit?: number
    ativas?: boolean
}

/**
 * Busca a lista de posturas ativas do usuário
 */
async function fetchPosturas(filters: PosturasFilters = {}): Promise<PosturaListItem[]> {
    const params = new URLSearchParams()

    // Por padrão, busca apenas ativas
    if (filters.ativas !== false) {
        params.append('ativas', 'true')
    }

    if (filters.sit !== undefined) {
        params.append('sit', filters.sit.toString())
    }

    params.append('per_page', '200')

    const response = await api.get<PosturasResponse>(`/api/v1/posturas?${params.toString()}`)

    return response.data.data || []
}

/**
 * Hook para buscar lista de posturas
 */
export function usePosturas(filters: PosturasFilters = {}) {
    return useQuery({
        queryKey: ['posturas', filters],
        queryFn: () => fetchPosturas(filters),
        staleTime: 2 * 60 * 1000, // 2 minutos
        refetchOnWindowFocus: true,
    })
}
