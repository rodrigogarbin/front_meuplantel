/**
 * Componente PullToRefresh
 * Permite atualizar dados ao "puxar a tela para baixo"
 */

import { useState, useRef, useCallback, type ReactNode } from 'react'

interface PullToRefreshProps {
    /** Função assíncrona chamada ao puxar para atualizar */
    onRefresh: () => Promise<void>
    /** Conteúdo a ser exibido dentro do container */
    children: ReactNode
    /** Distância mínima para disparar o refresh (default: 80px) */
    threshold?: number
    /** Classes adicionais para o container */
    className?: string
    /** Se o refresh está desabilitado */
    disabled?: boolean
}

// Ícone de refresh (seta circular)
function RefreshIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    )
}

export function PullToRefresh({
    onRefresh,
    children,
    threshold = 80,
    className = '',
    disabled = false,
}: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const startY = useRef(0)
    const isPulling = useRef(false)

    // Verifica se está no topo do scroll
    const isAtTop = useCallback(() => {
        if (!containerRef.current) return false
        // Verifica tanto o container quanto a janela
        const scrollTop = containerRef.current.scrollTop || window.scrollY
        return scrollTop <= 0
    }, [])

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return
        if (!isAtTop()) return

        startY.current = e.touches[0].clientY
        isPulling.current = true
    }, [disabled, isRefreshing, isAtTop])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || disabled || isRefreshing) return
        if (!isAtTop()) {
            isPulling.current = false
            setPullDistance(0)
            return
        }

        const currentY = e.touches[0].clientY
        const diff = currentY - startY.current

        // Só puxa se estiver indo para baixo
        if (diff > 0) {
            // Aplica resistência exponencial para efeito mais natural
            const resistance = Math.min(diff * 0.5, threshold * 1.5)
            setPullDistance(resistance)

            // Previne scroll se estiver puxando
            if (resistance > 10) {
                e.preventDefault()
            }
        }
    }, [disabled, isRefreshing, isAtTop, threshold])

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || disabled) return
        isPulling.current = false

        // Se puxou o suficiente, dispara o refresh
        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true)
            setPullDistance(threshold) // Mantém na posição de loading

            try {
                await onRefresh()
            } finally {
                setIsRefreshing(false)
                setPullDistance(0)
            }
        } else {
            setPullDistance(0)
        }
    }, [pullDistance, threshold, isRefreshing, onRefresh, disabled])

    // Calcula rotação do ícone baseado na distância
    const rotation = Math.min((pullDistance / threshold) * 360, 360)
    const isReady = pullDistance >= threshold

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Indicador de Pull */}
            <div
                className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-50 overflow-hidden transition-all duration-200"
                style={{
                    height: pullDistance,
                    top: 0,
                    opacity: pullDistance > 10 ? 1 : 0,
                }}
            >
                <div
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-200
                        ${isReady || isRefreshing
                            ? 'bg-primary-500 text-white shadow-lg scale-110'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }
                    `}
                >
                    <RefreshIcon
                        className={`w-5 h-5 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`}
                        style={isRefreshing ? undefined : { transform: `rotate(${rotation}deg)` }}
                    />
                </div>
            </div>

            {/* Conteúdo com deslocamento */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                }}
            >
                {children}
            </div>
        </div>
    )
}
