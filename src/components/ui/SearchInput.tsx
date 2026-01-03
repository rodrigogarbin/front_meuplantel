/**
 * Componente SearchInput
 * Campo de busca com ícone e botão de limpar
 */

import { useRef } from 'react'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleClear = () => {
        onChange('')
        inputRef.current?.focus()
    }

    return (
        <div className="relative">
            <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-2 border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900"
            />

            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    )
}
