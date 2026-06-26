/**
 * Store de Autenticação com Zustand
 *
 * O JWT é armazenado em cookie HttpOnly — o browser o envia automaticamente.
 * Esta store só persiste metadados não-sensíveis (user, expiresAt, flags).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User, LoginResponse, RefreshResponse } from '@/types'
import { API_BASE_URL } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

interface AuthState {
    // Estado
    user: User | null
    expiresAt: number | null
    isAuthenticated: boolean
    isLoading: boolean
    _hasHydrated: boolean
    rememberMe: boolean

    // Impersonação
    isImpersonating: boolean

    // Actions
    login: (username: string, senha: string, captchaToken?: string, rememberMe?: boolean) => Promise<void>
    logout: () => Promise<void>
    refresh: () => Promise<boolean | null>
    validateSession: () => Promise<boolean>
    autoRefreshIfNeeded: () => Promise<void>
    updateUser: (data: Partial<User>) => void
    setLoading: (loading: boolean) => void
    setHasHydrated: (state: boolean) => void
    impersonate: (user: User, expiresIn: number) => void
    stopImpersonate: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            user: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: false,
            rememberMe: false,
            isImpersonating: false,

            /**
             * Realiza o login — o backend retorna Set-Cookie com o JWT
             */
            login: async (username: string, senha: string, captchaToken?: string, rememberMe = false) => {
                try {
                    set({ isLoading: true })

                    // PWA instalado sempre mantém sessão persistente
                    const isPWA = window.matchMedia('(display-mode: standalone)').matches
                    const effectiveRememberMe = isPWA ? true : rememberMe

                    const response = await axios.post<{ data: LoginResponse }>(
                        `${API_BASE_URL}/api/v1/login`,
                        { username, senha, captcha_token: captchaToken, rememberMe: effectiveRememberMe },
                        { withCredentials: true }
                    )

                    const { expires_in, user } = response.data.data
                    const expiresAt = Date.now() + expires_in * 1000

                    set({
                        user,
                        expiresAt,
                        isAuthenticated: true,
                        isLoading: false,
                        rememberMe: effectiveRememberMe,
                    })
                } catch (error) {
                    set({ isLoading: false })
                    throw error
                }
            },

            /**
             * Realiza o logout — o backend apaga o cookie
             */
            logout: async () => {
                try {
                    await axios.post(
                        `${API_BASE_URL}/api/v1/logout`,
                        {},
                        { withCredentials: true }
                    ).catch(() => {
                        // Ignora erros no logout do backend
                    })
                } finally {
                    set({
                        user: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoading: false,
                        rememberMe: false,
                        isImpersonating: false,
                    })

                    sessionStorage.removeItem('email_verification_shown')
                    queryClient.clear()
                }
            },

            /**
             * Renova o JWT via cookie — o backend emite Set-Cookie com o novo token
             * Retorna true em caso de sucesso, null em caso de falha
             */
            refresh: async (): Promise<boolean | null> => {
                try {
                    const response = await axios.post<{ data: RefreshResponse }>(
                        `${API_BASE_URL}/api/v1/refresh`,
                        {},
                        { withCredentials: true }
                    )

                    const { expires_in } = response.data.data
                    const expiresAt = Date.now() + expires_in * 1000

                    set({ expiresAt })

                    return true
                } catch {
                    set({
                        user: null,
                        expiresAt: null,
                        isAuthenticated: false,
                    })
                    return null
                }
            },

            /**
             * Valida a sessão chamando /api/v1/me com o cookie
             */
            validateSession: async (): Promise<boolean> => {
                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/api/v1/me`,
                        { withCredentials: true }
                    )

                    const data = response.data?.data ?? response.data

                    set({
                        user: {
                            usuario_id:     data.usuario_id,
                            nome:           data.name,
                            username:       data.name,
                            email:          data.email,
                            needs_email:    data.needs_email,
                            email_verified: data.email_verified,
                            is_admin:       data.is_admin,
                            is_demo:        data.is_demo,
                            sg_clube:       data.sg_clube,
                            nro_criador:    data.nro_criador,
                        },
                        isAuthenticated: true,
                        isLoading: false,
                    })
                    return true
                } catch {
                    set({
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
             */
            autoRefreshIfNeeded: async (): Promise<void> => {
                const { expiresAt, rememberMe, isImpersonating } = get()

                // PWA instalado sempre tenta renovar (independente de rememberMe)
                const isPWA = window.matchMedia('(display-mode: standalone)').matches
                if ((!rememberMe && !isPWA) || isImpersonating || !expiresAt) {
                    return
                }

                const now = Date.now()
                const timeUntilExpiry = expiresAt - now
                const FIVE_MINUTES = 5 * 60 * 1000

                if (timeUntilExpiry < FIVE_MINUTES) {
                    try {
                        await get().refresh()
                    } catch {
                        // Falha silenciosa
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

            setLoading: (loading: boolean) => {
                set({ isLoading: loading })
            },

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state })
            },

            /**
             * Inicia impersonação — o backend define os cookies necessários
             */
            impersonate: (user: User, expiresIn: number) => {
                const expiresAt = Date.now() + expiresIn * 1000
                queryClient.clear()
                set({
                    user,
                    expiresAt,
                    isImpersonating: true,
                    isAuthenticated: true,
                })
            },

            /**
             * Para de impersonar — o backend restaura o cookie do admin
             */
            stopImpersonate: async () => {
                try {
                    const response = await axios.post(
                        `${API_BASE_URL}/api/v1/admin/stop-impersonate`,
                        {},
                        { withCredentials: true }
                    )

                    const { expires_in, user } = response.data.data
                    const expiresAt = Date.now() + expires_in * 1000

                    queryClient.clear()
                    set({
                        user: {
                            usuario_id:     user.usuario_id,
                            nome:           user.name,
                            username:       user.name,
                            email:          user.email,
                            needs_email:    user.needs_email,
                            email_verified: user.email_verified,
                            is_admin:       user.is_admin,
                            sg_clube:       user.sg_clube,
                            nro_criador:    user.nro_criador,
                        },
                        expiresAt,
                        isImpersonating: false,
                        isAuthenticated: true,
                    })
                } catch {
                    set({
                        user: null,
                        expiresAt: null,
                        isImpersonating: false,
                        isAuthenticated: false,
                    })
                }
            },
        }),
        {
            name: 'meuplantel-auth',
            partialize: (state) => ({
                user: state.user,
                expiresAt: state.expiresAt,
                isAuthenticated: state.isAuthenticated,
                rememberMe: state.rememberMe,
                isImpersonating: state.isImpersonating,
            }),
            onRehydrateStorage: () => (state) => {
                setTimeout(() => {
                    if (!state) {
                        useAuthStore.setState({ _hasHydrated: true, isAuthenticated: false })
                        return
                    }

                    useAuthStore.setState({ _hasHydrated: true })
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
