/**
 * App principal com providers
 */

import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { queryClient } from '@/lib/queryClient'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { SplashScreen } from '@/components/SplashScreen'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useHasHydrated } from '@/features/auth/authStore'

function App() {
    // A validação da sessão é feita automaticamente pelo Zustand persist
    // quando o estado é rehidratado do localStorage.
    // Se o token estiver expirado, o interceptor do Axios irá fazer o refresh
    // ou redirecionar para o login.

    // Hook para renovação automática de token (quando "Lembrar-me" está ativo)
    useAutoRefresh()

    // Hook para verificar se o Zustand já hidratou do localStorage
    const hasHydrated = useHasHydrated()

    // Mostra splash screen enquanto está hidratando
    if (!hasHydrated) {
        return <SplashScreen isLoading={true} />
    }

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <PWAInstallBanner />
        </QueryClientProvider>
    )
}

export default App
