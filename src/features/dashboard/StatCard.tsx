/**
 * Card de estatística para o Dashboard
 */

interface StatCardProps {
    title: string
    value: number | string
    icon: React.ReactNode
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
    subtitle?: string
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
}

export function StatCard({ title, value, icon, color = 'blue', subtitle }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

/**
 * Skeleton do StatCard
 */
export function StatCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
        </div>
    )
}
