import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/cn'

type CardProps = PropsWithChildren<{
  className?: string
  as?: 'article' | 'div' | 'section'
}>

export function Card({ as: Component = 'section', children, className }: CardProps) {
  return (
    <Component
      className={cn(
        'min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </Component>
  )
}
