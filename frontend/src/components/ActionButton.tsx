import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ActionButtonProps = {
  children: ReactNode
  variant?: 'solid' | 'tab-active' | 'tab'
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantClassName: Record<NonNullable<ActionButtonProps['variant']>, string> = {
  solid: 'rounded-md border border-white bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100',
  'tab-active': 'inline-flex items-center gap-2 rounded-t-md px-3 py-2 text-sm font-semibold transition-colors sm:text-base md:px-4 md:text-lg bg-[var(--dark-red-btn)] text-white',
  tab: 'inline-flex items-center gap-2 rounded-t-md px-3 py-2 text-sm font-semibold transition-colors sm:text-base md:px-4 md:text-lg text-white/90 hover:bg-[var(--dark-red-btn)]/70 hover:text-white',
}

export default function ActionButton({
  children,
  className = '',
  variant = 'solid',
  ...buttonProps
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`${variantClassName[variant]} ${className}`.trim()}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
