/**
 * Utilitários para formatação de datas e cálculo de idade
 */

/**
 * Formata uma data ISO para dd/mm/aaaa
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'

    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return '—'

        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()

        return `${day}/${month}/${year}`
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
        const birthDate = new Date(dateStr)
        if (isNaN(birthDate.getTime())) return '—'

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
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return '—'

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
