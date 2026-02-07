/**
 * API Service para Medicamentos
 * Hooks do TanStack Query para fetch de dados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Medicamento, Doenca, Sintoma, CreateMedicamentoPayload, UpdateMedicamentoPayload } from '@/types'

// Tipos de resposta da API
interface MedicamentosResponse {
    data?: Medicamento[]
    medicamentos?: Medicamento[]
}

interface DoencasResponse {
    data?: Doenca[]
    doencas?: Doenca[]
}

interface SintomasResponse {
    data?: Sintoma[]
    sintomas?: Sintoma[]
}

// Query keys
export const medicamentosKeys = {
    all: ['medicamentos'] as const,
    list: (filters?: { search?: string; doenca_id?: number; sintoma_id?: number }) =>
        [...medicamentosKeys.all, 'list', filters] as const,
    detail: (id: number) => [...medicamentosKeys.all, 'detail', id] as const,
}

/**
 * Busca a lista de medicamentos com filtros opcionais
 */
async function fetchMedicamentos(filters?: {
    search?: string
    doenca_id?: number
    sintoma_id?: number
}): Promise<Medicamento[]> {
    const params = new URLSearchParams()

    if (filters?.search) {
        params.append('search', filters.search)
    }
    if (filters?.doenca_id) {
        params.append('doenca_id', filters.doenca_id.toString())
    }
    if (filters?.sintoma_id) {
        params.append('sintoma_id', filters.sintoma_id.toString())
    }

    const url = `/api/v1/medicamentos${params.toString() ? `?${params.toString()}` : ''}`
    const response = await api.get<MedicamentosResponse | Medicamento[]>(url)

    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.data) {
        return data.data
    }

    if (data.medicamentos) {
        return data.medicamentos
    }

    return []
}

/**
 * Hook para buscar lista de medicamentos
 */
export function useMedicamentos(filters?: { search?: string; doenca_id?: number; sintoma_id?: number }) {
    return useQuery({
        queryKey: medicamentosKeys.list(filters),
        queryFn: () => fetchMedicamentos(filters),
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

/**
 * Busca a lista de doenças (catálogo global)
 */
async function fetchDoencas(): Promise<Doenca[]> {
    const response = await api.get<DoencasResponse | Doenca[]>('/api/v1/doencas')

    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.data) {
        return data.data
    }

    if (data.doencas) {
        return data.doencas
    }

    return []
}

/**
 * Hook para buscar lista de doenças
 */
export function useDoencas() {
    return useQuery({
        queryKey: ['doencas'],
        queryFn: fetchDoencas,
        staleTime: 30 * 60 * 1000, // 30 minutos (catálogo global, mais estável)
    })
}

/**
 * Busca a lista de sintomas (catálogo global)
 */
async function fetchSintomas(): Promise<Sintoma[]> {
    const response = await api.get<SintomasResponse | Sintoma[]>('/api/v1/sintomas')

    const data = response.data

    if (Array.isArray(data)) {
        return data
    }

    if (data.data) {
        return data.data
    }

    if (data.sintomas) {
        return data.sintomas
    }

    return []
}

/**
 * Hook para buscar lista de sintomas
 */
export function useSintomas() {
    return useQuery({
        queryKey: ['sintomas'],
        queryFn: fetchSintomas,
        staleTime: 30 * 60 * 1000, // 30 minutos (catálogo global, mais estável)
    })
}

// Criar medicamento
async function createMedicamento(payload: CreateMedicamentoPayload): Promise<Medicamento> {
    const response = await api.post('/api/v1/medicamentos', payload)
    return response.data.data || response.data
}

// Atualizar medicamento
async function updateMedicamento({ medicamento_id, ...payload }: UpdateMedicamentoPayload): Promise<Medicamento> {
    const response = await api.put(`/api/v1/medicamentos/${medicamento_id}`, payload)
    return response.data.data || response.data
}

// Deletar medicamento
async function deleteMedicamento(id: number): Promise<void> {
    await api.delete(`/api/v1/medicamentos/${id}`)
}

/**
 * Hook para criar medicamento
 */
export function useCreateMedicamento() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createMedicamento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: medicamentosKeys.all })
        },
    })
}

/**
 * Hook para atualizar medicamento
 */
export function useUpdateMedicamento() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateMedicamento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: medicamentosKeys.all })
        },
    })
}

/**
 * Hook para deletar medicamento
 */
export function useDeleteMedicamento() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteMedicamento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: medicamentosKeys.all })
        },
    })
}
