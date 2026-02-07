/**
 * Sheet para adicionar/editar medicamento
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { MultiSelectCheckbox } from '@/components/ui/MultiSelectCheckbox'
import { DoencaQuickAddSheet } from './DoencaQuickAddSheet'
import {
    useCreateMedicamento,
    useUpdateMedicamento,
    useDoencas,
} from './medicamentosApi'
import type { Medicamento, CreateMedicamentoPayload, Doenca } from '@/types'

interface MedicamentoFormSheetProps {
    isOpen: boolean
    onClose: () => void
    medicamento?: Medicamento | null // Se fornecido, é edição
}

export function MedicamentoFormSheet({ isOpen, onClose, medicamento }: MedicamentoFormSheetProps) {
    const isEditing = !!medicamento

    // Form state
    const [formData, setFormData] = useState<CreateMedicamentoPayload>({
        nome: '',
        dosagem: null,
        principio_ativo: null,
        doenca_ids: [],
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isDoencaSheetOpen, setIsDoencaSheetOpen] = useState(false)

    // Mutations e queries
    const createMutation = useCreateMedicamento()
    const updateMutation = useUpdateMedicamento()
    const { data: doencas } = useDoencas()

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    // Preencher form quando editar
    useEffect(() => {
        if (medicamento) {
            setFormData({
                nome: medicamento.nome || '',
                dosagem: medicamento.dosagem ?? null,
                principio_ativo: medicamento.principio_ativo ?? null,
                doenca_ids: medicamento.doencas?.map(d => d.doenca_id || d.id!) || [],
            })
        } else {
            setFormData({
                nome: '',
                dosagem: null,
                principio_ativo: null,
                doenca_ids: [],
            })
        }
        setErrors({})
    }, [medicamento, isOpen])

    const updateField = <K extends keyof CreateMedicamentoPayload>(
        field: K,
        value: CreateMedicamentoPayload[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.nome?.trim()) {
            newErrors.nome = 'Nome do medicamento é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        try {
            // Preparar payload garantindo que doenca_ids seja válido
            const payload = {
                nome: formData.nome,
                dosagem: formData.dosagem,
                principio_ativo: formData.principio_ativo,
                doenca_ids: Array.isArray(formData.doenca_ids) && formData.doenca_ids.length > 0
                    ? formData.doenca_ids.filter(id => typeof id === 'number' && !isNaN(id))
                    : [],
            }

            if (isEditing && medicamento) {
                await updateMutation.mutateAsync({
                    medicamento_id: medicamento.medicamento_id || medicamento.id!,
                    ...payload,
                })
            } else {
                await createMutation.mutateAsync(payload)
            }
            onClose()
        } catch (error) {
            console.error('Erro ao salvar medicamento:', error)
        }
    }

    // Opções de doenças para o MultiSelectCheckbox
    const doencasOptions = (doencas || []).map(doenca => ({
        id: doenca.doenca_id || doenca.id!,
        label: doenca.nome,
        description: doenca.descricao || undefined,
    }))

    // Callback quando uma nova doença é criada
    const handleDoencaCreated = (novaDoenca: Doenca) => {
        const doencaId = novaDoenca.doenca_id || novaDoenca.id!
        // Adicionar automaticamente à seleção
        updateField('doenca_ids', [...(formData.doenca_ids || []), doencaId])
    }

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}
        >
            <div className="p-4 space-y-4">
                {/* Nome */}
                <Input
                    label="Nome do Medicamento"
                    value={formData.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder="Ex: Ivermectina"
                    error={errors.nome}
                    required
                />

                {/* Dosagem */}
                <Input
                    label="Dosagem"
                    value={formData.dosagem ?? ''}
                    onChange={(e) => updateField('dosagem', e.target.value || null)}
                    placeholder="Ex: 1ml/litro de água"
                    hint="Dosagem recomendada"
                />

                {/* Princípio Ativo */}
                <Input
                    label="Princípio Ativo"
                    value={formData.principio_ativo ?? ''}
                    onChange={(e) => updateField('principio_ativo', e.target.value || null)}
                    placeholder="Ex: Ivermectina 1%"
                    hint="Substância ativa do medicamento"
                />

                {/* Doenças Relacionadas */}
                <div className="space-y-2">
                    <MultiSelectCheckbox
                        label="Doenças Relacionadas"
                        options={doencasOptions}
                        value={formData.doenca_ids || []}
                        onChange={(ids) => updateField('doenca_ids', ids)}
                        placeholder="Selecione as doenças"
                        hint="Selecione as doenças que este medicamento trata"
                    />

                    {/* Botão para adicionar nova doença */}
                    <button
                        type="button"
                        onClick={() => setIsDoencaSheetOpen(true)}
                        className="w-full py-2 px-3 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar nova doença
                    </button>
                </div>

                {/* Botões */}
                <div className="pt-4 space-y-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Salvando...
                            </>
                        ) : (
                            isEditing ? 'Salvar Alterações' : 'Cadastrar Medicamento'
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

            {/* Sheet para adicionar nova doença */}
            <DoencaQuickAddSheet
                isOpen={isDoencaSheetOpen}
                onClose={() => setIsDoencaSheetOpen(false)}
                onDoencaCreated={handleDoencaCreated}
            />
        </BottomSheet>
    )
}
