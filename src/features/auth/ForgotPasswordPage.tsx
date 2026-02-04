/**
 * Página de Recuperação de Senha
 * 
 * Fluxo em 3 etapas:
 * 1. Solicitar código (email)
 * 2. Verificar código
 * 3. Redefinir senha
 */

import { useState, FormEvent, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Turnstile, type TurnstileRef } from '@/components/Turnstile'
import api from '@/lib/api'
import { AxiosError } from 'axios'
import { BirdLogo } from '@/components/BirdLogo'
import { useEffectiveTheme } from '@/lib/theme'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || '1x00000000000000000000AA'

type Step = 'email' | 'code' | 'password'

export function ForgotPasswordPage() {
    const navigate = useNavigate()
    const turnstileRef = useRef<TurnstileRef>(null)
    const currentTheme = useEffectiveTheme()

    // Estado geral
    const [step, setStep] = useState<Step>('email')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Dados do formulário
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)

    // Etapa 1: Solicitar código
    const handleRequestCode = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!captchaToken) {
            setError('Por favor, complete o captcha')
            return
        }

        setIsLoading(true)

        try {
            await api.post('/api/v1/password/forgot', {
                email,
                captcha_token: captchaToken
            })
            setSuccess('Se o email existir, você receberá um código de 6 dígitos.')
            setStep('code')
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>
            turnstileRef.current?.reset()
            setCaptchaToken(null)

            if (axiosError.response?.status === 429) {
                setError('Muitas tentativas. Aguarde alguns minutos.')
            } else if (axiosError.response?.status === 422) {
                setError('Email inválido.')
            } else {
                setError('Erro ao solicitar código. Tente novamente.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Etapa 2: Verificar código
    const handleVerifyCode = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (code.length !== 6) {
            setError('O código deve ter 6 dígitos')
            return
        }

        setIsLoading(true)

        try {
            const response = await api.post('/api/v1/password/verify-code', {
                email,
                code,
            })
            setResetToken(response.data.reset_token)
            setSuccess('Código verificado! Agora defina sua nova senha.')
            setStep('password')
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>
            setError(axiosError.response?.data?.message || 'Código inválido ou expirado.')
        } finally {
            setIsLoading(false)
        }
    }

    // Etapa 3: Redefinir senha
    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres')
            return
        }

        if (password !== passwordConfirmation) {
            setError('As senhas não conferem')
            return
        }

        setIsLoading(true)

        try {
            await api.post('/api/v1/password/reset', {
                email,
                reset_token: resetToken,
                senha: password,
                senha_confirmation: passwordConfirmation,
            })
            setSuccess('Senha alterada com sucesso!')
            // Redireciona para login após 2 segundos
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>
            setError(axiosError.response?.data?.message || 'Erro ao redefinir senha.')
        } finally {
            setIsLoading(false)
        }
    }

    // Voltar ao início
    const handleBack = () => {
        if (step === 'code') {
            setStep('email')
            setCode('')
            setSuccess(null)
        } else if (step === 'password') {
            setStep('code')
            setPassword('')
            setPasswordConfirmation('')
            setSuccess(null)
        }
    }

    // Reenviar código
    const handleResendCode = async () => {
        setError(null)
        setIsLoading(true)

        try {
            await api.post('/api/v1/password/forgot', { email })
            setSuccess('Novo código enviado!')
        } catch {
            setError('Erro ao reenviar código.')
        } finally {
            setIsLoading(false)
        }
    }

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
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {step === 'email' && 'Recuperar Senha'}
                            {step === 'code' && 'Verificar Código'}
                            {step === 'password' && 'Nova Senha'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {step === 'email' && 'Digite seu email para receber o código'}
                            {step === 'code' && 'Digite o código de 6 dígitos enviado'}
                            {step === 'password' && 'Defina sua nova senha'}
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {['email', 'code', 'password'].map((s, i) => (
                            <div
                                key={s}
                                className={`h-2 rounded-full transition-all ${s === step
                                    ? 'w-8 bg-primary-500'
                                    : i < ['email', 'code', 'password'].indexOf(step)
                                        ? 'w-4 bg-primary-300'
                                        : 'w-4 bg-gray-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Success Alert */}
                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm animate-fade-in">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm animate-fade-in">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Email */}
                    {step === 'email' && (
                        <form onSubmit={handleRequestCode} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input pl-11"
                                        placeholder="seu@email.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Turnstile */}
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={TURNSTILE_SITEKEY}
                                onVerify={(token: string) => setCaptchaToken(token)}
                                onExpire={() => setCaptchaToken(null)}
                                onError={() => setCaptchaToken(null)}
                                theme={currentTheme}
                            />

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
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Enviar Código</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Code verification */}
                    {step === 'code' && (
                        <form onSubmit={handleVerifyCode} className="space-y-5">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Código de Verificação
                                </label>
                                <div className="relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    <input
                                        type="text"
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="input pl-11 text-center text-2xl tracking-[0.5em] font-mono"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Verifique sua caixa de entrada e spam
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 btn btn-secondary py-3"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <span>Voltar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || code.length !== 6}
                                    className="flex-1 btn btn-primary py-3"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <>
                                            <span>Verificar</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isLoading}
                                className="w-full text-sm text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                Não recebeu? Reenviar código
                            </button>
                        </form>
                    )}

                    {/* Step 3: New password */}
                    {step === 'password' && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nova Senha
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
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                        required
                                        autoFocus
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

                            <div>
                                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Confirmar Nova Senha
                                </label>
                                <div className="relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="passwordConfirmation"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className="input pl-11"
                                        placeholder="Repita a nova senha"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || password.length < 6 || password !== passwordConfirmation}
                                className="w-full btn btn-primary py-3.5 text-base shadow-lg shadow-primary-500/30"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Redefinir Senha</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-6">
                        <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                            ← Voltar para o login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
