/**
 * Componente CasalCard
 * Card mobile-first para exibir casal na listagem
 */

import type { Casal } from '@/types'
import { formatPassaroCompleto } from '@/lib/passaro'
import { formatDate } from '@/lib/date'

interface CasalCardProps {
    casal: Casal
    onClick: () => void
}

export function CasalCard({ casal, onClick }: CasalCardProps) {
    const machoLabel = casal.macho ? formatPassaroCompleto(casal.macho) : casal.descr_pai || '—'
    const femeaLabel = casal.femea ? formatPassaroCompleto(casal.femea) : casal.descr_mae || '—'

    // Conta ovos em choco/férteis
    const ovosAtivos = casal.posturas?.length ?? 0

    return (
        <button
            onClick={onClick}
            className="card w-full p-4 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
            {/* Header: Número do Casal */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {casal.nro ?? '?'}
                    </span>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Casal</span>
                        <p className="font-bold text-gray-800 dark:text-gray-100">Nº {casal.nro}</p>
                    </div>
                </div>
                {ovosAtivos > 0 && (
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2C6.5 2 4 6 4 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
                        </svg>
                        {ovosAtivos} {ovosAtivos === 1 ? 'ovo' : 'ovos'}
                    </span>
                )}
            </div>

            {/* Macho */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ♂
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">
                    {machoLabel}
                </span>
            </div>

            {/* Fêmea */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                <span className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ♀
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">
                    {femeaLabel}
                </span>
            </div>

            {/* Data de início */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Início: {formatDate(casal.vigen_inicial)}
                </span>
                {casal.nro_rodadas !== undefined && casal.nro_rodadas !== null && casal.nro_rodadas > 0 && (
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {casal.nro_rodadas} {casal.nro_rodadas === 1 ? 'rodada' : 'rodadas'}
                    </span>
                )}
            </div>
        </button>
    )
}
