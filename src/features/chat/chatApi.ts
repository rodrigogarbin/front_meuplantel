/**
 * API Service — Chat / Alertas do Plantel
 */

import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

// ——— Tipos ——————————————————————————————————————————————

export interface AlertaDescascando {
    postura_id: number
    gaiola_id: number
    gaiola_nro: number
    data_postura: string
    data_prevista: string
    dias_restantes: number
}

export interface AlertaAnilhar {
    postura_id: number
    gaiola_id: number
    gaiola_nro: number
    passaro_id: number
    passaro_descr: string | null
    data_nasc: string
    data_limite: string
    dias_restantes: number
}

export interface AlertaSeparar {
    postura_id: number
    gaiola_id: number
    gaiola_nro: number
    passaro_id: number | null
    data_nasc: string
    data_separar: string
    dias_restantes: number
}

export interface ChatAlertas {
    descascando?: AlertaDescascando[]
    anilhar?: AlertaAnilhar[]
    separar?: AlertaSeparar[]
}

export interface ChatResponse {
    tipo: 'descascando' | 'anilhar' | 'separar' | 'todos'
    resposta: string
    alertas: ChatAlertas
}

export interface SendMessagePayload {
    mensagem: string
    dias?: number
}

// ——— Hooks ——————————————————————————————————————————————

export function useSendMessage() {
    return useMutation<ChatResponse, Error, SendMessagePayload>({
        mutationFn: async (payload) => {
            return (await api.post<ChatResponse>('/api/v1/chat', payload)).data
        },
    })
}
