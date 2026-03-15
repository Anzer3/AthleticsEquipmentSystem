import { useEffect, useMemo, useState } from 'react'
import InfoState from '../components/InfoState'
import ModuleContainer from '../components/ModuleContainer'
import { formatValue } from '../utils/presentation'

type EventItem = {
  uuid: string
  name: string
  start_time: string
  end_time: string
}

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/events/', { credentials: 'include' })
        if (!response.ok) {
          throw new Error(`API error ${response.status}`)
        }

        setItems((await response.json()) as EventItem[])
      } catch {
        setError('Nepodařilo se načíst soutěže.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  )

  return (
    <ModuleContainer title="Soutěže" subtitle="Přehled soutěží včetně časového harmonogramu.">
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Hledat soutěž"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--dark-red-btn)] focus:ring-2 focus:ring-[var(--light_red)] md:max-w-xs"
        />
      </div>

      {loading ? <InfoState text="Načítám soutěže..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.uuid} className="rounded-2xl border border-[var(--line-soft)] bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">{item.name}</h2>
              <p className="mt-2 text-sm text-gray-600">Start: {formatValue(item.start_time)}</p>
              <p className="text-sm text-gray-600">Konec: {formatValue(item.end_time)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? <InfoState text="Nebyly nalezeny žádné soutěže." /> : null}
    </ModuleContainer>
  )
}
