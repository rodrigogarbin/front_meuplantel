/**
 * Componente de Gráfico de Linhas com ApexCharts
 */

import { useMemo } from 'react'
import Chart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'
import { useThemeStore } from '@/lib/theme'

interface LineChartSerie {
    label: string
    color: string
    data: number[]
}

interface ApexLineChartProps {
    labels: string[]
    series: LineChartSerie[]
}

export function ApexLineChart({ labels, series }: ApexLineChartProps) {
    const theme = useThemeStore((state) => state.mode)
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    const chartOptions: ApexOptions = useMemo(() => ({
        chart: {
            type: 'line',
            background: 'transparent',
            fontFamily: 'inherit',
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        colors: series.map(s => s.color),
        xaxis: {
            categories: labels,
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '12px',
                },
            },
            axisBorder: {
                show: true,
                color: isDark ? '#374151' : '#E5E7EB',
            },
            axisTicks: {
                show: true,
                color: isDark ? '#374151' : '#E5E7EB',
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '12px',
                },
                formatter: (val) => Math.round(val).toString(),
            },
        },
        grid: {
            borderColor: isDark ? '#374151' : '#E5E7EB',
            strokeDashArray: 4,
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            labels: {
                colors: isDark ? '#D1D5DB' : '#374151',
            },
        },
        markers: {
            size: 5,
            hover: {
                size: 7,
            },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => val.toString(),
            },
        },
        dataLabels: {
            enabled: false,
        },
    }), [labels, series, isDark])

    const chartSeries = useMemo(() =>
        series.map(s => ({
            name: s.label,
            data: s.data,
        })),
    [series])

    if (!labels || labels.length === 0 || !series || series.length === 0) {
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
                series={chartSeries}
                type="line"
                height={320}
            />
        </div>
    )
}
