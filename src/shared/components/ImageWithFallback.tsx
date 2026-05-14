import type { ImgHTMLAttributes } from 'react'
import { useState } from 'react'

import { cn } from '@/shared/lib/cn'

type ImageWithFallbackProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'alt' | 'src'
> & {
  alt: string
  fallbackText?: string
  src: string
}

export function ImageWithFallback({
  alt,
  className,
  draggable = false,
  fallbackText = '이미지를 불러올 수 없습니다.',
  src,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        aria-label={alt}
        className={cn(
          'flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-bold text-slate-500',
          className,
        )}
        role="img"
      >
        {fallbackText}
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      draggable={draggable}
      onError={() => setHasError(true)}
      src={src}
      {...props}
    />
  )
}
