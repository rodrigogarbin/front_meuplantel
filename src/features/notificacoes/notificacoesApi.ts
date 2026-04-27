/**
 * API Service para Notificações
 * Hooks do TanStack Query para fetch e mutations de notificações
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// Tipo da notificação vinda da API
export interface Notificacao {
  id: number
  titulo: string
  corpo: string
  url: string | null
  tipo: string
  lida_em: string | null
  created_at: string
  tempo_relativo: string
}

// Resposta paginada da API
interface NotificacoesResponse {
  data: Notificacao[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

// Resposta da contagem de não lidas
interface NaoLidasCountResponse {
  count: number
}

/**
 * Busca lista de notificações
 * @param lidas - 0 para não lidas, 1 para lidas, undefined para todas
 */
async function fetchNotificacoes(lidas?: 0 | 1): Promise<Notificacao[]> {
  const params = new URLSearchParams()
  params.append('per_page', '50')

  if (lidas !== undefined) {
    params.append('lidas', lidas.toString())
  }

  const response = await api.get<NotificacoesResponse>(`/api/v1/notificacoes?${params.toString()}`)
  return response.data.data || []
}

/**
 * Busca contagem de notificações não lidas
 */
async function fetchNaoLidasCount(): Promise<number> {
  const response = await api.get<NaoLidasCountResponse>('/api/v1/notificacoes/nao-lidas-count')
  return response.data.count ?? 0
}

/**
 * Marca uma notificação como lida
 */
async function marcarLida(id: number): Promise<void> {
  await api.patch(`/api/v1/notificacoes/${id}/lida`)
}

/**
 * Marca todas as notificações como lidas
 */
async function marcarTodasLidas(): Promise<void> {
  await api.patch('/api/v1/notificacoes/marcar-todas-lidas')
}

/**
 * Exclui (soft-delete) uma notificação
 */
async function excluirNotificacao(id: number): Promise<void> {
  await api.delete(`/api/v1/notificacoes/${id}`)
}

/**
 * Hook para buscar lista de notificações
 */
export function useNotificacoes(lidas?: 0 | 1) {
  return useQuery({
    queryKey: ['notificacoes', { lidas }],
    queryFn: () => fetchNotificacoes(lidas),
    staleTime: 60 * 1000, // 1 minuto
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook para buscar contagem de notificações não lidas
 * Faz polling a cada 60 segundos para manter o badge atualizado
 */
export function useNaoLidasCount() {
  return useQuery({
    queryKey: ['notificacoes', 'count'],
    queryFn: fetchNaoLidasCount,
    refetchInterval: 60 * 1000, // polling a cada 60s
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Mutation para marcar uma notificação como lida
 * Invalida as queries de notificações e contagem
 */
export function useMarcarLida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: marcarLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}

/**
 * Mutation para marcar todas as notificações como lidas
 * Invalida as queries de notificações e contagem
 */
export function useMarcarTodasLidas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: marcarTodasLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}

/**
 * Mutation para excluir uma notificação (soft-delete)
 * Remove imediatamente do cache via optimistic update
 */
export function useExcluirNotificacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: excluirNotificacao,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['notificacoes'] })
      const previous = queryClient.getQueryData<Notificacao[]>(['notificacoes', { lidas: undefined }])
      queryClient.setQueryData<Notificacao[]>(
        ['notificacoes', { lidas: undefined }],
        (old) => old?.filter((n) => n.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notificacoes', { lidas: undefined }], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}
