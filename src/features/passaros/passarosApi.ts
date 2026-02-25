/**
 * API Service para Pássaros
 * Hooks do TanStack Query para fetch de dados
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Passaro, PassaroFilters, CreatePassaroPayload, UpdatePassaroPayload } from '@/types'
import { generateTempId, enqueueOperation, captureOfflineContext, type OfflineMutationContext } from '@/lib/offlineMutation'

// Tipo da resposta da API
interface PassarosResponse {
    passaros?: Passaro[]
    data?: Passaro[]
    meta?: {
        page?: number | number[]
        current_page?: number | number[]
        last_page?: number | number[]
        per_page?: number | number[]
        total?: number | number[]
    }
}

/**
 * Busca a lista de pássaros com filtros
 */
async function fetchPassaros(filters: PassaroFilters = {}): Promise<Passaro[]> {
    const params = new URLSearchParams()

    // Adiciona filtros apenas se definidos
    if (filters.sit !== undefined) {
        params.append('sit', filters.sit.toString())
    }
    if (filters.sexo !== undefined) {
        params.append('sexo', filters.sexo.toString())
    }
    if (filters.ano !== undefined) {
        params.append('ano', filters.ano.toString())
    }
    if (filters.passaro_pai_id !== undefined) {
        params.append('passaro_pai_id', filters.passaro_pai_id.toString())
    }
    if (filters.passaro_mae_id !== undefined) {
        params.append('passaro_mae_id', filters.passaro_mae_id.toString())
    }
    if (filters.nro !== undefined && filters.nro.trim()) {
        params.append('nro', filters.nro.trim())
    }
    if (filters.descr !== undefined && filters.descr.trim()) {
        params.append('descr', filters.descr.trim())
    }
    if (filters.search !== undefined && filters.search.trim()) {
        params.append('search', filters.search.trim())
    }

    const response = await api.get<PassarosResponse | Passaro[]>(`/api/v1/passaros?${params.toString()}`)

    // API pode retornar:
    // - { passaros: [...] }
    // - { data: [...] }
    // - [...]
    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.passaros) {
        return data.passaros
    }

    if (data.data) {
        return data.data
    }

    return []
}

/**
 * Hook para buscar lista de pássaros (sem paginação)
 */
export function usePassaros(filters: PassaroFilters = {}) {
    return useQuery({
        queryKey: ['passaros', filters],
        queryFn: () => fetchPassaros(filters),
    })
}

/**
 * Busca pássaros com paginação
 */
async function fetchPassarosPaginated(filters: PassaroFilters = {}, page: number = 1): Promise<{ passaros: Passaro[]; nextPage: number | null; total: number }> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('per_page', '20')

    if (filters.sit !== undefined) {
        params.append('sit', filters.sit.toString())
    }
    if (filters.sexo !== undefined) {
        params.append('sexo', filters.sexo.toString())
    }
    if (filters.ano !== undefined) {
        params.append('ano', filters.ano.toString())
    }
    if (filters.nro !== undefined && filters.nro.trim()) {
        params.append('nro', filters.nro.trim())
    }
    if (filters.descr !== undefined && filters.descr.trim()) {
        params.append('descr', filters.descr.trim())
    }
    if (filters.search !== undefined && filters.search.trim()) {
        params.append('search', filters.search.trim())
    }

    const response = await api.get<PassarosResponse>(`/api/v1/passaros?${params.toString()}`)
    const data = response.data

    const passaros = data.data ?? data.passaros ?? []
    const meta = data.meta

    // Extrai valores do meta (pode vir como array ou número devido a bug na API)
    const extractNumber = (val: unknown): number => {
        if (Array.isArray(val)) return Number(val[0]) || 0
        return Number(val) || 0
    }

    // Calcula se há mais páginas
    const currentPage = extractNumber(meta?.page) || extractNumber(meta?.current_page) || page
    const total = extractNumber(meta?.total)
    const perPage = extractNumber(meta?.per_page) || 20
    const lastPage = extractNumber(meta?.last_page) || Math.ceil(total / perPage)
    const hasMore = currentPage < lastPage
    const nextPage = hasMore ? page + 1 : null

    return { passaros, nextPage, total }
}

/**
 * Hook para buscar lista de pássaros com infinite scroll
 */
