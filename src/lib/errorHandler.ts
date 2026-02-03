/**
 * Utilitário para extrair mensagens de erro da API
 */

import { AxiosError } from 'axios'

/**
 * Extrai a mensagem de erro de uma resposta da API Laravel
 *
 * @param error - Erro capturado no catch
 * @param fallbackMessage - Mensagem padrão caso não consiga extrair da API
 * @returns Mensagem de erro formatada para exibição ao usuário
 */
export function getApiErrorMessage(error: unknown, fallbackMessage = 'Ocorreu um erro. Tente novamente.'): string {
    // Verifica se é um erro do Axios com resposta da API
    if (error instanceof AxiosError && error.response?.data) {
        const apiError = error.response.data

        // Laravel retorna mensagens em diferentes formatos:

        // 1. Mensagem geral (mais comum)
        if (apiError.message) {
            return apiError.message
        }

        // 2. Erro alternativo
        if (apiError.error) {
            return apiError.error
        }

        // 3. Erros de validação (objeto com array de mensagens por campo)
        if (apiError.errors && typeof apiError.errors === 'object') {
            // Formata todos os erros de validação com nome do campo
            const errorMessages: string[] = []

            for (const [field, messages] of Object.entries(apiError.errors)) {
                if (Array.isArray(messages)) {
                    messages.forEach((msg: string) => {
                        errorMessages.push(`${field}: ${msg}`)
                    })
                } else if (typeof messages === 'string') {
                    errorMessages.push(`${field}: ${messages}`)
                }
            }

            if (errorMessages.length > 0) {
                return errorMessages.join('\n')
            }
        }
    }

    // Se não conseguiu extrair da API, tenta usar a mensagem do Error
    if (error instanceof Error && error.message) {
        return error.message
    }

    // Retorna a mensagem padrão
    return fallbackMessage
}
