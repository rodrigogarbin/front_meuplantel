/**
 * Página de Política de Privacidade
 *
 * Rota pública — sem autenticação. Não usa Topbar para evitar requests
 * autenticadas (notificações) que acionariam redirect para /login.
 */

import { Link, useNavigate } from 'react-router-dom'

export function PrivacidadePage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header simples — sem dependências autenticadas */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="h-14 px-4 flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
                        aria-label="Voltar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Politica de Privacidade</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Cabeçalho visual */}
                <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 mb-6 text-white">
                    <h2 className="text-xl font-bold mb-1">Politica de Privacidade</h2>
                    <p className="text-blue-100 text-sm">Ultima atualizacao: junho de 2026</p>
                </div>

                {/* Conteúdo */}
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            1. Controlador dos Dados
                        </h3>
                        <p>
                            MeuPlantel —{' '}
                            <a
                                href="mailto:suporte@meuplantel.com"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                suporte@meuplantel.com
                            </a>
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            2. Dados Coletados
                        </h3>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Dados de cadastro: nome, e-mail, clube, numero de criador.</li>
                            <li>
                                Dados do plantel: informacoes sobre passaros, casais, posturas e genealogia
                                inseridas pelo usuario.
                            </li>
                            <li>Dados tecnicos: endereco IP, tipo de dispositivo, data/hora de acesso.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            3. Finalidade do Tratamento (LGPD)
                        </h3>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Prestacao do servico de gerenciamento de plantel.</li>
                            <li>Comunicacoes sobre o servico (atualizacoes, notificacoes).</li>
                            <li>Seguranca e prevencao de fraudes.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            4. Base Legal
                        </h3>
                        <p>
                            Execucao de contrato (Art. 7, V da LGPD) e legitimo interesse do controlador.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            5. Compartilhamento
                        </h3>
                        <p>
                            Nao compartilhamos seus dados com terceiros, exceto quando exigido por lei.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            6. Retencao
                        </h3>
                        <p>
                            Seus dados sao mantidos enquanto sua conta estiver ativa. Apos encerramento,
                            sao excluidos em ate 90 dias, salvo obrigacao legal.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            7. Cookies
                        </h3>
                        <p>
                            Utilizamos um cookie de sessao (HttpOnly, Secure) exclusivamente para autenticacao.
                            Nao utilizamos cookies de rastreamento ou publicidade.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            8. Seus Direitos (LGPD)
                        </h3>
                        <p>
                            Voce tem direito a: acessar, corrigir, excluir, portar e revogar o consentimento
                            dos seus dados. Solicitacoes:{' '}
                            <a
                                href="mailto:suporte@meuplantel.com"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                suporte@meuplantel.com
                            </a>
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            9. Alteracoes
                        </h3>
                        <p>
                            Atualizacoes serao comunicadas por e-mail com antecedencia minima de 15 dias.
                        </p>
                    </section>
                </div>

                {/* Link para Termos */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <Link
                        to="/termos"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Ver Termos de Uso
                    </Link>
                </div>
            </div>
        </div>
    )
}
