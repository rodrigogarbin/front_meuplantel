/**
 * Página de Login
 *
 * Mobile-first design com formulário de autenticação.
 * Captcha Turnstile é exibido apenas em modo step-up (quando a API sinaliza suspeita).
 */

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from './authStore'
import { AxiosError } from 'axios'
import { Turnstile, type TurnstileRef } from '@/components/Turnstile'
import { BirdLogo } from '@/components/BirdLogo'
import { useEffectiveTheme } from '@/lib/theme'
// import { SocialLoginButtons } from './SocialLoginButtons'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || '1x00000000000000000000AA'

/** Shape dos erros retornados pela API de login */
interface LoginErrorResponse {
    message?: string
    require_captcha?: boolean
    retry_after?: number
}

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const login = useAuthStore((state) => state.login)
    const turnstileRef = useRef<TurnstileRef>(null)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)

    // Estado de captcha step-up
    const [requiresCaptcha, setRequiresCaptcha] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)

    // Countdown de bloqueio temporário
    const [countdown, setCountdown] = useState(0)

    const currentTheme = useEffectiveTheme()
    const fromLocation = (location.state as { from?: Location })?.from
    const from = fromLocation
        ? (fromLocation.pathname || '/') + (fromLocation.search || '')
        : '/'

    // Inicia countdown quando retry_after é recebido
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [countdown])

    // Exibe erro de autenticação social vindo por query param
    useEffect(() => {
        const socialError = searchParams.get('social_error')
        if (socialError) {
            setError(socialError)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        // Se captcha step-up ativo mas ainda não preenchido, aguarda
        if (requiresCaptcha && !captchaToken) {
            setError('Por favor, complete o desafio de segurança antes de continuar.')
            return
        }

        setIsLoading(true)

        try {
            await login(username, password, captchaToken ?? undefined, rememberMe)
            navigate(from, { replace: true })
        } catch (err) {
            const axiosError = err as AxiosError<LoginErrorResponse>
            const status     = axiosError.response?.status
            const data       = axiosError.response?.data

            // Sempre reseta o widget de captcha após erro (token foi consumido ou é inválido)
            if (captchaToken) {
                turnstileRef.current?.reset()
                setCaptchaToken(null)
            }

            if (status === 429) {
                const retryAfter = data?.retry_after ?? 0

                if (retryAfter > 0) {
                    // Hard block: exibe countdown e desabilita botão
                    setCountdown(retryAfter)
                    setError(
                        `Acesso temporariamente bloqueado. Tente novamente em ${retryAfter} segundos.`
                    )
                } else if (data?.require_captcha) {
                    // Step-up: exibe widget Turnstile
                    setRequiresCaptcha(true)
                    setError('Muitas tentativas. Confirme que você não é um robô.')
                } else {
                    setError('Muitas tentativas. Tente novamente em breve.')
                }
            } else if (status === 400) {
                // Captcha inválido — mantém widget visível para nova tentativa
                setRequiresCaptcha(true)
                setError('Captcha inválido. Tente novamente.')
            } else if (status === 401) {
                setError('Usuário ou senha inválidos')
            } else if (status === 422) {
                setError('Preencha todos os campos corretamente')
            } else if (axiosError.message === 'Network Error') {
                setError('Sem conexão com o servidor')
            } else {
                setError('Erro ao fazer login. Tente novamente.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const isSubmitDisabled = isLoading || (requiresCaptcha && !captchaToken) || countdown > 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4 safe-top safe-bottom">
            {/* Decorative elements */}
            <div className="fixed w-96 h-96 -top-24 -right-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="fixed w-72 h-72 -bottom-12 -left-12 bg-white/5 rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <BirdLogo size="lg" />
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

                        {/* Remember Me */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors">
                                Manter-me conectado neste dispositivo
                            </span>
                        </label>

                        {/* Step-up Captcha — exibido somente quando a API sinaliza suspeita */}
                        {requiresCaptcha && (
                            <div className="animate-fade-in">
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Complete o desafio de segurança para continuar
                                </p>
                                <Turnstile
                                    ref={turnstileRef}
                                    siteKey={TURNSTILE_SITEKEY}
                                    onVerify={(token) => setCaptchaToken(token)}
                                    onExpire={() => setCaptchaToken(null)}
                                    onError={() => setCaptchaToken(null)}
                                    theme={currentTheme}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="w-full btn btn-primary py-3.5 text-base shadow-lg shadow-primary-500/30 mt-1"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Entrando...</span>
                                </>
                            ) : countdown > 0 ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Aguarde {countdown}s</span>
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

                    {/* <SocialLoginButtons /> */}

                    {/* Footer */}
                    <div className="text-center mt-6 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            <Link to="/forgot-password" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                Esqueci minha senha
                            </Link>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Não tem uma conta?{' '}
                            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                Cadastre-se
                            </Link>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            <Link to="https://app.meuplantel.com" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                Ir para a versão antiga
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
