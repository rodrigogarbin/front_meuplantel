import { useAdminUsuarioFlags, useToggleUsuarioFlag } from '@/features/featureFlags'
import type { FeatureFlagChave, UsuarioFlag } from '@/features/featureFlags'

const FLAG_ICONS: Record<FeatureFlagChave, string> = {
    financeiro: '🏦',
    certificados: '📜',
    push_notifications: '🔔',
    medicamentos: '💊',
}

interface Props {
    userId: number
}

export function UsuarioFeatureFlagsPanel({ userId }: Props) {
    const { data: flags, isLoading } = useAdminUsuarioFlags(userId)
    const toggleFlag = useToggleUsuarioFlag()

    if (isLoading) {
        return <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse mx-4 mb-3" />
    }

    if (!flags) return null

    const handleToggle = (flag: UsuarioFlag) => {
        toggleFlag.mutate({
            userId,
            chave: flag.chave,
            habilitada: !flag.habilitada,
        })
    }

    const handleReset = (flag: UsuarioFlag) => {
        toggleFlag.mutate({
            userId,
            chave: flag.chave,
            reset: true,
        })
    }

    return (
        <div className="px-4 pb-3 pt-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Funcionalidades</p>
            <div className="flex flex-wrap gap-2">
                {flags.map((flag) => (
                    <div
                        key={flag.chave}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            flag.habilitada
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                                : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                        }`}
                    >
                        <span>{FLAG_ICONS[flag.chave]}</span>
                        <span>{flag.nome.replace('Módulo ', '').replace('Certificados de Genealogia', 'Certificados').replace('Notificações Push', 'Push')}</span>
                        {flag.override !== null && (
                            <span className="ml-0.5 text-xs opacity-60">(override)</span>
                        )}
                        <button
                            onClick={() => handleToggle(flag)}
                            disabled={toggleFlag.isPending}
                            className="ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                            title={flag.habilitada ? 'Desativar' : 'Ativar'}
                        >
                            <span className={`block w-4 h-4 text-center leading-4 ${flag.habilitada ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                {flag.habilitada ? '✓' : '○'}
                            </span>
                        </button>
                        {flag.override !== null && (
                            <button
                                onClick={() => handleReset(flag)}
                                disabled={toggleFlag.isPending}
                                className="text-xs opacity-50 hover:opacity-100 transition-opacity disabled:opacity-30"
                                title="Resetar para padrão"
                            >
                                ↺
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
