/**
 * Sheet para cadastro rápido de sintoma
 * Usado dentro do formulário de doenças
 */

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { useCreateSintoma } from './sintomasApi'
import type { Sintoma } from '@/types'

interface SintomaQuickAddSheetProps {
    isOpen: boolean
    onClose: () => void
    onSintomaCreated?: (sintoma: Sintoma) => void
}

export function SintomaQuickAddSheet({ isOpen, onClose, onSintomaCreated }: SintomaQuickAddSheetProps) {
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [error, setError] = useState('')

    const createMutation = useCreateSintoma()

    // Resetar form ao abrir/fechar
    useEffect(() => {
        if (isOpen) {
            setNome('')
            setDescricao('')
            setError('')
        }
    }, [isOpen])

    const handleSubmit = async () => {
        if (!nome.trim()) {
            setError('Nome do sintoma é obrigatório')
            return
        }

        try {
            const novoSintoma = await createMutation.mutateAsync({
                nome: nome.trim(),
                descricao: descricao.trim() || null,
            })

            // Notificar parent component
            onSintomaCreated?.(novoSintoma)
            onClose()
        } catch (err) {
            console.error('Erro ao criar sintoma:', err)
            setError('Erro ao criar sintoma. Tente novamente.')
        }
    }

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Sintoma"
        >
            <div className="p-4 space-y-4">
                <Input
                    label="Nome do Sintoma"
                    value={nome}
                    onChange={(e) => {
                        setNome(e.target.value)
                        if (error) setError('')
                    }}
                    placeholder="Ex: Perda de apetite"
                    error={error}
                    required
                    autoFocus
                />

                <Input
                    label="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Ave não se alimenta adequadamente"
                    hint="Opcional"
                />

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
                            'Criar Sintoma'
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
        </BottomSheet>
    )
}
