/**
 * Página de Cadastro/Edição de Casal
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { Input } from '@/components/ui/Input'
import { PassaroAutocomplete } from '@/components/ui/PassaroAutocomplete'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useCasal, useCreateCasal, useUpdateCasal } from './casaisApi'
import { useMachos, useFemeas } from '@/features/passaros/passarosApi'
import type { CreateCasalPayload, Passaro } from '@/types'
import { getApiErrorMessage } from '@/lib/errorHandler'

interface FormData {
    nro: string
    passaro_macho_id: number | null
    passaro_femea_id: number | null
    vigen_inicial: string
    descr_pai: string
    descr_mae: string
}

const initialFormData: FormData = {
    nro: '',
    passaro_macho_id: null,
    passaro_femea_id: null,
    vigen_inicial: new Date().toISOString().split('T')[0], // Hoje
    descr_pai: '',
    descr_mae: '',
}

// Componente de campo unificado para Macho/Fêmea
interface PassaroFieldProps {
    label: string
    passaroId: number | null
    descricao: string
    onChangePassaro: (id: number | null) => void
    onChangeDescricao: (value: string) => void
    options: Passaro[]
    isLoading: boolean
    error?: string
    placeholder: string
    descPlaceholder: string
}

function PassaroField({
    label,
    passaroId,
    descricao,
    onChangePassaro,
    onChangeDescricao,
    options,
    isLoading,
    error,
    placeholder,
    descPlaceholder,
}: PassaroFieldProps) {
    // Se tem pássaro selecionado, mostra o autocomplete
    // Se não tem pássaro mas tem descrição, mostra o input de texto
    // Se não tem nenhum, mostra o autocomplete por padrão
    const [showDescInput, setShowDescInput] = useState(false)

    // Atualiza o modo baseado nos dados
    useEffect(() => {
        if (passaroId) {
            setShowDescInput(false)
        } else if (descricao) {
            setShowDescInput(true)
        }
    }, [passaroId, descricao])

    const handleToggle = () => {
        if (showDescInput) {
            // Voltando para autocomplete - limpa descrição
            onChangeDescricao('')
        } else {
            // Indo para descrição - limpa pássaro
            onChangePassaro(null)
        }
        setShowDescInput(!showDescInput)
    }

    return (
        <div className="space-y-3">
            {showDescInput ? (
                <Input
                    label={label}
                    value={descricao}
                    onChange={(e) => onChangeDescricao(e.target.value)}
                    placeholder={descPlaceholder}
                    error={error}
                />
            ) : (
                <PassaroAutocomplete
                    label={label}
                    value={passaroId}
                    onChange={(id) => onChangePassaro(id)}
                    options={options}
                    isLoading={isLoading}
                    error={error}
                    placeholder={placeholder}
                />
            )}
            <button
                type="button"
                onClick={handleToggle}
                className="text-xs text-primary hover:text-primary-dark underline"
            >
                {showDescInput ? 'Selecionar do plantel' : 'Informar descrição (externo)'}
            </button>
        </div>
    )
}

export function CasalFormPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEditing = !!id
    const casalId = id ? Number(id) : null

    // Form state
    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Queries
    const { data: casal, isLoading: loadingCasal, error: errorCasal } = useCasal(casalId)
    const { data: machos = [], isLoading: loadingMachos } = useMachos()
    const { data: femeas = [], isLoading: loadingFemeas } = useFemeas()

    // Mutations
    const createMutation = useCreateCasal()
    const updateMutation = useUpdateCasal()

    const isSubmitting = createMutation.isPending || updateMutation.isPending
    const isLoading = isEditing && loadingCasal

    // Preenche o formulário quando carregar um casal existente
    useEffect(() => {
        if (casal && isEditing) {
            // Garante formato YYYY-MM-DD para o input date
            let vigen_inicial = casal.vigen_inicial || ''
            if (vigen_inicial && vigen_inicial.length > 10) {
                vigen_inicial = vigen_inicial.slice(0, 10)
            }
            setFormData({
                nro: casal.nro?.toString() || '',
                passaro_macho_id: casal.passaro_macho_id ?? null,
                passaro_femea_id: casal.passaro_femea_id ?? null,
                vigen_inicial,
                descr_pai: casal.descr_pai || '',
                descr_mae: casal.descr_mae || '',
            })
        }
    }, [casal, isEditing])

    // Validação do formulário
    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {}

        // Número do casal é obrigatório
        if (!formData.nro.trim()) {
            newErrors.nro = 'Número do casal é obrigatório'
        } else if (isNaN(Number(formData.nro)) || Number(formData.nro) < 1) {
            newErrors.nro = 'Número deve ser maior que 0'
        }

        // Pelo menos macho OU fêmea deve estar preenchido (ou descrições externas)
        const temMacho = formData.passaro_macho_id || formData.descr_pai.trim()
        const temFemea = formData.passaro_femea_id || formData.descr_mae.trim()

        if (!temMacho && !temFemea) {
            newErrors.passaro_macho_id = 'Selecione pelo menos um pássaro'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Submit do formulário
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitError(null)

        if (!validateForm()) return

        const payload: CreateCasalPayload = {
            nro: Number(formData.nro),
            passaro_macho_id: formData.passaro_macho_id || null,
            passaro_femea_id: formData.passaro_femea_id || null,
            vigen_inicial: formData.vigen_inicial || null,
            descr_pai: formData.descr_pai.trim() || null,
            descr_mae: formData.descr_mae.trim() || null,
        }

        try {
            if (isEditing && casalId) {
                await updateMutation.mutateAsync({
                    gaiola_id: casalId,
                    ...payload,
                })
            } else {
                await createMutation.mutateAsync(payload)
            }
            navigate('/casais')
        } catch (error) {
            console.error('Erro ao salvar casal:', error)
            setSubmitError(getApiErrorMessage(error, 'Erro ao salvar casal'))
        }
    }

    // Atualiza campo do formulário
    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Limpa erro do campo
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    // Loading inicial ao editar
    if (isLoading) {
        return (
            <>
                <Topbar title="Carregando..." showBack onBack={() => navigate('/casais')} />
                <main className="page-content">
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-12" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-12" />
                    </div>
                </main>
            </>
        )
    }

    // Erro ao carregar casal existente
    if (errorCasal && isEditing) {
        return (
            <>
                <Topbar title="Erro" showBack onBack={() => navigate('/casais')} />
                <ErrorState
                    title="Erro ao carregar casal"
                    message="Não foi possível carregar os dados do casal."
                    onRetry={() => window.location.reload()}
                />
            </>
        )
    }

    return (
        <>
            <Topbar
                title={isEditing ? 'Editar Casal' : 'Novo Casal'}
                showBack
                onBack={() => navigate('/casais')}
            />

            <main className="page-content pb-safe">
                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Erro de submit */}
                    {submitError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-300">
                            {submitError}
                        </div>
                    )}

                    {/* Número do Casal */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Identificação
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                            <Input
                                label="Número do Casal *"
                                type="number"
                                min={1}
                                value={formData.nro}
                                onChange={(e) => updateField('nro', e.target.value)}
                                error={errors.nro}
                                placeholder="Ex: 1"
                            />
                        </div>
                    </section>

                    {/* Macho */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Macho
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                            <PassaroField
                                label="Macho"
                                passaroId={formData.passaro_macho_id}
                                descricao={formData.descr_pai}
                                onChangePassaro={(id) => updateField('passaro_macho_id', id)}
                                onChangeDescricao={(value) => updateField('descr_pai', value)}
                                options={machos}
                                isLoading={loadingMachos}
                                error={errors.passaro_macho_id}
                                placeholder="Buscar macho..."
                                descPlaceholder="Ex: Macho verde do João"
                            />
                        </div>
                    </section>

                    {/* Fêmea */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Fêmea
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                            <PassaroField
                                label="Fêmea"
                                passaroId={formData.passaro_femea_id}
                                descricao={formData.descr_mae}
                                onChangePassaro={(id) => updateField('passaro_femea_id', id)}
                                onChangeDescricao={(value) => updateField('descr_mae', value)}
                                options={femeas}
                                isLoading={loadingFemeas}
                                placeholder="Buscar fêmea..."
                                descPlaceholder="Ex: Fêmea azul da Maria"
                            />
                        </div>
                    </section>

                    {/* Data de Início */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Vigência
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                            <Input
                                label="Data de Início"
                                type="date"
                                value={formData.vigen_inicial}
                                onChange={(e) => updateField('vigen_inicial', e.target.value)}
                                hint="Data em que o casal foi formado"
                            />
                        </div>
                    </section>

                    {/* Botão de Submit */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Salvando...
                                </span>
                            ) : isEditing ? (
                                'Salvar Alterações'
                            ) : (
                                'Cadastrar Casal'
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </>
    )
}
