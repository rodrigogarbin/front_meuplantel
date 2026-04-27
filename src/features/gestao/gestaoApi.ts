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
    nascidos: number
    ferteis: number
    choco: number
    branco: number
    embriao_morto: number
    filhote_morto: number
    fecundados: number
    eclodidos: number
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
        periodo: { tipo: string; valor: number | null; nome: string }
        ano_atual: ComparativoStats
        media_historica: ComparativoStats | null
    }
}

export type PeriodoTipo = 'ano' | 'mes' | 'trimestre' | 'semestre'

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

export interface PeriodoParams {
    tipo: PeriodoTipo
    valor: number   // 0 = período atual
    valorFim?: number  // apenas para 'mes' (range De→Até)
    especieId?: number | null
}

export function useGestaoEstatisticas(periodo?: PeriodoParams) {
    return useQuery<EstatisticasData>({
        queryKey: ['gestao', 'estatisticas', periodo],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (periodo?.tipo && periodo.tipo !== 'ano') params.set('periodo', periodo.tipo)
            if (periodo?.valor) params.set('valor', String(periodo.valor))
            if (periodo?.valorFim && periodo.valorFim !== periodo.valor) {
                params.set('valor_fim', String(periodo.valorFim))
            }
            if (periodo?.especieId != null) params.set('especie_usuario_id', String(periodo.especieId))
            const qs = params.toString()
            return (await api.get<EstatisticasData>(`/api/v1/gestao/estatisticas${qs ? '?' + qs : ''}`)).data
        },
        staleTime: 5 * 60 * 1000,
    })
}

export interface MelhoresReprodutoresPage {
    data: MelhoresReprodutoresItem[]
    meta: { total: number; page: number; per_page: number; last_page: number }
}

export function useGestaoMelhoresReprodutoresInfinite(sexo: 0 | 1 | 2, especieId?: number | null) {
    return useInfiniteQuery<MelhoresReprodutoresPage>({
        queryKey: ['gestao', 'melhores-reprodutores', { sexo, especieId }],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({ page: String(pageParam) })
            if (sexo > 0) params.append('sexo', String(sexo))
            if (especieId != null) params.append('especie_usuario_id', String(especieId))
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
