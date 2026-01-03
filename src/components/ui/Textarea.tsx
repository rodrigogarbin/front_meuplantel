/**
 * Componente Textarea genérico com label e erro
 */

import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { label, error, hint, className = '', id, ...props },
    ref
) {
    const textareaId = id || props.name

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                id={textareaId}
                className={`
                    w-full px-3 py-2 border rounded-lg
                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                    bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    resize-none
                    ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    ${className}
                `}
                rows={3}
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
