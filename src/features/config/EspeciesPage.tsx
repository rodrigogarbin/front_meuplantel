/**
 * Página de gerenciamento de Espécies
 */

import { useState } from 'react'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useEspecies, useDeleteEspecie } from '@/features/especies/especiesApi'
import { EspecieFormSheet } from './EspecieFormSheet'
import type { EspecieUsuario } from '@/types'

// Ícones
function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    )
}

function EditIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    )
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}

function BirdIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
        </svg>
    )
}

export function EspeciesPage() {
    const { data: especies, isLoading, isError, refetch } = useEspecies()
    const deleteMutation = useDeleteEspecie()

    // State para o sheet
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedEspecie, setSelectedEspecie] = useState<EspecieUsuario | null>(null)

    // State para confirmação de delete
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    const handleAdd = () => {
        setSelectedEspecie(null)
        setIsFormOpen(true)
    }

    const handleEdit = (especie: EspecieUsuario) => {
        setSelectedEspecie(especie)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id)
            setDeleteConfirmId(null)
        } catch (error) {
            console.error('Erro ao excluir:', error)
        }
    }

    const handleCloseForm = () => {
        setIsFormOpen(false)
        setTimeout(() => setSelectedEspecie(null), 300)
    }

    return (
        <>
            <Topbar title="Espécies" showBack />

            <main className="page-content">
                <div className="p-4">
                    {/* Loading */}
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <ErrorState
                            message="Erro ao carregar espécies"
                            onRetry={refetch}
                        />
                    )}

                    {/* Empty */}
                    {!isLoading && !isError && especies?.length === 0 && (
                        <EmptyState
                            icon={<BirdIcon className="w-12 h-12" />}
                            title="Nenhuma espécie cadastrada"
                            description="Cadastre as espécies que você cria para facilitar o gerenciamento."
                            action={{
                                label: 'Cadastrar Espécie',
                                onClick: handleAdd,
                            }}
                        />
                    )}

                    {/* Lista */}
                    {!isLoading && !isError && especies && especies.length > 0 && (
                        <div className="space-y-3">
                            {/* Contador */}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {especies.length} {especies.length === 1 ? 'espécie cadastrada' : 'espécies cadastradas'}
                            </p>

                            {/* Cards */}
                            {especies.map((especie) => {
                                const id = especie.especie_usuario_id || especie.id!
                                const isDeleting = deleteConfirmId === id

                                return (
                                    <div
                                        key={id}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {especie.descr}
                                                </h3>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                    {especie.dias_choco && (
                                                        <span>🥚 {especie.dias_choco} dias choco</span>
                                                    )}
                                                    {especie.dias_anilha && (
                                                        <span>💍 {especie.dias_anilha} dias anilha</span>
                                                    )}
                                                    {especie.dias_separa && (
                                                        <span>🐣 {especie.dias_separa} dias separa</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Ações */}
                                            <div className="flex items-center gap-2 ml-2">
                                                <button
                                                    onClick={() => handleEdit(especie)}
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(isDeleting ? null : id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirmação de Delete */}
                                        {isDeleting && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                                                    Confirma a exclusão desta espécie?
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDelete(id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                                                    >
                                                        {deleteMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
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

            {/* FAB para adicionar */}
            {!isLoading && !isError && (
                <button
                    onClick={handleAdd}
                    className="fixed right-4 bottom-20 z-40 w-14 h-14 bg-blue-500 text-white rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all ring-4 ring-white dark:ring-gray-900"
                    aria-label="Nova Espécie"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            )}

            {/* Sheet de formulário */}
            <EspecieFormSheet
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                especie={selectedEspecie}
            />
        </>
    )
}
