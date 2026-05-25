/**
 * Componente PrivateRoute
 * Protege rotas que exigem autenticação
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useIsAuthenticated, useHasHydrated, useAuthStore } from '@/features/auth'

interface PrivateRouteProps {
    children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    const isAuthenticated = useIsAuthenticated()
    const hasHydrated = useHasHydrated()
    const validateSession = useAuthStore((state) => state.validateSession)
    const location = useLocation()
    const [isValidating, setIsValidating] = useState(false)
    const [validated, setValidated] = useState(false)

    // Ao montar, valida se o cookie ainda é válido chamando /me
    useEffect(() => {
        if (!hasHydrated) return
        if (!isAuthenticated) {
            setValidated(true)
            return
        }

        setIsValidating(true)
        validateSession().finally(() => {
            setIsValidating(false)
            setValidated(true)
        })
    }, [hasHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

    // Aguarda hidratação do localStorage
    if (!hasHydrated || isValidating || !validated) {
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

    return <>{children}</>
}