export function usePassarosInfinite(filters: PassaroFilters = {}) {
    return useInfiniteQuery({
        queryKey: ['passaros-infinite', filters],
        queryFn: ({ pageParam = 1 }) => fetchPassarosPaginated(filters, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    })
}

/**
 * Busca pássaros para autocomplete (machos ou fêmeas)
 * Busca todos os pássaros ativos do sexo especificado (sem paginação limitada)
 */
async function fetchPassarosAutocomplete(sexo?: number): Promise<Passaro[]> {
    const params = new URLSearchParams()
    params.append('sit', '1') // Apenas ativos
    params.append('per_page', '1000') // Busca todos para autocomplete
    if (sexo !== undefined) {
        params.append('sexo', sexo.toString())
    }

    const response = await api.get<PassarosResponse | Passaro[]>(`/api/v1/passaros?${params.toString()}`)
    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    return data.passaros ?? data.data ?? []
}

/**
 * Hook para buscar machos para autocomplete
 */
export function useMachos() {
    return useQuery({
        queryKey: ['passaros', 'machos'],
        queryFn: () => fetchPassarosAutocomplete(1),
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook para buscar fêmeas para autocomplete
 */
export function useFemeas() {
    return useQuery({
        queryKey: ['passaros', 'femeas'],
        queryFn: () => fetchPassarosAutocomplete(2),
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Busca um pássaro específico por ID
 */
async function fetchPassaro(id: number): Promise<Passaro> {
    const response = await api.get<{ data: Passaro } | Passaro>(`/api/v1/passaros/${id}`)

    // API retorna { data: {...} } (Laravel Resource)
    const responseData = response.data

    // Verifica se a resposta está encapsulada em 'data'
    if (responseData && 'data' in responseData && responseData.data && typeof responseData.data === 'object') {
        return responseData.data as Passaro
    }

    // Resposta direta
    return responseData as Passaro
}

/**
 * Hook para buscar um pássaro específico
 */
export function usePassaro(id: number | null) {
    return useQuery({
        queryKey: ['passaro', id],
        queryFn: () => fetchPassaro(id!),
        enabled: id !== null,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Cria um novo pássaro
 */
async function createPassaro(payload: CreatePassaroPayload): Promise<Passaro> {
    const response = await api.post<Passaro | { data: Passaro }>('/api/v1/passaros', payload)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Passaro
    }
    return response.data as Passaro
}

/**
 * Hook para criar pássaro (com suporte offline)
 */
export function useCreatePassaro() {
    const queryClient = useQueryClient()

    return useMutation({
        onMutate: captureOfflineContext,
        mutationFn: async (payload: CreatePassaroPayload): Promise<Passaro> => {
            if (!navigator.onLine) {
                const tempId = generateTempId()
                const optimistic: Passaro = {
                    passaro_id: tempId as unknown as number,
                    descr: payload.descr,
                    dt_nasc: payload.dt_nasc,
                    sexo: payload.sexo,
                    sit: payload.sit ?? 1,
                    obs: payload.obs,
                    especie_usuario_id: payload.especie_usuario_id,
                    mutacao_id: payload.mutacao_id,
                    passaro_pai_id: payload.passaro_pai_id,
                    passaro_mae_id: payload.passaro_mae_id,
                    anel: { ano: payload.ano, nro: payload.nro, sg_clube: payload.sg_clube ?? null, nro_criador: payload.nro_criador ?? null },
                }

                // Adiciona o novo pássaro a todas as listas em cache
                queryClient.setQueriesData<Passaro[]>(
                    { queryKey: ['passaros'], exact: false },
                    (old) => (old ? [...old, optimistic] : [optimistic])
                )

                await enqueueOperation({
                    type: 'CREATE',
                    entity: 'passaro',
                    entityId: tempId,
                    isTempId: true,
                    payload: payload as unknown as Record<string, unknown>,
                })

                return optimistic
            }
            return createPassaro(payload)
        },
        onSuccess: (_, __, context: OfflineMutationContext | undefined) => {
            if (context?.isOffline) return
            queryClient.invalidateQueries({ queryKey: ['passaros'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['machos'] })
            queryClient.invalidateQueries({ queryKey: ['femeas'] })
            queryClient.invalidateQueries({ queryKey: ['posturas'] })
            queryClient.invalidateQueries({ queryKey: ['casais'] })
            queryClient.invalidateQueries({ queryKey: ['casal'] })
        },
    })
}

/**
 * Atualiza um pássaro existente
 */
async function updatePassaro(payload: UpdatePassaroPayload): Promise<Passaro> {
    const { passaro_id, ...data } = payload
    const response = await api.put<Passaro | { data: Passaro }>(`/api/v1/passaros/${passaro_id}`, data)

    if ('data' in response.data && typeof response.data.data === 'object') {
        return response.data.data as Passaro
    }
    return response.data as Passaro
}

/**
 * Hook para atualizar pássaro (com suporte offline)
 */
export function useUpdatePassaro() {
    const queryClient = useQueryClient()

    return useMutation({
        onMutate: captureOfflineContext,
        mutationFn: async (payload: UpdatePassaroPayload): Promise<Passaro> => {
            if (!navigator.onLine) {
                const existing = queryClient.getQueryData<Passaro>(['passaro', payload.passaro_id])
                const optimistic: Passaro = { ...(existing ?? {}), ...payload }

                // Atualiza o pássaro específico e nas listas
                queryClient.setQueryData(['passaro', payload.passaro_id], optimistic)
                queryClient.setQueriesData<Passaro[]>(
                    { queryKey: ['passaros'], exact: false },
                    (old) => old?.map((p) => p.passaro_id === payload.passaro_id ? optimistic : p) ?? []
                )

                await enqueueOperation({
                    type: 'UPDATE',
                    entity: 'passaro',
                    entityId: payload.passaro_id,
                    isTempId: false,
                    payload: payload as unknown as Record<string, unknown>,
                })

                return optimistic
            }
            return updatePassaro(payload)
        },
        onSuccess: (data, _, context: OfflineMutationContext | undefined) => {
            if (context?.isOffline) return
            queryClient.setQueryData(['passaro', data.passaro_id], data)
            queryClient.invalidateQueries({ queryKey: ['passaros'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['machos'] })
            queryClient.invalidateQueries({ queryKey: ['femeas'] })
        },
    })
}

/**
 * Deleta um pássaro
 */
async function deletePassaro(id: number): Promise<void> {
    await api.delete(`/api/v1/passaros/${id}`)
}

/**
 * Hook para deletar pássaro (com suporte offline)
 */
export function useDeletePassaro() {
    const queryClient = useQueryClient()

    return useMutation({
        onMutate: captureOfflineContext,
        mutationFn: async (id: number): Promise<void> => {
            if (!navigator.onLine) {
                // Remove das listas em cache
                queryClient.setQueriesData<Passaro[]>(
                    { queryKey: ['passaros'], exact: false },
                    (old) => old?.filter((p) => p.passaro_id !== id) ?? []
                )

                await enqueueOperation({
                    type: 'DELETE',
                    entity: 'passaro',
                    entityId: id,
                    isTempId: false,
                    payload: { passaro_id: id },
                })

                return
            }
            return deletePassaro(id)
        },
        onSuccess: (_, __, context: OfflineMutationContext | undefined) => {
            if (context?.isOffline) return
            queryClient.invalidateQueries({ queryKey: ['passaros'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['machos'] })
            queryClient.invalidateQueries({ queryKey: ['femeas'] })
        },
    })
}

// ============================================
// ÁRVORE GENEALÓGICA
// ============================================

/**
 * Resposta da árvore genealógica com endogamia
 */
interface ArvoreResponse {
    arvore: Passaro
    endogamia: number
}

/**
 * Busca árvore genealógica completa de um pássaro
 */
async function fetchArvoreGenealogica(id: number): Promise<ArvoreResponse> {
    const response = await api.get<string | Passaro | ArvoreResponse>(`/api/v1/passaros/${id}/arvore-completa`)

    let data = response.data
    if (typeof data === 'string') {
        data = JSON.parse(data)
    }

    // Novo formato: { arvore, endogamia }
    if (data && typeof data === 'object' && 'arvore' in data && 'endogamia' in data) {
        return data as ArvoreResponse
    }

    // Fallback: formato antigo (retorno direto do pássaro)
    return { arvore: data as Passaro, endogamia: 0 }
}

/**
 * Hook para buscar árvore genealógica
 */
export function useArvoreGenealogica(id: number | null) {
    return useQuery({
        queryKey: ['passaro', 'arvore', id],
        queryFn: () => fetchArvoreGenealogica(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 10, // 10 minutos
    })
}

/**
 * Faz upload da foto de um pássaro
 */
async function uploadPassaroFoto(passaro_id: number, foto: File): Promise<{ message: string; foto: string; foto_url: string }> {
    const formData = new FormData()
    formData.append('foto', foto)

    const response = await api.post<{ message: string; foto: string; foto_url: string }>(
        `/api/v1/passaros/${passaro_id}/foto`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    )

    return response.data
}

/**
 * Hook para upload de foto do pássaro
 */
export function useUploadPassaroFoto() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ passaro_id, foto }: { passaro_id: number; foto: File }) =>
            uploadPassaroFoto(passaro_id, foto),
        onSuccess: (_, variables) => {
            // Invalida cache do pássaro específico e listas
            queryClient.invalidateQueries({ queryKey: ['passaro', variables.passaro_id] })
            queryClient.invalidateQueries({ queryKey: ['passaros'] })
            queryClient.invalidateQueries({ queryKey: ['machos'] })
            queryClient.invalidateQueries({ queryKey: ['femeas'] })
        },
    })
}
