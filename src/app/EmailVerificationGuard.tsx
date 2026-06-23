/**
 * Componente EmailVerificationGuard
 *
 * Responsabilidades:
 * 1. Redireciona para /verificar-email quando usuário não tem e-mail cadastrado (needs_email=true)
 *    — apenas uma vez por sessão (fluxo antigo).
 * 2. Exibe banner amarelo quando usuário tem e-mail não verificado dentro do grace period.
 * 3. Trata query param ?email_verificado=1 — exibe toast de sucesso e limpa o param.
 *    O redirect com esse param é gerado pelo link de verificação no e-mail.
 */

import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEmailVerificationStatus } from '@/features/auth'

interface EmailVerificationGuardProps {
    children: React.ReactNode
}

// Chave para armazenar se o usuário já viu a tela de verificação nesta sessão
const VERIFICATION_SHOWN_KEY = 'email_verification_shown'

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
    const { data: status, isLoading } = useEmailVerificationStatus()
    const location = useLocation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [shouldRedirect, setShouldRedirect] = useState(false)
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    // Trata ?email_verificado=1 vindo do link de verificação por e-mail
    useEffect(() => {
        if (searchParams.get('email_verificado') === '1') {
            setShowSuccessToast(true)
            // Remove o param da URL sem reload
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('email_verificado')
            setSearchParams(nextParams, { replace: true })

            const timer = setTimeout(() => setShowSuccessToast(false), 4000)
            return () => clearTimeout(timer)
        }
    }, [searchParams, setSearchParams])

    useEffect(() => {
        if (status && !isLoading) {
            const hasShown = sessionStorage.getItem(VERIFICATION_SHOWN_KEY)

            // Redireciona apenas quando não tem e-mail cadastrado e ainda não mostrou nesta sessão
            if (status.needs_email && !hasShown) {
                sessionStorage.setItem(VERIFICATION_SHOWN_KEY, 'true')
                setShouldRedirect(true)
            }
        }
    }, [status, isLoading])

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

    if (shouldRedirect && location.pathname !== '/verificar-email') {
        return <Navigate to="/verificar-email" state={{ from: location }} replace />
    }

    // Calcula se deve exibir banner de grace period
    // Condição: tem e-mail mas não verificou, e o grace period ainda não expirou
    const showGraceBanner =
        status !== undefined &&
        !status.needs_email &&
        status.email !== null &&
        !status.email_verified &&
        !!status.email_grace_expires_at

    let diasRestantes = 0
    if (showGraceBanner && status?.email_grace_expires_at) {
        diasRestantes = Math.ceil(
            (new Date(status.email_grace_expires_at).getTime() - Date.now()) / 86_400_000
        )
    }

    return (
        <>
            {/* Toast de sucesso para verificação via link */}
            {showSuccessToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg flex items-center gap-2 max-w-sm w-[calc(100%-2rem)]">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    E-mail verificado com sucesso!
                </div>
            )}

            {/* Banner de grace period */}
            {showGraceBanner && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Verifique seu e-mail para garantir acesso.{' '}
                        {diasRestantes > 0
                            ? `${diasRestantes} dia(s) restante(s).`
                            : 'Ultimo dia!'}
                    </p>
                    <button
                        onClick={() => navigate('/verificar-email')}
                        className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-300 underline"
                    >
                        Verificar agora
                    </button>
                </div>
            )}

            {children}
        </>
    )
}
