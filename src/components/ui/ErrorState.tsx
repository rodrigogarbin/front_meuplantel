/**
 * Componente ErrorState
 * Exibido quando ocorre um erro
 */

interface ErrorStateProps {
    title?: string
    message?: string
    onRetry?: () => void
}

export function ErrorState({
    title = 'Algo deu errado',
    message = 'Não foi possível carregar os dados.',
    onRetry
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn btn-primary"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Tentar novamente
                </button>
            )}
        </div>
    )
}
