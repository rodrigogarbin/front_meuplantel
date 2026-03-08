/**
 * Página de Edição do Perfil do Usuário
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/ui/Topbar'
import { useUserProfile, useUpdateProfile, type UpdateProfileData } from '@/features/auth/userApi'
import { useAuthStore } from '@/features/auth/authStore'

function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    )
}

function MailIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    )
}

function KeyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    )
}

function IdCardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
    )
}

function EyeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    )
}

function EyeOffIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    )
}

export function ProfileEditPage() {
    const navigate = useNavigate()
    const { data: profile, isLoading } = useUserProfile()
    const updateProfile = useUpdateProfile()
    const { updateUser } = useAuthStore()

    // Estado do formulário
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [sgClube, setSgClube] = useState('')
    const [nroRriador, setNroCriador] = useState('')

    // Campos de senha
    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [showSenhaAtual, setShowSenhaAtual] = useState(false)
    const [showNovaSenha, setShowNovaSenha] = useState(false)
    const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)

    // Controle da seção de senha
    const [alterarSenha, setAlterarSenha] = useState(false)

    // Erro local
    const [error, setError] = useState<string | null>(null)

    // Preencher formulário com dados do perfil
    useEffect(() => {
        if (profile) {
            setNome(profile.name || '')
            setEmail(profile.email || '')
            setSgClube(profile.sg_clube || '')
            setNroCriador(String(profile.nro_criador || ''))
        }
    }, [profile])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validar confirmação de senha
        if (alterarSenha) {
            if (!senhaAtual) {
                setError('Informe a senha atual')
                return
            }
            if (novaSenha !== confirmarSenha) {
                setError('As senhas não conferem')
                return
            }
            if (novaSenha.length < 6) {
                setError('A nova senha deve ter pelo menos 6 caracteres')
                return
            }
        }

        const data: UpdateProfileData = {
            nome,
            sg_clube: sgClube,
            nro_criador: nroRriador,
        }

        // Adicionar campos de senha se estiver alterando
        if (alterarSenha && senhaAtual && novaSenha) {
            data.senha_atual = senhaAtual
            data.senha = novaSenha
            data.senha_confirmation = confirmarSenha
        }

        try {
            const updatedProfile = await updateProfile.mutateAsync(data)

            // Atualizar dados no store de autenticação
            updateUser({
                nome: updatedProfile.name,
                email: updatedProfile.email || undefined,
            })

            // Voltar para a página de configurações
            navigate('/config')
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            setError(error.response?.data?.message || 'Erro ao atualizar perfil')
        }
    }

    if (isLoading) {
        return (
            <>
                <Topbar title="Editar Perfil" showBack onBack={() => navigate('/config')} />
                <main className="page-content">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Topbar title="Editar Perfil" showBack onBack={() => navigate('/config')} />

            <main className="page-content">
                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Avatar e identificação */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                {nome.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Dados Pessoais */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Dados Pessoais
                        </h2>
                        <div className="section-card space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="input pl-10"
                                        placeholder="Seu nome"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email - Somente leitura, alteração via verificação */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MailIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="input pl-10 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                        placeholder="Nenhum e-mail cadastrado"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/verificar-email?alterar=true')}
                                    className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    {email ? 'Alterar e-mail' : 'Cadastrar e-mail'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Dados do Criador */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Identificação do Criador
                        </h2>
                        <div className="section-card space-y-4">
                            {/* Sigla do Clube */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sigla Clube / Criador
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IdCardIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={sgClube}
                                        onChange={(e) => setSgClube(e.target.value.toUpperCase())}
                                        className="input pl-10 uppercase"
                                        placeholder="Ex: SOB"
                                        maxLength={10}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Sigla da federação ou clube que você é associado
                                </p>
                            </div>

                            {/* Número do Criador */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nº Criador / CTF
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IdCardIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={nroRriador}
                                        onChange={(e) => setNroCriador(e.target.value)}
                                        className="input pl-10"
                                        placeholder="Ex: 1234"
                                        maxLength={10}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Seu número de registro na federação
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Alterar Senha */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Segurança
                        </h2>
                        <div className="section-card">
                            <button
                                type="button"
                                onClick={() => setAlterarSenha(!alterarSenha)}
                                className="w-full flex items-center justify-between py-2"
                            >
                                <span className="flex items-center gap-3">
                                    <KeyIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        Alterar senha
                                    </span>
                                </span>
                                <div className={`w-10 h-6 rounded-full transition-colors ${alterarSenha ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${alterarSenha ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
                                </div>
                            </button>

                            {alterarSenha && (
                                <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    {/* Senha Atual */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Senha Atual
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <KeyIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showSenhaAtual ? 'text' : 'password'}
                                                value={senhaAtual}
                                                onChange={(e) => setSenhaAtual(e.target.value)}
                                                className="input pl-10 pr-10"
                                                placeholder="Sua senha atual"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showSenhaAtual ? (
                                                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Nova Senha */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nova Senha
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <KeyIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showNovaSenha ? 'text' : 'password'}
                                                value={novaSenha}
                                                onChange={(e) => setNovaSenha(e.target.value)}
                                                className="input pl-10 pr-10"
                                                placeholder="Mínimo 6 caracteres"
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNovaSenha(!showNovaSenha)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showNovaSenha ? (
                                                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirmar Nova Senha */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirmar Nova Senha
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <KeyIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showConfirmarSenha ? 'text' : 'password'}
                                                value={confirmarSenha}
                                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                                className="input pl-10 pr-10"
                                                placeholder="Repita a nova senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showConfirmarSenha ? (
                                                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Botão Salvar */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="btn btn-primary w-full py-3"
                        >
                            {updateProfile.isPending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    Salvando...
                                </span>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </>
    )
}
