import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/cn'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'info'

type BadgeProps = PropsWithChildren<{
  className?: string
  tone?: BadgeTone
}>

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-city-100 text-city-700',
  warning: 'bg-warning-50 text-warning-600',
  info: 'bg-rail-50 text-rail-500',
}

export function Badge({ children, className, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
