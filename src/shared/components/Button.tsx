import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
  }
>

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-city-700 text-white hover:bg-city-500 focus-visible:ring-city-500',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-city-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-city-500',
}

export function Button({
  children,
  className,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
