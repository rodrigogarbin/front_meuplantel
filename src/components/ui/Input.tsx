/**
 * Componente Input genérico com label e erro
 */

import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, error, hint, className = '', id, ...props },
    ref
) {
    const inputId = id || props.name

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={`
                    w-full px-3 py-2 border rounded-lg
                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                    bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    ${className}
                `}
                {...props}
            />
            {hint && !error && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    )
})
