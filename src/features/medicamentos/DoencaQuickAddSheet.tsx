/**
 * Sheet para cadastro rápido de doença
 * Usado dentro do formulário de medicamentos
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { MultiSelectCheckbox } from '@/components/ui/MultiSelectCheckbox'
import { SintomaQuickAddSheet } from './SintomaQuickAddSheet'
import { useCreateDoenca } from './doencasApi'
import { useSintomas } from './medicamentosApi'
import type { Doenca, Sintoma } from '@/types'

interface DoencaQuickAddSheetProps {
    isOpen: boolean
    onClose: () => void
    onDoencaCreated?: (doenca: Doenca) => void
}

export function DoencaQuickAddSheet({ isOpen, onClose, onDoencaCreated }: DoencaQuickAddSheetProps) {
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [sintomaIds, setSintomaIds] = useState<number[]>([])
    const [error, setError] = useState('')
    const [isSintomaSheetOpen, setIsSintomaSheetOpen] = useState(false)

    const createMutation = useCreateDoenca()
    const { data: sintomas } = useSintomas()

    // Resetar form ao abrir/fechar
    useEffect(() => {
        if (isOpen) {
            setNome('')
            setDescricao('')
            setSintomaIds([])
            setError('')
        }
    }, [isOpen])

    const handleSubmit = async () => {
        if (!nome.trim()) {
            setError('Nome da doença é obrigatório')
            return
        }

        try {
            const novaDoenca = await createMutation.mutateAsync({
                nome: nome.trim(),
                descricao: descricao.trim() || null,
                sintoma_ids: sintomaIds.length > 0 ? sintomaIds : undefined,
            })

            // Notificar parent component
            onDoencaCreated?.(novaDoenca)
            onClose()
        } catch (err) {
            console.error('Erro ao criar doença:', err)
            setError('Erro ao criar doença. Tente novamente.')
        }
    }

    // Callback quando um novo sintoma é criado
    const handleSintomaCreated = (novoSintoma: Sintoma) => {
        const sintomaId = novoSintoma.sintoma_id || novoSintoma.id!
        // Adicionar automaticamente à seleção
        setSintomaIds(prev => [...prev, sintomaId])
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
            title="Nova Doença"
        >
            <div className="p-4 space-y-4">
                <Input
                    label="Nome da Doença"
                    value={nome}
                    onChange={(e) => {
                        setNome(e.target.value)
                        if (error) setError('')
                    }}
                    placeholder="Ex: Coccidiose"
                    error={error}
                    required
                    autoFocus
                />

                <Input
                    label="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Doença parasitária intestinal"
                    hint="Opcional"
                />

                {/* Sintomas Relacionados */}
                <div className="space-y-2">
                    <MultiSelectCheckbox
                        label="Sintomas Relacionados"
                        options={sintomasOptions}
                        value={sintomaIds}
                        onChange={setSintomaIds}
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
                        disabled={createMutation.isPending}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {createMutation.isPending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Criando...
                            </>
                        ) : (
                            'Criar Doença'
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={createMutation.isPending}
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
