/**
 * MultiSelectCheckbox
 * Dropdown com checkboxes para seleção múltipla
 */

import { useState, useRef, useEffect } from 'react'

function ChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    )
}

interface Option {
    id: number
    label: string
    description?: string
}

interface MultiSelectCheckboxProps {
    label?: string
    options: Option[]
    value: number[] // IDs selecionados
    onChange: (selected: number[]) => void
    placeholder?: string
    error?: string
    hint?: string
    maxHeight?: string
}

export function MultiSelectCheckbox({
    label,
    options,
    value,
    onChange,
    placeholder = 'Selecione',
    error,
    hint,
    maxHeight = '300px',
}: MultiSelectCheckboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleToggle = (optionId: number) => {
        const newValue = value.includes(optionId)
            ? value.filter(id => id !== optionId)
            : [...value, optionId]
        onChange(newValue)
    }

    const selectedLabels = options
        .filter(opt => value.includes(opt.id))
        .map(opt => opt.label)
        .join(', ')

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative" ref={dropdownRef}>
                {/* Botão para abrir dropdown */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-full px-4 py-2.5 text-left
                        bg-white dark:bg-gray-800
                        border rounded-lg
                        ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        hover:border-gray-400 dark:hover:border-gray-500
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        transition-colors duration-200
                        flex items-center justify-between
                    `}
                >
                    <span className={selectedLabels ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                        {selectedLabels || placeholder}
                    </span>
                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div
                        className="
                            absolute z-50 w-full mt-1
                            bg-white dark:bg-gray-800
                            border border-gray-300 dark:border-gray-600
                            rounded-lg shadow-lg
                            overflow-hidden
                        "
                        style={{ maxHeight }}
                    >
                        <div className="overflow-y-auto" style={{ maxHeight }}>
                            {options.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    Nenhuma opção disponível
                                </div>
                            ) : (
                                options.map(option => (
                                    <label
                                        key={option.id}
                                        className="
                                            flex items-start px-4 py-3
                                            hover:bg-gray-50 dark:hover:bg-gray-700
                                            cursor-pointer transition-colors
                                            border-b border-gray-100 dark:border-gray-700
                                            last:border-b-0
                                        "
                                    >
                                        <input
                                            type="checkbox"
                                            checked={value.includes(option.id)}
                                            onChange={() => handleToggle(option.id)}
                                            className="
                                                w-4 h-4 mt-0.5 mr-3
                                                text-blue-600
                                                border-gray-300 dark:border-gray-600
                                                rounded
                                                focus:ring-blue-500
                                                cursor-pointer
                                            "
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {option.label}
                                            </div>
                                            {option.description && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {option.description}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Hint ou erro */}
            {(hint || error) && (
                <p className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {error || hint}
                </p>
            )}
        </div>
    )
}
