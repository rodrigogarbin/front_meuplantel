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

export async function impersonateUser(id: number): Promise<ImpersonateResponse> {
    const { data } = await api.post(`/api/v1/admin/impersonate/${id}`)
    return data.data
}

export async function toggleVersao(id: number): Promise<{ usuario_id: number; usa_v2: boolean }> {
    const { data } = await api.patch(`/api/v1/admin/usuarios/${id}/versao`)
    return data.data
}
