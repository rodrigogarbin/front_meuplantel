/**
 * Página de Listagem de Casais Ativos
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { useCasais } from './casaisApi'
import { CasalCard } from './CasalCard'
import { CasalDetailsSheet } from './CasalDetailsSheet'
import type { Casal } from '@/types'

// Ícone de plus
function PlusIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    )
}

// Ícone de busca
function SearchIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    )
}

export function CasaisPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCasal, setSelectedCasal] = useState<Casal | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // Busca apenas casais ativos (sit=1, ou seja, sem vigen_final)
    const { data: casais = [], isLoading, error, refetch } = useCasais({ sit: 1 })

    // Abre o casal se vier via query param (ex: ?casal=123)
    useEffect(() => {
        const casalIdParam = searchParams.get('casal')
        if (casalIdParam && casais.length > 0) {
            const casalId = Number(casalIdParam)
            const casal = casais.find(c => (c.id ?? c.gaiola_id) === casalId)
            if (casal) {
                setSelectedCasal(casal)
                setIsDetailsOpen(true)
                // Remove o param da URL após abrir
                setSearchParams({})
            }
        }
    }, [casais, searchParams, setSearchParams])

    // Filtra por busca
    const filteredCasais = casais.filter((casal) => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()

        // Busca por número do casal
        if (casal.nro?.toString().includes(search)) return true

        // Busca por descrição do pai/mãe
        if (casal.descr_pai?.toLowerCase().includes(search)) return true
        if (casal.descr_mae?.toLowerCase().includes(search)) return true

        // Busca por descrição do macho/fêmea
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
        setTimeout(() => setSelectedCasal(null), 300) // Aguarda animação
    }

    const handleRefresh = async () => {
        const result = await refetch()
        // Atualiza o casal selecionado com os dados novos
        if (selectedCasal && result.data) {
            const casalId = selectedCasal.id ?? selectedCasal.gaiola_id
            const casalAtualizado = result.data.find(c => (c.id ?? c.gaiola_id) === casalId)
            if (casalAtualizado) {
                setSelectedCasal(casalAtualizado)
            }
        }
    }

    return (
        <>
            <Topbar
                title="Casais Ativos"
            />

            <main className="page-content">
                <PullToRefresh
                    onRefresh={async () => { await refetch() }}
                    disabled={isLoading}
                >
                    {/* Campo de busca */}
                    <div className="px-4 pt-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar casal..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-40" />
                            ))}
                        </div>
                    )}

                    {/* Erro */}
                    {error && !isLoading && (
                        <ErrorState
                            title="Erro ao carregar casais"
                            message="Não foi possível carregar a lista de casais."
                            onRetry={() => refetch()}
                        />
                    )}

                    {/* Lista vazia */}
                    {!isLoading && !error && filteredCasais.length === 0 && (
                        <EmptyState
                            title={searchTerm ? 'Nenhum casal encontrado' : 'Nenhum casal ativo'}
                            description={
                                searchTerm
                                    ? 'Tente buscar com outros termos.'
                                    : 'Você ainda não tem casais ativos cadastrados.'
                            }
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            }
                        />
                    )}

                    {/* Lista de casais */}
                    {!isLoading && !error && filteredCasais.length > 0 && (
                        <div className="p-4 space-y-4">
                            {/* Contador */}
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>{filteredCasais.length} {filteredCasais.length === 1 ? 'casal' : 'casais'}</span>
                            </div>

                            {/* Cards */}
                            {filteredCasais.map((casal) => (
                                <CasalCard
                                    key={casal.id ?? casal.gaiola_id}
                                    casal={casal}
                                    onClick={() => handleSelectCasal(casal)}
                                />
                            ))}
                        </div>
                    )}
                </PullToRefresh>
            </main>

            {/* FAB - Botão Flutuante para Adicionar */}
            <button
                onClick={() => navigate('/casais/novo')}
                className="fixed right-4 bottom-20 z-40 w-14 h-14 bg-rose-500 text-white rounded-full shadow-xl shadow-rose-500/30 flex items-center justify-center hover:bg-rose-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900"
                aria-label="Novo Casal"
            >
                <PlusIcon />
            </button>

            {/* Sheet de Detalhes */}
            <CasalDetailsSheet
                casal={selectedCasal}
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                onRefresh={handleRefresh}
            />
        </>
    )
}
