/**
 * API e hooks para o módulo financeiro
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Transacao {
    financeiro_id: number
    tipo: 'receita' | 'despesa'
    categoria: string
    valor: number
    descricao: string | null
    data: string
    passaro_id: number | null
    passaro?: { passaro_id: number; descr: string; anel?: string }
}

export interface FinanceiroDashboard {
    saldo: number
    total_receitas: number
    total_despesas: number
    por_mes: { mes: string; receitas: number; despesas: number }[]
    por_categoria: { categoria: string; tipo: string; total: number }[]
}

export interface PaginatedResponse<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export interface FinanceiroFilters {
    tipo?: 'receita' | 'despesa'
    categoria?: string
    data_inicio?: string
    data_fim?: string
    page?: number
}

export interface CreateTransacaoInput {
    tipo: 'receita' | 'despesa'
    categoria: string
    valor: number
    descricao?: string
    data: string
    passaro_id?: number
}

export interface FinanceiroCategoria {
    financeiro_categoria_id: number
    nome: string
    tipo: 'receita' | 'despesa'
    icone: string | null
}

export interface FinanceiroCategorias {
    sistema: { key: string; nome: string; icone: string }[]
    customizadas: FinanceiroCategoria[]
}

export const CATEGORIA_LABELS: Record<string, string> = {
    venda_passaro:  'Venda de pássaro',
    compra_passaro: 'Compra de pássaro',
    despesa_geral:  'Despesa geral',
    receita_avulsa: 'Receita avulsa',
}

export const CATEGORIA_ICONS: Record<string, string> = {
    venda_passaro:  '🐦',
    compra_passaro: '🛒',
    despesa_geral:  '📦',
    receita_avulsa: '💰',
}

export const CATEGORIAS_RECEITA = ['venda_passaro', 'receita_avulsa'] as const
export const CATEGORIAS_DESPESA = ['compra_passaro', 'despesa_geral'] as const

// Mapeamento de categoria do sistema para tipo
export const CATEGORIA_TIPO: Record<string, 'receita' | 'despesa'> = {
    venda_passaro:  'receita',
    receita_avulsa: 'receita',
    compra_passaro: 'despesa',
    despesa_geral:  'despesa',
}

// Hooks

export function useFinanceiro(filters: FinanceiroFilters = {}) {
    return useQuery({
        queryKey: ['financeiro', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters.tipo) params.set('tipo', filters.tipo)
            if (filters.categoria) params.set('categoria', filters.categoria)
            if (filters.data_inicio) params.set('data_inicio', filters.data_inicio)
            if (filters.data_fim) params.set('data_fim', filters.data_fim)
            if (filters.page) params.set('page', String(filters.page))
            const { data } = await api.get<PaginatedResponse<Transacao>>(`/api/v1/financeiro?${params.toString()}`)
            return data
        },
    })
}

export function useFinanceiroDashboard(meses = 6) {
    return useQuery({
        queryKey: ['financeiro', 'dashboard', meses],
        queryFn: async () => {
            const { data } = await api.get<FinanceiroDashboard>(`/api/v1/financeiro/dashboard?meses=${meses}`)
            return data
        },
    })
}

export function useCreateTransacao() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (input: CreateTransacaoInput) => api.post('/api/v1/financeiro', input),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['financeiro'] }),
    })
}

export function useUpdateTransacao() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, ...input }: { id: number } & Partial<CreateTransacaoInput>) =>
            api.put(`/api/v1/financeiro/${id}`, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['financeiro'] }),
    })
}

export function useDeleteTransacao() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/financeiro/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['financeiro'] }),
    })
}

export function useFinanceiroCategorias(tipo?: 'receita' | 'despesa') {
    return useQuery({
        queryKey: ['financeiro', 'categorias', tipo],
        queryFn: async () => {
            const params = tipo ? `?tipo=${tipo}` : ''
            const { data } = await api.get<FinanceiroCategorias>(`/api/v1/financeiro/categorias${params}`)
            return data
        },
    })
}

export function useCreateCategoria() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: { nome: string; tipo: 'receita' | 'despesa'; icone?: string }) => {
            const { data } = await api.post('/api/v1/financeiro/categorias', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financeiro', 'categorias'] })
        },
    })
}

export function useDeleteCategoria() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api/v1/financeiro/categorias/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financeiro', 'categorias'] })
        },
    })
}
