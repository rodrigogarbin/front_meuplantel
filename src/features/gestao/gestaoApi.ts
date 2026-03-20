/**
 * API Service — Gestão do Plantel
 * Hooks TanStack Query para estatísticas e análise de reprodutores
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ——— Tipos ——————————————————————————————————————————————

export interface ComparativoStats {
    casais: number
    ovos: number
    fecundados: number
    eclodidos: number
    nascidos: number
    taxa_fecundacao: number
    taxa_eclosao: number
}

export interface EstatisticasData {
    casais_por_ano: Array<{ ano: number; total: number }>
    media_casais_por_ano: number
    total_casais: number
    casais_ativos: number
    total_filhotes: number
    posturas_por_situacao: {
        choco: number
        nascido: number
        branco: number
        embriao_morto: number
        filhote_morto: number
        fertil: number
    }
    total_posturas: number
    taxa_fecundacao: number
    taxa_eclosao: number
    filtro: { tipo: 0 | 1 | 2; valor: number | null; ano_base: number | null }
    comparativo: {
        ano: number
        ano_base: number | null
        ano_atual: ComparativoStats
        media_historica: ComparativoStats | null
    }
}

export interface MelhoresReprodutoresItem {
    passaro_id: number
    descr: string | null
    sexo: number | null
    foto: string | null
    sit: number
    anel: { nro: number; ano: number; sg_clube: string | null; nro_criador: string | null } | null
    total_ovos: number
    nascidos: number
    fecundados: number
    taxa_fecundacao: number
    taxa_eclosao: number
}

export interface PassaroCasal {
    gaiola_id: number
    nro: number
    vigen_inicial: string | null
    vigen_final: string | null
    parceiro: {
        passaro_id: number
        descr: string | null
        sexo: number | null
        foto: string | null
        anel: { nro: number; ano: number; sg_clube: string | null; nro_criador: string | null } | null
        mutacao: { descr: string } | null
    } | null
    total_ovos: number
    fecundados: number
    nascidos: number
    brancos: number
    taxa_fecundacao: number
    taxa_eclosao: number
}

export interface PassaroAnalise {
    passaro: {
        passaro_id: number
        descr: string | null
        sexo: number | null
        foto: string | null
        sit: number
        dt_nasc: string | null
        anel: { nro: number; ano: number; sg_clube: string | null; nro_criador: string | null } | null
        mutacao: { descr: string } | null
        especie: { descr: string } | null
    }
    casais: PassaroCasal[]
    totais: {
        ovos: number
        fecundados: number
        eclodidos: number
        nascidos: number
        taxa_fecundacao: number
        taxa_eclosao: number
    }
}

// ——— Hooks ——————————————————————————————————————————————

export function useGestaoEstatisticas() {
    return useQuery<EstatisticasData>({
        queryKey: ['gestao', 'estatisticas'],
        queryFn: async () => (await api.get<EstatisticasData>('/api/v1/gestao/estatisticas')).data,
        staleTime: 5 * 60 * 1000,
    })
}

export interface MelhoresReprodutoresPage {
    data: MelhoresReprodutoresItem[]
    meta: { total: number; page: number; per_page: number; last_page: number }
}

export function useGestaoMelhoresReprodutoresInfinite(sexo: 0 | 1 | 2) {
    return useInfiniteQuery<MelhoresReprodutoresPage>({
        queryKey: ['gestao', 'melhores-reprodutores', { sexo }],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({ page: String(pageParam) })
            if (sexo > 0) params.append('sexo', String(sexo))
            return (await api.get<MelhoresReprodutoresPage>(`/api/v1/gestao/melhores-reprodutores?${params}`)).data
        },
        initialPageParam: 1,
        getNextPageParam: (last) => last.meta.page < last.meta.last_page ? last.meta.page + 1 : null,
        staleTime: 5 * 60 * 1000,
    })
}

export function useGestaoPassaro(id: number | null) {
    return useQuery<PassaroAnalise>({
        queryKey: ['gestao', 'passaro', id],
        queryFn: async () => (await api.get<PassaroAnalise>(`/api/v1/gestao/passaro/${id}`)).data,
        enabled: id !== null,
        staleTime: 5 * 60 * 1000,
    })
}
