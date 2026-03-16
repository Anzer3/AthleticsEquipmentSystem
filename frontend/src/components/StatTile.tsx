type StatTileProps = {
  title: string
  value: number
  highlighted?: boolean
}

export default function StatTile({ title, value, highlighted = false }: StatTileProps) {
  return (
    <article
      className={`min-w-0 rounded-lg px-2 py-2 shadow-sm md:rounded-xl md:px-3 ${
        highlighted
          ? 'border border-[var(--light_red)] bg-red-50'
          : 'border border-[var(--line-soft)] bg-white'
      }`}
    >
      <h2 className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:text-xs">{title}</h2>
      <p className={`mt-0.5 text-lg font-black sm:text-xl ${highlighted ? 'text-[var(--dark-red-btn)]' : 'text-gray-900'}`}>
        {value}
      </p>
    </article>
  )
}
