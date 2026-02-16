/**
 * API Service para Posturas
 * Hooks do TanStack Query para fetch de dados
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// Tipo da postura vinda da API
export interface PosturaListItem {
    id: number
    casal_id: number
    data: string | null
    data_nasc: string | null
    sit: number
    sit_descricao: string
    nro_rodada: number | null
    nro_anel: number | null
    ano_anel: number | null
    obs: string | null
    casal_origem_id: number | null
    passaro?: {
        id: number
        sexo: number | null
        anel?: {
            id: number
            ano: number
            nro: number
            sg_clube: string
        } | null
    } | null
    casal?: {
        id: number
        nro: number | null
        descr_pai?: string | null
        descr_mae?: string | null
        dias_choco: number | null
        dias_anilha: number | null
        dias_separa: number | null
        macho?: {
            id: number
            especie_usuario_id: number | null
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            } | null
        } | null
        femea?: {
            id: number
            especie_usuario_id: number | null
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            } | null
        } | null
    } | null
    casal_origem?: {
        id: number
        nro: number | null
        descr_pai?: string | null
        descr_mae?: string | null
        dias_choco: number | null
        dias_anilha: number | null
        dias_separa: number | null
        macho?: {
            id: number
            especie_usuario_id: number | null
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            } | null
        } | null
        femea?: {
            id: number
            especie_usuario_id: number | null
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube: string
            } | null
        } | null
    } | null
}

// Tipo da resposta da API
interface PosturasResponse {
    data: PosturaListItem[]
    meta?: {
        current_page: number
        per_page: number
        total: number
    }
}

// Filtros para busca de posturas
export interface PosturasFilters {
    sit?: number
    ativas?: boolean
}

/**
 * Busca a lista de posturas ativas do usuário
 */
async function fetchPosturas(filters: PosturasFilters = {}): Promise<PosturaListItem[]> {
    const params = new URLSearchParams()

    // Por padrão, busca apenas ativas
    if (filters.ativas !== false) {
        params.append('ativas', 'true')
    }

    if (filters.sit !== undefined) {
        params.append('sit', filters.sit.toString())
    }

    params.append('per_page', '200')

    const response = await api.get<PosturasResponse>(`/api/v1/posturas?${params.toString()}`)

    return response.data.data || []
}

/**
 * Hook para buscar lista de posturas
 */
export function usePosturas(filters: PosturasFilters = {}) {
    return useQuery({
        queryKey: ['posturas', filters],
        queryFn: () => fetchPosturas(filters),
        staleTime: 2 * 60 * 1000, // 2 minutos
        refetchOnWindowFocus: true,
    })
}

/**
 * Hook para verificar se há posturas com ações pendentes
 * Retorna true se há alertas em qualquer postura ativa
 */
export function usePosturasPendentes() {
    const { data: posturas } = usePosturas({ ativas: true })

    if (!posturas || posturas.length === 0) {
        return false
    }

    // Verifica se alguma postura tem alertas
    return posturas.some(postura => {
        const alerts = getPosturaAlertsSimple(postura)
        return alerts.length > 0
    })
}

// Função para calcular alertas (versão simplificada para o hook)
function getPosturaAlertsSimple(postura: PosturaListItem): string[] {
    const alerts: string[] = []
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const diasChoco = postura.casal?.dias_choco ?? 21
    const diasAnilha = postura.casal?.dias_anilha ?? 7
    const diasSepara = postura.casal?.dias_separa ?? 45

    // Se status é CHOCO (1) e data + dias_choco >= hoje => "Nascendo"
    if (postura.sit === 1 && postura.data) {
        const dataPostura = new Date(postura.data + 'T00:00:00')
        const dataNascendo = new Date(dataPostura)
        dataNascendo.setDate(dataNascendo.getDate() + diasChoco)

        if (dataNascendo <= hoje) {
            alerts.push('Nascendo')
        }

        // Se era para nascer e não nasceu após 30 dias
        const dataVerificar = new Date(dataNascendo)
        dataVerificar.setDate(dataVerificar.getDate() + 30)
        if (!postura.data_nasc && dataVerificar <= hoje) {
            alerts.push('Verificar')
        }
    }

    // Se status é NASCIDO (2) e não tem passaro_id
    if (postura.sit === 2 && !postura.passaro) {
        if (postura.data_nasc) {
            const dataNasc = new Date(postura.data_nasc + 'T00:00:00')
            const jaAnilhado = !!(postura.nro_anel && postura.ano_anel)

            if (!jaAnilhado) {
                // Verifica se deve anilhar
                const dataAnilhar = new Date(dataNasc)
                dataAnilhar.setDate(dataAnilhar.getDate() + diasAnilha)

                if (dataAnilhar <= hoje) {
                    alerts.push('Hora de anilhar')
                }

                const dataVerificarAnilhar = new Date(dataAnilhar)
                dataVerificarAnilhar.setDate(dataVerificarAnilhar.getDate() + 30)
                if (dataVerificarAnilhar <= hoje) {
                    alerts.push('Verificar')
                }
            } else {
                // Verifica se deve separar
                const dataSeparar = new Date(dataNasc)
                dataSeparar.setDate(dataSeparar.getDate() + diasSepara)

                if (dataSeparar <= hoje) {
                    alerts.push('Separar')
                }

                const dataVerificarSeparar = new Date(dataSeparar)
                dataVerificarSeparar.setDate(dataVerificarSeparar.getDate() + 30)
                if (dataVerificarSeparar <= hoje) {
                    alerts.push('Verificar')
                }
            }
        }
    }

    return alerts
}
