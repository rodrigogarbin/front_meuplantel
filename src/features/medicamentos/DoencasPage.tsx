/**
 * Página de gerenciamento de Doenças
 */

import { useState } from 'react'
import { MainLayout } from '@/components/layout'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useDoencas } from './medicamentosApi'
import { useDeleteDoenca } from './doencasApi'
import { DoencaFormSheet } from './DoencaFormSheet'
import type { Doenca } from '@/types'

// Ícones
function HeartPulseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
}

function Edit2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    )
}

function Trash2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    )
}

export function DoencasPage() {
    // Queries
    const { data: doencas, isLoading, isError, refetch } = useDoencas()
    const deleteMutation = useDeleteDoenca()

    // Sheet state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedDoenca, setSelectedDoenca] = useState<Doenca | null>(null)

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    const handleAdd = () => {
        setSelectedDoenca(null)
        setIsFormOpen(true)
    }

    const handleEdit = (doenca: Doenca) => {
        setSelectedDoenca(doenca)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id)
            setDeleteConfirmId(null)
        } catch (error) {
            console.error('Erro ao excluir doença:', error)
        }
    }

    const handleCloseForm = () => {
        setIsFormOpen(false)
        setTimeout(() => setSelectedDoenca(null), 300)
    }

    return (
        <MainLayout>
            <Topbar title="Doenças" showBack />

            <main className="page-content">
                <div className="p-4">
                    {/* Loading */}
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-32 rounded-xl" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <ErrorState
                            title="Erro ao carregar doenças"
                            message="Não foi possível carregar a lista de doenças."
                            onRetry={refetch}
                        />
                    )}

                    {/* Empty */}
                    {!isLoading && !isError && doencas?.length === 0 && (
                        <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                                <HeartPulseIcon className="w-16 h-16 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Nenhuma doença
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Você ainda não cadastrou nenhuma doença. Clique no botão + para adicionar.
                            </p>
                        </div>
                    )}

                    {/* Lista */}
                    {!isLoading && !isError && doencas && doencas.length > 0 && (
                        <div className="space-y-3">
                            {doencas.map((doenca) => {
                                const id = doenca.doenca_id || doenca.id!
                                const isDeleting = deleteConfirmId === id

                                return (
                                    <div
                                        key={id}
                                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {doenca.nome}
                                                </h3>
                                                {doenca.descricao && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {doenca.descricao}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(doenca)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit2Icon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2Icon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sintomas */}
                                        {doenca.sintomas && doenca.sintomas.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {doenca.sintomas.map((sintoma) => (
                                                    <span
                                                        key={sintoma.sintoma_id || sintoma.id}
                                                        className="inline-block px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                                                    >
                                                        {sintoma.nome}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Confirmação de delete */}
                                        {isDeleting && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                                                    Confirma a exclusão desta doença?
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDelete(id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {deleteMutation.isPending ? 'Excluindo...' : 'Sim, excluir'}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        disabled={deleteMutation.isPending}
                                                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* FAB */}
            <button
                onClick={handleAdd}
                className="fixed right-4 bottom-24 z-40 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center ring-4 ring-white dark:ring-gray-900"
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {/* Form Sheet */}
            <DoencaFormSheet
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                doenca={selectedDoenca}
            />
        </MainLayout>
    )
}
