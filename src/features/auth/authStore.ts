/**
 * Store de Autenticação com Zustand
 * 
 * Gerencia:
 * - Estado do usuário e token
 * - Login, logout e refresh
 * - Persistência em localStorage (com fallback para memória)
 * 
 * NOTA DE SEGURANÇA:
 * - localStorage NÃO é seguro contra XSS. Em produção, considere usar httpOnly cookies.
 * - Para apps mobile (Capacitor), usar @capacitor/secure-storage é recomendado.
 * - O token é armazenado em localStorage para persistir entre refreshes de página.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User, LoginResponse, RefreshResponse } from '@/types'
import { API_BASE_URL } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

interface AuthState {
    // Estado
    token: string | null
    user: User | null
    expiresAt: number | null
    isAuthenticated: boolean
    isLoading: boolean
    _hasHydrated: boolean

    // Actions
    login: (username: string, senha: string, captchaToken?: string) => Promise<void>
    logout: () => Promise<void>
    refresh: () => Promise<string | null>
    validateSession: () => Promise<boolean>
    updateUser: (data: Partial<User>) => void
    setLoading: (loading: boolean) => void
    setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            token: null,
            user: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: false,

            /**
             * Realiza o login
             */
            login: async (username: string, senha: string, captchaToken?: string) => {
                try {
                    set({ isLoading: true })

                    const response = await axios.post<{ data: LoginResponse }>(
                        `${API_BASE_URL}/api/v1/login`,
                        { username, senha, captcha_token: captchaToken }
                    )

                    const { access_token, expires_in, user } = response.data.data

                    // Calcula quando o token expira
                    const expiresAt = Date.now() + expires_in * 1000

                    set({
                        token: access_token,
                        user,
                        expiresAt,
                        isAuthenticated: true,
                        isLoading: false,
                    })
                } catch (error) {
                    set({ isLoading: false })
                    throw error
                }
            },

            /**
             * Realiza o logout
             */
            logout: async () => {
                const { token } = get()

                try {
                    if (token) {
                        // Tenta notificar o backend (não bloqueia se falhar)
                        await axios.post(
                            `${API_BASE_URL}/api/v1/logout`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        ).catch(() => {
                            // Ignora erros no logout do backend
                        })
                    }
                } finally {
                    // Sempre limpa o estado local
                    set({
                        token: null,
                        user: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoading: false,
                    })

                    // Limpa todo o cache do React Query para evitar dados do usuário anterior
                    queryClient.clear()
                }
            },

            /**
             * Atualiza o token usando o refresh endpoint
             * Retorna o novo token ou null se falhar
             */
            refresh: async (): Promise<string | null> => {
                const { token } = get()

                if (!token) {
                    return null
                }

                try {
                    const response = await axios.post<RefreshResponse>(
                        `${API_BASE_URL}/api/v1/refresh`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    )

                    const { access_token, expires_in } = response.data
                    const expiresAt = Date.now() + expires_in * 1000

                    set({
                        token: access_token,
                        expiresAt,
                    })

                    return access_token
                } catch {
                    // Falha no refresh - limpa o estado
                    set({
                        token: null,
                        user: null,
                        expiresAt: null,
                        isAuthenticated: false,
                    })
                    return null
                }
            },

            /**
             * Valida a sessão atual chamando /api/v1/me
             * Usado ao iniciar o app para verificar se o token ainda é válido
             */
            validateSession: async (): Promise<boolean> => {
                const { token, expiresAt } = get()

                // Se não tem token, não está autenticado
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false })
                    return false
                }

                // Se o token está expirado, tenta refresh
                if (expiresAt && Date.now() > expiresAt) {
                    const newToken = await get().refresh()
                    if (!newToken) {
                        set({ isLoading: false })
                        return false
                    }
                }

                try {
                    // Valida o token com o backend
                    const response = await axios.get(
                        `${API_BASE_URL}/api/v1/me`,
                        { headers: { Authorization: `Bearer ${get().token}` } }
                    )

                    // Atualiza os dados do usuário se retornados
                    if (response.data?.name || response.data?.email) {
                        set((state) => ({
                            user: state.user ? {
                                ...state.user,
                                nome: response.data.name ?? state.user.nome,
                                email: response.data.email ?? state.user.email,
                            } : state.user,
                        }))
                    }

                    set({ isLoading: false, isAuthenticated: true })
                    return true
                } catch {
                    // Token inválido
                    set({
                        token: null,
                        user: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoading: false,
                    })
                    return false
                }
            },

            /**
             * Atualiza os dados do usuário no store
             */
            updateUser: (data: Partial<User>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null,
                }))
            },

            /**
             * Define o estado de loading
             */
            setLoading: (loading: boolean) => {
                set({ isLoading: loading })
            },

            /**
             * Define o estado de hidratação
             */
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state })
            },
        }),
        {
            name: 'meuplantel-auth', // Chave no localStorage
            partialize: (state) => ({
                // Só persiste estes campos
                token: state.token,
                user: state.user,
                expiresAt: state.expiresAt,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Callback será executado após hidratação
                // Usamos setTimeout para garantir que a store já foi criada
                setTimeout(() => {
                    if (!state) {
                        useAuthStore.setState({ _hasHydrated: true, isAuthenticated: false })
                        return
                    }

                    // Se tem token persistido e não expirou, mantém autenticado
                    const tokenValido = state.token && state.expiresAt && Date.now() < state.expiresAt

                    if (tokenValido && state.isAuthenticated) {
                        // Token ainda válido, mantém o estado
                        useAuthStore.setState({ _hasHydrated: true })
                    } else if (state.token && state.expiresAt && Date.now() >= state.expiresAt) {
                        // Token expirado - o interceptor do Axios vai tentar refresh
                        // Mantém autenticado por enquanto
                        useAuthStore.setState({ _hasHydrated: true })
                    } else {
                        // Sem token ou sem expiração
                        useAuthStore.setState({
                            _hasHydrated: true,
                            isAuthenticated: false,
                            token: null,
                            user: null,
                            expiresAt: null,
                        })
                    }
                }, 0)
            },
        }
    )
)

// Hook para verificar se está autenticado
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)

// Hook para pegar o usuário
export const useUser = () => useAuthStore((state) => state.user)

// Hook para pegar o loading
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)

// Hook para verificar se já hidratou
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated)
