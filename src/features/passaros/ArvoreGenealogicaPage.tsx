/**
 * Página de Árvore Genealógica do Pássaro
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useArvoreGenealogica } from './passarosApi'
// import { useUserProfile } from '@/features/auth/userApi' // Temporariamente comentado (usado apenas para PDF)
import { formatRingComplete, getFotoUrl } from '@/lib/passaro'
import { SexoEnum } from '@/types'
import type { Anel } from '@/types'
import { API_BASE_URL } from '@/lib/api'
// import { generateGenealogyPDF } from './pdfGenerator' // Temporariamente comentado
// import type { PassaroArvore as PassaroArvorePDF } from './pdfGenerator' // Temporariamente comentado

// Tipo recursivo para o pássaro na árvore genealógica
// A API retorna os pais como pássaros completos, não apenas referências
interface PassaroArvore {
    passaro_id: number
    descr?: string | null
    dt_nasc?: string | null
    sexo?: number | null
    passaro_pai_id?: number | null
    passaro_mae_id?: number | null
    foto?: string | null
    anel?: Anel | null
    pai?: PassaroArvore | null
    mae?: PassaroArvore | null
}

// Ícone de sexo
function SexoIcon({ sexo }: { sexo?: number | null }) {
    if (sexo === SexoEnum.MACHO) {
        return <span className="text-blue-500">♂</span>
    }
    if (sexo === SexoEnum.FEMEA) {
        return <span className="text-pink-500">♀</span>
    }
    return <span className="text-gray-400">?</span>
}

// ========================================
// VISUALIZAÇÃO HORIZONTAL (estilo imagem)
// ========================================

// Card individual de pássaro na árvore horizontal
interface BirdCardProps {
    passaro: PassaroArvore | null | undefined
    isMain?: boolean
    size?: 'sm' | 'md' | 'lg'
    label?: string
}

function BirdCard({ passaro, isMain = false, size = 'md', label }: BirdCardProps) {
    const navigate = useNavigate()
    const [imageError, setImageError] = useState(false)
    const fotoUrl = passaro?.foto ? getFotoUrl(passaro.foto, API_BASE_URL) : null

    // Padronização: todos os cards terão o mesmo tamanho na horizontal
    const sizeClasses = {
        sm: 'w-[220px] min-h-[80px] text-[10px] px-2 py-2',
        md: 'w-[220px] min-h-[80px] text-xs px-3 py-2',
        lg: 'w-[220px] min-h-[80px] text-sm px-2 py-2',
    }

    const photoSizes = {
        sm: 'w-8 h-10',
        md: 'w-12 h-14',
        lg: 'w-14 h-16',
    }

    if (!passaro) {
        return (
            <div className={`
                flex flex-col items-center justify-center rounded-lg border-2 border-dashed
                border-gray-300 dark:border-gray-600 text-gray-400
                ${sizeClasses[size]}
            `}>
                {label && <div className="text-[10px] mb-1 font-medium">{label}</div>}
                <span>?</span>
            </div>
        )
    }

    const colorClass = passaro.sexo === SexoEnum.MACHO
        ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/60 dark:border-blue-500 dark:text-blue-200'
        : passaro.sexo === SexoEnum.FEMEA
            ? 'bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/60 dark:border-pink-500 dark:text-pink-200'
            : 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200'

    const ringNumber = formatRingComplete(passaro.anel)

    return (
        <button
            onClick={() => !isMain && navigate(`/passaros/${passaro.passaro_id}/arvore`)}
            disabled={isMain}
            className={`
                flex items-center gap-2 rounded-lg border-2 font-medium
                transition-all
                ${colorClass}
                ${sizeClasses[size]}
                ${isMain ? 'ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-gray-800' : 'hover:scale-105 hover:shadow-md cursor-pointer'}
            `}
        >
            {/* Foto à esquerda */}
            {fotoUrl && !imageError && (
                <div className={`overflow-hidden rounded border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0 ${photoSizes[size]}`}>
                    <img
                        src={fotoUrl}
                        alt={passaro.descr ?? 'Pássaro'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                </div>
            )}

            {/* Conteúdo à direita */}
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0">
                {label && <div className="text-[10px] font-medium opacity-70">{label}</div>}

                <div className="flex items-center justify-center gap-1 font-semibold">
                    <SexoIcon sexo={passaro.sexo} />
                    <span className="whitespace-nowrap">{ringNumber || `#${passaro.passaro_id}`}</span>
                </div>

                {passaro.descr && (
                    <span className="opacity-70 text-[9px] leading-tight text-center break-words w-full">
                        {passaro.descr}
                    </span>
                )}
            </div>
        </button>
    )
}

