/**
 * Página de Login
 * 
 * Mobile-first design com formulário de autenticação
 */

import { useState, FormEvent, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from './authStore'
import { AxiosError } from 'axios'
import { HCaptchaWrapper, type HCaptchaRef } from '@/components/HCaptcha'

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const login = useAuthStore((state) => state.login)
    const captchaRef = useRef<HCaptchaRef>(null)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)

    // Pega o redirect de onde o usuário veio
    const from = (location.state as { from?: Location })?.from?.pathname || '/'

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!captchaToken) {
            setError('Por favor, complete o captcha')
            return
        }

        setIsLoading(true)

        try {
            await login(username, password, captchaToken)
            navigate(from, { replace: true })
        } catch (err) {
            const axiosError = err as AxiosError<{ error?: string; message?: string }>

            // Reset captcha para permitir nova tentativa
            captchaRef.current?.resetCaptcha()
            setCaptchaToken(null)

            if (axiosError.response?.status === 401) {
                setError('Usuário ou senha inválidos')
            } else if (axiosError.response?.status === 422) {
                setError('Preencha todos os campos corretamente')
            } else if (axiosError.response?.status === 400) {
                setError('Captcha inválido. Tente novamente.')
            } else if (axiosError.message === 'Network Error') {
                setError('Sem conexão com o servidor')
            } else {
                setError('Erro ao fazer login. Tente novamente.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            {/* Decorative elements */}
            <div className="fixed w-96 h-96 -top-24 -right-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="fixed w-72 h-72 -bottom-12 -left-12 bg-white/5 rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/40">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">MeuPlantel</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Entre na sua conta para continuar</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm animate-fade-in">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Usuário
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input pl-11"
                                    placeholder="Digite seu usuário"
                                    required
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Senha
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-11 pr-11"
                                    placeholder="Digite sua senha"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* hCaptcha */}
                        <HCaptchaWrapper
                            ref={captchaRef}
                            onVerify={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(null)}
                            onError={() => setCaptchaToken(null)}
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !captchaToken}
                            className="w-full btn btn-primary py-3.5 text-base shadow-lg shadow-primary-500/30"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Entrando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Entrar</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center mt-6 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Não tem uma conta?{' '}
                            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                Cadastre-se
                            </Link>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Sistema de gerenciamento de aves
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
