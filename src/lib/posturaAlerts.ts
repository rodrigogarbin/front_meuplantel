/**
 * Shared utility for postura alert calculation
 * Single source of truth consumed by: CasalCard, CasalDetailsSheet, PosturasPage, posturasApi
 */

import { SitPostura } from '@/types'

export interface PosturaDiasConfig {
    diasChoco?: number | null
    diasAnilha?: number | null
    diasSepara?: number | null
}

export interface PosturaAlertInput {
    sit: number
    data?: string | null         // date of egg laying (YYYY-MM-DD)
    data_nasc?: string | null    // date of hatching
    data_separa?: string | null  // date of separation
    nro_anel?: number | null
    ano_anel?: number | null
    passaro_id?: number | null
}

export type AlertType = 'nascendo' | 'proximo' | 'anilhar' | 'separar' | 'verificar'

export interface PosturaAlertResult {
    alerts: AlertType[]
    diasRestantes?: number       // for 'nascendo'/'proximo': days until hatch (negative = overdue)
    previsaoNascimento?: Date    // the computed hatch date
    previsaoAnilha?: Date
    previsaoSepara?: Date
}

/**
 * Parses a YYYY-MM-DD string into a local Date (midnight, no timezone shift).
 */
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null
    try {
        const d = new Date(dateStr + 'T00:00:00')
        if (isNaN(d.getTime())) return null
        return d
    } catch {
        return null
    }
}

function today(): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Calculates actionable alerts for a single postura.
 */
export function calcPosturaAlerts(
    postura: PosturaAlertInput,
    config: PosturaDiasConfig
): PosturaAlertResult {
    const result: PosturaAlertResult = { alerts: [] }
    const { diasChoco, diasAnilha, diasSepara } = config
    const agora = today()

    const isChocoOuFertil = postura.sit === SitPostura.CHOCO || postura.sit === SitPostura.FERTIL
    const isNascido = postura.sit === SitPostura.NASCIDO
    const semPassaro = !postura.passaro_id

    // --- nascendo / proximo ---
    if (isChocoOuFertil && diasChoco != null && postura.data) {
        const dataPostura = parseDate(postura.data)
        if (dataPostura) {
            const previsao = new Date(dataPostura)
            previsao.setDate(previsao.getDate() + diasChoco)
            result.previsaoNascimento = previsao

            const diffMs = previsao.getTime() - agora.getTime()
            const diasRestantes = Math.ceil(diffMs / 86400000)
            result.diasRestantes = diasRestantes

            if (diasRestantes <= 0) {
                result.alerts.push('nascendo')

                // verificar: nascimento esperado há mais de 30 dias e sem data_nasc
                if (!postura.data_nasc && diasRestantes <= -30) {
                    result.alerts.push('verificar')
                }
            } else if (diasRestantes >= 1 && diasRestantes <= 3) {
                result.alerts.push('proximo')
            }
        }
    }

    // --- anilhar / separar ---
    if (isNascido && semPassaro && postura.data_nasc) {
        const dataNasc = parseDate(postura.data_nasc)
        if (dataNasc) {
            const jaAnilhado = !!(postura.nro_anel && postura.ano_anel)

            if (!jaAnilhado) {
                // anilhar
                if (diasAnilha != null) {
                    const previsaoAnilha = new Date(dataNasc)
                    previsaoAnilha.setDate(previsaoAnilha.getDate() + diasAnilha)
                    result.previsaoAnilha = previsaoAnilha

                    if (previsaoAnilha <= agora) {
                        result.alerts.push('anilhar')

                        // verificar: anilha esperada há mais de 30 dias
                        const limite = new Date(previsaoAnilha)
                        limite.setDate(limite.getDate() + 30)
                        if (limite <= agora) {
                            result.alerts.push('verificar')
                        }
                    }
                }
            } else {
                // separar
                if (diasSepara != null && !postura.data_separa) {
                    const previsaoSepara = new Date(dataNasc)
                    previsaoSepara.setDate(previsaoSepara.getDate() + diasSepara)
                    result.previsaoSepara = previsaoSepara

                    if (previsaoSepara <= agora) {
                        result.alerts.push('separar')

                        // verificar: separação esperada há mais de 30 dias
                        const limite = new Date(previsaoSepara)
                        limite.setDate(limite.getDate() + 30)
                        if (limite <= agora) {
                            result.alerts.push('verificar')
                        }
                    }
                }
            }
        }
    }

    return result
}

/**
 * Resolves dias (choco/anilha/separa) from a casal object.
 * Priority: casal direct fields > macho.especie > femea.especie
 * All fields are optional — returns undefined when not configured.
 */
export function getDiasConfig(casal?: {
    dias_choco?: number | null
    dias_anilha?: number | null
    dias_separa?: number | null
    macho?: { especie?: { dias_choco?: number | null; dias_anilha?: number | null; dias_separa?: number | null } | null } | null
    femea?: { especie?: { dias_choco?: number | null; dias_anilha?: number | null; dias_separa?: number | null } | null } | null
} | null): PosturaDiasConfig {
    return {
        diasChoco: casal?.dias_choco ?? casal?.macho?.especie?.dias_choco ?? casal?.femea?.especie?.dias_choco,
        diasAnilha: casal?.dias_anilha ?? casal?.macho?.especie?.dias_anilha ?? casal?.femea?.especie?.dias_anilha,
        diasSepara: casal?.dias_separa ?? casal?.macho?.especie?.dias_separa ?? casal?.femea?.especie?.dias_separa,
    }
}
