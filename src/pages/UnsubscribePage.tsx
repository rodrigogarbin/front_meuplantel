/**
 * Pagina publica de descadastro de emails de campanha.
 *
 * Acessada via link no email: /unsubscribe?uid=X&token=HASH
 * Nao requer autenticacao.
 */

import { useState } from 'react'
import { api } from '@/lib/api'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function UnsubscribePage() {
    const [status, setStatus] = useState<Status>('idle')
    const [message, setMessage] = useState('')

    const params = new URLSearchParams(window.location.search)
    const uid = params.get('uid')
    const token = params.get('token')

    const linkInvalido = !uid || !token

    function handleDescadastrar() {
        if (linkInvalido) return
        setStatus('loading')

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
                setMessage(
                    (err.response?.data as { error?: string })?.error ??
                    'Erro ao processar o descadastro. O link pode ter expirado.'
                )
            })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-10 max-w-md w-full text-center">

                {/* Ícone */}
                <div className="mb-5 flex justify-center">
                    {(status === 'idle' || status === 'loading') && !linkInvalido && (
                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-7 h-7 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {(status === 'error' || linkInvalido) && (
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Título */}
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {linkInvalido && 'Link inválido'}
                    {!linkInvalido && status === 'idle' && 'Descadastrar emails'}
                    {!linkInvalido && status === 'loading' && 'Processando...'}
                    {status === 'success' && 'Descadastro realizado'}
                    {status === 'error' && 'Não foi possível processar'}
                </h1>

                {/* Mensagem */}
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {linkInvalido && 'Link inválido. Verifique se copiou o link completo do email.'}
                    {!linkInvalido && status === 'idle' && 'Ao confirmar, você não receberá mais emails de campanhas do MeuPlantel.'}
                    {!linkInvalido && status === 'loading' && 'Aguarde um momento enquanto processamos sua solicitação.'}
                    {(status === 'success' || status === 'error') && message}
                </p>

                {/* Botão de confirmação */}
                {!linkInvalido && status === 'idle' && (
                    <button
                        onClick={handleDescadastrar}
                        className="mt-8 w-full py-3 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-xl transition-colors"
                    >
                        Confirmar descadastro
                    </button>
                )}

                {!linkInvalido && status === 'loading' && (
                    <div className="mt-8 flex justify-center">
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Link de retorno */}
                {status !== 'loading' && (
                    <a
                        href="https://app.meuplantel.com"
                        className="inline-block mt-6 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Voltar ao MeuPlantel
                    </a>
                )}
            </div>
        </div>
    )
}

export default UnsubscribePage
