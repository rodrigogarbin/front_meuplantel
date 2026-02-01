/**
 * Página de Listagem de Casais Ativos
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { QrScanner } from '@/components/ui/QrScanner'
import { NumberScanner } from '@/components/ui/NumberScanner'
import { useCasais } from './casaisApi'
import { CasalCard } from './CasalCard'
import { CasalDetailsSheet } from './CasalDetailsSheet'
import { formatPassaroCompleto } from '@/lib/passaro'
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
    const [showScanner, setShowScanner] = useState(false)
    const [showNumberScanner, setShowNumberScanner] = useState(false)
    const [casaisParaEscolher, setCasaisParaEscolher] = useState<Casal[]>([])
    const [showChooser, setShowChooser] = useState(false)

    // Busca apenas casais ativos (sit=1, ou seja, sem vigen_final)
    const { data: casais = [], isLoading, error, refetch } = useCasais({ sit: 1 })

    // Abre casal(is) por número - usado pelo scanner e query params
    const openCasaisByNumber = useCallback((nro: number, casaisList: Casal[]) => {
        const matches = casaisList.filter(c => c.nro === nro)
        if (matches.length === 1) {
            setSelectedCasal(matches[0])
            setIsDetailsOpen(true)
        } else if (matches.length > 1) {
            setCasaisParaEscolher(matches)
            setShowChooser(true)
        }
    }, [])

    // Abre o casal se vier via query param (ex: ?casal=123 ou ?nro=12)
    useEffect(() => {
        if (casais.length === 0) return

        const casalIdParam = searchParams.get('casal')
        const nroParam = searchParams.get('nro')

        if (casalIdParam) {
            const casalId = Number(casalIdParam)
            const casal = casais.find(c => (c.id ?? c.gaiola_id) === casalId)
            if (casal) {
                setSelectedCasal(casal)
                setIsDetailsOpen(true)
                setSearchParams({})
            }
        } else if (nroParam) {
            const nro = Number(nroParam)
            setSearchParams({})
            openCasaisByNumber(nro, casais)
        }
    }, [casais, searchParams, setSearchParams, openCasaisByNumber])

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

    const handleScanResult = useCallback((decodedText: string) => {
        setShowScanner(false)
        // Extrai o ID da gaiola da URL (ex: https://app.meuplantel.com/gaiola/123)
        const match = decodedText.match(/\/gaiola\/(\d+)/)
        if (match) {
            navigate(`/gaiola/${match[1]}`)
        }
    }, [navigate])

    const handleNumberScanResult = useCallback((numero: number) => {
        setShowNumberScanner(false)
        openCasaisByNumber(numero, casais)
    }, [casais, openCasaisByNumber])

    const handleChooseCasal = (casal: Casal) => {
        setShowChooser(false)
        setCasaisParaEscolher([])
        setSelectedCasal(casal)
        setIsDetailsOpen(true)
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

            {/* FABs */}
            <div className="fixed right-4 bottom-24 z-40 flex flex-col gap-3 mb-[env(safe-area-inset-bottom)]">
                {/* Ler número da gaiola */}
                <button
                    onClick={() => setShowNumberScanner(true)}
                    className="w-14 h-14 bg-amber-500 text-white rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900"
                    aria-label="Buscar por número"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                </button>
                {/* Scan QR Code */}
                <button
                    onClick={() => setShowScanner(true)}
                    className="w-14 h-14 bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900"
                    aria-label="Escanear QR Code"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                        <rect x="7" y="7" width="4" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="13" y="7" width="4" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="7" y="13" width="4" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 13h4v4h-4" />
                    </svg>
                </button>
                {/* Novo Casal */}
                <button
                    onClick={() => navigate('/casais/novo')}
                    className="w-14 h-14 bg-rose-500 text-white rounded-full shadow-xl shadow-rose-500/30 flex items-center justify-center hover:bg-rose-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900"
                    aria-label="Novo Casal"
                >
                    <PlusIcon />
                </button>
            </div>

            {/* Number Scanner (OCR) */}
            {showNumberScanner && (
                <NumberScanner
                    onResult={handleNumberScanResult}
                    onClose={() => setShowNumberScanner(false)}
                />
            )}

            {/* QR Scanner */}
            {showScanner && (
                <QrScanner
                    onResult={handleScanResult}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Sheet para escolher entre casais com mesmo número */}
            <BottomSheet
                isOpen={showChooser}
                onClose={() => { setShowChooser(false); setCasaisParaEscolher([]) }}
                title={`Gaiola Nº ${casaisParaEscolher[0]?.nro ?? ''} — Qual casal?`}
            >
                <div className="space-y-3 pb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Existem {casaisParaEscolher.length} casais com este número. Selecione o desejado:
                    </p>
                    {casaisParaEscolher.map((casal) => (
                        <button
                            key={casal.id ?? casal.gaiola_id}
                            onClick={() => handleChooseCasal(casal)}
                            className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all text-left"
                        >
                            <span className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                                {casal.nro ?? '?'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-blue-500">♂</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                                        {casal.macho ? formatPassaroCompleto(casal.macho) : casal.descr_pai || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-pink-500">♀</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                                        {casal.femea ? formatPassaroCompleto(casal.femea) : casal.descr_mae || '—'}
                                    </span>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>
            </BottomSheet>

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
