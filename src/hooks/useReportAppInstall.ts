import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/features/auth/authStore'

const STORAGE_KEY = 'meuplantel_app_install_reported'

function isStandalone(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
    )
}

function alreadyReportedToday(): boolean {
    const val = localStorage.getItem(STORAGE_KEY)
    if (!val) return false
    return val === new Date().toISOString().slice(0, 10)
}

export function useReportAppInstall() {
    const { isAuthenticated } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated) return
        if (!isStandalone()) return
        if (alreadyReportedToday()) return

        api.post('/api/v1/me/app-instalado').then(() => {
            localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10))
        }).catch(() => {
            // silently ignore — will retry tomorrow
        })
    }, [isAuthenticated])
}
