/**
 * Página de verificação de email via link de campanha.
 * Rota pública — o token é a prova de identidade (não exige JWT).
 * Se o usuário estiver logado, compara o usuario_id para dar feedback adequado.
 */

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from './authStore'
import { useQueryClient } from '@tanstack/react-query'

type Status = 'loading' | 'success' | 'success-wrong-user' | 'error'

export function VerificarEmailCampanhaPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuthStore()
    const queryClient = useQueryClient()
    const [status, setStatus] = useState<Status>('loading')
    const [errorMsg, setErrorMsg] = useState('')
    const calledRef = useRef(false)

    useEffect(() => {
        if (calledRef.current) return
        calledRef.current = true

        const token = searchParams.get('token')

        if (!token) {
            setErrorMsg('Link inválido. Nenhum token encontrado.')
            setStatus('error')
            return
        }

        api.post('/api/v1/email/verify-link', { token })
            .then((res) => {
                const verifiedUserId: number = res.data?.usuario_id
                const loggedUserId: number | undefined = user?.usuario_id

                if (loggedUserId && verifiedUserId && loggedUserId !== verifiedUserId) {
                    // Verificou mas está logado com outra conta
                    setStatus('success-wrong-user')
                } else {
                    // Verificou com a conta correta (ou não está logado)
                    if (loggedUserId === verifiedUserId) {
                        // Invalida cache do status de email para o badge sumir
                        queryClient.invalidateQueries({ queryKey: ['email-verification-status'] })
                    }
                    setStatus('success')
                }
            })
            .catch((err) => {
                const msg = err?.response?.data?.message ?? 'Não foi possível verificar o e-mail.'
                setErrorMsg(msg)
                setStatus('error')
            })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogoutAndRelogin = async () => {
        await logout()
        navigate('/login', { state: { from: location }, replace: true })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">

                {status === 'loading' && (
                    <>
                        <div className="mx-auto mb-4 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                        <p className="text-gray-600 dark:text-gray-400">Verificando seu e-mail...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            E-mail verificado!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Seu endereço de e-mail foi confirmado com sucesso.
                        </p>
                        {user ? (
                            <button
                                onClick={() => navigate('/', { replace: true })}
                                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                            >
                                Ir para o início
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/login', { replace: true })}
                                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                            >
                                Fazer login
                            </button>
                        )}
                    </>
                )}

                {status === 'success-wrong-user' && (
                    <>
                        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <svg className="w-7 h-7 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            E-mail verificado em outra conta
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                            Este link pertencia a outra conta. Você está logado como:
                        </p>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-6">
                            {user?.email ?? user?.nome ?? 'usuário desconhecido'}
                        </p>
                        <button
                            onClick={handleLogoutAndRelogin}
                            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors mb-3"
                        >
                            Entrar na conta verificada
                        </button>
                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                        >
                            Continuar como estou
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Não foi possível verificar
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            {errorMsg}
                        </p>
                        <button
                            onClick={() => navigate(user ? '/config' : '/login', { replace: true })}
                            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold transition-colors"
                        >
                            {user ? 'Ir para Configurações' : 'Fazer login'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
