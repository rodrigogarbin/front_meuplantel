/**
 * Cloudflare Turnstile Component
 * Wrapper para o Cloudflare Turnstile (CAPTCHA)
 *
 * Documentação: https://developers.cloudflare.com/turnstile/
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

// Declara tipos globais do Turnstile
declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, options: TurnstileOptions) => string
            reset: (widgetId: string) => void
            remove: (widgetId: string) => void
            getResponse: (widgetId: string) => string
        }
        onTurnstileLoad?: () => void
    }
}

interface TurnstileOptions {
    sitekey: string
    callback?: (token: string) => void
    'error-callback'?: () => void
    'expired-callback'?: () => void
    theme?: 'light' | 'dark' | 'auto'
    size?: 'normal' | 'compact'
    action?: string
    cData?: string
    appearance?: 'always' | 'execute' | 'interaction-only'
}

interface TurnstileProps {
    siteKey: string
    onVerify: (token: string) => void
    onExpire?: () => void
    onError?: () => void
    theme?: 'light' | 'dark' | 'auto'
    size?: 'normal' | 'compact'
    action?: string
}

export interface TurnstileRef {
    reset: () => void
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
    ({ siteKey, onVerify, onExpire, onError, theme = 'auto', size = 'normal', action }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const widgetIdRef = useRef<string | null>(null)

        useImperativeHandle(ref, () => ({
            reset: () => {
                if (widgetIdRef.current && window.turnstile) {
                    window.turnstile.reset(widgetIdRef.current)
                }
            },
        }))

        useEffect(() => {
            // Função para inicializar o widget
            const initTurnstile = () => {
                if (!containerRef.current || !window.turnstile) return

                // Se já existe um widget, remove antes de criar novo
                if (widgetIdRef.current) {
                    try {
                        window.turnstile.remove(widgetIdRef.current)
                    } catch (e) {
                        // Ignora erro se o widget já foi removido
                    }
                }

                // Renderiza o widget
                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: onVerify,
                    'error-callback': onError,
                    'expired-callback': onExpire,
                    theme,
                    size,
                    action,
                })
            }

            // Verifica se o script já foi carregado
            if (window.turnstile) {
                initTurnstile()
            } else {
                // Se não foi carregado, adiciona o script
                const script = document.createElement('script')
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
                script.async = true
                script.defer = true

                // Callback quando o script carregar
                window.onTurnstileLoad = initTurnstile
                script.onload = () => {
                    if (window.onTurnstileLoad) {
                        window.onTurnstileLoad()
                    }
                }

                document.body.appendChild(script)
            }

            // Cleanup
            return () => {
                if (widgetIdRef.current && window.turnstile) {
                    try {
                        window.turnstile.remove(widgetIdRef.current)
                    } catch (e) {
                        // Ignora erro se o widget já foi removido
                    }
                }
            }
        }, [siteKey, onVerify, onExpire, onError, theme, size, action])

        return <div ref={containerRef} className="flex justify-center" />
    }
)

Turnstile.displayName = 'Turnstile'
