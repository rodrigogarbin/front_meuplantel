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
