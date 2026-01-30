/**
 * API Service para Casais
 * Hooks do TanStack Query para fetch de dados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Casal, CasalFilters, Postura, CreatePosturaPayload, CreateCasalPayload, UpdateCasalPayload } from '@/types'

// Tipo da resposta da API
interface CasaisResponse {
    data?: Casal[]
    casais?: Casal[]
    meta?: {
        page: number
        per_page: number
        total: number
    }
}

/**
 * Busca a lista de casais
 * Busca todos os casais sem paginação limitada
 */
async function fetchCasais(filters: CasalFilters = {}): Promise<Casal[]> {
    const params = new URLSearchParams()

    // Por padrão, busca apenas ativos (sit=1)
    params.append('sit', (filters.sit ?? 1).toString())

    // Busca todos os casais (sem paginação limitada)
    params.append('per_page', '1000')

    if (filters.passaro_macho_id !== undefined) {
        params.append('passaro_macho_id', filters.passaro_macho_id.toString())
    }
    if (filters.passaro_femea_id !== undefined) {
        params.append('passaro_femea_id', filters.passaro_femea_id.toString())
    }
    if (filters.nro !== undefined) {
        params.append('nro', filters.nro.toString())
    }

    const response = await api.get<CasaisResponse | Casal[]>(`/api/v1/casais?${params.toString()}`)

    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.casais) {
        return data.casais
    }

    if (data.data) {
        return data.data
    }

    return []
}

/**
 * Hook para buscar lista de casais
 */
export function useCasais(filters: CasalFilters = {}) {
    return useQuery({
        queryKey: ['casais', filters],
        queryFn: () => fetchCasais(filters),
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: true,
    })
}

/**
 * Busca um casal específico por ID
 */
async function fetchCasal(id: number): Promise<Casal> {
    const response = await api.get<Casal | { data: Casal }>(`/api/v1/casais/${id}`)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Casal
    }
    return response.data as Casal
}

/**
 * Hook para buscar um casal específico
 */
export function useCasal(id: number | null) {
    return useQuery({
        queryKey: ['casal', id],
        queryFn: () => fetchCasal(id!),
        enabled: id !== null,
        staleTime: 5 * 60 * 1000,
    })
}

// ============================================
// POSTURA INDIVIDUAL
// ============================================

/**
 * Tipo da resposta da API de postura individual
 */
interface PosturaResponse {
    id: number
    casal_id: number
    data: string
    data_nasc: string | null
    sit: number
    nro_rodada: number
    nro_anel: number | null
    ano_anel: number | null
    obs: string | null
    casal?: {
        id: number
        nro: number
        macho?: {
            id: number
            especie_usuario_id: number | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            }
        }
        femea?: {
            id: number
            especie_usuario_id: number | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            }
        }
    }
}

/**
 * Busca uma postura específica por ID
 */
async function fetchPostura(id: number): Promise<PosturaResponse> {
    const response = await api.get<PosturaResponse | { data: PosturaResponse }>(`/api/v1/posturas/${id}`)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as PosturaResponse
    }
    return response.data as PosturaResponse
}

/**
 * Hook para buscar uma postura específica
 */
export function usePostura(id: number | null) {
    return useQuery({
        queryKey: ['postura', id],
        queryFn: () => fetchPostura(id!),
        enabled: id !== null,
        staleTime: 5 * 60 * 1000,
    })
}

// ============================================
// POSTURAS
// ============================================

/**
 * Busca todas as posturas de um casal
 */
async function fetchPosturasByCasal(casalId: number): Promise<Postura[]> {
    const response = await api.get<Postura[] | { data: Postura[] }>(`/api/v1/casais/${casalId}/posturas`)

    if ('data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data
    }
    if (Array.isArray(response.data)) {
        return response.data
    }
    return []
}

/**
 * Hook para buscar posturas de um casal específico
 */
export function usePosturasByCasal(casalId: number | null, enabled = false) {
    return useQuery({
        queryKey: ['posturas', 'casal', casalId],
        queryFn: () => fetchPosturasByCasal(casalId!),
        enabled: enabled && casalId !== null,
        staleTime: 2 * 60 * 1000,
    })
}

/**
 * Cria uma nova postura (ovo) para um casal
 */
async function createPostura(casalId: number, payload: CreatePosturaPayload): Promise<Postura> {
    const response = await api.post<Postura | { data: Postura }>(`/api/v1/casais/${casalId}/posturas`, payload)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Postura
    }
    return response.data as Postura
}

/**
 * Hook para criar postura (ovo)
 */
export function useCreatePostura() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ casalId, payload }: { casalId: number; payload: CreatePosturaPayload }) =>
            createPostura(casalId, payload),
        onSuccess: (_data, variables) => {
            // Invalida cache do casal e lista de casais
            queryClient.invalidateQueries({ queryKey: ['casal', variables.casalId] })
            queryClient.invalidateQueries({ queryKey: ['casais'] })
        },
    })
}

