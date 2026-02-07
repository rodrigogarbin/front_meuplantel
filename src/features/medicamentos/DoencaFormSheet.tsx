/**
 * Sheet para adicionar/editar doença (formulário completo)
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { MultiSelectCheckbox } from '@/components/ui/MultiSelectCheckbox'
import { SintomaQuickAddSheet } from './SintomaQuickAddSheet'
import { useCreateDoenca, useUpdateDoenca, type CreateDoencaPayload } from './doencasApi'
import { useSintomas } from './medicamentosApi'
import type { Doenca, Sintoma } from '@/types'

interface DoencaFormSheetProps {
    isOpen: boolean
    onClose: () => void
    doenca?: Doenca | null // Se fornecido, é edição
}

export function DoencaFormSheet({ isOpen, onClose, doenca }: DoencaFormSheetProps) {
    const isEditing = !!doenca

    // Form state
    const [formData, setFormData] = useState<CreateDoencaPayload>({
        nome: '',
        descricao: null,
        sintoma_ids: [],
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSintomaSheetOpen, setIsSintomaSheetOpen] = useState(false)

    // Mutations e queries
    const createMutation = useCreateDoenca()
    const updateMutation = useUpdateDoenca()
    const { data: sintomas } = useSintomas()

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    // Preencher form quando editar
    useEffect(() => {
        if (doenca) {
            setFormData({
                nome: doenca.nome || '',
                descricao: doenca.descricao ?? null,
                sintoma_ids: doenca.sintomas?.map(s => s.sintoma_id || s.id!) || [],
            })
        } else {
            setFormData({
                nome: '',
                descricao: null,
                sintoma_ids: [],
            })
        }
        setErrors({})
    }, [doenca, isOpen])

    const updateField = <K extends keyof CreateDoencaPayload>(
        field: K,
        value: CreateDoencaPayload[K]
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
            newErrors.nome = 'Nome da doença é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        try {
            if (isEditing && doenca) {
                await updateMutation.mutateAsync({
                    doenca_id: doenca.doenca_id || doenca.id!,
                    ...formData,
                })
            } else {
                await createMutation.mutateAsync(formData)
            }
            onClose()
        } catch (error) {
            console.error('Erro ao salvar doença:', error)
        }
    }

    // Callback quando um novo sintoma é criado
    const handleSintomaCreated = (novoSintoma: Sintoma) => {
        const sintomaId = novoSintoma.sintoma_id || novoSintoma.id!
        updateField('sintoma_ids', [...(formData.sintoma_ids || []), sintomaId])
    }

    // Opções de sintomas para o MultiSelectCheckbox
    const sintomasOptions = (sintomas || []).map(sintoma => ({
        id: sintoma.sintoma_id || sintoma.id!,
        label: sintoma.nome,
        description: sintoma.descricao || undefined,
    }))

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Doença' : 'Nova Doença'}
        >
            <div className="p-4 space-y-4">
                {/* Nome */}
                <Input
                    label="Nome da Doença"
                    value={formData.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder="Ex: Coccidiose"
                    error={errors.nome}
                    required
                />

                {/* Descrição */}
                <Input
                    label="Descrição"
                    value={formData.descricao ?? ''}
                    onChange={(e) => updateField('descricao', e.target.value || null)}
                    placeholder="Ex: Doença parasitária intestinal"
                    hint="Opcional"
                />

                {/* Sintomas Relacionados */}
                <div className="space-y-2">
                    <MultiSelectCheckbox
                        label="Sintomas Relacionados"
                        options={sintomasOptions}
                        value={formData.sintoma_ids || []}
                        onChange={(ids) => updateField('sintoma_ids', ids)}
                        placeholder="Selecione os sintomas"
                        hint="Selecione os sintomas desta doença"
                    />

                    {/* Botão para adicionar novo sintoma */}
                    <button
                        type="button"
                        onClick={() => setIsSintomaSheetOpen(true)}
                        className="w-full py-2 px-3 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar novo sintoma
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
                            isEditing ? 'Salvar Alterações' : 'Cadastrar Doença'
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

            {/* Sheet para adicionar novo sintoma */}
            <SintomaQuickAddSheet
                isOpen={isSintomaSheetOpen}
                onClose={() => setIsSintomaSheetOpen(false)}
                onSintomaCreated={handleSintomaCreated}
            />
        </BottomSheet>
    )
}
