/**
 * Componente PrivateRoute
 * Protege rotas que exigem autenticação
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useIsAuthenticated, useHasHydrated } from '@/features/auth'

interface PrivateRouteProps {
    children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    const isAuthenticated = useIsAuthenticated()
    const hasHydrated = useHasHydrated()
    const location = useLocation()

    // Se ainda não hidratou do localStorage, mostra loading
    if (!hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
                </div>
            </div>
        )
    }

    // Se não está autenticado, redireciona para login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Se está autenticado, renderiza o conteúdo
    return <>{children}</>
}
