/**
 * Componente QrScanner
 * Overlay fullscreen que abre a câmera e lê QR codes
 */

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QrScannerProps {
    onResult: (decodedText: string) => void
    onClose: () => void
}

export function QrScanner({ onResult, onClose }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)
    const hasResult = useRef(false)

    useEffect(() => {
        const containerId = 'qr-scanner-region'
        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner

        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                if (hasResult.current) return
                hasResult.current = true
                scanner.stop().catch(() => {})
                onResult(decodedText)
            },
            () => {}
        ).catch((err) => {
            const msg = err?.message || String(err)
            if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
                setError('Permissão da câmera negada. Habilite nas configurações do navegador.')
            } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
                setError('Nenhuma câmera encontrada no dispositivo.')
            } else {
                setError('Não foi possível acessar a câmera.')
            }
        })

        return () => {
            scanner.stop().catch(() => {})
        }
    }, [onResult])

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 bg-black/80 safe-top">
                <h2 className="text-white font-semibold text-lg">Escanear Gaiola</h2>
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

            {/* Scanner area */}
            <div className="flex-1 flex items-center justify-center relative" ref={containerRef}>
                <div id="qr-scanner-region" className="w-full h-full" />

                {/* Error state */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-8 bg-black">
                        <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-300 text-center text-sm">{error}</p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-6 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors active:scale-95"
                        >
                            Voltar
                        </button>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {!error && (
                <div className="px-4 py-4 bg-black/80 text-center safe-bottom">
                    <p className="text-gray-400 text-sm">Aponte a câmera para o QR Code da gaiola</p>
                </div>
            )}
        </div>
    )
}
