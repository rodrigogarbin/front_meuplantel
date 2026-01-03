/**
 * Cliente API com Axios
 * 
 * Implementa:
 * - Interceptor para adicionar token em todas as requests
 * - Interceptor para refresh automático em caso de 401
 * - Queue de requests durante o refresh para evitar múltiplas tentativas
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/features/auth/authStore'

// URL base da API - pode ser configurada via variável de ambiente
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.meuplantel.com'

// Criar instância do Axios
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 segundos
})

// Flag para evitar múltiplos refreshes simultâneos
let isRefreshing = false

// Fila de requests que falharam com 401 enquanto o refresh estava em andamento
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: Error) => void
}> = []

/**
 * Processa a fila de requests pendentes
 */
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error)
        } else if (token) {
            promise.resolve(token)
        }
    })
    failedQueue = []
}

/**
 * Interceptor de Request
 * Adiciona o token de autenticação em todas as requests
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const { token } = useAuthStore.getState()

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

/**
 * Interceptor de Response
 * Trata erros 401 tentando refresh do token
 */
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Se não for erro 401 ou já tentamos retry, rejeita
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        // Ignora refresh em rotas de auth (login, logout, refresh)
        const authPaths = ['/api/v1/login', '/api/v1/logout', '/api/v1/refresh']
        if (authPaths.some(path => originalRequest.url?.includes(path))) {
            return Promise.reject(error)
        }

        // Se já está fazendo refresh, adiciona à fila
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        resolve(api(originalRequest))
                    },
                    reject: (err: Error) => {
                        reject(err)
                    },
                })
            })
        }

        // Marca que estamos fazendo refresh
        originalRequest._retry = true
        isRefreshing = true

        try {
            const { token, refresh } = useAuthStore.getState()

            if (!token) {
                throw new Error('No token available')
            }

            // Tenta fazer refresh
            const newToken = await refresh()

            if (newToken) {
                // Sucesso! Processa a fila e refaz a request original
                processQueue(null, newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } else {
                throw new Error('Refresh failed')
            }
        } catch (refreshError) {
            // Falha no refresh - limpa auth e processa a fila com erro
            processQueue(refreshError as Error, null)
            useAuthStore.getState().logout()

            // Redireciona para login
            window.location.href = '/login'

            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

export default api
