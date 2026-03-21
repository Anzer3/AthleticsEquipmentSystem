type StatDetail = {
  label: string
  count: number
}

type StatTileProps = {
  title: string
  value: number
  highlighted?: boolean
  details?: StatDetail[]
  showDetails?: boolean
}

export default function StatTile({ title, value, highlighted = false, details, showDetails = false }: StatTileProps) {
  return (
    <article
      className={`relative min-w-0 rounded-xl px-3 py-3 shadow-md transition-all duration-300 ${
        highlighted
          ? 'border-2 border-[var(--dark-red-btn)] bg-gradient-to-br from-sky-50 to-white'
          : 'border border-gray-200 bg-white hover:border-[var(--light_red)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="truncate text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h2>
      </div>
      <p className={`mt-1 text-2xl font-black md:text-3xl ${highlighted ? 'text-[var(--dark-red-btn)]' : 'text-gray-800'}`}>
        {value}
      </p>

      {showDetails && details && details.length > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-2">
          <ul className="space-y-1">
            {details.map((detail) => (
              <li key={detail.label} className="flex justify-between text-xs text-gray-600">
                <span className="font-medium">{detail.label}</span>
                <span className="font-bold text-gray-900">{detail.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
