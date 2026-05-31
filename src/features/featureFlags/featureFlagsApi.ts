import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type FeatureFlagChave = 'financeiro' | 'certificados' | 'push_notifications' | 'medicamentos'
export type MyFlags = Record<FeatureFlagChave, boolean>

export interface AdminFeatureFlag {
    feature_flag_id: number
    chave: FeatureFlagChave
    nome: string
    descricao: string | null
    habilitado_por_padrao: boolean
}

export interface UsuarioFlag {
    chave: FeatureFlagChave
    nome: string
    habilitada: boolean
    override: boolean | null
}

export function useMyFeatureFlags() {
    return useQuery<MyFlags>({
        queryKey: ['feature-flags', 'my'],
        queryFn: async () => {
            const { data } = await api.get('/api/v1/feature-flags')
            return data
        },
        staleTime: 5 * 60 * 1000,
    })
}

export function useAdminFeatureFlags() {
    return useQuery<AdminFeatureFlag[]>({
        queryKey: ['admin', 'feature-flags'],
        queryFn: async () => {
            const { data } = await api.get('/api/v1/admin/feature-flags')
            return data
        },
    })
}

export function useAdminUsuarioFlags(userId: number) {
    return useQuery<UsuarioFlag[]>({
        queryKey: ['admin', 'feature-flags', 'usuario', userId],
        queryFn: async () => {
            const { data } = await api.get(`/api/v1/admin/usuarios/${userId}/feature-flags`)
            return data
        },
        enabled: userId > 0,
    })
}

export function useUpdateFlagDefault() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ chave, habilitado_por_padrao }: { chave: FeatureFlagChave; habilitado_por_padrao: boolean }) => {
            const { data } = await api.patch(`/api/v1/admin/feature-flags/${chave}`, { habilitado_por_padrao })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
        },
    })
}

export function useToggleUsuarioFlag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            userId,
            chave,
            habilitada,
            reset,
        }: {
            userId: number
            chave: FeatureFlagChave
            habilitada?: boolean
            reset?: boolean
        }) => {
            const body = reset ? { reset: true } : { habilitada }
            const { data } = await api.patch(`/api/v1/admin/usuarios/${userId}/feature-flags/${chave}`, body)
            return data
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags', 'usuario', variables.userId] })
        },
    })
}
