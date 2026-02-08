import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface LoginLog {
    id: number
    usuario_id: number
    ip_address: string | null
    user_agent: string | null
    sucesso: boolean
    login_at: string
}

export interface LoginStats {
    periodo_dias: number
    total_logins: number
    logins_sucesso: number
    logins_falha: number
    usuarios_ativos: number
    logins_por_dia: {
        data: string
        total: number
        sucesso: number
        falha: number
    }[]
    usuarios_mais_ativos: {
        usuario_id: number
        total_logins: number
        usuario: {
            usuario_id: number
            nome: string
            username: string
            email: string | null
        }
    }[]
}

export interface UsuarioAtivo {
    usuario_id: number
    nome: string
    username: string
    email: string | null
    total_logins: number
    ultimo_login: string
}

export interface UsuariosAtivosResponse {
    periodo_dias: number
    total_usuarios: number
    usuarios: UsuarioAtivo[]
}

/**
 * Hook para buscar estatísticas gerais de login
 */
export function useLoginStats(periodo: number = 30) {
    return useQuery({
        queryKey: ['admin', 'login-stats', periodo],
        queryFn: async () => {
            try {
                const { data } = await api.get<LoginStats>(`api/v1/login-stats?periodo=${periodo}`)
                return data
            } catch (error: any) {
                console.error('Erro ao buscar estatísticas de login:', error)
                console.error('Response:', error.response?.data)
                console.error('Status:', error.response?.status)
                throw error
            }
        },
        retry: false,
    })
}

/**
 * Hook para buscar usuários ativos
 */
export function useUsuariosAtivos(dias: number = 30) {
    return useQuery({
        queryKey: ['admin', 'usuarios-ativos', dias],
        queryFn: async () => {
            const { data } = await api.get<UsuariosAtivosResponse>(`/v1/login-stats/usuarios-ativos?dias=${dias}`)
            return data
        },
    })
}
