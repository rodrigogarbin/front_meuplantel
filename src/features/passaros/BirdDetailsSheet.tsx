/**
 * Componente BirdDetailsSheet
 * Bottom sheet / Modal com detalhes completos do pássaro
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Passaro, Portador } from '@/types'
import { PortadorTipo } from '@/types'
import { BottomSheet } from '@/components/ui'
import { formatPassaroCompleto, sexIcon, sexText, sexColor, situacaoText, situacaoColor, getEspecie, getMutacao, getFotoUrl } from '@/lib/passaro'
import { formatDate, calcAgeHuman } from '@/lib/date'
import { API_BASE_URL } from '@/lib/api'

/**
 * Faz o parse do JSON de portadores e separa por tipo
 */
function parsePortadores(portadorJson: string | null | undefined): { portadores: string[]; possiveis: string[] } {
    if (!portadorJson) return { portadores: [], possiveis: [] }

    try {
        const list: Portador[] = JSON.parse(portadorJson)
        const portadores = list.filter(p => p.tp === PortadorTipo.PORTADOR).map(p => p.descr)
        const possiveis = list.filter(p => p.tp === PortadorTipo.POSSIVEL_PORTADOR).map(p => p.descr)
        return { portadores, possiveis }
    } catch {
        return { portadores: [], possiveis: [] }
    }
}

interface BirdDetailsSheetProps {
    bird: Passaro | null
    isOpen: boolean
    onClose: () => void
}

export function BirdDetailsSheet({ bird, isOpen, onClose }: BirdDetailsSheetProps) {
    const navigate = useNavigate()
    const [imageError, setImageError] = useState(false)

    // Parse dos portadores separando por tipo
    const { portadores, possiveis } = useMemo(
        () => parsePortadores(bird?.portador),
        [bird?.portador]
    )

    if (!bird) return null

    const fotoUrl = getFotoUrl(bird.foto, API_BASE_URL)

    const handleEdit = () => {
        onClose()
        navigate(`/passaros/${bird.passaro_id}/editar`)
    }

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Detalhes do Pássaro">
            <div className="space-y-6">
                {/* Foto */}
                {fotoUrl && !imageError && (
                    <div className="relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                            src={fotoUrl}
                            alt={bird.descr ?? 'Foto do pássaro'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                    </div>
                )}

                {/* Anilha em destaque */}
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                        {formatPassaroCompleto(bird)}
                    </p>
                </div>

                {/* Badges: Sexo + Situação */}
                <div className="flex justify-center gap-3">
                    <span className={`chip ${sexColor(bird.sexo)}`}>
                        {sexIcon(bird.sexo)} {sexText(bird.sexo)}
                    </span>
                    <span className={`chip ${situacaoColor(bird.sit)}`}>
                        {situacaoText(bird.sit)}
                    </span>
                </div>

                {/* Informações em grid */}
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                        label="Nascimento"
                        value={formatDate(bird.dt_nasc)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <InfoItem
                        label="Idade"
                        value={calcAgeHuman(bird.dt_nasc)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <InfoItem
                        label="Espécie"
                        value={getEspecie(bird)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        }
                    />
                    <InfoItem
                        label="Mutação"
                        value={getMutacao(bird)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        }
                    />
                </div>

                {/* Pais */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Pais
                        </h3>
                        <button
                            onClick={() => {
                                onClose()
                                navigate(`/passaros/${bird.passaro_id}/arvore`)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                            Ver Árvore
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mb-1">
                                <span className="text-lg">♂</span> Pai
                            </span>
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                {bird.pai ? formatPassaroCompleto(bird.pai) : '—'}
                            </p>
                        </div>
                        <div className="bg-pink-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <span className="text-xs text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1 mb-1">
                                <span className="text-lg">♀</span> Mãe
                            </span>
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                {bird.mae ? formatPassaroCompleto(bird.mae) : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Portadores */}
                {(portadores.length > 0 || possiveis.length > 0) && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Genética
                        </h3>

                        {/* Portador de */}
                        {portadores.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Portador de</p>
                                <div className="flex flex-wrap gap-2">
                                    {portadores.map((p, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Possível Portador de */}
                        {possiveis.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Possível Portador de</p>
                                <div className="flex flex-wrap gap-2">
                                    {possiveis.map((p, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Observações */}
                {bird.obs && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Observações
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{bird.obs}</p>
                    </div>
                )}

                {/* Botões de Ação */}
                <div className="pt-2 pb-4">
                    {/* Botão de Editar */}
                    <button
                        onClick={handleEdit}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}

// Componente auxiliar para itens de informação
function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-gray-400 dark:text-gray-500 mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    )
}