/**
 * Atualiza uma postura existente
 */
async function updatePostura(casalId: number, posturaId: number, payload: Partial<CreatePosturaPayload>): Promise<Postura> {
    const response = await api.put<Postura | { data: Postura }>(`/api/v1/casais/${casalId}/posturas/${posturaId}`, payload)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Postura
    }
    return response.data as Postura
}

/**
 * Hook para atualizar postura (ovo)
 */
export function useUpdatePostura() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ casalId, posturaId, payload }: { casalId: number; posturaId: number; payload: Partial<CreatePosturaPayload> }) =>
            updatePostura(casalId, posturaId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['casal', variables.casalId] })
            queryClient.invalidateQueries({ queryKey: ['casais'] })
        },
    })
}

/**
 * Exclui uma postura
 */
async function deletePostura(casalId: number, posturaId: number): Promise<void> {
    await api.delete(`/api/v1/casais/${casalId}/posturas/${posturaId}`)
}

/**
 * Hook para excluir postura (ovo)
 */
export function useDeletePostura() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ casalId, posturaId }: { casalId: number; posturaId: number }) =>
            deletePostura(casalId, posturaId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['casal', variables.casalId] })
            queryClient.invalidateQueries({ queryKey: ['casais'] })
        },
    })
}

/**
 * Payload para transferir postura
 */
export interface TransferPosturaPayload {
    gaiola_destino_id: number
    nro_rodada?: number | null
}

/**
 * Transfere uma postura para outro casal
 */
async function transferirPostura(casalOrigemId: number, posturaId: number, payload: TransferPosturaPayload): Promise<Postura> {
    const response = await api.post<Postura | { data: Postura }>(
        `/api/v1/casais/${casalOrigemId}/posturas/${posturaId}/transferir`,
        payload
    )

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Postura
    }
    return response.data as Postura
}

/**
 * Hook para transferir postura (ovo) para outro casal
 */
export function useTransferirPostura() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ casalOrigemId, posturaId, payload }: {
            casalOrigemId: number
            posturaId: number
            payload: TransferPosturaPayload
        }) => transferirPostura(casalOrigemId, posturaId, payload),
        onSuccess: (_data, variables) => {
            // Invalida cache do casal de origem e destino
            queryClient.invalidateQueries({ queryKey: ['casal', variables.casalOrigemId] })
            queryClient.invalidateQueries({ queryKey: ['casal', variables.payload.gaiola_destino_id] })
            queryClient.invalidateQueries({ queryKey: ['casais'] })
            queryClient.invalidateQueries({ queryKey: ['posturas'] })
        },
    })
}

/**
 * Desfaz a transferência de uma postura, retornando ao casal de origem
 */
async function desfazerTransferencia(casalAtualId: number, posturaId: number): Promise<Postura> {
    const response = await api.post<Postura | { data: Postura }>(
        `/api/v1/casais/${casalAtualId}/posturas/${posturaId}/desfazer-transferencia`
    )

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Postura
    }
    return response.data as Postura
}

/**
 * Hook para desfazer transferência de postura (ovo)
 */
export function useDesfazerTransferencia() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ casalAtualId, posturaId }: {
            casalAtualId: number
            posturaId: number
        }) => desfazerTransferencia(casalAtualId, posturaId),
        onSuccess: (_data, variables) => {
            // Invalida caches relevantes
            queryClient.invalidateQueries({ queryKey: ['casal', variables.casalAtualId] })
            queryClient.invalidateQueries({ queryKey: ['casais'] })
            queryClient.invalidateQueries({ queryKey: ['posturas'] })
        },
    })
}

// ============================================
// CRUD DE CASAIS
// ============================================

/**
 * Cria um novo casal
 */
async function createCasal(payload: CreateCasalPayload): Promise<Casal> {
    const response = await api.post<Casal | { data: Casal }>('/api/v1/casais', payload)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Casal
    }
    return response.data as Casal
}

/**
 * Hook para criar casal
 */
export function useCreateCasal() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createCasal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['casais'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
        },
    })
}

/**
 * Atualiza um casal existente
 */
async function updateCasal(payload: UpdateCasalPayload): Promise<Casal> {
    const { gaiola_id, ...data } = payload
    const response = await api.put<Casal | { data: Casal }>(`/api/v1/casais/${gaiola_id}`, data)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Casal
    }
    return response.data as Casal
}

/**
 * Hook para atualizar casal
 */
export function useUpdateCasal() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateCasal,
        onSuccess: (data) => {
            const casalId = data.id ?? data.gaiola_id
            queryClient.setQueryData(['casal', casalId], data)
            queryClient.invalidateQueries({ queryKey: ['casais'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
        },
    })
}
