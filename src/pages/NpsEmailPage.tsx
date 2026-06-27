import { useState, useEffect } from 'react'
import { useSubmitNps } from '@/features/nps/npsApi'

type Step = 'rating' | 'suggestion' | 'thanks' | 'error'

const NOTE_COLORS: Record<number, string> = {
    0: '#dc2626', 1: '#dc2626', 2: '#ef4444',
    3: '#f97316', 4: '#f97316', 5: '#f59e0b',
    6: '#eab308', 7: '#84cc16', 8: '#22c55e',
    9: '#16a34a', 10: '#15803d',
}

export function NpsEmailPage() {
    const params = new URLSearchParams(window.location.search)
    const uid = params.get('uid')
    const token = params.get('token')
    const notaParam = params.get('nota')

    const [step, setStep] = useState<Step>('rating')
    const [nota, setNota] = useState<number | null>(notaParam !== null ? parseInt(notaParam, 10) : null)
    const [sugestao, setSugestao] = useState('')
    const submitNps = useSubmitNps()

    const linkInvalido = !uid || !token

    const isCritico = nota !== null && nota <= 7
    const sugestaoObrigatoria = isCritico && sugestao.trim() === ''

    // Se nota pre-selecionada na URL, pula direto para sugestao
    useEffect(() => {
        if (nota !== null && !isNaN(nota) && nota >= 0 && nota <= 10) {
            setStep('suggestion')
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    function handleSelectNota(n: number) {
        setNota(n)
        setStep('suggestion')
    }

    function handleSubmit(skipSugestao = false) {
        if (nota === null || linkInvalido) return
        submitNps.mutate(
            {
                nota,
                sugestao: skipSugestao ? undefined : (sugestao || undefined),
                origem: 'email',
                uid: parseInt(uid!, 10),
                token: token!,
            },
            {
                onSuccess: () => setStep('thanks'),
                onError: () => setStep('error'),
            }
        )
    }

    if (linkInvalido) {
        return (
            <PageShell>
                <ErrorDisplay message="Link invalido. Verifique se copiou o link completo do email." />
            </PageShell>
        )
    }

    return (
        <PageShell>
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-green-600 mb-1">MeuPlantel</h1>
                <p className="text-sm text-gray-500">Gestao do seu plantel</p>
            </div>

            {step === 'rating' && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Nos recomendaria?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Numa escala de 0 a 10, o quanto voce recomendaria o MeuPlantel a outro criador de passaros?
                    </p>

                    <div className="grid grid-cols-11 gap-1.5 mb-3">
                        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                            <button
                                key={n}
                                onClick={() => handleSelectNota(n)}
                                style={{ backgroundColor: NOTE_COLORS[n] }}
                                className="aspect-square rounded-lg text-sm font-bold text-white transition-transform active:scale-95 hover:opacity-90"
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-400">0 = Nunca</span>
                        <span className="text-xs text-gray-400">10 = Com certeza</span>
                    </div>
                </div>
            )}

            {step === 'suggestion' && (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                            style={{ backgroundColor: nota !== null ? NOTE_COLORS[nota] : '#6b7280' }}
                        >
                            {nota}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Nota selecionada: {nota}</p>
                            <p className="text-sm text-gray-500">Obrigado!</p>
                        </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {isCritico ? (
                            <>
                                O que podemos melhorar?{' '}
                                <span className="text-red-500">*</span>
                            </>
                        ) : (
                            'Alguma sugestao? (opcional)'
                        )}
                    </h2>

                    <textarea
                        value={sugestao}
                        onChange={(e) => setSugestao(e.target.value)}
                        placeholder={
                            isCritico
                                ? 'Conte-nos o que podemos fazer melhor... (obrigatorio)'
                                : 'Alguma sugestao ou comentario? (opcional)'
                        }
                        rows={4}
                        maxLength={2000}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />

                    <div className="flex gap-3">
                        {!isCritico && (
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={submitNps.isPending}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Pular
                            </button>
                        )}
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitNps.isPending || sugestaoObrigatoria}
                            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {submitNps.isPending ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'thanks' && (
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-9 h-9 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Obrigado pelo feedback!
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Sua opiniao nos ajuda a melhorar o MeuPlantel cada vez mais.
                    </p>
                    <a
                        href="https://app2.meuplantel.com"
                        className="inline-block py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                        Abrir o MeuPlantel
                    </a>
                </div>
            )}

            {step === 'error' && (
                <ErrorDisplay message="Nao foi possivel registrar seu feedback. Tente novamente ou acesse o app." />
            )}
        </PageShell>
    )
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 max-w-md w-full">
                {children}
            </div>
        </div>
    )
}

function ErrorDisplay({ message }: { message: string }) {
    return (
        <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Algo deu errado</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    )
}

export default NpsEmailPage
