import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api'
import { HorizontalTree } from '@/features/passaros/GenealogyTree'
import type { PassaroArvore } from '@/features/passaros/GenealogyTree'

interface CertificadoData {
    autentico: boolean
    token?: string
    passaro_id?: number
    anilha?: string
    descr?: string
    criado_em?: string
    usuario_nome?: string
}

export function CertificadoVerificacaoPage() {
    const { token } = useParams<{ token: string }>()
    const [data, setData] = useState<CertificadoData | null>(null)
    const [loading, setLoading] = useState(true)
    const [arvore, setArvore] = useState<PassaroArvore | null>(null)
    const [endogamia, setEndogamia] = useState(0)

    useEffect(() => {
        if (!token) return
        api.get<CertificadoData>(`/api/v1/certificados/${token}/verificar`)
            .then(res => {
                setData(res.data)
                if (res.data.autentico) {
                    api.get<{ arvore: PassaroArvore; endogamia: number }>(`/api/v1/certificados/${token}/arvore`)
                        .then(r => {
                            setArvore(r.data.arvore)
                            setEndogamia(r.data.endogamia ?? 0)
                        })
                        .catch(() => {})
                }
            })
            .catch(() => setData({ autentico: false }))
            .finally(() => setLoading(false))
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verificando certificado...</p>
                </div>
            </div>
        )
    }

    const autentico = data?.autentico

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
            <div className="w-full max-w-2xl mx-auto space-y-4">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">MeuPlantel</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sistema de Gerenciamento de Criação de Aves</div>
                </div>

                {/* Status card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Blue top bar */}
                    <div className="h-1 bg-blue-600" />

                    {/* Status banner */}
                    <div className={`flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700 ${
                        autentico
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                        {autentico ? (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <div className={`font-semibold text-base ${autentico ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'}`}>
                                {autentico ? 'Certificado Autêntico' : 'Certificado Inválido'}
                            </div>
                            <div className={`text-sm mt-0.5 ${autentico ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {autentico
                                    ? 'Este documento foi gerado pelo MeuPlantel'
                                    : 'Este certificado não foi encontrado em nossa base de dados'}
                            </div>
                        </div>
                    </div>

                    {/* Certificate details */}
                    {autentico && (
                        <div className="px-5 py-4 space-y-3">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {data?.anilha && (
                                    <div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Anilha</div>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{data.anilha}</div>
                                    </div>
                                )}
                                {data?.descr && (
                                    <div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Descrição</div>
                                        <div className="text-gray-700 dark:text-gray-300 text-sm">{data.descr}</div>
                                    </div>
                                )}
                                {data?.usuario_nome && (
                                    <div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Criador</div>
                                        <div className="text-gray-700 dark:text-gray-300 text-sm">{data.usuario_nome}</div>
                                    </div>
                                )}
                                {data?.criado_em && (
                                    <div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Emitido em</div>
                                        <div className="text-gray-700 dark:text-gray-300 text-sm">{data.criado_em}</div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Código de verificação</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                                    {token}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Current genealogy tree */}
                {arvore && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Árvore Genealógica Atual</h2>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    Dados em tempo real — compare com o certificado impresso
                                </p>
                            </div>
                            {endogamia > 0 && (
                                <div className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium">
                                    Endogamia {(endogamia * 100).toFixed(1)}%
                                </div>
                            )}
                        </div>
                        <div className="p-4 overflow-x-auto">
                            <HorizontalTree passaro={arvore} maxGenerations={3} interactive={false} />
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 pt-2">
                    meuplantel.com — Sistema de Gerenciamento de Criação de Aves
                </p>
            </div>
        </div>
    )
}
