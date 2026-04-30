/**
 * Shared genealogy tree components — used by ArvoreGenealogicaPage and CertificadoVerificacaoPage.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRingComplete, getFotoUrl } from '@/lib/passaro'
import { SexoEnum } from '@/types'
import type { Anel } from '@/types'
import { API_BASE_URL } from '@/lib/api'

// Tipo recursivo para o pássaro na árvore genealógica
export interface PassaroArvore {
    passaro_id: number
    descr?: string | null
    dt_nasc?: string | null
    sexo?: number | null
    passaro_pai_id?: number | null
    passaro_mae_id?: number | null
    foto?: string | null
    anel?: Anel | null
    pai?: PassaroArvore | null
    mae?: PassaroArvore | null
}

// Ícone de sexo (interno)
function SexoIcon({ sexo }: { sexo?: number | null }) {
    if (sexo === SexoEnum.MACHO) {
        return <span className="text-blue-500">♂</span>
    }
    if (sexo === SexoEnum.FEMEA) {
        return <span className="text-pink-500">♀</span>
    }
    return <span className="text-gray-400">?</span>
}

// ========================================
// VISUALIZAÇÃO HORIZONTAL (estilo imagem)
// ========================================

// Card individual de pássaro na árvore horizontal
interface BirdCardProps {
    passaro: PassaroArvore | null | undefined
    isMain?: boolean
    size?: 'sm' | 'md' | 'lg'
    label?: string
    interactive?: boolean
}

function BirdCard({ passaro, isMain = false, size = 'md', label, interactive = true }: BirdCardProps) {
    const navigate = useNavigate()
    const [imageError, setImageError] = useState(false)
    const fotoUrl = passaro?.foto ? getFotoUrl(passaro.foto, API_BASE_URL) : null

    const sizeClasses = {
        sm: 'w-[238px] min-h-[80px] px-2 py-1.5',
        md: 'w-[238px] min-h-[80px] px-3 py-2',
        lg: 'w-[238px] min-h-[80px] px-3 py-2',
    }

    const titleSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    }

    const descrSizes = {
        sm: 'text-[9px]',
        md: 'text-[10px]',
        lg: 'text-[11px]',
    }

    const photoSizes = {
        sm: 'w-7 h-9',
        md: 'w-9 h-11',
        lg: 'w-10 h-12',
    }

    if (!passaro) {
        return (
            <div className={`
                flex flex-col items-center justify-center rounded-lg border-2 border-dashed
                border-gray-300 dark:border-gray-600 text-gray-400
                ${sizeClasses[size]}
            `}>
                {label && <div className="text-[10px] mb-1 font-medium">{label}</div>}
                <span>?</span>
            </div>
        )
    }

    const colorClass = passaro.sexo === SexoEnum.MACHO
        ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/60 dark:border-blue-500 dark:text-blue-200'
        : passaro.sexo === SexoEnum.FEMEA
            ? 'bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/60 dark:border-pink-500 dark:text-pink-200'
            : 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200'

    const ringNumber = formatRingComplete(passaro.anel)
    const isDisabled = isMain || !interactive

    return (
        <button
            onClick={() => interactive && !isMain && navigate(`/passaros/${passaro.passaro_id}/arvore`)}
            disabled={isDisabled}
            className={`
                flex flex-col items-center rounded-lg border-2 font-medium text-center
                transition-all
                ${colorClass}
                ${sizeClasses[size]}
                ${isMain ? 'ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-gray-800' : ''}
                ${!interactive ? 'cursor-default' : 'hover:scale-105 hover:shadow-md cursor-pointer'}
            `}
        >
            {/* Título: ícone de sexo + anilha */}
            <div className={`flex items-center justify-center gap-1 font-semibold ${titleSizes[size]} w-full`}>
                <SexoIcon sexo={passaro.sexo} />
                <span className="break-words text-center">{ringNumber || `#${passaro.passaro_id}`}</span>
            </div>

            {/* Corpo: foto à esquerda, descrição à direita */}
            {((fotoUrl && !imageError) || passaro.descr) && (
                <div className="flex items-center justify-center gap-2 mt-1 w-full flex-1">
                    {fotoUrl && !imageError && (
                        <div className={`overflow-hidden rounded border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0 ${photoSizes[size]}`}>
                            <img
                                src={fotoUrl}
                                alt={passaro.descr ?? 'Pássaro'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={() => setImageError(true)}
                            />
                        </div>
                    )}
                    {passaro.descr && (
                        <span className={`opacity-70 ${descrSizes[size]} leading-tight break-words flex-1 text-center`}>
                            {passaro.descr}
                        </span>
                    )}
                </div>
            )}
        </button>
    )
}

// Conector horizontal (linha) — interno
function HorizontalLine({ width = 20 }: { width?: number }) {
    return (
        <div
            className="h-0.5 bg-amber-400 dark:bg-amber-500"
            style={{ width: `${width}px` }}
        />
    )
}

// Componente para renderizar um par (pai/mãe) com seus ancestrais — interno
interface AncestorPairProps {
    pai: PassaroArvore | null | undefined
    mae: PassaroArvore | null | undefined
    level: number
    maxLevel: number
    interactive?: boolean
}

function AncestorPair({ pai, mae, level, maxLevel, interactive = true }: AncestorPairProps) {
    const showNextLevel = level < maxLevel

    return (
        <div className="flex flex-col justify-center">
            {/* Pai (em cima) e seus ancestrais */}
            <div className="flex items-center">
                <BirdCard passaro={pai} size={level >= 2 ? 'sm' : 'md'} interactive={interactive} />
                {showNextLevel && (
                    <>
                        <HorizontalLine width={16} />
                        <AncestorPair
                            pai={pai?.pai}
                            mae={pai?.mae}
                            level={level + 1}
                            maxLevel={maxLevel}
                            interactive={interactive}
                        />
                    </>
                )}
            </div>

            {/* Espaçador com linha vertical conectora */}
            <div className="flex items-stretch h-4">
                <div className="flex items-center justify-end" style={{ width: '97px' }}>
                    <div className="w-0.5 h-full bg-amber-400 dark:bg-amber-500 -mr-px" />
                </div>
            </div>

            {/* Mãe (embaixo) e seus ancestrais */}
            <div className="flex items-center">
                <BirdCard passaro={mae} size={level >= 2 ? 'sm' : 'md'} interactive={interactive} />
                {showNextLevel && (
                    <>
                        <HorizontalLine width={16} />
                        <AncestorPair
                            pai={mae?.pai}
                            mae={mae?.mae}
                            level={level + 1}
                            maxLevel={maxLevel}
                            interactive={interactive}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

// Árvore genealógica horizontal completa (estilo imagem de referência)
interface HorizontalTreeProps {
    passaro: PassaroArvore
    maxGenerations?: number
    interactive?: boolean
}

export function HorizontalTree({ passaro, maxGenerations = 3, interactive = true }: HorizontalTreeProps) {
    return (
        <div className="overflow-x-auto py-4">
            <div className="min-w-fit flex items-center px-4">
                {/* Pássaro principal à esquerda */}
                <BirdCard passaro={passaro} isMain size="lg" interactive={interactive} />

                {/* Linha conectora */}
                <HorizontalLine width={24} />

                {/* Ancestrais expandindo para direita */}
                <AncestorPair
                    pai={passaro.pai}
                    mae={passaro.mae}
                    level={1}
                    maxLevel={maxGenerations}
                    interactive={interactive}
                />
            </div>
        </div>
    )
}
