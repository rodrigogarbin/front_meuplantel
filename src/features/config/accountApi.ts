/**
 * API para ações da conta (reiniciar sistema / apagar todos os dados)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// ——— Gestão Config ——————————————————————————————————————

export interface GestaoConfig {
    tipo: 0 | 1 | 2   // 0=todos | 1=a partir de ano | 2=últimos N anos
    valor: number | null
}

export function useGestaoConfig() {
    return useQuery<GestaoConfig>({
        queryKey: ['account', 'gestao-config'],
        queryFn: async () => (await api.get<GestaoConfig>('/api/v1/account/gestao-config')).data,
        staleTime: 5 * 60 * 1000,
    })
}

export function useSaveGestaoConfig() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (config: GestaoConfig) => api.put('/api/v1/account/gestao-config', config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['account', 'gestao-config'] })
            queryClient.invalidateQueries({ queryKey: ['gestao'] })
        },
    })
}

// ——— Reset Data ——————————————————————————————————————————

async function resetData(): Promise<void> {
    await api.post('/api/v1/account/reset-data')
}

export function useResetData() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: resetData,
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: ['casais'] })
            queryClient.removeQueries({ queryKey: ['passaros'] })
            queryClient.removeQueries({ queryKey: ['posturas'] })
            queryClient.removeQueries({ queryKey: ['especies'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}
