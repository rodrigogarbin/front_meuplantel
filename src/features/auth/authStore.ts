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
    rememberMe: boolean

    // Impersonação
    adminToken: string | null
    isImpersonating: boolean

    // Actions
    login: (username: string, senha: string, captchaToken?: string, rememberMe?: boolean) => Promise<void>
    logout: () => Promise<void>
    refresh: () => Promise<string | null>
    validateSession: () => Promise<boolean>
    autoRefreshIfNeeded: () => Promise<void>
    updateUser: (data: Partial<User>) => void
    setLoading: (loading: boolean) => void
    setHasHydrated: (state: boolean) => void
    impersonate: (token: string, user: User, adminToken: string, expiresIn: number) => void
    stopImpersonate: () => Promise<void>
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
            rememberMe: false,
            adminToken: null,
            isImpersonating: false,

            /**
             * Realiza o login
             */
            login: async (username: string, senha: string, captchaToken?: string, rememberMe = false) => {
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
                        rememberMe,
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
                        rememberMe: false,
                        adminToken: null,
                        isImpersonating: false,
                    })

                    // Limpa flag de verificação de email mostrada
                    sessionStorage.removeItem('email_verification_shown')

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
             * Verifica se o token está próximo de expirar e faz refresh automático
             * Usado para manter a sessão ativa quando "Lembrar-me" está ativado
             */
            autoRefreshIfNeeded: async (): Promise<void> => {
                const { token, expiresAt, rememberMe, isImpersonating } = get()

                // Não faz auto-refresh se não está autenticado ou não tem rememberMe ativo
                if (!token || !rememberMe || isImpersonating) {
                    return
                }

                // Se não tem expiresAt, não consegue determinar
                if (!expiresAt) {
                    return
                }

                const now = Date.now()
                const timeUntilExpiry = expiresAt - now
                const FIVE_MINUTES = 5 * 60 * 1000 // 5 minutos em ms

                // Se o token já expirou ou vai expirar em menos de 5 minutos, faz refresh
                if (timeUntilExpiry < FIVE_MINUTES) {
                    try {
                        await get().refresh()
                    } catch {
                        // Falha silenciosa - o interceptor do Axios vai lidar com logout se necessário
                    }
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

            /**
             * Inicia impersonação de outro usuário
             */
            impersonate: (token: string, user: User, adminToken: string, expiresIn: number) => {
                const expiresAt = Date.now() + expiresIn * 1000
                queryClient.clear()
                set({
                    token,
                    user,
                    expiresAt,
                    adminToken,
                    isImpersonating: true,
                    isAuthenticated: true,
                })
            },

            /**
             * Para de impersonar e restaura a sessão do admin
             */
            stopImpersonate: async () => {
                const { adminToken } = get()
                if (!adminToken) return

                try {
                    const response = await axios.post(
                        `${API_BASE_URL}/api/v1/admin/stop-impersonate`,
                        { admin_token: adminToken },
                        { headers: { Authorization: `Bearer ${adminToken}` } }
                    )

                    const { access_token, expires_in, user } = response.data.data
                    const expiresAt = Date.now() + expires_in * 1000

                    queryClient.clear()
                    set({
                        token: access_token,
                        user: {
                            usuario_id: user.usuario_id,
                            nome: user.name,
                            username: user.name,
                            email: user.email,
                            needs_email: user.needs_email,
                            email_verified: user.email_verified,
                            is_admin: user.is_admin,
                            sg_clube: user.sg_clube,
                            nro_criador: user.nro_criador,
                        },
                        expiresAt,
                        adminToken: null,
                        isImpersonating: false,
                        isAuthenticated: true,
                    })
                } catch {
                    // If stop fails, do full logout
                    set({
                        token: null,
                        user: null,
                        expiresAt: null,
                        adminToken: null,
                        isImpersonating: false,
                        isAuthenticated: false,
                    })
                }
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
                rememberMe: state.rememberMe,
                adminToken: state.adminToken,
                isImpersonating: state.isImpersonating,
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

// Hook para verificar se está impersonando
export const useIsImpersonating = () => useAuthStore((state) => state.isImpersonating)

// Hook para verificar se tem remember me ativo
export const useRememberMe = () => useAuthStore((state) => state.rememberMe)
