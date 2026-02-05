/**
 * Componente de Gráfico de Linhas
 * Gráfico de linhas simples e responsivo com múltiplas séries
 */

interface LineChartSerie {
    label: string
    color: string
    data: number[]
}

interface LineChartProps {
    labels: string[]
    series: LineChartSerie[]
}

export function LineChart({ labels, series }: LineChartProps) {
    if (!labels || labels.length === 0 || !series || series.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Sem dados para exibir
            </div>
        )
    }

    const width = 100 // porcentagem
    const height = 200 // pixels
    const padding = { top: 20, right: 10, bottom: 30, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Encontra o valor máximo entre todas as séries
    const allValues = series.flatMap(s => s.data)
    const maxValue = Math.max(...allValues, 1)
    const minValue = Math.min(...allValues, 0)

    // Calcula os pontos para cada série
    const getPoints = (data: number[]) => {
        return data.map((value, index) => {
            const x = (index / (data.length - 1)) * chartWidth
            const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight
            return { x, y }
        })
    }

    // Cria o path SVG para uma linha
    const createPath = (points: { x: number; y: number }[]) => {
        if (points.length === 0) return ''

        let path = `M ${points[0].x} ${points[0].y}`
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`
        }
        return path
    }

    // Linhas de grade horizontais
    const gridLines = 5
    const gridStep = chartHeight / gridLines

    return (
        <div className="w-full">
            {/* Legendas */}
            <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                {series.map((serie, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-4 h-0.5 rounded"
                            style={{ backgroundColor: serie.color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {serie.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Gráfico */}
            <div className="relative" style={{ height: `${height}px` }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="overflow-visible"
                >
                    <g transform={`translate(${padding.left}, ${padding.top})`}>
                        {/* Linhas de grade */}
                        {Array.from({ length: gridLines + 1 }).map((_, i) => {
                            const y = i * gridStep
                            const value = maxValue - ((maxValue - minValue) * i) / gridLines
                            return (
                                <g key={i}>
                                    <line
                                        x1="0"
                                        y1={y}
                                        x2={chartWidth}
                                        y2={y}
                                        stroke="currentColor"
                                        strokeWidth="0.2"
                                        className="text-gray-300 dark:text-gray-600"
                                        strokeDasharray="2,2"
                                    />
                                    <text
                                        x="-5"
                                        y={y}
                                        textAnchor="end"
                                        dominantBaseline="middle"
                                        className="text-[3px] fill-gray-500 dark:fill-gray-400"
                                    >
                                        {Math.round(value)}
                                    </text>
                                </g>
                            )
                        })}

                        {/* Linhas do gráfico */}
                        {series.map((serie, serieIndex) => {
                            const points = getPoints(serie.data)
                            const path = createPath(points)

                            return (
                                <g key={serieIndex}>
                                    {/* Linha */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={serie.color}
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="transition-all duration-300"
                                    />

                                    {/* Pontos */}
                                    {points.map((point, pointIndex) => (
                                        <circle
                                            key={pointIndex}
                                            cx={point.x}
                                            cy={point.y}
                                            r="1.5"
                                            fill={serie.color}
                                            className="transition-all duration-300 hover:r-2"
                                        />
                                    ))}
                                </g>
                            )
                        })}

                        {/* Eixo X - Labels */}
                        {labels.map((label, index) => {
                            const x = (index / (labels.length - 1)) * chartWidth
                            return (
                                <text
                                    key={index}
                                    x={x}
                                    y={chartHeight + 15}
                                    textAnchor="middle"
                                    className="text-[3.5px] fill-gray-600 dark:fill-gray-400 font-medium"
                                >
                                    {label}
                                </text>
                            )
                        })}
                    </g>
                </svg>
            </div>
        </div>
    )
}
