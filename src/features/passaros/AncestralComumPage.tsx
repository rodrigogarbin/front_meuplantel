/**
 * Página de Ancestrais em Comum entre dois pássaros
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { PassaroAutocomplete } from '@/components/ui/PassaroAutocomplete'
import { useAncestresComuns, usePassarosParaAutocomplete } from './passarosApi'
import type { AncestralComum } from './passarosApi'
import type { Passaro } from '@/types'
import { formatRingComplete } from '@/lib/passaro'
import { calcAgeHuman } from '@/lib/date'

function geracaoLabel(prof: number, sexo: number): string {
    if (prof === 1) return sexo === 1 ? 'Pai' : sexo === 2 ? 'Mãe' : 'Pai/Mãe'
    if (prof === 2) return sexo === 1 ? 'Avô' : sexo === 2 ? 'Avó' : 'Avô/Avó'
    if (prof === 3) return sexo === 1 ? 'Bisavô' : sexo === 2 ? 'Bisavó' : 'Bisavô/Bisavó'
    return `${prof}.ª geração`
}

function SexoBadge({ sexo }: { sexo: number }) {
    if (sexo === 1) return <span className="text-blue-500 text-lg leading-none">♂</span>
    if (sexo === 2) return <span className="text-pink-500 text-lg leading-none">♀</span>
    return null
}

function AncestralCard({ ancestral }: { ancestral: AncestralComum }) {
    const label1 = geracaoLabel(ancestral.prof_p1, ancestral.sexo)
    const label2 = geracaoLabel(ancestral.prof_p2, ancestral.sexo)
    const anelFormatado = formatRingComplete(ancestral.anel)
    const idade = calcAgeHuman(ancestral.dt_nasc)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <SexoBadge sexo={ancestral.sexo} />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Anilha em destaque */}
                    <p className="font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                        {anelFormatado}
                    </p>

                    {/* Descrição / mutação */}
                    {(ancestral.descr || ancestral.mutacao) && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                            {ancestral.descr || ancestral.mutacao}
                        </p>
                    )}

                    {/* Espécie + idade */}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {ancestral.especie && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {ancestral.especie}
                            </span>
                        )}
                        {idade && idade !== '—' && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {idade}
                            </span>
                        )}
                    </div>

                    {/* Badges de geração */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                            Ave 1: {label1}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                            Ave 2: {label2}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function AncestralComumPage() {
    const [searchParams] = useSearchParams()
    const preId1 = searchParams.get('id1') ? Number(searchParams.get('id1')) : null

    const [id1, setId1] = useState<number | null>(preId1)
    const [id2, setId2] = useState<number | null>(null)

    const { data: passaros = [], isLoading: loadingPassaros } = usePassarosParaAutocomplete()
    const { data, isLoading: loadingComuns } = useAncestresComuns(id1, id2)

    // Sync id1 if URL param changes
    useEffect(() => {
        if (preId1 && passaros.length > 0) {
            setId1(preId1)
        }
    }, [preId1, passaros.length])

    const handleChange1 = (id: number | null, _passaro: Passaro | null) => {
        setId1(id)
    }

    const handleChange2 = (id: number | null, _passaro: Passaro | null) => {
        setId2(id)
    }

    const showResults = !!id1 && !!id2 && id1 !== id2
    const ancestrais = data?.ancestrais_comuns ?? []

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <Topbar title="Ancestrais em Comum" showBack />

            <div className="flex-1 p-4 space-y-4 max-w-xl mx-auto w-full">
                {/* Seletores */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Selecione as duas aves
                    </h2>
                    <PassaroAutocomplete
                        label="Ave 1"
                        value={id1}
                        onChange={handleChange1}
                        options={passaros}
                        placeholder="Buscar ave 1..."
                        isLoading={loadingPassaros}
                    />
                    <PassaroAutocomplete
                        label="Ave 2"
                        value={id2}
                        onChange={handleChange2}
                        options={passaros}
                        placeholder="Buscar ave 2..."
                        isLoading={loadingPassaros}
                    />
                </div>

                {/* Resultados */}
                {!showResults && (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                        Selecione duas aves para ver os ancestrais em comum
                    </div>
                )}

                {showResults && loadingComuns && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                )}

                {showResults && !loadingComuns && data && (
                    <>
                        {data.is_siblings && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Estas aves são irmãs — exibindo apenas os pais em comum.
                            </div>
                        )}
                        <div className="flex items-center justify-between px-1">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {data.total === 0
                                    ? 'Nenhum ancestral em comum'
                                    : `${data.total} ancestral${data.total !== 1 ? 'is' : ''} em comum`}
                            </p>
                        </div>

                        {ancestrais.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                }
                                title="Nenhum ancestral em comum"
                                description="As duas aves não compartilham nenhum ancestral conhecido"
                            />
                        ) : (
                            <div className="space-y-3">
                                {ancestrais.map((a) => (
                                    <AncestralCard key={a.passaro_id} ancestral={a} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
