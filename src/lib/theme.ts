/**
 * Sistema de gerenciamento de tema (dark/light mode)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
    mode: ThemeMode
    setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'system', // Padrão: seguir preferência do sistema
            setMode: (mode) => set({ mode }),
        }),
        {
            name: 'meuplantel-theme',
        }
    )
)

/**
 * Aplica o tema ao documento
 */
export function applyTheme(mode: ThemeMode) {
    const root = document.documentElement

    if (mode === 'system') {
        // Detecta preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
    } else {
        root.classList.toggle('dark', mode === 'dark')
    }
}

/**
 * Hook para inicializar e sincronizar tema
 */
export function initTheme() {
    const mode = useThemeStore.getState().mode
    applyTheme(mode)

    // Observa mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
        const currentMode = useThemeStore.getState().mode
        if (currentMode === 'system') {
            applyTheme('system')
        }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Observa mudanças no store
    useThemeStore.subscribe((state) => {
        applyTheme(state.mode)
    })

    return () => {
        mediaQuery.removeEventListener('change', handleChange)
    }
}

/**
 * Retorna se o tema atual é dark
 */
export function isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark')
}
