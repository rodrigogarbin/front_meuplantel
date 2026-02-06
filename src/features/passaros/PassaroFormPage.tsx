/**
 * Página de Cadastro/Edição de Pássaro
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errorHandler'

// Hook para buscar mutações por especie_usuario_id usando React Query
function useMutacoesPorEspecie(especie_usuario_id: string | number | null) {
    return useQuery({
        queryKey: ['mutacoes', especie_usuario_id],
        queryFn: async () => {
            if (!especie_usuario_id) return []
            const res = await api.get<any>(`/api/v1/mutacoes?especie_usuario_id=${especie_usuario_id}`)

            if (res.status !== 200) return []
            const data = await res.data
            if (!Array.isArray(data)) return []
            return data.map((m: any) => ({ descr: m.descricao || '' })).filter((m: any) => m.descr)
        },
        enabled: !!especie_usuario_id,
        staleTime: 1000 * 60,
    })
}

interface AutocompleteMutacaoProps {
    label?: string
    name?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    hint?: string
    options: { descr: string }[]
}

function AutocompleteMutacao({ label, name, value, onChange, placeholder, hint, options }: AutocompleteMutacaoProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value || '')
    const [highlighted, setHighlighted] = useState<number>(-1)
    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setInputValue(value || '')
    }, [value])

    const filtered = inputValue
        ? options.filter(opt => opt.descr.toLowerCase().includes(inputValue.toLowerCase()))
        : options

    const handleSelect = (descr: string) => {
        setInputValue(descr)
        onChange(descr)
        setIsOpen(false)
        setHighlighted(-1)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || filtered.length === 0) return
        if (e.key === 'ArrowDown') {
            setHighlighted(h => Math.min(h + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            setHighlighted(h => Math.max(h - 1, 0))
        } else if (e.key === 'Enter' && highlighted >= 0) {
            handleSelect(filtered[highlighted].descr)
        } else if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    return (
        <div className="w-full relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                name={name}
                value={inputValue}
                onChange={e => {
                    setInputValue(e.target.value)
                    onChange(e.target.value)
                    setIsOpen(true)
                    setHighlighted(-1)
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary border-gray-300 dark:border-gray-600"
                autoComplete="off"
            />
            {isOpen && filtered.length > 0 && (
                <div className="absolute z-[9999] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                    {filtered.map((opt, idx) => (
                        <button
                            key={opt.descr}
                            type="button"
                            onMouseDown={() => handleSelect(opt.descr)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${highlighted === idx ? 'bg-primary/10 text-primary' : inputValue === opt.descr ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'}`}
                        >
                            {opt.descr}
                        </button>
                    ))}
                </div>
            )}
            {hint && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            )}
        </div>
    )
}
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TagsInput } from '@/components/ui/TagsInput'
import { PassaroAutocomplete } from '@/components/ui/PassaroAutocomplete'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { usePassaro, useCreatePassaro, useUpdatePassaro, useMachos, useFemeas, useUploadPassaroFoto } from './passarosApi'
import { useEspecies } from '@/features/especies'
import { usePostura } from '@/features/casais'
import { useUserProfile } from '@/features/auth'
import { SexoEnum, SexoLabels, SituacaoEnum, SituacaoLabels, PortadorTipo } from '@/types'
import type { CreatePassaroPayload, Portador } from '@/types'
import { getFotoUrl } from '@/lib/passaro'
import { API_BASE_URL } from '@/lib/api'

// Opções de sexo para o segmented control
const sexoOptions = [
    { value: SexoEnum.MACHO, label: SexoLabels[SexoEnum.MACHO] },
    { value: SexoEnum.FEMEA, label: SexoLabels[SexoEnum.FEMEA] },
    { value: SexoEnum.INDEFINIDO, label: SexoLabels[SexoEnum.INDEFINIDO] },
]

// Opções de situação para o select
const situacaoOptions = Object.entries(SituacaoLabels).map(([value, label]) => ({
    value: Number(value),
    label,
}))

interface FormData {
    // Anel
    ano: string
    nro: string
    nro_criador: string
    sg_clube: string
    // Pássaro
    sexo: number
    dt_nasc: string
    especie_usuario_id: string
    descr: string
    passaro_pai_id: number | null
    passaro_mae_id: number | null
    sit: number
    obs: string
    portador: string[]
    pportador: string[]
}

const initialFormData: FormData = {
    ano: new Date().getFullYear().toString(),
    nro: '',
    nro_criador: '',
    sg_clube: '',
    sexo: SexoEnum.INDEFINIDO,
    dt_nasc: '',
    especie_usuario_id: '',
    descr: '',
    passaro_pai_id: null,
    passaro_mae_id: null,
    sit: SituacaoEnum.ATIVO,
    obs: '',
    portador: [],
    pportador: [],
}

export function PassaroFormPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const isEditing = !!id
    const passaroId = id ? Number(id) : null

    // ID da postura (vindo de registro de filhote)
    const posturaIdParam = searchParams.get('postura_id')
    const posturaId = posturaIdParam ? Number(posturaIdParam) : null

    // Busca perfil do usuário para preencher sg_clube e nro_criador
    const { data: userProfile } = useUserProfile()

    // Form state
    const [formData, setFormData] = useState<FormData>(initialFormData)
    // Buscar mutações da espécie selecionada (deve ser depois de formData)
    const { data: mutacoesSugestoes = [], isLoading: loadingMutacoes } = useMutacoesPorEspecie(formData.especie_usuario_id)
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Estado para foto
    const [fotoSelecionada, setFotoSelecionada] = useState<File | null>(null)
    const [fotoPreview, setFotoPreview] = useState<string | null>(null)

    // Queries
    const { data: passaro, isLoading: loadingPassaro, error: errorPassaro } = usePassaro(passaroId)
    const { data: especies = [], isLoading: loadingEspecies } = useEspecies()
    const { data: machos = [], isLoading: loadingMachos } = useMachos()
    const { data: femeas = [], isLoading: loadingFemeas } = useFemeas()

    // Busca dados da postura (quando vem de registro de filhote)
    const { data: postura, isLoading: loadingPostura } = usePostura(posturaId)

    // Mutations
    const createMutation = useCreatePassaro()
    const updateMutation = useUpdatePassaro()
    const uploadFotoMutation = useUploadPassaroFoto()

    const isSubmitting = createMutation.isPending || updateMutation.isPending || uploadFotoMutation.isPending
    const isLoading = (isEditing && loadingPassaro) || (!isEditing && posturaId && loadingPostura)

    // Pré-preenche o formulário com dados da postura (quando vem de registro de filhote)
    useEffect(() => {
        if (!isEditing && postura && posturaId) {
            // Extrai dados do casal (pais e espécie)
            const paiId = postura.casal?.macho?.id
            const maeId = postura.casal?.femea?.id
            const especieId = postura.casal?.macho?.especie_usuario_id ?? postura.casal?.femea?.especie_usuario_id

            setFormData(prev => ({
                ...prev,
                nro: postura.nro_anel?.toString() || prev.nro,
                ano: postura.ano_anel?.toString() || prev.ano,
                dt_nasc: postura.data_nasc || prev.dt_nasc,
                especie_usuario_id: especieId?.toString() || prev.especie_usuario_id,
                passaro_pai_id: paiId ?? prev.passaro_pai_id,
                passaro_mae_id: maeId ?? prev.passaro_mae_id,
            }))
        }
    }, [isEditing, postura, posturaId, machos, femeas])

    // Atualiza sg_clube e nro_criador quando o perfil carregar (para novos cadastros)
    useEffect(() => {
        if (!isEditing && userProfile) {
            setFormData(prev => ({
                ...prev,
                sg_clube: prev.sg_clube || userProfile.sg_clube || '',
                nro_criador: prev.nro_criador || String(userProfile.nro_criador ?? ''),
            }))
        }
    }, [userProfile, isEditing])

    // Preenche o formulário quando carregar um pássaro existente
    useEffect(() => {
        if (passaro && isEditing) {
            // Parse portadores do JSON
            let portadorList: string[] = []
            let pportadorList: string[] = []

            if (passaro.portador) {
                try {
                    const portadores: Portador[] = JSON.parse(passaro.portador)
                    portadorList = portadores
                        .filter((p) => p.tp === PortadorTipo.PORTADOR)
                        .map((p) => p.descr)
                    pportadorList = portadores
                        .filter((p) => p.tp === PortadorTipo.POSSIVEL_PORTADOR)
                        .map((p) => p.descr)
                } catch {
                    // Ignora erro de parse
                }
            }

            setFormData({
                ano: passaro.anel?.ano?.toString() || '',
                nro: passaro.anel?.nro?.toString() || '',
                nro_criador: passaro.anel?.nro_criador || '',
                sg_clube: passaro.anel?.sg_clube || '',
                sexo: passaro.sexo ?? SexoEnum.INDEFINIDO,
                dt_nasc: passaro.dt_nasc ? passaro.dt_nasc.slice(0, 10) : '',
                especie_usuario_id:
                    (passaro.especie_usuario_id
                        ?? passaro.especie_usuario?.especie_usuario_id
                        ?? passaro.especieUsuario?.especie_usuario_id
                    )?.toString() || '',
                descr: passaro.mutacao?.descr
                    || passaro.descr
                    || passaro.mutacao?.descricao
                    || '',
                passaro_pai_id: (passaro.passaro_pai_id
                    ?? passaro.pai?.passaro_id) || null,
                passaro_mae_id: (passaro.passaro_mae_id
                    ?? passaro.mae?.passaro_id) || null,
                sit: passaro.sit ?? SituacaoEnum.ATIVO,
                obs: passaro.obs || '',
                portador: portadorList,
                pportador: pportadorList,
            })

            // Carrega foto existente para preview
            if (passaro.foto) {
                const fotoUrl = getFotoUrl(passaro.foto, API_BASE_URL)
                if (fotoUrl) {
                    setFotoPreview(fotoUrl)
                }
            }
        }
    }, [passaro, isEditing])

    // Handler para seleção de foto
    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Valida tipo de arquivo
            if (!file.type.startsWith('image/')) {
                setSubmitError('Por favor, selecione uma imagem válida')
                return
            }

            // Valida tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setSubmitError('A foto não pode ter mais de 5MB')
                return
            }

            setFotoSelecionada(file)

            // Gera preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setFotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)

            setSubmitError(null)
        }
    }

    // Handler para remover foto
    const handleRemoverFoto = () => {
        setFotoSelecionada(null)
        setFotoPreview(null)
    }

    // Validação do formulário
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {}

        if (!formData.ano || isNaN(Number(formData.ano))) {
            newErrors.ano = 'Ano do anel é obrigatório'
        } else {
            const ano = Number(formData.ano)
            if (ano < 1990 || ano > new Date().getFullYear() + 1) {
                newErrors.ano = 'Ano inválido'
            }
        }

        if (!formData.nro || isNaN(Number(formData.nro)) || Number(formData.nro) < 1) {
            newErrors.nro = 'Número do anel é obrigatório'
        }

        // Sexo pode ser macho, fêmea ou indefinido - todos são válidos

        if (!formData.dt_nasc) {
            newErrors.dt_nasc = 'Data de nascimento é obrigatória'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Monta o payload para a API
    const buildPayload = (): CreatePassaroPayload => {
        // Monta JSON de portadores
        const portadores: Portador[] = [
            ...formData.portador.map((descr) => ({ descr, tp: PortadorTipo.PORTADOR })),
            ...formData.pportador.map((descr) => ({ descr, tp: PortadorTipo.POSSIVEL_PORTADOR })),
        ]

        // Garante que nro_criador seja string ou null
        const nroCriador = formData.nro_criador ? String(formData.nro_criador).trim() : null

        return {
            ano: Number(formData.ano),
            nro: Number(formData.nro),
            nro_criador: nroCriador,
            sg_clube: formData.sg_clube ? formData.sg_clube.toUpperCase().trim() : null,
            sexo: formData.sexo,
            dt_nasc: formData.dt_nasc,
            especie_usuario_id: formData.especie_usuario_id ? Number(formData.especie_usuario_id) : null,
            descr: formData.descr || null,
            passaro_pai_id: formData.passaro_pai_id,
            passaro_mae_id: formData.passaro_mae_id,
            sit: formData.sit,
            obs: formData.obs || null,
            portador: portadores.length > 0 ? JSON.stringify(portadores) : null,
        }
    }

    // Submit do formulário
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitError(null)

        if (!validate()) {
            return
        }

        const payload = buildPayload()

        // ID do casal para redirecionar de volta (da postura ou do parâmetro)
        const gaiolaId = postura?.casal_id ?? searchParams.get('gaiola_id')

        try {
            let finalPassaroId = passaroId

            // 1. Cria ou atualiza o pássaro
            if (isEditing && passaroId) {
                await updateMutation.mutateAsync({ ...payload, passaro_id: passaroId })
            } else {
                const novoPasso = await createMutation.mutateAsync(payload)
                finalPassaroId = novoPasso.passaro_id
            }

            // 2. Faz upload da foto se houver uma selecionada
            if (fotoSelecionada && finalPassaroId) {
                await uploadFotoMutation.mutateAsync({
                    passaro_id: finalPassaroId,
                    foto: fotoSelecionada,
                })
            }

            // Redireciona para o casal se veio de lá, senão para a lista de pássaros
            if (gaiolaId) {
                navigate(`/casais?casal=${gaiolaId}`)
            } else {
                navigate('/passaros')
            }
        } catch (error) {
            setSubmitError(getApiErrorMessage(error, 'Ocorreu um erro ao salvar. Tente novamente.'))
        }
    }

    // Atualiza campo do formulário
    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Limpa erro do campo ao editar
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    // Opções de espécie para o select (API v1 retorna 'id', legado usa 'especie_usuario_id')
    const especieOptions = especies.map((esp) => ({
        value: esp.id ?? esp.especie_usuario_id!,
        label: esp.descr || 'Sem nome',
    }))

    // Função para voltar (para o casal se veio de lá, senão para lista)
    const handleBack = () => {
        // Prioridade: postura.casal_id > gaiola_id do searchParams
        const gaiolaId = postura?.casal_id ?? searchParams.get('gaiola_id')

        // Se temos um posturaId mas a postura ainda está carregando, aguarda
        // Isso evita redirecionar para /passaros enquanto carrega
        if (posturaId && loadingPostura) {
            return
        }

        if (gaiolaId) {
            navigate(`/casais?casal=${gaiolaId}`)
        } else {
            navigate('/passaros')
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Topbar
                    title="Carregando..."
                    showBack
                    onBack={handleBack}
                />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                </div>
            </div>
        )
    }

    // Error state (pássaro não encontrado)
    if (isEditing && errorPassaro) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Topbar
                    title="Erro"
                    showBack
                    onBack={handleBack}
                />
                <ErrorState
                    title="Pássaro não encontrado"
                    message="Não foi possível carregar os dados do pássaro."
                    onRetry={handleBack}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
            <Topbar
                title={isEditing ? 'Editar Pássaro' : 'Novo Pássaro'}
                showBack
                onBack={handleBack}
            />

            <form onSubmit={handleSubmit} className="px-4 py-6 max-w-2xl mx-auto space-y-6">
                {/* Erro de submit */}
                {submitError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{submitError}</span>
                    </div>
                )}

                {/* Card: Foto */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Foto do Pássaro
                        </h2>
                    </div>
                    <div className="p-4">
                        {fotoPreview ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                    <img
                                        src={fotoPreview}
                                        alt="Preview da foto"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoverFoto}
                                    className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Remover foto
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <label
                                    htmlFor="foto-input"
                                    className="w-48 h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-900/30"
                                >
                                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clique para adicionar foto</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">JPEG, PNG ou WEBP até 5MB</span>
                                </label>
                                <input
                                    id="foto-input"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFotoChange}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Card: Identificação */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Identificação
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        {especies.length === 0 && !loadingEspecies ? (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Espécie
                                </label>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                                        Nenhuma espécie cadastrada ainda.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/config/especies')}
                                        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline"
                                    >
                                        Cadastrar espécie →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Select
                                label="Espécie"
                                name="especie_usuario_id"
                                value={formData.especie_usuario_id}
                                onChange={(e) => updateField('especie_usuario_id', e.target.value)}
                                options={especieOptions}
                                placeholder="Selecione uma espécie"
                                disabled={loadingEspecies}
                            />
                        )}

                        {/* Autocomplete de mutação para descrição */}
                        <AutocompleteMutacao
                            label="Descrição/Mutação"
                            name="descr"
                            value={formData.descr}
                            onChange={(value: string) => updateField('descr', value)}
                            placeholder={loadingMutacoes ? 'Carregando mutações...' : 'Ex: Verde Pastel'}
                            hint="Digite a mutação ou descrição do pássaro"
                            options={mutacoesSugestoes}
                        />
                    </div>
                </section>

                {/* Card: Dados do Anel */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Dados do Anel
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Sigla Clube"
                                name="sg_clube"
                                value={formData.sg_clube}
                                onChange={(e) => updateField('sg_clube', e.target.value.toUpperCase())}
                                placeholder="Ex: FOB"
                                maxLength={10}
                            />

                            <Input
                                label="Nº Criador"
                                name="nro_criador"
                                value={formData.nro_criador}
                                onChange={(e) => updateField('nro_criador', e.target.value)}
                                placeholder="Ex: 123"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nº Anel"
                                name="nro"
                                type="number"
                                value={formData.nro}
                                onChange={(e) => updateField('nro', e.target.value)}
                                placeholder="Ex: 1"
                                error={errors.nro}
                                required
                            />

                            <Input
                                label="Ano Anel"
                                name="ano"
                                type="number"
                                value={formData.ano}
                                onChange={(e) => updateField('ano', e.target.value)}
                                placeholder="Ex: 2024"
                                min={1990}
                                max={new Date().getFullYear() + 1}
                                error={errors.ano}
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* Card: Informações do Pássaro */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Informações
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <Input
                            label="Data de Nascimento"
                            name="dt_nasc"
                            type="date"
                            value={formData.dt_nasc}
                            onChange={(e) => updateField('dt_nasc', e.target.value)}
                            error={errors.dt_nasc}
                            required
                        />

                        <SegmentedControl
                            label="Sexo"
                            options={sexoOptions}
                            value={formData.sexo}
                            onChange={(value) => updateField('sexo', value as number)}
                            error={errors.sexo}
                            required
                        />

                        <Select
                            label="Situação"
                            name="sit"
                            value={formData.sit}
                            onChange={(e) => updateField('sit', Number(e.target.value))}
                            options={situacaoOptions}
                            required
                        />
                    </div>
                </section>

                {/* Card: Pais */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-xl">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Pais
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <div className="absolute -left-1 top-0 w-1 h-full bg-blue-400 rounded-full" />
                                <div className="pl-3">
                                    <PassaroAutocomplete
                                        label="♂ Pai"
                                        value={formData.passaro_pai_id}
                                        onChange={(id) => updateField('passaro_pai_id', id)}
                                        options={machos}
                                        placeholder="Buscar pai..."
                                        isLoading={loadingMachos}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-1 top-0 w-1 h-full bg-pink-400 rounded-full" />
                                <div className="pl-3">
                                    <PassaroAutocomplete
                                        label="♀ Mãe"
                                        value={formData.passaro_mae_id}
                                        onChange={(id) => updateField('passaro_mae_id', id)}
                                        options={femeas}
                                        placeholder="Buscar mãe..."
                                        isLoading={loadingFemeas}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card: Genética */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Genética (Portadores)
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <TagsInput
                            label="Portador de"
                            value={formData.portador}
                            onChange={(tags) => updateField('portador', tags)}
                            placeholder="Digite e pressione Enter"
                            hint="Mutações que o pássaro porta com certeza"
                        />

                        <TagsInput
                            label="Possível Portador de"
                            value={formData.pportador}
                            onChange={(tags) => updateField('pportador', tags)}
                            placeholder="Digite e pressione Enter"
                            hint="Mutações que o pássaro possivelmente porta"
                        />
                    </div>
                </section>

                {/* Card: Observações */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-500 to-slate-600">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Observações
                        </h2>
                    </div>
                    <div className="p-4">
                        <Textarea
                            name="obs"
                            value={formData.obs}
                            onChange={(e) => updateField('obs', e.target.value)}
                            placeholder="Anotações sobre o pássaro..."
                            rows={3}
                        />
                    </div>
                </section>

                {/* Botões de Ação - Fixos no rodapé */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 safe-bottom">
                    <div className="max-w-2xl mx-auto flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/passaros')}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
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
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Salvar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