// Conector horizontal (linha)
function HorizontalLine({ width = 20 }: { width?: number }) {
    return (
        <div
            className="h-0.5 bg-amber-400 dark:bg-amber-500"
            style={{ width: `${width}px` }}
        />
    )
}

// Componente para renderizar um par (pai/mãe) com seus ancestrais
interface AncestorPairProps {
    pai: PassaroArvore | null | undefined
    mae: PassaroArvore | null | undefined
    level: number
    maxLevel: number
}

function AncestorPair({ pai, mae, level, maxLevel }: AncestorPairProps) {
    const showNextLevel = level < maxLevel

    return (
        <div className="flex flex-col justify-center">
            {/* Pai (em cima) e seus ancestrais */}
            <div className="flex items-center">
                <BirdCard passaro={pai} size={level >= 2 ? 'sm' : 'md'} label="Pai" />
                {showNextLevel && (
                    <>
                        <HorizontalLine width={16} />
                        <AncestorPair
                            pai={pai?.pai}
                            mae={pai?.mae}
                            level={level + 1}
                            maxLevel={maxLevel}
                        />
                    </>
                )}
            </div>

            {/* Espaçador com linha vertical conectora */}
            <div className="flex items-stretch h-4">
                <div className="flex items-center justify-end" style={{ width: '90px' }}>
                    <div className="w-0.5 h-full bg-amber-400 dark:bg-amber-500 -mr-px" />
                </div>
            </div>

            {/* Mãe (embaixo) e seus ancestrais */}
            <div className="flex items-center">
                <BirdCard passaro={mae} size={level >= 2 ? 'sm' : 'md'} label="Mãe" />
                {showNextLevel && (
                    <>
                        <HorizontalLine width={16} />
                        <AncestorPair
                            pai={mae?.pai}
                            mae={mae?.mae}
                            level={level + 1}
                            maxLevel={maxLevel}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

// Árvore genealógica horizontal completa (estilo imagem de referência)
function HorizontalTree({ passaro, maxGenerations = 3 }: { passaro: PassaroArvore; maxGenerations?: number }) {
    return (
        <div className="overflow-x-auto py-4">
            <div className="min-w-fit flex items-center px-4">
                {/* Pássaro principal à esquerda */}
                <BirdCard passaro={passaro} isMain size="lg" />

                {/* Linha conectora */}
                <HorizontalLine width={24} />

                {/* Ancestrais expandindo para direita */}
                <AncestorPair
                    pai={passaro.pai}
                    mae={passaro.mae}
                    level={1}
                    maxLevel={maxGenerations}
                />
            </div>
        </div>
    )
}

export function ArvoreGenealogicaPage() {
    const { id } = useParams<{ id: string }>()
    const passaroId = id ? Number(id) : null

    const { data: arvoreData, isLoading, error, refetch } = useArvoreGenealogica(passaroId)
    const passaro = arvoreData?.arvore
    const endogamia = arvoreData?.endogamia ?? 0
    // const { data: userProfile } = useUserProfile() // Temporariamente comentado (usado apenas para PDF)

    // Estados para geração de PDF - Temporariamente comentados
    // const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    // const [pdfError, setPdfError] = useState<string | null>(null)

    // Função para gerar PDF do certificado com jsPDF - Temporariamente comentada
    /* const handleGeneratePDF = async (passaroData: PassaroArvore) => {
        setIsGeneratingPDF(true)
        setPdfError(null)

        try {
            const pdfBlob = await generateGenealogyPDF({
                passaro: passaroData as PassaroArvorePDF,
                userProfile: userProfile ?? null,
                endogamia: endogamia,
                includePhotos: true
            })

            // Download automático
            const ringNumber = formatRingComplete(passaroData.anel) || `passaro-${passaroData.passaro_id}`
            const filename = `genealogia-${ringNumber.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`

            const url = URL.createObjectURL(pdfBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            setPdfError(error instanceof Error ? error.message : 'Erro desconhecido ao gerar PDF')

            // Fallback para window.print
            if (confirm('Erro ao gerar PDF. Deseja tentar abrir janela de impressão?')) {
                handlePrintFallback(passaroData)
            }
        } finally {
            setIsGeneratingPDF(false)
        }
    } */

    // Função fallback para impressão (método antigo) - Temporariamente comentada
    /* const handlePrintFallback = (passaroData: PassaroArvore) => {
        // Cria uma janela de impressão com o conteúdo formatado como certificado
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            alert('Por favor, permita pop-ups para gerar o PDF')
            return
        }

        const ringNumber = formatRingComplete(passaroData.anel)
        const criadorInfo = userProfile
            ? `${userProfile.sg_clube || ''} ${userProfile.nro_criador || ''}`.trim() || 'Não informado'
            : 'Não informado'
        const criadorNome = userProfile?.name || 'Criador'
        const dataEmissao = new Date().toLocaleDateString('pt-BR')

        // Função auxiliar para renderizar um card de pássaro
        const renderBird = (p: PassaroArvore | null | undefined, size: 'lg' | 'md' | 'sm' = 'md', isMain = false): string => {
            const sizeClass = size === 'lg' ? 'bird-lg' : size === 'sm' ? 'bird-sm' : 'bird-md'

            if (!p) {
                return `<div class="bird ${sizeClass} empty">?</div>`
            }

            const ring = formatRingComplete(p.anel) || `#${p.passaro_id}`
            const sexoClass = p.sexo === SexoEnum.MACHO ? 'male' : p.sexo === SexoEnum.FEMEA ? 'female' : ''
            const mainClass = isMain ? 'main' : ''

            return `
                <div class="bird ${sizeClass} ${sexoClass} ${mainClass}">
                    <span class="ring">${ring}</span>
                    ${p.descr ? `<span class="descr">${p.descr}</span>` : ''}
                </div>
            `
        }

        // Função para renderizar um par de ancestrais (pai em cima, mãe embaixo)
        const renderPair = (pai: PassaroArvore | null | undefined, mae: PassaroArvore | null | undefined, level: number, maxLevel: number): string => {
            const size = level >= 3 ? 'sm' : 'md'
            const showNext = level < maxLevel

            return `
                <div class="pair">
                    <div class="pair-row">
                        ${renderBird(pai, size)}
                        ${showNext ? `<div class="h-line"></div>${renderPair(pai?.pai, pai?.mae, level + 1, maxLevel)}` : ''}
                    </div>
                    <div class="v-line-container">
                        <div class="v-line"></div>
                    </div>
                    <div class="pair-row">
                        ${renderBird(mae, size)}
                        ${showNext ? `<div class="h-line"></div>${renderPair(mae?.pai, mae?.mae, level + 1, maxLevel)}` : ''}
                    </div>
                </div>
            `
        }

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificado Genealógico - ${ringNumber}</title>
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: white;
            font-size: 10px;
        }
        .certificate {
            background: white;
            border: 2px solid #1e40af;
            border-radius: 6px;
            padding: 15px;
            width: 277mm;
            height: 190mm;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            border: 1px solid #93c5fd;
            border-radius: 4px;
            pointer-events: none;
        }
        .header {
            text-align: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #1e40af;
            flex-shrink: 0;
        }
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
        }
        .subtitle {
            font-size: 11px;
            color: #6b7280;
        }
        .title {
            font-size: 14px;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
            font-weight: bold;
        }
        
        .tree-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 15px 10px;
            overflow: hidden;
        }
        
        .tree {
            display: flex;
            align-items: center;
            gap: 0;
        }
        
        .bird {
            border: 2px solid #d1d5db;
            border-radius: 6px;
            background: #f9fafb;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 4px 8px;
            flex-shrink: 0;
        }
        .bird-lg {
            min-width: 90px;
            min-height: 45px;
            font-size: 11px;
        }
        .bird-md {
            min-width: 75px;
            min-height: 38px;
            font-size: 10px;
        }
        .bird-sm {
            min-width: 65px;
            min-height: 32px;
            font-size: 9px;
        }
        .bird.male {
            background: #dbeafe;
            border-color: #3b82f6;
            color: #1e40af;
        }
        .bird.female {
            background: #fce7f3;
            border-color: #ec4899;
            color: #9d174d;
        }
        .bird.empty {
            border-style: dashed;
            color: #9ca3af;
        }
        .bird.main {
            border-width: 3px;
            box-shadow: 0 0 0 2px #3b82f6;
        }
        .bird .ring {
            font-weight: bold;
            white-space: nowrap;
        }
        .bird .descr {
            font-size: 8px;
            opacity: 0.8;
            margin-top: 2px;
            max-width: 80px;
            line-height: 1.2;
        }
        
        .h-line {
            width: 12px;
            height: 2px;
            background: #f59e0b;
            flex-shrink: 0;
        }
        
        .pair {
            display: flex;
            flex-direction: column;
        }
        .pair-row {
            display: flex;
            align-items: center;
        }
        .v-line-container {
            display: flex;
            justify-content: flex-start;
            padding-left: 37px;
        }
        .bird-md + .h-line ~ .pair .v-line-container {
            padding-left: 32px;
        }
        .bird-sm + .h-line ~ .pair .v-line-container {
            padding-left: 27px;
        }
        .v-line {
            width: 2px;
            height: 10px;
            background: #f59e0b;
        }
        
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            flex-shrink: 0;
        }
        .footer-section { 
            text-align: center;
            font-size: 9px;
            color: #6b7280;
        }
        .footer-section strong { 
            color: #374151;
            display: block;
        }
        .legend {
            display: flex;
            gap: 15px;
            font-size: 9px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 2px;
            border: 1px solid;
        }
        .legend-color.male { background: #dbeafe; border-color: #3b82f6; }
        .legend-color.female { background: #fce7f3; border-color: #ec4899; }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="logo">🐦 MeuPlantel.com</div>
            <div class="subtitle">Sistema de Gerenciamento de Criação de Aves</div>
            <div class="title">Certificado Genealógico</div>
        </div>

        <div class="tree-container">
            <div class="tree">
                ${renderBird(passaroData, 'lg', true)}
                <div class="h-line"></div>
                ${renderPair(passaroData.pai, passaroData.mae, 1, 3)}
            </div>
        </div>

        <div class="footer">
            <div class="footer-section">
                <strong>Criador</strong>
                ${criadorNome}
            </div>
            <div class="legend">
                <div class="legend-item"><div class="legend-color male"></div> Macho</div>
                <div class="legend-item"><div class="legend-color female"></div> Fêmea</div>
            </div>
            <div class="footer-section">
                <strong>Registro</strong>
                ${criadorInfo}
            </div>
            <div class="footer-section">
                <strong>Emissão</strong>
                ${dataEmissao}
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
        `

        printWindow.document.write(htmlContent)
        printWindow.document.close()
    } */

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Topbar title="Árvore Genealógica" showBack />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (error || !passaro) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Topbar title="Árvore Genealógica" showBack />
                <div className="p-4">
                    <ErrorState
                        message="Não foi possível carregar a árvore genealógica."
                        onRetry={() => refetch()}
                    />
                </div>
            </div>
        )
    }

    // Cast para nosso tipo local recursivo
    const passaroArvore = passaro as unknown as PassaroArvore

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
            <Topbar title="Árvore Genealógica" showBack />

            <div className="px-4 py-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Genealogia de {formatRingComplete(passaroArvore.anel)}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Visualize os ancestrais deste pássaro
                    </p>
                    {endogamia > 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Consanguinidade: {(endogamia * 100).toFixed(1)}%
                        </div>
                    )}
                </div>

                {/* Legenda */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Legenda</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
                            <span className="text-gray-600 dark:text-gray-400">Macho</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-400"></div>
                            <span className="text-gray-600 dark:text-gray-400">Fêmea</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-400"></div>
                            <span className="text-gray-600 dark:text-gray-400">Indefinido</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300"></div>
                            <span className="text-gray-600 dark:text-gray-400">Desconhecido</span>
                        </div>
                    </div>
                </section>

                {/* Lista hierárquica */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Visualização em Lista
                        </h2>
                        {/* Botão Gerar PDF temporariamente oculto */}
                        {/* <button
                            onClick={() => handleGeneratePDF(passaroArvore)}
                            disabled={isGeneratingPDF}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors
                                ${isGeneratingPDF
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-primary-500 hover:bg-primary-600'
                                }
                            `}
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Gerando PDF...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Gerar PDF
                                </>
                            )}
                        </button> */}
                    </div>
                    <div id="arvore-pdf-content" className="p-4">
                        <HorizontalTree passaro={passaroArvore} maxGenerations={3} />
                    </div>
                </section>
            </div>

            {/* Toast de erro - Temporariamente comentado */}
            {/* {pdfError && (
                <div className="fixed bottom-24 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                        <p className="font-semibold">Erro ao gerar PDF</p>
                        <p className="text-sm opacity-90">{pdfError}</p>
                    </div>
                    <button onClick={() => setPdfError(null)} className="flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )} */}
        </div>
    )
}
