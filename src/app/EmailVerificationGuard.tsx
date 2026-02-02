/**
 * Componente EmailVerificationGuard
 * Verifica se o usuário precisa cadastrar/verificar email antes de acessar a aplicação
 * 
 * NOTA: Com a opção "validar depois", este guard apenas redireciona uma vez
 * após o login, não bloqueia o acesso ao sistema.
 */

import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useEmailVerificationStatus } from '@/features/auth'

interface EmailVerificationGuardProps {
    children: React.ReactNode
}

// Chave para armazenar se o usuário já viu a tela de verificação nesta sessão
const VERIFICATION_SHOWN_KEY = 'email_verification_shown'

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
    const { data: status, isLoading } = useEmailVerificationStatus()
    const location = useLocation()
    const [shouldRedirect, setShouldRedirect] = useState(false)

    useEffect(() => {
        // Verifica se deve redirecionar (apenas uma vez por sessão)
        if (status && !isLoading) {
            const hasShown = sessionStorage.getItem(VERIFICATION_SHOWN_KEY)

            // Redireciona apenas se o usuário não tem email cadastrado
            // Se já tem email mas não verificou, mostramos badge nas configurações
            if (status.needs_email && !hasShown) {
                sessionStorage.setItem(VERIFICATION_SHOWN_KEY, 'true')
                setShouldRedirect(true)
            }
        }
    }, [status, isLoading])

    // Se está carregando, mostra loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 safe-top safe-bottom">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Verificando...</p>
                </div>
            </div>
        )
    }

    // Redireciona apenas uma vez
    if (shouldRedirect && location.pathname !== '/verificar-email') {
        return <Navigate to="/verificar-email" state={{ from: location }} replace />
    }

    // Renderiza o conteúdo normalmente
    return <>{children}</>
}
