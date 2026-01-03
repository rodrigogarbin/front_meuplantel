/**
 * Componente EmptyState
 * Exibido quando não há dados para mostrar
 */

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn btn-primary mt-4"
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}
