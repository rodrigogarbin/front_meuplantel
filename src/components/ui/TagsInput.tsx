/**
 * Componente TagsInput para entrada de múltiplas tags (ex: Portadores)
 */

import { useState, type KeyboardEvent } from 'react'

interface TagsInputProps {
    label?: string
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
}

export function TagsInput({
    label,
    value,
    onChange,
    placeholder = 'Digite e pressione Enter',
    error,
    hint,
    disabled,
}: TagsInputProps) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            removeTag(value.length - 1)
        }
    }

    const addTag = () => {
        if (disabled) return
        const tag = inputValue.trim()
        if (tag && !value.includes(tag)) {
            onChange([...value, tag])
            setInputValue('')
        }
    }

    const removeTag = (index: number) => {
        if (disabled) return
        onChange(value.filter((_, i) => i !== index))
    }

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <div
                className={`
                    flex flex-wrap gap-2 p-2 min-h-[42px] border rounded-lg
                    bg-white dark:bg-gray-700
                    focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary
                    ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {value.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                    >
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="hover:text-red-500 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    disabled={disabled}
                    onChange={(e) => !disabled && setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:cursor-not-allowed"
                />
            </div>
            {hint && !error && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    )
}
