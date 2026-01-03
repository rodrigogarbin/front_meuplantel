/**
 * Sheet para adicionar/editar espécie
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { useCreateEspecie, useUpdateEspecie, type CreateEspeciePayload } from '@/features/especies/especiesApi'
import type { EspecieUsuario } from '@/types'

interface EspecieFormSheetProps {
    isOpen: boolean
    onClose: () => void
    especie?: EspecieUsuario | null // Se fornecido, é edição
}

export function EspecieFormSheet({ isOpen, onClose, especie }: EspecieFormSheetProps) {
    const isEditing = !!especie

    // Form state
    const [formData, setFormData] = useState<CreateEspeciePayload>({
        descr: '',
        dias_choco: null,
        dias_anilha: null,
        dias_separa: null,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Mutations
    const createMutation = useCreateEspecie()
    const updateMutation = useUpdateEspecie()

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    // Preencher form quando editar
    useEffect(() => {
        if (especie) {
            setFormData({
                descr: especie.descr || '',
                dias_choco: especie.dias_choco ?? null,
                dias_anilha: especie.dias_anilha ?? null,
                dias_separa: especie.dias_separa ?? null,
            })
        } else {
            setFormData({
                descr: '',
                dias_choco: null,
                dias_anilha: null,
                dias_separa: null,
            })
        }
        setErrors({})
    }, [especie, isOpen])

    const updateField = <K extends keyof CreateEspeciePayload>(
        field: K,
        value: CreateEspeciePayload[K]
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

        if (!formData.descr?.trim()) {
            newErrors.descr = 'Nome é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        try {
            if (isEditing && especie) {
                await updateMutation.mutateAsync({
                    especie_usuario_id: especie.especie_usuario_id || especie.id!,
                    ...formData,
                })
            } else {
                await createMutation.mutateAsync(formData)
            }
            onClose()
        } catch (error) {
            console.error('Erro ao salvar espécie:', error)
        }
    }

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Espécie' : 'Nova Espécie'}
        >
            <div className="p-4 space-y-4">
                {/* Nome */}
                <Input
                    label="Nome da Espécie"
                    value={formData.descr}
                    onChange={(e) => updateField('descr', e.target.value)}
                    placeholder="Ex: Agapornis Roseicollis"
                    error={errors.descr}
                    required
                />

                {/* Dias de Choco */}
                <Input
                    label="Dias de Choco"
                    type="number"
                    value={formData.dias_choco ?? ''}
                    onChange={(e) => updateField('dias_choco', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ex: 23"
                    hint="Número de dias para os ovos chocarem"
                    min={1}
                    max={100}
                />

                {/* Dias para Anilhar */}
                <Input
                    label="Dias para Anilhar"
                    type="number"
                    value={formData.dias_anilha ?? ''}
                    onChange={(e) => updateField('dias_anilha', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ex: 7"
                    hint="Dias após o nascimento para colocar a anilha"
                    min={1}
                    max={60}
                />

                {/* Dias para Separar */}
                <Input
                    label="Dias para Separar"
                    type="number"
                    value={formData.dias_separa ?? ''}
                    onChange={(e) => updateField('dias_separa', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ex: 60"
                    hint="Dias após o nascimento para separar dos pais"
                    min={1}
                    max={180}
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
                            isEditing ? 'Salvar Alterações' : 'Cadastrar Espécie'
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
