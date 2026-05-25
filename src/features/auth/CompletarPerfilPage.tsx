/**
 * Página de Completar Perfil
 *
 * Exibida após o primeiro login via rede social para coletar
 * informações obrigatórias: sigla do clube e número de criador.
 */

import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './authStore'
import { BirdLogo } from '@/components/BirdLogo'
import { API_BASE_URL } from '@/lib/api'
import axios, { AxiosError } from 'axios'

export function CompletarPerfilPage() {
    const navigate = useNavigate()
    const { user, updateUser } = useAuthStore()

    const [sgClube, setSgClube] = useState('')
    const [nroCriador, setNroCriador] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setFieldErrors({})
        setIsLoading(true)

        try {
            const res = await axios.put(
                `${API_BASE_URL}/api/v1/me`,
                { sg_clube: sgClube, nro_criador: nroCriador },
                { withCredentials: true }
            )

            const data = res.data.data
            updateUser({
                sg_clube:    data.sg_clube,
                nro_criador: data.nro_criador,
            })

            navigate('/', { replace: true })
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
            const errors = axiosError.response?.data?.errors

            if (errors) {
                const flat: Record<string, string> = {}
                for (const [field, msgs] of Object.entries(errors)) {
                    flat[field] = msgs[0]
                }
                setFieldErrors(flat)
            } else {
                setError(axiosError.response?.data?.message || 'Erro ao salvar. Tente novamente.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4 safe-top safe-bottom">
            <div className="fixed w-96 h-96 -top-24 -right-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="fixed w-72 h-72 -bottom-12 -left-12 bg-white/5 rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <BirdLogo size="lg" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Complete seu perfil
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            Olá, {user?.nome?.split(' ')[0]}! Precisamos de mais algumas informações para finalizar seu cadastro.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="sg_clube" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Sigla Clube / Criador
                                </label>
                                <input
                                    type="text"
                                    id="sg_clube"
                                    value={sgClube}
                                    onChange={(e) => setSgClube(e.target.value.toUpperCase())}
                                    className={`input ${fieldErrors.sg_clube ? 'border-red-500' : ''}`}
                                    placeholder="Ex: SOB"
                                    maxLength={10}
                                    required
                                    autoFocus
                                />
                                {fieldErrors.sg_clube && (
                                    <p className="mt-1 text-sm text-red-500">{fieldErrors.sg_clube}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="nro_criador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nº Criador / CTF
                                </label>
                                <input
                                    type="text"
                                    id="nro_criador"
                                    value={nroCriador}
                                    onChange={(e) => setNroCriador(e.target.value)}
                                    className={`input ${fieldErrors.nro_criador ? 'border-red-500' : ''}`}
                                    placeholder="Ex: 1234"
                                    required
                                />
                                {fieldErrors.nro_criador && (
                                    <p className="mt-1 text-sm text-red-500">{fieldErrors.nro_criador}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn btn-primary py-3.5 text-base shadow-lg shadow-primary-500/30 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Concluir cadastro</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
