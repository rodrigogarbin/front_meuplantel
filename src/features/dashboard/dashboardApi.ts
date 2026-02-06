/**
 * API hooks para o Dashboard
 * Usa a rota /api/v1/passaros/dados que já existe
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// Estrutura de dados retornada pela API /passaros/dados
interface PassarosDadosResponse {
    passaros?: Array<{
        ano: number
        nascidos: number
        machos: number
        femeas: number
    }>
    posturas?: Array<{
        ano: number
        total: number
        nascidos: number
        choco: number
        ferteis: number
        branco: number
        embriaoMorto: number
        filhoteMorto: number
    }>
    totais?: Array<{
        ano: number
        nascidos: number
        gaiolas: number
        posturas: number
    }>
}

// Estrutura para o dashboard do frontend
export interface DashboardStats {
    totalPassaros: number
    passarosPorSexo: {
        machos: number
        femeas: number
        indefinidos: number
    }
    passarosPorSituacao: {
        plantel: number
        vendidos: number
        mortos: number
        emprestados: number
    }
    totalCasais: number
    casaisAtivos: number
    posturasAno: number
    filhotesAno: number
    aniversariantes: Array<{
        id: number
        nome: string | null
        anel: string | null
        nascimento: string
        idade: string
    }>
    // Dados extras do gráfico
    historicoAnual?: Array<{
        ano: number
        nascidos: number
        machos: number
        femeas: number
    }>
    // Dados de posturas detalhadas
    posturasDetalhadas?: {
        nascidos: number
        choco: number
        ferteis: number
        branco: number
        embriaoMorto: number
        filhoteMorto: number
    }
    // Histórico de posturas por ano
    historicoPosturas?: Array<{
        ano: number
        total: number
        nascidos: number
        gaiolas: number
    }>
    // Anos disponíveis para filtro
    anosDisponiveis: number[]
}

/**
 * Busca estatísticas do dashboard usando /api/v1/passaros/dados
 */
async function fetchDashboardStats(anoSelecionado?: number): Promise<DashboardStats> {
    try {
        const response = await api.get<PassarosDadosResponse>('/api/v1/passaros/dados')
        const data = response.data || {}

        // Anos disponíveis (extraídos dos dados)
        const anosPassaros = data.passaros?.map(p => p.ano) || []
        const anosPosturas = data.posturas?.map(p => p.ano) || []
        const todosAnos = [...new Set([...anosPassaros, ...anosPosturas])].sort((a, b) => b - a)

        // Ano para filtrar (selecionado ou atual)
        const anoFiltro = anoSelecionado || new Date().getFullYear()

        // Encontra dados do ano selecionado
        const dadosAnoSelecionado = data.passaros?.find(p => p.ano === anoFiltro)
        const posturasAnoSelecionado = data.posturas?.find(p => p.ano === anoFiltro)
        const totaisAnoSelecionado = data.totais?.find(t => t.ano === anoFiltro)
        // Calcula total de nascidos de todos os anos
        const totalNascidos = data.passaros?.reduce((sum, p) => sum + (p.nascidos || 0), 0) || 0

        // Dados do ano selecionado para sexo
        const machosAno = dadosAnoSelecionado?.machos || 0
        const femeasAno = dadosAnoSelecionado?.femeas || 0
        const nascidosAno = dadosAnoSelecionado?.nascidos || 0
        const indefinidosAno = nascidosAno - machosAno - femeasAno

        return {
            totalPassaros: totalNascidos,
            passarosPorSexo: {
                machos: machosAno,
                femeas: femeasAno,
                indefinidos: indefinidosAno > 0 ? indefinidosAno : 0,
            },
            passarosPorSituacao: {
                plantel: totalNascidos, // A API dados não separa por situação
                vendidos: 0,
                mortos: 0,
                emprestados: 0,
            },
            totalCasais: totaisAnoSelecionado?.gaiolas || 0,
            casaisAtivos: totaisAnoSelecionado?.gaiolas || 0,
            posturasAno: posturasAnoSelecionado?.total || 0,
            filhotesAno: dadosAnoSelecionado?.nascidos || 0,
            aniversariantes: [], // A API dados não retorna aniversariantes
            historicoAnual: data.passaros || [],
            posturasDetalhadas: posturasAnoSelecionado ? {
                nascidos: posturasAnoSelecionado.nascidos || 0,
                choco: posturasAnoSelecionado.choco || 0,
                ferteis: posturasAnoSelecionado.ferteis || 0,
                branco: posturasAnoSelecionado.branco || 0,
                embriaoMorto: posturasAnoSelecionado.embriaoMorto || 0,
                filhoteMorto: posturasAnoSelecionado.filhoteMorto || 0,
            } : undefined,
            historicoPosturas: data.totais?.map(t => ({
                ano: t.ano,
                total: t.posturas,
                nascidos: t.nascidos,
                gaiolas: t.gaiolas,
            })) || [],
            anosDisponiveis: todosAnos,
        }
    } catch (error) {
        // Se der erro, retorna dados vazios em vez de propagar o erro
        // Isso é útil para usuários novos que não têm dados ainda
        console.warn('Erro ao buscar dados do dashboard, retornando dados vazios:', error)
        return {
            totalPassaros: 0,
            passarosPorSexo: {
                machos: 0,
                femeas: 0,
                indefinidos: 0,
            },
            passarosPorSituacao: {
                plantel: 0,
                vendidos: 0,
                mortos: 0,
                emprestados: 0,
            },
            totalCasais: 0,
            casaisAtivos: 0,
            posturasAno: 0,
            filhotesAno: 0,
            aniversariantes: [],
            historicoAnual: [],
            anosDisponiveis: [new Date().getFullYear()],
        }
    }
}

/**
 * Hook para buscar estatísticas do dashboard
 */
export function useDashboardStats(ano?: number) {
    return useQuery({
        queryKey: ['dashboard', 'stats', ano],
        queryFn: () => fetchDashboardStats(ano),
        staleTime: 1000 * 60 * 5, // 5 minutos
    })
}
