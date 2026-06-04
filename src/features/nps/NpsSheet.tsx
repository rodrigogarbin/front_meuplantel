import { useState } from 'react'
import { useSubmitNps, snoozeNps } from './npsApi'

interface NpsSheetProps {
    onClose: () => void
}

const NOTE_COLORS: Record<number, string> = {
    0: 'bg-red-600 hover:bg-red-700 text-white',
    1: 'bg-red-500 hover:bg-red-600 text-white',
    2: 'bg-red-500 hover:bg-red-600 text-white',
    3: 'bg-orange-500 hover:bg-orange-600 text-white',
    4: 'bg-orange-500 hover:bg-orange-600 text-white',
    5: 'bg-amber-500 hover:bg-amber-600 text-white',
    6: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    7: 'bg-lime-500 hover:bg-lime-600 text-white',
    8: 'bg-green-500 hover:bg-green-600 text-white',
    9: 'bg-green-600 hover:bg-green-700 text-white',
    10: 'bg-green-700 hover:bg-green-800 text-white',
}

export function NpsSheet({ onClose }: NpsSheetProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 'error'>(1)
    const [nota, setNota] = useState<number | null>(null)
    const [sugestao, setSugestao] = useState('')
    const submitNps = useSubmitNps()

    function handleSelectNota(n: number) {
        setNota(n)
        setStep(2)
    }

    function handleSkip() {
        if (nota === null) return
        submit()
    }

    function handleSend() {
        if (nota === null) return
        submit()
    }

    function submit() {
        if (nota === null) return
        submitNps.mutate(
            { nota, sugestao: sugestao || undefined, origem: 'app' },
            {
                onSuccess: () => setStep(3),
                onError: () => setStep('error'),
            }
        )
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={step === 1 ? onClose : undefined}
            />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {/* Handle */}
                <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            Nos recomendaria?
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Numa escala de 0 a 10, o quanto voce recomendaria o MeuPlantel a outro criador?
                        </p>

                        {/* Botoes de nota */}
                        <div className="grid grid-cols-11 gap-1 mb-5">
                            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                                <button
                                    key={n}
                                    onClick={() => handleSelectNota(n)}
                                    className={`aspect-square rounded-lg text-sm font-bold transition-transform active:scale-95 ${NOTE_COLORS[n]}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        {/* Labels */}
                        <div className="flex justify-between mb-6">
                            <span className="text-xs text-gray-400">0 = Nunca</span>
                            <span className="text-xs text-gray-400">10 = Com certeza</span>
                        </div>

                        <button
                            onClick={() => { snoozeNps(3); onClose() }}
                            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-all active:scale-[0.98] hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Responder depois
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            O que poderiamos melhorar?
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Sua sugestao e opcional, mas muito valiosa.
                        </p>

                        <textarea
                            value={sugestao}
                            onChange={(e) => setSugestao(e.target.value)}
                            placeholder="Ex: seria legal ter relatorio mensal..."
                            rows={4}
                            maxLength={2000}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleSkip}
                                disabled={submitNps.isPending}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-all active:scale-[0.98] hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Pular
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={submitNps.isPending}
                                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {submitNps.isPending ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Obrigado pelo feedback!
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Sua opinião nos ajuda a melhorar o MeuPlantel.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Não foi possível enviar
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Tente novamente mais tarde.
                        </p>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold transition-colors mb-2"
                        >
                            Tentar novamente
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default NpsSheet
