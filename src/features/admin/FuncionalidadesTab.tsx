import { useAdminFeatureFlags, useUpdateFlagDefault } from '@/features/featureFlags'
import type { AdminFeatureFlag, FeatureFlagChave } from '@/features/featureFlags'

const FLAG_ICONS: Record<FeatureFlagChave, string> = {
    financeiro: '🏦',
    certificados: '📜',
    push_notifications: '🔔',
    medicamentos: '💊',
    assistente: '🤖',
    gestao: '📊',
    ancestrais: '🧬',
}

export function FuncionalidadesTab() {
    const { data: flags, isLoading } = useAdminFeatureFlags()
    const updateDefault = useUpdateFlagDefault()

    const handleToggle = (flag: AdminFeatureFlag) => {
        updateDefault.mutate({
            chave: flag.chave,
            habilitado_por_padrao: !flag.habilitado_por_padrao,
        })
    }

    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Funcionalidades</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Controle quais módulos estão disponíveis por padrão. Alterar o padrão não afeta usuários com override individual.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700 shadow-sm">
                {(flags ?? []).map((flag) => (
                    <div key={flag.chave} className="flex items-center gap-4 px-4 py-4">
                        <span className="text-2xl">{FLAG_ICONS[flag.chave] ?? '⚙️'}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{flag.nome}</p>
                            {flag.descricao && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{flag.descricao}</p>
                            )}
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                flag.habilitado_por_padrao
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                                {flag.habilitado_por_padrao ? 'Ativado por padrão' : 'Desativado por padrão'}
                            </span>
                        </div>
                        <button
                            onClick={() => handleToggle(flag)}
                            disabled={updateDefault.isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                flag.habilitado_por_padrao ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                            } disabled:opacity-50`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    flag.habilitado_por_padrao ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
