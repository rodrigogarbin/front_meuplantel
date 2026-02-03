/**
 * Hook para gerenciar renovação automática de token
 *
 * Funcionalidades:
 * - Verifica e renova token ao abrir o app
 * - Verifica periodicamente se precisa renovar (a cada 5 minutos)
 * - Renova ao voltar do background (visibilitychange)
 * - Só funciona quando "Lembrar-me" está ativado
 */

import { useEffect } from 'react'
import { useAuthStore, useIsAuthenticated, useRememberMe } from '@/features/auth/authStore'

const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutos

export function useAutoRefresh() {
    const isAuthenticated = useIsAuthenticated()
    const rememberMe = useRememberMe()
    const autoRefreshIfNeeded = useAuthStore((state) => state.autoRefreshIfNeeded)

    useEffect(() => {
        // Só ativa se estiver autenticado e com rememberMe ativo
        if (!isAuthenticated || !rememberMe) {
            return
        }

        // Verifica imediatamente ao montar
        autoRefreshIfNeeded()

        // Configura verificação periódica
        const intervalId = setInterval(() => {
            autoRefreshIfNeeded()
        }, CHECK_INTERVAL)

        // Verifica quando a página volta do background (ex: trocar de aba)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                autoRefreshIfNeeded()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup
        return () => {
            clearInterval(intervalId)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [isAuthenticated, rememberMe, autoRefreshIfNeeded])
}
