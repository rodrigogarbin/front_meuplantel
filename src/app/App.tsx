/**
 * App principal com providers
 */

import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { queryClient } from '@/lib/queryClient'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

function App() {
    // A validação da sessão é feita automaticamente pelo Zustand persist
    // quando o estado é rehidratado do localStorage.
    // Se o token estiver expirado, o interceptor do Axios irá fazer o refresh
    // ou redirecionar para o login.

    // Hook para renovação automática de token (quando "Lembrar-me" está ativo)
    useAutoRefresh()

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <PWAInstallBanner />
        </QueryClientProvider>
    )
}

export default App
