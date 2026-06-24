/**
 * Componente SegmentedControl para seleção de opções (ex: Sexo)
 */

interface SegmentOption {
    value: string | number
    label: string
}

interface SegmentedControlProps {
    label?: string
    options: SegmentOption[]
    value: string | number | null
    onChange: (value: string | number) => void
    error?: string
    required?: boolean
    disabled?: boolean
}

export function SegmentedControl({
    label,
    options,
    value,
    onChange,
    error,
    required,
    disabled,
}: SegmentedControlProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className={`flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden ${disabled ? 'opacity-50' : ''}`}>
                {options.map((option, index) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => !disabled && onChange(option.value)}
                        disabled={disabled}
                        className={`
                            flex-1 px-4 py-2 text-sm font-medium transition-colors
                            ${index > 0 ? 'border-l border-gray-300 dark:border-gray-600' : ''}
                            ${value === option.value
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }
                            ${disabled ? 'cursor-not-allowed' : ''}
                        `}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    )
}
