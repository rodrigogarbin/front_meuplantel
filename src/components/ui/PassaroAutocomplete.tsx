/**
 * Componente Autocomplete para seleção de pássaros (pai/mãe)
 */

import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import type { Passaro } from '@/types'

interface AutocompleteProps {
    label?: string
    value: number | null
    onChange: (id: number | null, passaro: Passaro | null) => void
    options: Passaro[]
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    isLoading?: boolean
}

export function PassaroAutocomplete({
    label,
    value,
    onChange,
    options,
    placeholder = 'Digite para buscar...',
    error,
    hint,
    disabled,
    isLoading,
}: AutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedLabel, setSelectedLabel] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Atualiza o label quando value muda
    useEffect(() => {
        if (value) {
            const passaro = options.find((p) => p.passaro_id === value)
            if (passaro) {
                setSelectedLabel(getPassaroLabel(passaro))
            }
        } else {
            setSelectedLabel('')
        }
    }, [value, options])

    // Fecha dropdown quando clica fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getPassaroLabel = (passaro: Passaro): string => {
        // Formato: "SG_CLUBE NRO_CRIADOR NRO/ANO - DESCRICAO"
        // Exemplo: "EH130 005/2025 - Roseicollis Verde"
        const parts: string[] = []

        // Sigla do clube + número criador (se houver)
        if (passaro.anel?.sg_clube) {
            parts.push(passaro.anel.sg_clube)
        }
        if (passaro.anel?.nro_criador) {
            parts.push(passaro.anel.nro_criador)
        }

        // Número/Ano do anel
        const nro = passaro.anel?.nro?.toString().padStart(3, '0') ?? '000'
        const ano = passaro.anel?.ano ?? '????'
        parts.push(`${nro}/${ano}`)

        // Descrição/Mutação - busca em várias fontes possíveis
        const descr = passaro.descr || passaro.mutacao?.descr || passaro.mutacao?.descricao || ''

        const anelFormatado = parts.join(' ')
        return descr ? `${anelFormatado} - ${descr}` : anelFormatado
    }

    const filteredOptions = options.filter((passaro) => {
        if (!search) return true
        const label = getPassaroLabel(passaro).toLowerCase()
        return label.includes(search.toLowerCase())
    })

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setIsOpen(true)
        if (!e.target.value) {
            onChange(null, null)
        }
    }

    const handleSelect = (passaro: Passaro) => {
        onChange(passaro.passaro_id, passaro)
        setSelectedLabel(getPassaroLabel(passaro))
        setSearch('')
        setIsOpen(false)
    }

    const handleClear = () => {
        onChange(null, null)
        setSelectedLabel('')
        setSearch('')
        inputRef.current?.focus()
    }

    const displayValue = isOpen ? search : selectedLabel

    return (
        <div className="w-full relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        w-full px-3 py-2 pr-10 border rounded-lg
                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                        bg-white dark:bg-gray-700
                        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                        disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                        ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    `}
                />
                {value && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            Carregando...
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            Nenhum resultado encontrado
                        </div>
                    ) : (
                        filteredOptions.slice(0, 50).map((passaro) => (
                            <button
                                key={passaro.passaro_id}
                                type="button"
                                onClick={() => handleSelect(passaro)}
                                className={`
                                    w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700
                                    ${value === passaro.passaro_id ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'}
                                `}
                            >
                                {getPassaroLabel(passaro)}
                            </button>
                        ))
                    )}
                </div>
            )}

            {hint && !error && (
                <p className="mt-1 text-xs text-gray-500">{hint}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    )
}
