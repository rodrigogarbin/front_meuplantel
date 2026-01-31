declare module 'qrcode.react' {
    import type { ComponentProps } from 'react'
    export interface QRCodeSVGProps extends ComponentProps<'svg'> {
        value: string
        size?: number
        level?: 'L' | 'M' | 'Q' | 'H'
        bgColor?: string
        fgColor?: string
        marginSize?: number
    }
    export function QRCodeSVG(props: QRCodeSVGProps): JSX.Element
}
