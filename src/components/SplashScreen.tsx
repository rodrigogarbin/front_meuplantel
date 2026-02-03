/**
 * Splash Screen - Tela de carregamento inicial
 * Exibida ao abrir o PWA enquanto o app está hidratando
 */

import { useEffect, useState } from 'react'
import { BirdLogo } from './BirdLogo'

interface SplashScreenProps {
    isLoading?: boolean
}

export function SplashScreen({ isLoading = true }: SplashScreenProps) {
    const [show, setShow] = useState(true)

    useEffect(() => {
        if (!isLoading) {
            // Delay para animação de fade out
            const timer = setTimeout(() => {
                setShow(false)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [isLoading])

    if (!show && !isLoading) {
        return null
    }

    return (
        <div
            className={`fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center transition-opacity duration-300 ${
                isLoading ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Decorative stars/particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-1 h-1 bg-white rounded-full top-[20%] left-[10%] animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-[40%] left-[20%] animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[15%] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-[30%] right-[15%] animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-[70%] right-[25%] animate-pulse" style={{ animationDelay: '0.8s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-[50%] right-[10%] animate-pulse" style={{ animationDelay: '1.2s' }} />

                {/* Larger glow orbs */}
                <div className="absolute w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute w-64 h-64 bg-blue-500/5 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
                {/* Logo with glow effect */}
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl scale-150" />
                    <div className="relative transform hover:scale-105 transition-transform duration-300">
                        <BirdLogo size="xl" />
                    </div>
                </div>

                {/* App name */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        MeuPlantel
                    </h1>
                    <p className="text-sm text-gray-400">
                        Carregando...
                    </p>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-8 text-center text-xs text-gray-600">
                <p>Gestão de Plantel de Pássaros</p>
            </div>
        </div>
    )
}
