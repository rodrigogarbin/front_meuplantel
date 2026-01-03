/**
 * Componente EditPosturaSheet
 * Bottom sheet para editar ovo (postura) existente
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Casal, Postura } from '@/types'
import { SitPostura, SitPosturaLabels } from '@/types'
import { BottomSheet } from '@/components/ui'
import { useUpdatePostura, useDeletePostura } from './casaisApi'

interface EditPosturaSheetProps {
    casal: Casal | null
    postura: Postura | null
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

// Ícone de ovo
function EggIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C6.5 2 4 6 4 10c0 4.5 2.5 8 6 8s6-3.5 6-8c0-4-2.5-8-6-8z" />
        </svg>
    )
}

// Opções de situação
const situacaoOptions = [
    { value: SitPostura.CHOCO, label: SitPosturaLabels[SitPostura.CHOCO], color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: SitPostura.FERTIL, label: SitPosturaLabels[SitPostura.FERTIL], color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: SitPostura.NASCIDO, label: SitPosturaLabels[SitPostura.NASCIDO], color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: SitPostura.BRANCO, label: SitPosturaLabels[SitPostura.BRANCO], color: 'bg-gray-100 text-gray-600 border-gray-300' },
    { value: SitPostura.EMBRIAO_MORTO, label: SitPosturaLabels[SitPostura.EMBRIAO_MORTO], color: 'bg-red-100 text-red-700 border-red-300' },
    { value: SitPostura.FILHOTE_MORTO, label: SitPosturaLabels[SitPostura.FILHOTE_MORTO], color: 'bg-red-100 text-red-700 border-red-300' },
]

export function EditPosturaSheet({ casal, postura, isOpen, onClose, onSuccess }: EditPosturaSheetProps) {
    const navigate = useNavigate()
    const updatePostura = useUpdatePostura()
    const deletePostura = useDeletePostura()

    // Estado do formulário
    const [data, setData] = useState('')
    const [sit, setSit] = useState<number>(SitPostura.CHOCO)
    const [dataNasc, setDataNasc] = useState('')
    const [obs, setObs] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Campos do anel (para nascidos)
    const [nroAnel, setNroAnel] = useState<string>('')
    const [anoAnel, setAnoAnel] = useState<string>(new Date().getFullYear().toString())

    // Data atual formatada para input date (YYYY-MM-DD)
    const hoje = new Date().toISOString().split('T')[0]

    // Preenche o form quando abre com dados da postura
    useEffect(() => {
        if (isOpen && postura) {
            setData(postura.data?.split('T')[0] ?? '')
            setSit(postura.sit ?? SitPostura.CHOCO)
            // Data de nascimento: usa a existente ou sugere data atual
            setDataNasc(postura.data_nasc?.split('T')[0] ?? hoje)
            setObs(postura.obs ?? '')
            setShowDeleteConfirm(false)

            // Campos do anel
            setNroAnel(postura.nro_anel?.toString() ?? '')
            setAnoAnel(postura.ano_anel?.toString() ?? new Date().getFullYear().toString())
        }
    }, [isOpen, postura, hoje])

    if (!casal || !postura) return null

    // Obtém o ID do casal
    const casalId = casal.id ?? casal.gaiola_id
    if (!casalId) return null

    // Obtém dias de choco da espécie
    const diasChoco = casal.macho?.especie_usuario?.dias_choco
        ?? casal.macho?.especieUsuario?.dias_choco
        ?? casal.femea?.especie_usuario?.dias_choco
        ?? casal.femea?.especieUsuario?.dias_choco
        ?? null

    // Calcula previsão de nascimento
    const calcPrevisao = (): string | null => {
        if (!data || !diasChoco) return null
        try {
            const dataPostura = new Date(data)
            if (isNaN(dataPostura.getTime())) return null
            dataPostura.setDate(dataPostura.getDate() + diasChoco)
            const day = dataPostura.getDate().toString().padStart(2, '0')
            const month = (dataPostura.getMonth() + 1).toString().padStart(2, '0')
            const year = dataPostura.getFullYear()
            return `${day}/${month}/${year}`
        } catch {
            return null
        }
    }

    const previsaoNascimento = calcPrevisao()

    const handleSubmit = async () => {
        if (!data) return

        try {
            await updatePostura.mutateAsync({
                casalId,
                posturaId: postura.postura_id,
                payload: {
                    data,
                    sit,
                    data_nasc: dataNasc || null,
                    obs: obs || null,
                    // Campos do anel (apenas se nascido)
                    nro_anel: sit === SitPostura.NASCIDO && nroAnel ? parseInt(nroAnel, 10) : null,
                    ano_anel: sit === SitPostura.NASCIDO && anoAnel ? parseInt(anoAnel, 10) : null,
                },
            })

            onClose()
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao atualizar ovo:', error)
        }
    }

    const handleDelete = async () => {
        try {
            await deletePostura.mutateAsync({
                casalId,
                posturaId: postura.postura_id,
            })

            onClose()
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao excluir ovo:', error)
        }
    }

    const isLoading = updatePostura.isPending || deletePostura.isPending

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Editar Ovo">
            <div className="space-y-6">
                {/* Header visual */}
                <div className="flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <EggIcon className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Campo: Data da Postura */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data da Postura *
                    </label>
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-lg"
                    />
                </div>

                {/* Previsão de Nascimento */}
                {previsaoNascimento && sit === SitPostura.CHOCO && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-amber-700 dark:text-amber-300">Previsão de Nascimento</p>
                                <p className="text-lg font-bold text-amber-800 dark:text-amber-200">{previsaoNascimento}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">{diasChoco} dias de choco</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Campo: Situação */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Situação *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {situacaoOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSit(option.value)}
                                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${sit === option.value
                                    ? option.color + ' border-current'
                                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campo: Data de Nascimento (apenas se nascido) */}
                {sit === SitPostura.NASCIDO && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Data de Nascimento
                            </label>
                            <input
                                type="date"
                                value={dataNasc}
                                onChange={(e) => setDataNasc(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg"
                            />
                        </div>

                        {/* Campos do Anel */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 space-y-4">
                            <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Dados do Anel (opcional)
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Número do Anel
                                    </label>
                                    <input
                                        type="number"
                                        value={nroAnel}
                                        onChange={(e) => setNroAnel(e.target.value)}
                                        placeholder="Ex: 001"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Ano do Anel
                                    </label>
                                    <input
                                        type="number"
                                        value={anoAnel}
                                        onChange={(e) => setAnoAnel(e.target.value)}
                                        placeholder={new Date().getFullYear().toString()}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Informe os dados do anel para identificar o filhote
                            </p>
                        </div>

                        {/* Botão Registrar Pássaro */}
                        {postura.sit === SitPostura.NASCIDO && !postura.passaro_id && (
                            <button
                                onClick={() => {
                                    // Passa apenas o ID da postura - os demais dados serão buscados
                                    const params = new URLSearchParams()
                                    params.set('postura_id', postura.postura_id.toString())

                                    onClose()
                                    navigate(`/passaros/novo?${params.toString()}`)
                                }}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/30"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Registrar Pássaro
                            </button>
                        )}

                        {/* Indicador se já foi registrado */}
                        {postura.sit === SitPostura.NASCIDO && postura.passaro_id && (
                            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Pássaro registrado</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">Este filhote já foi cadastrado no plantel</p>
                                </div>
                                <button
                                    onClick={() => {
                                        onClose()
                                        navigate(`/passaros?id=${postura.passaro_id}`)
                                    }}
                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Campo: Observações */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                    </label>
                    <textarea
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                        placeholder="Observações sobre o ovo..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                    />
                </div>

                {/* Erro */}
                {(updatePostura.isError || deletePostura.isError) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                        Erro ao processar. Tente novamente.
                    </div>
                )}

                {/* Botões */}
                <div className="space-y-3 pt-2">
                    {/* Salvar */}
                    <button
                        onClick={handleSubmit}
                        disabled={!data || isLoading}
                        className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updatePostura.isPending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Salvar Alterações
                            </>
                        )}
                    </button>

                    {/* Excluir */}
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isLoading}
                            className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir Ovo
                        </button>
                    ) : (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-300 text-center">
                                Tem certeza que deseja excluir este ovo?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isLoading}
                                    className="flex-1 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {deletePostura.isPending ? (
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : (
                                        'Confirmar'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cancelar */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}
