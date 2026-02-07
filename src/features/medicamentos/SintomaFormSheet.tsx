/**
 * Sheet para adicionar/editar sintoma (formulário completo)
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { useCreateSintoma, useUpdateSintoma, type CreateSintomaPayload } from './sintomasApi'
import type { Sintoma } from '@/types'

interface SintomaFormSheetProps {
    isOpen: boolean
    onClose: () => void
    sintoma?: Sintoma | null // Se fornecido, é edição
}

export function SintomaFormSheet({ isOpen, onClose, sintoma }: SintomaFormSheetProps) {
    const isEditing = !!sintoma

    // Form state
    const [formData, setFormData] = useState<CreateSintomaPayload>({
        nome: '',
        descricao: null,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Mutations
    const createMutation = useCreateSintoma()
    const updateMutation = useUpdateSintoma()

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    // Preencher form quando editar
    useEffect(() => {
        if (sintoma) {
            setFormData({
                nome: sintoma.nome || '',
                descricao: sintoma.descricao ?? null,
            })
        } else {
            setFormData({
                nome: '',
                descricao: null,
            })
        }
        setErrors({})
    }, [sintoma, isOpen])

    const updateField = <K extends keyof CreateSintomaPayload>(
        field: K,
        value: CreateSintomaPayload[K]
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
            newErrors.nome = 'Nome do sintoma é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        try {
            if (isEditing && sintoma) {
                await updateMutation.mutateAsync({
                    sintoma_id: sintoma.sintoma_id || sintoma.id!,
                    ...formData,
                })
            } else {
                await createMutation.mutateAsync(formData)
            }
            onClose()
        } catch (error) {
            console.error('Erro ao salvar sintoma:', error)
        }
    }

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Sintoma' : 'Novo Sintoma'}
        >
            <div className="p-4 space-y-4">
                {/* Nome */}
                <Input
                    label="Nome do Sintoma"
                    value={formData.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder="Ex: Perda de apetite"
                    error={errors.nome}
                    required
                />

                {/* Descrição */}
                <Input
                    label="Descrição"
                    value={formData.descricao ?? ''}
                    onChange={(e) => updateField('descricao', e.target.value || null)}
                    placeholder="Ex: Ave não se alimenta adequadamente"
                    hint="Opcional"
                />

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
                            isEditing ? 'Salvar Alterações' : 'Cadastrar Sintoma'
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
        </BottomSheet>
    )
}
