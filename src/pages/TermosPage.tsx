/**
 * Página de Termos de Uso
 *
 * Rota pública — sem autenticação. Não usa Topbar para evitar requests
 * autenticadas (notificações) que acionariam redirect para /login.
 */

import { Link, useNavigate } from 'react-router-dom'

export function TermosPage() {
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
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Termos de Uso</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Cabeçalho visual */}
                <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 mb-6 text-white">
                    <h2 className="text-xl font-bold mb-1">Termos de Uso</h2>
                    <p className="text-blue-100 text-sm">Ultima atualizacao: junho de 2026</p>
                </div>

                {/* Conteúdo */}
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            1. Aceitacao dos Termos
                        </h3>
                        <p>
                            Ao criar uma conta e utilizar o MeuPlantel, voce concorda com estes Termos de Uso.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            2. Descricao do Servico
                        </h3>
                        <p>
                            O MeuPlantel e um sistema de gerenciamento de plantel de aves que permite cadastrar
                            passaros, casais, posturas, genealogia e relatorios.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            3. Conta de Usuario
                        </h3>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Voce e responsavel por manter suas credenciais seguras.</li>
                            <li>Cada conta e pessoal e intransferivel.</li>
                            <li>E proibido criar contas falsas ou em nome de terceiros sem autorizacao.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            4. Uso Permitido
                        </h3>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Uso pessoal para gestao do seu plantel de aves.</li>
                            <li>Geracao de relatorios e certificados de genealogia.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            5. Uso Proibido
                        </h3>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Revenda ou sublicenciamento do servico.</li>
                            <li>Uso automatizado (bots, scrapers) sem autorizacao previa.</li>
                            <li>Violacao de direitos de terceiros.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            6. Responsabilidade
                        </h3>
                        <p>
                            O MeuPlantel nao se responsabiliza por perda de dados causada por falha do usuario,
                            como exclusao acidental de registros.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            7. Modificacoes
                        </h3>
                        <p>
                            Podemos atualizar estes termos a qualquer momento. Alteracoes significativas
                            serao comunicadas por e-mail.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            8. Rescisao
                        </h3>
                        <p>
                            Voce pode encerrar sua conta a qualquer momento. Podemos suspender contas que
                            violem estes termos.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            9. Lei Aplicavel
                        </h3>
                        <p>
                            Estes termos sao regidos pelas leis brasileiras. Foro: comarca de [Cidade/UF].
                        </p>
                    </section>

                    <section>
                        <p>
                            Duvidas:{' '}
                            <a
                                href="mailto:suporte@meuplantel.com"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                suporte@meuplantel.com
                            </a>
                        </p>
                    </section>
                </div>

                {/* Link para Privacidade */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <Link
                        to="/privacidade"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Ver Politica de Privacidade
                    </Link>
                </div>
            </div>
        </div>
    )
}
