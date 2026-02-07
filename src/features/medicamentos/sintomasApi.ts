/**
 * API Service para Sintomas
 * Hooks do TanStack Query para manipulação de sintomas
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Sintoma } from '@/types'

export interface CreateSintomaPayload {
    nome: string
    descricao?: string | null
}

export interface UpdateSintomaPayload extends CreateSintomaPayload {
    sintoma_id: number
}

// Criar sintoma
async function createSintoma(payload: CreateSintomaPayload): Promise<Sintoma> {
    const response = await api.post('/api/v1/sintomas', payload)
    return response.data.data || response.data
}

// Atualizar sintoma
async function updateSintoma({ sintoma_id, ...payload }: UpdateSintomaPayload): Promise<Sintoma> {
    const response = await api.put(`/api/v1/sintomas/${sintoma_id}`, payload)
    return response.data.data || response.data
}

// Deletar sintoma
async function deleteSintoma(id: number): Promise<void> {
    await api.delete(`/api/v1/sintomas/${id}`)
}

/**
 * Hook para criar sintoma
 */
export function useCreateSintoma() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createSintoma,
        onSuccess: () => {
            // Invalidar cache de sintomas
            queryClient.invalidateQueries({ queryKey: ['sintomas'] })
        },
    })
}

/**
 * Hook para atualizar sintoma
 */
export function useUpdateSintoma() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateSintoma,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sintomas'] })
        },
    })
}

/**
 * Hook para deletar sintoma
 */
export function useDeleteSintoma() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteSintoma,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sintomas'] })
        },
    })
}
