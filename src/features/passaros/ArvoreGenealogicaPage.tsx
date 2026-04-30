/**
 * Página de Árvore Genealógica do Pássaro
 */

import { useParams } from 'react-router-dom'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { QRCodeCanvas } from 'qrcode.react'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useArvoreGenealogica } from './passarosApi'
import { formatRingComplete } from '@/lib/passaro'
import api from '@/lib/api'
import { HorizontalTree } from './GenealogyTree'
import type { PassaroArvore } from './GenealogyTree'

export function ArvoreGenealogicaPage() {
    const { id } = useParams<{ id: string }>()
    const passaroId = id ? Number(id) : null

    const { data: arvoreData, isLoading, error, refetch } = useArvoreGenealogica(passaroId)
    const passaro = arvoreData?.arvore
    const endogamia = arvoreData?.endogamia ?? 0

    // Cast para nosso tipo local recursivo (disponível antes dos guards para o closure de handlePrint)
    const passaroArvore = passaro as unknown as PassaroArvore

    const treeRef = useRef<HTMLDivElement>(null)
    const qrWrapperRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [certUrl, setCertUrl] = useState<string | null>(null)

    const handlePrint = async () => {
        const element = treeRef.current
        if (!element) return

        setIsGenerating(true)

        // 1. Create certificate on backend
        let token: string | null = null
        try {
            const res = await api.post<{ token: string }>('/api/v1/certificados', {
                passaro_id: passaroArvore.passaro_id,
            })
            token = res.data.token
        } catch (err) {
            console.error('Erro ao criar certificado:', err)
            alert('Não foi possível gerar o certificado. Tente novamente.')
            setIsGenerating(false)
            return
        }

        // 2. Build verification URL and render QR
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
        const verificationUrl = `${appUrl}/verificar/${token}`
        setCertUrl(verificationUrl)

        // 3. Force light mode for capture
        const html = document.documentElement
        const wasDark = html.classList.contains('dark')
        if (wasDark) html.classList.remove('dark')

        // 4. Remove overflow clipping so html2canvas captures full scroll width
        const scrollEls: Array<{ el: HTMLElement; ox: string; oy: string }> = []
        element.querySelectorAll<HTMLElement>('*').forEach(el => {
            const cs = window.getComputedStyle(el)
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'auto' || cs.overflowY === 'scroll') {
                scrollEls.push({ el, ox: el.style.overflowX, oy: el.style.overflowY })
                el.style.overflowX = 'visible'
                el.style.overflowY = 'visible'
            }
        })

        try {
            // 5. Load logo + wait for QR canvas to render (em paralelo)
            const [logoDataUrl] = await Promise.all([
                fetch('/icons/icon-128x128.png')
                    .then(r => r.blob())
                    .then(blob => new Promise<string>(resolve => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.readAsDataURL(blob)
                    }))
                    .catch(() => ''),
                new Promise(r => setTimeout(r, 200)),
            ])

            // 6. Get QR code as data URL
            const qrCanvas = qrWrapperRef.current?.querySelector('canvas')
            const qrDataUrl = qrCanvas?.toDataURL('image/png') ?? ''

            // 7. Capture only the tree (no injected header)
            const treeCanvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                scrollX: 0,
                scrollY: 0,
            })

            // 8. Setup PDF (A5 landscape: 210×148mm)
            const ringNumber = formatRingComplete(passaroArvore.anel) || `#${passaroArvore.passaro_id}`
            const dataEmissao = new Date().toLocaleDateString('pt-BR')

            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' })
            const pageW = pdf.internal.pageSize.getWidth()   // 210mm
            const pageH = pdf.internal.pageSize.getHeight()  // 148mm

            // --- Blue top bar (full page width) ---
            const blueH = 14
            pdf.setFillColor(37, 99, 235)
            pdf.rect(0, 0, pageW, blueH, 'F')

            // Logo + nome
            const logoSize = 10
            const logoX = 3
            const logoY = (blueH - logoSize) / 2
            if (logoDataUrl) {
                pdf.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize)
            }
            const textX = logoDataUrl ? logoX + logoSize + 2 : 6

            pdf.setTextColor(255, 255, 255)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(13)
            pdf.text('MeuPlantel', textX, 9)

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(7)
            pdf.setTextColor(191, 219, 254)
            pdf.text('Sistema de Gerenciamento de Criação de Aves', textX, 13)

            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(8)
            pdf.setTextColor(191, 219, 254)
            pdf.text('CERTIFICADO GENEALÓGICO', pageW - 6, 9, { align: 'right' })

            // --- Compact info row (ring only) ---
            pdf.setTextColor(17, 24, 39)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(12)
            const birdTitle = passaroArvore.descr
                ? `${ringNumber}  ·  ${passaroArvore.descr}`
                : ringNumber
            pdf.text(birdTitle, 6, blueH + 7)

            // --- Separator line ---
            const sepY = blueH + 10
            pdf.setDrawColor(229, 231, 235)
            pdf.setLineWidth(0.4)
            pdf.line(0, sepY, pageW, sepY)

            const qrSize = 16
            const qrX = pageW - qrSize - 4
            const qrY = pageH - qrSize - 5

            // --- Tree image first (so footer renders on top) ---
            const treeTop = sepY + 2
            const treeAvailH = pageH - treeTop - 2
            const maxImgW = pageW - 8   // usa quase toda a largura; QR e data ficam por cima

            const imgAspect = treeCanvas.width / treeCanvas.height
            let imgW = maxImgW
            let imgH = maxImgW / imgAspect
            if (imgH > treeAvailH) {
                imgH = treeAvailH
                imgW = treeAvailH * imgAspect
            }

            pdf.addImage(
                treeCanvas.toDataURL('image/png'),
                'PNG',
                4,
                treeTop,
                imgW,
                imgH,
            )

            // --- Data de emissão (bottom-left, sobre a árvore) ---
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(5.5)
            pdf.setTextColor(156, 163, 175)
            pdf.text(`Emitido em ${dataEmissao}`, 4, pageH - 2)

            // --- QR code (bottom-right, sobre a árvore) ---
            if (qrDataUrl) {
                pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
                pdf.setFontSize(5.5)
                pdf.setTextColor(156, 163, 175)
                pdf.text('Verificar autenticidade', qrX + qrSize / 2, pageH - 2, { align: 'center' })
            }

            pdf.save(`genealogia-${ringNumber.replace(/[\s/]+/g, '-')}.pdf`)

        } catch (err) {
            console.error('Erro ao gerar PDF:', err)
            alert('Não foi possível gerar o PDF. Tente novamente.')
        } finally {
            scrollEls.forEach(({ el, ox, oy }) => { el.style.overflowX = ox; el.style.overflowY = oy })
            if (wasDark) html.classList.add('dark')
            setCertUrl(null)
            setIsGenerating(false)
        }
    }

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

                {/* Visualização em Lista */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Visualização em Lista
                        </h2>
                        <button
                            onClick={handlePrint}
                            disabled={isGenerating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors ${
                                isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Imprimir / PDF
                                </>
                            )}
                        </button>
                    </div>
                    <div ref={treeRef} id="arvore-pdf-content" className="p-4">
                        <HorizontalTree passaro={passaroArvore} maxGenerations={3} />
                    </div>
                </section>
            </div>

            {/* Hidden QR canvas used during PDF generation */}
            {certUrl && (
                <div
                    ref={qrWrapperRef}
                    style={{ position: 'fixed', left: -9999, top: 0, visibility: 'hidden', pointerEvents: 'none' }}
                    aria-hidden="true"
                >
                    <QRCodeCanvas value={certUrl} size={150} />
                </div>
            )}
        </div>
    )
}
