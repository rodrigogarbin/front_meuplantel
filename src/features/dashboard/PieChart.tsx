/**
 * Gráfico de pizza simples usando SVG
 */

interface PieChartProps {
    data: Array<{
        label: string
        value: number
        color: string
    }>
    size?: number
}

export function PieChart({ data, size = 120 }: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0)

    if (total === 0) {
        return (
            <div
                className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full"
                style={{ width: size, height: size }}
            >
                <span className="text-gray-400 dark:text-gray-500 text-xs">Sem dados</span>
            </div>
        )
    }

    // Calcula os segmentos do gráfico
    let currentAngle = -90 // Começa do topo
    const segments = data.map((item) => {
        const angle = (item.value / total) * 360
        const startAngle = currentAngle
        currentAngle += angle
        return {
            ...item,
            startAngle,
            endAngle: currentAngle,
            percentage: ((item.value / total) * 100).toFixed(0),
        }
    })

    const radius = size / 2
    const center = radius

    // Função para calcular ponto no círculo
    const getPoint = (angle: number, r: number) => {
        const radians = (angle * Math.PI) / 180
        return {
            x: center + r * Math.cos(radians),
            y: center + r * Math.sin(radians),
        }
    }

    // Função para criar path de arco
    const createArc = (startAngle: number, endAngle: number, r: number) => {
        const start = getPoint(startAngle, r)
        const end = getPoint(endAngle, r)
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

        return `M ${center} ${center} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
    }

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} className="transform -rotate-0">
                {segments.map((segment, index) => (
                    <path
                        key={index}
                        d={createArc(segment.startAngle, segment.endAngle, radius - 2)}
                        fill={segment.color}
                        className="transition-opacity hover:opacity-80"
                    />
                ))}
                {/* Centro branco para criar efeito de donut */}
                <circle cx={center} cy={center} r={radius * 0.5} className="fill-white dark:fill-gray-800" />
            </svg>

            {/* Legenda */}
            <div className="flex flex-col gap-1">
                {segments.map((segment, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-gray-600 dark:text-gray-400">
                            {segment.label}: {segment.value} ({segment.percentage}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
