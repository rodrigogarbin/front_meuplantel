/**
 * Componente Select genérico com label e erro
 */

import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectOption {
    value: string | number
    label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    hint?: string
    options: SelectOption[]
    placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { label, error, hint, options, placeholder, className = '', id, ...props },
    ref
) {
    const selectId = id || props.name

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                ref={ref}
                id={selectId}
                className={`
                    w-full px-3 py-2 border rounded-lg
                    text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    ${className}
                `}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {hint && !error && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    )
})
