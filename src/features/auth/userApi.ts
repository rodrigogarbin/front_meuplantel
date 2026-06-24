/**
 * API hooks para dados do perfil do usuário
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

interface UserProfile {
    usuario_id: number
    name: string
    email: string | null
    sg_clube: string | null
    nro_criador: string | number | null // Pode vir como número do backend
}

interface UserProfileResponse {
    data: UserProfile
}

export interface UpdateProfileData {
    nome?: string
    email?: string
    senha_atual?: string
    senha?: string
    senha_confirmation?: string
    sg_clube?: string
    nro_criador?: string
}

// Tipos para verificação de email
export interface EmailVerificationStatus {
    needs_email: boolean
    email_verified: boolean
    email: string | null
    pending_email: string | null
    email_grace_expires_at?: string | null
}

interface EmailVerificationStatusResponse {
    data: EmailVerificationStatus
}

interface EmailVerificationResponse {
    message: string
    data?: {
        email: string
        email_verified_at: string
    }
}

/**
 * Busca dados do perfil do usuário logado
 */
async function fetchUserProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfileResponse>('/api/v1/me')
    return response.data.data
}

/**
 * Atualiza dados do perfil do usuário
 */
async function updateUserProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await api.put<UserProfileResponse>('/api/v1/me', data)
    return response.data.data
}

/**
 * Hook para buscar dados do perfil do usuário
 */
export function useUserProfile() {
    return useQuery({
        queryKey: ['user', 'profile'],
        queryFn: fetchUserProfile,
        staleTime: 1000 * 60 * 30, // 30 minutos - dados raramente mudam
    })
}

/**
 * Hook para atualizar dados do perfil do usuário
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
        }
    })
}

// ============================================
// Verificação de E-mail
// ============================================

/**
 * Busca status da verificação de email
 */
async function fetchEmailVerificationStatus(): Promise<EmailVerificationStatus> {
    const response = await api.get<EmailVerificationStatusResponse>('/api/v1/email/status')
    return response.data.data
}

/**
 * Solicita verificação de email
 */
async function requestEmailVerification(email: string): Promise<EmailVerificationResponse> {
    const response = await api.post<EmailVerificationResponse>('/api/v1/email/request', { email })
    return response.data
}

/**
 * Verifica o código de email
 */
async function verifyEmailCode(code: string): Promise<EmailVerificationResponse> {
    const response = await api.post<EmailVerificationResponse>('/api/v1/email/verify', { code })
    return response.data
}

/**
 * Reenvia código de verificação
 */
async function resendEmailVerification(): Promise<EmailVerificationResponse> {
    const response = await api.post<EmailVerificationResponse>('/api/v1/email/resend')
    return response.data
}

/**
 * Hook para buscar status de verificação de email
 */
export function useEmailVerificationStatus() {
    return useQuery({
        queryKey: ['email', 'verification', 'status'],
        queryFn: fetchEmailVerificationStatus,
        staleTime: 1000 * 60 * 5, // 5 minutos
    })
}

/**
 * Hook para solicitar verificação de email
 */
export function useRequestEmailVerification() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: requestEmailVerification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email', 'verification', 'status'] })
        }
    })
}

/**
 * Hook para verificar código de email
 */
export function useVerifyEmailCode() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: verifyEmailCode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email', 'verification', 'status'] })
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
        }
    })
}

/**
 * Hook para reenviar código de verificação
 */
export function useResendEmailVerification() {
    return useMutation({
        mutationFn: resendEmailVerification,
    })
}

// ============================================
// Novo sistema de verificação de e-mail
// (para usuários que já têm e-mail cadastrado)
// ============================================

/**
 * Novo sistema: verifica código de 6 dígitos enviado no cadastro
 */
export function useVerificarEmailCodigo() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (codigo: string) => {
            const { data } = await api.post<EmailVerificationResponse>('/api/v1/email/verificar-codigo', { codigo })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email', 'verification', 'status'] })
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
            queryClient.invalidateQueries({ queryKey: ['me'] })
        },
    })
}

/**
 * Novo sistema: reenvia e-mail de verificação (não pede email pois já está no cadastro)
 */
export function useReenviarEmailVerificacao() {
    return useMutation({
        mutationFn: async () => {
            const { data } = await api.post<EmailVerificationResponse>('/api/v1/email/reenviar')
            return data
        },
    })
}
