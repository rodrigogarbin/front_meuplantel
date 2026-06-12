/**
 * Relatório PDF do Criadouro
 * Exibe todas as aves com filtros (sexo, pai, mãe, período).
 * Preview paginado na tela; PDF gerado com todas as aves filtradas.
 */

import { useState, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import { Topbar } from '@/components/ui/Topbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PassaroAutocomplete } from '@/components/ui/PassaroAutocomplete'
import { usePassarosTodos } from './passarosApi'
import { useEspecies } from '@/features/especies/especiesApi'
import { formatRingComplete, formatPassaroCompleto } from '@/lib/passaro'
import { SituacaoLabels } from '@/types'
import type { Passaro } from '@/types'

const PER_PAGE = 15

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    const [y, m, d] = iso.split('T')[0].split('-')
    return `${d}/${m}/${y}`
}

function fmtSexo(sexo: number | null | undefined): string {
    if (sexo === 1) return 'Macho'
    if (sexo === 2) return 'Fêmea'
    return '—'
}

function truncToWidth(pdf: jsPDF, text: string, maxMm: number): string {
    if (pdf.getTextWidth(text) <= maxMm) return text
    let lo = 0, hi = text.length
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2)
        if (pdf.getTextWidth(text.slice(0, mid) + '…') <= maxMm) lo = mid
        else hi = mid - 1
    }
    return text.slice(0, lo) + '…'
}

// ─── PDF ────────────────────────────────────────────────────────────────────

const MARGIN = 10
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2   // 190mm
const ROW_H = 13
const HEADER_H = 24
const TABLE_HEADER_H = 9
const PAD = 2

// #(7) | Anel(40) | Nome(58) | Sexo(14) | Nascimento(22) | Genealogia(49) → 190mm
const COLS = [7, 40, 58, 14, 22, 49] as const
const COL_LABELS = ['#', 'Anel', 'Descrição', 'Sexo', 'Nascimento', 'Genealogia']

function colX(i: number): number {
    return MARGIN + (COLS.slice(0, i) as number[]).reduce((a, b) => a + b, 0)
}

