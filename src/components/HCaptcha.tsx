/**
 * Componente HCaptcha wrapper
 * 
 * Encapsula o componente hCaptcha com referência e handlers
 */

import HCaptcha from '@hcaptcha/react-hcaptcha'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || ''

export interface HCaptchaRef {
    execute: () => void
    resetCaptcha: () => void
}

interface HCaptchaWrapperProps {
    onVerify: (token: string) => void
    onExpire?: () => void
    onError?: (err: string) => void
}

export const HCaptchaWrapper = forwardRef<HCaptchaRef, HCaptchaWrapperProps>(
    ({ onVerify, onExpire, onError }, ref) => {
        const captchaRef = useRef<HCaptcha>(null)

        useImperativeHandle(ref, () => ({
            execute: () => {
                captchaRef.current?.execute()
            },
            resetCaptcha: () => {
                captchaRef.current?.resetCaptcha()
            },
        }))

        if (!HCAPTCHA_SITEKEY) {
            console.warn('VITE_HCAPTCHA_SITEKEY não configurado')
            return null
        }

        return (
            <div className="flex justify-center my-4">
                <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITEKEY}
                    onVerify={onVerify}
                    onExpire={onExpire}
                    onError={onError}
                    theme="light"
                    size="normal"
                />
            </div>
        )
    }
)

HCaptchaWrapper.displayName = 'HCaptchaWrapper'
