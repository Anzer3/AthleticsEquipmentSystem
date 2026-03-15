import type { ReactNode } from 'react'

type ModuleContainerProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function ModuleContainer({ title, subtitle, children }: ModuleContainerProps) {
  return (
    <section className="w-full max-w-[1400px] overflow-hidden rounded-2xl border border-[var(--light_red)] bg-[var(--surface)] shadow-sm">
      <header className="border-b border-[var(--line-soft)] bg-gradient-to-r from-red-50 via-white to-red-50 px-5 py-4 md:px-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">{subtitle}</p> : null}
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  )
}
