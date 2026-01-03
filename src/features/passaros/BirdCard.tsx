/**
 * Componente BirdCard
 * Card mobile-first para exibir pássaro na listagem
 */

import type { Passaro } from '@/types'
import { formatPassaroCompleto, sexIcon, sexColor } from '@/lib/passaro'
import { formatDate, calcAgeHuman } from '@/lib/date'

interface BirdCardProps {
    bird: Passaro
    onClick: () => void
}

export function BirdCard({ bird, onClick }: BirdCardProps) {
    const passaroLabel = formatPassaroCompleto(bird)
    const sexIconChar = sexIcon(bird.sexo)
    const sexColorClass = sexColor(bird.sexo)

    return (
        <button
            onClick={onClick}
            className="card w-full p-4 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
            {/* Header: Anilha + Descrição + Sexo */}
            <div className="flex items-start justify-between mb-3">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide flex-1 mr-2">
                    {passaroLabel}
                </span>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${sexColorClass}`}>
                    {sexIconChar}
                </span>
            </div>

            {/* Data nascimento + Idade */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(bird.dt_nasc)}
                </span>
                {bird.dt_nasc && (
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {calcAgeHuman(bird.dt_nasc)}
                    </span>
                )}
            </div>

            {/* Pai e Mãe */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <span className="text-blue-500 font-bold">♂</span>
                    Pai: {bird.pai ? formatPassaroCompleto(bird.pai) : '—'}
                </span>
                <span className="flex items-center gap-1">
                    <span className="text-pink-500 font-bold">♀</span>
                    Mãe: {bird.mae ? formatPassaroCompleto(bird.mae) : '—'}
                </span>
            </div>
        </button>
    )
}
