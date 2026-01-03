/**
 * Componentes de Skeleton para loading states
 */

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return <div className={`skeleton ${className}`} />
}

export function BirdCardSkeleton() {
    return (
        <div className="card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
    )
}

export function BirdListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <BirdCardSkeleton key={i} />
            ))}
        </div>
    )
}
