/**
 * Componente Toast reutilizável com hook useToast
 */

import { useState, useEffect, useCallback } from 'react'

interface ToastProps {
    message: string
    type?: 'success' | 'error' | 'info'
    onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [onClose])

    const colorClass =
        type === 'success'
            ? 'bg-green-600 dark:bg-green-700'
            : type === 'error'
            ? 'bg-red-600 dark:bg-red-700'
            : 'bg-blue-600 dark:bg-blue-700'

    return (
        <div
            className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs w-full transition-all ${colorClass}`}
        >
            {type === 'success' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            {type === 'error' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
            {type === 'info' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            <span className="flex-1">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}

// ─────────────────────────────────────────
// Hook useToast
// ─────────────────────────────────────────

interface ToastState {
    message: string
    type: 'success' | 'error' | 'info'
}

interface UseToastReturn {
    toast: ToastState | null
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
    hideToast: () => void
}

export function useToast(): UseToastReturn {
    const [toast, setToast] = useState<ToastState | null>(null)

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type })
    }, [])

    const hideToast = useCallback(() => {
        setToast(null)
    }, [])

    return { toast, showToast, hideToast }
}
