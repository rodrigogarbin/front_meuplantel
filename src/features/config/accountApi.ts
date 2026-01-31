/**
 * API para ações da conta (reiniciar sistema / apagar todos os dados)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

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
