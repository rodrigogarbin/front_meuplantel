import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MyFlags, FeatureFlagChave } from './featureFlagsApi'

interface FeatureFlagsStore {
    flags: MyFlags | null
    setFlags: (f: MyFlags) => void
    isEnabled: (chave: FeatureFlagChave) => boolean
    reset: () => void
}

export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
    persist(
        (set, get) => ({
            flags: null,

            setFlags: (f) => set({ flags: f }),

            isEnabled: (chave) => {
                const { flags } = get()
                if (!flags) return false
                return flags[chave] ?? false
            },

            reset: () => set({ flags: null }),
        }),
        {
            name: 'meuplantel-feature-flags',
            partialize: (state) => ({ flags: state.flags }),
        }
    )
)
