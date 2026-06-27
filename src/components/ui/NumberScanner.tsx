/**
 * Componente NumberScanner
 * Abre a câmera e usa OCR (Tesseract.js) para ler números automaticamente
 * Usa sistema de votação (vote window) para confirmar o número com estabilidade
 */

import { useEffect, useRef, useState } from 'react'

interface NumberScannerProps {
    onResult: (numero: number) => void
    onClose: () => void
}

type ScanState = 'loading' | 'scanning' | 'result' | 'error'

const VOTE_WINDOW = 5
const VOTE_THRESHOLD = 3

export function NumberScanner({ onResult, onClose }: NumberScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const workerRef = useRef<Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | null>(null)
    const scanningRef = useRef(false)
    const cancelledRef = useRef(false)
    const recentReadingsRef = useRef<number[]>([])
    const [state, setState] = useState<ScanState>('loading')
    const [detectedNumber, setDetectedNumber] = useState<number | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [confidence, setConfidence] = useState(0)
    const [previewNumber, setPreviewNumber] = useState<number | null>(null)

    // Inicia câmera + worker
    useEffect(() => {
        cancelledRef.current = false

        async function init() {
            // 0. Verifica permissão antes de solicitar câmera (evita erro silencioso no iOS)
            if (navigator.permissions) {
                try {
                    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
                    if (permission.state === 'denied') {
                        setErrorMsg('Permissão da câmera negada. Acesse as configurações do dispositivo para habilitar.')
                        setState('error')
                        return
                    }
                } catch {
                    // Navegador não suporta permissions API — continua normalmente
                }
            }

            if (cancelledRef.current) return

            // 1. Inicia câmera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                })
                if (cancelledRef.current) {
                    stream.getTracks().forEach(t => t.stop())
                    return
                }
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            } catch (err) {
                if (cancelledRef.current) return
                const msg = (err as Error)?.message || String(err)
                if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
                    setErrorMsg('Permissão da câmera negada. Habilite nas configurações do navegador.')
                } else if (msg.includes('NotFoundError')) {
                    setErrorMsg('Nenhuma câmera encontrada no dispositivo.')
                } else {
                    setErrorMsg('Não foi possível acessar a câmera.')
                }
                setState('error')
                return
            }

            // 2. Inicia Tesseract worker
            try {
                const { createWorker } = await import('tesseract.js')
                if (cancelledRef.current) return
                const worker = await createWorker('eng')
                if (cancelledRef.current) {
                    await worker.terminate()
                    return
                }
                await worker.setParameters({
                    tessedit_char_whitelist: '0123456789',
                    // PSM 7 = single text line; OEM 1 = LSTM only
                    tessedit_pageseg_mode: '7' as unknown as import('tesseract.js').PSM,
                    tessedit_ocr_engine_mode: '1',
                })
                workerRef.current = worker
                setState('scanning')
            } catch {
                if (cancelledRef.current) return
                setErrorMsg('Erro ao iniciar o reconhecimento de texto.')
                setState('error')
            }
        }

        init()

        return () => {
            cancelledRef.current = true
            streamRef.current?.getTracks().forEach(t => t.stop())
            workerRef.current?.terminate().catch(() => {})
        }
    }, [])

    // Loop de scan contínuo
    useEffect(() => {
        if (state !== 'scanning') return

        let timeoutId: ReturnType<typeof setTimeout>
        let active = true

        async function scanFrame() {
            if (cancelledRef.current || !active || scanningRef.current || !workerRef.current) return
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas || video.readyState < 2) {
                timeoutId = setTimeout(scanFrame, 300)
                return
            }

            scanningRef.current = true

            try {
                const ctx = canvas.getContext('2d')
                if (!ctx) return

                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0)

                // Recorta a região central — 70%×30%
                const cropW = Math.floor(canvas.width * 0.7)
                const cropH = Math.floor(canvas.height * 0.30)
                const cropX = Math.floor((canvas.width - cropW) / 2)
                const cropY = Math.floor((canvas.height - cropH) / 2)

                // Escala para ~800px de largura para OCR mais preciso
                const scale = Math.min(1, 800 / cropW)
                const outW = Math.floor(cropW * scale)
                const outH = Math.floor(cropH * scale)

                const cropCanvas = document.createElement('canvas')
                cropCanvas.width = outW
                cropCanvas.height = outH
                const cropCtx = cropCanvas.getContext('2d')
                if (!cropCtx) return
                cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, outW, outH)

                // Grayscale conversion
                const imageData = cropCtx.getImageData(0, 0, outW, outH)
                const data = imageData.data
                const grayscale = new Uint8Array(outW * outH)
                for (let i = 0; i < grayscale.length; i++) {
                    const idx = i * 4
                    grayscale[i] = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114)
                }

                // Otsu threshold
                const hist = new Int32Array(256)
                for (const g of grayscale) hist[g]++
                const total = outW * outH
                let sum = 0
                for (let i = 0; i < 256; i++) sum += i * hist[i]
                let sumB = 0, wB = 0, wF = 0, maxVar = 0, threshold = 128
                for (let t = 0; t < 256; t++) {
                    wB += hist[t]
                    if (wB === 0) continue
                    wF = total - wB
                    if (wF === 0) break
                    sumB += t * hist[t]
                    const mB = sumB / wB
                    const mF = (sum - sumB) / wF
                    const variance = wB * wF * (mB - mF) ** 2
                    if (variance > maxVar) { maxVar = variance; threshold = t }
                }

                // Apply threshold
                for (let i = 0; i < grayscale.length; i++) {
                    const bw = grayscale[i] > threshold ? 255 : 0
                    const idx = i * 4
                    data[idx] = bw
                    data[idx + 1] = bw
                    data[idx + 2] = bw
                }
                cropCtx.putImageData(imageData, 0, 0)

                const { data: { text } } = await workerRef.current!.recognize(cropCanvas)

                if (cancelledRef.current || !active) return

                const digits = text.replace(/\D/g, '').trim()
                const numero = parseInt(digits, 10)

                // Vote-based: keep last VOTE_WINDOW readings (0 = failed read)
                const readings = recentReadingsRef.current
                readings.push(numero && numero > 0 ? numero : 0)
                if (readings.length > VOTE_WINDOW) readings.shift()

                // Count votes for most frequent non-zero number
                const voteCounts: Record<number, number> = {}
                for (const r of readings) {
                    if (r > 0) voteCounts[r] = (voteCounts[r] ?? 0) + 1
                }

                let bestNum = 0, bestVotes = 0
                for (const [n, v] of Object.entries(voteCounts)) {
                    if (v > bestVotes) { bestVotes = v; bestNum = Number(n) }
                }

                if (bestNum > 0) {
                    setPreviewNumber(bestNum)
                    setConfidence(bestVotes)

                    if (bestVotes >= VOTE_THRESHOLD) {
                        setDetectedNumber(bestNum)
                        setState('result')
                        return
                    }
                } else {
                    setPreviewNumber(null)
                    setConfidence(0)
                }
            } catch {
                // Ignora erros de frames individuais, continua escaneando
            } finally {
                scanningRef.current = false
            }

            // Sem delay artificial - OCR já leva tempo suficiente como throttle natural
            if (!cancelledRef.current && active) {
                timeoutId = setTimeout(scanFrame, 50)
            }
        }

        // Começa a escanear
        timeoutId = setTimeout(scanFrame, 200)

        return () => {
            active = false
            clearTimeout(timeoutId)
        }
    }, [state])

    const handleRetry = () => {
        setDetectedNumber(null)
        setPreviewNumber(null)
        setConfidence(0)
        setErrorMsg(null)
        recentReadingsRef.current = []
        scanningRef.current = false
        setState('scanning')
    }

    const handleConfirm = () => {
        if (detectedNumber) {
            onResult(detectedNumber)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 bg-black/80 safe-top relative z-10">
                <h2 className="text-white font-semibold text-lg">Ler Número da Gaiola</h2>
                <button
                    onClick={onClose}
                    className="p-2 text-white hover:bg-white/10 rounded-lg active:scale-95 transition-all"
                    aria-label="Fechar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Camera preview */}
            <div className="flex-1 relative overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${state === 'result' ? 'opacity-30' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Guia visual - retângulo centralizado */}
                {state === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-[60%] h-[15%] border-2 rounded-xl relative transition-colors duration-300 ${
                            confidence >= VOTE_THRESHOLD
                                ? 'border-emerald-400'
                                : confidence > 0
                                    ? 'border-amber-400'
                                    : 'border-amber-400'
                        }`}>
                            <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                            <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                            <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
                        </div>
                    </div>
                )}

                {/* Loading overlay */}
                {state === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-white text-lg font-medium">Preparando câmera...</p>
                    </div>
                )}

                {/* Result overlay */}
                {state === 'result' && detectedNumber !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-8">
                        <p className="text-gray-400 text-sm mb-2">Número detectado</p>
                        <div className="text-6xl font-bold text-amber-400 mb-8">
                            {detectedNumber}
                        </div>
                        <div className="flex gap-4 w-full max-w-xs">
                            <button
                                onClick={handleRetry}
                                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 active:scale-95 transition-all"
                            >
                                Tentar novamente
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 active:scale-95 transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {state === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-8">
                        <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-300 text-center text-sm mb-6">{errorMsg}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors active:scale-95"
                        >
                            Voltar
                        </button>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {state === 'scanning' && (
                <div className="px-4 py-4 bg-black/80 flex flex-col items-center gap-2 safe-bottom relative z-10">
                    {previewNumber !== null && confidence > 0 ? (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="text-white font-bold text-lg">{previewNumber}</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: VOTE_THRESHOLD }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                                                i < confidence ? 'bg-amber-400' : 'bg-white/20'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs">Mantenha a câmera parada para confirmar</p>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            <p className="text-gray-400 text-sm">Enquadre o número no retângulo e mantenha parado</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
