/**
 * Componente Chip
 * Badge/chip clicável para filtros
 */

interface ChipProps {
    label: string
    active?: boolean
    onClick?: () => void
    icon?: React.ReactNode
}

export function Chip({ label, active = false, onClick, icon }: ChipProps) {
    return (
        <button
            onClick={onClick}
            className={`chip whitespace-nowrap ${active ? 'chip-active' : 'chip-inactive'
                }`}
        >
            {icon && <span className="mr-1">{icon}</span>}
            {label}
        </button>
    )
}

interface ChipGroupProps {
    children: React.ReactNode
}

export function ChipGroup({ children }: ChipGroupProps) {
    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
            {children}
        </div>
    )
}
