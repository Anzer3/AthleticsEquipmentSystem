import { useEffect, useMemo, useState } from 'react'
import {
  LifebuoyIcon,
  PaperAirplaneIcon,
  ScaleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import FilterSidebar from '../components/FilterSidebar'
import InfoState from '../components/InfoState'
import ModuleContainer from '../components/ModuleContainer'

type Equipment = {
  uuid: string
  athlete_number: string
  category: string
  equipment_type: string
  status: string
  measured: boolean
}

type EquipmentPageProps = {
  onNavigateToDetail: (uuid: string) => void
}

export default function EquipmentPage({ onNavigateToDetail }: EquipmentPageProps) {
  const [items, setItems] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const equipmentResponse = await fetch('/api/equipment/', { credentials: 'include' })

        if (!equipmentResponse.ok) {
          throw new Error(`API error ${equipmentResponse.status}`)
        }

        setItems((await equipmentResponse.json()) as Equipment[])
      } catch {
        setError('Nepodařilo se načíst náčiní.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const sections = [
    {
      title: 'Změřeno',
      options: ['Ano', 'Ne'],
    },
    {
      title: 'Typ náčiní',
      options: Array.from(new Set(items.map((item) => item.equipment_type))).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    },
    {
      title: 'Kategorie',
      options: Array.from(new Set(items.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    },
    {
      title: 'Stav',
      options: Array.from(new Set(items.map((item) => item.status))).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    },
  ]

  const filteredItems = useMemo(() => {
    const typeFilter = filters['Typ náčiní'] ?? []
    const statusFilter = filters['Stav'] ?? []
    const categoryFilter = filters['Kategorie'] ?? []
    const measuredFilter = filters['Změřeno'] ?? []

    return items.filter((item) => {
      const bySearch = item.athlete_number.toLowerCase().includes(search.toLowerCase())
      const measuredText = item.measured ? 'Ano' : 'Ne'
      const byType = typeFilter.length === 0 || typeFilter.includes(item.equipment_type)
      const byStatus = statusFilter.length === 0 || statusFilter.includes(item.status)
      const byCategory = categoryFilter.length === 0 || categoryFilter.includes(item.category)
      const byMeasured = measuredFilter.length === 0 || measuredFilter.includes(measuredText)

      return bySearch && byType && byStatus && byCategory && byMeasured
    })
  }, [filters, items, search])

  const statusStats = useMemo(() => {
    const countByStatus = new Map<string, number>()
    for (const item of items) {
      countByStatus.set(item.status, (countByStatus.get(item.status) ?? 0) + 1)
    }

    const trackedStatuses = ['Dostupné', 'Na sektoru', 'Neschváleno', 'Navráceno']
    return trackedStatuses.map((statusName) => ({
      name: statusName,
      count: countByStatus.get(statusName) ?? 0,
    }))
  }, [items])

  const getTypeIcon = (equipmentType: string) => {
    const normalized = equipmentType.toLowerCase()

    if (normalized.includes('oštěp') || normalized.includes('ostep')) {
      return PaperAirplaneIcon
    }

    if (normalized.includes('koule')) {
      return ScaleIcon
    }

    if (normalized.includes('disk')) {
      return LifebuoyIcon
    }

    return Squares2X2Icon
  }

  const handleToggleOption = (sectionTitle: string, option: string) => {
    setFilters((previous) => {
      const selectedValues = previous[sectionTitle] ?? []
      const nextValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option]

      return {
        ...previous,
        [sectionTitle]: nextValues,
      }
    })
  }

  return (
    <div className="w-full max-w-[1400px] grid gap-4 xl:grid-cols-[18rem_1fr]">
      <FilterSidebar
        sections={sections}
        selectedValues={filters}
        onToggleOption={handleToggleOption}
        onClearAll={() => setFilters({})}
      />

      <ModuleContainer
        title="Náčiní"
        subtitle=""
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-[var(--light_red)] bg-red-50 p-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">Celkem náčiní</h2>
            <p className="mt-1 text-2xl font-black text-[var(--dark-red-btn)]">{items.length}</p>
          </article>

          {statusStats.map((status) => (
            <article key={status.name} className="rounded-xl border border-[var(--line-soft)] bg-white p-3 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">{status.name}</h2>
              <p className="mt-1 text-2xl font-black text-gray-900">{status.count}</p>
            </article>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hledat podle čísla atleta"
            className="w-full rounded-xl border-2 border-[var(--dark-red-btn)]/35 bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm outline-none placeholder:text-gray-500 focus:border-[var(--dark-red-btn)] focus:ring-4 focus:ring-[var(--light_red)] md:max-w-md"
          />
        </div>

        {loading ? <InfoState text="Načítám seznam náčiní..." /> : null}
        {error ? <InfoState text={error} variant="error" /> : null}

        {!loading && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <button
                key={item.uuid}
                type="button"
                onClick={() => onNavigateToDetail(item.uuid)}
                className="rounded-2xl border border-[var(--line-soft)] bg-gradient-to-b from-white to-gray-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--dark-red-btn)] hover:shadow-md"
              >
                {(() => {
                  const Icon = getTypeIcon(item.equipment_type)
                  return (
                    <div className="mb-3 inline-flex rounded-xl bg-red-100 p-2.5 text-[var(--dark-red-btn)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  )
                })()}

                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-gray-900">Číslo atleta: {item.athlete_number}</h2>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      item.measured
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.measured ? 'Změřeno' : 'Čeká na měření'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <p><span className="font-bold text-gray-700">Typ:</span> {item.equipment_type}</p>
                  <p><span className="font-bold text-gray-700">Kategorie:</span> {item.category}</p>
                  <p><span className="font-bold text-gray-700">Aktuální stav:</span> {item.status}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredItems.length === 0 ? (
          <InfoState text="Filtrům neodpovídá žádné náčiní." />
        ) : null}
      </ModuleContainer>
    </div>
  )
}
