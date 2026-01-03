/**
 * Utilitários para formatação de dados de pássaros
 */

import type { Anel, Passaro } from '@/types'

/**
 * Formata a anilha no padrão ANO-NRO (ex: 2024-0123)
 * @deprecated Use formatRingComplete para exibição completa
 */
export function formatRing(anel: Anel | null | undefined): string {
    if (!anel) return '—'

    const nro = anel.nro?.toString().padStart(4, '0') ?? '0000'
    const ano = anel.ano ?? '????'

    return `${ano}-${nro}`
}

/**
 * Formata a anilha completa no padrão "SG_CLUBE NRO_CRIADOR NRO/ANO"
 * Exemplo: "EH130 005/2025"
 */
export function formatRingComplete(anel: Anel | null | undefined): string {
    if (!anel) return '—'

    const parts: string[] = []

    // Sigla do clube + número criador (se houver)
    if (anel.sg_clube) {
        parts.push(anel.sg_clube)
    }
    if (anel.nro_criador) {
        parts.push(anel.nro_criador)
    }

    // Número/Ano do anel
    const nro = anel.nro?.toString().padStart(3, '0') ?? '000'
    const ano = anel.ano ?? '????'
    parts.push(`${nro}/${ano}`)

    return parts.join(' ')
}

/**
 * Formata o pássaro completo: "SG_CLUBE NRO_CRIADOR NRO/ANO - DESCRICAO"
 * Exemplo: "EH130 005/2025 - Roseicollis Verde"
 */
export function formatPassaroCompleto(passaro: Passaro | null | undefined): string {
    if (!passaro) return '—'

    const anel = formatRingComplete(passaro.anel)
    // Busca descrição em várias fontes possíveis
    const descr = passaro.descr || passaro.mutacao?.descr || passaro.mutacao?.descricao || ''

    return descr ? `${anel} - ${descr}` : anel
}

/**
 * Formata a anilha completa com ident_extra se houver
 * @deprecated Use formatRingComplete
 */
export function formatRingFull(anel: Anel | null | undefined): string {
    if (!anel) return '—'

    const base = formatRingComplete(anel)

    if (anel.ident_extra) {
        return `${base} (${anel.ident_extra})`
    }

    return base
}

/**
 * Retorna o ícone de sexo
 */
export function sexIcon(sexo: number | null | undefined): string {
    switch (sexo) {
        case 1: return '♂'
        case 2: return '♀'
        default: return '?'
    }
}

/**
 * Retorna o texto do sexo
 */
export function sexText(sexo: number | null | undefined): string {
    switch (sexo) {
        case 1: return 'Macho'
        case 2: return 'Fêmea'
        default: return 'Indefinido'
    }
}

/**
 * Retorna a cor CSS do sexo
 */
export function sexColor(sexo: number | null | undefined): string {
    switch (sexo) {
        case 1: return 'text-blue-600 bg-blue-100'
        case 2: return 'text-pink-600 bg-pink-100'
        default: return 'text-gray-600 bg-gray-100'
    }
}

/**
 * Retorna o texto da situação
 */
export function situacaoText(sit: number | null | undefined): string {
    return sit === 1 ? 'Ativo' : 'Inativo'
}

/**
 * Retorna a cor CSS da situação
 */
export function situacaoColor(sit: number | null | undefined): string {
    return sit === 1
        ? 'text-emerald-600 bg-emerald-100'
        : 'text-gray-600 bg-gray-100'
}

/**
 * Extrai a espécie do pássaro (API pode retornar como especieUsuario ou especie_usuario)
 */
export function getEspecie(passaro: Passaro): string {
    const especie = passaro.especie_usuario ?? passaro.especieUsuario
    return especie?.descr ?? '—'
}

/**
 * Extrai a mutação do pássaro
 */
export function getMutacao(passaro: Passaro): string {
    const mutacao = passaro.mutacao
    return mutacao?.descr ?? mutacao?.descricao ?? '—'
}

/**
 * Gera a URL da foto do pássaro
 */
export function getFotoUrl(foto: string | null | undefined, baseUrl: string): string | null {
    if (!foto) return null

    // Se já for uma URL completa, retorna como está
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
        return foto
    }

    // Caso contrário, concatena com a base URL
    return `${baseUrl}/storage/fotos/${foto}`
}
