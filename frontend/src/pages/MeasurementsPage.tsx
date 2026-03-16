import { useEffect, useMemo, useState } from 'react'
import InfoState from '../components/InfoState'
import ModuleContainer from '../components/ModuleContainer'
import { formatValue } from '../utils/presentation'

type MeasurementItem = {
  uuid: string
  measured_equipment: string
  measured_at: string
  measured_property: string
}

type MeasurementsPageProps = {
  onNavigateToDetail: (uuid: string) => void
}

export default function MeasurementsPage({ onNavigateToDetail }: MeasurementsPageProps) {
  const [items, setItems] = useState<MeasurementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/measurements/', { credentials: 'include' })
        if (!response.ok) {
          throw new Error(`API error ${response.status}`)
        }

        setItems((await response.json()) as MeasurementItem[])
      } catch {
        setError('Nepodařilo se načíst záznamy měření.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()),
    [items],
  )

  return (
    <ModuleContainer title="Měření" subtitle="Kliknutím otevřete detail kompletního měření.">
      {loading ? <InfoState text="Načítám záznamy měření..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <button
              key={item.uuid}
              type="button"
              onClick={() => onNavigateToDetail(item.uuid)}
              className="grid w-full gap-2 rounded-2xl border border-[var(--line-soft)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--dark-red-btn)] hover:shadow-md md:grid-cols-3"
            >
              <div>
                <h2 className="text-sm font-bold text-gray-500">Měřené náčiní</h2>
                <p className="text-base font-black text-gray-900">{formatValue(item.measured_equipment)}</p>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-500">Čas změření</h2>
                <p className="text-base font-black text-gray-900">{formatValue(item.measured_at)}</p>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-500">Měřená vlastnost</h2>
                <p className="text-base font-black text-gray-900">{formatValue(item.measured_property)}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {!loading && !error && sortedItems.length === 0 ? <InfoState text="Žádné záznamy měření." /> : null}
    </ModuleContainer>
  )
}
