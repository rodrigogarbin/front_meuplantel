/**
 * Página de Histórico de Casais Encerrados
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCasais } from './casaisApi'
import { CasalDetailsSheet } from './CasalDetailsSheet'
import { formatPassaroCompleto } from '@/lib/passaro'
import type { Casal } from '@/types'

// Ícone de busca
function SearchIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    )
}

function formatDateBR(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR')
}

interface CasalHistoricoCardProps {
    casal: Casal
    onClick: () => void
    onReplicar: () => void
}

function CasalHistoricoCard({ casal, onClick, onReplicar }: CasalHistoricoCardProps) {
    const machoLabel = casal.macho ? formatPassaroCompleto(casal.macho) : casal.descr_pai || '—'
    const femeaLabel = casal.femea ? formatPassaroCompleto(casal.femea) : casal.descr_mae || '—'

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Área clicável principal */}
            <button
                onClick={onClick}
                className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 active:scale-[0.98] transition-all text-left"
            >
                {/* Badge número */}
                <span className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-lg flex-shrink-0">
                    {casal.nro ?? '?'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Macho e fêmea */}
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-blue-500">♂</span>
                        <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{machoLabel}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-pink-500">♀</span>
                        <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{femeaLabel}</span>
                    </div>

                    {/* Período */}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateBR(casal.vigen_inicial)} → {formatDateBR(casal.vigen_final)}
                        </span>
                    </div>

                    {/* Badges */}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                            Encerrado
                        </span>
                        {(casal.nro_rodadas ?? 0) > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {casal.nro_rodadas} {casal.nro_rodadas === 1 ? 'rodada' : 'rodadas'}
                            </span>
                        )}
                    </div>
                </div>

                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Barra de ações */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex justify-end">
                <button
                    onClick={onReplicar}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 px-2.5 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-[0.97] transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Replicar casal
                </button>
            </div>
        </div>
    )
}

export function CasaisHistoricoPage() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCasal, setSelectedCasal] = useState<Casal | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const { data: casais = [], isLoading } = useCasais({ sit: 2 })

    const filteredCasais = casais.filter((casal) => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        if (casal.nro?.toString().includes(search)) return true
        if (casal.descr_pai?.toLowerCase().includes(search)) return true
        if (casal.descr_mae?.toLowerCase().includes(search)) return true
        if (casal.macho?.descr?.toLowerCase().includes(search)) return true
        if (casal.femea?.descr?.toLowerCase().includes(search)) return true
        return false
    })

    const handleSelectCasal = (casal: Casal) => {
        setSelectedCasal(casal)
        setIsDetailsOpen(true)
    }

    const handleCloseDetails = () => {
        setIsDetailsOpen(false)
        setTimeout(() => setSelectedCasal(null), 300)
    }

    const handleReplicar = (casal: Casal) => {
        const casalId = casal.gaiola_id ?? casal.id
        if (!casalId) return
        navigate(`/casais/novo?replicar_casal=${casalId}`)
    }

    return (
        <>
            <Topbar title="Histórico de Casais" showBack />

            {/* Barra de busca sticky */}
            <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por número ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            <main className="page-content">
                {/* Loading */}
                {isLoading && (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-28" />
                        ))}
                    </div>
                )}

                {/* Vazio */}
                {!isLoading && filteredCasais.length === 0 && (
                    <EmptyState
                        title="Nenhum casal encerrado"
                        description={
                            searchTerm
                                ? 'Nenhum casal encerrado corresponde à busca.'
                                : 'Casais encerrados aparecerão aqui.'
                        }
                        icon="🕊️"
                    />
                )}

                {/* Lista */}
                {!isLoading && filteredCasais.length > 0 && (
                    <div className="p-4 space-y-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {filteredCasais.length} {filteredCasais.length === 1 ? 'casal encerrado' : 'casais encerrados'}
                        </div>
                        {filteredCasais.map((casal) => (
                            <CasalHistoricoCard
                                key={casal.id ?? casal.gaiola_id}
                                casal={casal}
                                onClick={() => handleSelectCasal(casal)}
                                onReplicar={() => handleReplicar(casal)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <CasalDetailsSheet
                casal={selectedCasal}
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
            />
        </>
    )
}
