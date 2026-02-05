/**
 * Componente de Gráfico de Pizza com ApexCharts
 */

import { useMemo } from 'react'
import Chart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'
import { useThemeStore } from '@/lib/theme'

interface PieChartData {
    label: string
    value: number
    color: string
}

interface ApexPieChartProps {
    data: PieChartData[]
}

export function ApexPieChart({ data }: ApexPieChartProps) {
    const theme = useThemeStore((state) => state.mode)
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    const chartOptions: ApexOptions = useMemo(() => ({
        chart: {
            type: 'donut',
            background: 'transparent',
            fontFamily: 'inherit',
        },
        labels: data.map(item => item.label),
        colors: data.map(item => item.color),
        legend: {
            position: 'bottom',
            labels: {
                colors: isDark ? '#D1D5DB' : '#374151',
            },
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '14px',
                fontWeight: 600,
                colors: ['#fff'],
            },
            dropShadow: {
                enabled: false,
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: isDark ? '#D1D5DB' : '#374151',
                        },
                        value: {
                            show: true,
                            fontSize: '24px',
                            fontWeight: 700,
                            color: isDark ? '#F9FAFB' : '#111827',
                            formatter: (val) => val.toString(),
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: isDark ? '#9CA3AF' : '#6B7280',
                            formatter: (w) => {
                                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                                return total.toString()
                            },
                        },
                    },
                },
            },
        },
        stroke: {
            show: false,
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => val.toString(),
            },
        },
    }), [data, isDark])

    const series = useMemo(() => data.map(item => item.value), [data])

    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Sem dados para exibir
            </div>
        )
    }

    return (
        <div className="w-full">
            <Chart
                options={chartOptions}
                series={series}
                type="donut"
                height={320}
            />
        </div>
    )
}
