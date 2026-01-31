/**
 * Utilitários para formatação de datas e cálculo de idade
 */

/**
 * Extrai partes (ano, mês, dia) de uma string de data (YYYY-MM-DD ou ISO)
 * sem passar por new Date(), evitando problemas de fuso horário.
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = parseInt(match[3], 10)
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return { year, month, day }
}

/**
 * Cria um Date local a partir de uma string YYYY-MM-DD sem deslocamento de fuso.
 */
export function parseLocalDate(dateStr: string): Date | null {
    const parts = parseDateParts(dateStr)
    if (!parts) return null
    return new Date(parts.year, parts.month - 1, parts.day)
}

/**
 * Formata uma data ISO para dd/mm (curto)
 */
export function formatShortDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'

    try {
        const parts = parseDateParts(dateStr)
        if (!parts) return '—'

        const day = parts.day.toString().padStart(2, '0')
        const month = parts.month.toString().padStart(2, '0')

        return `${day}/${month}`
    } catch {
        return '—'
    }
}

/**
 * Formata uma data ISO para dd/mm/aaaa
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'

    try {
        const parts = parseDateParts(dateStr)
        if (!parts) return '—'

        const day = parts.day.toString().padStart(2, '0')
        const month = parts.month.toString().padStart(2, '0')

        return `${day}/${month}/${parts.year}`
    } catch {
        return '—'
    }
}

/**
 * Calcula a idade em formato humano (ex: "1a 2m" ou "3m 15d")
 */
export function calcAgeHuman(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'

    try {
        const birthDate = parseLocalDate(dateStr)
        if (!birthDate) return '—'

        const now = new Date()

        let years = now.getFullYear() - birthDate.getFullYear()
        let months = now.getMonth() - birthDate.getMonth()
        let days = now.getDate() - birthDate.getDate()

        // Ajustar dias negativos
        if (days < 0) {
            months--
            // Pega o último dia do mês anterior
            const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
            days += lastMonth.getDate()
        }

        // Ajustar meses negativos
        if (months < 0) {
            years--
            months += 12
        }

        // Formatar saída
        if (years > 0) {
            if (months > 0) {
                return `${years}a ${months}m`
            }
            return `${years}a`
        }

        if (months > 0) {
            if (days > 0) {
                return `${months}m ${days}d`
            }
            return `${months}m`
        }

        return `${days}d`
    } catch {
        return '—'
    }
}

/**
 * Retorna data relativa (ex: "há 2 dias", "há 1 mês")
 */
export function relativeDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'

    try {
        const date = parseLocalDate(dateStr)
        if (!date) return '—'

        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoje'
        if (diffDays === 1) return 'Ontem'
        if (diffDays < 7) return `${diffDays} dias atrás`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`

        return `${Math.floor(diffDays / 365)} anos atrás`
    } catch {
        return '—'
    }
}
