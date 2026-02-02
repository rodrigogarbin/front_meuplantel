import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'

export function ImpersonationBanner() {
    const navigate = useNavigate()
    const { user, isImpersonating, stopImpersonate } = useAuthStore()

    if (!isImpersonating) return null

    const handleStop = async () => {
        await stopImpersonate()
        navigate('/admin')
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm safe-top">
            <span className="font-medium truncate">
                Você está como <strong>{user?.nome}</strong>
            </span>
            <button
                onClick={handleStop}
                className="flex-shrink-0 ml-3 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-medium transition-colors"
            >
                Voltar para admin
            </button>
        </div>
    )
}
