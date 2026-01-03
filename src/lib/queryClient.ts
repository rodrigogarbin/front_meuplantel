/**
 * Configuração do QueryClient do React Query
 * 
 * Exportado separadamente para evitar importações circulares
 * e permitir acesso ao queryClient de outros módulos (ex: logout)
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Tempo que os dados ficam "fresh" (não refetch)
            staleTime: 1000 * 60 * 5, // 5 minutos
            // Tempo que os dados ficam em cache
            gcTime: 1000 * 60 * 30, // 30 minutos
            // Retry em caso de erro
            retry: 1,
            // Não refetch ao focar a janela (mobile-friendly)
            refetchOnWindowFocus: false,
        },
    },
})
