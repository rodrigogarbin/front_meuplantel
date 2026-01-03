/**
 * API Service para Espécies
 * Hooks do TanStack Query para fetch de dados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { EspecieUsuario, Grupo } from '@/types'

// Tipo da resposta da API
interface EspeciesResponse {
    data?: EspecieUsuario[]
    especies?: EspecieUsuario[]
}

interface GruposResponse {
    data?: Grupo[]
    grupos?: Grupo[]
}

// Query keys
export const especiesKeys = {
    all: ['especies'] as const,
    list: () => [...especiesKeys.all, 'list'] as const,
    detail: (id: number) => [...especiesKeys.all, 'detail', id] as const,
}

// Tipos para a API
export interface CreateEspeciePayload {
    descr: string
    dias_choco?: number | null
    dias_anilha?: number | null
    dias_separa?: number | null
    grupo_id?: number | null
}

export interface UpdateEspeciePayload extends Partial<CreateEspeciePayload> {
    especie_usuario_id: number
}

/**
 * Busca a lista de espécies do usuário (todas, sem paginação)
 */
async function fetchEspecies(): Promise<EspecieUsuario[]> {
    const response = await api.get<EspeciesResponse | EspecieUsuario[]>('/api/v1/especies/todas')

    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.data) {
        return data.data
    }

    if (data.especies) {
        return data.especies
    }

    return []
}

/**
 * Hook para buscar lista de espécies
 */
export function useEspecies() {
    return useQuery({
        queryKey: especiesKeys.list(),
        queryFn: fetchEspecies,
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

/**
 * Busca a lista de grupos (espécies padrão do sistema)
 */
async function fetchGrupos(): Promise<Grupo[]> {
    const response = await api.get<GruposResponse | Grupo[]>('/api/v1/grupos')

    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.data) {
        return data.data
    }

    if (data.grupos) {
        return data.grupos
    }

    return []
}

/**
 * Hook para buscar lista de grupos
 */
export function useGrupos() {
    return useQuery({
        queryKey: ['grupos'],
        queryFn: fetchGrupos,
        staleTime: 30 * 60 * 1000, // 30 minutos (dados mais estáticos)
    })
}

// Criar espécie
async function createEspecie(payload: CreateEspeciePayload): Promise<EspecieUsuario> {
    const response = await api.post('/api/v1/especies', payload)
    return response.data.data || response.data
}

// Atualizar espécie
async function updateEspecie({ especie_usuario_id, ...payload }: UpdateEspeciePayload): Promise<EspecieUsuario> {
    const response = await api.put(`/api/v1/especies/${especie_usuario_id}`, payload)
    return response.data.data || response.data
}

// Deletar espécie
async function deleteEspecie(id: number): Promise<void> {
    await api.delete(`/api/v1/especies/${id}`)
}

/**
 * Hook para criar espécie
 */
export function useCreateEspecie() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createEspecie,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: especiesKeys.all })
        },
    })
}

/**
 * Hook para atualizar espécie
 */
export function useUpdateEspecie() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateEspecie,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: especiesKeys.all })
        },
    })
}

/**
 * Hook para deletar espécie
 */
export function useDeleteEspecie() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteEspecie,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: especiesKeys.all })
        },
    })
}
