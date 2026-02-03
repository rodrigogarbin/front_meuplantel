/**
 * Empty State Onboarding
 * Componente especial para guiar usuários novos sem dados cadastrados
 */

interface EmptyStateOnboardingProps {
    title: string
    description: string
    actionLabel: string
    onAction: () => void
    steps?: string[]
}

export function EmptyStateOnboarding({
    title,
    description,
    actionLabel,
    onAction,
    steps
}: EmptyStateOnboardingProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Ícone decorativo */}
            <div className="mb-6 relative">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-3xl flex items-center justify-center transform rotate-3 shadow-lg">
                    <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400 -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 5.4 8 6.6 8 8c0 1.4.4 2.6 1 3.5.3.4.6.8 1 1.1V15l-2 2v2h8v-2l-2-2v-2.4c.4-.3.7-.7 1-1.1.6-.9 1-2.1 1-3.5 0-1.4-.4-2.6-1-3.5-.6-.9-1.8-1.5-3-1.5z" />
                    </svg>
                </div>
                {/* Detalhe de destaque */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {title}
            </h2>

            {/* Descrição */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                {description}
            </p>

            {/* Steps (se fornecidos) */}
            {steps && steps.length > 0 && (
                <div className="mb-8 w-full max-w-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 space-y-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                            Como começar:
                        </p>
                        {steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {index + 1}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 text-left pt-0.5">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Botão de ação principal */}
            <button
                onClick={onAction}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {actionLabel}
            </button>

            {/* Hint opcional */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                Você pode cadastrar quantos pássaros quiser
            </p>
        </div>
    )
}
