/**
 * Página de Registro
 * 
 * Mobile-first design com formulário de cadastro de novo usuário
 */

import { useState, FormEvent, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios, { AxiosError } from 'axios'
import { API_BASE_URL } from '@/lib/api'
import { Turnstile, type TurnstileRef } from '@/components/Turnstile'
import { BirdLogo } from '@/components/BirdLogo'
import { useEffectiveTheme } from '@/lib/theme'
// import { SocialLoginButtons } from './SocialLoginButtons'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || '1x00000000000000000000AA'

interface RegisterForm {
    nome: string
    email: string
    senha: string
    senha_confirmation: string
    sg_clube: string
    nro_criador: string
}

interface ValidationErrors {
    [key: string]: string[]
}

export function RegisterPage() {
    const turnstileRef = useRef<TurnstileRef>(null)
    const currentTheme = useEffectiveTheme()
    const [formData, setFormData] = useState<RegisterForm>({
        nome: '',
        email: '',
        senha: '',
        senha_confirmation: '',
        sg_clube: '',
        nro_criador: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const updateField = (field: keyof RegisterForm, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Limpa erro do campo ao editar
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setFieldErrors({})

        if (!termsAccepted) {
            setError('Voce precisa aceitar os Termos de Uso e a Politica de Privacidade para continuar.')
            return
        }

        if (!captchaToken) {
            setError('Por favor, complete o captcha')
            return
        }

        setIsLoading(true)

        try {
            await axios.post(`${API_BASE_URL}/api/v1/register`, {
                ...formData,
                captcha_token: captchaToken
            })
            setSuccess(true)
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: ValidationErrors | string }>

            // Reset captcha para permitir nova tentativa
            turnstileRef.current?.reset()
            setCaptchaToken(null)

            if (axiosError.response?.status === 400) {
                const message = axiosError.response.data?.message
                if (typeof message === 'object') {
                    setFieldErrors(message)
                } else if (message === 'Captcha inválido') {
                    setError('Captcha inválido. Tente novamente.')
                } else {
                    setError(message || 'Erro de validação')
                }
            } else if (axiosError.message === 'Network Error') {
                setError('Sem conexão com o servidor')
            } else {
                setError('Erro ao criar conta. Tente novamente.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const getFieldError = (field: string): string | undefined => {
        return fieldErrors[field]?.[0]
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="fixed w-96 h-96 -top-24 -right-24 bg-white/5 rounded-full pointer-events-none" />
                <div className="fixed w-72 h-72 -bottom-12 -left-12 bg-white/5 rounded-full pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/40">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Conta Criada!</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Sua conta foi criada com sucesso. Agora você pode fazer login.
                        </p>
                        <Link
                            to="/login"
                            className="w-full btn btn-primary py-3.5 text-base shadow-lg shadow-primary-500/30 inline-flex items-center justify-center gap-2"
                        >
                            <span>Ir para Login</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4 safe-top safe-bottom">
            {/* Decorative elements */}
            <div className="fixed w-96 h-96 -top-24 -right-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="fixed w-72 h-72 -bottom-12 -left-12 bg-white/5 rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <BirdLogo size="lg" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Criar Conta</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Preencha os dados para se cadastrar</p>
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nome */}
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nome Completo
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input
                                    type="text"
                                    id="nome"
                                    value={formData.nome}
                                    onChange={(e) => updateField('nome', e.target.value)}
                                    className={`input pl-11 ${getFieldError('nome') ? 'border-red-500 dark:border-red-500' : ''}`}
                                    placeholder="Seu nome completo"
                                    required
                                    autoFocus
                                />
                            </div>
                            {getFieldError('nome') && (
                                <p className="mt-1 text-sm text-red-500">{getFieldError('nome')}</p>
                            )}
                        </div>

                        {/* Email */}
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
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className={`input pl-11 ${getFieldError('email') ? 'border-red-500 dark:border-red-500' : ''}`}
                                    placeholder="seu@email.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            {getFieldError('email') && (
                                <p className="mt-1 text-sm text-red-500">{getFieldError('email')}</p>
                            )}
                        </div>

                        {/* Sigla do Clube e Número do Criador */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="sg_clube" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Sigla Clube / Criador
                                </label>
                                <input
                                    type="text"
                                    id="sg_clube"
                                    value={formData.sg_clube}
                                    onChange={(e) => updateField('sg_clube', e.target.value.toUpperCase())}
                                    className={`input ${getFieldError('sg_clube') ? 'border-red-500 dark:border-red-500' : ''}`}
                                    placeholder="Ex: SOB"
                                    required
                                    maxLength={10}
                                />
                                {getFieldError('sg_clube') && (
                                    <p className="mt-1 text-sm text-red-500">{getFieldError('sg_clube')}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="nro_criador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nº Criador / CTF
                                </label>
                                <input
                                    type="text"
                                    id="nro_criador"
                                    value={formData.nro_criador}
                                    onChange={(e) => updateField('nro_criador', e.target.value)}
                                    className={`input ${getFieldError('nro_criador') ? 'border-red-500 dark:border-red-500' : ''}`}
                                    placeholder="Ex: 1234"
                                    required
                                />
                                {getFieldError('nro_criador') && (
                                    <p className="mt-1 text-sm text-red-500">{getFieldError('nro_criador')}</p>
                                )}
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Senha
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="senha"
                                    value={formData.senha}
                                    onChange={(e) => updateField('senha', e.target.value)}
                                    className={`input pl-11 pr-11 ${getFieldError('senha') ? 'border-red-500 dark:border-red-500' : ''}`}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
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
                            {getFieldError('senha') && (
                                <p className="mt-1 text-sm text-red-500">{getFieldError('senha')}</p>
                            )}
                        </div>

                        {/* Confirmar Senha */}
                        <div>
                            <label htmlFor="senha_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="senha_confirmation"
                                    value={formData.senha_confirmation}
                                    onChange={(e) => updateField('senha_confirmation', e.target.value)}
                                    className={`input pl-11 pr-11 ${getFieldError('senha_confirmation') ? 'border-red-500 dark:border-red-500' : ''}`}
                                    placeholder="Repita a senha"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showConfirmPassword ? (
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
                            {getFieldError('senha_confirmation') && (
                                <p className="mt-1 text-sm text-red-500">{getFieldError('senha_confirmation')}</p>
                            )}
                            {formData.senha && formData.senha_confirmation && formData.senha !== formData.senha_confirmation && (
                                <p className="mt-1 text-sm text-red-500">As senhas não conferem</p>
                            )}
                        </div>

                        {/* Aceite dos Termos */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Li e aceito os{' '}
                                <Link to="/termos" target="_blank" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                    Termos de Uso
                                </Link>
                                {' '}e a{' '}
                                <Link to="/privacidade" target="_blank" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                    Politica de Privacidade
                                </Link>
                            </span>
                        </label>

                        {/* Turnstile */}
                        <Turnstile
                            ref={turnstileRef}
                            siteKey={TURNSTILE_SITEKEY}
                            onVerify={(token: string) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(null)}
                            onError={() => setCaptchaToken(null)}
                            theme={currentTheme}
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !captchaToken || !termsAccepted || (formData.senha !== formData.senha_confirmation && formData.senha_confirmation.length > 0)}
                            className="w-full btn btn-primary py-3.5 text-base shadow-lg shadow-primary-500/30 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Criando conta...</span>
                                </>
                            ) : (
                                <>
                                    <span>Criar Conta</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* <SocialLoginButtons /> */}

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