async function buildPdf(birds: Passaro[], logoDataUrl: string, subtitle: string): Promise<Blob> {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const today = new Date().toLocaleDateString('pt-BR')
    let page = 1
    let y = MARGIN

    const drawPageHeader = () => {
        pdf.setFillColor(37, 99, 235)
        pdf.rect(0, 0, PAGE_W, HEADER_H, 'F')
        if (logoDataUrl) {
            try { pdf.addImage(logoDataUrl, 'PNG', MARGIN, 5, 14, 14) } catch { /* skip */ }
        }
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(13)
        pdf.setTextColor(255, 255, 255)
        pdf.text('MeuPlantel', MARGIN + 17, 10)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7.5)
        pdf.setTextColor(191, 219, 254)
        pdf.text(subtitle, MARGIN + 17, 15)
        pdf.setFontSize(7)
        pdf.text(`Emitido em ${today} · Pagina ${page}`, PAGE_W - MARGIN, 20, { align: 'right' })
        y = HEADER_H + 6
    }

    const drawTableHeader = () => {
        pdf.setFillColor(239, 246, 255)
        pdf.rect(MARGIN, y, CONTENT_W, TABLE_HEADER_H, 'F')
        pdf.setDrawColor(191, 219, 254)
        pdf.setLineWidth(0.3)
        pdf.line(MARGIN, y + TABLE_HEADER_H, MARGIN + CONTENT_W, y + TABLE_HEADER_H)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7)
        pdf.setTextColor(30, 64, 175)
        COL_LABELS.forEach((label, i) => {
            const tx = i === 0 ? colX(0) + COLS[0] / 2 : colX(i) + 1.5
            pdf.text(label, tx, y + 6, { align: i === 0 ? 'center' : 'left' })
        })
        y += TABLE_HEADER_H
    }

    const drawRow = (bird: Passaro, index: number) => {
        if (index % 2 === 0) {
            pdf.setFillColor(249, 250, 251)
            pdf.rect(MARGIN, y, CONTENT_W, ROW_H, 'F')
        }

        // Se há obs, sobe o texto principal para dar espaço à linha de obs abaixo
        const midY = y + ROW_H / 2 + 2.5
        const mainTextY = bird.obs ? y + 7.5 : midY

        // ── Colunas principais (fonte 7.5pt) ──
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7.5)

        pdf.setTextColor(107, 114, 128)
        pdf.text(String(index + 1), colX(0) + COLS[0] / 2, mainTextY, { align: 'center' })

        pdf.setTextColor(17, 24, 39)
        pdf.text(truncToWidth(pdf, formatRingComplete(bird.anel), COLS[1] - PAD), colX(1) + 1.5, mainTextY)
        pdf.text(truncToWidth(pdf, bird.descr ?? '—', COLS[2] - PAD), colX(2) + 1.5, mainTextY)

        if (bird.obs) {
            pdf.setFont('helvetica', 'italic')
            pdf.setFontSize(6)
            pdf.setTextColor(148, 163, 184)
            pdf.text(truncToWidth(pdf, bird.obs, COLS[1] + COLS[2] - PAD), colX(1) + 1.5, y + ROW_H - 1.5)
        }

        const sexoRgb: [number, number, number] =
            bird.sexo === 1 ? [59, 130, 246] : bird.sexo === 2 ? [236, 72, 153] : [107, 114, 128]
        pdf.setTextColor(...sexoRgb)
        pdf.text(fmtSexo(bird.sexo), colX(3) + 1.5, mainTextY)

        pdf.setTextColor(17, 24, 39)
        pdf.text(fmtDate(bird.dt_nasc), colX(4) + 1.5, mainTextY)

        // ── Coluna Genealogia: pai e mãe empilhados (fonte 6pt, cinza) ──
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(6)
        pdf.setTextColor(100, 116, 139)

        const xGene = colX(5) + 1.5
        const maxW = COLS[5] - PAD
        pdf.text(truncToWidth(pdf, 'Pai: ' + formatPassaroCompleto(bird.pai as Passaro), maxW), xGene, y + 4.5)
        pdf.text(truncToWidth(pdf, 'Mae: ' + formatPassaroCompleto(bird.mae as Passaro), maxW), xGene, y + 9.5)


        pdf.setDrawColor(229, 231, 235)
        pdf.setLineWidth(0.1)
        pdf.line(MARGIN, y + ROW_H, MARGIN + CONTENT_W, y + ROW_H)
        y += ROW_H
    }

    drawPageHeader()
    drawTableHeader()

    birds.forEach((bird, i) => {
        if (y + ROW_H > PAGE_H - MARGIN - 6) {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(6.5)
            pdf.setTextColor(156, 163, 175)
            pdf.text(`${birds.length} aves`, MARGIN, PAGE_H - 5)
            pdf.addPage()
            page++
            drawPageHeader()
            drawTableHeader()
        }
        drawRow(bird, i)
    })

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.setTextColor(156, 163, 175)
    pdf.text(`${birds.length} aves`, MARGIN, PAGE_H - 5)

    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.4)
    pdf.rect(MARGIN, HEADER_H + 6, CONTENT_W, y - (HEADER_H + 6))

    return pdf.output('blob')
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RelatorioCriadouroPage() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [pdfReady, setPdfReady] = useState<{ blob: Blob; filename: string } | null>(null)
    const [previewPage, setPreviewPage] = useState(1)

    // Filtros
    const [sexoFilter, setSexoFilter] = useState<0 | 1 | 2>(0)
    const [sitFilter, setSitFilter] = useState<number | ''>('')
    const [especieFilter, setEspecieFilter] = useState<number | ''>('')
    const [paiFilter, setPaiFilter] = useState<number | ''>('')
    const [maeFilter, setMaeFilter] = useState<number | ''>('')
    const [periodoInicio, setPeriodoInicio] = useState('')
    const [periodoFim, setPeriodoFim] = useState('')

    const { data: allBirds = [], isLoading, error, refetch } = usePassarosTodos()
    const { data: especies = [] } = useEspecies()

    // Listas únicas de pais/mães para o autocomplete
    const paiPassaros = useMemo(() => {
        const map = new Map<number, Passaro>()
        allBirds.forEach(b => { if (b.passaro_pai_id && b.pai) map.set(b.passaro_pai_id, b.pai as Passaro) })
        return Array.from(map.values()).sort((a, b) => formatPassaroCompleto(a).localeCompare(formatPassaroCompleto(b)))
    }, [allBirds])

    const maePassaros = useMemo(() => {
        const map = new Map<number, Passaro>()
        allBirds.forEach(b => { if (b.passaro_mae_id && b.mae) map.set(b.passaro_mae_id, b.mae as Passaro) })
        return Array.from(map.values()).sort((a, b) => formatPassaroCompleto(a).localeCompare(formatPassaroCompleto(b)))
    }, [allBirds])

    // Aves filtradas (usadas no PDF completo e no preview paginado)
    const filteredBirds = useMemo(() => {
        return allBirds
            .filter(b => {
                if (sexoFilter !== 0 && b.sexo !== sexoFilter) return false
                if (sitFilter !== '' && b.sit !== sitFilter) return false
                if (especieFilter !== '' && b.especie_usuario_id !== especieFilter) return false
                if (paiFilter !== '' && b.passaro_pai_id !== paiFilter) return false
                if (maeFilter !== '' && b.passaro_mae_id !== maeFilter) return false
                if (periodoInicio && (b.dt_nasc ?? '') < periodoInicio) return false
                if (periodoFim && (b.dt_nasc ?? '') > periodoFim) return false
                return true
            })
            .sort((a, b) => (a.dt_nasc ?? '').localeCompare(b.dt_nasc ?? ''))
    }, [allBirds, sexoFilter, sitFilter, especieFilter, paiFilter, maeFilter, periodoInicio, periodoFim])

    const totalPages = Math.max(1, Math.ceil(filteredBirds.length / PER_PAGE))
    const pagedBirds = filteredBirds.slice((previewPage - 1) * PER_PAGE, previewPage * PER_PAGE)

    const resetPage = () => setPreviewPage(1)

    // Gera subtitle do PDF com base nos filtros ativos
    const pdfSubtitle = useMemo(() => {
        const parts: string[] = []
        if (sexoFilter === 1) parts.push('Machos')
        else if (sexoFilter === 2) parts.push('Fêmeas')
        if (sitFilter !== '') parts.push(`Status: ${SituacaoLabels[sitFilter] ?? sitFilter}`)
        if (especieFilter !== '') {
            const esp = especies.find(e => (e.especie_usuario_id ?? e.id) === especieFilter)
            if (esp) parts.push(`Espécie: ${esp.descr ?? ''}`)
        }
        if (paiFilter !== '') {
            const p = paiPassaros.find(o => o.passaro_id === paiFilter)
            if (p) parts.push(`Pai: ${formatPassaroCompleto(p)}`)
        }
        if (maeFilter !== '') {
            const m = maePassaros.find(o => o.passaro_id === maeFilter)
            if (m) parts.push(`Mãe: ${formatPassaroCompleto(m)}`)
        }
        if (periodoInicio || periodoFim) {
            parts.push(`Nasc. ${fmtDate(periodoInicio) || '?'} – ${fmtDate(periodoFim) || '?'}`)
        }
        return parts.length ? `Relatório · ${parts.join(' · ')}` : 'Relatório de Aves do Criadouro'
    }, [sexoFilter, especieFilter, paiFilter, maeFilter, periodoInicio, periodoFim, especies, paiPassaros, maePassaros])

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            let logoDataUrl = ''
            try {
                const blob = await fetch('/icons/icon-128x128.png').then(r => r.blob())
                logoDataUrl = await new Promise<string>(resolve => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })
            } catch { /* logo opcional */ }

            const blob = await buildPdf(filteredBirds, logoDataUrl, pdfSubtitle)
            const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
            const filename = `relatorio-criadouro-${today}.pdf`

            const isMobileOrPwa =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

            if (!isMobileOrPwa) {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                a.click()
                setTimeout(() => URL.revokeObjectURL(url), 10000)
            } else {
                setPdfReady({ blob, filename })
            }
        } catch (err) {
            console.error('Erro ao gerar relatório:', err)
            alert('Não foi possível gerar o relatório. Tente novamente.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleOpenPdf = async () => {
        if (!pdfReady) return
        const { blob, filename } = pdfReady
        const file = new File([blob], filename, { type: 'application/pdf' })
        try {
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Relatório do Criadouro' })
            } else {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                a.click()
                setTimeout(() => URL.revokeObjectURL(url), 10000)
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
            setTimeout(() => URL.revokeObjectURL(url), 30000)
        }
        setPdfReady(null)
    }

    const inputCls = "w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Topbar title="Relatório do Criadouro" showBack />

            <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">

                {/* Filtros */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros</h2>

                    {/* Sexo */}
                    <div className="flex gap-2">
                        {([0, 1, 2] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => { setSexoFilter(s); resetPage() }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    sexoFilter === s
                                        ? s === 1 ? 'bg-blue-600 text-white' : s === 2 ? 'bg-pink-500 text-white' : 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {s === 0 ? 'Todos' : s === 1 ? 'Machos' : 'Fêmeas'}
                            </button>
                        ))}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <select
                            value={sitFilter}
                            onChange={(e) => { setSitFilter(e.target.value === '' ? '' : Number(e.target.value)); resetPage() }}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            <option value="">Todos os status</option>
                            {Object.entries(SituacaoLabels).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Espécie */}
                    {especies.length > 0 && (
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Espécie</label>
                            <select
                                value={especieFilter}
                                onChange={(e) => { setEspecieFilter(e.target.value === '' ? '' : Number(e.target.value)); resetPage() }}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                <option value="">Todas as espécies</option>
                                {especies.map(esp => {
                                    const id = esp.especie_usuario_id ?? esp.id
                                    if (!id) return null
                                    return (
                                        <option key={id} value={id}>
                                            {esp.descr ?? `Espécie ${id}`}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>
                    )}

                    {/* Pai */}
                    <PassaroAutocomplete
                        label="Pai"
                        value={paiFilter === '' ? null : paiFilter}
                        options={paiPassaros}
                        placeholder="Buscar pai..."
                        onChange={(id) => { setPaiFilter(id ?? ''); resetPage() }}
                    />

                    {/* Mãe */}
                    <PassaroAutocomplete
                        label="Mãe"
                        value={maeFilter === '' ? null : maeFilter}
                        options={maePassaros}
                        placeholder="Buscar mãe..."
                        onChange={(id) => { setMaeFilter(id ?? ''); resetPage() }}
                    />

                    {/* Período de nascimento */}
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Período de nascimento</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={periodoInicio}
                                onChange={e => { setPeriodoInicio(e.target.value); resetPage() }}
                                className={inputCls}
                            />
                            <span className="text-gray-400 text-sm flex-shrink-0">até</span>
                            <input
                                type="date"
                                value={periodoFim}
                                onChange={e => { setPeriodoFim(e.target.value); resetPage() }}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Limpar filtros */}
                    {(sexoFilter !== 0 || sitFilter !== '' || especieFilter !== '' || paiFilter !== '' || maeFilter !== '' || periodoInicio || periodoFim) && (
                        <button
                            onClick={() => {
                                setSexoFilter(0); setSitFilter(''); setEspecieFilter(''); setPaiFilter(''); setMaeFilter('')
                                setPeriodoInicio(''); setPeriodoFim(''); resetPage()
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* Loading / erro */}
                {isLoading && <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
                {error && <ErrorState message="Não foi possível carregar as aves." onRetry={() => refetch()} />}

                {!isLoading && !error && (
                    <>
                        {/* Contador + botão PDF */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{filteredBirds.length}</span>{' '}
                                ave{filteredBirds.length !== 1 ? 's' : ''}
                            </p>

                            {pdfReady ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleOpenPdf} className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Abrir PDF
                                    </button>
                                    <button onClick={() => setPdfReady(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Descartar">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || filteredBirds.length === 0}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${isGenerating || filteredBirds.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {isGenerating ? (
                                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Gerando...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Gerar PDF</>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Tabela preview */}
                        {filteredBirds.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma ave encontrada com os filtros aplicados.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 grid grid-cols-[auto_1fr] gap-x-4">
                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Ave</span>
                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Genealogia</span>
                                    </div>

                                    {pagedBirds.map((b, i) => (
                                        <div
                                            key={b.passaro_id}
                                            className={`px-4 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''} ${i % 2 === 1 ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                                        >
                                            <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                                                <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{formatRingComplete(b.anel)}</span>
                                                {b.descr && <span className="text-gray-700 dark:text-gray-300 font-medium">{b.descr}</span>}
                                                <span className={`text-xs ${b.sexo === 1 ? 'text-blue-500' : b.sexo === 2 ? 'text-pink-500' : 'text-gray-400'}`}>{fmtSexo(b.sexo)}</span>
                                                {b.dt_nasc && <span className="text-xs text-gray-400 dark:text-gray-500">Nasc. {fmtDate(b.dt_nasc)}</span>}
                                                {b.mutacao?.descr && <span className="text-xs text-gray-400 dark:text-gray-500">· {b.mutacao.descr}</span>}
                                            </div>
                                            {b.obs && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1 mb-0.5">{b.obs}</p>
                                            )}
                                            <div className="flex flex-col gap-0.5 pl-0.5">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="text-blue-400 mr-1">♂</span>{b.pai ? formatPassaroCompleto(b.pai as Passaro) : '—'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="text-pink-400 mr-1">♀</span>{b.mae ? formatPassaroCompleto(b.mae as Passaro) : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Paginador */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Página {previewPage} de {totalPages}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                                                disabled={previewPage <= 1}
                                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >Anterior</button>
                                            <button
                                                onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
                                                disabled={previewPage >= totalPages}
                                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >Próxima</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
