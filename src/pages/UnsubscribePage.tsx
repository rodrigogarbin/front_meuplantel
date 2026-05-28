/**
 * Pagina publica de descadastro de emails de campanha.
 *
 * Acessada via link no email: /unsubscribe?uid=X&token=HASH
 * Nao requer autenticacao.
 */

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Status = 'loading' | 'success' | 'error'

export function UnsubscribePage() {
    const [status, setStatus] = useState<Status>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const uid = params.get('uid')
        const token = params.get('token')

        if (!uid || !token) {
            setStatus('error')
            setMessage('Link invalido. Verifique se copiou o link completo do email.')
            return
        }

        api
            .get('/api/v1/unsubscribe', { params: { uid, token } })
            .then((res) => {
                setStatus('success')
                setMessage(
                    (res.data as { message?: string }).message ??
                        'Seu email foi removido da lista de campanhas.'
                )
            })
            .catch((err) => {
                setStatus('error')
                const errorMessage =
                    (err.response?.data as { error?: string })?.error ??
                    'Erro ao processar o descadastro. O link pode ter expirado.'
                setMessage(errorMessage)
            })
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-10 max-w-md w-full text-center">
                {/* Icone de status */}
                <div className="mb-5 flex justify-center">
                    {status === 'loading' && (
                        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-green-600 dark:text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-600 dark:text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Titulo */}
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {status === 'loading' && 'Processando...'}
                    {status === 'success' && 'Descadastro realizado'}
                    {status === 'error' && 'Nao foi possivel processar'}
                </h1>

                {/* Mensagem */}
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {status === 'loading'
                        ? 'Aguarde um momento enquanto processamos sua solicitacao.'
                        : message}
                </p>

                {/* Link de retorno — exibido apos conclusao */}
                {status !== 'loading' && (
                    <a
                        href="https://meuplantel.com"
                        className="inline-block mt-8 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Voltar ao MeuPlantel
                    </a>
                )}
            </div>
        </div>
    )
}

export default UnsubscribePage
