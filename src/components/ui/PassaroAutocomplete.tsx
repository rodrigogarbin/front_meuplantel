/**
 * Componente Autocomplete para seleção de pássaros (pai/mãe)
 *
 * Suporta dois modos implícitos:
 *   - Vinculado: usuário seleciona da lista → salva passaro_id
 *   - Texto livre: usuário digita e sai sem selecionar → salva descrição via onFreeText
 */

import { useState, useRef, useEffect, type ChangeEvent, type FocusEvent } from 'react'
import type { Passaro } from '@/types'

interface AutocompleteProps {
    label?: string
    value: number | null
    freeText?: string          // descrição livre (quando não vinculado a um pássaro)
    onChange: (id: number | null, passaro: Passaro | null) => void
    onFreeText?: (text: string) => void  // chamado ao confirmar texto livre no blur
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
    freeText,
    onChange,
    onFreeText,
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

    // Refs para evitar closures desatualizadas no handler de click externo
    const searchRef = useRef(search)
    const valueRef = useRef(value)
    const onFreeTextRef = useRef(onFreeText)
    useEffect(() => { searchRef.current = search }, [search])
    useEffect(() => { valueRef.current = value }, [value])
    useEffect(() => { onFreeTextRef.current = onFreeText }, [onFreeText])

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

    // Fecha dropdown e salva texto livre quando clica fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                // Se não há pássaro vinculado e há texto digitado → salva como descrição
                if (!valueRef.current && searchRef.current.trim() && onFreeTextRef.current) {
                    onFreeTextRef.current(searchRef.current.trim())
                }
                setIsOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getPassaroLabel = (passaro: Passaro): string => {
        const parts: string[] = []
        if (passaro.anel?.sg_clube) parts.push(passaro.anel.sg_clube)
        if (passaro.anel?.nro_criador) parts.push(passaro.anel.nro_criador.padStart(3, '0'))
        const nro = passaro.anel?.nro?.toString().padStart(3, '0') ?? '000'
        const ano = passaro.anel?.ano ?? '????'
        parts.push(`${nro}/${ano}`)
        const descr = passaro.descr || passaro.mutacao?.descr || passaro.mutacao?.descricao || ''
        const anelFormatado = parts.join(' ')
        return descr ? `${anelFormatado} - ${descr}` : anelFormatado
    }

    const filteredOptions = options.filter((passaro) => {
        if (!search) return true
        const label = getPassaroLabel(passaro).toLowerCase()
        return label.includes(search.toLowerCase())
    })

    const handleFocus = () => {
        // Pré-popula o campo com o texto livre para o usuário poder editar
        if (!value && freeText) {
            setSearch(freeText)
        }
        setIsOpen(true)
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value
        setSearch(text)
        setIsOpen(true)
        // Limpa seleção ao digitar (seja apagando ou trocando o texto)
        if (value) {
            onChange(null, null)
            setSelectedLabel('')
        }
        if (!text) {
            onFreeText?.('')
        }
    }

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        // Só processa se o foco saiu para fora do container (não para o dropdown)
        if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) return
        if (!value && search.trim() && onFreeText) {
            onFreeText(search.trim())
        }
        setIsOpen(false)
        setSearch('')
    }

    const handleSelect = (passaro: Passaro) => {
        onChange(passaro.passaro_id, passaro)
        setSelectedLabel(getPassaroLabel(passaro))
        onFreeText?.('')  // limpa descrição ao vincular pássaro
        setSearch('')
        setIsOpen(false)
    }

    const handleClear = () => {
        onChange(null, null)
        setSelectedLabel('')
        onFreeText?.('')
        setSearch('')
        inputRef.current?.focus()
    }

    const showClear = !!(value || freeText) && !disabled
    const displayValue = isOpen ? search : (selectedLabel || freeText || '')
    const isFreeTextMode = !value && !!freeText

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
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        w-full px-3 py-2 pr-10 border rounded-lg
                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                        bg-white dark:bg-gray-700
                        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                        disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                        ${error ? 'border-red-500' : isFreeTextMode ? 'border-dashed border-gray-400 dark:border-gray-500' : 'border-gray-300 dark:border-gray-600'}
                    `}
                />
                {showClear && (
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

            {/* Indicador de modo texto livre */}
            {isFreeTextMode && !isOpen && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pássaro externo — digite para buscar no plantel
                </p>
            )}

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            Carregando...
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {onFreeText
                                ? 'Nenhum resultado — saia do campo para salvar como descrição'
                                : 'Nenhum resultado encontrado'}
                        </div>
                    ) : (
                        filteredOptions.slice(0, 50).map((passaro) => (
                            <button
                                key={passaro.passaro_id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
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
