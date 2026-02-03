import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ImpersonateResponse } from '@/types'

export interface AdminUsuario {
    usuario_id: number
    nome: string
    email: string | null
    username: string
    sit: number | null
    is_admin: boolean
    usa_v2: boolean
    total_passaros: number
    total_casais: number
}

interface PaginatedResponse {
    data: AdminUsuario[]
    current_page: number
    last_page: number
    total: number
}

export function useAdminUsuarios(search: string, page: number = 1) {
    return useQuery<PaginatedResponse>({
        queryKey: ['admin', 'usuarios', search, page],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (search) params.set('q', search)
            params.set('page', String(page))
            const { data } = await api.get(`/api/v1/admin/usuarios?${params}`)
            return data
        },
    })
}

export interface AdminStats {
    usuarios: {
        total: number
        com_email: number
        email_verificado: number
        usa_v2: number
        usa_v1: number
        admins: number
        novos_mes: number
    }
    passaros: {
        total: number
        no_plantel: number
        vendidos: number
        mortos: number
        emprestados: number
        machos: number
        femeas: number
        indefinidos: number
    }
    casais: {
        total: number
        ativos: number
    }
    posturas: {
        total: number
        ano_atual: number
    }
    top_usuarios: {
        usuario_id: number
        nome: string
        username: string
        total_passaros: number
        total_casais: number
    }[]
}

export function useAdminStats() {
    return useQuery<AdminStats>({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const { data } = await api.get('/api/v1/admin/stats')
            return data.data
        },
        staleTime: 5 * 60 * 1000,
    })
}

export async function impersonateUser(id: number): Promise<ImpersonateResponse> {
    const { data } = await api.post(`/api/v1/admin/impersonate/${id}`)
    return data.data
}

export async function toggleVersao(id: number): Promise<{ usuario_id: number; usa_v2: boolean }> {
    const { data } = await api.patch(`/api/v1/admin/usuarios/${id}/versao`)
    return data.data
}

export async function deleteUsuario(id: number): Promise<void> {
    await api.delete(`/api/v1/admin/usuarios/${id}`)
}

export async function bulkDeleteUsuarios(ids: number[]): Promise<{ deleted_count: number }> {
    const { data } = await api.post('/api/v1/admin/usuarios/bulk-delete', { ids })
    return data
}
