/**
 * Página de Solicitação/Verificação de E-mail
 *
 * Suporta dois fluxos:
 *
 * FLUXO ANTIGO (needs_email=true) — usuário sem e-mail cadastrado
 *   Step 'request' → digita e-mail → step 'verify' → código → step 'success'
 *   Hooks: useRequestEmailVerification, useVerifyEmailCode, useResendEmailVerification
 *
 * FLUXO NOVO (!needs_email && !email_verified) — usuário com e-mail mas não verificado
 *   Pula step 'request', vai direto para step 'verify' com e-mail já preenchido
 *   Hooks: useVerificarEmailCodigo, useReenviarEmailVerificacao
 *   Não exibe "Usar outro e-mail"
 *
 * Query params:
 *   ?blocked=1        → grace period expirou, não permite fechar
 *   ?email_verificado=1 → usuário clicou no link do e-mail, exibe step 'success' direto
 *   ?alterar=true     → alterar e-mail (fluxo antigo)
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    useEmailVerificationStatus,
    useRequestEmailVerification,
    useVerifyEmailCode,
    useResendEmailVerification,
    useVerificarEmailCodigo,
    useReenviarEmailVerificacao,
} from './userApi'
import { BirdLogo } from '@/components/BirdLogo'

function EmailIcon() {
    return (
        <svg className="w-16 h-16 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg className="w-16 h-16 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

type Step = 'request' | 'verify' | 'success'

export function EmailVerificationPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isChangingEmail = searchParams.get('alterar') === 'true'
    const isBlocked = searchParams.get('blocked') === '1'
    const emailVerificado = searchParams.get('email_verificado') === '1'

    const [step, setStep] = useState<Step>(emailVerificado ? 'success' : 'request')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [canResend, setCanResend] = useState(false)
    const [resendCountdown, setResendCountdown] = useState(0)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const { data: status, isLoading: isLoadingStatus } = useEmailVerificationStatus()

    // Fluxo antigo
    const requestMutation = useRequestEmailVerification()
    const verifyMutation = useVerifyEmailCode()
    const resendMutation = useResendEmailVerification()

    // Fluxo novo
    const verificarCodigoMutation = useVerificarEmailCodigo()
    const reenviarMutation = useReenviarEmailVerificacao()

    // Determina qual fluxo usar
    // needs_email=true → fluxo antigo (sem e-mail cadastrado)
    // !needs_email && !email_verified → fluxo novo (e-mail cadastrado mas não verificado)
    const isNovoFluxo = status !== undefined && !status.needs_email && !status.email_verified

    // Inicializa estado ao carregar status
    useEffect(() => {
        if (!status || emailVerificado) return

        if (status.pending_email) {
            // Verificação pendente do fluxo antigo
            setEmail(status.pending_email)
            setStep('verify')
        } else if (isNovoFluxo && status.email) {
            // Fluxo novo: pula direto para verify com e-mail preenchido
            setEmail(status.email)
            setStep('verify')
            // Inicia countdown para reenvio
            setResendCountdown(0)
            setCanResend(true)
        } else if (status.email && !status.needs_email && status.email_verified && !isChangingEmail) {
            // Já verificado — redireciona (exceto se está bloqueado por outro motivo)
            if (!isBlocked) {
                navigate('/', { replace: true })
            }
        }
    }, [status, navigate, isChangingEmail, isBlocked, isNovoFluxo, emailVerificado])

    // Countdown para reenvio
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (resendCountdown === 0 && step === 'verify') {
            setCanResend(true)
        }
    }, [resendCountdown, step])

    // Handler para solicitar verificação (fluxo antigo)
    const handleRequestVerification = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) {
            setError('Informe um e-mail válido')
            return
        }

        try {
            await requestMutation.mutateAsync(email)
            setStep('verify')
            setResendCountdown(120)
            setCanResend(false)
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } }
            setError(axiosErr.response?.data?.message || 'Erro ao enviar código. Tente novamente.')
        }
    }

    // Handler para input do código
    const handleCodeChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1)
        const newCode = [...code]
        newCode[index] = digit
        setCode(newCode)
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    // Handler para teclas no código
    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    // Handler para colar código
    const handleCodePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pastedData.length === 6) {
            setCode(pastedData.split(''))
            inputRefs.current[5]?.focus()
        }
    }

    // Handler para verificar código — usa o hook certo para cada fluxo
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const fullCode = code.join('')
        if (fullCode.length !== 6) {
            setError('Digite o código completo de 6 dígitos')
            return
        }

        try {
            if (isNovoFluxo) {
                await verificarCodigoMutation.mutateAsync(fullCode)
            } else {
                await verifyMutation.mutateAsync(fullCode)
            }
            setStep('success')
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } }
            setError(axiosErr.response?.data?.message || 'Código inválido. Tente novamente.')
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        }
    }

    // Handler para reenviar código — usa o hook certo para cada fluxo
    const handleResend = async () => {
        setError('')
        try {
            if (isNovoFluxo) {
                await reenviarMutation.mutateAsync()
            } else {
                await resendMutation.mutateAsync()
            }
            setResendCountdown(120)
            setCanResend(false)
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } }
            setError(axiosErr.response?.data?.message || 'Erro ao reenviar. Tente novamente.')
        }
    }

    const handleContinue = () => {
        if (isChangingEmail) {
            navigate('/config/perfil', { replace: true })
        } else {
            navigate('/', { replace: true })
        }
    }

    const handleBack = () => {
        setStep('request')
        setCode(['', '', '', '', '', ''])
        setError('')
    }

    const isVerifying = verifyMutation.isPending || verificarCodigoMutation.isPending
    const isResending = resendMutation.isPending || reenviarMutation.isPending

    if (isLoadingStatus) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center safe-top safe-bottom">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
            {/* Decorative elements */}
            <div className="fixed w-96 h-96 -top-24 -right-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="fixed w-72 h-72 -bottom-12 -left-12 bg-white/5 rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <BirdLogo size="lg" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-100">MeuPlantel</h1>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    {/* Step: Solicitar Email (apenas fluxo antigo com needs_email=true) */}
                    {step === 'request' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="flex justify-center mb-4">
                                    <EmailIcon />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {isChangingEmail ? 'Alterar E-mail' : 'Cadastre seu E-mail'}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {isChangingEmail
                                        ? 'Informe o novo e-mail. Você receberá um código de verificação.'
                                        : 'Para continuar usando o MeuPlantel, precisamos que você cadastre e confirme seu e-mail.'
                                    }
                                </p>
                                {isChangingEmail && status?.email && (
                                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                                        E-mail atual: {status.email}
                                    </p>
                                )}
                            </div>

                            <form onSubmit={handleRequestVerification} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isChangingEmail ? 'Novo E-mail' : 'E-mail'}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                        placeholder="seu@email.com"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={requestMutation.isPending}
                                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {requestMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar Código de Verificação'
                                    )}
                                </button>

                                {/* Botão "Validar depois" apenas quando não está bloqueado */}
                                {!isBlocked ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate(isChangingEmail ? '/config/perfil' : '/', { replace: true })}
                                        className="w-full py-3 px-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium rounded-xl transition-colors"
                                    >
                                        {isChangingEmail ? 'Cancelar' : 'Validar depois'}
                                    </button>
                                ) : (
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                                        Verifique seu e-mail para continuar usando o MeuPlantel.
                                    </p>
                                )}
                            </form>
                        </>
                    )}

                    {/* Step: Verificar Código */}
                    {step === 'verify' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="flex justify-center mb-4">
                                    <EmailIcon />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Verifique seu E-mail
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Enviamos um código de 6 dígitos para:
                                </p>
                                <p className="text-primary-500 dark:text-primary-400 font-medium mt-1">
                                    {email}
                                </p>
                            </div>

                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                                        Digite o código
                                    </label>
                                    <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                                        {code.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => { inputRefs.current[index] = el }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isVerifying || code.join('').length !== 6}
                                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isVerifying ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                            Verificando...
                                        </>
                                    ) : (
                                        'Verificar Código'
                                    )}
                                </button>

                                <div className="text-center space-y-2">
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={isResending}
                                            className="text-primary-500 dark:text-primary-400 hover:underline text-sm font-medium"
                                        >
                                            {isResending ? 'Reenviando...' : 'Reenviar código'}
                                        </button>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            Reenviar código em {Math.floor(resendCountdown / 60)}:{String(resendCountdown % 60).padStart(2, '0')}
                                        </p>
                                    )}

                                    {/* "Usar outro e-mail" apenas no fluxo antigo e quando não está bloqueado */}
                                    {!isNovoFluxo && !isBlocked && (
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                                        >
                                            Usar outro e-mail
                                        </button>
                                    )}

                                    {/* Mensagem informativa quando está bloqueado */}
                                    {isBlocked && (
                                        <p className="text-sm text-amber-600 dark:text-amber-400">
                                            Verifique seu e-mail para continuar usando o MeuPlantel.
                                        </p>
                                    )}
                                </div>
                            </form>
                        </>
                    )}

                    {/* Step: Sucesso */}
                    {step === 'success' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="flex justify-center mb-4">
                                    <CheckIcon />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {isChangingEmail ? 'E-mail Alterado!' : 'E-mail Verificado!'}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {isChangingEmail
                                        ? 'Seu e-mail foi alterado e verificado com sucesso.'
                                        : 'Seu e-mail foi verificado com sucesso. Agora você pode continuar usando o MeuPlantel.'}
                                </p>
                            </div>

                            <button
                                onClick={handleContinue}
                                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                            >
                                {isChangingEmail ? 'Voltar ao Perfil' : 'Continuar'}
                            </button>
                        </>
                    )}
                </div>

                {/* Info */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    Verificamos seu e-mail para garantir a segurança da sua conta.
                </p>
            </div>
        </div>
    )
}
