/**
 * API Service para Doenças
 * Hooks do TanStack Query para manipulação de doenças
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Doenca } from '@/types'

export interface CreateDoencaPayload {
    nome: string
    descricao?: string | null
    sintoma_ids?: number[]
}

export interface UpdateDoencaPayload extends CreateDoencaPayload {
    doenca_id: number
}

// Criar doença
async function createDoenca(payload: CreateDoencaPayload): Promise<Doenca> {
    const response = await api.post('/api/v1/doencas', payload)
    return response.data.data || response.data
}

// Atualizar doença
async function updateDoenca({ doenca_id, ...payload }: UpdateDoencaPayload): Promise<Doenca> {
    const response = await api.put(`/api/v1/doencas/${doenca_id}`, payload)
    return response.data.data || response.data
}

// Deletar doença
async function deleteDoenca(id: number): Promise<void> {
    await api.delete(`/api/v1/doencas/${id}`)
}

/**
 * Hook para criar doença
 */
export function useCreateDoenca() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createDoenca,
        onSuccess: () => {
            // Invalidar cache de doenças
            queryClient.invalidateQueries({ queryKey: ['doencas'] })
        },
    })
}

/**
 * Hook para atualizar doença
 */
export function useUpdateDoenca() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateDoenca,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doencas'] })
        },
    })
}

/**
 * Hook para deletar doença
 */
export function useDeleteDoenca() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteDoenca,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doencas'] })
        },
    })
}
