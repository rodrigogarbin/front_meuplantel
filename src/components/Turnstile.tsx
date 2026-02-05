/**
 * Cloudflare Turnstile Component
 * Wrapper para o react-turnstile (pacote oficial)
 *
 * Documentação: https://developers.cloudflare.com/turnstile/
 * Pacote: https://www.npmjs.com/package/react-turnstile
 */

import { forwardRef, useImperativeHandle, useState, useCallback } from 'react'
import TurnstileWidget from 'react-turnstile'

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
        const [resetKey, setResetKey] = useState(0)

        const reset = useCallback(() => {
            // Força re-renderização do widget incrementando a key
            setResetKey((prev) => prev + 1)
        }, [])

        useImperativeHandle(ref, () => ({
            reset,
        }))

        return (
            <div className="flex justify-center">
                <TurnstileWidget
                    key={resetKey}
                    sitekey={siteKey}
                    onVerify={onVerify}
                    onExpire={onExpire}
                    onError={onError}
                    theme={theme}
                    size={size}
                    action={action}
                />
            </div>
        )
    }
)

Turnstile.displayName = 'Turnstile'
