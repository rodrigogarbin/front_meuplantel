/**
 * Página de gerenciamento de Medicamentos
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { useMedicamentos, useDoencas, useSintomas, useDeleteMedicamento } from './medicamentosApi'
import { MedicamentoFormSheet } from './MedicamentoFormSheet'
import type { Medicamento } from '@/types'

// Ícones
function PillIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
}

function HeartPulseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
}

function AlertCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

export function MedicamentosPage() {
    const navigate = useNavigate()

    // Filtros
    const [search, setSearch] = useState('')
    const [doencaId, setDoencaId] = useState<number | undefined>()
    const [sintomaId, setSintomaId] = useState<number | undefined>()

    // Queries
    const { data: medicamentos, isLoading, isError, refetch } = useMedicamentos({ search, doenca_id: doencaId, sintoma_id: sintomaId })
    const { data: doencas } = useDoencas()
    const { data: sintomas } = useSintomas()
    const deleteMutation = useDeleteMedicamento()

    // Sheet state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedMedicamento, setSelectedMedicamento] = useState<Medicamento | null>(null)

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    const handleAdd = () => {
        setSelectedMedicamento(null)
        setIsFormOpen(true)
    }

    const handleEdit = (medicamento: Medicamento) => {
        setSelectedMedicamento(medicamento)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id)
            setDeleteConfirmId(null)
        } catch (error) {
            console.error('Erro ao excluir medicamento:', error)
        }
    }

    const handleCloseForm = () => {
        setIsFormOpen(false)
        setTimeout(() => setSelectedMedicamento(null), 300)
    }

    return (
        <MainLayout>
            <Topbar title="Medicamentos" showBack />

            <main className="page-content">
                <div className="p-4">
                    {/* Filtros */}
                    <div className="space-y-3 mb-4">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar medicamento..."
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Doença"
                                value={doencaId?.toString() || ''}
                                onChange={(value) => setDoencaId(value ? Number(value) : undefined)}
                                options={[
                                    { value: '', label: 'Todas' },
                                    ...(doencas || []).map(d => ({
                                        value: (d.doenca_id || d.id!).toString(),
                                        label: d.nome,
                                    })),
                                ]}
                            />

                            <Select
                                label="Sintoma"
                                value={sintomaId?.toString() || ''}
                                onChange={(value) => setSintomaId(value ? Number(value) : undefined)}
                                options={[
                                    { value: '', label: 'Todos' },
                                    ...(sintomas || []).map(s => ({
                                        value: (s.sintoma_id || s.id!).toString(),
                                        label: s.nome,
                                    })),
                                ]}
                            />
                        </div>
                    </div>

                    {/* Gerenciar Catálogos */}
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gerenciar Catálogos
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/doencas')}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <HeartPulseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        Doenças
                                    </span>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </button>

                            <button
                                onClick={() => navigate('/sintomas')}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertCircleIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        Sintomas
                                    </span>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

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
                            title="Erro ao carregar medicamentos"
                            message="Não foi possível carregar a lista de medicamentos."
                            onRetry={refetch}
                        />
                    )}

                    {/* Empty */}
                    {!isLoading && !isError && medicamentos?.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <div className="flex justify-center mb-4">
                                <PillIcon className="w-16 h-16 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {search || doencaId || sintomaId
                                    ? "Nenhum medicamento encontrado"
                                    : "Comece seu cadastro de medicamentos"
                                }
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                {search || doencaId || sintomaId
                                    ? "Nenhum medicamento encontrado com os filtros aplicados. Tente ajustar os filtros ou limpar a busca."
                                    : "Agora você pode cadastrar os medicamentos e vitaminas que você utiliza. De uma forma fácil, pode adicionar as doenças e sintomas, para que numa emergência você possa consultar rapidamente as informações necessárias."
                                }
                            </p>
                            {!search && !doencaId && !sintomaId && (
                                <button
                                    onClick={handleAdd}
                                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Cadastrar primeiro medicamento
                                </button>
                            )}
                        </div>
                    )}

                    {/* Lista */}
                    {!isLoading && !isError && medicamentos && medicamentos.length > 0 && (
                        <div className="space-y-3">
                            {medicamentos.map((medicamento) => {
                                const id = medicamento.medicamento_id || medicamento.id!
                                const isDeleting = deleteConfirmId === id

                                return (
                                    <div
                                        key={id}
                                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {medicamento.nome}
                                                </h3>
                                                {medicamento.dosagem && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {medicamento.dosagem}
                                                    </p>
                                                )}
                                                {medicamento.principio_ativo && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                        {medicamento.principio_ativo}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(medicamento)}
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

                                        {/* Doenças */}
                                        {medicamento.doencas && medicamento.doencas.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {medicamento.doencas.map((doenca) => (
                                                    <span
                                                        key={doenca.doenca_id || doenca.id}
                                                        className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                                                    >
                                                        {doenca.nome}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Confirmação de delete */}
                                        {isDeleting && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                                                    Confirma a exclusão deste medicamento?
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
            <MedicamentoFormSheet
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                medicamento={selectedMedicamento}
            />
        </MainLayout>
    )
}
