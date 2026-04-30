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
    export interface QRCodeCanvasProps extends ComponentProps<'canvas'> {
        value: string
        size?: number
        level?: 'L' | 'M' | 'Q' | 'H'
        bgColor?: string
        fgColor?: string
        marginSize?: number
        includeMargin?: boolean
    }
    export function QRCodeSVG(props: QRCodeSVGProps): JSX.Element
    export function QRCodeCanvas(props: QRCodeCanvasProps): JSX.Element
}
