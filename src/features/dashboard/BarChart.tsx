/**
 * Componente de Gráfico de Barras
 * Gráfico de barras simples e responsivo
 */

interface BarChartData {
    label: string
    value: number
    color: string
}

interface BarChartProps {
    data: BarChartData[]
}

export function BarChart({ data }: BarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Sem dados para exibir
            </div>
        )
    }

    const maxValue = Math.max(...data.map(item => item.value), 1)

    return (
        <div className="space-y-3">
            {data.map((item, index) => {
                const percentage = (item.value / maxValue) * 100

                return (
                    <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {item.label}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {item.value}
                            </span>
                        </div>
                        <div className="relative w-full h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <div
                                className="absolute left-0 top-0 h-full rounded-lg transition-all duration-500 ease-out"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: item.color,
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
