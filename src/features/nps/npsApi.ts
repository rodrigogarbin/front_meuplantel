import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore, useIsImpersonating } from '@/features/auth/authStore'

const NPS_SNOOZE_KEY = 'meuplantel_nps_snooze'

export function isNpsSnoozed(): boolean {
    const val = localStorage.getItem(NPS_SNOOZE_KEY)
    if (!val) return false
    return Date.now() < parseInt(val, 10)
}

export function snoozeNps(days = 3): void {
    localStorage.setItem(NPS_SNOOZE_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000))
}

export interface NpsPendente {
    mostrar: boolean
}

export interface NpsResultados {
    total: number
    media: number | null
    nps_score: number | null
    distribuicao: Record<string, number>
    sugestoes: {
        nota: number
        sugestao: string
        dt_resposta: string
        usuario: { nome: string } | null
    }[]
}

export interface SubmitNpsPayload {
    nota: number
    sugestao?: string
    origem?: 'app' | 'email'
    uid?: number
    token?: string
}

export interface EnviarNpsEmailPayload {
    user_ids: number[]
}

export function useNpsPendente() {
    const { isAuthenticated } = useAuthStore()
    const isImpersonating = useIsImpersonating()

    return useQuery<NpsPendente>({
        queryKey: ['nps', 'pendente'],
        queryFn: async () => {
            const { data } = await api.get('/api/v1/nps/pendente')
            return data
        },
        enabled: isAuthenticated && !isImpersonating,
        staleTime: import.meta.env.DEV ? 0 : 60 * 60 * 1000, // 0 em dev, 1h em prod
        retry: false,
    })
}

export function useNpsResultados() {
    return useQuery<NpsResultados>({
        queryKey: ['admin', 'nps', 'resultados'],
        queryFn: async () => {
            const { data } = await api.get('/api/v1/admin/nps/resultados')
            return data
        },
    })
}

export function useSubmitNps() {
    return useMutation({
        mutationFn: async (payload: SubmitNpsPayload) => {
            const { data } = await api.post('/api/v1/nps', payload)
            return data
        },
    })
}

export function useEnviarNpsEmail() {
    return useMutation({
        mutationFn: async (payload: EnviarNpsEmailPayload) => {
            const { data } = await api.post('/api/v1/admin/nps/enviar-email', payload)
            return data
        },
    })
}
